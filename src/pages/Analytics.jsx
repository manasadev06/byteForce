import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { calculateTargets } from '../lib/nutrition'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'

function Card({ children, style = {} }) {
  return <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 24, ...style }}>{children}</div>
}

export default function Analytics({ profile, user }) {
  const [logs, setLogs] = useState([])
  const [range, setRange] = useState('week') // week | month
  const targets = profile ? calculateTargets(profile) : { calories: 2000, protein: 65, carbs: 250, fat: 55 }

  useEffect(() => { fetchLogs() }, [range])

  const fetchLogs = async () => {
    const days = range === 'week' ? 7 : 30
    const from = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]
    const { data } = await supabase.from('daily_logs').select('*').eq('user_id', user.id).gte('log_date', from).order('log_date')
    setLogs(data || [])
  }

  const chartData = logs.map(l => ({
    day: new Date(l.log_date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    calories: l.total_calories || 0,
    protein: l.total_protein || 0,
    carbs: l.total_carbs || 0,
    fat: l.total_fat || 0,
    target: targets.calories,
    score: Math.min(Math.round(((l.total_calories || 0) / targets.calories * 0.5 + (l.total_protein || 0) / targets.protein * 0.5) * 100), 100)
  }))

  const avg = (key) => logs.length ? Math.round(logs.reduce((s, l) => s + (l[key] || 0), 0) / logs.length) : 0
  const avgScore = chartData.length ? Math.round(chartData.reduce((s, d) => s + d.score, 0) / chartData.length) : 0
  const daysOnTarget = chartData.filter(d => d.calories >= targets.calories * 0.85).length
  const proteinDaysOnTarget = chartData.filter(d => d.protein >= targets.protein * 0.85).length

  const radarData = [
    { subject: 'Calories', val: Math.min(Math.round(avg('total_calories') / targets.calories * 100), 100), fullMark: 100 },
    { subject: 'Protein', val: Math.min(Math.round(avg('total_protein') / targets.protein * 100), 100), fullMark: 100 },
    { subject: 'Carbs', val: Math.min(Math.round(avg('total_carbs') / targets.carbs * 100), 100), fullMark: 100 },
    { subject: 'Fat', val: Math.min(Math.round(avg('total_fat') / targets.fat * 100), 100), fullMark: 100 },
    { subject: 'Consistency', val: Math.round(logs.length / (range === 'week' ? 7 : 30) * 100), fullMark: 100 },
  ]

  return (
    <div style={{ padding: '40px', overflowY: 'auto', height: '100vh', background: 'var(--bg-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)' }}>Analytics 📊</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Deeper insights into your nutrition journey</div>
        </div>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 12, gap: 4 }}>
          {['week', 'month'].map(r => (
            <button key={r} onClick={() => setRange(r)}
              style={{ 
                background: range === r ? 'var(--accent-green)' : 'transparent', 
                border: 'none', 
                borderRadius: 10, 
                padding: '8px 20px', 
                color: range === r ? '#000' : 'var(--text-muted)', 
                fontWeight: 700, 
                cursor: 'pointer', 
                fontSize: 13, 
                textTransform: 'capitalize',
                transition: 'all 0.2s'
              }}>
              {r === 'week' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {logs.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '80px 40px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 18, marginBottom: 8 }}>No data yet!</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Start logging your meals to unlock detailed analytics.</div>
        </Card>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Avg Score', val: `${avgScore}`, unit: '/100', color: avgScore > 70 ? 'var(--accent-green)' : '#facc15', icon: '🌟' },
              { label: 'Days Logged', val: logs.length, unit: `/${range === 'week' ? 7 : 30}`, color: '#60a5fa', icon: '📅' },
              { label: 'Calorie Goal', val: daysOnTarget, unit: ` days`, color: '#fb923c', icon: '🔥' },
              { label: 'Protein Goal', val: proteinDaysOnTarget, unit: ` days`, color: 'var(--accent-green)', icon: '💪' },
            ].map((s, i) => (
              <Card key={i} style={{ padding: '20px' }}>
                <div style={{ fontSize: 24 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: s.color, marginTop: 12 }}>{s.val}<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.2)', marginLeft: 4 }}>{s.unit}</span></div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>{s.label}</div>
              </Card>
            ))}
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 24, marginBottom: 24 }}>
            <Card>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>Calorie Trend vs Target</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 12 }} 
                    labelStyle={{ color: 'var(--text-primary)', fontWeight: 700 }} 
                  />
                  <Line type="monotone" dataKey="calories" stroke="#60a5fa" strokeWidth={3} dot={{ fill: '#60a5fa', r: 4 }} name="Calories" />
                  <Line type="monotone" dataKey="target" stroke="var(--border-color)" strokeWidth={2} strokeDasharray="6 6" dot={false} name="Target" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>Nutrition Balance</div>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="var(--border-color)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Radar name="Performance" dataKey="val" stroke="var(--accent-green)" fill="var(--accent-green)" fillOpacity="0.4" />
                  <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Macros chart */}
          <Card>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>Macro Distribution over Time (g)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 12 }} />
                <Bar dataKey="protein" stackId="a" fill="var(--accent-green)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="carbs" stackId="a" fill="#fb923c" />
                <Bar dataKey="fat" stackId="a" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 24 }}>
              {[
                { label: 'Protein', color: 'var(--accent-green)' },
                { label: 'Carbs', color: '#fb923c' },
                { label: 'Fat', color: '#a78bfa' }
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{l.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
