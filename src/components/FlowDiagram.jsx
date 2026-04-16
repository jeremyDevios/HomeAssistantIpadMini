import EnergyNode from './EnergyNode'
import FlowCanvas from './FlowCanvas'
import { COLORS } from '../lib/mockData'

export default function FlowDiagram({ data }) {
  const NODES = [
    {
      key: 'solar',
      type: 'solar',
      color: COLORS.solar,
      label: 'Production Solaire',
      watts: data.solar.watts,
      pos: { left: '16%', top: '24%' },
    },
    {
      key: 'battery',
      type: 'battery',
      color: COLORS.battery,
      label: 'Stockage Batterie',
      watts: data.battery.watts,
      subLabel: `${data.battery.charging ? 'Charge' : 'Décharge'} ${data.battery.soc}%`,
      pos: { left: '84%', top: '24%' },
    },
    {
      key: 'consumption',
      type: 'consumption',
      color: COLORS.consumption,
      label: 'Consommation Maison',
      watts: data.consumption.watts,
      pos: { left: '16%', top: '80%' },
    },
    {
      key: 'grid',
      type: 'grid',
      color: COLORS.grid,
      label: 'Surplus Réseau',
      watts: data.grid.watts,
      subLabel: data.grid.exporting ? 'exporté' : 'importé',
      pos: { left: '84%', top: '80%' },
    },
  ]

  return (
    <div className="relative w-full h-full">
      <FlowCanvas data={data} />

      {NODES.map((n) => (
        <div
          key={n.key}
          className="absolute"
          style={{ left: n.pos.left, top: n.pos.top, transform: 'translate(-50%, -50%)' }}
        >
          <EnergyNode
            type={n.type}
            color={n.color}
            label={n.label}
            watts={n.watts}
            subLabel={n.subLabel}
          />
        </div>
      ))}

      {/* Central house node */}
      <div
        className="absolute"
        style={{ left: '50%', top: '52%', transform: 'translate(-50%, -50%)' }}
      >
        <EnergyNode type="house" color={COLORS.center} label="" watts={null} size="lg" />
      </div>
    </div>
  )
}
