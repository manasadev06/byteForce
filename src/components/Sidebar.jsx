import { supabase } from '../lib/supabase'

const navItems = [
  { id: 'dashboard', icon: '⊞', label: 'Dashboard' },
  { id: 'daily', icon: '📅', label: 'Daily Log' },
  { id: 'gaps', icon: '⚡', label: 'AI Planner' },
  { id: 'swaps', icon: '↔', label: 'Swaps' },
  { id: 'analytics', icon: '📊', label: 'Analytics' },
  { id: 'profile', icon: '👤', label: 'Profile' },
]

export default function Sidebar({ active, setPage, profile }) {
  const signOut = async () => await supabase.auth.signOut()

  return (
    <div style={{ 
      width: 240, 
      background: 'var(--card-bg)', 
      borderRight: '1px solid var(--border-color)', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      position: 'fixed', 
      left: 0, 
      top: 0, 
      zIndex: 100 
    }}>
      {/* Logo */}
      <div style={{ padding: '32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 32 }}>🥗</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>NutriMess</div>
            <div style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 600 }}>Smart Nutrition</div>
          </div>
        </div>
      </div>

      {/* Profile preview */}
      {profile && (
        <div style={{ 
          margin: '0 16px 24px', 
          padding: '16px', 
          background: 'rgba(255,255,255,0.03)', 
          borderRadius: 16, 
          cursor: 'pointer',
          border: '1px solid var(--border-color)'
        }} onClick={() => setPage('profile')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 12, 
              background: 'linear-gradient(135deg, var(--accent-green), #60a5fa)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: 18, 
              fontWeight: 800,
              color: '#000',
              flexShrink: 0 
            }}>
              {profile.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{profile.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                {profile.goal === 'muscle' ? '💪 Build Muscle' : profile.goal === 'lose' ? '🔥 Lose Weight' : '🌟 Stay Healthy'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav items */}
      <div style={{ flex: 1, padding: '0 16px' }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setPage(item.id)}
            style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              background: active === item.id ? 'var(--accent-green)' : 'transparent', 
              border: 'none', 
              borderRadius: 12, 
              padding: '12px 16px', 
              cursor: 'pointer', 
              color: active === item.id ? '#000' : 'var(--text-muted)', 
              fontWeight: active === item.id ? 700 : 500, 
              fontSize: 14, 
              marginBottom: 8, 
              textAlign: 'left', 
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: active === item.id ? '0 4px 12px rgba(74, 222, 128, 0.2)' : 'none'
            }}>
            <span style={{ fontSize: 20, opacity: active === item.id ? 1 : 0.7 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Sign out */}
      <div style={{ padding: '24px 16px' }}>
        <button onClick={signOut}
          style={{ 
            width: '100%', 
            background: 'transparent', 
            border: '1px solid var(--border-color)', 
            borderRadius: 12, 
            padding: '12px 16px', 
            color: 'var(--text-muted)', 
            cursor: 'pointer', 
            fontSize: 14, 
            textAlign: 'left',
            fontWeight: 500,
            transition: 'all 0.2s'
          }}>
          🚪 Sign Out
        </button>
      </div>
    </div>
  )
}