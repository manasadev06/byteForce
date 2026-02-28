import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { calculateTargets } from '../lib/nutrition'

const N8N_WEBHOOK_URL = 'YOUR_N8N_WEBHOOK_URL_HERE' // Replace with your n8n webhook

function Card({ children, style = {} }) {
  return <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 24, ...style }}>{children}</div>
}

export default function GapsPlanner({ profile, user }) {
  const [todayLog, setTodayLog] = useState(null)
  const [planState, setPlanState] = useState('idle') // idle | loading | done | error
  const [plan, setPlan] = useState([])
  const [errorMsg, setErrorMsg] = useState('')
  const targets = profile ? calculateTargets(profile) : { calories: 2000, protein: 65, carbs: 250, fat: 55 }

  useEffect(() => { fetchToday() }, [])

  const fetchToday = async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('daily_logs').select('*').eq('user_id', user.id).eq('log_date', today).maybeSingle()
    setTodayLog(data)
  }

  const cal = todayLog?.total_calories || 0
  const protein = todayLog?.total_protein || 0
  const carbs = todayLog?.total_carbs || 0
  const fat = todayLog?.total_fat || 0
  const budget = todayLog?.budget || 100

  const gaps = {
    calories: Math.max(0, targets.calories - cal),
    protein: Math.max(0, targets.protein - protein),
    carbs: Math.max(0, targets.carbs - carbs),
    fat: Math.max(0, targets.fat - fat),
    budgetLeft: budget,
  }

  const generate = async () => {
  setPlanState('loading')
  setErrorMsg('')

  try {
    const payload = {
      name: profile?.name,
      diet: profile?.diet,
      goal: profile?.goal,
      has_pcos: profile?.has_pcos,
      goes_to_gym: profile?.goes_to_gym,
      caloriesEaten: cal,
      caloriesTarget: targets.calories,
      caloriesNeeded: gaps.calories,
      proteinEaten: protein,
      proteinTarget: targets.protein,
      proteinNeeded: gaps.protein,
      carbsNeeded: gaps.carbs,
      budgetRemaining: gaps.budgetLeft,
      allergies: profile?.allergies || [],
    }

    const res = await fetch("http://localhost:5678/webhook/nutrition-plan", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const data = await res.json()
    setPlan(data.items || [])
    setPlanState('done')

  } catch (err) {
    console.error(err)
    setErrorMsg("AI Planner is currently offline. Please check back later.")
    setPlanState('error')
  }
}

  return (
    <div style={{ padding: '40px', overflowY: 'auto', height: '100vh', background: 'var(--bg-color)' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)' }}>AI Meal Planner ✦</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Smart AI recommendations to fill your nutritional gaps today</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 24, alignItems: 'start' }}>
        {/* Left — gaps */}
        <div>
          <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #1e293b, var(--card-bg))' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⚡</span> TODAY'S GAPS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                ['Calories needed', `${gaps.calories} kcal`, '#60a5fa', gaps.calories > 0, '🔥'],
                ['Protein needed', `${gaps.protein}g`, 'var(--accent-green)', gaps.protein > 0, '💪'],
                ['Carbs needed', `${gaps.carbs}g`, '#fb923c', gaps.carbs > 0, '🍞'],
                ['Budget left', `₹${gaps.budgetLeft}`, '#facc15', true, '💰'],
              ].map(([label, val, color, active, icon]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: active ? 1 : 0.4 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ color: active ? color : 'var(--text-muted)', fontSize: 18, fontWeight: 900 }}>{val}</div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={generate} disabled={planState === 'loading'}
              style={{ 
                width: '100%', 
                background: 'var(--accent-green)', 
                border: 'none', 
                borderRadius: 14, 
                padding: '16px', 
                color: '#000', 
                fontWeight: 900, 
                fontSize: 15, 
                marginTop: 32, 
                cursor: planState === 'loading' ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 20px -4px rgba(74, 222, 128, 0.3)',
                transition: 'all 0.2s',
                opacity: planState === 'loading' ? 0.7 : 1
              }}>
              {planState === 'loading' ? '🪄 ANALYZING GAPS...' : '✨ GENERATE AI PLAN'}
            </button>
          </Card>

          {planState === 'error' && (
            <div style={{ background: 'rgba(248, 113, 113, 0.1)', border: '1px solid #f87171', borderRadius: 12, padding: '16px', color: '#f87171', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
              ⚠️ {errorMsg}
            </div>
          )}
        </div>

        {/* Right — plan results */}
        <div>
          {planState === 'idle' ? (
            <Card style={{ textAlign: 'center', padding: '100px 40px', borderStyle: 'dashed', background: 'transparent' }}>
              <div style={{ fontSize: 48, marginBottom: 20 }}>🪄</div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Ready to plan?</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>Click the button to get personalized AI meal recommendations based on your nutritional gaps and budget.</div>
            </Card>
          ) : planState === 'loading' ? (
            <Card style={{ textAlign: 'center', padding: '100px 40px' }}>
              <div className="loading-spinner" style={{ fontSize: 48, marginBottom: 20 }}>✦</div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Thinking...</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Gemini is analyzing your gaps and finding the best affordable foods.</div>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {plan.map((item, i) => (
                <Card key={i} style={{ border: i === 0 ? '1px solid var(--accent-green)' : '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      {i === 0 && <div style={{ fontSize: 10, color: 'var(--accent-green)', fontWeight: 800, marginBottom: 4, letterSpacing: '0.1em' }}>TOP RECOMMENDATION</div>}
                      <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>{item.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4, fontWeight: 500 }}>{item.quantity} • ₹{item.price} approx.</div>
                    </div>
                    <div style={{ background: 'rgba(74, 222, 128, 0.1)', color: 'var(--accent-green)', padding: '6px 14px', borderRadius: 10, fontSize: 13, fontWeight: 800 }}>
                      +{item.protein}g protein
                    </div>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
                    💡 <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{item.why}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
