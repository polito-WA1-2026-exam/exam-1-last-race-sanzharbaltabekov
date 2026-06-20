import {
  all,
  exec,
  get,
  run,
} from "../db/database.js";

/**
 * Returns the network data needed by the server-side game logic.
 */
export async function getGameGraph() {
  const stations = await all(`
    SELECT id, name
    FROM stations
    ORDER BY id
  `);

  const segments = await all(`
    SELECT
      id,
      line_id AS lineId,
      station_a_id AS stationAId,
      station_b_id AS stationBId
    FROM segments
    ORDER BY id
  `);

  const stationLines = await all(`
    SELECT
      station_id AS stationId,
      line_id AS lineId
    FROM station_lines
    ORDER BY station_id, line_id
  `);

  return {
    stations,
    segments,
    stationLines,
  };
}

/**
 * Creates a game in the planning phase and returns its main data.
 */
export async function createPlanningGame({
  userId,
  startStationId,
  destinationStationId,
  startedAt,
  deadlineAt,
}) {
  const result = await run(
    `
      INSERT INTO games (
        user_id,
        start_station_id,
        destination_station_id,
        started_at,
        deadline_at,
        status,
        initial_coins
      )
      VALUES (?, ?, ?, ?, ?, 'planning', 20)
    `,
    [
      userId,
      startStationId,
      destinationStationId,
      startedAt,
      deadlineAt,
    ],
  );

  return get(
    `
      SELECT
        g.id,
        g.status,
        g.started_at AS startedAt,
        g.deadline_at AS deadlineAt,
        start_station.id AS startStationId,
        start_station.name AS startStationName,
        destination_station.id AS destinationStationId,
        destination_station.name AS destinationStationName
      FROM games g
      JOIN stations start_station
        ON start_station.id = g.start_station_id
      JOIN stations destination_station
        ON destination_station.id = g.destination_station_id
      WHERE g.id = ? AND g.user_id = ?
    `,
    [result.lastID, userId],
  );
}

/**
 * Returns one game only when it belongs to the specified user.
 */
export async function getGameByIdForUser(gameId, userId) {
  return get(
    `
      SELECT
        g.id,
        g.user_id AS userId,
        g.start_station_id AS startStationId,
        g.destination_station_id AS destinationStationId,
        g.started_at AS startedAt,
        g.deadline_at AS deadlineAt,
        g.submitted_at AS submittedAt,
        g.completed_at AS completedAt,
        g.status,
        g.initial_coins AS initialCoins,
        g.final_score AS finalScore,
        g.is_valid AS isValid
      FROM games g
      WHERE g.id = ? AND g.user_id = ?
    `,
    [gameId, userId],
  );
}

/**
 * Returns all possible random journey events.
 */
export async function getEvents() {
  return all(`
    SELECT
      id,
      description,
      effect
    FROM events
    ORDER BY id
  `);
}

/**
 * Completes an invalid or incomplete game immediately with score zero.
 *
 * The status condition prevents the same planning game from being
 * submitted more than once.
 */
export async function completeInvalidGame({
  gameId,
  userId,
  submittedAt,
  completedAt,
}) {
  const result = await run(
    `
      UPDATE games
      SET
        submitted_at = ?,
        completed_at = ?,
        status = 'completed',
        final_score = 0,
        is_valid = 0
      WHERE
        id = ?
        AND user_id = ?
        AND status = 'planning'
    `,
    [
      submittedAt,
      completedAt,
      gameId,
      userId,
    ],
  );

  return result.changes === 1;
}

/**
 * Stores all prepared steps and changes the game from planning to
 * executing inside one transaction.
 */
export async function startGameExecution({
  gameId,
  userId,
  submittedAt,
  steps,
}) {
  await exec("BEGIN TRANSACTION");

  try {
    const updateResult = await run(
      `
        UPDATE games
        SET
          submitted_at = ?,
          status = 'executing',
          is_valid = 1
        WHERE
          id = ?
          AND user_id = ?
          AND status = 'planning'
      `,
      [
        submittedAt,
        gameId,
        userId,
      ],
    );

    if (updateResult.changes !== 1) {
      throw new Error(
        "The game could not be moved to the execution phase.",
      );
    }

    for (const step of steps) {
      await run(
        `
          INSERT INTO game_steps (
            game_id,
            step_number,
            segment_id,
            from_station_id,
            to_station_id,
            event_id,
            event_effect,
            coins_after
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          gameId,
          step.stepNumber,
          step.segmentId,
          step.fromStationId,
          step.toStationId,
          step.eventId,
          step.eventEffect,
          step.coinsAfter,
        ],
      );
    }

    await exec("COMMIT");
  } catch (err) {
    await exec("ROLLBACK");
    throw err;
  }
}