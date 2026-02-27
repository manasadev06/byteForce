import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import DailyLog from './pages/DailyLog'
import GapsPlanner from './pages/GapsPlanner'
import Swaps from './pages/Swaps'
import Analytics from './pages/Analytics'
import Sidebar from './components/Sidebar'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('dashboard')

  useEffect(() => {
    // Load Google Fonts
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap'
    document.head.appendChild(link)
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    document.body.style.background = '#0f1117'

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle() // ← change from .single() to .maybeSingle()
    
    if (error) {
      console.error('Profile fetch error:', error)
      setProfile(null)
    } else {
      setProfile(data) // data will be null if no profile exists → shows onboarding
    }
  } catch(e) {
    console.error(e)
    setProfile(null)
  }
  setLoading(false)
}

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🥗</div>
          <div style={{ color: '#4ade80', fontSize: 18, fontWeight: 700 }}>NutriMess</div>
          <div style={{ color: '#475569', fontSize: 13, marginTop: 6 }}>Loading...</div>
        </div>
      </div>
    )
  }

  if (!session) return <Login />

  if (!profile) return <Onboarding user={session.user} onComplete={() => fetchProfile(session.user.id)} />

  const pages = {
    dashboard: <Dashboard profile={profile} user={session.user} />,
    daily: <DailyLog profile={profile} user={session.user} />,
    gaps: <GapsPlanner profile={profile} user={session.user} />,
    swaps: <Swaps profile={profile} user={session.user} />,
    analytics: <Analytics profile={profile} user={session.user} />,
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f1117', fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar active={page} setPage={setPage} profile={profile} />
      <div style={{ marginLeft: 220, flex: 1, minHeight: '100vh' }}>
        {pages[page]}
      </div>
    </div>
  )
}
