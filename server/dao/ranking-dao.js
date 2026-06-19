import { all } from "../db/database.js";

export async function getRanking() {
  return all(`
    SELECT
      u.id AS userId,
      u.username,
      u.name,
      MAX(g.final_score) AS bestScore
    FROM users u
    JOIN games g ON g.user_id = u.id
    WHERE g.status = 'completed'
      AND g.is_valid = 1
    GROUP BY u.id, u.username, u.name
    ORDER BY bestScore DESC, u.username ASC
  `);
}