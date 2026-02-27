import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { FOOD_DB, calculateNutrition, calculateTargets } from '../lib/nutrition'

function Card({ children, style = {} }) {
  return <div style={{ background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 16, padding: 20, ...style }}>{children}</div>
}

export default function DailyLog({ profile, user }) {
  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(today)
  const [budget, setBudget] = useState(profile?.budget || 100)
  const [meals, setMeals] = useState({ breakfast: [], lunch: [], dinner: [] })
  const [extraFoods, setExtraFoods] = useState([])
  const [extraInput, setExtraInput] = useState('')
  const [extraQty, setExtraQty] = useState(1)
  const [activeTab, setActiveTab] = useState('breakfast')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [logId, setLogId] = useState(null)

  const targets = profile ? calculateTargets(profile) : { calories: 2000, protein: 65, carbs: 250, fat: 55 }
  const messMenu = profile?.mess_menu || { breakfast: [], lunch: [], dinner: [] }

  useEffect(() => { fetchLog() }, [selectedDate])

  const fetchLog = async () => {
    const { data } = await supabase.from('daily_logs').select('*').eq('user_id', user.id).eq('log_date', selectedDate).single()
    if (data) {
      setBudget(data.budget || 100)
      setMeals(data.meals || { breakfast: [], lunch: [], dinner: [] })
      setExtraFoods(data.extra_foods || [])
      setLogId(data.id)
    } else {
      setMeals({ breakfast: [], lunch: [], dinner: [] })
      setExtraFoods([])
      setLogId(null)
    }
  }

  const toggleMeal = (meal, item) => {
    setMeals(prev => {
      const items = prev[meal]
      const exists = items.find(i => i.name === item)
      return { ...prev, [meal]: exists ? items.filter(i => i.name !== item) : [...items, { name: item, quantity: 1 }] }
    })
  }

  const addExtra = () => {
    if (!extraInput.trim()) return
    setExtraFoods(prev => [...prev, { name: extraInput, quantity: parseFloat(extraQty) || 1 }])
    setExtraInput('')
    setExtraQty(1)
  }

  const removeExtra = (i) => setExtraFoods(prev => prev.filter((_, idx) => idx !== i))

  const allFoods = [...Object.values(meals).flat(), ...extraFoods]
  const nutrition = calculateNutrition(allFoods)

  const saveLog = async () => {
    setSaving(true)
    const payload = {
      user_id: user.id, log_date: selectedDate, budget,
      meals, extra_foods: extraFoods,
      total_calories: nutrition.calories,
      total_protein: nutrition.protein,
      total_carbs: nutrition.carbs,
      total_fat: nutrition.fat,
    }
    if (logId) {
      await supabase.from('daily_logs').update(payload).eq('id', logId)
    } else {
      const { data } = await supabase.from('daily_logs').insert(payload).select().single()
      if (data) setLogId(data.id)
    }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const barColor = (val, max) => val >= max ? '#4ade80' : val >= max * 0.7 ? '#facc15' : '#f87171'

  return (
    <div style={{ padding: '28px 32px', fontFamily: "'DM Sans', sans-serif", overflowY: 'auto', height: '100vh', background: '#0f1117' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#f1f5f9' }}>Daily Food Log 📅</div>
          <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>Track every meal to hit your nutrition goals</div>
        </div>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
          style={{ background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 10, padding: '8px 14px', color: '#f1f5f9', fontSize: 14, outline: 'none', cursor: 'pointer' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        {/* Left — meal logging */}
        <div>
          {/* Budget */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontWeight: 700, color: '#f1f5f9' }}>💰 Today's Extra Food Budget</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#facc15' }}>₹{budget}</div>
            </div>
            <input type="range" min={0} max={300} value={budget} onChange={e => setBudget(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#facc15' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: 12, marginTop: 4 }}><span>₹0</span><span>₹300</span></div>
          </Card>

          {/* Mess meals */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 14 }}>🍽 Hostel Mess Meals</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['breakfast', 'lunch', 'dinner'].map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  style={{ flex: 1, background: activeTab === t ? '#4ade80' : '#21253a', border: 'none', borderRadius: 8, padding: '8px 0', color: activeTab === t ? '#000' : '#94a3b8', fontWeight: activeTab === t ? 700 : 400, cursor: 'pointer', fontSize: 13, textTransform: 'capitalize' }}>
                  {t === 'breakfast' ? '☀️ ' : t === 'lunch' ? '🌤 ' : '🌙 '}{t}
                </button>
              ))}
            </div>

            {messMenu[activeTab]?.length > 0 ? (
              messMenu[activeTab].map((item, i) => {
                const isLogged = meals[activeTab]?.some(m => m.name === item)
                const db = FOOD_DB[item] || {}
                return (
                  <button key={i} onClick={() => toggleMeal(activeTab, item)}
                    style={{ width: '100%', background: isLogged ? '#4ade8022' : '#21253a', border: `2px solid ${isLogged ? '#4ade80' : '#2d3148'}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ color: '#f1f5f9', fontWeight: 600 }}>{item}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{db.cal} kcal • {db.protein}g protein • {db.carbs}g carbs</div>
                    </div>
                    <div style={{ width: 28, height: 28, borderRadius: 99, background: isLogged ? '#4ade80' : '#2d3148', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isLogged ? '#000' : '#94a3b8', fontWeight: 800, flexShrink: 0, fontSize: 14 }}>
                      {isLogged ? '✓' : '+'}
                    </div>
                  </button>
                )
              })
            ) : (
              <div style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: 24 }}>
                No {activeTab} items set. Go to profile to update your mess menu.
              </div>
            )}
          </Card>

          {/* Extra food */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 14 }}>➕ Extra Food (outside mess)</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input list="food-list" placeholder="Search food..." value={extraInput} onChange={e => setExtraInput(e.target.value)}
                  style={{ width: '100%', background: '#21253a', border: '1px solid #2d3148', borderRadius: 10, padding: '10px 14px', color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                <datalist id="food-list">
                  {Object.keys(FOOD_DB).map(f => <option key={f} value={f} />)}
                </datalist>
              </div>
              <input type="number" min={0.5} max={5} step={0.5} value={extraQty} onChange={e => setExtraQty(e.target.value)}
                style={{ width: 70, background: '#21253a', border: '1px solid #2d3148', borderRadius: 10, padding: '10px 10px', color: '#f1f5f9', fontSize: 14, outline: 'none' }} />
              <button onClick={addExtra}
                style={{ background: '#4ade80', border: 'none', borderRadius: 10, padding: '10px 16px', color: '#000', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Add</button>
            </div>

            {extraFoods.map((f, i) => {
              const db = FOOD_DB[f.name] || {}
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#21253a', borderRadius: 10, padding: '10px 14px', marginBottom: 6 }}>
                  <div>
                    <div style={{ color: '#f1f5f9', fontSize: 14 }}>{f.name} <span style={{ color: '#475569' }}>×{f.quantity}</span></div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{Math.round((db.cal||0)*f.quantity)} kcal • {Math.round((db.protein||0)*f.quantity)}g protein</div>
                  </div>
                  <button onClick={() => removeExtra(i)} style={{ background: '#f8717122', border: 'none', borderRadius: 6, padding: '4px 10px', color: '#f87171', cursor: 'pointer', fontSize: 12 }}>✕</button>
                </div>
              )
            })}
          </Card>

          <button onClick={saveLog} disabled={saving}
            style={{ width: '100%', background: saved ? '#4ade80' : saving ? '#2d3148' : 'linear-gradient(135deg, #4ade80, #22c55e)', border: 'none', borderRadius: 12, padding: 16, color: saved ? '#000' : saving ? '#94a3b8' : '#000', fontSize: 16, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saved ? '✓ Saved!' : saving ? 'Saving...' : '💾 Save Today\'s Log'}
          </button>
        </div>

        {/* Right — nutrition summary */}
        <div>
          <Card style={{ marginBottom: 16, position: 'sticky', top: 28 }}>
            <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>📊 Today's Nutrition</div>

            {[
              ['Calories', nutrition.calories, targets.calories, 'kcal', '#60a5fa'],
              ['Protein', nutrition.protein, targets.protein, 'g', '#4ade80'],
              ['Carbs', nutrition.carbs, targets.carbs, 'g', '#fb923c'],
              ['Fat', nutrition.fat, targets.fat, 'g', '#a78bfa'],
              ['Fiber', nutrition.fiber, 25, 'g', '#facc15'],
            ].map(([label, val, max, unit, color]) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>{label}</span>
                  <span style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 600 }}>{val}<span style={{ color: '#475569' }}>/{max}{unit}</span></span>
                </div>
                <div style={{ background: '#2d3148', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(val/max*100,100)}%`, background: color, height: '100%', borderRadius: 99, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}

            {/* Gap summary */}
            <div style={{ background: '#21253a', borderRadius: 12, padding: 14, marginTop: 8 }}>
              <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 13, marginBottom: 8 }}>⚡ Remaining Gaps</div>
              {nutrition.calories < targets.calories && <div style={{ color: '#60a5fa', fontSize: 13, marginBottom: 4 }}>🔥 {targets.calories - nutrition.calories} kcal needed</div>}
              {nutrition.protein < targets.protein && <div style={{ color: '#4ade80', fontSize: 13, marginBottom: 4 }}>💪 {targets.protein - nutrition.protein}g protein needed</div>}
              {nutrition.calories >= targets.calories && nutrition.protein >= targets.protein && (
                <div style={{ color: '#4ade80', fontSize: 13 }}>🎉 All goals hit for today!</div>
              )}
            </div>

            {/* Logged items */}
            {allFoods.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 13, marginBottom: 8 }}>📋 Logged Items ({allFoods.length})</div>
                {allFoods.map((f, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{f.name}</span>
                    <span style={{ color: '#475569', fontSize: 12 }}>{FOOD_DB[f.name]?.cal || '?'} kcal</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
