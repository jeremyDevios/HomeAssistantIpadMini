import { useEffect, useState } from 'react'
import FlowDiagram from './components/FlowDiagram'
import ProductionChart from './components/ProductionChart'
import BatteryChart from './components/BatteryChart'
import { MOCK_DATA } from './lib/mockData'
import { useHassData } from './lib/useHassData'

function Clock() {
  var init   = useState(new Date())
  var now    = init[0]
  var setNow = init[1]
  useEffect(function() {
    var t = setInterval(function() { setNow(new Date()) }, 10000)
    return function() { clearInterval(t) }
  }, [])
  var day  = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  var time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <span style={{ fontSize: 11, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {day} — {time}
      </span>
    </div>
  )
}

function StatusDot({ status }) {
  var color = status === 'connected' ? '#22c55e' : status === 'error' ? '#ef4444' : '#f59e0b'
  var label = status === 'connected' ? 'Live' : status === 'error' ? 'Erreur HA' : 'Connexion…'
  return (
    <div style={{ position: 'absolute', top: 10, right: 14, display: 'flex', alignItems: 'center' }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, marginRight: 5 }} />
      <span style={{ fontSize: 10, color: color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  )
}

export default function App() {
  var hass   = useHassData()
  var data   = hass.data || MOCK_DATA   // fall back to mock while connecting
  var status = hass.status

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#0d1117',
      boxSizing: 'border-box',
      position: 'relative',
    }}>
      <Clock />
      <StatusDot status={status} />

      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <FlowDiagram data={data} />
      </div>

      {/* Charts — M5 */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        height: '28%',
        padding: '10px 16px 12px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        boxSizing: 'border-box',
      }}>
        <div style={{
          flex: 1,
          borderRadius: 12,
          background: 'rgba(255,255,255,0.04)',
          padding: '10px 12px',
          marginRight: 8,
          overflow: 'hidden',
        }}>
          <ProductionChart />
        </div>
        <div style={{
          flex: 1,
          borderRadius: 12,
          background: 'rgba(255,255,255,0.04)',
          padding: '10px 12px',
          overflow: 'hidden',
        }}>
          <BatteryChart currentSoc={data.battery.soc} />
        </div>
      </div>
    </div>
  )
}
