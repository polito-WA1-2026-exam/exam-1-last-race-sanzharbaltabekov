import {
  useEffect,
  useState,
} from "react";

import * as API from "../api.js";
import useAuth from "../auth/useAuth.js";

export default function RankingPage() {
  const { user } = useAuth();

  const [ranking, setRanking] = useState([]);
  const [rankingLoading, setRankingLoading] =
    useState(true);

  const [rankingError, setRankingError] =
    useState("");

  useEffect(() => {
    let active = true;

    async function loadRanking() {
      try {
        const loadedRanking =
          await API.getRankings();

        if (active) {
          setRanking(loadedRanking);
        }
      } catch (err) {
        if (active) {
          setRankingError(err.message);
        }
      } finally {
        if (active) {
          setRankingLoading(false);
        }
      }
    }

    loadRanking();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="page-container">
      <header className="page-header">
        <div>
          <p className="eyebrow">
            Best results
          </p>

          <h1>General ranking</h1>

          <p>
            Only the highest successful score
            obtained by each player is shown.
          </p>
        </div>
      </header>

      {rankingLoading && (
        <section className="content-card">
          <p>Loading ranking...</p>
        </section>
      )}

      {rankingError && (
        <p className="error-message">
          {rankingError}
        </p>
      )}

      {!rankingLoading &&
        !rankingError &&
        ranking.length === 0 && (
          <section className="content-card">
            <p>
              No successful games have been
              completed yet.
            </p>
          </section>
        )}

      {ranking.length > 0 && (
        <section className="content-card">
          <table className="ranking-table">
            <thead>
              <tr>
                <th>Position</th>
                <th>Player</th>
                <th>Username</th>
                <th>Best score</th>
              </tr>
            </thead>

            <tbody>
              {ranking.map((entry, index) => (
                <tr
                  key={entry.userId}
                  className={
                    entry.userId === user.id
                      ? "current-user-row"
                      : ""
                  }
                >
                  <td>#{index + 1}</td>
                  <td>{entry.name}</td>
                  <td>{entry.username}</td>
                  <td>
                    <strong>
                      {entry.bestScore}
                    </strong>{" "}
                    coins
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}