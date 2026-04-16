import EnergyNode from './EnergyNode'
import FlowCanvas from './FlowCanvas'
import { COLORS } from '../lib/mockData'

var NODES = [
  {
    key:   'solar',
    type:  'solar',
    label: 'Production Solaire',
    left:  '16%',
    top:   '24%',
  },
  {
    key:   'battery',
    type:  'battery',
    label: 'Stockage Batterie',
    left:  '84%',
    top:   '24%',
  },
  {
    key:   'consumption',
    type:  'consumption',
    label: 'Consommation Maison',
    left:  '16%',
    top:   '80%',
  },
  {
    key:   'grid',
    type:  'grid',
    label: 'Surplus Réseau',
    left:  '84%',
    top:   '80%',
  },
]

export default function FlowDiagram({ data }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>

      {/* Animated SVG flow lines — fills the container */}
      <FlowCanvas data={data} />

      {/* Corner energy nodes — absolutely positioned to match SVG viewBox percentages */}
      {NODES.map(function(n) {
        var nodeData = data[n.key] || {}
        var subLabel = null
        if (n.key === 'battery') {
          subLabel = (nodeData.charging ? 'Charge' : 'Décharge') + ' ' + nodeData.soc + '%'
        } else if (n.key === 'grid') {
          subLabel = nodeData.exporting ? 'exporté' : 'importé'
        }

        return (
          <div
            key={n.key}
            style={{
              position: 'absolute',
              left: n.left,
              top: n.top,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <EnergyNode
              type={n.type}
              color={COLORS[n.key]}
              label={n.label}
              watts={nodeData.watts}
              subLabel={subLabel}
            />
          </div>
        )
      })}

      {/* Central house node */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '52%',
        transform: 'translate(-50%, -50%)',
      }}>
        <EnergyNode type="house" color={COLORS.center} label="" watts={null} size="lg" />
      </div>

    </div>
  )
}
