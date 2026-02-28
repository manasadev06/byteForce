import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { SWAP_SUGGESTIONS, FOOD_DB } from '../lib/nutrition'

function Card({ children, style = {} }) {
  return <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 24, ...style }}>{children}</div>
}

export default function Swaps({ profile, user, setPage }) {
  const [todayLog, setTodayLog] = useState(null)
  const [todayFoods, setTodayFoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState([])

  useEffect(() => { fetchToday() }, [])

  const fetchToday = async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('daily_logs').select('*').eq('user_id', user.id).eq('log_date', today).maybeSingle()
    if (data) {
      setTodayLog(data)
      const all = [...Object.values(data.meals || {}).flat(), ...(data.extra_foods || [])]
      setTodayFoods(all.map(f => f.name))
    }
    setLoading(false)
  }

  const toggleSave = (i) => setSaved(s => s.includes(i) ? s.filter(x => x !== i) : [...s, i])

  // Filter swaps relevant to what user ate today
  const relevantSwaps = SWAP_SUGGESTIONS.filter(s => todayFoods.includes(s.from))

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>Loading...</div>
  }

  return (
    <div style={{ padding: '40px', overflowY: 'auto', height: '100vh', background: 'var(--bg-color)' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)' }}>Smart Food Swaps ↔</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          {todayFoods.length > 0 
            ? (relevantSwaps.length > 0 ? `Based on what you ate today — ${relevantSwaps.length} smart swaps found!` : "You're eating healthy today! 🎉")
            : 'Log your meals to get personalized swap suggestions'}
        </div>
      </div>

      {/* State: No food logged */}
      {todayFoods.length === 0 && (
        <Card style={{ textAlign: 'center', padding: '80px 40px', borderStyle: 'dashed', background: 'transparent' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🍽️</div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 18, marginBottom: 8 }}>No food logged today</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Log your meals in Daily Log to get personalized swap suggestions based on your actual intake.
          </div>
          <button onClick={() => setPage('daily')}
            style={{ 
              background: 'var(--accent-green)', 
              border: 'none', 
              borderRadius: 12, 
              padding: '14px 28px', 
              color: '#000', 
              fontWeight: 800, 
              cursor: 'pointer', 
              fontSize: 14,
              transition: 'all 0.2s'
            }}>
            Go to Daily Log
          </button>
        </Card>
      )}

      {/* State: Healthy eating (Logged but no swaps found) */}
      {todayFoods.length > 0 && relevantSwaps.length === 0 && (
        <Card style={{ textAlign: 'center', padding: '80px 40px', background: 'rgba(74, 222, 128, 0.03)', border: '1px solid rgba(74, 222, 128, 0.2)' }}>
          <div style={{ fontSize: 56, marginBottom: 24 }}>✅</div>
          <div style={{ color: 'var(--accent-green)', fontWeight: 900, fontSize: 24, marginBottom: 12 }}>You're eating healthy today! 🎉</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
            No swaps needed for your logged meals. Keep up the great work!
          </div>
          <div style={{ textAlign: 'left', maxWidth: 400, margin: '0 auto' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 800, marginBottom: 16, letterSpacing: '0.05em' }}>TODAY'S HEALTHY CHOICES</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {todayFoods.map((f, i) => (
                <span key={i} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600 }}>
                  {f}
                </span>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* State: Swaps available */}
      {relevantSwaps.length > 0 && (
        <>
          <div style={{ background: 'rgba(74, 222, 128, 0.1)', border: '1px solid var(--accent-green)', borderRadius: 12, padding: '12px 20px', color: 'var(--accent-green)', fontSize: 14, marginBottom: 24, fontWeight: 600 }}>
            ✓ These suggestions are tailored to your logs today!
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {relevantSwaps.map((swap, i) => {
              const fromDb = FOOD_DB[swap.from] || {}
              const toDb = FOOD_DB[swap.to] || {}
              const proteinGain = (toDb.protein || 0) - (fromDb.protein || 0)
              const calDiff = (toDb.cal || 0) - (fromDb.cal || 0)

              return (
                <div key={i} style={{ background: 'var(--card-bg)', border: `1px solid ${saved.includes(i) ? 'var(--accent-green)' : 'var(--border-color)'}`, borderRadius: 20, overflow: 'hidden', transition: 'all 0.2s' }}>
                  {/* From */}
                  <div style={{ padding: '20px', background: 'rgba(248, 113, 113, 0.03)', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: 11, color: '#f87171', fontWeight: 800, marginBottom: 8, letterSpacing: '0.05em' }}>❌ INSTEAD OF</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{swap.from}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, fontWeight: 500 }}>
                      {fromDb.cal} kcal • {fromDb.protein}g protein • {fromDb.carbs}g carbs
                    </div>
                  </div>

                  {/* To */}
                  <div style={{ padding: '20px', background: 'rgba(74, 222, 128, 0.03)', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 800, marginBottom: 8, letterSpacing: '0.05em' }}>✅ TRY THIS</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{swap.to}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, fontWeight: 500 }}>
                      {toDb.cal} kcal • {toDb.protein}g protein • {toDb.carbs}g carbs
                    </div>
                  </div>

                  {/* Benefits + save */}
                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {proteinGain > 0 && (
                          <span style={{ background: 'rgba(74, 222, 128, 0.1)', color: 'var(--accent-green)', padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>+{proteinGain}g protein</span>
                        )}
                        {swap.saveCost > 0 && (
                          <span style={{ background: 'rgba(250, 204, 21, 0.1)', color: '#facc15', padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>Save ₹{swap.saveCost}</span>
                        )}
                        {calDiff !== 0 && (
                          <span style={{ background: calDiff < 0 ? 'rgba(96, 165, 250, 0.1)' : 'rgba(248, 113, 113, 0.1)', color: calDiff < 0 ? '#60a5fa' : '#f87171', padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>{calDiff > 0 ? '+' : ''}{calDiff} kcal</span>
                        )}
                      </div>
                      <button onClick={() => toggleSave(i)}
                        style={{ 
                          background: saved.includes(i) ? 'var(--accent-green)' : 'rgba(255,255,255,0.03)', 
                          border: `1px solid ${saved.includes(i) ? 'var(--accent-green)' : 'var(--border-color)'}`, 
                          borderRadius: 10, 
                          padding: '8px 16px', 
                          color: saved.includes(i) ? '#000' : 'var(--text-muted)', 
                          cursor: 'pointer', 
                          fontSize: 13, 
                          fontWeight: 700,
                          transition: 'all 0.2s'
                        }}>
                        {saved.includes(i) ? '✓ Saved' : 'Save Swap'}
                      </button>
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.02)' }}>
                      💡 <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{swap.reason}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
