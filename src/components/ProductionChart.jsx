import { useState, useEffect, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { useLocalHistory, toHourlyAvg } from '../lib/useHassHistory'

var LABEL_STYLE   = { fontSize: 10, fill: '#64748b' }
var TOOLTIP_STYLE = { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11, color: '#e2e8f0' }

function useContainerWidth(ref) {
  var s = useState(300); var width = s[0]; var setW = s[1]
  useEffect(function() { if (ref.current) setW(ref.current.offsetWidth) }, [ref])
  return width
}

export default function ProductionChart() {
  var samples      = useLocalHistory()
  var containerRef = useRef(null)
  var width        = useContainerWidth(containerRef)

  // Filter to today only
  var start = new Date(); start.setHours(0, 0, 0, 0)
  var today = samples.filter(function(s) { return s.t >= start.getTime() })

  var solarByH = toHourlyAvg(today, 'solar')
  var consByH  = toHourlyAvg(today, 'consumption')

  var chartData = solarByH.map(function(d, i) {
    return { hour: d.hour, Solaire: d.value, Consommation: consByH[i] ? consByH[i].value : 0 }
  })

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Production vs Consommation</span>
        <span style={{ fontSize: 9, color: '#475569' }}>Aujourd'hui</span>
      </div>

      {chartData.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 10, color: '#374151' }}>En attente de données…</span>
        </div>
      ) : (
        <BarChart width={width - 8} height={95} data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={5} barGap={1}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="hour" tick={LABEL_STYLE} interval={2} />
          <YAxis tick={LABEL_STYLE} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="Solaire"      fill="#f59e0b" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Consommation" fill="#6366f1" radius={[3, 3, 0, 0]} />
        </BarChart>
      )}
    </div>
  )
}
