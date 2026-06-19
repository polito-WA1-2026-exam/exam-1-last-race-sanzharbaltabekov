import { all } from "../db/database.js";

export async function getNetwork() {
  const [lines, stations, memberships, segments] = await Promise.all([
    all(`
      SELECT id, name, color
      FROM lines
      ORDER BY id
    `),

    all(`
      SELECT id, name, x, y
      FROM stations
      ORDER BY id
    `),

    all(`
      SELECT
        sl.station_id AS stationId,
        sl.line_id AS lineId,
        sl.position,
        s.name AS stationName,
        s.x,
        s.y,
        l.name AS lineName,
        l.color AS lineColor
      FROM station_lines sl
      JOIN stations s ON s.id = sl.station_id
      JOIN lines l ON l.id = sl.line_id
      ORDER BY sl.line_id, sl.position
    `),

    all(`
      SELECT
        sg.id,
        sg.line_id AS lineId,
        l.name AS lineName,
        l.color AS lineColor,
        a.id AS stationAId,
        a.name AS stationAName,
        b.id AS stationBId,
        b.name AS stationBName
      FROM segments sg
      JOIN lines l ON l.id = sg.line_id
      JOIN stations a ON a.id = sg.station_a_id
      JOIN stations b ON b.id = sg.station_b_id
      ORDER BY sg.id
    `),
  ]);

  const linesWithStations = lines.map((line) => ({
    ...line,

    stations: memberships
      .filter((membership) => membership.lineId === line.id)
      .map((membership) => ({
        id: membership.stationId,
        name: membership.stationName,
        x: membership.x,
        y: membership.y,
        position: membership.position,
      })),
  }));

  const stationsWithLines = stations.map((station) => {
    const stationMemberships = memberships.filter(
      (membership) => membership.stationId === station.id,
    );

    return {
      ...station,

      lines: stationMemberships.map((membership) => ({
        id: membership.lineId,
        name: membership.lineName,
        color: membership.lineColor,
      })),

      isInterchange: stationMemberships.length > 1,
    };
  });

  return {
    lines: linesWithStations,

    stations: stationsWithLines,

    segments: segments.map((segment) => ({
      id: segment.id,

      line: {
        id: segment.lineId,
        name: segment.lineName,
        color: segment.lineColor,
      },

      stationA: {
        id: segment.stationAId,
        name: segment.stationAName,
      },

      stationB: {
        id: segment.stationBId,
        name: segment.stationBName,
      },
    })),
  };
}