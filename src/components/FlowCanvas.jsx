import { useEffect, useRef, useState } from 'react'
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
const PARTICLE_COUNT = 3

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

// Higher watts → shorter duration (ms) → faster particles
function wattsToDuration(watts) {
  if (!watts || watts <= 0) return null
  return Math.max(1200, Math.min(5000, 5000 - (watts / 1100) * 3800))
}

function buildFlows(data) {
  return [
    {
      id:      'solar-center',
      from:    'solar',
      to:      'center',
      color:   COLORS.solar,
      watts:   data?.solar?.watts ?? 0,
      reverse: false,
    },
    {
      id:      'center-battery',
      from:    'center',
      to:      'battery',
      color:   COLORS.battery,
      watts:   data?.battery?.watts ?? 0,
      reverse: data?.battery?.charging === false,
    },
    {
      id:      'center-consumption',
      from:    'center',
      to:      'consumption',
      color:   COLORS.consumption,
      watts:   data?.consumption?.watts ?? 0,
      reverse: false,
    },
    {
      id:      'center-grid',
      from:    'center',
      to:      'grid',
      color:   COLORS.grid,
      watts:   data?.grid?.watts ?? 0,
      reverse: data?.grid?.exporting === false,
    },
  ]
}

export default function FlowCanvas({ data }) {
  const flows = buildFlows(data)

  // Refs to invisible <path> elements used for getPointAtLength measurements
  const pathRefs  = useRef({})
  const progressRef = useRef({})
  const rafRef    = useRef(null)
  const [positions, setPositions] = useState({})

  useEffect(() => {
    let lastTime = null

    function tick(now) {
      if (!lastTime) lastTime = now
      const dt = now - lastTime
      lastTime = now

      const nextPositions = {}

      flows.forEach(({ id, watts }) => {
        const duration = wattsToDuration(watts)
        if (!duration) { nextPositions[id] = []; return }

        if (progressRef.current[id] === undefined) progressRef.current[id] = 0
        progressRef.current[id] = (progressRef.current[id] + dt / duration) % 1

        const pathEl = pathRefs.current[id]
        if (!pathEl) { nextPositions[id] = []; return }

        const totalLen = pathEl.getTotalLength()
        nextPositions[id] = Array.from({ length: PARTICLE_COUNT }, function(_, i) {
          var t = (progressRef.current[id] + i / PARTICLE_COUNT) % 1
          var pt = pathEl.getPointAtLength(t * totalLen)
          return { x: pt.x, y: pt.y }
        })
      })

      setPositions(nextPositions)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return function() { cancelAnimationFrame(rafRef.current) }
  }, [data])

  return (
    <svg
      viewBox="0 0 1000 540"
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 w-full h-full pointer-events-none"
    >
      <defs>
        {flows.map(function({ id, color, from, to }) {
          return (
            <linearGradient
              key={id}
              id={'grad-' + id}
              gradientUnits="userSpaceOnUse"
              x1={NODE_POS[from].x} y1={NODE_POS[from].y}
              x2={NODE_POS[to].x}   y2={NODE_POS[to].y}
            >
              <stop offset="0%"   stopColor={color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={color} stopOpacity="0.15" />
            </linearGradient>
          )
        })}

        {flows.map(function({ id }) {
          return (
            <filter key={id} id={'glow-' + id} x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )
        })}
      </defs>

      {flows.map(function({ id, from, to, color, watts, reverse }) {
        const pathD = reverse
          ? bezierPath(NODE_POS[to], NODE_POS[from])
          : bezierPath(NODE_POS[from], NODE_POS[to])
        const pts = positions[id] || []
        const active = watts > 0

        return (
          <g key={id}>
            {/* Hidden path used only for getPointAtLength measurements */}
            <path
              ref={function(el) { pathRefs.current[id] = el }}
              d={pathD}
              fill="none"
              stroke="none"
            />
            {/* Glow halo behind line */}
            <path
              d={pathD} fill="none"
              stroke={color} strokeWidth="10" strokeLinecap="round"
              opacity={active ? 0.10 : 0.04}
            />
            {/* Visible line */}
            <path
              d={pathD} fill="none"
              stroke={'url(#grad-' + id + ')'} strokeWidth="2.5" strokeLinecap="round"
              opacity={active ? 1 : 0.2}
            />
            {/* JS-driven particles */}
            {pts.map(function(pt, i) {
              return (
                <circle
                  key={i}
                  cx={pt.x} cy={pt.y} r="5"
                  fill={color}
                  filter={'url(#glow-' + id + ')'}
                />
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}
