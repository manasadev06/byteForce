import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { calculateTargets } from '../lib/nutrition'

const N8N_WEBHOOK_URL = 'YOUR_N8N_WEBHOOK_URL_HERE' // Replace with your n8n webhook

function Card({ children, style = {} }) {
  return <div style={{ background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 16, padding: 20, ...style }}>{children}</div>
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
    const { data } = await supabase.from('daily_logs').select('*').eq('user_id', user.id).eq('log_date', today).single()
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

    console.log("FULL RESPONSE:", data)

    // 🔥 THIS IS THE IMPORTANT LINE
    setPlan(data.items)

    setPlanState('done')

  } catch (err) {
    console.error(err)
    setErrorMsg("Something went wrong")
    setPlanState('error')
  }
}

  return (
    <div style={{ padding: '28px 32px', fontFamily: "'DM Sans', sans-serif", overflowY: 'auto', height: '100vh', background: '#0f1117' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#f1f5f9' }}>AI Meal Planner ✦</div>
        <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>Powered by n8n + Gemini AI • Fills your nutritional gaps</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>
        {/* Left — gaps */}
        <div>
          <Card style={{ marginBottom: 16, background: 'linear-gradient(135deg, #1a2744, #1a1d27)' }}>
            <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 14 }}>⚡ Today's Gaps</div>
            {[
              ['🔥 Calories needed', `${gaps.calories} kcal`, '#60a5fa', gaps.calories > 0],
              ['💪 Protein needed', `${gaps.protein}g`, '#4ade80', gaps.protein > 0],
              ['🍞 Carbs needed', `${gaps.carbs}g`, '#fb923c', gaps.carbs > 0],
              ['💰 Budget remaining', `₹${gaps.budgetLeft}`, '#facc15', true],
            ].map(([label, val, color, show]) => show && (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#21253a', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>{label}</span>
                <span style={{ color, fontWeight: 800, fontSize: 15 }}>{val}</span>
              </div>
            ))}
            {gaps.calories === 0 && gaps.protein === 0 && (
              <div style={{ color: '#4ade80', fontWeight: 700, textAlign: 'center', padding: 16 }}>🎉 All nutrition goals hit today!</div>
            )}
          </Card>

          {/* Profile summary */}
          <Card>
            <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 12 }}>👤 Your Profile</div>
            {[
              ['Diet', profile?.diet === 'veg' ? '🥦 Vegetarian' : profile?.diet === 'nonveg' ? '🍗 Non-Veg' : profile?.diet === 'vegan' ? '🌱 Vegan' : '🥚 Eggetarian'],
              ['Goal', profile?.goal === 'muscle' ? '💪 Build Muscle' : profile?.goal === 'lose' ? '🔥 Lose Weight' : '🌟 Stay Healthy'],
              ['Gym', profile?.goes_to_gym ? '✅ Yes' : '❌ No'],
              profile?.has_pcos && ['PCOS/PCOD', '✅ Yes - adjusted plan'],
              ['Allergies', profile?.allergies?.length ? profile.allergies.join(', ') : 'None'],
            ].filter(Boolean).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>{k}</span>
                <span style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </Card>
        </div>

        {/* Right — AI planner */}
        <div>
          {planState === 'idle' && (
            <Card style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>✦</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>Generate Your Personalized Plan</div>
              <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 28, lineHeight: 1.6 }}>
                AI will analyze your gaps, budget, diet type, and health goal to suggest the perfect meals for the rest of your day.
              </div>
              <button onClick={generate}
                style={{ background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', border: 'none', borderRadius: 14, padding: '16px 32px', color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: '0 8px 32px #a78bfa44', width: '100%' }}>
                ✦ Generate AI Meal Plan
              </button>
            </Card>
          )}

          {planState === 'loading' && (
            <Card style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16, display: 'inline-block', animation: 'spin 1.2s linear infinite' }}>✦</div>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>AI is analyzing your nutrition...</div>
              <div style={{ color: '#94a3b8', fontSize: 13 }}>Connecting to n8n → Gemini AI</div>
              <div style={{ color: '#475569', fontSize: 12, marginTop: 8 }}>This may take 5-10 seconds</div>
            </Card>
          )}

          {planState === 'error' && (
            <Card style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <div style={{ color: '#f87171', fontWeight: 700, marginBottom: 8 }}>{errorMsg}</div>
              <button onClick={() => setPlanState('idle')} style={{ background: '#21253a', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#94a3b8', cursor: 'pointer', marginTop: 8 }}>Try Again</button>
            </Card>
          )}

          {planState === 'done' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: 99, background: '#4ade80' }} />
                <span style={{ color: '#4ade80', fontSize: 13, fontWeight: 600 }}>
                  Plan generated for {profile?.name} • {profile?.diet} • ₹{gaps.budgetLeft} budget
                </span>
              </div>

              {plan.map((item, i) => (
                <Card key={i} style={{ marginBottom: 14, border: '1px solid #a78bfa33' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ background: '#4ade8022', color: '#4ade80', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>{item.meal || `Meal ${i + 1}`}</span>
                    {item.time && <span style={{ color: '#475569', fontSize: 12 }}>🕐 {item.time}</span>}
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{item.name}</div>
                  {item.where && <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>📍 {item.where}</div>}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    {item.calories && <span style={{ fontSize: 12, color: '#60a5fa' }}>{item.calories} kcal</span>}
                    {item.protein && <span style={{ fontSize: 12, color: '#4ade80' }}>{item.protein}g protein</span>}
                    {item.carbs && <span style={{ fontSize: 12, color: '#fb923c' }}>{item.carbs}g carbs</span>}
                    {item.price && <span style={{ marginLeft: 'auto', color: '#facc15', fontWeight: 700 }}>₹{item.price}</span>}
                  </div>
                </Card>
              ))}

              <Card style={{ background: '#4ade8011', border: '1px solid #4ade8033', marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: '#4ade80', fontWeight: 700 }}>✓ This plan adds:</div>
                <div style={{ fontSize: 13, color: '#f1f5f9', marginTop: 4 }}>
                  {plan.reduce((s, p) => s + (p.calories || 0), 0)} kcal •{' '}
                  {plan.reduce((s, p) => s + (p.protein || 0), 0)}g protein •{' '}
                  Total ₹{plan.reduce((s, p) => s + (p.price || 0), 0)}
                </div>
              </Card>

              <button onClick={() => setPlanState('idle')}
                style={{ width: '100%', background: '#21253a', border: '1px solid #2d3148', borderRadius: 12, padding: 12, color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>
                🔄 Regenerate Plan
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
