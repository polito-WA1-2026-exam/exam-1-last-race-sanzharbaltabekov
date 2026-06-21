import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import * as API from "../api.js";
import NetworkMap from "../components/NetworkMap.jsx";

function calculateRemainingSeconds(deadlineAt) {
  if (!deadlineAt) {
    return 0;
  }

  return Math.max(
    0,
    Math.ceil(
      (new Date(deadlineAt).getTime() - Date.now()) / 1000,
    ),
  );
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function PlanningPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { gameId: gameIdParameter } = useParams();

  const game = location.state?.game;
  const network = location.state?.network;

  const [selectedSegmentIds, setSelectedSegmentIds] =
    useState([]);

  const [remainingSeconds, setRemainingSeconds] =
    useState(() =>
      calculateRemainingSeconds(game?.deadlineAt),
    );

  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] =
    useState("");

  const submissionInProgressRef = useRef(false);
  const automaticSubmissionAttemptedRef = useRef(false);

  const segmentsById = useMemo(() => {
    if (!network) {
      return new Map();
    }

    return new Map(
      network.segments.map((segment) => [
        segment.id,
        segment,
      ]),
    );
  }, [network]);

  useEffect(() => {
    if (!game) {
      return undefined;
    }

    function updateTimer() {
      setRemainingSeconds(
        calculateRemainingSeconds(game.deadlineAt),
      );
    }

    updateTimer();

    const timerId = window.setInterval(
      updateTimer,
      1000,
    );

    return () => {
      window.clearInterval(timerId);
    };
  }, [game]);

  const submitCurrentRoute = useCallback(async () => {
    if (
      !game ||
      submissionInProgressRef.current
    ) {
      return;
    }

    submissionInProgressRef.current = true;

    try {
      setSubmitting(true);
      setSubmissionError("");

      const result = await API.submitRoute(
        game.id,
        selectedSegmentIds,
      );

      if (result.valid) {
        navigate(
          `/game/${game.id}/execution`,
          {
            replace: true,
            state: {
              game,
              network,
              submission: result,
            },
          },
        );
      } else {
        navigate(
          `/game/${game.id}/result`,
          {
            replace: true,
            state: {
              game,
              network,
              result,
            },
          },
        );
      }
    } catch (err) {
      setSubmissionError(err.message);
      submissionInProgressRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [
    game,
    navigate,
    network,
    selectedSegmentIds,
  ]);

  useEffect(() => {
    if (
      !game ||
      remainingSeconds > 0 ||
      automaticSubmissionAttemptedRef.current
    ) {
      return;
    }

    automaticSubmissionAttemptedRef.current = true;
    void submitCurrentRoute();
  }, [
    game,
    remainingSeconds,
    submitCurrentRoute,
  ]);

  if (
    !game ||
    !network ||
    Number(gameIdParameter) !== game.id
  ) {
    return (
      <Navigate
        to="/setup"
        replace
      />
    );
  }

  function handleSelectSegment(segmentId) {
    if (
      submitting ||
      remainingSeconds === 0 ||
      selectedSegmentIds.includes(segmentId)
    ) {
      return;
    }

    setSelectedSegmentIds((currentIds) => [
      ...currentIds,
      segmentId,
    ]);
  }

  function handleUndo() {
    setSelectedSegmentIds((currentIds) =>
      currentIds.slice(0, -1),
    );
  }

  function handleClear() {
    setSelectedSegmentIds([]);
  }

  const timerIsLow = remainingSeconds <= 15;

  return (
    <main className="page-container">
      <header className="page-header">
        <div>
          <p className="eyebrow">
            Planning phase
          </p>

          <h1>
            {game.startStation.name}
            {" → "}
            {game.destinationStation.name}
          </h1>

          <p>
            Select the network segments in the exact
            order in which you want to travel.
          </p>
        </div>

        <div
          className={
            timerIsLow
              ? "timer-card timer-card-danger"
              : "timer-card"
          }
        >
          <span>Time remaining</span>

          <strong>
            {formatTime(remainingSeconds)}
          </strong>
        </div>
      </header>

      {submissionError && (
        <div className="error-message">
          <p>{submissionError}</p>

          <button
            type="button"
            onClick={submitCurrentRoute}
            disabled={submitting}
          >
            Retry submission
          </button>
        </div>
      )}

      <section className="mission-card">
        <div>
          <span>Start</span>
          <strong>{game.startStation.name}</strong>
        </div>

        <div className="mission-arrow">
          →
        </div>

        <div>
          <span>Destination</span>
          <strong>
            {game.destinationStation.name}
          </strong>
        </div>
      </section>

      <div className="planning-layout">
        <section className="content-card">
          <h2>Station map</h2>

          <p>
            Connections are hidden during planning.
          </p>

          <NetworkMap
            network={network}
            showConnections={false}
            startStationId={game.startStation.id}
            destinationStationId={
              game.destinationStation.id
            }
          />
        </section>

        <aside className="planning-sidebar">
          <section className="content-card">
            <div className="section-heading">
              <div>
                <h2>Available segments</h2>

                <p>
                  Each segment may be selected only
                  once.
                </p>
              </div>

              <span className="segment-count">
                {network.segments.length}
              </span>
            </div>

            <div className="segment-list">
              {network.segments.map((segment) => {
                const selectedIndex =
                  selectedSegmentIds.indexOf(
                    segment.id,
                  );

                const selected =
                  selectedIndex !== -1;

                return (
                  <button
                    key={segment.id}
                    type="button"
                    className={
                      selected
                        ? "segment-button segment-button-selected"
                        : "segment-button"
                    }
                    onClick={() =>
                      handleSelectSegment(
                        segment.id,
                      )
                    }
                    disabled={
                      selected ||
                      submitting ||
                      remainingSeconds === 0
                    }
                  >
                    <span className="segment-order">
                      {selected
                        ? selectedIndex + 1
                        : ""}
                    </span>

                    <span className="segment-description">
                      <strong>
                        {segment.stationA.name}
                        {" — "}
                        {segment.stationB.name}
                      </strong>

                      <small>
                        {segment.line.name}
                      </small>
                    </span>

                    <span
                      className="segment-line-marker"
                      style={{
                        backgroundColor:
                          segment.line.color,
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </section>

          <section className="content-card">
            <div className="section-heading">
              <div>
                <h2>Your route</h2>

                <p>
                  Segments are travelled from top to
                  bottom.
                </p>
              </div>

              <span className="segment-count">
                {selectedSegmentIds.length}
              </span>
            </div>

            {selectedSegmentIds.length === 0 ? (
              <p className="empty-route">
                No segment selected yet.
              </p>
            ) : (
              <ol className="selected-route-list">
                {selectedSegmentIds.map(
                  (segmentId) => {
                    const segment =
                      segmentsById.get(segmentId);

                    return (
                      <li key={segmentId}>
                        <strong>
                          {segment.stationA.name}
                          {" — "}
                          {segment.stationB.name}
                        </strong>

                        <span>
                          {segment.line.name}
                        </span>
                      </li>
                    );
                  },
                )}
              </ol>
            )}

            <div className="route-controls">
              <button
                type="button"
                className="secondary-button"
                onClick={handleUndo}
                disabled={
                  selectedSegmentIds.length === 0 ||
                  submitting ||
                  remainingSeconds === 0
                }
              >
                Undo last
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={handleClear}
                disabled={
                  selectedSegmentIds.length === 0 ||
                  submitting ||
                  remainingSeconds === 0
                }
              >
                Clear route
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={submitCurrentRoute}
                disabled={
                  submitting ||
                  remainingSeconds === 0
                }
              >
                {submitting
                  ? "Submitting..."
                  : "Submit route"}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}