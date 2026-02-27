export const FOOD_DB = {
  // Breakfast
  "Idli (2 pcs)": { cal: 140, protein: 4, carbs: 28, fat: 1, fiber: 2, meal: "breakfast" },
  "Dosa": { cal: 168, protein: 4, carbs: 30, fat: 4, fiber: 1, meal: "breakfast" },
  "Poha": { cal: 180, protein: 3, carbs: 36, fat: 3, fiber: 2, meal: "breakfast" },
  "Upma": { cal: 200, protein: 5, carbs: 35, fat: 5, fiber: 3, meal: "breakfast" },
  "Bread (2 slices)": { cal: 160, protein: 5, carbs: 30, fat: 2, fiber: 2, meal: "breakfast" },
  "Boiled Egg": { cal: 70, protein: 6, carbs: 0, fat: 5, fiber: 0, meal: "breakfast" },
  "Omelette (2 eggs)": { cal: 180, protein: 12, carbs: 2, fat: 13, fiber: 0, meal: "breakfast" },
  "Cornflakes + Milk": { cal: 260, protein: 8, carbs: 45, fat: 5, fiber: 2, meal: "breakfast" },
  "Paratha (1)": { cal: 260, protein: 5, carbs: 38, fat: 10, fiber: 3, meal: "breakfast" },
  "Sambar": { cal: 80, protein: 4, carbs: 12, fat: 2, fiber: 3, meal: "breakfast" },

  // Lunch
  "Rice (1 cup)": { cal: 200, protein: 4, carbs: 44, fat: 0, fiber: 1, meal: "lunch" },
  "Dal Tadka": { cal: 150, protein: 9, carbs: 20, fat: 4, fiber: 5, meal: "lunch" },
  "Rajma": { cal: 180, protein: 12, carbs: 25, fat: 3, fiber: 8, meal: "lunch" },
  "Chole": { cal: 190, protein: 10, carbs: 28, fat: 4, fiber: 7, meal: "lunch" },
  "Paneer Sabzi": { cal: 220, protein: 14, carbs: 8, fat: 15, fiber: 2, meal: "lunch" },
  "Roti (1)": { cal: 100, protein: 3, carbs: 20, fat: 1, fiber: 2, meal: "lunch" },
  "Aloo Sabzi": { cal: 190, protein: 3, carbs: 28, fat: 8, fiber: 3, meal: "lunch" },
  "Mixed Veg Curry": { cal: 140, protein: 4, carbs: 18, fat: 6, fiber: 4, meal: "lunch" },
  "Chicken Curry": { cal: 280, protein: 24, carbs: 8, fat: 16, fiber: 1, meal: "lunch" },
  "Fish Curry": { cal: 220, protein: 22, carbs: 6, fat: 12, fiber: 0, meal: "lunch" },
  "Egg Curry": { cal: 200, protein: 16, carbs: 6, fat: 12, fiber: 1, meal: "lunch" },

  // Dinner
  "Chapati (1)": { cal: 100, protein: 3, carbs: 20, fat: 1, fiber: 2, meal: "dinner" },
  "Curd Rice": { cal: 230, protein: 7, carbs: 38, fat: 5, fiber: 1, meal: "dinner" },
  "Fried Rice": { cal: 320, protein: 6, carbs: 55, fat: 9, fiber: 2, meal: "dinner" },
  "Khichdi": { cal: 210, protein: 8, carbs: 38, fat: 3, fiber: 4, meal: "dinner" },
  "Palak Paneer": { cal: 240, protein: 12, carbs: 10, fat: 16, fiber: 3, meal: "dinner" },

  // Snacks (Available everywhere)
  "Banana": { cal: 90, protein: 1, carbs: 23, fat: 0, fiber: 3, meal: "snack" },
  "Apple": { cal: 80, protein: 0, carbs: 21, fat: 0, fiber: 4, meal: "snack" },
  "Maggi (1 pack)": { cal: 320, protein: 3, carbs: 45, fat: 13, fiber: 1, meal: "snack" },
}

export const SWAP_SUGGESTIONS = [
  { from: "Maggi (1 pack)", to: "Boiled Egg + Bread (2 slices)", reason: "More protein, fewer empty carbs", saveCost: 3 },
  { from: "Biscuits (4)", to: "Roasted Chana", reason: "3x more protein, better fiber", saveCost: 5 },
  { from: "Fried Rice", to: "Khichdi", reason: "Lower fat, higher protein and fiber", saveCost: 10 },
  { from: "Aloo Sabzi", to: "Paneer Sabzi", reason: "5x more protein for muscle building", saveCost: -5 },
  { from: "White Rice (1 cup)", to: "Curd Rice", reason: "Adds protein and probiotics", saveCost: 0 },
]

export const calculateNutrition = (foods) => {
  return foods.reduce((acc, food) => {
    const db = FOOD_DB[food.name] || { cal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    const qty = food.quantity || 1
    return {
      calories: acc.calories + db.cal * qty,
      protein: acc.protein + db.protein * qty,
      carbs: acc.carbs + db.carbs * qty,
      fat: acc.fat + db.fat * qty,
      fiber: acc.fiber + db.fiber * qty,
    }
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })
}

export const calculateTargets = (profile) => {
  const { weight, height, age, gender, goal, goes_to_gym, has_pcos } = profile
  let bmr = gender === 'female'
    ? 447.6 + (9.25 * weight) + (3.1 * height) - (4.33 * age)
    : 88.36 + (13.4 * weight) + (4.8 * height) - (5.7 * age)
  
  let tdee = bmr * (goes_to_gym ? 1.55 : 1.375)
  if (has_pcos) tdee *= 0.95

  let calories = goal === 'lose' ? tdee - 300 : goal === 'muscle' ? tdee + 200 : tdee
  let protein = goal === 'muscle' ? weight * 1.8 : goal === 'lose' ? weight * 1.5 : weight * 1.2
  
  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(calories * 0.45 / 4),
    fat: Math.round(calories * 0.25 / 9),
    fiber: 25,
  }
}
