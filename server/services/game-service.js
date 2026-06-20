import {
  completeInvalidGame,
  createPlanningGame,
  getEvents,
  getGameByIdForUser,
  getGameGraph,
  startGameExecution,
} from "../dao/game-dao.js";

const MINIMUM_DISTANCE = 3;
const PLANNING_DURATION_MS = 90_000;

/**
 * Builds an undirected adjacency list from the network segments.
 */
function buildAdjacencyList(stations, segments) {
  const adjacency = new Map();

  for (const station of stations) {
    adjacency.set(station.id, []);
  }

  for (const segment of segments) {
    adjacency.get(segment.stationAId).push(segment.stationBId);
    adjacency.get(segment.stationBId).push(segment.stationAId);
  }

  return adjacency;
}

/**
 * Calculates the shortest distance from one station to every reachable
 * station using breadth-first search.
 */
function calculateShortestDistances(startStationId, adjacency) {
  const distances = new Map([[startStationId, 0]]);
  const queue = [startStationId];
  let currentIndex = 0;

  while (currentIndex < queue.length) {
    const currentStationId = queue[currentIndex];
    currentIndex += 1;

    const currentDistance = distances.get(currentStationId);

    for (const neighbourId of adjacency.get(currentStationId) ?? []) {
      if (!distances.has(neighbourId)) {
        distances.set(neighbourId, currentDistance + 1);
        queue.push(neighbourId);
      }
    }
  }

  return distances;
}

/**
 * Finds all ordered start/destination pairs whose shortest distance
 * is at least three segments.
 */
function findEligibleStationPairs(stations, adjacency) {
  const eligiblePairs = [];

  for (const startStation of stations) {
    const distances = calculateShortestDistances(
      startStation.id,
      adjacency,
    );

    for (const destinationStation of stations) {
      const distance = distances.get(destinationStation.id);

      if (
        startStation.id !== destinationStation.id &&
        distance !== undefined &&
        distance >= MINIMUM_DISTANCE
      ) {
        eligiblePairs.push({
          startStation,
          destinationStation,
          distance,
        });
      }
    }
  }

  return eligiblePairs;
}

/**
 * Selects a valid random start and destination without writing anything
 * to the database.
 */
export async function generateGameAssignment() {
  const graph = await getGameGraph();

  const adjacency = buildAdjacencyList(
    graph.stations,
    graph.segments,
  );

  const eligiblePairs = findEligibleStationPairs(
    graph.stations,
    adjacency,
  );

  if (eligiblePairs.length === 0) {
    throw new Error(
      "The network has no station pair with a minimum distance of three segments.",
    );
  }

  const randomIndex = Math.floor(
    Math.random() * eligiblePairs.length,
  );

  return eligiblePairs[randomIndex];
}

/**
 * Generates and stores a new planning game for one authenticated user.
 */
export async function createNewGame(userId) {
  const assignment = await generateGameAssignment();

  const startedAtDate = new Date();
  const deadlineAtDate = new Date(
    startedAtDate.getTime() + PLANNING_DURATION_MS,
  );

  const game = await createPlanningGame({
    userId,
    startStationId: assignment.startStation.id,
    destinationStationId: assignment.destinationStation.id,
    startedAt: startedAtDate.toISOString(),
    deadlineAt: deadlineAtDate.toISOString(),
  });

  return {
    id: game.id,
    status: game.status,
    startStation: {
      id: game.startStationId,
      name: game.startStationName,
    },
    destinationStation: {
      id: game.destinationStationId,
      name: game.destinationStationName,
    },
    startedAt: game.startedAt,
    deadlineAt: game.deadlineAt,
  };
}

/**
 * Returns a set containing all interchange station IDs.
 *
 * A station is an interchange when it belongs to more than one line.
 */
function getInterchangeStationIds(stationLines) {
  const linesByStation = new Map();

  for (const association of stationLines) {
    if (!linesByStation.has(association.stationId)) {
      linesByStation.set(association.stationId, new Set());
    }

    linesByStation
      .get(association.stationId)
      .add(association.lineId);
  }

  const interchangeStationIds = new Set();

  for (const [stationId, lineIds] of linesByStation) {
    if (lineIds.size > 1) {
      interchangeStationIds.add(stationId);
    }
  }

  return interchangeStationIds;
}

/**
 * Validates an ordered list of segment IDs.
 *
 * The returned steps are oriented according to the direction travelled:
 * fromStationId -> toStationId.
 */
export function validateSubmittedRoute({
  game,
  segmentIds,
  graph,
}) {
  if (!Array.isArray(segmentIds)) {
    return {
      valid: false,
      reason: "segmentIds must be an array.",
      steps: [],
    };
  }

  if (segmentIds.length === 0) {
    return {
      valid: false,
      reason: "The submitted route is empty.",
      steps: [],
    };
  }

  if (
    segmentIds.some(
      (segmentId) =>
        !Number.isInteger(segmentId) || segmentId <= 0,
    )
  ) {
    return {
      valid: false,
      reason: "Every segment ID must be a positive integer.",
      steps: [],
    };
  }

  const uniqueSegmentIds = new Set(segmentIds);

  if (uniqueSegmentIds.size !== segmentIds.length) {
    return {
      valid: false,
      reason: "A segment cannot be selected more than once.",
      steps: [],
    };
  }

  const segmentsById = new Map(
    graph.segments.map((segment) => [segment.id, segment]),
  );

  const interchangeStationIds = getInterchangeStationIds(
    graph.stationLines,
  );

  const steps = [];
  let currentStationId = game.startStationId;
  let previousLineId = null;

  for (let index = 0; index < segmentIds.length; index += 1) {
    const segmentId = segmentIds[index];
    const segment = segmentsById.get(segmentId);

    if (!segment) {
      return {
        valid: false,
        reason: `Segment ${segmentId} does not exist.`,
        steps: [],
      };
    }

    let nextStationId;

    if (segment.stationAId === currentStationId) {
      nextStationId = segment.stationBId;
    } else if (segment.stationBId === currentStationId) {
      nextStationId = segment.stationAId;
    } else {
      return {
        valid: false,
        reason: `Segment ${segmentId} is not connected to the current station.`,
        steps: [],
      };
    }

    if (
      previousLineId !== null &&
      previousLineId !== segment.lineId &&
      !interchangeStationIds.has(currentStationId)
    ) {
      return {
        valid: false,
        reason:
          "The route changes line at a station that is not an interchange.",
        steps: [],
      };
    }

    steps.push({
      stepNumber: index + 1,
      segmentId: segment.id,
      lineId: segment.lineId,
      fromStationId: currentStationId,
      toStationId: nextStationId,
    });

    currentStationId = nextStationId;
    previousLineId = segment.lineId;
  }

  if (currentStationId !== game.destinationStationId) {
    return {
      valid: false,
      reason:
        "The submitted route does not end at the assigned destination.",
      steps: [],
    };
  }

  return {
    valid: true,
    reason: null,
    steps,
  };
}

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function chooseRandomEvent(events) {
  if (events.length === 0) {
    throw new Error("No journey events are available.");
  }

  const randomIndex = Math.floor(Math.random() * events.length);
  return events[randomIndex];
}

/**
 * Validates and submits a route for an authenticated user's game.
 */
export async function submitGameRoute({
  gameId,
  userId,
  segmentIds,
}) {
  if (!Number.isInteger(gameId) || gameId <= 0) {
    throw createHttpError(400, "Invalid game ID.");
  }

  const game = await getGameByIdForUser(gameId, userId);

  if (!game) {
    throw createHttpError(404, "Game not found.");
  }

  if (game.status !== "planning") {
    throw createHttpError(
      409,
      "This game is no longer in the planning phase.",
    );
  }

  const submittedAtDate = new Date();
  const submittedAt = submittedAtDate.toISOString();

  const deadlineAtDate = new Date(game.deadlineAt);

  if (submittedAtDate > deadlineAtDate) {
    const completed = await completeInvalidGame({
      gameId,
      userId,
      submittedAt,
      completedAt: submittedAt,
    });

    if (!completed) {
      throw createHttpError(
        409,
        "The game could not be completed.",
      );
    }

    return {
      gameId,
      valid: false,
      status: "completed",
      reason: "The planning time expired.",
      finalScore: 0,
    };
  }

  const graph = await getGameGraph();

  const validation = validateSubmittedRoute({
    game,
    segmentIds,
    graph,
  });

  if (!validation.valid) {
    const completed = await completeInvalidGame({
      gameId,
      userId,
      submittedAt,
      completedAt: submittedAt,
    });

    if (!completed) {
      throw createHttpError(
        409,
        "The game could not be completed.",
      );
    }

    return {
      gameId,
      valid: false,
      status: "completed",
      reason: validation.reason,
      finalScore: 0,
    };
  }

  const events = await getEvents();
  let currentCoins = game.initialCoins;

  const preparedSteps = validation.steps.map((step) => {
    const event = chooseRandomEvent(events);

    currentCoins += event.effect;

    return {
      ...step,
      eventId: event.id,
      eventEffect: event.effect,
      coinsAfter: currentCoins,
    };
  });

  await startGameExecution({
    gameId,
    userId,
    submittedAt,
    steps: preparedSteps,
  });

  return {
    gameId,
    valid: true,
    status: "executing",
    stepCount: preparedSteps.length,
  };
}