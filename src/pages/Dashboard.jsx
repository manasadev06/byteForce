import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { calculateTargets } from '../lib/nutrition'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

function Card({ children, style = {} }) {
  return <div style={{ background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 16, padding: 20, ...style }}>{children}</div>
}

function CircleProgress({ value, max, color, size = 110 }) {
  const pct = Math.min(value / max, 1)
  const r = (size - 14) / 2
  const circ = 2 * Math.PI * r
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#2d3148" strokeWidth={10} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${circ*pct} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
    </svg>
  )
}

function MacroRing({ label, value, max, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <CircleProgress value={value} max={max} color={color} size={90} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9' }}>{value}</div>
          <div style={{ fontSize: 9, color: '#94a3b8' }}>/{max}</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{label}</div>
    </div>
  )
}

// Monthly heatmap
function Heatmap({ logs }) {
  const today = new Date()
  const days = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const log = logs.find(l => l.log_date === dateStr)
    const score = log ? Math.min(Math.round((log.total_calories / 2000) * 100), 100) : 0
    days.push({ date: dateStr, score, day: d.getDate() })
  }

  const getColor = (score) => {
    if (score === 0) return '#21253a'
    if (score < 40) return '#f8717144'
    if (score < 70) return '#facc1566'
    if (score < 90) return '#4ade8066'
    return '#4ade80'
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 5 }}>
      {days.map((d, i) => (
        <div key={i} title={`${d.date}: ${d.score}%`}
          style={{ width: '100%', paddingBottom: '100%', background: getColor(d.score), borderRadius: 4, cursor: 'pointer', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 8, color: '#fff', opacity: 0.7 }}>{d.day}</div>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard({ profile, user }) {
  const [todayLog, setTodayLog] = useState(null)
  const [weekLogs, setWeekLogs] = useState([])
  const [monthLogs, setMonthLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const targets = profile ? calculateTargets(profile) : { calories: 2000, protein: 65, carbs: 250, fat: 55 }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const today = new Date().toISOString().split('T')[0]
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

    const { data } = await supabase.from('daily_logs').select('*')
      .eq('user_id', user.id).gte('log_date', monthAgo).order('log_date', { ascending: false })

    if (data) {
      setMonthLogs(data)
      setTodayLog(data.find(l => l.log_date === today))
      setWeekLogs(data.slice(0, 7).reverse())
    }
    setLoading(false)
  }

  const cal = todayLog?.total_calories || 0
  const protein = todayLog?.total_protein || 0
  const carbs = todayLog?.total_carbs || 0
  const fat = todayLog?.total_fat || 0
  const score = Math.round(Math.min((cal / targets.calories * 0.4 + protein / targets.protein * 0.4 + (carbs / targets.carbs) * 0.2), 1) * 100)

  const weekChartData = weekLogs.map(l => ({
    day: new Date(l.log_date).toLocaleDateString('en', { weekday: 'short' }),
    calories: l.total_calories || 0,
    protein: l.total_protein || 0,
    target: targets.calories
  }))

  const tips = [
    profile?.has_pcos ? '🩺 PCOS tip: Avoid refined carbs today. Choose dal + veggies over rice.' : '💡 Try adding a banana post-mess for quick energy!',
    profile?.goes_to_gym ? '🏋️ Gym day? Aim for 30g protein within 2hrs of workout.' : '💧 Drink 8 glasses of water today!',
    `🎯 You need ${Math.max(0, targets.protein - protein)}g more protein today. Try curd or eggs!`,
  ]

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#94a3b8', fontFamily: "'DM Sans', sans-serif" }}>Loading...</div>

  return (
    <div style={{ padding: '28px 32px', fontFamily: "'DM Sans', sans-serif", overflowY: 'auto', height: '100vh', background: '#0f1117' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: '#94a3b8', fontSize: 14 }}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#f1f5f9' }}>{profile?.name} 👋</div>
        <div style={{ color: '#475569', fontSize: 13, marginTop: 2 }}>{new Date().toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      </div>

      {/* Top row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Score */}
        <Card style={{ background: 'linear-gradient(135deg, #1a2744, #1a1d27)', gridColumn: '1', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <CircleProgress value={score} max={100} color={score > 70 ? '#4ade80' : score > 40 ? '#facc15' : '#f87171'} size={110} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#f1f5f9' }}>{score}</div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>/ 100</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>Nutrition Score</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{score > 70 ? '🌟 Great job!' : score > 40 ? '⚡ Getting there' : '⚠️ Needs work'}</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Based on today's intake</div>
          </div>
        </Card>

        {/* Macros */}
        <Card style={{ gridColumn: 'span 2' }}>
          <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>Today's Macros</div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <MacroRing label="Calories" value={cal} max={targets.calories} color="#60a5fa" />
            <MacroRing label="Protein (g)" value={protein} max={targets.protein} color="#4ade80" />
            <MacroRing label="Carbs (g)" value={carbs} max={targets.carbs} color="#fb923c" />
            <MacroRing label="Fat (g)" value={fat} max={targets.fat} color="#a78bfa" />
          </div>
        </Card>
      </div>

      {/* Weekly chart + Heatmap */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card>
          <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>Weekly Protein Intake (g)</div>
          {weekChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weekChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#21253a', border: '1px solid #2d3148', borderRadius: 8 }} labelStyle={{ color: '#f1f5f9' }} />
                <Bar dataKey="protein" radius={[4, 4, 0, 0]}>
                  {weekChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.protein >= targets.protein ? '#4ade80' : entry.protein >= targets.protein * 0.7 ? '#facc15' : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: 40 }}>Log food to see your weekly trend</div>}
        </Card>

        <Card>
          <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>30-Day Activity</div>
          <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 12 }}>Nutrition heatmap</div>
          <Heatmap logs={monthLogs} />
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            {[['#21253a', 'No data'], ['#f8717144', 'Low'], ['#facc1566', 'OK'], ['#4ade80', 'Great']].map(([c, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
                <span style={{ fontSize: 10, color: '#475569' }}>{l}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Calorie trend */}
      {weekChartData.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>Calorie Trend vs Target</div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={weekChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#21253a', border: '1px solid #2d3148', borderRadius: 8 }} />
              <Line type="monotone" dataKey="calories" stroke="#60a5fa" strokeWidth={2} dot={{ fill: '#60a5fa', r: 4 }} name="Calories eaten" />
              <Line type="monotone" dataKey="target" stroke="#2d3148" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Target" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Tips */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {tips.map((tip, i) => (
          <Card key={i} style={{ background: '#facc1511', border: '1px solid #facc1522' }}>
            <div style={{ fontSize: 12, color: '#facc15', fontWeight: 700, marginBottom: 4 }}>Tip #{i + 1}</div>
            <div style={{ fontSize: 13, color: '#f1f5f9' }}>{tip}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}
