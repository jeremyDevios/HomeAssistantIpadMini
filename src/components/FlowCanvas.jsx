import { COLORS } from '../lib/mockData'

// Node center positions in SVG coordinate space (viewBox 0 0 1000 540)
export const NODE_POS = {
  solar:       { x: 160, y: 130 },
  battery:     { x: 840, y: 130 },
  center:      { x: 500, y: 280 },
  consumption: { x: 160, y: 430 },
  grid:        { x: 840, y: 430 },
}

const NODE_RADIUS = 56

function bezierPath(from, to) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.sqrt(dx * dx + dy * dy)
  const ox = (dx / len) * NODE_RADIUS
  const oy = (dy / len) * NODE_RADIUS
  const fx = from.x + ox
  const fy = from.y + oy
  const tx = to.x - ox
  const ty = to.y - oy
  const cx1 = fx + (tx - fx) * 0.45
  const cy1 = fy
  const cx2 = fx + (tx - fx) * 0.55
  const cy2 = ty
  return `M ${fx},${fy} C ${cx1},${cy1} ${cx2},${cy2} ${tx},${ty}`
}

// Map wattage to particle travel duration in seconds (higher W = faster)
function wattsToDuration(watts) {
  if (!watts || watts <= 0) return null
  return Math.max(1.2, Math.min(5.0, 5.0 - (watts / 1100) * 3.8))
}

const PARTICLE_COUNT = 3

function FlowParticles({ flowId, color, duration }) {
  if (!duration) return null
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const begin = `${((duration / PARTICLE_COUNT) * i).toFixed(2)}s`
    return (
      <circle key={i} r="5" fill={color} filter={`url(#glow-${flowId})`}>
        <animateMotion
          dur={`${duration.toFixed(2)}s`}
          begin={begin}
          repeatCount="indefinite"
          calcMode="linear"
          rotate="auto"
        >
          <mpath href={`#path-${flowId}`} />
        </animateMotion>
      </circle>
    )
  })
}

export default function FlowCanvas({ data }) {
  // data shape: { solar, battery, consumption, grid } each with { watts }
  const FLOWS = [
    {
      id:    'solar-center',
      from:  'solar',
      to:    'center',
      color: COLORS.solar,
      watts: data?.solar?.watts ?? 0,
    },
    {
      id:    'center-battery',
      from:  'center',
      to:    'battery',
      color: COLORS.battery,
      watts: data?.battery?.watts ?? 0,
      // Reverse direction if discharging
      reverse: data?.battery?.charging === false,
    },
    {
      id:    'center-consumption',
      from:  'center',
      to:    'consumption',
      color: COLORS.consumption,
      watts: data?.consumption?.watts ?? 0,
    },
    {
      id:    'center-grid',
      from:  'center',
      to:    'grid',
      color: COLORS.grid,
      watts: data?.grid?.watts ?? 0,
      // Reverse direction if importing from grid
      reverse: data?.grid?.exporting === false,
    },
  ]

  return (
    <svg
      viewBox="0 0 1000 540"
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 w-full h-full pointer-events-none"
    >
      <defs>
        {/* Gradient for each path */}
        {FLOWS.map(({ id, color, from, to }) => (
          <linearGradient
            key={id}
            id={`grad-${id}`}
            gradientUnits="userSpaceOnUse"
            x1={NODE_POS[from].x} y1={NODE_POS[from].y}
            x2={NODE_POS[to].x}   y2={NODE_POS[to].y}
          >
            <stop offset="0%"   stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} stopOpacity="0.15" />
          </linearGradient>
        ))}

        {/* Glow filter for particles */}
        {FLOWS.map(({ id, color }) => (
          <filter key={id} id={`glow-${id}`} x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}
      </defs>

      {FLOWS.map(({ id, from, to, color, watts, reverse }) => {
        const pathD = reverse
          ? bezierPath(NODE_POS[to], NODE_POS[from])  // reverse travel direction
          : bezierPath(NODE_POS[from], NODE_POS[to])
        const duration = wattsToDuration(watts)

        return (
          <g key={id}>
            {/* Named path used by animateMotion mpath */}
            <path id={`path-${id}`} d={pathD} fill="none" stroke="none" />

            {/* Glow halo */}
            <path
              d={pathD}
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              opacity={watts > 0 ? 0.10 : 0.04}
            />
            {/* Visible line */}
            <path
              d={pathD}
              fill="none"
              stroke={`url(#grad-${id})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity={watts > 0 ? 1 : 0.2}
            />

            {/* Animated particles */}
            <FlowParticles flowId={id} color={color} duration={duration} />
          </g>
        )
      })}
    </svg>
  )
}
