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
  var gridRaw    = num(entities, ENTITY_GRID)
  var batteryRaw = num(entities, ENTITY_BATTERY)
  var soc        = num(entities, ENTITY_SOC)
  var consumption = Math.max(0, solar + gridRaw + batteryRaw)

  return {
    solar:       { watts: Math.round(solar) },
    battery:     { watts: Math.round(Math.abs(batteryRaw)), charging: batteryRaw < 0, soc: Math.round(soc) },
    consumption: { watts: Math.round(consumption) },
    grid:        { watts: Math.round(Math.abs(gridRaw)), exporting: gridRaw < 0 },
  }
}

export function useHassData() {
  var s0      = useState(null)
  var data    = s0[0]; var setData = s0[1]

  var s1      = useState('connecting')
  var status  = s1[0]; var setStatus = s1[1]

  useEffect(function() {
    // Guard: catch missing .env — Vite replaces undefined vars with the string "undefined"
    if (!HA_URL || !HA_TOKEN || HA_URL === 'undefined' || HA_TOKEN === 'undefined') {
      console.error('[HA] VITE_HA_URL or VITE_HA_TOKEN is missing. Check your .env file and rebuild.')
      setStatus('error')
      return
    }

    var conn   = null
    var unsub  = null
    var active = true

    async function connect() {
      try {
        var auth = createLongLivedTokenAuth(HA_URL, HA_TOKEN)

        conn = await createConnection({
          auth,
          setupRetry: Infinity,   // retry initial connect forever (HA may be temporarily down)
        })

        if (!active) { conn.close(); return }

        // Track connection lifecycle to update the status dot
        conn.addEventListener('ready', function() {
          if (active) setStatus('connected')
        })
        conn.addEventListener('disconnected', function() {
          if (active) setStatus('connecting')  // show CONNEXION... while reconnecting
        })

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
