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
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🥗</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px' }}>NutriMess</div>
          <div style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 16, fontWeight: 500 }}>Smart nutrition for hostel students</div>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 24, padding: '40px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 32, textAlign: 'center' }}>
            {isSignup ? 'Create your account' : 'Welcome back!'}
          </div>

          {error && <div style={{ background: 'rgba(248, 113, 113, 0.1)', border: '1px solid #f87171', borderRadius: 12, padding: '12px 16px', color: '#f87171', fontSize: 14, marginBottom: 20, fontWeight: 600 }}>{error}</div>}
          {message && <div style={{ background: 'rgba(74, 222, 128, 0.1)', border: '1px solid var(--accent-green)', borderRadius: 12, padding: '12px 16px', color: 'var(--accent-green)', fontSize: 14, marginBottom: 20, fontWeight: 600 }}>{message}</div>}

          <div style={{ marginBottom: 20 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8, fontWeight: 600 }}>EMAIL ADDRESS</div>
            <input type="email" placeholder="student@college.edu" value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '14px 16px', color: 'var(--text-primary)', fontSize: 15, outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }} />
          </div>

          <div style={{ marginBottom: 32 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8, fontWeight: 600 }}>PASSWORD</div>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handle()}
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '14px 16px', color: 'var(--text-primary)', fontSize: 15, outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }} />
          </div>

          <button onClick={handle} disabled={loading}
            style={{ 
              width: '100%', 
              background: loading ? 'var(--border-color)' : 'var(--accent-green)', 
              border: 'none', 
              borderRadius: 14, 
              padding: '16px', 
              color: '#000', 
              fontSize: 16, 
              fontWeight: 900, 
              cursor: loading ? 'not-allowed' : 'pointer', 
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: loading ? 'none' : '0 10px 15px -3px rgba(74, 222, 128, 0.2)'
            }}>
            {loading ? 'PLEASE WAIT...' : isSignup ? 'GET STARTED' : 'SIGN IN'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>
            {isSignup ? 'Already have an account?' : "Don't have an account?"}
            <button onClick={() => { setIsSignup(!isSignup); setError(''); setMessage('') }}
              style={{ background: 'none', border: 'none', color: 'var(--accent-green)', cursor: 'pointer', fontWeight: 800, marginLeft: 8, fontSize: 14, textDecoration: 'underline' }}>
              {isSignup ? 'Sign In' : 'Create One'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 32, fontWeight: 600, letterSpacing: '0.05em' }}>
          YOUR DATA IS SECURED WITH END-TO-END ENCRYPTION 🔒
        </div>
      </div>
    </div>
  )
}
