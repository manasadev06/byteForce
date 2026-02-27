# 🥗 NutriMess — Smart Nutrition for Hostel Students

## Quick Setup (5 minutes)

### 1. Install dependencies
```bash
npm install
```

### 2. Add your n8n webhook URL
Open `src/pages/GapsPlanner.jsx` and replace:
```js
const N8N_WEBHOOK_URL = 'YOUR_N8N_WEBHOOK_URL_HERE'
```
with your actual n8n webhook URL.

### 3. Run the app
```bash
npm run dev
```
Opens at http://localhost:5173

### 4. Deploy to Vercel (for jury demo)
```bash
npm install -g vercel
vercel
```

---

## n8n Workflow Setup

Your n8n workflow needs 3 nodes:

**Webhook (POST)** → **Gemini AI** → **Respond to Webhook**

### Gemini Prompt to use:
```
You are a nutrition assistant for Indian hostel students.

Student: {{ $json.name }}
Diet: {{ $json.diet }}
Goal: {{ $json.goal }}
Has PCOS: {{ $json.has_pcos }}
Goes to gym: {{ $json.goes_to_gym }}
Allergies: {{ $json.allergies }}

Today's gaps:
- Needs {{ $json.caloriesNeeded }} more calories
- Needs {{ $json.proteinNeeded }}g more protein  
- Needs {{ $json.carbsNeeded }}g more carbs
- Budget remaining: ₹{{ $json.budgetRemaining }}

Suggest 3 affordable Indian hostel meals to fill these gaps.
Consider their diet type and allergies.
Return ONLY a JSON array like this:
[
  {
    "meal": "Evening Snack",
    "name": "Boiled Eggs + Bread",
    "cost": 20,
    "calories": 220,
    "protein": 14,
    "carbs": 24,
    "fat": 7,
    "where": "Hostel Canteen",
    "time": "5:00 PM"
  }
]
```

---

## Features
- 🔐 Email/password authentication (Supabase Auth)
- 👤 Smart onboarding with PCOS/PCOD support for females
- 🏠 Dashboard with nutrition score, macro rings, heatmap, weekly charts
- 📅 Daily food log — mess meals + extra food with auto nutrition calculation
- ⚡ AI Meal Planner via n8n + Gemini
- ↔ Affordable swaps based on what you ate
- 📊 Weekly/monthly analytics with radar chart and insights

## Supabase Tables Required
Run this SQL in Supabase SQL Editor:
```sql
create table profiles (
  id uuid references auth.users primary key,
  name text, age int, weight int, height int,
  gender text, diet text, goal text,
  has_pcos boolean default false,
  goes_to_gym boolean default false,
  allergies text[],
  mess_menu jsonb,
  created_at timestamp default now()
);

create table daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  log_date date default current_date,
  budget int,
  meals jsonb,
  extra_foods jsonb,
  total_calories int,
  total_protein int,
  total_carbs int,
  total_fat int,
  created_at timestamp default now()
);
```
