import { useState, useEffect, useRef } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { useLocalHistory, lastNHours } from '../lib/useHassHistory'

var LABEL_STYLE   = { fontSize: 10, fill: '#64748b' }
var TOOLTIP_STYLE = { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11, color: '#e2e8f0' }

function useContainerWidth(ref) {
  var s = useState(300); var width = s[0]; var setW = s[1]
  useEffect(function() { if (ref.current) setW(ref.current.offsetWidth) }, [ref])
  return width
}

function downsample(arr, max) {
  if (arr.length <= max) return arr
  var step = Math.ceil(arr.length / max)
  var out = []
  for (var i = 0; i < arr.length; i += step) out.push(arr[i])
  return out
}

export default function BatteryChart({ currentSoc }) {
  var samples      = useLocalHistory()
  var containerRef = useRef(null)
  var width        = useContainerWidth(containerRef)

  var recent   = lastNHours(samples, 24)
  var sampled  = downsample(recent, 40)
  var chartData = sampled.map(function(s) {
    var d   = new Date(s.t)
    var hh  = d.getHours()
    var mm  = d.getMinutes()
    return { time: hh + ':' + (mm < 10 ? '0' + mm : mm), SOC: s.soc }
  })

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>État Batterie</span>
        {currentSoc !== undefined && (
          <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700 }}>{currentSoc}%</span>
        )}
      </div>

      {chartData.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 10, color: '#374151' }}>En attente de données…</span>
        </div>
      ) : (
        <AreaChart width={width - 8} height={95} data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="soc-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="time" tick={LABEL_STYLE} interval={7} />
          <YAxis tick={LABEL_STYLE} domain={[0, 100]} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Area type="monotone" dataKey="SOC" stroke="#22c55e" strokeWidth={2} fill="url(#soc-grad)" dot={false} />
        </AreaChart>
      )}
    </div>
  )
}
