import { supabase } from '../lib/supabase'

const navItems = [
  { id: 'dashboard', icon: '⊞', label: 'Dashboard' },
  { id: 'daily', icon: '📅', label: 'Daily Log' },
  { id: 'gaps', icon: '⚡', label: 'AI Planner' },
  { id: 'swaps', icon: '↔', label: 'Swaps' },
  { id: 'analytics', icon: '📊', label: 'Analytics' },
]

export default function Sidebar({ active, setPage, profile }) {
  const signOut = async () => await supabase.auth.signOut()

  return (
    <div style={{ width: 220, background: '#1a1d27', borderRight: '1px solid #2d3148', height: '100vh', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #2d3148' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 28 }}>🥗</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#f1f5f9' }}>NutriMess</div>
            <div style={{ fontSize: 11, color: '#4ade80' }}>Smart Nutrition</div>
          </div>
        </div>
      </div>

      {/* Profile */}
      {profile && (
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2d3148' }}>
          <div style={{ width: 40, height: 40, borderRadius: 99, background: 'linear-gradient(135deg, #4ade80, #60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 8 }}>
            {profile.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 14 }}>{profile.name}</div>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>{profile.goal === 'muscle' ? '💪 Build Muscle' : profile.goal === 'lose' ? '🔥 Lose Weight' : '🌟 Stay Healthy'}</div>
          {profile.has_pcos && <div style={{ fontSize: 11, color: '#a78bfa', marginTop: 2 }}>PCOS aware plan</div>}
          {profile.goes_to_gym && <div style={{ fontSize: 11, color: '#fb923c', marginTop: 2 }}>🏋️ Gym mode on</div>}
        </div>
      )}

      {/* Nav */}
      <div style={{ flex: 1, padding: '12px 12px' }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setPage(item.id)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, background: active === item.id ? '#4ade8022' : 'transparent', border: active === item.id ? '1px solid #4ade8033' : '1px solid transparent', borderRadius: 10, padding: '11px 14px', cursor: 'pointer', color: active === item.id ? '#4ade80' : '#94a3b8', fontWeight: active === item.id ? 700 : 400, fontSize: 14, marginBottom: 4, textAlign: 'left', transition: 'all 0.2s' }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Sign out */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid #2d3148' }}>
        <button onClick={signOut}
          style={{ width: '100%', background: 'transparent', border: '1px solid #2d3148', borderRadius: 10, padding: '10px 14px', color: '#94a3b8', cursor: 'pointer', fontSize: 14, textAlign: 'left' }}>
          🚪 Sign Out
        </button>
      </div>
    </div>
  )
}
