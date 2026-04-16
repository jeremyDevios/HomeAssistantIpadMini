import { useState, useEffect, useRef } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from 'recharts'
import { useHassHistory, toHourlyAvg } from '../lib/useHassHistory'

var ENTITY_SOLAR = 'sensor.production_solaire'
var ENTITY_GRID  = 'sensor.house_power_channel_1_power'

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

export default function ProductionChart() {
  var history    = useHassHistory([ENTITY_SOLAR, ENTITY_GRID], 24, 5)
  var containerRef = useRef(null)
  var width      = useContainerWidth(containerRef)

  var chartData = []
  if (history && history[ENTITY_SOLAR] && history[ENTITY_GRID]) {
    var solar    = toHourlyAvg(history[ENTITY_SOLAR])
    var grid     = toHourlyAvg(history[ENTITY_GRID])
    var gridByH  = {}
    grid.forEach(function(d) { gridByH[d.hour] = d.value })
    chartData = solar.map(function(d) {
      return { hour: d.hour, Solar: d.value, Réseau: Math.abs(gridByH[d.hour] || 0) }
    })
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Production vs Réseau
        </span>
        <span style={{ fontSize: 9, color: '#475569' }}>Aujourd'hui</span>
      </div>

      {chartData.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 10, color: '#374151' }}>Chargement…</span>
        </div>
      ) : (
        <BarChart
          width={width - 8}
          height={95}
          data={chartData}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          barSize={6}
          barGap={2}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="hour" tick={LABEL_STYLE} interval={2} />
          <YAxis tick={LABEL_STYLE} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="Solar"  fill="#f59e0b" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Réseau" fill="#3b82f6" radius={[3, 3, 0, 0]} />
        </BarChart>
      )}
    </div>
  )
}
