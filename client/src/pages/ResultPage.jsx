import {
  Link,
  Navigate,
  useLocation,
  useParams,
} from "react-router-dom";

export default function ResultPage() {
  const location = useLocation();
  const { gameId: gameIdParameter } = useParams();

  const game = location.state?.game;
  const result = location.state?.result;
  const revealedSteps =
    location.state?.revealedSteps ?? [];

  if (
    !game ||
    !result ||
    Number(gameIdParameter) !== game.id
  ) {
    return (
      <Navigate
        to="/setup"
        replace
      />
    );
  }

  return (
    <main className="page-container">
      <section
        className={
          result.valid
            ? "result-card result-card-success"
            : "result-card result-card-failure"
        }
      >
        <p className="eyebrow">
          Game completed
        </p>

        <h1>
          {result.valid
            ? "Destination reached"
            : "Route unsuccessful"}
        </h1>

        <div className="final-score">
          <span>Final score</span>

          <strong>
            {result.finalScore}
          </strong>

          <span>coins</span>
        </div>

        {result.valid ? (
          <p>
            You travelled from{" "}
            <strong>
              {game.startStation.name}
            </strong>{" "}
            to{" "}
            <strong>
              {game.destinationStation.name}
            </strong>{" "}
            in {revealedSteps.length} steps.
          </p>
        ) : (
          <p>
            {result.reason ||
              "The submitted route was invalid or incomplete."}
          </p>
        )}

        <div className="result-actions">
          <Link to="/setup">
            Play another game
          </Link>

          <Link to="/ranking">
            View ranking
          </Link>
        </div>
      </section>

      {result.valid &&
        revealedSteps.length > 0 && (
          <section className="content-card result-summary">
            <h2>Journey summary</h2>

            <ol className="result-step-list">
              {revealedSteps.map((step) => (
                <li key={step.stepNumber}>
                  <div>
                    <strong>
                      {step.fromStation.name}
                      {" → "}
                      {step.toStation.name}
                    </strong>

                    <span>
                      {step.event.description}
                    </span>
                  </div>

                  <div>
                    {step.event.effect > 0
                      ? "+"
                      : ""}
                    {step.event.effect} coins
                  </div>

                  <strong>
                    {step.coinsAfter}
                  </strong>
                </li>
              ))}
            </ol>
          </section>
        )}
    </main>
  );
}