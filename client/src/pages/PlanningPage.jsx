import {
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";

export default function PlanningPage() {
  const location = useLocation();
  const game = location.state?.game;

  if (!game) {
    return (
      <Navigate
        to="/setup"
        replace
      />
    );
  }

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
            Game #{game.id} was created
            successfully.
          </p>
        </div>
      </header>

      <section className="content-card">
        <p>
          The timed route-selection interface
          will be added in the next step.
        </p>

        <Link to="/setup">
          Return to setup
        </Link>
      </section>
    </main>
  );
}