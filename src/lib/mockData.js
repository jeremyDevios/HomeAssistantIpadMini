// Mock data — will be replaced by HA WebSocket in Milestone 4
export const MOCK_DATA = {
  solar:       { watts: 900,  label: 'Production Solaire' },
  battery:     { watts: 500,  label: 'Stockage Batterie', soc: 82, charging: true },
  consumption: { watts: 350,  label: 'Consommation Maison' },
  grid:        { watts: 50,   label: 'Surplus Réseau', exporting: true },
}

// Node colors
export const COLORS = {
  solar:       '#f59e0b',
  battery:     '#22c55e',
  consumption: '#60a5fa',
  grid:        '#f97316',
  center:      '#94a3b8',
}
