// server.js — serves static dist/ + logs HA data every minute to data/history.json
import { createServer }                     from 'http'
import { readFileSync, writeFileSync,
         existsSync, mkdirSync }            from 'fs'
import { join, dirname }                    from 'path'
import { fileURLToPath }                    from 'url'

var __dirname = dirname(fileURLToPath(import.meta.url))
var DATA_DIR  = join(__dirname, 'data')
var DATA_FILE = join(DATA_DIR, 'history.json')
var DIST_DIR  = join(__dirname, 'dist')

// ─── Load .env manually (no extra dep) ────────────────────────────────────────
try {
  readFileSync('.env', 'utf8').split('\n').forEach(function(line) {
    var m = line.match(/^([A-Z_a-z]+)=(.+)$/)
    if (m) process.env[m[1]] = m[2].trim()
  })
} catch (_) {}

var HA_URL   = process.env.VITE_HA_URL
var HA_TOKEN = process.env.VITE_HA_TOKEN

var ENTITIES = {
  solar:   'sensor.production_solaire',
  grid:    'sensor.house_power_channel_1_power',
  battery: 'sensor.energy_battery_solarflow1600_pack_input_power_solarflow1600_output_pack_power_net_power',
  soc:     'sensor.solarflow1600_electric_level',
}

var SEVEN_DAYS   = 7 * 24 * 60 * 60 * 1000
var SAMPLE_MS    = 60 * 1000   // sample every 60 s
var PORT         = 4173

// ─── History persistence ───────────────────────────────────────────────────────
function loadHistory() {
  if (!existsSync(DATA_FILE)) return { samples: [] }
  try { return JSON.parse(readFileSync(DATA_FILE, 'utf8')) }
  catch (_) { return { samples: [] } }
}

function saveHistory(h) {
  mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(DATA_FILE, JSON.stringify(h))
}

function prune(h) {
  var cutoff = Date.now() - SEVEN_DAYS
  h.samples = h.samples.filter(function(s) { return s.t > cutoff })
}

// ─── HA REST fetch ─────────────────────────────────────────────────────────────
function haGet(entityId) {
  return fetch(HA_URL + '/api/states/' + entityId, {
    headers: { Authorization: 'Bearer ' + HA_TOKEN },
  })
    .then(function(r) { return r.json() })
    .then(function(j) { var v = parseFloat(j.state); return isNaN(v) ? 0 : v })
}

// ─── Sampling ──────────────────────────────────────────────────────────────────
function doSample(h) {
  Promise.all([haGet(ENTITIES.solar), haGet(ENTITIES.grid), haGet(ENTITIES.battery), haGet(ENTITIES.soc)])
    .then(function(vals) {
      var solar   = Math.max(0, vals[0])
      var grid    = vals[1]
      var battery = vals[2]
      var soc     = vals[3]
      var consumption = Math.max(0, solar + grid + battery)
      h.samples.push({ t: Date.now(), solar: Math.round(solar), grid: Math.round(grid), battery: Math.round(battery), soc: Math.round(soc), consumption: Math.round(consumption) })
      prune(h)
      saveHistory(h)
      console.log('[sample]', new Date().toLocaleTimeString(), '— solar:', solar, 'grid:', grid, 'bat:', battery, 'cons:', consumption)
    })
    .catch(function(err) { console.error('[sample] failed:', err.message) })
}

// ─── MIME types ────────────────────────────────────────────────────────────────
var MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.svg':  'image/svg+xml',
  '.json': 'application/json',
}

function ext(p) { var i = p.lastIndexOf('.'); return i >= 0 ? p.slice(i) : '' }

// ─── HTTP server (no express dep needed) ──────────────────────────────────────
var history = loadHistory()
console.log('[init] loaded', history.samples.length, 'samples from disk')

var server = createServer(function(req, res) {
  // API endpoint
  if (req.url === '/api/local-history') {
    var body = JSON.stringify(history)
    res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'Access-Control-Allow-Origin': '*' })
    res.end(body)
    return
  }

  // Static file serving
  var urlPath = req.url.split('?')[0]
  var filePath = join(DIST_DIR, urlPath === '/' ? 'index.html' : urlPath)

  var serve = function(fp) {
    try {
      var data = readFileSync(fp)
      res.writeHead(200, { 'Content-Type': MIME[ext(fp)] || 'application/octet-stream' })
      res.end(data)
    } catch (_) {
      // SPA fallback
      try {
        var html = readFileSync(join(DIST_DIR, 'index.html'))
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(html)
      } catch (e2) {
        res.writeHead(500); res.end('dist/ not found — run npm run build first')
      }
    }
  }

  serve(filePath)
})

server.listen(PORT, '0.0.0.0', function() {
  console.log('Dashboard running at http://0.0.0.0:' + PORT)
})

// Start sampling immediately, then every minute
doSample(history)
setInterval(function() { doSample(history) }, SAMPLE_MS)
