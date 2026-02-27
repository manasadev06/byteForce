import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handle = async () => {
    setLoading(true); setError(''); setMessage('')
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('Check your email to confirm your account!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🥗</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#f1f5f9' }}>NutriMess</div>
          <div style={{ color: '#94a3b8', marginTop: 4 }}>Smart nutrition for hostel students</div>
        </div>

        {/* Card */}
        <div style={{ background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 20, padding: 32 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', marginBottom: 24 }}>
            {isSignup ? 'Create your account' : 'Welcome back!'}
          </div>

          {error && <div style={{ background: '#f8717122', border: '1px solid #f8717144', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 13, marginBottom: 16 }}>{error}</div>}
          {message && <div style={{ background: '#4ade8022', border: '1px solid #4ade8044', borderRadius: 10, padding: '10px 14px', color: '#4ade80', fontSize: 13, marginBottom: 16 }}>{message}</div>}

          <div style={{ marginBottom: 14 }}>
            <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 6 }}>Email</div>
            <input type="email" placeholder="student@college.edu" value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', background: '#21253a', border: '1px solid #2d3148', borderRadius: 10, padding: '12px 14px', color: '#f1f5f9', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 6 }}>Password</div>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handle()}
              style={{ width: '100%', background: '#21253a', border: '1px solid #2d3148', borderRadius: 10, padding: '12px 14px', color: '#f1f5f9', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <button onClick={handle} disabled={loading}
            style={{ width: '100%', background: loading ? '#2d3148' : 'linear-gradient(135deg, #4ade80, #22c55e)', border: 'none', borderRadius: 12, padding: 14, color: loading ? '#94a3b8' : '#000', fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
            {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 20, color: '#94a3b8', fontSize: 14 }}>
            {isSignup ? 'Already have an account?' : "Don't have an account?"}
            <button onClick={() => { setIsSignup(!isSignup); setError(''); setMessage('') }}
              style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', fontWeight: 700, marginLeft: 6, fontSize: 14 }}>
              {isSignup ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', color: '#475569', fontSize: 12, marginTop: 20 }}>
          Your nutrition data is private and secure 🔒
        </div>
      </div>
    </div>
  )
}
