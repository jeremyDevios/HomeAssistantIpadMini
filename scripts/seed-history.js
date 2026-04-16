// scripts/seed-history.js
// Generates 7 days of realistic simulated data and writes to data/history.json
// Run with: node scripts/seed-history.js

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname }            from 'path'
import { fileURLToPath }            from 'url'

var __dirname    = dirname(fileURLToPath(import.meta.url))
var DATA_DIR     = join(__dirname, '..', 'data')
var DATA_FILE    = join(DATA_DIR, 'history.json')
var SAMPLE_MS    = 60 * 1000        // 1 sample per minute
var DAYS         = 7
var TOTAL        = DAYS * 24 * 60   // 10 080 samples

// Battery specs (Solarflow 1600)
var BAT_CAPACITY_WH   = 1600
var BAT_MAX_CHARGE_W  = 1000
var BAT_MAX_DISCHARGE_W = 800
var BAT_MIN_SOC       = 10
var BAT_MAX_SOC       = 95

// ─── Helpers ───────────────────────────────────────────────────────────────────

function rand(min, max) {
  return min + Math.random() * (max - min)
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v))
}

// Smooth noise: lerp toward a target, with small random nudge each step
function smoothNoise(current, target, speed, noiseAmp) {
  return current + (target - current) * speed + rand(-noiseAmp, noiseAmp)
}

// Solar production for a given minute-of-day and a daily peak capacity (W)
// Bell curve centred on solar noon (13h), active 7h–20h
function solarAtMinute(minuteOfDay, peakW) {
  var hourF  = minuteOfDay / 60
  var rise   = 7.0
  var set    = 20.0
  var noon   = 13.0
  if (hourF < rise || hourF > set) return 0
  var sigma  = 2.8    // width of bell
  var gauss  = Math.exp(-Math.pow(hourF - noon, 2) / (2 * sigma * sigma))
  return Math.max(0, peakW * gauss)
}

// Typical house consumption profile — higher morning and evening
function consumptionAtHour(hour) {
  var base = 200
  if (hour >= 6  && hour < 9)  return base + rand(200, 450)  // morning routine
  if (hour >= 9  && hour < 12) return base + rand(50,  150)  // quiet day
  if (hour >= 12 && hour < 14) return base + rand(100, 250)  // lunch
  if (hour >= 14 && hour < 18) return base + rand(50,  120)  // afternoon
  if (hour >= 18 && hour < 22) return base + rand(250, 600)  // evening peak
  if (hour >= 22 || hour < 6)  return base + rand(20,  80)   // night
  return base
}

// ─── Simulation ────────────────────────────────────────────────────────────────

var samples = []
var now     = Date.now()
var startT  = now - DAYS * 24 * 60 * 60 * 1000
var soc     = rand(40, 70)     // starting SoC

// Pre-generate per-day weather (sunny / partly cloudy / cloudy)
var dayPeaks = []
for (var d = 0; d < DAYS; d++) {
  var weather = Math.random()
  if (weather > 0.7)      dayPeaks.push(rand(900, 1200))   // sunny
  else if (weather > 0.3) dayPeaks.push(rand(400, 900))    // partly cloudy
  else                    dayPeaks.push(rand(50,  400))    // cloudy / overcast
}

// Smooth consumption target to avoid instant jumps
var consTarget = 300
var consCurrent = 300

for (var i = 0; i < TOTAL; i++) {
  var t             = startT + i * SAMPLE_MS
  var date          = new Date(t)
  var dayIndex      = Math.floor((t - startT) / (24 * 60 * 60 * 1000))
  var minuteOfDay   = date.getHours() * 60 + date.getMinutes()
  var peakW         = dayPeaks[Math.min(dayIndex, DAYS - 1)]

  // Solar (with slight flicker for clouds)
  var rawSolar  = solarAtMinute(minuteOfDay, peakW)
  var solar     = Math.round(clamp(rawSolar + rand(-20, 20), 0, peakW))

  // Consumption — update target every 10 min
  if (i % 10 === 0) consTarget = consumptionAtHour(date.getHours())
  consCurrent   = smoothNoise(consCurrent, consTarget, 0.1, 15)
  var consumption = Math.round(clamp(consCurrent, 50, 1000))

  // Battery dispatch
  var excess  = solar - consumption
  var battery = 0   // + = discharging, - = charging
  var grid    = 0   // + = import, - = export

  if (excess > 0) {
    // Solar surplus → charge battery first, export rest
    var chargeRoom = ((BAT_MAX_SOC - soc) / 100) * BAT_CAPACITY_WH / (1 / 60)  // W available to charge this minute
    var charge     = clamp(excess, 0, Math.min(BAT_MAX_CHARGE_W, chargeRoom))
    battery        = -Math.round(charge)   // negative = charging
    grid           = -Math.round(excess - charge)  // negative = export
  } else {
    // Deficit → discharge battery, import remainder
    var deficit   = -excess
    var dischargeRoom = ((soc - BAT_MIN_SOC) / 100) * BAT_CAPACITY_WH / (1 / 60)
    var discharge = clamp(deficit, 0, Math.min(BAT_MAX_DISCHARGE_W, dischargeRoom))
    battery       = Math.round(discharge)  // positive = discharging
    grid          = Math.round(deficit - discharge)  // positive = import
  }

  // Update SoC (1 min = 1/60 h)
  var deltaWh = (-battery) * (1 / 60)   // charging = positive Wh added
  soc = clamp(soc + (deltaWh / BAT_CAPACITY_WH) * 100, 0, 100)

  samples.push({
    t:           t,
    solar:       solar,
    grid:        grid,
    battery:     battery,
    soc:         Math.round(soc),
    consumption: consumption,
  })
}

// ─── Write ─────────────────────────────────────────────────────────────────────

mkdirSync(DATA_DIR, { recursive: true })
writeFileSync(DATA_FILE, JSON.stringify({ samples: samples }))

console.log('✓ Generated', samples.length, 'samples →', DATA_FILE)
console.log('  Date range:', new Date(startT).toLocaleString(), '→', new Date(now).toLocaleString())
console.log('  Weather per day:')
dayPeaks.forEach(function(p, i) {
  var label = p > 900 ? '☀️  sunny' : p > 400 ? '⛅ partly cloudy' : '☁️  cloudy'
  var d = new Date(startT + i * 24 * 60 * 60 * 1000)
  console.log('   Day', i + 1, '(' + d.toLocaleDateString() + '): peak', Math.round(p) + 'W', label)
})
