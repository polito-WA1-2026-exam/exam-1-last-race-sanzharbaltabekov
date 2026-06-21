export default function InstructionsPage() {
  return (
    <main className="page-container">
      <section className="hero-section">
        <p className="eyebrow">
          Underground route-planning game
        </p>

        <h1>Last Race</h1>

        <p>
          Plan a valid route through the underground network
          before the 90-second timer expires.
        </p>
      </section>

      <section className="instructions-grid">
        <article>
          <h2>1. Study the network</h2>

          <p>
            Before starting, inspect the complete map and learn
            how stations and metro lines are connected.
          </p>
        </article>

        <article>
          <h2>2. Build your route</h2>

          <p>
            The server assigns a starting station and a
            destination. Select connected segments in the
            correct order.
          </p>
        </article>

        <article>
          <h2>3. Avoid invalid moves</h2>

          <p>
            A segment cannot be reused. Line changes are allowed
            only at interchange stations.
          </p>
        </article>

        <article>
          <h2>4. Face random events</h2>

          <p>
            Each travelled segment produces an event that may
            increase or decrease your starting total of 20 coins.
          </p>
        </article>
      </section>

      <section>
        <h2>Scoring</h2>

        <p>
          Reach the assigned destination with as many coins as
          possible. Invalid or incomplete routes score zero.
        </p>
      </section>
    </main>
  );
}