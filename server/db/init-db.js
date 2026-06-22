import { randomBytes, scryptSync } from "crypto";
import { exec, run, get, close } from "./database.js";

function hashPassword(password, salt) {
  return scryptSync(password, salt, 32).toString("hex");
}

async function initializeDatabase() {
  await exec(`
    PRAGMA foreign_keys = OFF;

    DROP TABLE IF EXISTS game_steps;
    DROP TABLE IF EXISTS games;
    DROP TABLE IF EXISTS events;
    DROP TABLE IF EXISTS segments;
    DROP TABLE IF EXISTS station_lines;
    DROP TABLE IF EXISTS stations;
    DROP TABLE IF EXISTS lines;
    DROP TABLE IF EXISTS users;

    PRAGMA foreign_keys = ON;

    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      salt TEXT NOT NULL,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL UNIQUE
    );

    CREATE TABLE stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      x INTEGER NOT NULL,
      y INTEGER NOT NULL
    );

    CREATE TABLE station_lines (
      station_id INTEGER NOT NULL,
      line_id INTEGER NOT NULL,
      position INTEGER NOT NULL,

      PRIMARY KEY (station_id, line_id),
      UNIQUE (line_id, position),

      FOREIGN KEY (station_id)
        REFERENCES stations(id)
        ON DELETE CASCADE,

      FOREIGN KEY (line_id)
        REFERENCES lines(id)
        ON DELETE CASCADE
    );

    CREATE TABLE segments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      line_id INTEGER NOT NULL,
      station_a_id INTEGER NOT NULL,
      station_b_id INTEGER NOT NULL,

      UNIQUE (station_a_id, station_b_id),

      CHECK (station_a_id < station_b_id),

      FOREIGN KEY (line_id)
        REFERENCES lines(id),

      FOREIGN KEY (station_a_id)
        REFERENCES stations(id),

      FOREIGN KEY (station_b_id)
        REFERENCES stations(id)
    );

    CREATE TABLE events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL UNIQUE,
      effect INTEGER NOT NULL,

      CHECK (effect >= -4 AND effect <= 4)
    );

    CREATE TABLE games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      start_station_id INTEGER NOT NULL,
      destination_station_id INTEGER NOT NULL,
      started_at TEXT NOT NULL,
      deadline_at TEXT,
      submitted_at TEXT,
      completed_at TEXT,
      status TEXT NOT NULL,
      initial_coins INTEGER NOT NULL DEFAULT 20,
      final_score INTEGER,
      is_valid INTEGER,

      CHECK (
        status IN (
          'planning',
          'executing',
          'completed'
        )
      ),

      CHECK (
        is_valid IS NULL
        OR is_valid IN (0, 1)
      ),

      CHECK (
        final_score IS NULL
        OR final_score >= 0
      ),

      FOREIGN KEY (user_id)
        REFERENCES users(id),

      FOREIGN KEY (start_station_id)
        REFERENCES stations(id),

      FOREIGN KEY (destination_station_id)
        REFERENCES stations(id)
    );

    CREATE TABLE game_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      step_number INTEGER NOT NULL,
      segment_id INTEGER NOT NULL,
      from_station_id INTEGER NOT NULL,
      to_station_id INTEGER NOT NULL,
      event_id INTEGER,
      event_effect INTEGER,
      coins_after INTEGER,
      revealed_at TEXT,

      UNIQUE (game_id, step_number),

      FOREIGN KEY (game_id)
        REFERENCES games(id)
        ON DELETE CASCADE,

      FOREIGN KEY (segment_id)
        REFERENCES segments(id),

      FOREIGN KEY (from_station_id)
        REFERENCES stations(id),

      FOREIGN KEY (to_station_id)
        REFERENCES stations(id),

      FOREIGN KEY (event_id)
        REFERENCES events(id)
    );
  `);

  await exec("BEGIN TRANSACTION");

  try {
    const users = [
      {
        id: 1,
        username: "sanzhar",
        name: "Sanzhar",
        password: "23012005",
      },
      {
        id: 2,
        username: "baubek",
        name: "Baubek",
        password: "04072005",
      },
      {
        id: 3,
        username: "akmal",
        name: "Akmal",
        password: "09112006",
      },
    ];

    for (const user of users) {
      const salt = randomBytes(16).toString("hex");
      const passwordHash = hashPassword(user.password, salt);

      await run(
        `INSERT INTO users
          (id, username, name, salt, password_hash)
         VALUES (?, ?, ?, ?, ?)`,
        [
          user.id,
          user.username,
          user.name,
          salt,
          passwordHash,
        ],
      );
    }

    const lines = [
      [1, "Linea 1", "#f0ad00"],
      [2, "Linea 2", "#0d6efd"],
      [3, "Linea 3", "#198754"],
      [4, "Linea 4", "#dc3545"],
    ];

    for (const line of lines) {
      await run(
        `INSERT INTO lines (id, name, color)
         VALUES (?, ?, ?)`,
        line,
      );
    }

    const stations = [
      [1, "Monte Grappa", 100, 180],
      [2, "Rivoli", 250, 180],
      [3, "Racconigi", 450, 180],
      [4, "Bernini", 550, 180],
      [5, "Principi D'acaja", 650, 180],

      [6, "Dora", 450, 40],
      [7, "Livorno", 450, 100],
      [8, "Politecnico", 450, 330],
      [9, "Stadio", 450, 500],

      [10, "San Vincenzo", 100, 330],
      [11, "Ruffini", 350, 280],
      [12, "Lingotto", 650, 330],

      [13, "Unione Sovietica", 350, 400],
      [14, "Boschetto", 350, 500],
    ];

    for (const station of stations) {
      await run(
        `INSERT INTO stations (id, name, x, y)
         VALUES (?, ?, ?, ?)`,
        station,
      );
    }

    const stationLines = [
      // Linea 1
      [1, 1, 1],
      [2, 1, 2],
      [3, 1, 3],
      [4, 1, 4],
      [5, 1, 5],

      // Linea 2
      [6, 2, 1],
      [7, 2, 2],
      [3, 2, 3],
      [8, 2, 4],
      [9, 2, 5],

      // Linea 3
      [10, 3, 1],
      [2, 3, 2],
      [11, 3, 3],
      [8, 3, 4],
      [12, 3, 5],

      // Linea 4
      [5, 4, 1],
      [11, 4, 2],
      [13, 4, 3],
      [14, 4, 4],
    ];

    for (const stationLine of stationLines) {
      await run(
        `INSERT INTO station_lines
          (station_id, line_id, position)
         VALUES (?, ?, ?)`,
        stationLine,
      );
    }

    const segments = [
      // Linea 1
      [1, 1, 1, 2],
      [2, 1, 2, 3],
      [3, 1, 3, 4],
      [4, 1, 4, 5],

      // Linea 2
      [5, 2, 6, 7],
      [6, 2, 3, 7],
      [7, 2, 3, 8],
      [8, 2, 8, 9],

      // Linea 3
      [9, 3, 2, 10],
      [10, 3, 2, 11],
      [11, 3, 8, 11],
      [12, 3, 8, 12],

      // Linea 4
      [13, 4, 5, 11],
      [14, 4, 11, 13],
      [15, 4, 13, 14],
    ];

    for (const segment of segments) {
      await run(
        `INSERT INTO segments
          (id, line_id, station_a_id, station_b_id)
         VALUES (?, ?, ?, ?)`,
        segment,
      );
    }

    const events = [
      [1, "Signal failure", -4],
      [2, "Ticket inspection", -3],
      [3, "Wrong platform", -2],
      [4, "Crowded carriage", -1],
      [5, "Quiet journey", 0],
      [6, "Smooth transfer", 0],
      [7, "Kind passenger", 1],
      [8, "Express shortcut", 2],
      [9, "Found coin pouch", 3],
      [10, "Lucky travel bonus", 4],
    ];

    for (const event of events) {
      await run(
        `INSERT INTO events
          (id, description, effect)
         VALUES (?, ?, ?)`,
        event,
      );
    }

    await run(
      `INSERT INTO games (
        id,
        user_id,
        start_station_id,
        destination_station_id,
        started_at,
        deadline_at,
        submitted_at,
        completed_at,
        status,
        initial_coins,
        final_score,
        is_valid
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1,
        1,
        1,
        5,
        "2026-06-10T10:00:00.000Z",
        "2026-06-10T10:01:30.000Z",
        "2026-06-10T10:01:00.000Z",
        "2026-06-10T10:02:00.000Z",
        "completed",
        20,
        22,
        1,
      ],
    );

    await run(
      `INSERT INTO games (
        id,
        user_id,
        start_station_id,
        destination_station_id,
        started_at,
        deadline_at,
        submitted_at,
        completed_at,
        status,
        initial_coins,
        final_score,
        is_valid
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        2,
        2,
        6,
        9,
        "2026-06-11T14:00:00.000Z",
        "2026-06-11T14:01:30.000Z",
        "2026-06-11T14:01:10.000Z",
        "2026-06-11T14:02:00.000Z",
        "completed",
        20,
        18,
        1,
      ],
    );

    const gameSteps = [
      // Sanzhar: Monte Grappa -> Principi D'acaja
      [1, 1, 1, 1, 1, 2, 7, 1, 21],
      [2, 1, 2, 2, 2, 3, 5, 0, 21],
      [3, 1, 3, 3, 3, 4, 8, 2, 23],
      [4, 1, 4, 4, 4, 5, 4, -1, 22],

      // Baubek: Parco Dora -> Stadio
      [5, 2, 1, 5, 6, 7, 5, 0, 20],
      [6, 2, 2, 6, 7, 3, 4, -1, 19],
      [7, 2, 3, 7, 3, 8, 7, 1, 20],
      [8, 2, 4, 8, 8, 9, 3, -2, 18],
    ];

    for (const step of gameSteps) {
      await run(
        `INSERT INTO game_steps (
          id,
          game_id,
          step_number,
          segment_id,
          from_station_id,
          to_station_id,
          event_id,
          event_effect,
          coins_after
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        step,
      );
    }

    await exec("COMMIT");

    const tableNames = [
      "users",
      "lines",
      "stations",
      "station_lines",
      "segments",
      "events",
      "games",
      "game_steps",
    ];

    console.log("Database initialized successfully.");

    for (const tableName of tableNames) {
      const result = await get(
        `SELECT COUNT(*) AS count FROM ${tableName}`,
      );

      console.log(`${tableName}: ${result.count}`);
    }
  } catch (err) {
    await exec("ROLLBACK");
    throw err;
  }
}

try {
  await initializeDatabase();
} catch (err) {
  console.error("Database initialization failed:", err);
  process.exitCode = 1;
} finally {
  await close();
}