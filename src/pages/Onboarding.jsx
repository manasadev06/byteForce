import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { FOOD_DB } from '../lib/nutrition'

const steps = ['Personal Info', 'Health Goals', 'Diet & Allergies', 'Mess Menu']

export default function Onboarding({ user, onComplete }) {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', age: '', weight: '', height: '', gender: '',
    goal: '', goes_to_gym: false, has_pcos: false,
    diet: '', allergies: [], mess_menu: { breakfast: [], lunch: [], dinner: [] }
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleAllergy = (a) => setForm(f => ({ ...f, allergies: f.allergies.includes(a) ? f.allergies.filter(x => x !== a) : [...f.allergies, a] }))
  const toggleMessItem = (meal, item) => setForm(f => {
    const items = f.mess_menu[meal]
    return { ...f, mess_menu: { ...f.mess_menu, [meal]: items.includes(item) ? items.filter(x => x !== item) : [...items, item] } }
  })

  const submit = async () => {
    setLoading(true); setError('')
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id, ...form,
        age: parseInt(form.age), weight: parseInt(form.weight), height: parseInt(form.height)
      })
      if (error) throw error
      onComplete()
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  const inputStyle = { width: '100%', background: '#21253a', border: '1px solid #2d3148', borderRadius: 10, padding: '11px 14px', color: '#f1f5f9', fontSize: 15, outline: 'none', boxSizing: 'border-box' }
  const labelStyle = { color: '#94a3b8', fontSize: 13, marginBottom: 6, display: 'block' }
  const cardBtnStyle = (active, color = '#4ade80') => ({
    display: 'flex', alignItems: 'center', gap: 12, background: active ? `${color}22` : '#21253a',
    border: `2px solid ${active ? color : 'transparent'}`, borderRadius: 12, padding: '13px 16px',
    cursor: 'pointer', color: '#f1f5f9', textAlign: 'left', width: '100%', marginBottom: 8
  })

  const foodItems = Object.keys(FOOD_DB)

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        {/* Progress */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {steps.map((_, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i <= step ? '#4ade80' : '#2d3148', transition: 'background 0.3s' }} />)}
          </div>
          <div style={{ color: '#94a3b8', fontSize: 13 }}>Step {step + 1} of {steps.length}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginTop: 2 }}>{steps[step]}</div>
        </div>

        <div style={{ background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 20, padding: 28 }}>
          {error && <div style={{ background: '#f8717122', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 13, marginBottom: 16 }}>{error}</div>}

          {/* Step 0 — Personal Info */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input style={inputStyle} placeholder="Your name" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Age</label><input style={inputStyle} type="number" placeholder="20" value={form.age} onChange={e => set('age', e.target.value)} /></div>
                <div><label style={labelStyle}>Weight (kg)</label><input style={inputStyle} type="number" placeholder="60" value={form.weight} onChange={e => set('weight', e.target.value)} /></div>
                <div><label style={labelStyle}>Height (cm)</label><input style={inputStyle} type="number" placeholder="165" value={form.height} onChange={e => set('height', e.target.value)} /></div>
              </div>
              <div>
                <label style={labelStyle}>Gender</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[['male', '👦', 'Male'], ['female', '👧', 'Female'], ['other', '🧑', 'Other']].map(([v, e, l]) => (
                    <button key={v} onClick={() => set('gender', v)} style={cardBtnStyle(form.gender === v)}>
                      <span style={{ fontSize: 20 }}>{e}</span> {l}
                      {form.gender === v && <span style={{ marginLeft: 'auto', color: '#4ade80' }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 1 — Health Goals */}
          {step === 1 && (
            <div>
              <label style={labelStyle}>Health Goal</label>
              {[['muscle', '💪', 'Build Muscle', 'High protein focus'], ['lose', '🔥', 'Lose Weight', 'Calorie deficit plan'], ['healthy', '🌟', 'Stay Healthy', 'Balanced nutrition'], ['energy', '⚡', 'Boost Energy', 'Carb + iron focus']].map(([v, e, l, s]) => (
                <button key={v} onClick={() => set('goal', v)} style={cardBtnStyle(form.goal === v, '#60a5fa')}>
                  <span style={{ fontSize: 22 }}>{e}</span>
                  <div><div style={{ fontWeight: 600 }}>{l}</div><div style={{ fontSize: 12, color: '#94a3b8' }}>{s}</div></div>
                  {form.goal === v && <span style={{ marginLeft: 'auto', color: '#60a5fa' }}>✓</span>}
                </button>
              ))}

              <div style={{ marginTop: 16 }}>
                <label style={labelStyle}>Lifestyle</label>
                <button onClick={() => set('goes_to_gym', !form.goes_to_gym)} style={cardBtnStyle(form.goes_to_gym, '#fb923c')}>
                  <span style={{ fontSize: 22 }}>🏋️</span>
                  <div><div style={{ fontWeight: 600 }}>I go to the gym</div><div style={{ fontSize: 12, color: '#94a3b8' }}>Higher calorie & protein targets</div></div>
                  {form.goes_to_gym && <span style={{ marginLeft: 'auto', color: '#fb923c' }}>✓</span>}
                </button>
              </div>

              {form.gender === 'female' && (
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => set('has_pcos', !form.has_pcos)} style={cardBtnStyle(form.has_pcos, '#a78bfa')}>
                    <span style={{ fontSize: 22 }}>🩺</span>
                    <div><div style={{ fontWeight: 600 }}>I have PCOS/PCOD</div><div style={{ fontSize: 12, color: '#94a3b8' }}>Adjusted nutrition recommendations</div></div>
                    {form.has_pcos && <span style={{ marginLeft: 'auto', color: '#a78bfa' }}>✓</span>}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Diet & Allergies */}
          {step === 2 && (
            <div>
              <label style={labelStyle}>Diet Type</label>
              {[['veg', '🥦', 'Vegetarian'], ['nonveg', '🍗', 'Non-Vegetarian'], ['vegan', '🌱', 'Vegan'], ['eggetarian', '🥚', 'Eggetarian']].map(([v, e, l]) => (
                <button key={v} onClick={() => set('diet', v)} style={cardBtnStyle(form.diet === v)}>
                  <span style={{ fontSize: 22 }}>{e}</span> {l}
                  {form.diet === v && <span style={{ marginLeft: 'auto', color: '#4ade80' }}>✓</span>}
                </button>
              ))}

              <label style={{ ...labelStyle, marginTop: 16 }}>Allergies (select all that apply)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Gluten', 'Dairy', 'Nuts', 'Eggs', 'Soy', 'Shellfish'].map(a => (
                  <button key={a} onClick={() => toggleAllergy(a)}
                    style={{ background: form.allergies.includes(a) ? '#f8717122' : '#21253a', border: `1px solid ${form.allergies.includes(a) ? '#f87171' : '#2d3148'}`, borderRadius: 8, padding: '6px 14px', color: form.allergies.includes(a) ? '#f87171' : '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Mess Menu */}
          {step === 3 && (
            <div>
              <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>Select dishes available in your hostel mess for each meal</div>
              {['breakfast', 'lunch', 'dinner'].map(meal => (
                <div key={meal} style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 8, textTransform: 'capitalize', fontSize: 15 }}>
                    {meal === 'breakfast' ? '☀️' : meal === 'lunch' ? '🌤' : '🌙'} {meal}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {foodItems.map(item => {
                      const selected = form.mess_menu[meal].includes(item)
                      return (
                        <button key={item} onClick={() => toggleMessItem(meal, item)}
                          style={{ background: selected ? '#4ade8022' : '#21253a', border: `1px solid ${selected ? '#4ade80' : '#2d3148'}`, borderRadius: 8, padding: '5px 10px', color: selected ? '#4ade80' : '#94a3b8', cursor: 'pointer', fontSize: 12, fontWeight: selected ? 600 : 400 }}>
                          {selected ? '✓ ' : ''}{item}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          {step > 0 && <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 12, padding: 14, color: '#94a3b8', fontSize: 15, cursor: 'pointer' }}>← Back</button>}
          <button onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : submit()} disabled={loading}
            style={{ flex: 2, background: loading ? '#2d3148' : 'linear-gradient(135deg, #4ade80, #22c55e)', border: 'none', borderRadius: 12, padding: 14, color: loading ? '#94a3b8' : '#000', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Saving...' : step < steps.length - 1 ? 'Continue →' : "Let's Go! 🚀"}
          </button>
        </div>
      </div>
    </div>
  )
}
