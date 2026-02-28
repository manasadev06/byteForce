import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { calculateTargets } from '../lib/nutrition'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

function Card({ children, style = {} }) {
  return <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 24, ...style }}>{children}</div>
}

function CircleProgress({ value, max, color, size = 110, strokeWidth = 10 }) {
  const pct = Math.min(value / max, 1)
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={`${circ*pct} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
    </svg>
  )
}

function MacroRing({ label, value, max, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <CircleProgress value={value} max={max} color={color} size={100} strokeWidth={8} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>/{max}</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, fontWeight: 600 }}>{label}</div>
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
    if (score === 0) return 'rgba(255,255,255,0.03)'
    if (score < 40) return '#f87171'
    if (score < 70) return '#facc15'
    if (score < 90) return '#4ade80'
    return '#22c55e'
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 8 }}>
      {days.map((d, i) => (
        <div key={i} title={`${d.date}: ${d.score}%`}
          style={{ width: '100%', paddingBottom: '100%', background: getColor(d.score), borderRadius: 6, cursor: 'pointer', position: 'relative', opacity: d.score === 0 ? 1 : 0.8 }}>
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

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>Loading...</div>

  return (
    <div style={{ padding: '40px', overflowY: 'auto', height: '100vh', background: 'var(--bg-color)' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4 }}>{profile?.name} 👋</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>{new Date().toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      </div>

      {/* Top row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 24, marginBottom: 24 }}>
        {/* Score */}
        <Card style={{ background: 'linear-gradient(135deg, #1e293b, var(--card-bg))', display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <CircleProgress value={score} max={100} color={score > 70 ? 'var(--accent-green)' : score > 40 ? '#facc15' : '#f87171'} size={140} strokeWidth={12} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)' }}>{score}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>SCORE</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Nutrition Score</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
              {score > 70 ? '🌟 Your nutrition is excellent today!' : score > 40 ? '⚡ Good progress, keep it up!' : '⚠️ Aim for better balance today.'}
            </div>
          </div>
        </Card>

        {/* Macros */}
        <Card>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>Today's Macros</div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <MacroRing label="Calories" value={cal} max={targets.calories} color="#60a5fa" />
            <MacroRing label="Protein" value={protein} max={targets.protein} color="var(--accent-green)" />
            <MacroRing label="Carbs" value={carbs} max={targets.carbs} color="#fb923c" />
            <MacroRing label="Fat" value={fat} max={targets.fat} color="#a78bfa" />
          </div>
        </Card>
      </div>

      {/* Weekly chart + Heatmap */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 24, marginBottom: 24 }}>
        <Card>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>Weekly Protein Intake (g)</div>
          {weekChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weekChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} 
                  labelStyle={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: 4 }} 
                />
                <Bar dataKey="protein" radius={[6, 6, 0, 0]} barSize={32}>
                  {weekChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.protein >= targets.protein ? 'var(--accent-green)' : entry.protein >= targets.protein * 0.7 ? '#facc15' : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '60px 0' }}>Log food to see your weekly trend</div>}
        </Card>

        <Card>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>30-Day Activity</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Nutrition consistency</div>
          <Heatmap logs={monthLogs} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, padding: '0 4px' }}>
            {[['rgba(255,255,255,0.03)', 'None'], ['#f87171', 'Low'], ['#facc15', 'Fair'], ['var(--accent-green)', 'Good']].map(([c, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: c }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{l}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Calorie trend */}
      {weekChartData.length > 0 && (
        <Card style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>Calorie Trend vs Target</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weekChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 12 }} />
              <Line type="monotone" dataKey="calories" stroke="#60a5fa" strokeWidth={3} dot={{ fill: '#60a5fa', r: 5, strokeWidth: 2, stroke: 'var(--card-bg)' }} activeDot={{ r: 7 }} name="Calories eaten" />
              <Line type="monotone" dataKey="target" stroke="var(--border-color)" strokeWidth={2} strokeDasharray="6 6" dot={false} name="Target" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Tips */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {tips.map((tip, i) => (
          <div key={i} style={{ 
            background: 'rgba(250, 204, 21, 0.05)', 
            border: '1px solid rgba(250, 204, 21, 0.1)', 
            padding: '20px', 
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}>
            <div style={{ fontSize: 12, color: '#facc15', fontWeight: 800, letterSpacing: '0.05em' }}>PRO TIP #{i + 1}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>{tip}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
