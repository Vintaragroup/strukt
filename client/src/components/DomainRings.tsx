import { memo } from "react";
import { useViewport } from "@xyflow/react";
import { DOMAIN_CONFIG, DomainType } from "../utils/domainLayout";

interface DomainRingsProps {
  centerX: number;
  centerY: number;
  radii?: number[];
  showLabels?: boolean;
  opacity?: number;
}

// Animation state for rotating gradients
let animationFrame = 0;

export const DomainRings = memo(({
  centerX,
  centerY,
  radii = [450, 700, 950],
  showLabels = true,
  opacity = 0.25,
}: DomainRingsProps) => {
  const domains: DomainType[] = ["business", "product", "tech", "data-ai", "operations"];
  const { x, y, zoom } = useViewport();

  return (
    <svg
      className="pointer-events-none"
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
      }}
    >
      <g transform={`translate(${x}, ${y}) scale(${zoom})`}>
      <defs>
        {/* Define enhanced gradients for each domain */}
        {domains.map((domain) => {
          const config = DOMAIN_CONFIG[domain];
          return (
            <radialGradient key={`gradient-${domain}`} id={`domain-gradient-${domain}`}>
              <stop offset="0%" stopColor={config.color} stopOpacity="0" />
              <stop offset="30%" stopColor={config.color} stopOpacity={opacity * 0.5} />
              <stop offset="60%" stopColor={config.color} stopOpacity={opacity * 0.4} />
              <stop offset="100%" stopColor={config.color} stopOpacity="0" />
            </radialGradient>
          );
        })}
        
        {/* Animated shimmer gradients */}
        {domains.map((domain) => {
          const config = DOMAIN_CONFIG[domain];
          return (
            <linearGradient key={`shimmer-${domain}`} id={`shimmer-gradient-${domain}`}>
              <stop offset="0%" stopColor={config.color} stopOpacity="0" />
              <stop offset="50%" stopColor={config.color} stopOpacity={opacity * 0.8} />
              <stop offset="100%" stopColor={config.color} stopOpacity="0" />
            </linearGradient>
          );
        })}

        {/* Dotted pattern for ring lines */}
        <pattern id="ring-dots" patternUnits="userSpaceOnUse" width="10" height="10">
          <circle cx="5" cy="5" r="1" fill="currentColor" fillOpacity="0.3" />
        </pattern>
      </defs>

      {/* Draw rings with pulsing animation */}
      {radii.map((radius, index) => (
        <g key={`ring-${index}`}>
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="url(#ring-dots)"
            strokeWidth="2"
            strokeDasharray="8 8"
            opacity={opacity * 0.6}
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="16"
              dur={`${8 + index * 2}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values={`${opacity * 0.6};${opacity * 0.9};${opacity * 0.6}`}
              dur={`${6 + index * 2}s`}
              repeatCount="indefinite"
            />
          </circle>
        </g>
      ))}

      {/* Draw domain sectors */}
      {domains.map((domain) => {
        const config = DOMAIN_CONFIG[domain];
        const sectorAngle = (2 * Math.PI) / domains.length;
        const startAngle = config.angle - sectorAngle / 2;
        const endAngle = config.angle + sectorAngle / 2;

        // Create sector path
        const outerRadius = radii[radii.length - 1] + 100;
        const innerRadius = radii[0] - 50;

        const pathData = createSectorPath(
          centerX,
          centerY,
          innerRadius,
          outerRadius,
          startAngle,
          endAngle
        );

        // Calculate label position (middle of first ring)
        const labelRadius = radii[0] + 80;
        const labelX = centerX + labelRadius * Math.cos(config.angle);
        const labelY = centerY + labelRadius * Math.sin(config.angle);

        return (
          <g key={`sector-${domain}`}>
            {/* Sector background with pulsing */}
            <path
              d={pathData}
              fill={`url(#domain-gradient-${domain})`}
              opacity={opacity * 0.7}
            >
              <animate
                attributeName="opacity"
                values={`${opacity * 0.7};${opacity * 1.0};${opacity * 0.7}`}
                dur="8s"
                repeatCount="indefinite"
              />
            </path>

            {/* Sector boundary lines with shimmer */}
            <line
              x1={centerX + innerRadius * Math.cos(startAngle)}
              y1={centerY + innerRadius * Math.sin(startAngle)}
              x2={centerX + outerRadius * Math.cos(startAngle)}
              y2={centerY + outerRadius * Math.sin(startAngle)}
              stroke={config.color}
              strokeWidth="2"
              strokeDasharray="4 4"
              opacity={opacity * 1.0}
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="8"
                dur="4s"
                repeatCount="indefinite"
              />
            </line>

            {/* Domain labels with glow effect */}
            {showLabels && (
              <g>
                {/* Label glow */}
                <rect
                  x={labelX - 52}
                  y={labelY - 14}
                  width="104"
                  height="28"
                  rx="14"
                  fill={config.color}
                  opacity={opacity * 0.3}
                  filter="blur(4px)"
                >
                  <animate
                    attributeName="opacity"
                    values={`${opacity * 0.3};${opacity * 0.5};${opacity * 0.3}`}
                    dur="4s"
                    repeatCount="indefinite"
                  />
                </rect>
                {/* Label background */}
                <rect
                  x={labelX - 50}
                  y={labelY - 12}
                  width="100"
                  height="24"
                  rx="12"
                  fill={config.color}
                  opacity={opacity * 2.0}
                >
                  <animate
                    attributeName="opacity"
                    values={`${opacity * 2.0};${opacity * 2.5};${opacity * 2.0}`}
                    dur="4s"
                    repeatCount="indefinite"
                  />
                </rect>
                {/* Label text */}
                <text
                  x={labelX}
                  y={labelY + 5}
                  textAnchor="middle"
                  fill={config.color}
                  fontSize="11"
                  fontWeight="600"
                  opacity={opacity * 4}
                  style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  {config.name}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Ring number labels */}
      {showLabels && radii.map((radius, index) => (
        <g key={`ring-label-${index}`}>
          <text
            x={centerX}
            y={centerY - radius - 10}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="10"
            fontWeight="500"
            opacity={opacity * 2}
          >
            Ring {index + 1}
          </text>
        </g>
      ))}
      </g>
    </svg>
  );
});

/**
 * Create an SVG path for a sector (pie slice)
 */
function createSectorPath(
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const x1 = centerX + innerRadius * Math.cos(startAngle);
  const y1 = centerY + innerRadius * Math.sin(startAngle);
  const x2 = centerX + outerRadius * Math.cos(startAngle);
  const y2 = centerY + outerRadius * Math.sin(startAngle);
  const x3 = centerX + outerRadius * Math.cos(endAngle);
  const y3 = centerY + outerRadius * Math.sin(endAngle);
  const x4 = centerX + innerRadius * Math.cos(endAngle);
  const y4 = centerY + innerRadius * Math.sin(endAngle);

  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  return `
    M ${x1} ${y1}
    L ${x2} ${y2}
    A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x3} ${y3}
    L ${x4} ${y4}
    A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1} ${y1}
    Z
  `;
}

DomainRings.displayName = "DomainRings";
