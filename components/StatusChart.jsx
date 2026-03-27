'use client'

import { useState, useEffect, useRef } from 'react'

const STATUS_COLORS = {
  operational: '#22c55e',
  degraded_performance: '#eab308',
  partial_outage: '#f97316',
  major_outage: '#ef4444',
  under_maintenance: '#3b82f6'
}

export default function StatusChart({ hours = 24 }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedComp, setSelectedComp] = useState(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    fetch(`/api/history?hours=${hours}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [hours])

  useEffect(() => {
    if (!data || !canvasRef.current) return
    drawChart()
  }, [data, selectedComp])

  function drawChart() {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height
    const padding = { top: 20, right: 20, bottom: 40, left: 60 }
    const chartW = w - padding.left - padding.right
    const chartH = h - padding.top - padding.bottom

    ctx.clearRect(0, 0, w, h)

    // Get timeline data
    let timeline
    if (selectedComp && data.components[selectedComp]) {
      timeline = data.components[selectedComp]
    } else {
      timeline = data.timeline.map(t => ({ time: t.time, status: t.overall }))
    }

    if (timeline.length === 0) {
      ctx.fillStyle = '#888'
      ctx.font = '14px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('No data yet', w / 2, h / 2)
      return
    }

    const times = timeline.map(t => new Date(t.time).getTime())
    const minTime = Math.min(...times)
    const maxTime = Math.max(...times)
    const timeRange = maxTime - minTime || 1

    // Draw background grid
    ctx.strokeStyle = '#222'
    ctx.lineWidth = 1

    // Time labels on x-axis
    ctx.fillStyle = '#555'
    ctx.font = '11px system-ui'
    ctx.textAlign = 'center'

    const labelCount = Math.min(6, timeline.length)
    for (let i = 0; i < labelCount; i++) {
      const t = minTime + (timeRange * i / (labelCount - 1 || 1))
      const x = padding.left + (chartW * i / (labelCount - 1 || 1))
      const date = new Date(t)

      ctx.beginPath()
      ctx.moveTo(x, padding.top)
      ctx.lineTo(x, padding.top + chartH)
      ctx.stroke()

      const label = hours <= 24
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' })
      ctx.fillText(label, x, padding.top + chartH + 20)
    }

    // Draw status bars
    const barHeight = 24
    const barY = padding.top + (chartH - barHeight) / 2

    for (let i = 0; i < timeline.length; i++) {
      const t = new Date(timeline[i].time).getTime()
      const x = padding.left + ((t - minTime) / timeRange) * chartW

      const nextT = i < timeline.length - 1
        ? new Date(timeline[i + 1].time).getTime()
        : t + 300000 // 5 min
      const nextX = padding.left + ((nextT - minTime) / timeRange) * chartW
      const barW = Math.max(nextX - x, 2)

      ctx.fillStyle = STATUS_COLORS[timeline[i].status] || '#555'
      ctx.fillRect(x, barY, barW, barHeight)
    }

    // Y-axis label
    ctx.save()
    ctx.fillStyle = '#888'
    ctx.font = '12px system-ui'
    ctx.textAlign = 'center'
    ctx.translate(16, padding.top + chartH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(selectedComp || 'Overall', 0, 0)
    ctx.restore()

    // Legend
    const legendY = padding.top + chartH + 32
    const statuses = ['operational', 'degraded_performance', 'partial_outage', 'major_outage']
    const legendLabels = ['Operational', 'Degraded', 'Partial Outage', 'Major Outage']
    let legendX = padding.left

    ctx.font = '10px system-ui'
    ctx.textAlign = 'left'
    for (let i = 0; i < statuses.length; i++) {
      ctx.fillStyle = STATUS_COLORS[statuses[i]]
      ctx.fillRect(legendX, legendY, 10, 10)
      ctx.fillStyle = '#888'
      ctx.fillText(legendLabels[i], legendX + 14, legendY + 9)
      legendX += ctx.measureText(legendLabels[i]).width + 28
    }
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>
  if (!data) return null

  const componentNames = Object.keys(data.components || {})

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${!selectedComp ? 'btn-primary' : ''}`}
          onClick={() => setSelectedComp(null)}
        >
          Overall
        </button>
        {componentNames.map(name => (
          <button
            key={name}
            className={`btn btn-sm ${selectedComp === name ? 'btn-primary' : ''}`}
            onClick={() => setSelectedComp(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: 140, display: 'block' }}
      />
    </div>
  )
}
