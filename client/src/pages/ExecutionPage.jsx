import {
  useState,
} from "react";

import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import * as API from "../api.js";

export default function ExecutionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { gameId: gameIdParameter } = useParams();

  const game = location.state?.game;
  const submission = location.state?.submission;

  const [revealedSteps, setRevealedSteps] =
    useState([]);

  const [currentCoins, setCurrentCoins] =
    useState(20);

  const [stepLoading, setStepLoading] =
    useState(false);

  const [stepError, setStepError] =
    useState("");

  const [completed, setCompleted] =
    useState(false);

  const [finalScore, setFinalScore] =
    useState(null);

  if (
    !game ||
    !submission ||
    Number(gameIdParameter) !== game.id
  ) {
    return (
      <Navigate
        to="/setup"
        replace
      />
    );
  }

  async function handleRevealNextStep() {
    if (stepLoading || completed) {
      return;
    }

    try {
      setStepLoading(true);
      setStepError("");

      const result =
        await API.revealNextStep(game.id);

      setRevealedSteps((currentSteps) => [
        ...currentSteps,
        result.step,
      ]);

      setCurrentCoins(result.step.coinsAfter);

      if (result.completed) {
        setCompleted(true);
        setFinalScore(result.finalScore);
      }
    } catch (err) {
      setStepError(err.message);
    } finally {
      setStepLoading(false);
    }
  }

  function handleViewResult() {
    navigate(
      `/game/${game.id}/result`,
      {
        replace: true,
        state: {
          game,
          result: {
            gameId: game.id,
            valid: true,
            status: "completed",
            finalScore,
          },
          revealedSteps,
        },
      },
    );
  }

  const nextStepNumber =
    revealedSteps.length + 1;

  return (
    <main className="page-container">
      <header className="page-header">
        <div>
          <p className="eyebrow">
            Execution phase
          </p>

          <h1>
            {game.startStation.name}
            {" → "}
            {game.destinationStation.name}
          </h1>

          <p>
            Reveal the journey one segment at a
            time.
          </p>
        </div>

        <div className="coins-card">
          <span>Current coins</span>
          <strong>{currentCoins}</strong>
        </div>
      </header>

      <section className="execution-progress">
        <div>
          <span>Revealed steps</span>

          <strong>
            {revealedSteps.length}
            {" / "}
            {submission.stepCount}
          </strong>
        </div>

        <progress
          max={submission.stepCount}
          value={revealedSteps.length}
        />
      </section>

      {stepError && (
        <div className="error-message">
          <p>{stepError}</p>
        </div>
      )}

      <div className="execution-layout">
        <section className="content-card">
          <h2>Journey history</h2>

          {revealedSteps.length === 0 ? (
            <div className="execution-empty-state">
              <p>
                Your route is ready.
              </p>

              <p>
                Reveal the first segment to begin
                the journey.
              </p>
            </div>
          ) : (
            <ol className="execution-step-list">
              {revealedSteps.map((step) => (
                <li
                  key={step.stepNumber}
                  className="execution-step"
                >
                  <div className="execution-step-number">
                    {step.stepNumber}
                  </div>

                  <div className="execution-step-content">
                    <h3>
                      {step.fromStation.name}
                      {" → "}
                      {step.toStation.name}
                    </h3>

                    <p>
                      {step.event.description}
                    </p>
                  </div>

                  <div
                    className={
                      step.event.effect > 0
                        ? "event-effect event-effect-positive"
                        : step.event.effect < 0
                          ? "event-effect event-effect-negative"
                          : "event-effect event-effect-neutral"
                    }
                  >
                    {step.event.effect > 0
                      ? "+"
                      : ""}
                    {step.event.effect}
                  </div>

                  <div className="step-coins">
                    <span>Coins after</span>
                    <strong>
                      {step.coinsAfter}
                    </strong>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <aside className="execution-sidebar">
          <section className="content-card">
            {!completed ? (
              <>
                <p className="eyebrow">
                  Next action
                </p>

                <h2>
                  Reveal step {nextStepNumber}
                </h2>

                <p>
                  The server will reveal the random
                  event assigned to the next segment.
                </p>

                <button
                  type="button"
                  className="primary-button full-width-button"
                  onClick={handleRevealNextStep}
                  disabled={stepLoading}
                >
                  {stepLoading
                    ? "Revealing..."
                    : "Reveal next event"}
                </button>
              </>
            ) : (
              <>
                <p className="eyebrow">
                  Journey completed
                </p>

                <h2>
                  Final score: {finalScore}
                </h2>

                <p>
                  You reached the assigned
                  destination.
                </p>

                <button
                  type="button"
                  className="primary-button full-width-button"
                  onClick={handleViewResult}
                >
                  View final result
                </button>
              </>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}