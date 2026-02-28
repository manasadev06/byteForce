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

  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '14px 16px', color: 'var(--text-primary)', fontSize: 15, outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }
  const labelStyle = { color: 'var(--text-muted)', fontSize: 13, marginBottom: 8, display: 'block', fontWeight: 600 }
  const cardBtnStyle = (active, color = 'var(--accent-green)') => ({
    display: 'flex', alignItems: 'center', gap: 12, background: active ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255,255,255,0.03)',
    border: `2px solid ${active ? 'var(--accent-green)' : 'transparent'}`, borderRadius: 14, padding: '16px',
    cursor: 'pointer', color: 'var(--text-primary)', textAlign: 'left', width: '100%', marginBottom: 12, transition: 'all 0.2s', fontWeight: active ? 700 : 500
  })

  const foodItems = Object.keys(FOOD_DB)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        {/* Progress */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {steps.map((_, i) => <div key={i} style={{ flex: 1, height: 6, borderRadius: 99, background: i <= step ? 'var(--accent-green)' : 'var(--border-color)', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />)}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 700, letterSpacing: '0.05em' }}>STEP {step + 1} OF {steps.length}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', marginTop: 8 }}>{steps[step]}</div>
        </div>

        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 24, padding: '40px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
          {error && <div style={{ background: 'rgba(248, 113, 113, 0.1)', border: '1px solid #f87171', borderRadius: 12, padding: '12px 16px', color: '#f87171', fontSize: 14, marginBottom: 24, fontWeight: 600 }}>{error}</div>}

          {/* Step 0 — Personal Info */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>FULL NAME</label>
                <input style={inputStyle} placeholder="Your name" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>AGE</label><input style={inputStyle} type="number" placeholder="20" value={form.age} onChange={e => set('age', e.target.value)} /></div>
                <div><label style={labelStyle}>WEIGHT (KG)</label><input style={inputStyle} type="number" placeholder="60" value={form.weight} onChange={e => set('weight', e.target.value)} /></div>
                <div><label style={labelStyle}>HEIGHT (CM)</label><input style={inputStyle} type="number" placeholder="165" value={form.height} onChange={e => set('height', e.target.value)} /></div>
              </div>
              <div>
                <label style={labelStyle}>GENDER</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[['male', '👦', 'Male'], ['female', '👧', 'Female'], ['other', '🧑', 'Other']].map(([v, e, l]) => (
                    <button key={v} onClick={() => set('gender', v)} style={cardBtnStyle(form.gender === v)}>
                      <span style={{ fontSize: 22 }}>{e}</span> {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 1 — Health Goals */}
          {step === 1 && (
            <div>
              <label style={labelStyle}>WHAT'S YOUR PRIMARY GOAL?</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[['muscle', '💪', 'Build Muscle', 'Focus on high protein & progressive overload'], ['lose', '🔥', 'Lose Weight', 'Healthy calorie deficit & fat loss'], ['healthy', '🌟', 'Stay Healthy', 'Balanced macros for maintenance'], ['energy', '⚡', 'Boost Energy', 'Complex carbs & essential micronutrients']].map(([v, e, l, s]) => (
                  <button key={v} onClick={() => set('goal', v)} style={cardBtnStyle(form.goal === v, '#60a5fa')}>
                    <span style={{ fontSize: 24 }}>{e}</span>
                    <div><div style={{ fontWeight: 800, fontSize: 16 }}>{l}</div><div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s}</div></div>
                    {form.goal === v && <span style={{ marginLeft: 'auto', color: '#60a5fa', fontWeight: 900 }}>✓</span>}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 24, padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 15 }}>🏋️ Regular Exercise</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Do you go to the gym 3+ times a week?</div>
                  </div>
                  <button onClick={() => set('goes_to_gym', !form.goes_to_gym)}
                    style={{ 
                      width: 48, height: 26, borderRadius: 99, 
                      background: form.goes_to_gym ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)', 
                      border: 'none', position: 'relative', cursor: 'pointer', transition: 'all 0.2s' 
                    }}>
                    <div style={{ width: 18, height: 18, background: '#fff', borderRadius: 99, position: 'absolute', top: 4, left: form.goes_to_gym ? 26 : 4, transition: 'all 0.2s' }} />
                  </button>
                </div>
              </div>

              {form.gender === 'female' && (
                <div style={{ marginTop: 12, padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 15 }}>🩺 PCOS/PCOD Aware</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Tailored nutrition for hormone balance</div>
                    </div>
                    <button onClick={() => set('has_pcos', !form.has_pcos)}
                      style={{ 
                        width: 48, height: 26, borderRadius: 99, 
                        background: form.has_pcos ? '#a78bfa' : 'rgba(255,255,255,0.1)', 
                        border: 'none', position: 'relative', cursor: 'pointer', transition: 'all 0.2s' 
                      }}>
                      <div style={{ width: 18, height: 18, background: '#fff', borderRadius: 99, position: 'absolute', top: 4, left: form.has_pcos ? 26 : 4, transition: 'all 0.2s' }} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Diet & Allergies */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <label style={labelStyle}>DIETARY PREFERENCE</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[['veg', '🥦', 'Vegetarian'], ['nonveg', '🍗', 'Non-Veg'], ['vegan', '🌱', 'Vegan'], ['eggetarian', '🥚', 'Eggetarian']].map(([v, e, l]) => (
                    <button key={v} onClick={() => set('diet', v)} style={cardBtnStyle(form.diet === v)}>
                      <span style={{ fontSize: 22 }}>{e}</span> {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>ANY ALLERGIES?</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {['Gluten', 'Dairy', 'Nuts', 'Eggs', 'Soy', 'Shellfish'].map(a => (
                    <button key={a} onClick={() => toggleAllergy(a)}
                      style={{ 
                        background: form.allergies.includes(a) ? 'rgba(248, 113, 113, 0.1)' : 'rgba(255,255,255,0.03)', 
                        border: `1px solid ${form.allergies.includes(a) ? '#f87171' : 'var(--border-color)'}`, 
                        borderRadius: 12, 
                        padding: '10px 20px', 
                        color: form.allergies.includes(a) ? '#f87171' : 'var(--text-muted)', 
                        cursor: 'pointer', 
                        fontSize: 14,
                        fontWeight: 700,
                        transition: 'all 0.2s'
                      }}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Mess Menu */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 20 }}>🍽️</div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 18, marginBottom: 12 }}>Almost there!</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
                You can set up your daily hostel mess menu in the <b>Daily Log</b> section later. This helps you log meals with a single tap!
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} 
              style={{ 
                flex: 1, 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid var(--border-color)', 
                borderRadius: 14, 
                padding: '16px', 
                color: 'var(--text-muted)', 
                fontSize: 15, 
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
              ← BACK
            </button>
          )}
          <button onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : submit()} disabled={loading}
            style={{ 
              flex: 2, 
              background: loading ? 'var(--border-color)' : 'var(--accent-green)', 
              border: 'none', 
              borderRadius: 14, 
              padding: '16px', 
              color: '#000', 
              fontSize: 15, 
              fontWeight: 900, 
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 10px 15px -3px rgba(74, 222, 128, 0.2)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
            {loading ? 'SAVING...' : step < steps.length - 1 ? 'CONTINUE →' : "COMPLETE SETUP 🚀"}
          </button>
        </div>
      </div>
    </div>
  )
}
