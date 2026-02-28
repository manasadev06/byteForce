import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { calculateTargets } from '../lib/nutrition'

function Card({ children, style = {} }) {
  return <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 24, ...style }}>{children}</div>
}

function InfoRow({ label, value, icon }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>{label}</span>
      </div>
      <span style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700 }}>{value || '—'}</span>
    </div>
  )
}

export default function Profile({ profile, user, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ ...profile })

  const targets = calculateTargets(profile)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleAllergy = (a) => setForm(f => ({
    ...f, allergies: (f.allergies || []).includes(a)
      ? f.allergies.filter(x => x !== a)
      : [...(f.allergies || []), a]
  }))

  const saveProfile = async () => {
    setSaving(true); setError('')
    try {
      const { error } = await supabase.from('profiles').update({
        ...form,
        age: parseInt(form.age),
        weight: parseInt(form.weight),
        height: parseInt(form.height)
      }).eq('id', user.id)
      if (error) throw error
      setSaved(true)
      setEditing(false)
      onUpdate()
      setTimeout(() => setSaved(false), 2000)
    } catch (e) { setError(e.message) }
    setSaving(false)
  }

  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '12px 16px', color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
  const labelStyle = { color: 'var(--text-muted)', fontSize: 12, marginBottom: 8, display: 'block', fontWeight: 600 }
  const cardBtn = (active, color = 'var(--accent-green)') => ({
    display: 'flex', alignItems: 'center', gap: 10,
    background: active ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255,255,255,0.03)',
    border: `2px solid ${active ? 'var(--accent-green)' : 'transparent'}`,
    borderRadius: 12, padding: '12px 16px', cursor: 'pointer',
    color: active ? 'var(--text-primary)' : 'var(--text-muted)', width: '100%', marginBottom: 8, fontSize: 13, fontWeight: active ? 700 : 500, transition: 'all 0.2s'
  })

  const goalLabel = { muscle: '💪 Build Muscle', lose: '🔥 Lose Weight', healthy: '🌟 Stay Healthy', energy: '⚡ Boost Energy' }
  const dietLabel = { veg: '🥦 Vegetarian', nonveg: '🍗 Non-Vegetarian', vegan: '🌱 Vegan', eggetarian: '🥚 Eggetarian' }
  const joinedDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

  return (
    <div style={{ padding: '40px', overflowY: 'auto', height: '100vh', background: 'var(--bg-color)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)' }}>My Profile 👤</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Manage your personal details and nutrition goals</div>
        </div>
        <button onClick={() => { setEditing(!editing); setForm({ ...profile }) }}
          style={{ 
            background: editing ? 'rgba(248, 113, 113, 0.1)' : 'rgba(74, 222, 128, 0.1)', 
            border: `1px solid ${editing ? '#f87171' : 'var(--accent-green)'}`, 
            borderRadius: 12, 
            padding: '10px 24px', 
            color: editing ? '#f87171' : 'var(--accent-green)', 
            fontWeight: 800, 
            cursor: 'pointer', 
            fontSize: 14,
            transition: 'all 0.2s'
          }}>
          {editing ? '✕ Cancel' : '✏️ Edit Profile'}
        </button>
      </div>

      {error && <div style={{ background: 'rgba(248, 113, 113, 0.1)', border: '1px solid #f87171', borderRadius: 12, padding: '12px 20px', color: '#f87171', fontSize: 14, marginBottom: 20 }}>{error}</div>}
      {saved && <div style={{ background: 'rgba(74, 222, 128, 0.1)', border: '1px solid var(--accent-green)', borderRadius: 12, padding: '12px 20px', color: 'var(--accent-green)', fontSize: 14, marginBottom: 20 }}>✓ Profile updated successfully!</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* Left column */}
        <div>
          {/* Avatar + account info */}
          <Card style={{ marginBottom: 24, textAlign: 'center', background: 'linear-gradient(135deg, #1e293b, var(--card-bg))' }}>
            <div style={{ 
              width: 80, 
              height: 80, 
              borderRadius: 24, 
              background: 'linear-gradient(135deg, var(--accent-green), #60a5fa)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: 36, 
              fontWeight: 900,
              color: '#000',
              margin: '0 auto 16px',
              boxShadow: '0 8px 20px -4px rgba(74, 222, 128, 0.3)'
            }}>
              {profile?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)' }}>{profile?.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{user?.email}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              {profile?.goes_to_gym && <span style={{ background: 'rgba(251, 146, 60, 0.1)', color: '#fb923c', padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 800 }}>🏋️ GYM MODE</span>}
              {profile?.has_pcos && <span style={{ background: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa', padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 800 }}>🩺 PCOS AWARE</span>}
              <span style={{ background: 'rgba(74, 222, 128, 0.1)', color: 'var(--accent-green)', padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 800 }}>{dietLabel[profile?.diet]?.toUpperCase()}</span>
            </div>
          </Card>

          {/* Account info */}
          <Card style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>🔐 Account Details</div>
            <InfoRow icon="📧" label="Email Address" value={user?.email} />
            <InfoRow icon="📅" label="Member Since" value={joinedDate} />
            <InfoRow icon="🎯" label="Current Goal" value={goalLabel[profile?.goal]} />
            <InfoRow icon="🥗" label="Dietary Preference" value={dietLabel[profile?.diet]} />
            <InfoRow icon="⚠️" label="Food Allergies" value={profile?.allergies?.length ? profile.allergies.join(', ') : 'None'} />
          </Card>

          {/* Personal stats */}
          {!editing && (
            <Card>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>📋 Physical Profile</div>
              <InfoRow icon="🎂" label="Age" value={`${profile?.age} years`} />
              <InfoRow icon="⚖️" label="Current Weight" value={`${profile?.weight} kg`} />
              <InfoRow icon="📏" label="Height" value={`${profile?.height} cm`} />
              <InfoRow icon="👤" label="Gender" value={profile?.gender?.charAt(0).toUpperCase() + profile?.gender?.slice(1)} />
              <InfoRow icon="📈" label="Calculated BMI" value={profile?.weight && profile?.height ? (profile.weight / ((profile.height / 100) ** 2)).toFixed(1) : '—'} />
            </Card>
          )}

          {/* Edit form */}
          {editing && (
            <Card>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 24 }}>✏️ Update Your Information</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div><label style={labelStyle}>Age</label><input style={inputStyle} type="number" value={form.age} onChange={e => set('age', e.target.value)} /></div>
                  <div><label style={labelStyle}>Weight (kg)</label><input style={inputStyle} type="number" value={form.weight} onChange={e => set('weight', e.target.value)} /></div>
                  <div><label style={labelStyle}>Height (cm)</label><input style={inputStyle} type="number" value={form.height} onChange={e => set('height', e.target.value)} /></div>
                </div>

                <div>
                  <label style={labelStyle}>Gender</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[['male', '👦', 'Male'], ['female', '👧', 'Female'], ['other', '🧑', 'Other']].map(([v, e, l]) => (
                      <button key={v} onClick={() => set('gender', v)}
                        style={{ 
                          flex: 1, 
                          background: form.gender === v ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255,255,255,0.03)', 
                          border: `2px solid ${form.gender === v ? 'var(--accent-green)' : 'transparent'}`, 
                          borderRadius: 12, 
                          padding: '12px 0', 
                          color: form.gender === v ? 'var(--text-primary)' : 'var(--text-muted)', 
                          cursor: 'pointer', 
                          fontSize: 13,
                          fontWeight: form.gender === v ? 700 : 500,
                          transition: 'all 0.2s'
                        }}>
                        {e} {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Nutrition Goal</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[['muscle', '💪', 'Build Muscle'], ['lose', '🔥', 'Lose Weight'], ['healthy', '🌟', 'Stay Healthy'], ['energy', '⚡', 'Boost Energy']].map(([v, e, l]) => (
                      <button key={v} onClick={() => set('goal', v)} style={cardBtn(form.goal === v, '#60a5fa')}>
                        <span>{e} {l}</span>
                        {form.goal === v && <span style={{ marginLeft: 'auto' }}>✓</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Dietary Preference</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[['veg', '🥦', 'Vegetarian'], ['nonveg', '🍗', 'Non-Vegetarian'], ['vegan', '🌱', 'Vegan'], ['eggetarian', '🥚', 'Eggetarian']].map(([v, e, l]) => (
                      <button key={v} onClick={() => set('diet', v)} style={cardBtn(form.diet === v)}>
                        <span>{e} {l}</span>
                        {form.diet === v && <span style={{ marginLeft: 'auto' }}>✓</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Additional Settings</label>
                  <button onClick={() => set('goes_to_gym', !form.goes_to_gym)} style={cardBtn(form.goes_to_gym, '#fb923c')}>
                    <span>🏋️ Goes to Gym Regularly</span>
                    {form.goes_to_gym && <span style={{ marginLeft: 'auto' }}>✓</span>}
                  </button>
                  {form.gender === 'female' && (
                    <button onClick={() => set('has_pcos', !form.has_pcos)} style={cardBtn(form.has_pcos, '#a78bfa')}>
                      <span>🩺 Manage PCOS/PCOD</span>
                      {form.has_pcos && <span style={{ marginLeft: 'auto' }}>✓</span>}
                    </button>
                  )}
                </div>

                <div>
                  <label style={labelStyle}>Known Allergies</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {['Gluten', 'Dairy', 'Nuts', 'Eggs', 'Soy', 'Shellfish'].map(a => (
                      <button key={a} onClick={() => toggleAllergy(a)}
                        style={{ 
                          background: (form.allergies || []).includes(a) ? 'rgba(248, 113, 113, 0.1)' : 'rgba(255,255,255,0.03)', 
                          border: `1px solid ${(form.allergies || []).includes(a) ? '#f87171' : 'var(--border-color)'}`, 
                          borderRadius: 10, 
                          padding: '8px 16px', 
                          color: (form.allergies || []).includes(a) ? '#f87171' : 'var(--text-muted)', 
                          cursor: 'pointer', 
                          fontSize: 12,
                          fontWeight: 700,
                          transition: 'all 0.2s'
                        }}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button onClick={saveProfile} disabled={saving}
                style={{ 
                  width: '100%', 
                  background: 'var(--accent-green)', 
                  border: 'none', 
                  borderRadius: 14, 
                  padding: '16px', 
                  color: '#000', 
                  fontSize: 15, 
                  fontWeight: 900, 
                  cursor: saving ? 'not-allowed' : 'pointer', 
                  marginTop: 32,
                  boxShadow: '0 8px 20px -4px rgba(74, 222, 128, 0.3)',
                  transition: 'all 0.2s',
                  opacity: saving ? 0.7 : 1
                }}>
                {saving ? 'SAVING CHANGES...' : '💾 SAVE PROFILE'}
              </button>
            </Card>
          )}
        </div>

        {/* Right column — nutrition targets */}
        <div>
          <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #1e293b, var(--card-bg))' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>🎯 DAILY TARGETS</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Personalized nutrition based on your BMR + activity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['Calories', `${targets.calories} kcal`, '#60a5fa', '🔥'],
                ['Protein', `${targets.protein} g`, 'var(--accent-green)', '💪'],
                ['Carbohydrates', `${targets.carbs} g`, '#fb923c', '🍞'],
                ['Fat', `${targets.fat} g`, '#a78bfa', '🫒'],
                ['Fiber', '25 g', '#facc15', '🌿'],
              ].map(([label, val, color, icon]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '16px 20px', border: '1px solid rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>{icon}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 600 }}>{label}</span>
                  </div>
                  <span style={{ color, fontWeight: 900, fontSize: 18 }}>{val}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* BMR breakdown */}
          <Card style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>🧮 Calculation Logic</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                ['Formula', profile?.gender === 'female' ? 'Mifflin-St Jeor (Female)' : 'Mifflin-St Jeor (Male)'],
                ['Activity Multiplier', profile?.goes_to_gym ? '1.55 (Moderately Active)' : '1.375 (Lightly Active)'],
                ['Goal Offset', profile?.goal === 'muscle' ? '+200 kcal surplus' : profile?.goal === 'lose' ? '-300 kcal deficit' : 'Maintenance (0 offset)'],
                profile?.has_pcos ? ['PCOS Buffer', '-5% calorie adjustment'] : null,
              ].filter(Boolean).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>{k}</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Health indicators */}
          <Card>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>📊 Health Metrics</div>
            {(() => {
              const bmi = profile?.weight && profile?.height
                ? (profile.weight / ((profile.height / 100) ** 2)).toFixed(1)
                : null
              const bmiCategory = bmi < 18.5 ? ['Underweight', '#60a5fa'] : bmi < 25 ? ['Normal', 'var(--accent-green)'] : bmi < 30 ? ['Overweight', '#facc15'] : ['Obese', '#f87171']
              const ibw = profile?.gender === 'female'
                ? (45.5 + 2.3 * ((profile?.height - 152.4) / 2.54)).toFixed(1)
                : (50 + 2.3 * ((profile?.height - 152.4) / 2.54)).toFixed(1)
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '16px 20px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>⚖️ BMI</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: bmiCategory[1], fontWeight: 900, fontSize: 18 }}>{bmi}</span>
                      <div style={{ color: bmiCategory[1], fontSize: 11, fontWeight: 800, marginTop: 2 }}>{bmiCategory[0].toUpperCase()}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '16px 20px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>🎯 Ideal Weight</span>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 900, fontSize: 18 }}>{ibw} kg</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '16px 20px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>💧 Water Target</span>
                    <span style={{ color: '#60a5fa', fontWeight: 900, fontSize: 18 }}>{(profile?.weight * 0.033).toFixed(1)} L</span>
                  </div>
                </div>
              )
            })()}
          </Card>
        </div>
      </div>
    </div>
  )
}