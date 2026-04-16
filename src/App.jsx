import { useState, useEffect } from 'react'
import FlowDiagram from './components/FlowDiagram'
import { MOCK_DATA } from './lib/mockData'

function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10000)
    return () => clearInterval(t)
  }, [])
  const day  = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return (
    <div className="text-center py-2">
      <span className="text-xs text-slate-500 tracking-widest uppercase">
        {day} — {time}
      </span>
    </div>
  )
}

export default function App() {
  // Will be replaced by live HA data in Milestone 4
  const [data] = useState(MOCK_DATA)

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden" style={{ background: '#0d1117' }}>
      <Clock />

      <div className="flex-1 relative min-h-0">
        <FlowDiagram data={data} />
      </div>

      {/* Charts placeholder — Milestone 5 */}
      <div
        className="shrink-0 flex items-center justify-center gap-4 px-6 py-3"
        style={{ height: '28%', borderTop: '1px solid #ffffff0d' }}
      >
        <div className="flex-1 h-full flex items-center justify-center rounded-xl"
             style={{ background: '#ffffff06' }}>
          <span className="text-xs text-slate-700 tracking-widest uppercase">
            Production vs Consommation
          </span>
        </div>
        <div className="flex-1 h-full flex items-center justify-center rounded-xl"
             style={{ background: '#ffffff06' }}>
          <span className="text-xs text-slate-700 tracking-widest uppercase">
            État Batterie
          </span>
        </div>
      </div>
    </div>
  )
}
