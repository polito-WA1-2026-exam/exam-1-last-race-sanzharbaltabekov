export default function NetworkMap({
  network,
  showConnections = true,
  startStationId = null,
  destinationStationId = null,
}) {
  const stationsById = new Map(
    network.stations.map((station) => [
      station.id,
      station,
    ]),
  );

  return (
    <div className="network-wrapper">
      <svg
        className="network-map"
        viewBox="0 0 760 560"
        role="img"
        aria-label="Underground network map"
      >
        {showConnections &&
          network.segments.map((segment) => {
            const stationA = stationsById.get(
              segment.stationA.id,
            );

            const stationB = stationsById.get(
              segment.stationB.id,
            );

            if (!stationA || !stationB) {
              return null;
            }

            return (
              <line
                key={segment.id}
                x1={stationA.x}
                y1={stationA.y}
                x2={stationB.x}
                y2={stationB.y}
                stroke={segment.line.color}
                strokeWidth="8"
                strokeLinecap="round"
              />
            );
          })}

        {network.stations.map((station) => {
          const isStart =
            station.id === startStationId;

          const isDestination =
            station.id === destinationStationId;

          return (
            <g
              key={station.id}
              transform={`translate(${station.x}, ${station.y})`}
            >
              {isStart && (
                <circle
                  r="17"
                  className="station-highlight station-highlight-start"
                />
              )}

              {isDestination && (
                <circle
                  r="17"
                  className="station-highlight station-highlight-destination"
                />
              )}

              <circle
                r={station.isInterchange ? 10 : 7}
                className={
                  station.isInterchange
                    ? "station-node interchange-node"
                    : "station-node"
                }
              />

              <text
                x="0"
                y="-16"
                textAnchor="middle"
                className="station-label"
              >
                {station.name}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="line-legend">
        {network.lines.map((line) => (
          <div
            key={line.id}
            className="legend-item"
          >
            <span
              className="legend-color"
              style={{
                backgroundColor: line.color,
              }}
            />

            <span>{line.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}