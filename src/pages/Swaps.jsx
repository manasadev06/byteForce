import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { SWAP_SUGGESTIONS, FOOD_DB } from '../lib/nutrition'

function Card({ children, style = {} }) {
  return <div style={{ background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 16, padding: 20, ...style }}>{children}</div>
}

export default function Swaps({ profile, user }) {
  const [todayFoods, setTodayFoods] = useState([])
  const [saved, setSaved] = useState([])

  useEffect(() => { fetchToday() }, [])

  const fetchToday = async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('daily_logs').select('*').eq('user_id', user.id).eq('log_date', today).single()
    if (data) {
      const all = [...Object.values(data.meals || {}).flat(), ...(data.extra_foods || [])]
      setTodayFoods(all.map(f => f.name))
    }
  }

  const toggleSave = (i) => setSaved(s => s.includes(i) ? s.filter(x => x !== i) : [...s, i])

  // Filter swaps relevant to what user ate today
  const relevantSwaps = SWAP_SUGGESTIONS.filter(s => todayFoods.includes(s.from))
  const allSwaps = relevantSwaps.length > 0 ? relevantSwaps : SWAP_SUGGESTIONS

  return (
    <div style={{ padding: '28px 32px', fontFamily: "'DM Sans', sans-serif", overflowY: 'auto', height: '100vh', background: '#0f1117' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#f1f5f9' }}>Affordable Swaps ↔</div>
        <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>
          {relevantSwaps.length > 0 ? `Based on what you ate today — ${relevantSwaps.length} smart swaps found!` : 'Eat smarter without spending more'}
        </div>
      </div>

      {relevantSwaps.length > 0 && (
        <div style={{ background: '#4ade8011', border: '1px solid #4ade8033', borderRadius: 12, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#4ade80', fontSize: 13, fontWeight: 600 }}>✓ These swaps are based on your food log today!</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {allSwaps.map((swap, i) => {
          const fromDb = FOOD_DB[swap.from] || {}
          const toDb = FOOD_DB[swap.to] || {}
          const proteinGain = (toDb.protein || 0) - (fromDb.protein || 0)
          const calDiff = (toDb.cal || 0) - (fromDb.cal || 0)

          return (
            <div key={i} style={{ background: '#1a1d27', border: `1px solid ${saved.includes(i) ? '#4ade8044' : '#2d3148'}`, borderRadius: 16, overflow: 'hidden' }}>
              {/* From */}
              <div style={{ padding: '14px 16px', background: '#f8717108', borderBottom: '1px solid #2d3148' }}>
                <div style={{ fontSize: 11, color: '#f87171', fontWeight: 700, marginBottom: 6 }}>❌ INSTEAD OF</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{swap.from}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                  {fromDb.cal} kcal • {fromDb.protein}g protein • {fromDb.carbs}g carbs
                </div>
              </div>

              {/* To */}
              <div style={{ padding: '14px 16px', background: '#4ade8008', borderBottom: '1px solid #2d3148' }}>
                <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, marginBottom: 6 }}>✅ TRY THIS</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{swap.to}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                  {toDb.cal} kcal • {toDb.protein}g protein • {toDb.carbs}g carbs
                </div>
              </div>

              {/* Benefits + save */}
              <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {proteinGain > 0 && (
                    <span style={{ background: '#4ade8022', color: '#4ade80', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>+{proteinGain}g protein</span>
                  )}
                  {swap.saveCost > 0 && (
                    <span style={{ background: '#facc1522', color: '#facc15', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>Save ₹{swap.saveCost}</span>
                  )}
                  {calDiff < 0 && (
                    <span style={{ background: '#60a5fa22', color: '#60a5fa', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{calDiff} kcal</span>
                  )}
                </div>
                <button onClick={() => toggleSave(i)}
                  style={{ background: saved.includes(i) ? '#4ade80' : '#21253a', border: 'none', borderRadius: 8, padding: '4px 12px', color: saved.includes(i) ? '#000' : '#94a3b8', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  {saved.includes(i) ? '✓ Saved' : 'Save'}
                </button>
              </div>

              <div style={{ padding: '0 14px 12px', fontSize: 12, color: '#475569' }}>💡 {swap.reason}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
