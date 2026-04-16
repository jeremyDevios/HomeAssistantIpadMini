import { useState, useEffect } from 'react'
import FlowDiagram from './components/FlowDiagram'
import { MOCK_DATA } from './lib/mockData'

function Clock() {
  var init = useState(new Date())
  var now = init[0]
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

export default function App() {
  var init = useState(MOCK_DATA)
  var data = init[0]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#0d1117',
      boxSizing: 'border-box',
    }}>
      <Clock />

      {/* Flow diagram — takes remaining vertical space */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <FlowDiagram data={data} />
      </div>

      {/* Charts placeholder */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        height: '28%',
        padding: '8px 16px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        boxSizing: 'border-box',
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.04)',
          marginRight: 8,
        }}>
          <span style={{ fontSize: 10, color: '#374151', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Production vs Consommation
          </span>
        </div>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.04)',
        }}>
          <span style={{ fontSize: 10, color: '#374151', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            État Batterie
          </span>
        </div>
      </div>
    </div>
  )
}
