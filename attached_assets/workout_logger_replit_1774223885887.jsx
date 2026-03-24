import { useState, useEffect } from "react";

const WORKOUTS = {
  "Day 1 — Push": ["Barbell Bench Press","Incline Dumbbell Press","Cable Lateral Raises","Overhead Dumbbell Press","Tricep Rope Pushdown","Overhead Cable Tricep Extension"],
  "Day 2 — Pull": ["Weighted Pull-Ups","Barbell Row","Seated Cable Row","Lat Pulldown","Incline Dumbbell Curl","Hammer Curls"],
  "Day 3 — Legs": ["Barbell Back Squat","Romanian Deadlift","Leg Press","Walking Lunges","Leg Curl","Standing Calf Raise"],
  "Day 4 — Upper": ["Overhead Press","Dumbbell Chest Fly","Single Arm Dumbbell Row","Face Pulls","EZ Bar Curl","Skull Crushers"],
};

const DAY_COLORS = {
  "Day 1 — Push": { accent: "#E74C3C", bg: "#1a0808", card: "#2d1010" },
  "Day 2 — Pull": { accent: "#3498DB", bg: "#080f1a", card: "#10182d" },
  "Day 3 — Legs": { accent: "#2ECC71", bg: "#081a0e", card: "#102d18" },
  "Day 4 — Upper": { accent: "#F39C12", bg: "#1a0f08", card: "#2d1a10" },
};

const GOALS = { calories: 2400, protein: 178, carbs: 220, fat: 65, water: 8 };
const STYLES = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;700&display=swap'); * { box-sizing: border-box; } input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; } input[type=number] { -moz-appearance: textfield; } textarea, input, button { font-family: inherit; }`;

async function askBenny(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] })
  });
  const data = await res.json();
  return data.content?.map(c => c.text || "").join("") || "Woof.";
}

function BennyBubble({ text, mood = "neutral", loading = false }) {
  const moodColors = { good: "#2ECC71", bad: "#E74C3C", neutral: "#F39C12", food: "#9B59B6", checkin: "#3498DB" };
  const color = moodColors[mood] || "#F39C12";
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
      <div style={{ flexShrink: 0, width: 52, height: 52, borderRadius: "50%", background: `${color}22`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🐶</div>
      <div style={{ background: `${color}14`, border: `1px solid ${color}44`, borderRadius: "4px 12px 12px 12px", padding: "12px 16px", flex: 1 }}>
        {loading
          ? <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontStyle: "italic" }}>Benny is thinking... 🐾</div>
          : <p style={{ color: "#fff", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{text}</p>}
        <div style={{ fontSize: 11, color, fontWeight: 700, marginTop: 6, letterSpacing: 1 }}>— BENNY 🐾</div>
      </div>
    </div>
  );
}

function RatingRow({ label, value, onChange, emoji }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{emoji} {label}</span>
        <span style={{ fontSize: 13, color: "#F39C12", fontWeight: 700 }}>{value}/5</span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {[1,2,3,4,5].map(n => (
          <button key={n} onClick={() => onChange(n)} style={{
            flex: 1, height: 36, borderRadius: 8, border: "none", cursor: "pointer",
            background: n <= value ? "#F39C12" : "rgba(255,255,255,0.08)",
            color: n <= value ? "#000" : "rgba(255,255,255,0.3)",
            fontWeight: 700, fontSize: 14, transition: "all 0.15s"
          }}>{n}</button>
        ))}
      </div>
    </div>
  );
}

function MacroRing({ label, current, goal, color }) {
  const pct = Math.min((current / goal) * 100, 100);
  const r = 28; const circ = 2 * Math.PI * r;
  const over = current > goal;
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={over ? "#E74C3C" : color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ}
          strokeLinecap="round" transform="rotate(-90 36 36)" style={{ transition: "stroke-dashoffset 0.5s" }} />
        <text x="36" y="40" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700" fontFamily="Arial">{current}</text>
      </svg>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 1, marginTop: 2 }}>{label}</div>
      <div style={{ fontSize: 10, color: over ? "#E74C3C" : color, fontWeight: 700 }}>/ {goal}</div>
    </div>
  );
}

function WaterTracker({ glasses, onAdd, onRemove }) {
  return (
    <div style={{ background: "#0d1f2d", borderRadius: 12, padding: 16, marginBottom: 12, border: "1px solid #3498DB33" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, color: "#3498DB", letterSpacing: 1 }}>💧 WATER INTAKE</span>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{glasses} / {GOALS.water} glasses</span>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {Array.from({ length: GOALS.water }).map((_, i) => (
          <div key={i} style={{ width: 32, height: 40, borderRadius: 6, border: `2px solid ${i < glasses ? "#3498DB" : "rgba(255,255,255,0.15)"}`, background: i < glasses ? "#3498DB33" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, transition: "all 0.2s" }}>
            {i < glasses ? "💧" : ""}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onAdd} disabled={glasses >= GOALS.water} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: glasses >= GOALS.water ? "rgba(255,255,255,0.05)" : "#3498DB", color: "#fff", fontWeight: 700, cursor: glasses >= GOALS.water ? "default" : "pointer", fontSize: 13 }}>+ Glass</button>
        <button onClick={onRemove} disabled={glasses <= 0} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.5)", cursor: glasses <= 0 ? "default" : "pointer", fontSize: 13 }}>−</button>
      </div>
    </div>
  );
}

function MealCard({ meal, onRemove }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{meal.name}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{meal.calories} cal · P:{meal.protein}g · C:{meal.carbs}g · F:{meal.fat}g</div>
      </div>
      <button onClick={onRemove} style={{ background: "rgba(255,80,80,0.15)", border: "none", color: "#ff6b6b", borderRadius: 6, width: 26, height: 26, cursor: "pointer", fontSize: 14 }}>×</button>
    </div>
  );
}

function SetRow({ set, onChange, onRemove }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
      {[["lbs","weight",70],["reps","reps",70],["RPE","rpe",65]].map(([ph, key, w]) => (
        <input key={key} type="number" placeholder={ph} value={set[key]} onChange={e => onChange({ ...set, [key]: e.target.value })}
          style={{ width: w, padding: "6px 8px", borderRadius: 6, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: 14, outline: "none" }} />
      ))}
      <button onClick={onRemove} style={{ background: "rgba(255,80,80,0.15)", border: "none", color: "#ff6b6b", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
    </div>
  );
}

function ExerciseCard({ exercise, sets, onSetsChange, accent, cardBg }) {
  const addSet = () => onSetsChange([...sets, { weight: "", reps: "", rpe: "" }]);
  const updateSet = (i, val) => { const s = [...sets]; s[i] = val; onSetsChange(s); };
  const removeSet = (i) => onSetsChange(sets.filter((_, idx) => idx !== i));
  const totalVol = sets.reduce((acc, s) => acc + (parseFloat(s.weight)||0)*(parseFloat(s.reps)||0), 0);
  return (
    <div style={{ background: cardBg, borderRadius: 12, padding: 16, marginBottom: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, color: "#fff", letterSpacing: 1 }}>{exercise}</span>
        {totalVol > 0 && <span style={{ fontSize: 11, color: accent, fontWeight: 700, letterSpacing: 1 }}>{totalVol.toLocaleString()} lbs vol</span>}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        {["WEIGHT","REPS","RPE"].map(l => <span key={l} style={{ width: l==="RPE"?65:70, fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: 1 }}>{l}</span>)}
      </div>
      {sets.map((set, i) => <SetRow key={i} set={set} onChange={v => updateSet(i,v)} onRemove={() => removeSet(i)} />)}
      <button onClick={addSet} style={{ marginTop: 6, padding: "6px 14px", borderRadius: 6, border: `1px dashed ${accent}`, background: "transparent", color: accent, fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: 1 }}>+ ADD SET</button>
    </div>
  );
}

function HistoryView({ history, onBack }) {
  const [expanded, setExpanded] = useState(null);
  const sorted = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (sorted.length === 0) return (
    <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 24, letterSpacing: 2 }}>NO HISTORY YET</div>
      <button onClick={onBack} style={{ marginTop: 24, padding: "10px 24px", borderRadius: 8, background: "#E74C3C", border: "none", color: "#fff", fontFamily: "'Bebas Neue', cursive", fontSize: 18, letterSpacing: 2, cursor: "pointer" }}>BACK</button>
    </div>
  );
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 14 }}>← Back</button>
        <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, letterSpacing: 3, color: "#fff" }}>WORKOUT HISTORY</span>
      </div>
      {sorted.map((session, i) => {
        const c = DAY_COLORS[session.day] || DAY_COLORS["Day 1 — Push"];
        const isOpen = expanded === i;
        const totalSets = Object.values(session.exercises).reduce((a, s) => a + s.length, 0);
        const totalVol = Object.values(session.exercises).reduce((a, sets) => a + sets.reduce((b, s) => b + (parseFloat(s.weight)||0)*(parseFloat(s.reps)||0), 0), 0);
        return (
          <div key={i} style={{ background: c.card, borderRadius: 12, marginBottom: 10, border: `1px solid ${c.accent}33`, overflow: "hidden" }}>
            <div onClick={() => setExpanded(isOpen ? null : i)} style={{ padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, color: c.accent, letterSpacing: 1 }}>{session.day}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{new Date(session.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{totalSets} sets</div>
                {totalVol > 0 && <div style={{ fontSize: 12, color: c.accent, fontWeight: 700 }}>{totalVol.toLocaleString()} lbs</div>}
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 16 }}>{isOpen ? "▲" : "▼"}</div>
              </div>
            </div>
            {isOpen && (
              <div style={{ padding: "0 16px 16px" }}>
                {Object.entries(session.exercises).map(([ex, sets]) => sets.length > 0 && (
                  <div key={ex} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{ex}</div>
                    {sets.map((s, si) => <div key={si} style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginLeft: 12 }}>Set {si+1}: {s.weight}lbs × {s.reps} reps{s.rpe ? ` @ RPE ${s.rpe}` : ""}</div>)}
                  </div>
                ))}
                {session.notes && <div style={{ marginTop: 10, padding: 10, background: "rgba(255,255,255,0.05)", borderRadius: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", fontStyle: "italic" }}>"{session.notes}"</div>}
                {session.bennyQuote && <div style={{ marginTop: 10, padding: 10, background: "rgba(243,156,18,0.1)", borderRadius: 8, fontSize: 12, color: "#F39C12", fontStyle: "italic" }}>🐶 Benny: "{session.bennyQuote}"</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN APP ───
export default function App() {
  const [view, setView] = useState("checkin");
  const [activeDay, setActiveDay] = useState(null);
  const [sets, setSets] = useState({});
  const [notes, setNotes] = useState("");
  const [history, setHistory] = useState([]);
  const [saved, setSaved] = useState(false);
  const [reaction, setReaction] = useState(null);
  const [loadingReaction, setLoadingReaction] = useState(false);
  const [meals, setMeals] = useState([]);
  const [water, setWater] = useState(0);
  const [mealForm, setMealForm] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  const [bennyNutrition, setBennyNutrition] = useState(null);
  const [loadingBenny, setLoadingBenny] = useState(false);
  const [todayKey] = useState(new Date().toDateString());

  // Check-in
  const [energy, setEnergy] = useState(3);
  const [sleep, setSleep] = useState(3);
  const [stress, setStress] = useState(3);
  const [checkinNote, setCheckinNote] = useState("");
  const [bennyCheckin, setBennyCheckin] = useState(null);
  const [loadingCheckin, setLoadingCheckin] = useState(false);
  const [checkinSubmitted, setCheckinSubmitted] = useState(false);

  // Home greeting
  const [bennyGreeting, setBennyGreeting] = useState(null);
  const [loadingGreeting, setLoadingGreeting] = useState(false);

  useEffect(() => {
    try {
      const h = JSON.parse(localStorage.getItem("workout-history"));
      if (h) setHistory(h);
      const m = JSON.parse(localStorage.getItem(`meals-${todayKey}`));
      if (m) setMeals(m);
      const w = JSON.parse(localStorage.getItem(`water-${todayKey}`));
      if (w !== null) setWater(w);
      const c = JSON.parse(localStorage.getItem(`checkin-${todayKey}`));
      if (c) { setCheckinSubmitted(true); setView("home"); loadGreeting(0, 0); }
    } catch {}
  }, []);

  const loadGreeting = async (weekSessions, todayCal) => {
    setLoadingGreeting(true);
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    const prompt = `You are Benny, a sarcastic dachshund fitness coach. Give a FRESH, creative, funny opening greeting for your owner who just opened their workout app.

Context: ${weekSessions} workouts this week, ${todayCal} calories logged today, ${timeOfDay} on ${new Date().toLocaleDateString("en-US", { weekday: "long" })}.

Be completely random and creative every time. Never generic. Reference the time of day or day of week naturally if it's funny. 1-2 sentences max. Tiny sausage dog energy, big fitness opinions.`;
    try { setBennyGreeting(await askBenny(prompt)); }
    catch { setBennyGreeting("*yawns and stretches tiny legs* You showed up. Impressive. Now let's go."); }
    setLoadingGreeting(false);
  };

  const submitCheckin = async () => {
    setLoadingCheckin(true);
    const prompt = `You are Benny, a sarcastic dachshund fitness coach. Your owner just did their daily check-in.

Their status:
- Energy: ${energy}/5
- Sleep: ${sleep}/5
- Stress: ${stress}/5
- What they said: "${checkinNote || "nothing, they just tapped through like a robot"}"

React as Benny. Give them a short sarcastic but genuinely caring pep talk based on how they're actually doing. Low energy/sleep = acknowledge it but still motivate. High stress = be surprisingly soft about it (but still very dog-like). Everything great = act mildly annoyed you can't roast them. 2-3 sentences. You are a tiny dachshund who cares deeply but will NEVER fully admit it.`;
    try { setBennyCheckin(await askBenny(prompt)); }
    catch { setBennyCheckin("*tilts head sideways* Something went wrong but I still believe in you. Barely."); }
    setLoadingCheckin(false);
    try { localStorage.setItem(`checkin-${todayKey}`, JSON.stringify({ energy, sleep, stress, note: checkinNote })); } catch {}
    setCheckinSubmitted(true);
  };

  const goHome = () => {
    const weekSessions = history.filter(h => new Date(h.date) > new Date(Date.now()-7*86400000)).length;
    const todayCal = meals.reduce((a,m) => a+(parseInt(m.calories)||0), 0);
    loadGreeting(weekSessions, todayCal);
    setView("home");
  };

  const saveMeals = (updated) => {
    setMeals(updated);
    try { localStorage.setItem(`meals-${todayKey}`, JSON.stringify(updated)); } catch {}
  };

  const updateWater = (val) => {
    setWater(val);
    try { localStorage.setItem(`water-${todayKey}`, JSON.stringify(val)); } catch {}
  };

  const totals = meals.reduce((acc, m) => ({
    calories: acc.calories + (parseInt(m.calories)||0),
    protein: acc.protein + (parseInt(m.protein)||0),
    carbs: acc.carbs + (parseInt(m.carbs)||0),
    fat: acc.fat + (parseInt(m.fat)||0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const getBennyNutritionComment = async () => {
    setLoadingBenny(true); setBennyNutrition(null);
    const prompt = `You are Benny, a sarcastic dachshund fitness coach. Review your owner's nutrition.
Meals: ${meals.map(m => `${m.name} (${m.calories}cal, P:${m.protein}g, C:${m.carbs}g, F:${m.fat}g)`).join(", ") || "Nothing. Absolutely nothing."}
Totals: ${totals.calories}cal, ${totals.protein}g protein, ${totals.carbs}g carbs, ${totals.fat}g fat. Water: ${water}/8 glasses.
Goals: 2400cal, 178g protein, 220g carbs, 65g fat.
Be specific. Roast bad choices, reluctantly praise good ones. If protein is low: sigh dramatically. If water is low: act personally offended. 3-4 sentences. Sausage dog who takes macros very seriously.`;
    try { setBennyNutrition(await askBenny(prompt)); }
    catch { setBennyNutrition("*confused barking* My wifi went out. Eat your protein though."); }
    setLoadingBenny(false);
  };

  const startWorkout = (day) => {
    setActiveDay(day);
    const initial = {};
    WORKOUTS[day].forEach(ex => { initial[ex] = [{ weight: "", reps: "", rpe: "" }]; });
    setSets(initial); setNotes(""); setSaved(false); setView("workout");
  };

  const saveWorkout = async () => {
    const totalSets = Object.values(sets).reduce((a, s) => a + s.filter(x => x.weight && x.reps).length, 0);
    const totalVol = Object.values(sets).reduce((a, s) => a + s.reduce((b, x) => b + (parseFloat(x.weight)||0)*(parseFloat(x.reps)||0), 0), 0);
    const rpes = Object.values(sets).flat().map(s => parseFloat(s.rpe)).filter(Boolean);
    const avgRpe = rpes.length ? (rpes.reduce((a,b)=>a+b,0)/rpes.length).toFixed(1) : null;
    const exerciseSummary = Object.entries(sets).map(([ex, s]) => { const l = s.filter(x => x.weight && x.reps); return l.length ? `${ex}: ${l.map(x=>`${x.weight}lbs×${x.reps}${x.rpe?` @RPE${x.rpe}`:""}`).join(", ")}` : null; }).filter(Boolean).join("\n");
    setSaved(true); setView("reaction"); setLoadingReaction(true);
    const prompt = `You are Benny, a sarcastic dachshund personal trainer. Tiny dog, massive opinions.
Workout: ${activeDay}
${exerciseSummary || "Barely anything logged..."}
Sets: ${totalSets}/${Object.keys(sets).length * 3} expected. Volume: ${totalVol.toLocaleString()}lbs. Avg RPE: ${avgRpe || "not recorded"}. Notes: "${notes || "none"}".
React as Benny. Reference actual numbers. Crushed it = zoomies in text form. Slacked = dramatic flop and sigh. 1-2 dog puns max. 3-4 sentences. No fluff.`;
    try {
      const text = await askBenny(prompt);
      const isGood = totalSets >= Object.keys(sets).length * 3 * 0.7 && totalVol > 0;
      const session = { day: activeDay, date: new Date().toISOString(), exercises: sets, notes, bennyQuote: text.slice(0, 150) };
      const newHistory = [...history, session];
      setHistory(newHistory);
      try { localStorage.setItem("workout-history", JSON.stringify(newHistory)); } catch {}
      setReaction({ text, isGood, totalVol, totalSets, avgRpe });
    } catch {
      setReaction({ text: "*sniffs shoes disapprovingly and walks away*", isGood: false, totalVol: 0, totalSets: 0, avgRpe: null });
    }
    setLoadingReaction(false);
  };

  const colors = activeDay ? DAY_COLORS[activeDay] : DAY_COLORS["Day 1 — Push"];

  // ── CHECK-IN VIEW ──
  if (view === "checkin") return (
    <div style={{ minHeight: "100vh", background: "#0d0d14", fontFamily: "'Inter', sans-serif", padding: 20 }}>
      <style>{STYLES}</style>
      <div style={{ maxWidth: 480, margin: "0 auto", paddingTop: 20 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>🐶</div>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 32, color: "#fff", letterSpacing: 3 }}>DAILY CHECK-IN</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
        </div>

        {!checkinSubmitted ? (
          <div style={{ background: "#1a1a24", borderRadius: 16, padding: 20, border: "1px solid rgba(243,156,18,0.2)" }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 20, fontStyle: "italic" }}>Benny needs to assess the situation before you touch a single weight.</div>
            <RatingRow label="Energy Level" value={energy} onChange={setEnergy} emoji="⚡" />
            <RatingRow label="Sleep Quality" value={sleep} onChange={setSleep} emoji="😴" />
            <RatingRow label="Stress Level" value={stress} onChange={setStress} emoji="😤" />
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 600, marginBottom: 8 }}>💬 Anything else Benny should know?</div>
              <textarea placeholder="Tell Benny how you're really feeling... (optional)" value={checkinNote} onChange={e => setCheckinNote(e.target.value)}
                style={{ width: "100%", padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 13, resize: "none", height: 70, outline: "none" }} />
            </div>
            <button onClick={submitCheckin} disabled={loadingCheckin} style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: "#F39C12", color: "#000", fontFamily: "'Bebas Neue', cursive", fontSize: 20, letterSpacing: 3, cursor: "pointer", fontWeight: 700 }}>
              {loadingCheckin ? "BENNY IS ASSESSING..." : "GET BENNY'S VERDICT 🐾"}
            </button>
          </div>
        ) : (
          <div>
            {bennyCheckin && <BennyBubble text={bennyCheckin} mood="checkin" />}
            {!bennyCheckin && loadingCheckin && <BennyBubble text="" mood="checkin" loading={true} />}
            {bennyCheckin && (
              <button onClick={goHome} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: "#E74C3C", color: "#fff", fontFamily: "'Bebas Neue', cursive", fontSize: 22, letterSpacing: 3, cursor: "pointer", marginTop: 8 }}>
                LET'S GO 🐾
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ── REACTION VIEW ──
  if (view === "reaction") {
    const isGood = reaction?.isGood;
    return (
      <div style={{ minHeight: "100vh", background: isGood ? "#081a0e" : "#1a0808", fontFamily: "'Inter', sans-serif", padding: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{STYLES}</style>
        <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          {loadingReaction ? (
            <div>
              <div style={{ fontSize: 72, marginBottom: 16 }}>🐶</div>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 26, color: "#fff", letterSpacing: 3 }}>BENNY IS JUDGING YOUR LIFTS...</div>
              <div style={{ color: "rgba(255,255,255,0.4)", marginTop: 10, fontSize: 14 }}>He has a tiny clipboard. He's very serious.</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 80, marginBottom: 8 }}>{isGood ? "🐾" : "😒"}</div>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 30, color: isGood ? "#2ECC71" : "#E74C3C", letterSpacing: 3, marginBottom: 20 }}>BENNY'S VERDICT</div>
              <BennyBubble text={reaction?.text} mood={isGood ? "good" : "bad"} />
              {reaction && (
                <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                  {[{ label: "SETS", value: reaction.totalSets }, { label: "VOLUME", value: reaction.totalVol > 0 ? `${reaction.totalVol.toLocaleString()}lbs` : "—" }, { label: "AVG RPE", value: reaction.avgRpe || "—" }].map(s => (
                    <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "12px 8px" }}>
                      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, color: isGood ? "#2ECC71" : "#E74C3C" }}>{s.value}</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => { setView("home"); setReaction(null); setSaved(false); }} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: isGood ? "#2ECC71" : "#E74C3C", color: "#fff", fontFamily: "'Bebas Neue', cursive", fontSize: 22, letterSpacing: 3, cursor: "pointer" }}>BACK TO HOME</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── HISTORY VIEW ──
  if (view === "history") return (
    <div style={{ minHeight: "100vh", background: "#0d0d14", fontFamily: "'Inter', sans-serif", padding: 20 }}>
      <style>{STYLES}</style>
      <div style={{ maxWidth: 480, margin: "0 auto" }}><HistoryView history={history} onBack={() => setView("home")} /></div>
    </div>
  );

  // ── WORKOUT VIEW ──
  if (view === "workout") return (
    <div style={{ minHeight: "100vh", background: colors.bg, fontFamily: "'Inter', sans-serif", padding: 20 }}>
      <style>{STYLES}</style>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => setView("home")} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 14 }}>← Back</button>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 26, color: colors.accent, letterSpacing: 2, lineHeight: 1 }}>{activeDay}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1 }}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</div>
          </div>
        </div>
        {WORKOUTS[activeDay].map(ex => <ExerciseCard key={ex} exercise={ex} sets={sets[ex]||[]} onSetsChange={s => setSets({...sets,[ex]:s})} accent={colors.accent} cardBg={colors.card} />)}
        <textarea placeholder="Session notes (how you felt, PRs, etc...)" value={notes} onChange={e => setNotes(e.target.value)}
          style={{ width: "100%", padding: 14, borderRadius: 12, marginTop: 4, marginBottom: 16, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 14, resize: "none", height: 80, outline: "none" }} />
        <button onClick={saveWorkout} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: saved ? "#2ECC71" : colors.accent, color: "#fff", fontFamily: "'Bebas Neue', cursive", fontSize: 22, letterSpacing: 3, cursor: "pointer" }}>
          {saved ? "✓ SAVED!" : "SAVE WORKOUT"}
        </button>
        <div style={{ height: 40 }} />
      </div>
    </div>
  );

  // ── NUTRITION VIEW ──
  if (view === "calories") return (
    <div style={{ minHeight: "100vh", background: "#0d0d14", fontFamily: "'Inter', sans-serif", padding: 20 }}>
      <style>{STYLES}</style>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => setView("home")} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 14 }}>← Back</button>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, color: "#9B59B6", letterSpacing: 2 }}>NUTRITION</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</div>
          </div>
        </div>
        <div style={{ background: "#1a1a24", borderRadius: 16, padding: 20, marginBottom: 16, border: "1px solid rgba(155,89,182,0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 36, color: totals.calories > GOALS.calories ? "#E74C3C" : "#fff", lineHeight: 1 }}>{totals.calories}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1 }}>/ {GOALS.calories} CALORIES</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{Math.max(0, GOALS.calories - totals.calories)} remaining</div>
              <div style={{ fontSize: 11, color: "#9B59B6", marginTop: 2 }}>Goal: {GOALS.calories} kcal</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <MacroRing label="PROTEIN" current={totals.protein} goal={GOALS.protein} color="#E74C3C" />
            <MacroRing label="CARBS" current={totals.carbs} goal={GOALS.carbs} color="#F39C12" />
            <MacroRing label="FAT" current={totals.fat} goal={GOALS.fat} color="#3498DB" />
          </div>
        </div>
        <WaterTracker glasses={water} onAdd={() => updateWater(Math.min(water+1,GOALS.water))} onRemove={() => updateWater(Math.max(water-1,0))} />
        <div style={{ marginBottom: 16 }}>
          {bennyNutrition && <BennyBubble text={bennyNutrition} mood="food" />}
          <button onClick={getBennyNutritionComment} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid rgba(243,156,18,0.4)", background: "rgba(243,156,18,0.08)", color: "#F39C12", fontFamily: "'Bebas Neue', cursive", fontSize: 17, letterSpacing: 2, cursor: "pointer" }}>
            {loadingBenny ? "🐶 BENNY IS SNIFFING YOUR FOOD..." : "🐶 ASK BENNY ABOUT MY NUTRITION"}
          </button>
        </div>
        <div style={{ background: "#1a1a24", borderRadius: 16, padding: 16, marginBottom: 16, border: "1px solid rgba(155,89,182,0.2)" }}>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, color: "#9B59B6", letterSpacing: 1, marginBottom: 12 }}>LOG A MEAL</div>
          <input placeholder="Meal name" value={mealForm.name} onChange={e => setMealForm({...mealForm, name: e.target.value})}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 14, outline: "none", marginBottom: 8 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            {[["Calories","calories"],["Protein (g)","protein"],["Carbs (g)","carbs"],["Fat (g)","fat"]].map(([ph, key]) => (
              <input key={key} type="number" placeholder={ph} value={mealForm[key]} onChange={e => setMealForm({...mealForm,[key]:e.target.value})}
                style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 14, outline: "none" }} />
            ))}
          </div>
          <button onClick={() => { if (!mealForm.name || !mealForm.calories) return; saveMeals([...meals, { ...mealForm, id: Date.now() }]); setMealForm({ name: "", calories: "", protein: "", carbs: "", fat: "" }); }}
            style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "#9B59B6", color: "#fff", fontFamily: "'Bebas Neue', cursive", fontSize: 18, letterSpacing: 2, cursor: "pointer" }}>+ ADD MEAL</button>
        </div>
        {meals.length > 0 && (
          <div>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 14, color: "rgba(255,255,255,0.4)", letterSpacing: 2, marginBottom: 8 }}>TODAY'S MEALS</div>
            {meals.map(meal => <MealCard key={meal.id} meal={meal} onRemove={() => saveMeals(meals.filter(m => m.id !== meal.id))} />)}
          </div>
        )}
        <div style={{ height: 40 }} />
      </div>
    </div>
  );

  // ── HOME VIEW ──
  const weekSessions = history.filter(h => new Date(h.date) > new Date(Date.now()-7*86400000)).length;
  return (
    <div style={{ minHeight: "100vh", background: "#0d0d14", fontFamily: "'Inter', sans-serif", padding: 20 }}>
      <style>{STYLES}</style>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ marginBottom: 20, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 42, letterSpacing: 4, color: "#fff", lineHeight: 1 }}>LIFT<span style={{ color: "#E74C3C" }}>LOG</span></div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: 2, marginTop: 4 }}>YOUR CUT & LEAN PLAN</div>
          </div>
          <div style={{ textAlign: "right", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
            <div>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
            <div style={{ color: totals.calories > GOALS.calories ? "#E74C3C" : "#F39C12", fontWeight: 700 }}>{totals.calories} / {GOALS.calories} cal</div>
          </div>
        </div>

        {/* Fresh Benny Greeting */}
        <div style={{ background: "rgba(243,156,18,0.07)", borderRadius: 14, padding: 16, marginBottom: 20, border: "1px solid rgba(243,156,18,0.25)", cursor: "pointer" }} onClick={() => loadGreeting(weekSessions, totals.calories)}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ fontSize: 44, flexShrink: 0 }}>🐶</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 13, color: "#F39C12", letterSpacing: 2, marginBottom: 4 }}>BENNY SAYS: <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "Inter, sans-serif", letterSpacing: 0, fontWeight: 400 }}>tap to refresh</span></div>
              {loadingGreeting
                ? <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>*thinking of something sarcastic...*</div>
                : <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>{bennyGreeting || "Loading Benny..."}</div>}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {[{ label: "SESSIONS", value: history.length }, { label: "THIS WEEK", value: weekSessions }, { label: "TODAY CAL", value: totals.calories }].map(stat => (
            <div key={stat.label} style={{ flex: 1, background: "#1a1a24", borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 26, color: "#E74C3C", lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: 1, marginTop: 3 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: 2, marginBottom: 10 }}>SELECT WORKOUT</div>
          {Object.keys(WORKOUTS).map(day => {
            const c = DAY_COLORS[day];
            const lastSession = [...history].reverse().find(h => h.day === day);
            return (
              <button key={day} onClick={() => startWorkout(day)} style={{ width: "100%", marginBottom: 10, padding: "16px 20px", background: c.card, border: `1px solid ${c.accent}44`, borderRadius: 12, cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = c.accent}
                onMouseLeave={e => e.currentTarget.style.borderColor = `${c.accent}44`}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 20, color: "#fff", letterSpacing: 1 }}>{day}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{WORKOUTS[day].length} exercises{lastSession && ` · Last: ${new Date(lastSession.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}</div>
                </div>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, color: c.accent }}>→</div>
              </button>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <button onClick={() => setView("calories")} style={{ padding: "14px", borderRadius: 12, background: "rgba(155,89,182,0.15)", border: "1px solid rgba(155,89,182,0.4)", color: "#9B59B6", fontFamily: "'Bebas Neue', cursive", fontSize: 16, letterSpacing: 2, cursor: "pointer" }}>🍖 NUTRITION</button>
          <button onClick={() => setView("history")} style={{ padding: "14px", borderRadius: 12, background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", fontFamily: "'Bebas Neue', cursive", fontSize: 16, letterSpacing: 2, cursor: "pointer" }}>📋 HISTORY</button>
        </div>
        <button onClick={() => { setCheckinSubmitted(false); setBennyCheckin(null); setView("checkin"); }} style={{ width: "100%", padding: "12px", borderRadius: 12, background: "transparent", border: "1px solid rgba(243,156,18,0.25)", color: "rgba(243,156,18,0.6)", fontFamily: "'Bebas Neue', cursive", fontSize: 14, letterSpacing: 2, cursor: "pointer" }}>🐶 REDO CHECK-IN</button>
        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
