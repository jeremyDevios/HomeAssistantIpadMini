import { useState, useEffect } from 'react'

var HA_URL   = import.meta.env.VITE_HA_URL
var HA_TOKEN = import.meta.env.VITE_HA_TOKEN

// Fetch HA history for given entity IDs over the last `hoursBack` hours.
// Returns { [entityId]: [ { time: Date, value: number } ] }
function fetchHistory(entityIds, hoursBack) {
  var start = new Date(Date.now() - hoursBack * 3600 * 1000).toISOString()
  var url = HA_URL + '/api/history/period/' + start
    + '?filter_entity_id=' + entityIds.join(',')
    + '&minimal_response&no_attributes'

  return fetch(url, {
    headers: { Authorization: 'Bearer ' + HA_TOKEN }
  })
    .then(function(res) { return res.json() })
    .then(function(raw) {
      var result = {}
      if (!Array.isArray(raw)) return result
      raw.forEach(function(series) {
        if (!series || !series.length) return
        var entityId = series[0].entity_id
        result[entityId] = series
          .map(function(s) {
            var v = parseFloat(s.state)
            return isNaN(v) ? null : { time: new Date(s.last_changed), value: v }
          })
          .filter(Boolean)
      })
      return result
    })
}

// Groups a series of {time, value} into hourly buckets averaged.
export function toHourlyAvg(series) {
  var buckets = {}
  series.forEach(function(pt) {
    var h = pt.time.getHours()
    if (!buckets[h]) buckets[h] = { sum: 0, count: 0 }
    buckets[h].sum += pt.value
    buckets[h].count += 1
  })
  var now = new Date()
  var result = []
  for (var h = 0; h <= now.getHours(); h++) {
    var b = buckets[h]
    result.push({
      hour:  h + 'h',
      value: b ? Math.round(b.sum / b.count) : 0,
    })
  }
  return result
}

export function useHassHistory(entityIds, hoursBack, refreshMinutes) {
  var init    = useState(null)
  var data    = init[0]
  var setData = init[1]

  useEffect(function() {
    var active = true

    function load() {
      fetchHistory(entityIds, hoursBack)
        .then(function(d) { if (active) setData(d) })
        .catch(function(e) { console.error('[HA history]', e) })
    }

    load()
    var interval = setInterval(load, (refreshMinutes || 5) * 60 * 1000)

    return function() {
      active = false
      clearInterval(interval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return data
}
