import { useState, useEffect } from 'react'

var REFRESH_MS = 5 * 60 * 1000   // re-fetch every 5 min

// Groups samples into hourly buckets, averaging the given field.
// Returns [{ hour: '8h', value: 450 }, ...]
export function toHourlyAvg(samples, field) {
  var buckets = {}
  samples.forEach(function(s) {
    var h = new Date(s.t).getHours()
    if (!buckets[h]) buckets[h] = { sum: 0, count: 0 }
    buckets[h].sum += s[field]
    buckets[h].count += 1
  })
  var nowH = new Date().getHours()
  var result = []
  for (var h = 0; h <= nowH; h++) {
    var b = buckets[h]
    result.push({ hour: h + 'h', value: b ? Math.round(b.sum / b.count) : 0 })
  }
  return result
}

// Returns last N hours of samples as-is (for time-series charts)
export function lastNHours(samples, hours) {
  var cutoff = Date.now() - hours * 3600 * 1000
  return samples.filter(function(s) { return s.t > cutoff })
}

// Hook — fetches /api/local-history, re-fetches every 5 min.
// Returns array of samples: [{ t, solar, grid, battery, soc, consumption }]
export function useLocalHistory() {
  var init     = useState([])
  var samples  = init[0]
  var setSamples = init[1]

  useEffect(function() {
    var active = true

    function load() {
      fetch('/api/local-history')
        .then(function(r) { return r.json() })
        .then(function(d) { if (active && Array.isArray(d.samples)) setSamples(d.samples) })
        .catch(function(e) { console.error('[history]', e) })
    }

    load()
    var t = setInterval(load, REFRESH_MS)
    return function() { active = false; clearInterval(t) }
  }, [])

  return samples
}
