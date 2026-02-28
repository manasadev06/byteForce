import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import DailyLog from './pages/DailyLog'
import GapsPlanner from './pages/GapsPlanner'
import Swaps from './pages/Swaps'
import Analytics from './pages/Analytics'
import Profile from './pages/Profile'
import Sidebar from './components/Sidebar'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('dashboard')

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap'
    document.head.appendChild(link)
    document.body.style.background = 'var(--bg-color)'

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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Profile fetch error:', error)
      setProfile(null)
    } else {
      setProfile(data)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🥗</div>
          <div style={{ color: 'var(--accent-green)', fontSize: 18, fontWeight: 900 }}>NutriMess</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>Loading...</div>
        </div>
      </div>
    )
  }

  if (!session) return <Login />
  if (!profile) return <Onboarding user={session.user} onComplete={() => fetchProfile(session.user.id)} />

  const pages = {
    dashboard: <Dashboard profile={profile} user={session.user} />,
    daily: <DailyLog profile={profile} user={session.user} onProfileUpdate={() => fetchProfile(session.user.id)} />,
    gaps: <GapsPlanner profile={profile} user={session.user} />,
    swaps: <Swaps profile={profile} user={session.user} setPage={setPage} />,
    analytics: <Analytics profile={profile} user={session.user} />,
    profile: <Profile profile={profile} user={session.user} onUpdate={() => fetchProfile(session.user.id)} />,
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)' }}>
      <Sidebar active={page} setPage={setPage} profile={profile} />
      <div style={{ marginLeft: 240, flex: 1, minHeight: '100vh', position: 'relative' }}>
        {pages[page]}
      </div>
    </div>
  )
}