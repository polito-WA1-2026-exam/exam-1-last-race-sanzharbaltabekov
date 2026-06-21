import {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import * as API from "../api.js";
import NetworkMap from "../components/NetworkMap.jsx";

export default function SetupPage() {
  const navigate = useNavigate();

  const [network, setNetwork] = useState(null);
  const [networkLoading, setNetworkLoading] =
    useState(true);

  const [networkError, setNetworkError] =
    useState("");

  const [gameLoading, setGameLoading] =
    useState(false);

  const [gameError, setGameError] =
    useState("");

  useEffect(() => {
    let active = true;

    async function loadNetwork() {
      try {
        const loadedNetwork =
          await API.getNetwork();

        if (active) {
          setNetwork(loadedNetwork);
        }
      } catch (err) {
        if (active) {
          setNetworkError(err.message);
        }
      } finally {
        if (active) {
          setNetworkLoading(false);
        }
      }
    }

    loadNetwork();

    return () => {
      active = false;
    };
  }, []);

  async function handleStartGame() {
    try {
      setGameLoading(true);
      setGameError("");

      const game = await API.createGame();

      navigate(
        `/game/${game.id}/planning`,
        {
          state: {
            game,
            network,
          },
        },
      );
    } catch (err) {
      setGameError(err.message);
    } finally {
      setGameLoading(false);
    }
  }

  return (
    <main className="page-container">
      <header className="page-header">
        <div>
          <p className="eyebrow">
            Game setup
          </p>

          <h1>
            Study the underground network
          </h1>

          <p>
            Memorize the stations, connections,
            lines, and interchange points before
            starting the timed planning phase.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartGame}
          disabled={
            gameLoading ||
            networkLoading ||
            !network
          }
        >
          {gameLoading
            ? "Creating game..."
            : "Start new game"}
        </button>
      </header>

      {networkError && (
        <p className="error-message">
          {networkError}
        </p>
      )}

      {gameError && (
        <p className="error-message">
          {gameError}
        </p>
      )}

      {networkLoading && (
        <section className="content-card">
          <p>Loading network...</p>
        </section>
      )}

      {network && (
        <>
          <section className="content-card">
            <NetworkMap network={network} />
          </section>

          <section className="network-summary">
            <article className="summary-card">
              <strong>
                {network.lines.length}
              </strong>
              <span>Metro lines</span>
            </article>

            <article className="summary-card">
              <strong>
                {network.stations.length}
              </strong>
              <span>Stations</span>
            </article>

            <article className="summary-card">
              <strong>
                {
                  network.stations.filter(
                    (station) =>
                      station.isInterchange,
                  ).length
                }
              </strong>
              <span>Interchanges</span>
            </article>

            <article className="summary-card">
              <strong>
                {network.segments.length}
              </strong>
              <span>Segments</span>
            </article>
          </section>
        </>
      )}
    </main>
  );
}