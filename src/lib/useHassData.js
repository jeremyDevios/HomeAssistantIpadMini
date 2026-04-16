import { useState, useEffect } from 'react'
import {
  createConnection,
  createLongLivedTokenAuth,
  subscribeEntities,
} from 'home-assistant-js-websocket'

var HA_URL   = import.meta.env.VITE_HA_URL
var HA_TOKEN = import.meta.env.VITE_HA_TOKEN

var ENTITY_SOLAR    = 'sensor.production_solaire'
var ENTITY_GRID     = 'sensor.house_power_channel_1_power'
var ENTITY_BATTERY  = 'sensor.energy_battery_solarflow1600_pack_input_power_solarflow1600_output_pack_power_net_power'
var ENTITY_SOC      = 'sensor.solarflow1600_electric_level'

function num(entities, id) {
  var s = entities[id]
  if (!s) return 0
  var v = parseFloat(s.state)
  return isNaN(v) ? 0 : v
}

function mapEntities(entities) {
  var solar      = Math.max(0, num(entities, ENTITY_SOLAR))
  var gridRaw    = num(entities, ENTITY_GRID)       // + = import, - = export
  var batteryRaw = num(entities, ENTITY_BATTERY)    // + = discharging, - = charging
  var soc        = num(entities, ENTITY_SOC)

  // Consumption derived from user formula
  var consumption = Math.max(0, gridRaw - solar - batteryRaw)

  return {
    solar: {
      watts: Math.round(solar),
    },
    battery: {
      watts:    Math.round(Math.abs(batteryRaw)),
      charging: batteryRaw < 0,   // negative = charging
      soc:      Math.round(soc),
    },
    consumption: {
      watts: Math.round(consumption),
    },
    grid: {
      watts:     Math.round(Math.abs(gridRaw)),
      exporting: gridRaw < 0,     // negative = export
    },
  }
}

export function useHassData() {
  var initState = useState(null)
  var data      = initState[0]
  var setData   = initState[1]

  var initStatus = useState('connecting')
  var status     = initStatus[0]
  var setStatus  = initStatus[1]

  useEffect(function() {
    var conn   = null
    var unsub  = null
    var active = true

    async function connect() {
      try {
        var auth = createLongLivedTokenAuth(HA_URL, HA_TOKEN)
        conn = await createConnection({ auth })
        if (!active) { conn.close(); return }
        setStatus('connected')
        unsub = subscribeEntities(conn, function(entities) {
          setData(mapEntities(entities))
        })
      } catch (err) {
        console.error('[HA] connection failed:', err)
        if (active) setStatus('error')
      }
    }

    connect()

    return function() {
      active = false
      if (unsub) unsub()
      if (conn) conn.close()
    }
  }, [])

  return { data: data, status: status }
}
