import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { FOOD_DB, getFoodsByMeal, calculateNutrition, calculateTargets } from '../lib/nutrition'

function Card({ children, style = {} }) {
  return <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 24, ...style }}>{children}</div>
}

export default function DailyLog({ profile, user, onProfileUpdate }) {
  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(today)
  const [budget, setBudget] = useState(100)
  const [meals, setMeals] = useState({ breakfast: [], lunch: [], dinner: [] })
  const [extraFoods, setExtraFoods] = useState([])
  const [extraInput, setExtraInput] = useState('')
  const [extraQty, setExtraQty] = useState(1)
  const [extraCal, setExtraCal] = useState('')
  const [extraProtein, setExtraProtein] = useState('')
  const [fetchingNutrition, setFetchingNutrition] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [activeTab, setActiveTab] = useState('breakfast')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [logId, setLogId] = useState(null)

  // Mess menu setup state
  const [showMessSetup, setShowMessSetup] = useState(false)
  const [messSetupTab, setMessSetupTab] = useState('breakfast')
  const [messSearch, setMessSearch] = useState('')
  const [tempMenu, setTempMenu] = useState(
    profile?.mess_menu || { breakfast: [], lunch: [], dinner: [] }
  )
  const [savingMenu, setSavingMenu] = useState(false)
  const [menuSaved, setMenuSaved] = useState(false)

  const targets = profile ? calculateTargets(profile) : { calories: 2000, protein: 65, carbs: 250, fat: 55 }
  const allFoodItems = Object.keys(FOOD_DB)
  const mealFoodItems = getFoodsByMeal(activeTab)
  const snackItems = getFoodsByMeal('snack')
  const messMenu = profile?.mess_menu || { breakfast: [], lunch: [], dinner: [] }

  // Live preview for extra food
  const previewDb = FOOD_DB[extraInput] || null
  const previewCal = previewDb ? Math.round(previewDb.cal * (parseFloat(extraQty) || 1)) : null
  const previewProtein = previewDb ? Math.round(previewDb.protein * (parseFloat(extraQty) || 1)) : null

  // Filtered items — mess items first, then rest
  const getDisplayItems = () => {
    const myMessItems = messMenu[activeTab] || []
    const relevantItems = [...mealFoodItems, ...snackItems]
    const filtered = search.trim()
      ? relevantItems.filter(f => f.toLowerCase().includes(search.toLowerCase()))
      : relevantItems
    const messFiltered = filtered.filter(f => myMessItems.includes(f))
    const otherFiltered = filtered.filter(f => !myMessItems.includes(f))
    return { messFiltered, otherFiltered }
  }

  const { messFiltered, otherFiltered } = getDisplayItems()

  // Mess setup filtered items
  const messSetupFiltered = (() => {
    const relevantItems = getFoodsByMeal(messSetupTab)
    return messSearch.trim()
      ? relevantItems.filter(f => f.toLowerCase().includes(messSearch.toLowerCase()))
      : relevantItems
  })()

  useEffect(() => { fetchLog() }, [selectedDate])

  const fetchLog = async () => {
    const { data } = await supabase.from('daily_logs').select('*')
      .eq('user_id', user.id).eq('log_date', selectedDate).maybeSingle()
    if (data) {
      setBudget(data.budget || 100)
      setMeals(data.meals || { breakfast: [], lunch: [], dinner: [] })
      setExtraFoods(data.extra_foods || [])
      setLogId(data.id)
    } else {
      setBudget(100)
      setMeals({ breakfast: [], lunch: [], dinner: [] })
      setExtraFoods([])
      setLogId(null)
    }
  }

  const toggleMeal = (meal, item) => {
    setMeals(prev => {
      const items = prev[meal]
      const exists = items.find(i => i.name === item)
      return {
        ...prev,
        [meal]: exists ? items.filter(i => i.name !== item) : [...items, { name: item, quantity: 1 }]
      }
    })
  }

  const toggleTempMenu = (meal, item) => {
    setTempMenu(prev => {
      const items = prev[meal] || []
      return {
        ...prev,
        [meal]: items.includes(item) ? items.filter(x => x !== item) : [...items, item]
      }
    })
  }

  const saveMessMenu = async () => {
    setSavingMenu(true)
    await supabase.from('profiles').update({ mess_menu: tempMenu }).eq('id', user.id)
    if (onProfileUpdate) onProfileUpdate()
    setSavingMenu(false)
    setMenuSaved(true)
    setShowMessSetup(false)
    setTimeout(() => setMenuSaved(false), 2000)
  }

  const addExtra = () => {
    if (!extraInput.trim()) return
    const isNew = !FOOD_DB[extraInput.trim()]
    setExtraFoods(prev => [...prev, { 
      name: extraInput.trim(), 
      quantity: parseFloat(extraQty) || 1,
      manualCal: isNew ? (parseFloat(extraCal) || 0) : null,
      manualProtein: isNew ? (parseFloat(extraProtein) || 0) : null
    }])
    setExtraInput('')
    setExtraQty(1)
    setExtraCal('')
    setExtraProtein('')
  }

  const removeExtra = (i) => setExtraFoods(prev => prev.filter((_, idx) => idx !== i))

  const fetchExtraNutrition = async () => {
    if (!extraInput.trim()) return
    setFetchingNutrition(true)
    setLookupError('')
    try {
      const res = await fetch("http://localhost:5678/webhook/nutrition-lookup", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodName: extraInput.trim() })
      })
      if (!res.ok) throw new Error("API responded with an error")
      const data = await res.json()
      if (data.calories) setExtraCal(data.calories)
      if (data.protein) setExtraProtein(data.protein)
    } catch (err) {
      console.error("Lookup failed:", err)
      setLookupError("AI Lookup is offline. Please enter values manually.")
    }
    setFetchingNutrition(false)
  }

  const allFoods = [...Object.values(meals).flat(), ...extraFoods]
  const nutrition = calculateNutrition(allFoods)

  const saveLog = async () => {
    setSaving(true)
    const payload = {
      user_id: user.id, log_date: selectedDate, budget,
      meals, extra_foods: extraFoods,
      total_calories: nutrition.calories,
      total_protein: nutrition.protein,
      total_carbs: nutrition.carbs,
      total_fat: nutrition.fat,
    }
    if (logId) {
      await supabase.from('daily_logs').update(payload).eq('id', logId)
    } else {
      const { data } = await supabase.from('daily_logs').insert(payload).select().maybeSingle()
      if (data) setLogId(data.id)
    }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const FoodButton = ({ item, meal }) => {
    const isLogged = meals[meal]?.some(m => m.name === item)
    const db = FOOD_DB[item] || {}
    const isMyMess = (messMenu[meal] || []).includes(item)
    return (
      <button onClick={() => toggleMeal(meal, item)}
        style={{ 
          width: '100%', 
          background: isLogged ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255,255,255,0.03)', 
          border: `2px solid ${isLogged ? 'var(--accent-green)' : 'transparent'}`, 
          borderRadius: 12, 
          padding: '12px 16px', 
          marginBottom: 10, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          cursor: 'pointer', 
          transition: 'all 0.2s',
          outline: 'none'
        }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>{item}</span>
            {isMyMess && <span style={{ background: 'rgba(250, 204, 21, 0.15)', color: '#facc15', fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 800, textTransform: 'uppercase' }}>⭐ My Mess</span>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {db.cal} kcal • {db.protein}g protein • {db.carbs}g carbs
          </div>
        </div>
        <div style={{ 
          width: 32, 
          height: 32, 
          borderRadius: 10, 
          background: isLogged ? 'var(--accent-green)' : 'rgba(255,255,255,0.05)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: isLogged ? '#000' : 'var(--text-muted)', 
          fontWeight: 800, 
          flexShrink: 0, 
          fontSize: 16,
          transition: 'all 0.2s'
        }}>
          {isLogged ? '✓' : '+'}
        </div>
      </button>
    )
  }

  return (
    <div style={{ padding: '40px', overflowY: 'auto', height: '100vh', background: 'var(--bg-color)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)' }}>Daily Food Log 📅</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Track your intake and stay on top of your goals</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => { setShowMessSetup(!showMessSetup); setTempMenu(profile?.mess_menu || { breakfast: [], lunch: [], dinner: [] }) }}
            style={{ 
              background: showMessSetup ? 'rgba(250, 204, 21, 0.1)' : 'transparent', 
              border: `1px solid ${showMessSetup ? '#facc15' : 'var(--border-color)'}`, 
              borderRadius: 12, 
              padding: '10px 18px', 
              color: showMessSetup ? '#facc15' : 'var(--text-muted)', 
              fontWeight: 600, 
              cursor: 'pointer', 
              fontSize: 13,
              transition: 'all 0.2s'
            }}>
            ⭐ {showMessSetup ? 'Close Setup' : 'Set My Mess Menu'}
          </button>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '10px 16px', color: 'var(--text-primary)', fontSize: 14, outline: 'none', cursor: 'pointer' }} />
        </div>
      </div>

      {menuSaved && (
        <div style={{ background: 'rgba(74, 222, 128, 0.1)', border: '1px solid var(--accent-green)', borderRadius: 12, padding: '12px 20px', color: 'var(--accent-green)', fontSize: 14, marginBottom: 20, fontWeight: 600 }}>
          ✓ Mess menu updated successfully!
        </div>
      )}

      {/* ── MESS MENU SETUP PANEL ── */}
      {showMessSetup && (
        <Card style={{ marginBottom: 32, border: '1px solid rgba(250, 204, 21, 0.3)', background: 'rgba(26, 29, 39, 0.8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 800, color: '#facc15', fontSize: 18 }}>⭐ Customize Your Mess Menu</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Select the dishes served at your hostel mess for easier logging</div>
            </div>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 12, gap: 4 }}>
              {['breakfast', 'lunch', 'dinner'].map(t => (
                <button key={t} onClick={() => { setMessSetupTab(t); setMessSearch('') }}
                  style={{ 
                    background: messSetupTab === t ? '#facc15' : 'transparent', 
                    border: 'none', 
                    borderRadius: 10, 
                    padding: '8px 16px', 
                    color: messSetupTab === t ? '#000' : 'var(--text-muted)', 
                    fontWeight: 700, 
                    cursor: 'pointer', 
                    fontSize: 12, 
                    textTransform: 'capitalize',
                    transition: 'all 0.2s'
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <input
            placeholder="🔍 Search dishes to add..."
            value={messSearch}
            onChange={e => setMessSearch(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '12px 18px', color: 'var(--text-primary)', fontSize: 14, outline: 'none', marginBottom: 16 }}
          />

          {/* Food grid */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 240, overflowY: 'auto', marginBottom: 20, padding: 4 }}>
            {messSetupFiltered.map(item => {
              const selected = (tempMenu[messSetupTab] || []).includes(item)
              return (
                <button key={item} onClick={() => toggleTempMenu(messSetupTab, item)}
                  style={{ 
                    background: selected ? 'rgba(250, 204, 21, 0.15)' : 'transparent', 
                    border: `1px solid ${selected ? '#facc15' : 'var(--border-color)'}`, 
                    borderRadius: 10, 
                    padding: '8px 16px', 
                    color: selected ? '#facc15' : 'var(--text-muted)', 
                    cursor: 'pointer', 
                    fontSize: 13, 
                    fontWeight: selected ? 700 : 500,
                    transition: 'all 0.2s'
                  }}>
                  {selected ? '✓ ' : ''}{item}
                </button>
              )
            })}
          </div>

          <button onClick={saveMessMenu} disabled={savingMenu}
            style={{ 
              background: 'var(--accent-green)', 
              border: 'none', 
              borderRadius: 12, 
              padding: '14px 28px', 
              color: '#000', 
              fontWeight: 800, 
              cursor: savingMenu ? 'not-allowed' : 'pointer', 
              fontSize: 14,
              opacity: savingMenu ? 0.7 : 1,
              transition: 'all 0.2s'
            }}>
            {savingMenu ? 'Saving...' : '💾 Save Changes'}
          </button>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>

        {/* Left */}
        <div>
          {/* Budget */}
          <Card style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 16 }}>💰 Daily Food Budget</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Budget for extra food outside mess</div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#facc15' }}>₹{budget}</div>
            </div>
            <input type="range" min={0} max={300} value={budget} onChange={e => setBudget(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#facc15', cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: 12, marginTop: 8, fontWeight: 500 }}>
              <span>₹0</span><span>₹300</span>
            </div>
          </Card>

          {/* Mess Meals */}
          <Card style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 16 }}>🍽 Mess Meals</div>
              {messMenu[activeTab]?.length > 0 && (
                <span style={{ fontSize: 11, color: '#facc15', fontWeight: 800, background: 'rgba(250, 204, 21, 0.1)', padding: '2px 10px', borderRadius: 99 }}>⭐ {messMenu[activeTab].length} IN MENU</span>
              )}
            </div>

            {/* Meal tabs */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 14, gap: 4, marginBottom: 20 }}>
              {['breakfast', 'lunch', 'dinner'].map(t => (
                <button key={t} onClick={() => { setActiveTab(t); setSearch('') }}
                  style={{ 
                    flex: 1, 
                    background: activeTab === t ? 'var(--accent-green)' : 'transparent', 
                    border: 'none', 
                    borderRadius: 10, 
                    padding: '10px 0', 
                    color: activeTab === t ? '#000' : 'var(--text-muted)', 
                    fontWeight: 800, 
                    cursor: 'pointer', 
                    fontSize: 13, 
                    textTransform: 'capitalize',
                    transition: 'all 0.2s'
                  }}>
                  {t}
                </button>
              ))}
            </div>

            <input
              placeholder="🔍 Search for something specific..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '12px 16px', color: 'var(--text-primary)', fontSize: 14, outline: 'none', marginBottom: 20 }}
            />

            <div style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 8 }} className="custom-scrollbar">
              {/* My mess dishes first */}
              {messFiltered.length > 0 && (
                <>
                  <div style={{ fontSize: 11, color: '#facc15', fontWeight: 800, marginBottom: 12, letterSpacing: '0.05em' }}>⭐ MESS FAVORITES</div>
                  {messFiltered.map(item => <FoodButton key={item} item={item} meal={activeTab} />)}
                  {otherFiltered.length > 0 && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 800, margin: '24px 0 12px', letterSpacing: '0.05em' }}>OTHER FOODS</div>
                  )}
                </>
              )}
              {/* All other foods */}
              {otherFiltered.map(item => <FoodButton key={item} item={item} meal={activeTab} />)}
            </div>
          </Card>

          {/* Extra food */}
          <Card style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 16, marginBottom: 20 }}>➕ Extra Food (outside mess)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input list="food-list" placeholder="What did you eat?" value={extraInput} onChange={e => setExtraInput(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '12px 16px', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
                  <datalist id="food-list">
                    {allFoodItems.map(f => <option key={f} value={f} />)}
                  </datalist>
                </div>
                <input type="number" min={0.5} max={10} step={0.5} value={extraQty} onChange={e => setExtraQty(e.target.value)}
                  style={{ width: 75, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '12px', color: 'var(--text-primary)', fontSize: 14, outline: 'none', textAlign: 'center' }} />
              </div>

              {/* Manual input for new foods */}
              {extraInput.trim() && !FOOD_DB[extraInput.trim()] && (
                <div style={{ padding: '16px', background: 'rgba(74, 222, 128, 0.05)', borderRadius: 12, border: '1px dashed var(--accent-green)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 700 }}>🔍 AI Nutrition Lookup</div>
                    <button onClick={fetchExtraNutrition} disabled={fetchingNutrition}
                      style={{ background: 'var(--accent-green)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#000', fontSize: 11, fontWeight: 800, cursor: 'pointer', opacity: fetchingNutrition ? 0.7 : 1 }}>
                      {fetchingNutrition ? 'FETCHING...' : '✨ FETCH DATA'}
                    </button>
                  </div>
                  {lookupError && (
                    <div style={{ color: '#f87171', fontSize: 11, fontWeight: 600, marginBottom: 12 }}>⚠️ {lookupError}</div>
                  )}
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 800, marginBottom: 6 }}>CALORIES (kcal)</div>
                      <input type="number" placeholder="e.g. 250" value={extraCal} onChange={e => setExtraCal(e.target.value)}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 800, marginBottom: 6 }}>PROTEIN (g)</div>
                      <input type="number" placeholder="e.g. 12" value={extraProtein} onChange={e => setExtraProtein(e.target.value)}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
                    </div>
                  </div>
                </div>
              )}

              <button onClick={addExtra}
                style={{ background: 'var(--accent-green)', border: 'none', borderRadius: 12, padding: '14px 24px', color: '#000', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>
                {extraInput.trim() && !FOOD_DB[extraInput.trim()] ? 'Add New Item' : 'Add to Log'}
              </button>
            </div>

            {/* Live preview for known foods */}
            {extraInput.trim() && FOOD_DB[extraInput.trim()] && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Preview: <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{extraInput}</span> <span style={{ color: 'var(--accent-green)' }}>×{extraQty}</span></span>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ color: '#60a5fa', fontSize: 13, fontWeight: 700 }}>{previewCal} kcal</span>
                  <span style={{ color: 'var(--accent-green)', fontSize: 13, fontWeight: 700 }}>{previewProtein}g protein</span>
                </div>
              </div>
            )}

            {extraFoods.length === 0 && !extraInput.trim() && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0', border: '1px dashed var(--border-color)', borderRadius: 12 }}>No extra items added yet</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {extraFoods.map((f, i) => {
                const db = FOOD_DB[f.name] || {}
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: '12px 16px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700 }}>{f.name} <span style={{ color: 'var(--accent-green)', fontWeight: 500, marginLeft: 4 }}>×{f.quantity}</span></div>
                      <div style={{ fontSize: 12, marginTop: 4, display: 'flex', gap: 12 }}>
                        <span style={{ color: '#60a5fa', fontWeight: 500 }}>{Math.round((db.cal || 0) * f.quantity)} kcal</span>
                        <span style={{ color: 'var(--accent-green)', fontWeight: 500 }}>{Math.round((db.protein || 0) * f.quantity)}g protein</span>
                      </div>
                    </div>
                    <button onClick={() => removeExtra(i)}
                      style={{ background: 'rgba(248, 113, 113, 0.1)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#f87171', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.2s' }}>✕</button>
                  </div>
                )
              })}
            </div>

            {extraFoods.length > 0 && (
              <div style={{ background: 'rgba(74, 222, 128, 0.05)', border: '1px solid rgba(74, 222, 128, 0.2)', borderRadius: 12, padding: '14px 16px', marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--accent-green)', fontSize: 13, fontWeight: 800 }}>EXTRA TOTAL</span>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ color: '#60a5fa', fontSize: 14, fontWeight: 800 }}>{extraFoods.reduce((s, f) => s + Math.round((FOOD_DB[f.name]?.cal || 0) * f.quantity), 0)} kcal</span>
                  <span style={{ color: 'var(--accent-green)', fontSize: 14, fontWeight: 800 }}>{extraFoods.reduce((s, f) => s + Math.round((FOOD_DB[f.name]?.protein || 0) * f.quantity), 0)}g protein</span>
                </div>
              </div>
            )}
          </Card>

          <button onClick={saveLog} disabled={saving}
            style={{ 
              width: '100%', 
              background: saved ? 'var(--accent-green)' : saving ? 'var(--border-color)' : 'linear-gradient(135deg, var(--accent-green), #22c55e)', 
              border: 'none', 
              borderRadius: 16, 
              padding: '18px', 
              color: '#000', 
              fontSize: 16, 
              fontWeight: 900, 
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 20px -4px rgba(74, 222, 128, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
            {saved ? '✓ DATA SAVED' : saving ? 'SAVING...' : "💾 SAVE TODAY'S LOG"}
          </button>
        </div>

        {/* Right — nutrition summary */}
        <div style={{ position: 'sticky', top: 40 }}>
          <Card>
            <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 18, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📊</span> Today's Summary
            </div>
            {[
              ['Calories', nutrition.calories, targets.calories, 'kcal', '#60a5fa'],
              ['Protein', nutrition.protein, targets.protein, 'g', 'var(--accent-green)'],
              ['Carbs', nutrition.carbs, targets.carbs, 'g', '#fb923c'],
              ['Fat', nutrition.fat, targets.fat, 'g', '#a78bfa'],
              ['Fiber', nutrition.fiber, 25, 'g', '#facc15'],
            ].map(([label, val, max, unit, color]) => (
              <div key={label} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>{label}</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 800 }}>{val}<span style={{ color: 'rgba(255,255,255,0.2)', marginLeft: 2 }}>/ {max}{unit}</span></span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(val / max * 100, 100)}%`, background: color, height: '100%', borderRadius: 99, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                </div>
              </div>
            ))}

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '20px', marginTop: 12 }}>
              <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 14, marginBottom: 12, letterSpacing: '0.02em' }}>⚡ NUTRITION GAPS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {nutrition.calories < targets.calories ? (
                  <div style={{ color: '#60a5fa', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: 99, background: '#60a5fa' }} />
                    {targets.calories - nutrition.calories} kcal remaining
                  </div>
                ) : null}
                {nutrition.protein < targets.protein ? (
                  <div style={{ color: 'var(--accent-green)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--accent-green)' }} />
                    {targets.protein - nutrition.protein}g protein needed
                  </div>
                ) : null}
                {nutrition.calories >= targets.calories && nutrition.protein >= targets.protein && (
                  <div style={{ color: 'var(--accent-green)', fontSize: 13, fontWeight: 700, textAlign: 'center', padding: '10px 0' }}>🎉 You've hit your primary targets!</div>
                )}
              </div>
            </div>

            {allFoods.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 13, marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <span>📋 LOGGED ITEMS</span>
                  <span style={{ color: 'var(--accent-green)' }}>{allFoods.length}</span>
                </div>
                <div style={{ maxHeight: 180, overflowY: 'auto', paddingRight: 4 }} className="custom-scrollbar">
                  {allFoods.map((f, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}>{f.name}</span>
                      <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 700 }}>{FOOD_DB[f.name]?.cal || '?'} kcal</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}