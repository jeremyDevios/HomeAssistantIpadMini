import { useState, useEffect, useRef } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { useHassHistory } from '../lib/useHassHistory'

var ENTITY_SOC = 'sensor.solarflow1600_electric_level'

var LABEL_STYLE = { fontSize: 10, fill: '#64748b' }
var TOOLTIP_STYLE = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 8,
  fontSize: 11,
  color: '#e2e8f0',
}

function useContainerWidth(ref) {
  var init     = useState(300)
  var width    = init[0]
  var setWidth = init[1]
  useEffect(function() {
    if (ref.current) setWidth(ref.current.offsetWidth)
  }, [ref])
  return width
}

// Sample down to ~30 points evenly spaced
function downsample(series, targetCount) {
  if (series.length <= targetCount) return series
  var step = Math.floor(series.length / targetCount)
  var result = []
  for (var i = 0; i < series.length; i += step) {
    result.push(series[i])
  }
  return result
}

export default function BatteryChart({ currentSoc }) {
  var history      = useHassHistory([ENTITY_SOC], 24, 5)
  var containerRef = useRef(null)
  var width        = useContainerWidth(containerRef)

  var chartData = []
  if (history && history[ENTITY_SOC]) {
    var sampled = downsample(history[ENTITY_SOC], 30)
    chartData = sampled.map(function(pt) {
      var h   = pt.time.getHours()
      var min = pt.time.getMinutes()
      return {
        time: h + ':' + (min < 10 ? '0' + min : min),
        SOC:  Math.round(pt.value),
      }
    })
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          État Batterie
        </span>
        {currentSoc !== undefined && (
          <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700 }}>{currentSoc}%</span>
        )}
      </div>

      {chartData.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 10, color: '#374151' }}>Chargement…</span>
        </div>
      ) : (
        <AreaChart
          width={width - 8}
          height={95}
          data={chartData}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="soc-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="time" tick={LABEL_STYLE} interval={5} />
          <YAxis tick={LABEL_STYLE} domain={[0, 100]} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Area
            type="monotone"
            dataKey="SOC"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#soc-gradient)"
            dot={false}
          />
        </AreaChart>
      )}
    </div>
  )
}
