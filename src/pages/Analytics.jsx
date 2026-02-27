import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { calculateTargets } from '../lib/nutrition'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'

function Card({ children, style = {} }) {
  return <div style={{ background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 16, padding: 20, ...style }}>{children}</div>
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
    <div style={{ padding: '28px 32px', fontFamily: "'DM Sans', sans-serif", overflowY: 'auto', height: '100vh', background: '#0f1117' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#f1f5f9' }}>Analytics 📊</div>
          <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>Your nutrition trends and insights</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['week', 'month'].map(r => (
            <button key={r} onClick={() => setRange(r)}
              style={{ background: range === r ? '#4ade80' : '#1a1d27', border: '1px solid #2d3148', borderRadius: 8, padding: '7px 18px', color: range === r ? '#000' : '#94a3b8', fontWeight: range === r ? 700 : 400, cursor: 'pointer', fontSize: 13, textTransform: 'capitalize' }}>
              {r === 'week' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {logs.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No data yet!</div>
          <div style={{ color: '#94a3b8', fontSize: 13 }}>Start logging your meals in Daily Log to see your analytics here.</div>
        </Card>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Avg Score', val: `${avgScore}`, unit: '/100', color: avgScore > 70 ? '#4ade80' : '#facc15', icon: '🌟' },
              { label: 'Days Logged', val: logs.length, unit: `/${range === 'week' ? 7 : 30}`, color: '#60a5fa', icon: '📅' },
              { label: 'Calorie Goal Days', val: daysOnTarget, unit: ` days`, color: '#fb923c', icon: '🔥' },
              { label: 'Protein Goal Days', val: proteinDaysOnTarget, unit: ` days`, color: '#4ade80', icon: '💪' },
            ].map((s, i) => (
              <Card key={i}>
                <div style={{ fontSize: 22 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: s.color, marginTop: 4 }}>{s.val}<span style={{ fontSize: 14, color: '#475569' }}>{s.unit}</span></div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{s.label}</div>
              </Card>
            ))}
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 16 }}>
            <Card>
              <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 14 }}>Calorie Trend vs Target</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
                  <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#21253a', border: '1px solid #2d3148', borderRadius: 8 }} labelStyle={{ color: '#f1f5f9' }} />
                  <Line type="monotone" dataKey="calories" stroke="#60a5fa" strokeWidth={2} dot={{ fill: '#60a5fa', r: 3 }} name="Calories" />
                  <Line type="monotone" dataKey="target" stroke="#2d3148" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Target" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 14 }}>Nutrition Balance</div>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#2d3148" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Radar name="You" dataKey="val" stroke="#4ade80" fill="#4ade80" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Protein + Score bars */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <Card>
              <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 14 }}>Daily Protein (g)</div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
                  <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#21253a', border: '1px solid #2d3148', borderRadius: 8 }} />
                  <Bar dataKey="protein" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.protein >= targets.protein ? '#4ade80' : entry.protein >= targets.protein * 0.7 ? '#facc15' : '#f87171'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 14 }}>Daily Nutrition Score</div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
                  <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#21253a', border: '1px solid #2d3148', borderRadius: 8 }} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.score >= 80 ? '#4ade80' : entry.score >= 50 ? '#facc15' : '#f87171'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Insights */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Card style={{ background: '#4ade8011', border: '1px solid #4ade8033' }}>
              <div style={{ fontSize: 13, color: '#4ade80', fontWeight: 700, marginBottom: 6 }}>✅ What went well</div>
              <div style={{ color: '#f1f5f9', fontSize: 13, lineHeight: 1.6 }}>
                {proteinDaysOnTarget > 0 ? `You hit your protein goal ${proteinDaysOnTarget} out of ${logs.length} days — keep it up!` : 'You\'ve been consistent with logging. That\'s the first step!'}
                {profile?.goes_to_gym && daysOnTarget > 0 ? ` Calorie intake was adequate on ${daysOnTarget} gym days.` : ''}
              </div>
            </Card>
            <Card style={{ background: '#f8717111', border: '1px solid #f8717133' }}>
              <div style={{ fontSize: 13, color: '#f87171', fontWeight: 700, marginBottom: 6 }}>⚠️ What to improve</div>
              <div style={{ color: '#f1f5f9', fontSize: 13, lineHeight: 1.6 }}>
                {avg('total_protein') < targets.protein ? `Average protein (${avg('total_protein')}g) is below target (${targets.protein}g). Try adding eggs, curd or dal.` : `Great protein intake! Focus on keeping calories consistent.`}
                {profile?.has_pcos ? ' With PCOS, avoid refined carbs and prefer complex carbs like oats and brown rice.' : ''}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
