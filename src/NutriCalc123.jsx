import { useState, useEffect, useRef, createContext, useContext } from "react";
import { createClient } from "@supabase/supabase-js";
import IT from "./translations/it";
import EN from "./translations/en";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const SB_URL = process.env.REACT_APP_SUPABASE_URL  || "";
const SB_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || "";
const USDA_K = process.env.REACT_APP_USDA_KEY      || "DEMO_KEY";
const supabase = SB_URL && SB_KEY ? createClient(SB_URL, SB_KEY) : null;

// ─── THEME ────────────────────────────────────────────────────────────────────
const AC = "#a3e635", BG = "#0a0a0a", CARD = "#141414", BOR = "#1f1f1f";
const DIM = "#444", MID = "#888", G = "#4ade80", B = "#60a5fa", Y = "#f59e0b", R = "#f87171";
const GFONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
input::-webkit-inner-spin-button{-webkit-appearance:none}
input[type=number]{-moz-appearance:textfield}
::-webkit-scrollbar{display:none}`;
const rnd = (n) => Math.round(n);

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const LS = {
  save: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  load: (k)    => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  del:  (k)    => { try { localStorage.removeItem(k); } catch {} },
};

// ─── I18N ─────────────────────────────────────────────────────────────────────
const TRANSLATIONS = { it: IT, en: EN };
const LangContext = createContext({ lang: 'it', t: k => k });
const useLang = () => useContext(LangContext);

// ─── SUPABASE DATA LAYER ──────────────────────────────────────────────────────
const SB = {
  async saveProfile(uid, data) {
    if (!supabase) return;
    await supabase.from("profiles").upsert({ id: uid, ...data, updated_at: new Date().toISOString() });
  },
  async loadProfile(uid) {
    if (!supabase) return null;
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    return data;
  },
  async saveWeightLog(uid, logs) {
    if (!supabase) return;
    await supabase.from("weight_logs").delete().eq("user_id", uid);
    if (logs.length) await supabase.from("weight_logs").insert(logs.map(l => ({ user_id: uid, date: l.date, weight: l.weight })));
  },
  async loadWeightLog(uid) {
    if (!supabase) return [];
    const { data } = await supabase.from("weight_logs").select("*").eq("user_id", uid).order("date");
    return data ? data.map(d => ({ date: d.date, weight: d.weight })) : [];
  },
  async saveFavorites(uid, favs) {
    if (!supabase) return;
    await supabase.from("favorites").delete().eq("user_id", uid);
    if (favs.length) await supabase.from("favorites").insert(favs.map(f => ({ user_id: uid, name: f.name, meal_type: f.mealType, items: f.items, fav_id: f.id })));
  },
  async loadFavorites(uid) {
    if (!supabase) return [];
    const { data } = await supabase.from("favorites").select("*").eq("user_id", uid).order("created_at");
    return data ? data.map(d => ({ id: d.fav_id || d.id, name: d.name, mealType: d.meal_type, items: d.items })) : [];
  },
};

// ─── FOOD DATABASE ────────────────────────────────────────────────────────────
const FOODS = {
  "Proteine": [
    { name:"Petto di pollo",     nameEn:"Chicken breast",       emoji:"🍗", cal:165, p:31,  c:0,   f:3.6 },
    { name:"Tacchino",           nameEn:"Turkey",               emoji:"🦃", cal:189, p:29,  c:0,   f:7   },
    { name:"Macinato manzo 5%",  nameEn:"Ground beef 5%",       emoji:"🥩", cal:137, p:21,  c:0,   f:5   },
    { name:"Salmone",            nameEn:"Salmon",               emoji:"🐠", cal:208, p:20,  c:0,   f:13  },
    { name:"Tonno al naturale",  nameEn:"Tuna in water",        emoji:"🐟", cal:116, p:26,  c:0,   f:1   },
    { name:"Merluzzo",           nameEn:"Cod",                  emoji:"🐡", cal:82,  p:18,  c:0,   f:0.7 },
    { name:"Sgombro",            nameEn:"Mackerel",             emoji:"🐟", cal:205, p:19,  c:0,   f:14  },
    { name:"Uova intere",        nameEn:"Whole eggs",           emoji:"🥚", cal:155, p:13,  c:1.1, f:11  },
    { name:"Albumi",             nameEn:"Egg whites",           emoji:"🥣", cal:52,  p:11,  c:0.7, f:0.2 },
    { name:"Yogurt greco 0%",    nameEn:"Greek yogurt 0%",      emoji:"🫙", cal:59,  p:10,  c:3.6, f:0.4 },
    { name:"Ricotta magra",      nameEn:"Low-fat ricotta",      emoji:"🧀", cal:138, p:11,  c:4,   f:8   },
    { name:"Tofu",               nameEn:"Tofu",                 emoji:"🍱", cal:76,  p:8,   c:2,   f:4   },
    { name:"Proteine Whey",      nameEn:"Whey protein",         emoji:"🥛", cal:380, p:75,  c:7,   f:5   },
    { name:"Proteine Vegan",     nameEn:"Vegan protein",        emoji:"🌱", cal:360, p:70,  c:10,  f:4   },
    { name:"Caseina",            nameEn:"Casein",               emoji:"🥛", cal:370, p:72,  c:8,   f:4   },
    { name:"Gamberetti",         nameEn:"Shrimp",               emoji:"🦐", cal:85,  p:18,  c:0.9, f:0.9 },
    { name:"Bresaola",           nameEn:"Bresaola",             emoji:"🥩", cal:151, p:32,  c:0.5, f:2   },
    { name:"Prosciutto cotto",   nameEn:"Cooked ham",           emoji:"🥩", cal:149, p:19,  c:1,   f:7   },
  ],
  "Carboidrati": [
    { name:"Riso bianco (cotto)",     nameEn:"White rice (cooked)",        emoji:"🍚", cal:130, p:2.7, c:28, f:0.3 },
    { name:"Riso integrale (cotto)",  nameEn:"Brown rice (cooked)",        emoji:"🍚", cal:112, p:2.6, c:23, f:0.9 },
    { name:"Pasta (cotta)",           nameEn:"Pasta (cooked)",             emoji:"🍝", cal:158, p:5.8, c:31, f:0.9 },
    { name:"Pasta integrale (cotta)", nameEn:"Whole wheat pasta (cooked)", emoji:"🍝", cal:150, p:5.5, c:28, f:1.1 },
    { name:"Avena",                   nameEn:"Oats",                       emoji:"🌾", cal:389, p:17,  c:66, f:7   },
    { name:"Pane integrale",          nameEn:"Whole wheat bread",          emoji:"🍞", cal:247, p:13,  c:41, f:3.4 },
    { name:"Patate (cotte)",          nameEn:"Potatoes (cooked)",          emoji:"🥔", cal:87,  p:1.9, c:20, f:0.1 },
    { name:"Quinoa (cotta)",          nameEn:"Quinoa (cooked)",            emoji:"🌿", cal:120, p:4.4, c:21, f:1.9 },
    { name:"Lenticchie (cotte)",      nameEn:"Lentils (cooked)",           emoji:"🫘", cal:116, p:9,   c:20, f:0.4 },
    { name:"Ceci (cotti)",            nameEn:"Chickpeas (cooked)",         emoji:"🫘", cal:164, p:8.9, c:27, f:2.6 },
    { name:"Banana",                  nameEn:"Banana",                     emoji:"🍌", cal:89,  p:1.1, c:23, f:0.3 },
    { name:"Mela",                    nameEn:"Apple",                      emoji:"🍎", cal:52,  p:0.3, c:14, f:0.2 },
    { name:"Mirtilli",                nameEn:"Blueberries",                emoji:"🫐", cal:57,  p:0.7, c:14, f:0.3 },
    { name:"Farro (cotto)",           nameEn:"Spelt (cooked)",             emoji:"🌾", cal:140, p:5,   c:27, f:1   },
  ],
  "Verdure": [
    { name:"Broccoli",       nameEn:"Broccoli",     emoji:"🥦", cal:34, p:2.8, c:7,   f:0.4 },
    { name:"Spinaci",        nameEn:"Spinach",      emoji:"🥬", cal:23, p:2.9, c:3.6, f:0.4 },
    { name:"Zucchine",       nameEn:"Zucchini",     emoji:"🥒", cal:17, p:1.2, c:3.1, f:0.3 },
    { name:"Pomodori",       nameEn:"Tomatoes",     emoji:"🍅", cal:18, p:0.9, c:3.9, f:0.2 },
    { name:"Insalata mista", nameEn:"Mixed salad",  emoji:"🥗", cal:15, p:1.3, c:2.9, f:0.2 },
    { name:"Peperoni",       nameEn:"Bell peppers", emoji:"🫑", cal:31, p:1,   c:6,   f:0.3 },
    { name:"Carote",         nameEn:"Carrots",      emoji:"🥕", cal:41, p:0.9, c:10,  f:0.2 },
    { name:"Asparagi",       nameEn:"Asparagus",    emoji:"🌿", cal:20, p:2.2, c:3.9, f:0.1 },
    { name:"Funghi",         nameEn:"Mushrooms",    emoji:"🍄", cal:22, p:3.1, c:3.3, f:0.3 },
  ],
  "Grassi": [
    { name:"Olio d'oliva",      nameEn:"Olive oil",     emoji:"🫒", cal:884, p:0,  c:0,  f:100 },
    { name:"Avocado",           nameEn:"Avocado",       emoji:"🥑", cal:160, p:2,  c:9,  f:15  },
    { name:"Mandorle",          nameEn:"Almonds",       emoji:"🌰", cal:579, p:21, c:22, f:50  },
    { name:"Noci",              nameEn:"Walnuts",       emoji:"🥜", cal:654, p:15, c:14, f:65  },
    { name:"Burro di arachidi", nameEn:"Peanut butter", emoji:"🥜", cal:588, p:25, c:20, f:50  },
    { name:"Semi di chia",      nameEn:"Chia seeds",    emoji:"🌱", cal:486, p:17, c:42, f:31  },
  ],
  "Bevande": [
    { name:"Acqua",               nameEn:"Water",           emoji:"💧", cal:0,  p:0,   c:0,    f:0,   unit:"ml" },
    { name:"Caffè espresso",      nameEn:"Espresso coffee", emoji:"☕", cal:2,  p:0.1, c:0,    f:0,   unit:"ml" },
    { name:"Latte intero",        nameEn:"Whole milk",      emoji:"🥛", cal:61, p:3.2, c:4.8,  f:3.3, unit:"ml" },
    { name:"Latte scremato",      nameEn:"Skim milk",       emoji:"🥛", cal:35, p:3.4, c:4.9,  f:0.1, unit:"ml" },
    { name:"Latte di soia",       nameEn:"Soy milk",        emoji:"🌱", cal:33, p:2.9, c:1.8,  f:1.8, unit:"ml" },
    { name:"Succo d'arancia",     nameEn:"Orange juice",    emoji:"🍊", cal:45, p:0.7, c:10.4, f:0.2, unit:"ml" },
    { name:"Vino rosso",          nameEn:"Red wine",        emoji:"🍷", cal:85, p:0.1, c:2.6,  f:0,   unit:"ml" },
    { name:"Birra",               nameEn:"Beer",            emoji:"🍺", cal:43, p:0.5, c:3.6,  f:0,   unit:"ml" },
    { name:"Cola",                nameEn:"Cola",            emoji:"🥤", cal:42, p:0,   c:10.6, f:0,   unit:"ml" },
    { name:"Cola diet",           nameEn:"Diet cola",       emoji:"🥤", cal:0,  p:0,   c:0,    f:0,   unit:"ml" },
    { name:"Energy drink",        nameEn:"Energy drink",    emoji:"⚡", cal:45, p:0,   c:11,   f:0,   unit:"ml" },
  ],
};

const FOODS_EN = {
  "Proteins": [
    { name:"Chicken breast",            emoji:"🍗", cal:165, p:31,  c:0,   f:3.6 },
    { name:"Turkey",                    emoji:"🦃", cal:189, p:29,  c:0,   f:7   },
    { name:"Ground beef 5%",            emoji:"🥩", cal:137, p:21,  c:0,   f:5   },
    { name:"Salmon",                    emoji:"🐠", cal:208, p:20,  c:0,   f:13  },
    { name:"Tuna in water",             emoji:"🐟", cal:116, p:26,  c:0,   f:1   },
    { name:"Cod",                       emoji:"🐡", cal:82,  p:18,  c:0,   f:0.7 },
    { name:"Mackerel",                  emoji:"🐟", cal:205, p:19,  c:0,   f:14  },
    { name:"Whole eggs",                emoji:"🥚", cal:155, p:13,  c:1.1, f:11  },
    { name:"Egg whites",                emoji:"🥣", cal:52,  p:11,  c:0.7, f:0.2 },
    { name:"Greek yogurt 0%",           emoji:"🫙", cal:59,  p:10,  c:3.6, f:0.4 },
    { name:"Low-fat ricotta",           emoji:"🧀", cal:138, p:11,  c:4,   f:8   },
    { name:"Tofu",                      emoji:"🍱", cal:76,  p:8,   c:2,   f:4   },
    { name:"Whey protein",              emoji:"🥛", cal:380, p:75,  c:7,   f:5   },
    { name:"Vegan protein",             emoji:"🌱", cal:360, p:70,  c:10,  f:4   },
    { name:"Casein",                    emoji:"🥛", cal:370, p:72,  c:8,   f:4   },
    { name:"Shrimp",                    emoji:"🦐", cal:85,  p:18,  c:0.9, f:0.9 },
    { name:"Bresaola",                  emoji:"🥩", cal:151, p:32,  c:0.5, f:2   },
    { name:"Cooked ham",                emoji:"🥩", cal:149, p:19,  c:1,   f:7   },
  ],
  "Carbohydrates": [
    { name:"White rice (cooked)",       emoji:"🍚", cal:130, p:2.7, c:28, f:0.3 },
    { name:"Brown rice (cooked)",       emoji:"🍚", cal:112, p:2.6, c:23, f:0.9 },
    { name:"Pasta (cooked)",            emoji:"🍝", cal:158, p:5.8, c:31, f:0.9 },
    { name:"Whole wheat pasta (cooked)",emoji:"🍝", cal:150, p:5.5, c:28, f:1.1 },
    { name:"Oats",                      emoji:"🌾", cal:389, p:17,  c:66, f:7   },
    { name:"Whole wheat bread",         emoji:"🍞", cal:247, p:13,  c:41, f:3.4 },
    { name:"Potatoes (cooked)",         emoji:"🥔", cal:87,  p:1.9, c:20, f:0.1 },
    { name:"Quinoa (cooked)",           emoji:"🌿", cal:120, p:4.4, c:21, f:1.9 },
    { name:"Lentils (cooked)",          emoji:"🫘", cal:116, p:9,   c:20, f:0.4 },
    { name:"Chickpeas (cooked)",        emoji:"🫘", cal:164, p:8.9, c:27, f:2.6 },
    { name:"Banana",                    emoji:"🍌", cal:89,  p:1.1, c:23, f:0.3 },
    { name:"Apple",                     emoji:"🍎", cal:52,  p:0.3, c:14, f:0.2 },
    { name:"Blueberries",               emoji:"🫐", cal:57,  p:0.7, c:14, f:0.3 },
    { name:"Spelt (cooked)",            emoji:"🌾", cal:140, p:5,   c:27, f:1   },
  ],
  "Vegetables": [
    { name:"Broccoli",                  emoji:"🥦", cal:34, p:2.8, c:7,   f:0.4 },
    { name:"Spinach",                   emoji:"🥬", cal:23, p:2.9, c:3.6, f:0.4 },
    { name:"Zucchini",                  emoji:"🥒", cal:17, p:1.2, c:3.1, f:0.3 },
    { name:"Tomatoes",                  emoji:"🍅", cal:18, p:0.9, c:3.9, f:0.2 },
    { name:"Mixed salad",               emoji:"🥗", cal:15, p:1.3, c:2.9, f:0.2 },
    { name:"Bell peppers",              emoji:"🫑", cal:31, p:1,   c:6,   f:0.3 },
    { name:"Carrots",                   emoji:"🥕", cal:41, p:0.9, c:10,  f:0.2 },
    { name:"Asparagus",                 emoji:"🌿", cal:20, p:2.2, c:3.9, f:0.1 },
    { name:"Mushrooms",                 emoji:"🍄", cal:22, p:3.1, c:3.3, f:0.3 },
  ],
  "Fats": [
    { name:"Olive oil",                 emoji:"🫒", cal:884, p:0,  c:0,  f:100 },
    { name:"Avocado",                   emoji:"🥑", cal:160, p:2,  c:9,  f:15  },
    { name:"Almonds",                   emoji:"🌰", cal:579, p:21, c:22, f:50  },
    { name:"Walnuts",                   emoji:"🥜", cal:654, p:15, c:14, f:65  },
    { name:"Peanut butter",             emoji:"🥜", cal:588, p:25, c:20, f:50  },
    { name:"Chia seeds",                emoji:"🌱", cal:486, p:17, c:42, f:31  },
  ],
  "Beverages": [
    { name:"Water",                     emoji:"💧", cal:0,  p:0,   c:0,    f:0,   unit:"ml" },
    { name:"Espresso coffee",           emoji:"☕", cal:2,  p:0.1, c:0,    f:0,   unit:"ml" },
    { name:"Whole milk",                emoji:"🥛", cal:61, p:3.2, c:4.8,  f:3.3, unit:"ml" },
    { name:"Skim milk",                 emoji:"🥛", cal:35, p:3.4, c:4.9,  f:0.1, unit:"ml" },
    { name:"Soy milk",                  emoji:"🌱", cal:33, p:2.9, c:1.8,  f:1.8, unit:"ml" },
    { name:"Orange juice",              emoji:"🍊", cal:45, p:0.7, c:10.4, f:0.2, unit:"ml" },
    { name:"Red wine",                  emoji:"🍷", cal:85, p:0.1, c:2.6,  f:0,   unit:"ml" },
    { name:"Beer",                      emoji:"🍺", cal:43, p:0.5, c:3.6,  f:0,   unit:"ml" },
    { name:"Cola",                      emoji:"🥤", cal:42, p:0,   c:10.6, f:0,   unit:"ml" },
    { name:"Diet cola",                 emoji:"🥤", cal:0,  p:0,   c:0,    f:0,   unit:"ml" },
    { name:"Energy drink",              emoji:"⚡", cal:45, p:0,   c:11,   f:0,   unit:"ml" },
  ],
};

function getFoods(lang) {
  return lang === 'en' ? FOODS_EN : FOODS;
}

function findFood(name, lang = 'it') {
  const all = Object.values(getFoods(lang)).flat();
  const found = all.find(f => f.name === name);
  if (found) return found;
  // Fallback for old stored items: if searching English DB, try matching against Italian DB's nameEn
  if (lang === 'en') {
    const itFood = Object.values(FOODS).flat().find(f => f.name === name || f.nameEn === name);
    if (itFood) return Object.values(FOODS_EN).flat().find(f => f.name === itFood.nameEn);
  }
  return undefined;
}

// ─── USDA FOOD DATA CENTRAL ───────────────────────────────────────────────────
function parseUSDA(food) {
  const nu = food.foodNutrients || [];
  const get = (...keys) => {
    for (const k of keys) {
      const n = nu.find(n => n.nutrientName?.toLowerCase().includes(k));
      if (n?.value != null) return parseFloat(n.value) || 0;
    }
    return 0;
  };
  const cal = get("energy");
  const p   = get("protein");
  const c   = get("carbohydrate");
  const f   = get("total lipid", "fat");
  const name = (food.description || "").trim();
  if (!name || cal === 0) return null;
  return {
    name:   name.length > 52 ? name.slice(0, 52) + "…" : name,
    emoji:  "🔬",
    cal:    Math.round(cal * 10) / 10,
    p:      Math.round(p   * 10) / 10,
    c:      Math.round(c   * 10) / 10,
    f:      Math.round(f   * 10) / 10,
    source: "usda",
    brand:  food.brandName || food.brandOwner || "",
  };
}
async function searchUSDA(query) {
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&api_key=${USDA_K}&pageSize=25&dataType=Foundation,SR%20Legacy,Branded`;
  const res  = await fetch(url);
  if (!res.ok) throw new Error("USDA error");
  const data = await res.json();
  return (data.foods || []).map(parseUSDA).filter(Boolean).slice(0, 20);
}

// ─── SUPPLEMENTS ──────────────────────────────────────────────────────────────
const SUPPLEMENTS = {
  it: [
    { name:"Omega-3",    icon:"🐟", color:B,        dose:"2-3g EPA+DHA al giorno",  timing:"Con i pasti principali",         benefits:["Riduce l'infiammazione","Supporta la salute cardiovascolare","Migliora il recupero muscolare"], goals:["lose","maintain","gain"], priority:["lose","maintain"], note:"Scegli prodotti con almeno 60% di EPA+DHA sul totale." },
    { name:"Magnesio",   icon:"⚡", color:"#a78bfa", dose:"300-400mg al giorno",     timing:"La sera prima di dormire",       benefits:["Migliora la qualità del sonno","Riduce stanchezza e crampi","Supporta il sistema nervoso"], goals:["lose","maintain","gain"], priority:["lose"], note:"Preferisci bisglicinato o citrato rispetto all'ossido." },
    { name:"Vitamina D", icon:"☀️", color:Y,        dose:"2000-4000 UI al giorno",   timing:"Al mattino con un pasto grasso", benefits:["Supporta il sistema immunitario","Favorisce la salute ossea","Regola l'umore"], goals:["lose","maintain","gain"], priority:["maintain"], note:"In Italia la carenza è diffusa. Fai un'analisi del sangue per verificare i tuoi livelli." },
    { name:"Creatina",   icon:"💪", color:G,        dose:"3-5g al giorno",           timing:"Qualsiasi ora, con costanza",    benefits:["Aumenta forza e potenza","Accelera la sintesi proteica","Migliora le prestazioni ad alta intensità"], goals:["gain","maintain"], priority:["gain"], note:"Uno degli integratori più studiati e sicuri. Non serve il carico iniziale." },
  ],
  en: [
    { name:"Omega-3",   icon:"🐟", color:B,        dose:"2-3g EPA+DHA per day",  timing:"With main meals",                  benefits:["Reduces inflammation","Supports cardiovascular health","Improves muscle recovery"], goals:["lose","maintain","gain"], priority:["lose","maintain"], note:"Choose products with at least 60% EPA+DHA of total." },
    { name:"Magnesium", icon:"⚡", color:"#a78bfa", dose:"300-400mg per day",     timing:"In the evening before sleeping",   benefits:["Improves sleep quality","Reduces fatigue and cramps","Supports the nervous system"], goals:["lose","maintain","gain"], priority:["lose"], note:"Prefer bisglycinate or citrate over oxide." },
    { name:"Vitamin D", icon:"☀️", color:Y,        dose:"2000-4000 IU per day",  timing:"In the morning with a fatty meal", benefits:["Supports the immune system","Promotes bone health","Regulates mood"], goals:["lose","maintain","gain"], priority:["maintain"], note:"Deficiency is widespread. Get a blood test to check your levels." },
    { name:"Creatine",  icon:"💪", color:G,        dose:"3-5g per day",          timing:"Any time, consistently",           benefits:["Increases strength and power","Accelerates protein synthesis","Improves high-intensity performance"], goals:["gain","maintain"], priority:["gain"], note:"One of the most studied and safe supplements. No loading phase needed." },
  ],
};

// ─── MEAL CONFIGS ─────────────────────────────────────────────────────────────
const MEAL_CONFIGS = {
  it: {
    2: [{ name:"Pranzo", icon:"🕛", time:"13:00" }, { name:"Cena", icon:"🌙", time:"19:00" }],
    3: [{ name:"Colazione", icon:"☀️", time:"07:00" }, { name:"Pranzo", icon:"🕛", time:"13:00" }, { name:"Cena", icon:"🌙", time:"19:00" }],
    4: [{ name:"Colazione", icon:"☀️", time:"07:00" }, { name:"Pranzo", icon:"🕛", time:"13:00" }, { name:"Spuntino", icon:"🍎", time:"16:00" }, { name:"Cena", icon:"🌙", time:"19:00" }],
    5: [{ name:"Colazione", icon:"☀️", time:"07:00" }, { name:"Spuntino mattina", icon:"🍎", time:"10:00" }, { name:"Pranzo", icon:"🕛", time:"13:00" }, { name:"Spuntino pomeriggio", icon:"🍐", time:"16:00" }, { name:"Cena", icon:"🌙", time:"19:00" }],
    6: [{ name:"Colazione", icon:"☀️", time:"07:00" }, { name:"Spuntino mattina", icon:"🍎", time:"10:00" }, { name:"Pranzo", icon:"🕛", time:"13:00" }, { name:"Spuntino pomeriggio", icon:"🍐", time:"16:00" }, { name:"Cena", icon:"🌙", time:"19:00" }, { name:"Spuntino sera", icon:"🌛", time:"21:30" }],
  },
  en: {
    2: [{ name:"Lunch", icon:"🕛", time:"1:00 PM" }, { name:"Dinner", icon:"🌙", time:"7:00 PM" }],
    3: [{ name:"Breakfast", icon:"☀️", time:"7:00 AM" }, { name:"Lunch", icon:"🕛", time:"1:00 PM" }, { name:"Dinner", icon:"🌙", time:"7:00 PM" }],
    4: [{ name:"Breakfast", icon:"☀️", time:"7:00 AM" }, { name:"Lunch", icon:"🕛", time:"1:00 PM" }, { name:"Snack", icon:"🍎", time:"4:00 PM" }, { name:"Dinner", icon:"🌙", time:"7:00 PM" }],
    5: [{ name:"Breakfast", icon:"☀️", time:"7:00 AM" }, { name:"Morning snack", icon:"🍎", time:"10:00 AM" }, { name:"Lunch", icon:"🕛", time:"1:00 PM" }, { name:"Afternoon snack", icon:"🍐", time:"4:00 PM" }, { name:"Dinner", icon:"🌙", time:"7:00 PM" }],
    6: [{ name:"Breakfast", icon:"☀️", time:"7:00 AM" }, { name:"Morning snack", icon:"🍎", time:"10:00 AM" }, { name:"Lunch", icon:"🕛", time:"1:00 PM" }, { name:"Afternoon snack", icon:"🍐", time:"4:00 PM" }, { name:"Dinner", icon:"🌙", time:"7:00 PM" }, { name:"Evening snack", icon:"🌛", time:"9:30 PM" }],
  },
};
const SUGGESTED = {
  it: {
    "Colazione":           ["Avena","Yogurt greco 0%","Banana","Proteine Whey"],
    "Pranzo":              ["Petto di pollo","Riso bianco (cotto)","Broccoli","Olio d'oliva"],
    "Cena":                ["Salmone","Patate (cotte)","Spinaci","Olio d'oliva"],
    "Spuntino":            ["Yogurt greco 0%","Mela","Mandorle"],
    "Spuntino mattina":    ["Yogurt greco 0%","Proteine Whey","Banana"],
    "Spuntino pomeriggio": ["Albumi","Mela","Mandorle"],
    "Spuntino sera":       ["Ricotta magra","Mandorle"],
  },
  en: {
    "Breakfast":        ["Oats","Greek yogurt 0%","Banana","Whey protein"],
    "Lunch":            ["Chicken breast","White rice (cooked)","Broccoli","Olive oil"],
    "Dinner":           ["Salmon","Potatoes (cooked)","Spinach","Olive oil"],
    "Snack":            ["Greek yogurt 0%","Apple","Almonds"],
    "Morning snack":    ["Greek yogurt 0%","Whey protein","Banana"],
    "Afternoon snack":  ["Egg whites","Apple","Almonds"],
    "Evening snack":    ["Low-fat ricotta","Almonds"],
  },
};
const GOALS = {
  it: [
    { label:"Dimagrire", icon:"📉", value:"lose",     calAdj:-500, protein:2.2, fat:0.8, color:R },
    { label:"Mantenere", icon:"⚖️", value:"maintain", calAdj:0,    protein:1.8, fat:1.0, color:B },
    { label:"Massa",     icon:"📈", value:"gain",     calAdj:300,  protein:2.0, fat:1.0, color:G },
  ],
  en: [
    { label:"Lose weight",  icon:"📉", value:"lose",     calAdj:-500, protein:2.2, fat:0.8, color:R },
    { label:"Maintain",     icon:"⚖️", value:"maintain", calAdj:0,    protein:1.8, fat:1.0, color:B },
    { label:"Gain muscle",  icon:"📈", value:"gain",     calAdj:300,  protein:2.0, fat:1.0, color:G },
  ],
};
const ACTIVITY_LEVELS = {
  it: [
    { label:"Sedentario",           desc:"Poco o nessun esercizio",           value:1.2   },
    { label:"Leggermente attivo",   desc:"1-3 giorni a settimana",            value:1.375 },
    { label:"Moderatamente attivo", desc:"3-5 giorni a settimana",            value:1.55  },
    { label:"Molto attivo",         desc:"6-7 giorni a settimana",            value:1.725 },
    { label:"Atleta",               desc:"Allenamenti doppi o lavoro fisico", value:1.9   },
  ],
  en: [
    { label:"Sedentary",          desc:"Little or no exercise",        value:1.2   },
    { label:"Lightly active",     desc:"1-3 days per week",            value:1.375 },
    { label:"Moderately active",  desc:"3-5 days per week",            value:1.55  },
    { label:"Very active",        desc:"6-7 days per week",            value:1.725 },
    { label:"Athlete",            desc:"Double training or hard work", value:1.9   },
  ],
};

// ─── OPTIMIZER ────────────────────────────────────────────────────────────────
function optimize(foods, target) {
  if (!foods.length) return [];
  const n = foods.length;
  const Ct = target.calories||1, Pt = target.protein||1, Cht = target.carbs||1, Ft = target.fat||1;
  const q  = foods.map(f => Math.max(15, Math.min(400, f.cal > 0 ? (Ct/n)/(f.cal/100) : 100)));
  const mt = new Array(n).fill(0), vt = new Array(n).fill(0);
  const lr = 8, b1 = 0.9, b2 = 0.999, eps = 1e-8;
  for (let it = 1; it <= 900; it++) {
    let tC=0, tP=0, tCh=0, tF=0;
    foods.forEach((f,i) => { tC+=q[i]*f.cal/100; tP+=q[i]*f.p/100; tCh+=q[i]*f.c/100; tF+=q[i]*f.f/100; });
    foods.forEach((f,i) => {
      const g = 2*1.5*(tC-Ct)/(Ct*Ct)*f.cal/100 + 2*5*(tP-Pt)/(Pt*Pt)*f.p/100 + 2*1.5*(tCh-Cht)/(Cht*Cht)*f.c/100 + 2*4*(tF-Ft)/(Ft*Ft)*f.f/100;
      mt[i]=b1*mt[i]+(1-b1)*g; vt[i]=b2*vt[i]+(1-b2)*g*g;
      const mh=mt[i]/(1-Math.pow(b1,it)), vh=vt[i]/(1-Math.pow(b2,it));
      q[i]=Math.max(10,Math.min(500,q[i]-lr*mh/(Math.sqrt(vh)+eps)));
    });
  }
  return q.map(v => Math.max(5, Math.round(v/5)*5));
}
function totals(items) {
  return items.reduce((a,it) => {
    const x=it.quantity/100;
    return { cal:a.cal+it.food.cal*x, p:a.p+it.food.p*x, c:a.c+it.food.c*x, f:a.f+it.food.f*x };
  }, { cal:0,p:0,c:0,f:0 });
}

// ─── UI HELPERS ───────────────────────────────────────────────────────────────
const ps    = { background:BG, minHeight:"100vh", color:"#fff", fontFamily:"'DM Sans',system-ui,sans-serif", maxWidth:430, margin:"0 auto" };
const cardS = { background:CARD, borderRadius:16, border:`1px solid ${BOR}`, padding:"16px 18px", marginBottom:10 };
const btnAc = { width:"100%", padding:18, background:AC, color:"#000", border:"none", borderRadius:16, fontWeight:800, fontSize:17, cursor:"pointer", fontFamily:"inherit" };

function Lbl({ children }) {
  return <div style={{ fontSize:12, fontWeight:700, color:DIM, letterSpacing:0.8, textTransform:"uppercase", marginBottom:10 }}>{children}</div>;
}
function BackBtn({ onClick }) {
  return <button onClick={onClick} style={{ width:40, height:40, borderRadius:12, background:CARD, border:`1px solid ${BOR}`, color:"#fff", fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"inherit", flexShrink:0 }}>←</button>;
}
function MacroBar({ label, eaten, target, color }) {
  const pct = Math.min(100,(eaten/(target||1))*100), over = eaten > target*1.05;
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:6 }}>
        <span style={{ color:"#aaa", fontWeight:600 }}>{label}</span>
        <span style={{ fontWeight:700, color:over?R:"#fff" }}>{eaten}g <span style={{ color:DIM, fontWeight:400 }}>/ {target}g</span></span>
      </div>
      <div style={{ background:"#1a1a1a", borderRadius:6, height:6, overflow:"hidden" }}>
        <div style={{ width:`${pct}%`, background:over?R:color, borderRadius:6, height:6, transition:"width .4s" }} />
      </div>
    </div>
  );
}
function MealCard({ tot, target }) {
  const { t } = useLang();
  const bars = [[tot.p,target.protein,G],[tot.c,target.carbs,B],[tot.f,target.fat,Y]];
  return (
    <div style={{ ...cardS, marginBottom:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
        {[["kcal",rnd(tot.cal),target.calories,"#fff"],[t('today.macro.prot'),`${rnd(tot.p)}g`,`${target.protein}g`,G],[t('today.macro.carbs'),`${rnd(tot.c)}g`,`${target.carbs}g`,B],[t('today.macro.fats'),`${rnd(tot.f)}g`,`${target.fat}g`,Y]].map(([l,v,tgt,c])=>(
          <div key={l} style={{ textAlign:"center" }}>
            <div style={{ fontSize:17, fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:10, color:"#333" }}>/ {tgt}</div>
            <div style={{ fontSize:10, color:DIM }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:6 }}>
        {bars.map(([e,t,c],i)=>{ const pct=Math.min(100,(e/(t||1))*100),ov=e>t*1.05; return <div key={i} style={{ flex:1, background:"#1a1a1a", borderRadius:4, height:5, overflow:"hidden" }}><div style={{ width:`${pct}%`, background:ov?R:c, height:5 }}/></div>; })}
      </div>
    </div>
  );
}
function BottomNav({ tab, setTab }) {
  const { t } = useLang();
  const tabs = [
    ["today",    "🏠", t('nav.today')],
    ["progress", "📊", t('nav.progress')],
    ["supps",    "💊", t('nav.supps')],
    ["profile",  "👤", t('nav.profile')],
  ];
  return (
    <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:"#0d0d0d", borderTop:`1px solid ${BOR}`, display:"flex" }}>
      {tabs.map(([id,ic,lbl])=>(
        <button key={id} onClick={()=>setTab(id)} style={{ flex:1, padding:"10px 0 14px", background:"none", border:"none", cursor:"pointer", color:tab===id?AC:DIM, fontFamily:"inherit", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
          <span style={{ fontSize:20 }}>{ic}</span>
          <span style={{ fontSize:10, fontWeight:700 }}>{lbl}</span>
        </button>
      ))}
    </div>
  );
}

// ─── LANGUAGE SELECT SCREEN ───────────────────────────────────────────────────
function LangSelectScreen({ onSelect }) {
  const features = [
    { icon:"🎯", it:"Calcola il tuo fabbisogno calorico e i macro", en:"Calculate your caloric needs and macros" },
    { icon:"🍽️", it:"Database alimenti + ricerca USDA integrata",   en:"Food database + integrated USDA search" },
    { icon:"✨",  it:"Piano pasti bilanciato generato in automatico", en:"Auto-generated balanced meal plan" },
    { icon:"📊",  it:"Monitora peso e progressi nel tempo",           en:"Track your weight and progress over time" },
    { icon:"💊",  it:"Integratori consigliati per il tuo obiettivo",  en:"Supplements recommended for your goal" },
  ];
  return (
    <div style={{ ...ps, display:"flex", flexDirection:"column", justifyContent:"center", minHeight:"100vh" }}>
      <style>{GFONTS}</style>
      <div style={{ padding:"0 28px", maxWidth:430, margin:"0 auto", width:"100%" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:36 }}>
          <div style={{ width:60, height:60, background:AC, borderRadius:18, display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, flexShrink:0 }}>🥗</div>
          <div>
            <div style={{ fontSize:28, fontWeight:800, letterSpacing:-0.5 }}>NutriCalc</div>
            <div style={{ fontSize:13, color:DIM }}>Nutrition · Nutrizione</div>
          </div>
        </div>
        <div style={{ marginBottom:36 }}>
          {features.map(({ icon, it, en }) => (
            <div key={icon} style={{ display:"flex", gap:14, marginBottom:18, alignItems:"flex-start" }}>
              <span style={{ fontSize:20, flexShrink:0, marginTop:2 }}>{icon}</span>
              <div>
                <div style={{ fontSize:14, color:"#fff", fontWeight:600, lineHeight:1.4 }}>{it}</div>
                <div style={{ fontSize:12, color:DIM, lineHeight:1.4, marginTop:2 }}>{en}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize:12, color:"#333", textAlign:"center", marginBottom:14, letterSpacing:0.5, textTransform:"uppercase", fontWeight:700 }}>
          Scegli la lingua · Choose your language
        </div>
        <div style={{ display:"flex", gap:14 }}>
          <button onClick={() => onSelect("it")} style={{ flex:1, padding:20, borderRadius:16, border:`2px solid ${BOR}`, background:CARD, color:"#fff", cursor:"pointer", fontSize:17, fontWeight:800, fontFamily:"inherit", transition:"border-color .2s" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=AC} onMouseLeave={e=>e.currentTarget.style.borderColor=BOR}>
            🇮🇹<br/><span style={{ fontSize:13, fontWeight:600 }}>Italiano</span>
          </button>
          <button onClick={() => onSelect("en")} style={{ flex:1, padding:20, borderRadius:16, border:`2px solid ${BOR}`, background:CARD, color:"#fff", cursor:"pointer", fontSize:17, fontWeight:800, fontFamily:"inherit", transition:"border-color .2s" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=AC} onMouseLeave={e=>e.currentTarget.style.borderColor=BOR}>
            🇬🇧<br/><span style={{ fontSize:13, fontWeight:600 }}>English</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth, onLangChange }) {
  const { t, lang } = useLang();
  const [mode,    setMode]    = useState("login");
  const [email,   setEmail]   = useState("");
  const [password,setPassword]= useState("");
  const [name,    setName]    = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const changeLang = (l) => { onLangChange(l); };

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "login") {
        const { data, error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) throw e;
        onAuth(data.user);
      } else {
        const { data, error: e } = await supabase.auth.signUp({ email, password, options: { data: { name, language: lang } } });
        if (e) throw e;
        if (data.user) {
          await SB.saveProfile(data.user.id, { language: lang });
          onAuth(data.user);
        } else setError(t('auth.error.confirm'));
      }
    } catch (e) {
      setError(e.message || t('auth.error.generic'));
    }
    setLoading(false);
  };

  return (
    <div style={{ ...ps, display:"flex", flexDirection:"column", justifyContent:"center", minHeight:"100vh" }}>
      <style>{GFONTS}</style>
      <div style={{ padding:"0 28px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:40 }}>
          <div style={{ width:52, height:52, background:AC, borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>🥗</div>
          <div>
            <div style={{ fontSize:26, fontWeight:800, letterSpacing:-0.5 }}>NutriCalc</div>
            <div style={{ fontSize:13, color:DIM }}>{t('auth.tagline')}</div>
          </div>
        </div>

        <div style={{ display:"flex", gap:0, marginBottom:28, background:CARD, borderRadius:14, padding:4, border:`1px solid ${BOR}` }}>
          {[["login", t('auth.tab.login')], ["register", t('auth.tab.register')]].map(([m,l])=>(
            <button key={m} onClick={()=>{ setMode(m); setError(""); }} style={{ flex:1, padding:"10px 0", borderRadius:11, border:"none", background:mode===m?"#252525":"transparent", color:mode===m?"#fff":DIM, fontWeight:700, cursor:"pointer", fontSize:14, fontFamily:"inherit", transition:"background .2s" }}>{l}</button>
          ))}
        </div>

        {mode==="register" && (
          <>
          <div style={{ marginBottom:14 }}>
            <Lbl>{t('auth.field.name')}</Lbl>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder={t('auth.field.name.placeholder')}
              style={{ width:"100%", background:CARD, border:`1px solid ${BOR}`, borderRadius:13, padding:"13px 16px", color:"#fff", fontSize:15, outline:"none", fontFamily:"inherit" }} />
          </div>
          <div style={{ marginBottom:14 }}>
            <Lbl>{t('auth.lang.label')}</Lbl>
            <div style={{ display:"flex", gap:10 }}>
              {[["it", t('auth.lang.it')], ["en", t('auth.lang.en')]].map(([l, lbl]) => (
                <button key={l} onClick={() => changeLang(l)}
                  style={{ flex:1, padding:12, borderRadius:12, border:`2px solid ${lang===l?AC:BOR}`, background:lang===l?AC+"15":CARD, color:lang===l?AC:DIM, fontWeight:700, cursor:"pointer", fontSize:14, fontFamily:"inherit" }}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
          </>
        )}

        <div style={{ marginBottom:14 }}>
          <Lbl>{t('auth.field.email')}</Lbl>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nome@email.com"
            style={{ width:"100%", background:CARD, border:`1px solid ${BOR}`, borderRadius:13, padding:"13px 16px", color:"#fff", fontSize:15, outline:"none", fontFamily:"inherit" }} />
        </div>

        <div style={{ marginBottom:24 }}>
          <Lbl>{t('auth.field.password')}</Lbl>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"
            style={{ width:"100%", background:CARD, border:`1px solid ${BOR}`, borderRadius:13, padding:"13px 16px", color:"#fff", fontSize:15, outline:"none", fontFamily:"inherit" }} />
        </div>

        {error && <div style={{ background:"#1a0505", border:`1px solid ${R}33`, borderRadius:10, padding:"10px 14px", color:R, fontSize:13, marginBottom:16 }}>{error}</div>}

        <button onClick={handleSubmit} disabled={loading} style={{ ...btnAc, opacity:loading?0.6:1 }}>
          {loading ? t('auth.btn.loading') : mode==="login" ? t('auth.btn.login') : t('auth.btn.register')}
        </button>

        {!supabase && (
          <div style={{ marginTop:20, padding:"14px", background:"#0d0d0d", borderRadius:12, border:`1px solid ${BOR}`, fontSize:12, color:"#333", lineHeight:1.6 }}>
            {t('auth.nosupabase')}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PHOTO ANALYSIS MODAL ─────────────────────────────────────────────────────
function PhotoAnalysisModal({ onClose, onAddFoods }) {
  const { t } = useLang();
  const [step,    setStep]    = useState("upload");
  const [preview, setPreview] = useState(null);
  const [b64,     setB64]     = useState(null);
  const [mtype,   setMtype]   = useState("image/jpeg");
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    setMtype(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = (e) => {
      const full = e.target.result;
      setPreview(full);
      setB64(full.split(",")[1]);
      setStep("confirm");
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: b64, mediaType: mtype }),
      });
      if (!res.ok) throw new Error(t('photo.error.server'));
      const data = await res.json();
      if (!data.foods?.length) throw new Error(t('photo.error.none'));
      setResult(data);
      setStep("result");
    } catch (e) {
      setError(e.message || t('photo.error.failed'));
    }
    setLoading(false);
  };

  const confirmAdd = () => {
    const items = result.foods.map(f => ({
      food: { name:f.name, emoji:"📷", cal:f.cal, p:f.p, c:f.c, f:f.f, source:"photo" },
      quantity: f.quantity || 100,
    }));
    onAddFoods(items);
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"#000000cc", zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ background:"#111", borderRadius:"20px 20px 0 0", width:"100%", maxWidth:430, padding:"28px 24px 48px", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div style={{ fontSize:18, fontWeight:800 }}>{t('photo.title')}</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:MID, fontSize:22, cursor:"pointer" }}>✕</button>
        </div>

        {step==="upload" && (
          <>
            <div style={{ fontSize:13, color:DIM, marginBottom:20, lineHeight:1.6 }}>{t('photo.upload.desc')}</div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={e=>handleFile(e.target.files[0])} style={{ display:"none" }} />
            <button onClick={()=>fileRef.current?.click()} style={{ ...btnAc, marginBottom:10 }}>{t('photo.upload.btn')}</button>
            <div style={{ fontSize:11, color:"#252525", textAlign:"center", marginTop:8 }}>{t('photo.upload.note')}</div>
          </>
        )}

        {step==="confirm" && (
          <>
            <img src={preview} alt="preview" style={{ width:"100%", borderRadius:14, marginBottom:20, maxHeight:280, objectFit:"cover" }} />
            {error && <div style={{ color:R, fontSize:13, marginBottom:14, background:"#1a0505", padding:"10px 14px", borderRadius:10 }}>{error}</div>}
            <button onClick={analyze} disabled={loading} style={{ ...btnAc, marginBottom:10, opacity:loading?0.6:1 }}>
              {loading ? t('photo.analyze.loading') : t('photo.analyze.btn')}
            </button>
            <button onClick={()=>setStep("upload")} style={{ width:"100%", padding:14, background:"none", border:`1px solid ${BOR}`, borderRadius:14, color:MID, cursor:"pointer", fontFamily:"inherit", fontSize:14 }}>{t('photo.change')}</button>
          </>
        )}

        {step==="result" && result && (
          <>
            <div style={{ fontSize:13, color:MID, marginBottom:4 }}>{result.description}</div>
            <div style={{ fontSize:14, fontWeight:700, color:"#ccc", marginBottom:16 }}>{t('photo.recognized')}</div>
            {result.foods.map((f,i)=>(
              <div key={i} style={{ ...cardS, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:14 }}>📷 {f.name}</div>
                  <div style={{ color:DIM, fontSize:12, marginTop:3 }}>~{f.quantity}g · P:{f.p}g C:{f.c}g G:{f.f}g</div>
                </div>
                <div style={{ color:AC, fontWeight:800, fontSize:15 }}>{rnd(f.cal * f.quantity / 100)} kcal</div>
              </div>
            ))}
            <button onClick={confirmAdd} style={{ ...btnAc, marginTop:10 }}>{t('photo.add')}</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [ready,       setReady]       = useState(false);
  const [user,        setUser]        = useState(null);
  const [setup,       setSetup]       = useState(true);
  const [profile,     setProfile]     = useState({ name:"", gender:"m", age:"", weight:"", height:"", activity:1.55, goal:"maintain", numMeals:4, bodyFat:"" });
  const [targets,     setTargets]     = useState(null);
  const [mealList,    setMealList]    = useState([]);
  const [meals,       setMeals]       = useState({});
  const [tab,         setTab]         = useState("today");
  const [selMeal,     setSelMeal]     = useState(null);
  const [subscreen,   setSubscreen]   = useState("choose");
  const [showSel,     setShowSel]     = useState(false);
  const [showPhoto,   setShowPhoto]   = useState(false);
  const [weightLog,   setWeightLog]   = useState([]);
  const [favorites,   setFavorites]   = useState([]);
  const [saveFavModal,setSaveFavModal]= useState(false);
  const [favName,     setFavName]     = useState("");
  const [newWeight,   setNewWeight]   = useState("");
  const [lang,        setLang]        = useState(() => LS.load("nc-lang") || "it");
  const [langChosen,  setLangChosen]  = useState(() => !!LS.load("nc-lang-chosen"));
  const t = (key, vars = {}) => {
    let str = TRANSLATIONS[lang]?.[key] || key;
    Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{${k}}`, v); });
    return str;
  };

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) await loadUserData(session.user);
        supabase.auth.onAuthStateChange(async (_, sess) => {
          if (sess?.user) await loadUserData(sess.user);
          else { setUser(null); setReady(true); }
        });
      } else {
        // localStorage fallback
        loadFromLocal();
      }
      setReady(true);
    })();
  }, []);

  const loadFromLocal = () => {
    const p  = LS.load("nc-profile");
    const t  = LS.load("nc-targets");
    const ml = LS.load("nc-meals-list");
    const m  = LS.load("nc-meals");
    const w  = LS.load("nc-weight-log");
    const f  = LS.load("nc-favorites");
    if (p)  setProfile(p);
    if (t && ml) { setTargets(t); setMealList(ml); setMeals(m || ml.reduce((a,x)=>({...a,[x.name]:[]}),{})); setSetup(false); }
    if (w)  setWeightLog(w);
    if (f)  setFavorites(f);
  };

  const loadUserData = async (u) => {
    setUser(u);
    const sbProfile = await SB.loadProfile(u.id);
    // Language priority: localStorage (user's latest toggle) > user_metadata (set at registration) > DB profile
    const lsLang   = LS.load("nc-lang");
    const metaLang = u.user_metadata?.language;
    const dbLang   = sbProfile?.language;
    const resolvedLang = lsLang || metaLang || dbLang;
    if (resolvedLang) { setLang(resolvedLang); LS.save("nc-lang", resolvedLang); }
    if (sbProfile) {
      const p = { name:sbProfile.name||u.user_metadata?.name||"", gender:sbProfile.gender||"m", age:sbProfile.age||"", weight:sbProfile.weight||"", height:sbProfile.height||"", activity:sbProfile.activity||1.55, goal:sbProfile.goal||"maintain", numMeals:sbProfile.num_meals||4, bodyFat:sbProfile.body_fat||"" };
      setProfile(p);
      // Recalc targets from saved profile
      const t = LS.load(`nc-targets-${u.id}`);
      const ml = LS.load(`nc-meals-list-${u.id}`);
      const m  = LS.load(`nc-meals-${u.id}`);
      if (t && ml) {
        const finalLang = resolvedLang || 'it';
        const expectedMl = MEAL_CONFIGS[finalLang]?.[sbProfile.num_meals || 4];
        const needsRemap = expectedMl && ml.length === expectedMl.length && ml[0]?.name !== expectedMl[0]?.name;
        if (needsRemap) {
          const oldFoods = ml.map(m2 => (m || {})[m2.name] || []);
          const newMeals2 = {};
          expectedMl.forEach((m2, i) => { newMeals2[m2.name] = oldFoods[i] || []; });
          setTargets(t); setMealList(expectedMl); setMeals(newMeals2); setSetup(false);
        } else {
          setTargets(t); setMealList(ml); setMeals(m || ml.reduce((a,x)=>({...a,[x.name]:[]}),{})); setSetup(false);
        }
      }
    } else {
      loadFromLocal();
    }
    const w = await SB.loadWeightLog(u.id);
    if (w.length) setWeightLog(w);
    const f = await SB.loadFavorites(u.id);
    if (f.length) setFavorites(f);
    setReady(true);
  };

  const saveProfile = (p) => {
    if (user) {
      LS.save(`nc-profile-${user.id}`, p);
      SB.saveProfile(user.id, {
        name: p.name, gender: p.gender, age: p.age, weight: p.weight,
        height: p.height, activity: p.activity, goal: p.goal,
        num_meals: p.numMeals, body_fat: p.bodyFat || null, language: lang
      });
    } else {
      LS.save("nc-profile", p);
    }
  };
  const saveTargets  = (t, ml) => { const key = user ? user.id : ""; LS.save(`nc-targets${key?"-"+key:""}`, t); LS.save(`nc-meals-list${key?"-"+key:""}`, ml); };
  const saveMeals    = (m)  => { const key = user ? user.id : ""; LS.save(`nc-meals${key?"-"+key:""}`, m); };
  const saveWeights  = (w)  => { setWeightLog(w); LS.save("nc-weight-log", w); if (user) SB.saveWeightLog(user.id, w); };
  const saveFavs     = (f)  => { setFavorites(f); LS.save("nc-favorites", f); if (user) SB.saveFavorites(user.id, f); };

  // ── Calc ──────────────────────────────────────────────────────────────────
  const calcTargets = () => {
    const w = parseFloat(profile.weight), h = parseFloat(profile.height), a = parseInt(profile.age);
    if (!w||!h||!a||a<10||a>100) return;
    const bf  = parseFloat(profile.bodyFat)||0;
    const lm  = bf>0 ? w*(1-bf/100) : w;
    const bmr = profile.gender==="m" ? 10*w+6.25*h-5*a+5 : 10*w+6.25*h-5*a-161;
    const tdee= bmr*profile.activity;
    const gd  = GOALS[lang].find(g=>g.value===profile.goal);
    const totalCal = Math.max(1200, Math.round(tdee+gd.calAdj));
    const proteinG = Math.round(lm*(bf>0?gd.protein*1.1:gd.protein));
    const fatG     = Math.round(w*gd.fat);
    const carbG    = Math.max(0, Math.round((totalCal-proteinG*4-fatG*9)/4));
    const perMeal  = { calories:Math.round(totalCal/profile.numMeals), protein:Math.round(proteinG/profile.numMeals), carbs:Math.round(carbG/profile.numMeals), fat:Math.round(fatG/profile.numMeals) };
    const t  = { calories:totalCal, protein:proteinG, carbs:carbG, fat:fatG, perMeal };
    const ml = MEAL_CONFIGS[lang][profile.numMeals];
    const m  = ml.reduce((a,x)=>({...a,[x.name]:[]}),{});
    setTargets(t); setMealList(ml); setMeals(m); setSetup(false);
    saveProfile(profile); saveTargets(t, ml); saveMeals(m);
  };

  const buildItems = (foods) => {
    if (!targets) return [];
    const qtys = optimize(foods, targets.perMeal);
    return foods.map((food,i)=>({ food, quantity:qtys[i] }));
  };

  const updateMeals = (nm) => { setMeals(nm); saveMeals(nm); };

  const applySuggested = (mealName) => {
    const langSuggested = SUGGESTED[lang];
    const fallback = lang === 'en' ? "Lunch" : "Pranzo";
    const names = langSuggested[mealName] || langSuggested[fallback];
    const foods = names.map(n => findFood(n, lang)).filter(Boolean);
    updateMeals({ ...meals, [mealName]: buildItems(foods) });
    setSubscreen("items");
  };

  const applyFavorite = (fav) => {
    const items = fav.items.map(({ foodName, quantity }) => {
      const food = findFood(foodName, lang);
      return food ? { food, quantity } : null;
    }).filter(Boolean);
    updateMeals({ ...meals, [selMeal]: items });
    setSubscreen("items");
  };

  const addFood = (food) => {
    setShowSel(false);
    const foods = [...(meals[selMeal]||[]).map(i=>i.food), food];
    updateMeals({ ...meals, [selMeal]: buildItems(foods) }); setSubscreen("items");
  };

  const addPhotoFoods = (items) => {
    const current = meals[selMeal]||[];
    updateMeals({ ...meals, [selMeal]: [...current, ...items] }); setSubscreen("items");
  };

  const removeFood = (idx) => {
    const foods = (meals[selMeal]||[]).filter((_,i)=>i!==idx).map(i=>i.food);
    updateMeals({ ...meals, [selMeal]: foods.length?buildItems(foods):[] });
  };

  const updateQty = (idx, qty) => {
    const u = [...(meals[selMeal]||[])];
    u[idx] = { ...u[idx], quantity:Math.max(0,parseInt(qty)||0) };
    updateMeals({ ...meals, [selMeal]: u });
  };

  const clearMeal = () => { updateMeals({ ...meals, [selMeal]:[] }); setSubscreen("choose"); };

  const saveFavorite = () => {
    if (!favName.trim()) return;
    const fav = { id:Date.now(), name:favName.trim(), mealType:selMeal, items:(meals[selMeal]||[]).map(i=>({ foodName:i.food.name, quantity:i.quantity })) };
    saveFavs([...favorites, fav]);
    setSaveFavModal(false); setFavName("");
  };

  const deleteFavorite = (id) => saveFavs(favorites.filter(f=>f.id!==id));

  const logWeight = () => {
    const w = parseFloat(newWeight);
    if (!w||w<30||w>300) return;
    const entry = { date:new Date().toISOString().slice(0,10), weight:w };
    const updated = [...weightLog.filter(e=>e.date!==entry.date), entry].sort((a,b)=>a.date.localeCompare(b.date));
    saveWeights(updated); setNewWeight("");
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null); setSetup(true); setTargets(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const selectLang = (l) => {
    setLang(l);
    LS.save("nc-lang", l);
    LS.save("nc-lang-chosen", true);
    setLangChosen(true);
  };

  if (!langChosen) return (
    <LangContext.Provider value={{ lang, t }}>
      <LangSelectScreen onSelect={selectLang} />
    </LangContext.Provider>
  );

  if (!ready) return (
    <LangContext.Provider value={{ lang, t }}>
      <div style={{ ...ps, display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
        <style>{GFONTS}</style>
        <div style={{ color:DIM }}>{t('loading')}</div>
      </div>
    </LangContext.Provider>
  );
  if (supabase && !user) return (
    <LangContext.Provider value={{ lang, t }}>
      <AuthScreen onAuth={loadUserData} onLangChange={(l) => { setLang(l); LS.save("nc-lang", l); }} />
    </LangContext.Provider>
  );
  const handleLangChange = (l) => {
    setLang(l);
    LS.save("nc-lang", l);
    if (supabase) supabase.auth.updateUser({ data: { language: l } }).catch(()=>{});
    if (user) SB.saveProfile(user.id, { name: profile.name, gender: profile.gender, age: profile.age, weight: profile.weight, height: profile.height, activity: profile.activity, goal: profile.goal, num_meals: profile.numMeals, body_fat: profile.bodyFat || null, language: l });
    if (targets && mealList.length > 0) {
      const newMl = MEAL_CONFIGS[l][profile.numMeals];
      if (newMl) {
        const oldItems = mealList.map(m => meals[m.name] || []);
        const newMeals = {};
        newMl.forEach((m, i) => { newMeals[m.name] = oldItems[i] || []; });
        setMealList(newMl);
        setMeals(newMeals);
        const key = user ? user.id : "";
        LS.save(`nc-meals-list${key?"-"+key:""}`, newMl);
        LS.save(`nc-meals${key?"-"+key:""}`, newMeals);
      }
    }
  };

  if (setup) return (
    <LangContext.Provider value={{ lang, t }}>
      <ProfileScreen profile={profile} setProfile={setProfile} onCalc={calcTargets} onLangChange={handleLangChange} />
    </LangContext.Provider>
  );

  const allTot   = totals(Object.values(meals).flat());
  const mealData = mealList.find(m=>m.name===selMeal);
  const mealItems= meals[selMeal]||[];
  const mealTot  = totals(mealItems);

  if (selMeal) {
    if (showPhoto) return (
      <LangContext.Provider value={{ lang, t }}>
        <>
          {showPhoto && <PhotoAnalysisModal onClose={()=>setShowPhoto(false)} onAddFoods={addPhotoFoods} />}
          <MealItemsScreen mealName={selMeal} mealData={mealData} items={mealItems} tot={mealTot} target={targets.perMeal}
            saveFavModal={saveFavModal} favName={favName}
            onBack={()=>{ setSelMeal(null); setSubscreen("choose"); }}
            onAdd={()=>setShowSel(true)} onPhoto={()=>setShowPhoto(true)} onRemove={removeFood} onQty={updateQty} onClear={clearMeal}
            onSaveFav={()=>setSaveFavModal(true)} onFavName={setFavName} onConfirmFav={saveFavorite}
            onCancelFav={()=>{ setSaveFavModal(false); setFavName(""); }} />
        </>
      </LangContext.Provider>
    );
    if (showSel) return (
      <LangContext.Provider value={{ lang, t }}>
        <FoodSelectorScreen mealTot={mealTot} target={targets.perMeal} onBack={()=>setShowSel(false)} onAdd={addFood} />
      </LangContext.Provider>
    );
    if (subscreen==="choose" && !mealItems.length) return (
      <LangContext.Provider value={{ lang, t }}>
        <ChooseScreen mealName={selMeal} mealData={mealData} target={targets.perMeal} favorites={favorites}
          onBack={()=>setSelMeal(null)} onSuggested={()=>applySuggested(selMeal)}
          onCustom={()=>setShowSel(true)} onFavorite={applyFavorite} onDeleteFav={deleteFavorite} />
      </LangContext.Provider>
    );
    return (
      <LangContext.Provider value={{ lang, t }}>
        <MealItemsScreen mealName={selMeal} mealData={mealData} items={mealItems} tot={mealTot}
          target={targets.perMeal} saveFavModal={saveFavModal} favName={favName}
          onBack={()=>{ setSelMeal(null); setSubscreen("choose"); }}
          onAdd={()=>setShowSel(true)} onPhoto={()=>setShowPhoto(true)} onRemove={removeFood} onQty={updateQty} onClear={clearMeal}
          onSaveFav={()=>setSaveFavModal(true)} onFavName={setFavName} onConfirmFav={saveFavorite}
          onCancelFav={()=>{ setSaveFavModal(false); setFavName(""); }} />
      </LangContext.Provider>
    );
  }

  return (
    <LangContext.Provider value={{ lang, t }}>
      <div style={{ ...ps, paddingBottom:70 }}>
        <style>{GFONTS}</style>
        {tab==="today"    && <TodayScreen targets={targets} mealList={mealList} meals={meals} allTot={allTot} numMeals={profile.numMeals} onMealClick={(n)=>{ setSelMeal(n); setSubscreen((meals[n]||[]).length?"items":"choose"); }} />}
        {tab==="progress" && <ProgressScreen weightLog={weightLog} profile={profile} newWeight={newWeight} setNewWeight={setNewWeight} onLog={logWeight} />}
        {tab==="supps"    && <SupplementsScreen goal={profile.goal} />}
        {tab==="profile"  && <ProfileScreen profile={profile} setProfile={setProfile} onCalc={calcTargets} editMode targets={targets} user={user} onLogout={handleLogout} onLangChange={handleLangChange} />}
        <BottomNav tab={tab} setTab={setTab} />
      </div>
    </LangContext.Provider>
  );
}

// ─── PROFILE SCREEN ───────────────────────────────────────────────────────────
function ProfileScreen({ profile, setProfile, onCalc, editMode, targets, user, onLogout, onLangChange }) {
  const { t, lang } = useLang();
  const p = (k, v) => setProfile(prev=>({ ...prev, [k]:v }));
  return (
    <div style={{ ...ps, overflowY:"auto" }}>
      <style>{GFONTS}</style>
      <div style={{ padding:"52px 24px 48px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:32 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:44, height:44, background:AC, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🥗</div>
            <div><div style={{ fontSize:22, fontWeight:800 }}>NutriCalc</div><div style={{ fontSize:13, color:DIM }}>{profile.name || user?.email || t('profile.tagline')}</div></div>
          </div>
          {editMode && user && <button onClick={onLogout} style={{ background:"#150505", border:`1px solid #2a0a0a`, borderRadius:10, padding:"8px 14px", color:R, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" }}>{t('profile.logout')}</button>}
        </div>

        {!editMode && <><div style={{ fontSize:28, fontWeight:800, letterSpacing:-1, lineHeight:1.2, marginBottom:8 }}>
          {t('profile.onboarding.title').split('\n').map((line, i) => i === 0 ? <span key={i}>{line}<br/></span> : <span key={i}>{line}</span>)}
        </div><div style={{ fontSize:14, color:DIM, marginBottom:16 }}>{t('profile.onboarding.sub')}</div>
        {onLangChange && <div style={{ marginBottom:24 }}>
          <div style={{ display:"flex", gap:10 }}>
            {[["it","🇮🇹 Italiano"],["en","🇬🇧 English"]].map(([l,lbl])=>(
              <button key={l} onClick={()=>onLangChange(l)} style={{ flex:1, padding:11, borderRadius:12, border:`2px solid ${lang===l?AC:BOR}`, background:lang===l?AC+"15":CARD, color:lang===l?AC:DIM, fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>{lbl}</button>
            ))}
          </div>
        </div>}</>}
        {editMode && <div style={{ fontSize:22, fontWeight:800, marginBottom:16 }}>{t('profile.title')}</div>}
        {editMode && onLangChange && <div style={{ marginBottom:24 }}>
          <Lbl>{t('auth.lang.label')}</Lbl>
          <div style={{ display:"flex", gap:10 }}>
            {[["it","🇮🇹 Italiano"],["en","🇬🇧 English"]].map(([l,lbl])=>(
              <button key={l} onClick={()=>onLangChange(l)} style={{ flex:1, padding:11, borderRadius:12, border:`2px solid ${lang===l?AC:BOR}`, background:lang===l?AC+"15":CARD, color:lang===l?AC:DIM, fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>{lbl}</button>
            ))}
          </div>
        </div>}

        {editMode && targets && (
          <div style={{ ...cardS, marginBottom:24, background:"#0d1a00", borderColor:AC+"33" }}>
            <div style={{ fontSize:11, fontWeight:700, color:AC+"88", letterSpacing:1, textTransform:"uppercase", marginBottom:12 }}>{t('profile.current_plan')}</div>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              {[["kcal",targets.calories,"#fff"],[t('today.macro.prot'),`${targets.protein}g`,G],[t('today.macro.carbs'),`${targets.carbs}g`,B],[t('today.macro.fats'),`${targets.fat}g`,Y]].map(([l,v,c])=>(
                <div key={l} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:20, fontWeight:800, color:c }}>{v}</div>
                  <div style={{ fontSize:11, color:DIM, marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom:20 }}>
          <Lbl>{t('profile.field.name')}</Lbl>
          <div style={{ display:"flex", alignItems:"center", background:CARD, borderRadius:14, border:`1px solid ${BOR}` }}>
            <input type="text" value={profile.name||""} onChange={e=>p("name",e.target.value)} placeholder={t('profile.field.name.placeholder')}
              style={{ flex:1, background:"none", border:"none", color:"#fff", padding:"14px 18px", fontSize:16, fontWeight:600, outline:"none", fontFamily:"inherit" }} />
          </div>
        </div>
        <Lbl>{t('profile.field.gender')}</Lbl>
        <div style={{ display:"flex", gap:10, marginBottom:20 }}>
          {[["m", t('profile.gender.m')], ["f", t('profile.gender.f')]].map(([v,lbl])=>(
            <button key={v} onClick={()=>p("gender",v)} style={{ flex:1, padding:14, borderRadius:14, border:`2px solid ${profile.gender===v?AC:BOR}`, background:profile.gender===v?AC+"15":CARD, color:profile.gender===v?AC:DIM, fontWeight:700, cursor:"pointer", fontSize:15, fontFamily:"inherit" }}>{lbl}</button>
          ))}
        </div>

        {[
          ["age",    t('profile.field.age'),    t('profile.field.age.unit')],
          ["weight", t('profile.field.weight'), t('profile.field.weight.unit')],
          ["height", t('profile.field.height'), t('profile.field.height.unit')],
        ].map(([k,l,u])=>(
          <div key={k} style={{ marginBottom:14 }}>
            <Lbl>{l}</Lbl>
            <div style={{ display:"flex", alignItems:"center", background:CARD, borderRadius:14, border:`1px solid ${BOR}` }}>
              <input type="number" value={profile[k]} onChange={e=>p(k,e.target.value)} placeholder="0" style={{ flex:1, background:"none", border:"none", color:"#fff", padding:"14px 18px", fontSize:18, fontWeight:600, outline:"none", fontFamily:"inherit" }} />
              <span style={{ color:DIM, paddingRight:18, fontSize:14 }}>{u}</span>
            </div>
          </div>
        ))}

        <div style={{ marginBottom:20 }}>
          <Lbl>{t('profile.field.bodyfat')} <span style={{ fontSize:11, fontWeight:400, textTransform:"none", letterSpacing:0, color:"#333" }}>{t('profile.field.bodyfat.optional')}</span></Lbl>
          <div style={{ display:"flex", alignItems:"center", background:CARD, borderRadius:14, border:`1px solid ${BOR}` }}>
            <input type="number" value={profile.bodyFat} onChange={e=>p("bodyFat",e.target.value)} placeholder={t('profile.field.bodyfat.placeholder')} style={{ flex:1, background:"none", border:"none", color:"#fff", padding:"14px 18px", fontSize:18, fontWeight:600, outline:"none", fontFamily:"inherit" }} />
            <span style={{ color:DIM, paddingRight:18, fontSize:14 }}>%</span>
          </div>
          {profile.bodyFat && parseFloat(profile.bodyFat)>0 && profile.weight && (
            <div style={{ fontSize:12, color:MID, marginTop:6, paddingLeft:4 }}>{t('profile.lean_mass')} <span style={{ color:AC, fontWeight:700 }}>{Math.round(parseFloat(profile.weight)*(1-parseFloat(profile.bodyFat)/100))} kg</span></div>
          )}
        </div>

        <div style={{ marginBottom:20 }}>
          <Lbl>{t('profile.field.meals')}</Lbl>
          <div style={{ display:"flex", gap:8 }}>
            {[2,3,4,5,6].map(n=>(
              <button key={n} onClick={()=>p("numMeals",n)} style={{ flex:1, padding:"13px 0", borderRadius:12, border:`2px solid ${profile.numMeals===n?AC:BOR}`, background:profile.numMeals===n?AC+"15":CARD, color:profile.numMeals===n?AC:DIM, fontWeight:800, cursor:"pointer", fontSize:18, fontFamily:"inherit" }}>{n}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:20 }}>
          <Lbl>{t('profile.field.activity')}</Lbl>
          <div style={{ background:CARD, borderRadius:14, border:`1px solid ${BOR}`, overflow:"hidden" }}>
            {ACTIVITY_LEVELS[lang].map((al,i)=>(
              <div key={i} onClick={()=>p("activity",al.value)} style={{ padding:"12px 16px", cursor:"pointer", background:profile.activity===al.value?AC+"12":"transparent", borderBottom:i<4?`1px solid ${BOR}`:"none", display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${profile.activity===al.value?AC:"#333"}`, background:profile.activity===al.value?AC:"transparent", flexShrink:0 }} />
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:profile.activity===al.value?AC:"#ccc" }}>{al.label}</div>
                  <div style={{ fontSize:12, color:DIM }}>{al.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:32 }}>
          <Lbl>{t('profile.field.goal')}</Lbl>
          <div style={{ display:"flex", gap:10 }}>
            {GOALS[lang].map(g=>(
              <button key={g.value} onClick={()=>p("goal",g.value)} style={{ flex:1, padding:"14px 8px", borderRadius:14, border:`2px solid ${profile.goal===g.value?g.color:BOR}`, background:profile.goal===g.value?g.color+"18":CARD, color:profile.goal===g.value?g.color:DIM, fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"inherit", textAlign:"center" }}>
                <div style={{ fontSize:22, marginBottom:5 }}>{g.icon}</div>{g.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={onCalc} style={btnAc}>{editMode ? t('profile.btn.update') : t('profile.btn.calc')}</button>
      </div>
    </div>
  );
}

// ─── TODAY SCREEN ─────────────────────────────────────────────────────────────
function TodayScreen({ targets, mealList, meals, allTot, numMeals, onMealClick }) {
  const { t, lang } = useLang();
  const calPct = Math.min(100,(allTot.cal/targets.calories)*100);
  const R2 = 70, circ = 2*Math.PI*R2;
  return (
    <div style={{ padding:"52px 20px 20px", overflowY:"auto" }}>
      <div style={{ fontSize:13, color:DIM, marginBottom:2 }}>{t('today.summary')}</div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
        <div style={{ fontSize:26, fontWeight:800, letterSpacing:-0.8 }}>{t('today.title')}</div>
        <div style={{ display:"flex", gap:14 }}>
          {[[t('today.macro.prot'), targets.protein, rnd(allTot.p), G], [t('today.macro.carbs'), targets.carbs, rnd(allTot.c), B], [t('today.macro.fats'), targets.fat, rnd(allTot.f), Y]].map(([l,tgt,val,c])=>(
            <div key={l} style={{ textAlign:"center" }}>
              <div style={{ fontSize:14, fontWeight:800, color: val > tgt * 1.05 ? R : c }}>{val}g</div>
              <div style={{ fontSize:9, color:"#333" }}>/ {tgt}g</div>
              <div style={{ fontSize:9, color:DIM }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:CARD, borderRadius:20, padding:20, marginBottom:12, border:`1px solid ${BOR}`, display:"flex", alignItems:"center", gap:20 }}>
        <div style={{ position:"relative", flexShrink:0 }}>
          <svg width={156} height={156} viewBox="0 0 156 156">
            <circle cx={78} cy={78} r={R2} fill="none" stroke="#1f1f1f" strokeWidth={12} />
            <circle cx={78} cy={78} r={R2} fill="none" stroke={AC} strokeWidth={12} strokeDasharray={`${circ*calPct/100} ${circ}`} strokeLinecap="round" transform="rotate(-90 78 78)" style={{ transition:"stroke-dasharray .5s" }} />
          </svg>
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <div style={{ fontSize:26, fontWeight:900, color:AC }}>{rnd(allTot.cal)}</div>
            <div style={{ fontSize:11, color:DIM }}>kcal</div>
          </div>
        </div>
        <div style={{ flex:1 }}>
          {[[t('today.circle.goal'),`${targets.calories} kcal`,"#fff"],[t('today.circle.eaten'),`${rnd(allTot.cal)} kcal`,AC],[t('today.circle.remaining'),`${Math.max(0,targets.calories-rnd(allTot.cal))} kcal`,targets.calories-allTot.cal<0?R:B]].map(([l,v,c])=>(
            <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:9 }}>
              <span style={{ fontSize:12, color:DIM }}>{l}</span>
              <span style={{ fontSize:13, fontWeight:700, color:c }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:CARD, borderRadius:20, padding:"18px 20px", marginBottom:22, border:`1px solid ${BOR}` }}>
        <div style={{ fontSize:11, fontWeight:700, color:DIM, letterSpacing:1, textTransform:"uppercase", marginBottom:16 }}>{t('today.macros.title')}</div>
        <MacroBar label={t('today.macros.prot')}  eaten={rnd(allTot.p)} target={targets.protein} color={G} />
        <MacroBar label={t('today.macros.carbs')} eaten={rnd(allTot.c)} target={targets.carbs}   color={B} />
        <MacroBar label={t('today.macros.fats')}  eaten={rnd(allTot.f)} target={targets.fat}     color={Y} />
      </div>
      <div style={{ fontSize:17, fontWeight:800, marginBottom:12 }}>{t('today.meals.title', { n: numMeals })}</div>
      {mealList.map(({ name, icon, time }) => {
        const items=meals[name]||[], tot=totals(items), cnt=items.length;
        return (
          <div key={name} onClick={()=>onMealClick(name)} style={{ ...cardS, display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:42, height:42, background:"#1a1a1a", borderRadius:11, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{icon}</div>
              <div>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:2 }}>{name}</div>
                <div style={{ color:DIM, fontSize:12 }}>{cnt>0?`${cnt} ${cnt===1 ? t('today.food.singular') : t('today.food.plural')}`:time}</div>
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontWeight:800, color:cnt>0?AC:"#222", fontSize:16 }}>{cnt>0?rnd(tot.cal):"—"}</div>
              {cnt>0&&<div style={{ color:DIM, fontSize:11, marginTop:1 }}>P:{rnd(tot.p)} C:{rnd(tot.c)} {lang==="en"?"F":"G"}:{rnd(tot.f)}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── CHOOSE SCREEN ────────────────────────────────────────────────────────────
function ChooseScreen({ mealName, mealData, target, favorites, onBack, onSuggested, onCustom, onFavorite, onDeleteFav }) {
  const { t, lang } = useLang();
  const langSuggested = SUGGESTED[lang];
  const fallback = lang === 'en' ? "Lunch" : "Pranzo";
  const sugNames = langSuggested[mealName] || langSuggested[fallback];
  const myFavs   = favorites.filter(f=>f.mealType===mealName);
  return (
    <div style={{ ...ps, overflowY:"auto" }}>
      <style>{GFONTS}</style>
      <div style={{ padding:"52px 20px 40px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28 }}>
          <BackBtn onClick={onBack} />
          <div>
            <div style={{ fontSize:21, fontWeight:800 }}>{mealData?.icon} {mealName}</div>
            <div style={{ fontSize:12, color:DIM }}>{mealData?.time}</div>
          </div>
        </div>
        <div style={{ ...cardS, marginBottom:24 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#2a2a2a", letterSpacing:1, textTransform:"uppercase", marginBottom:14 }}>{t('choose.target')}</div>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            {[["kcal",target.calories,"#fff"],[t('today.macro.prot'),`${target.protein}g`,G],[t('today.macro.carbs'),`${target.carbs}g`,B],[t('today.macro.fats'),`${target.fat}g`,Y]].map(([l,v,c])=>(
              <div key={l} style={{ textAlign:"center" }}>
                <div style={{ fontSize:21, fontWeight:800, color:c }}>{v}</div>
                <div style={{ fontSize:11, color:DIM, marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div onClick={onSuggested} style={{ background:AC+"0a", borderRadius:16, padding:"20px", marginBottom:10, cursor:"pointer", border:`1.5px solid ${AC}30` }}>
          <div style={{ display:"flex", gap:12 }}>
            <span style={{ fontSize:30, flexShrink:0 }}>✨</span>
            <div>
              <div style={{ fontWeight:800, fontSize:16, color:AC, marginBottom:5 }}>{t('choose.suggested.title')}</div>
              <div style={{ fontSize:13, color:DIM, lineHeight:1.5, marginBottom:12 }}>{t('choose.suggested.desc')}</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {sugNames.map(n=>{ const f=findFood(n, lang); return f?<span key={n} style={{ background:"#181818", borderRadius:7, padding:"3px 10px", fontSize:12, color:"#555" }}>{f.emoji} {n}</span>:null; })}
              </div>
            </div>
          </div>
        </div>
        <div onClick={onCustom} style={{ ...cardS, cursor:"pointer" }}>
          <div style={{ display:"flex", gap:12 }}>
            <span style={{ fontSize:30, flexShrink:0 }}>🎛️</span>
            <div>
              <div style={{ fontWeight:800, fontSize:16, marginBottom:5 }}>{t('choose.custom.title')}</div>
              <div style={{ fontSize:13, color:DIM, lineHeight:1.5 }}>{t('choose.custom.desc')}</div>
            </div>
          </div>
        </div>
        {myFavs.length > 0 && (
          <div style={{ marginTop:20 }}>
            <div style={{ fontSize:15, fontWeight:700, color:Y, marginBottom:12 }}>{t('choose.favorites')}</div>
            {myFavs.map(fav=>(
              <div key={fav.id} style={{ ...cardS, display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }} onClick={()=>onFavorite(fav)}>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:3 }}>{fav.name}</div>
                  <div style={{ fontSize:12, color:DIM }}>{fav.items.length} {t('choose.foods_count')}</div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={e=>{ e.stopPropagation(); onFavorite(fav); }} style={{ background:AC+"15", border:"none", borderRadius:8, padding:"6px 12px", color:AC, cursor:"pointer", fontWeight:700, fontSize:12, fontFamily:"inherit" }}>{t('choose.fav.use')}</button>
                  <button onClick={e=>{ e.stopPropagation(); onDeleteFav(fav.id); }} style={{ background:"#150505", border:"none", borderRadius:8, padding:"6px 12px", color:R, cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MEAL ITEMS SCREEN ────────────────────────────────────────────────────────
function MealItemsScreen({ mealName, mealData, items, tot, target, saveFavModal, favName, onBack, onAdd, onPhoto, onRemove, onQty, onClear, onSaveFav, onFavName, onConfirmFav, onCancelFav }) {
  const { t, lang } = useLang();
  return (
    <div style={{ ...ps, overflowY:"auto" }}>
      <style>{GFONTS}</style>
      <div style={{ padding:"52px 20px 40px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <BackBtn onClick={onBack} />
            <div>
              <div style={{ fontSize:21, fontWeight:800 }}>{mealData?.icon} {mealName}</div>
              <div style={{ fontSize:12, color:DIM }}>{mealData?.time}</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={onSaveFav} style={{ background:Y+"15", border:`1px solid ${Y}33`, borderRadius:9, padding:"7px 12px", color:Y, cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"inherit" }}>⭐</button>
            <button onClick={onClear} style={{ background:"#150505", border:`1px solid #2a0a0a`, borderRadius:9, padding:"7px 12px", color:R, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit" }}>{t('meal.reset')}</button>
          </div>
        </div>
        <MealCard tot={tot} target={target} />
        {saveFavModal && (
          <div style={{ ...cardS, background:"#0d0d0d", border:`1px solid ${Y}33`, marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:700, color:Y, marginBottom:12 }}>{t('meal.save_fav.title')}</div>
            <input value={favName} onChange={e=>onFavName(e.target.value)} placeholder={t('meal.save_fav.placeholder')} style={{ width:"100%", background:"#1a1a1a", border:`1px solid ${BOR}`, borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:14, outline:"none", fontFamily:"inherit", marginBottom:12 }} />
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={onConfirmFav} style={{ flex:1, padding:11, background:Y, color:"#000", border:"none", borderRadius:10, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{t('meal.save_fav.btn')}</button>
              <button onClick={onCancelFav} style={{ flex:1, padding:11, background:CARD, color:DIM, border:`1px solid ${BOR}`, borderRadius:10, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>{t('meal.cancel')}</button>
            </div>
          </div>
        )}
        {items.map((item, idx) => {
          const x = item.quantity/100;
          return (
            <div key={idx} style={cardS}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:22 }}>{item.food.emoji}</span>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14 }}>{lang === 'en' ? (item.food.nameEn || item.food.name) : item.food.name}</div>
                    {item.food.brand && <div style={{ fontSize:11, color:"#333" }}>{item.food.brand}</div>}
                    <div style={{ color:AC, fontSize:13, fontWeight:700 }}>{rnd(item.food.cal*x)} kcal</div>
                  </div>
                </div>
                <button onClick={()=>onRemove(idx)} style={{ background:"#150505", border:`1px solid #2a0a0a`, color:R, padding:"4px 10px", borderRadius:7, cursor:"pointer", fontSize:14, fontFamily:"inherit" }}>✕</button>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <button onClick={()=>onQty(idx,item.quantity-10)} style={{ width:34, height:34, borderRadius:9, background:"#1a1a1a", border:`1px solid ${BOR}`, color:"#fff", fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"inherit" }}>−</button>
                <input type="number" value={item.quantity} onChange={e=>onQty(idx,e.target.value)} style={{ flex:1, background:"#1a1a1a", border:`1px solid ${BOR}`, color:"#fff", padding:"7px", borderRadius:9, textAlign:"center", fontSize:16, fontWeight:700, outline:"none", fontFamily:"inherit" }} />
                <span style={{ color:DIM, fontSize:13, fontWeight:600 }}>{item.food.unit||"g"}</span>
                <button onClick={()=>onQty(idx,item.quantity+10)} style={{ width:34, height:34, borderRadius:9, background:"#1a1a1a", border:`1px solid ${BOR}`, color:"#fff", fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"inherit" }}>+</button>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                {[["P",rnd(item.food.p*x),G],["C",rnd(item.food.c*x),B],[lang==="en"?"F":"G",rnd(item.food.f*x),Y]].map(([l,v,c])=>(
                  <div key={l} style={{ flex:1, background:"#0f0f0f", borderRadius:7, padding:"6px", textAlign:"center" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:c }}>{v}g</div>
                    <div style={{ fontSize:10, color:DIM }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <div style={{ display:"flex", gap:10, marginTop:10 }}>
          <button onClick={onAdd} style={{ ...btnAc, flex:2 }}>{t('meal.add')}</button>
          <button onClick={onPhoto} style={{ flex:1, padding:18, background:"#1a1a1a", color:"#fff", border:`1px solid ${BOR}`, borderRadius:16, fontWeight:700, fontSize:15, cursor:"pointer", fontFamily:"inherit" }}>📷</button>
        </div>
      </div>
    </div>
  );
}

// ─── FOOD SELECTOR ────────────────────────────────────────────────────────────
function FoodSelectorScreen({ mealTot, target, onBack, onAdd }) {
  const { t, lang } = useLang();
  const [cat,        setCat]        = useState(lang === 'en' ? "Proteins" : "Proteine");
  const [search,     setSearch]     = useState("");
  const [usdaResults,setUsdaResults]= useState([]);
  const [loading,    setLoading]    = useState(false);
  const [usdaError,  setUsdaError]  = useState(false);
  const [source,     setSource]     = useState("local");
  const currentFoods = getFoods(lang);
  const cats = Object.keys(currentFoods);

  useEffect(() => {
    if (search.length < 2) { setUsdaResults([]); setLoading(false); return; }
    setLoading(true); setUsdaError(false);
    const t = setTimeout(async () => {
      try { setUsdaResults(await searchUSDA(search)); }
      catch { setUsdaError(true); }
      finally { setLoading(false); }
    }, 600);
    return () => clearTimeout(t);
  }, [search]);

  const localFiltered = search ? Object.values(currentFoods).flat().filter(f => f.name.toLowerCase().includes(search.toLowerCase())) : (currentFoods[cat] || []);
  const showingSearch  = search.length >= 2;
  const activeList     = showingSearch ? (source==="usda" ? usdaResults : localFiltered) : localFiltered;

  return (
    <div style={{ ...ps, display:"flex", flexDirection:"column", height:"100vh" }}>
      <style>{GFONTS}</style>
      <div style={{ padding:"52px 20px 0", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
          <BackBtn onClick={onBack} />
          <div>
            <div style={{ fontSize:19, fontWeight:800 }}>{t('food.title')}</div>
            <div style={{ fontSize:11, color:DIM, marginTop:1 }}>{t('food.sub')}</div>
          </div>
        </div>
        <MealCard tot={mealTot} target={target} />
        <div style={{ position:"relative", marginBottom:10 }}>
          <input value={search} onChange={e=>{ setSearch(e.target.value); setSource("local"); }} placeholder={t('food.search.placeholder')}
            style={{ width:"100%", background:CARD, border:`1px solid ${BOR}`, borderRadius:12, padding:"11px 44px 11px 16px", color:"#fff", fontSize:14, outline:"none", fontFamily:"inherit" }} />
          {search && <button onClick={()=>{ setSearch(""); setUsdaResults([]); }} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:DIM, cursor:"pointer", fontSize:16 }}>✕</button>}
        </div>
        {showingSearch && (
          <div style={{ display:"flex", gap:8, marginBottom:10 }}>
            {[
              ["local", t('food.source.local', { n: localFiltered.length })],
              ["usda", t('food.source.usda') + (loading ? " …" : usdaResults.length ? ` (${usdaResults.length})` : "")],
            ].map(([s,lbl])=>(
              <button key={s} onClick={()=>setSource(s)} style={{ flex:1, padding:"8px 10px", borderRadius:10, border:`1.5px solid ${source===s?AC:BOR}`, background:source===s?AC+"15":CARD, color:source===s?AC:"#555", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>{lbl}</button>
            ))}
          </div>
        )}
        {!showingSearch && (
          <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:12 }}>
            {cats.map(c=>(
              <button key={c} onClick={()=>setCat(c)} style={{ padding:"8px 16px", borderRadius:18, border:"none", background:cat===c?AC:CARD, color:cat===c?"#000":"#555", fontWeight:700, cursor:"pointer", fontSize:12, whiteSpace:"nowrap", fontFamily:"inherit", flexShrink:0 }}>{c}</button>
            ))}
          </div>
        )}
      </div>
      <div style={{ overflowY:"auto", flex:1, padding:"0 20px 40px" }}>
        {source==="usda" && showingSearch && !loading && !usdaError && (
          <div style={{ fontSize:11, color:"#2a2a2a", marginBottom:12, textAlign:"center" }}>{t('food.usda.source')}</div>
        )}
        {loading && source==="usda" && <div style={{ textAlign:"center", padding:"40px 0" }}><div style={{ fontSize:24, marginBottom:10 }}>🔍</div><div style={{ color:DIM, fontSize:14 }}>{t('food.usda.searching')}</div></div>}
        {usdaError && source==="usda" && (
          <div style={{ textAlign:"center", padding:"32px 0" }}>
            <div style={{ fontSize:13, color:DIM, marginBottom:8 }}>{t('food.usda.error')}</div>
            <button onClick={()=>setSource("local")} style={{ background:"none", border:`1px solid ${BOR}`, color:MID, padding:"8px 16px", borderRadius:10, cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>{t('food.usda.use_local')}</button>
          </div>
        )}
        {!loading && activeList.map((food,i)=>(
          <div key={i} onClick={()=>onAdd(food)} style={{ ...cardS, display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, flex:1, minWidth:0 }}>
              <span style={{ fontSize:22, flexShrink:0 }}>{food.emoji}</span>
              <div style={{ minWidth:0 }}>
                <div style={{ fontWeight:600, fontSize:13, marginBottom:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{food.name}</div>
                {food.brand && <div style={{ color:"#333", fontSize:11, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{food.brand}</div>}
                <div style={{ color:DIM, fontSize:11 }}>P:{food.p}g C:{food.c}g {lang==="en"?"F":"G"}:{food.f}g</div>
              </div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0, marginLeft:10 }}>
              <div style={{ color:AC, fontWeight:800, fontSize:15 }}>{food.cal}</div>
              <div style={{ color:DIM, fontSize:11 }}>kcal/100{food.unit||"g"}</div>
            </div>
          </div>
        ))}
        {!loading && !usdaError && activeList.length===0 && (
          <div style={{ textAlign:"center", color:DIM, padding:"40px 0" }}>
            <div style={{ fontSize:32, marginBottom:10 }}>🔎</div>
            <div style={{ fontSize:14 }}>{t('food.empty')}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PROGRESS SCREEN ──────────────────────────────────────────────────────────
function ProgressScreen({ weightLog, profile, newWeight, setNewWeight, onLog }) {
  const { t } = useLang();
  const last10 = weightLog.slice(-12);
  const hasData = last10.length >= 2;
  const first = weightLog[0], last = weightLog[weightLog.length-1];
  const diff  = first && last ? (last.weight - first.weight).toFixed(1) : null;
  let chart = null;
  if (hasData) {
    const W=350, H=120, pad=20;
    const weights=last10.map(e=>e.weight);
    const minW=Math.min(...weights)-1, maxW=Math.max(...weights)+1;
    const xOf=(i)=>pad+(i/(last10.length-1))*(W-pad*2);
    const yOf=(w)=>H-pad-((w-minW)/(maxW-minW))*(H-pad*2);
    const pts=last10.map((e,i)=>`${xOf(i)},${yOf(e.weight)}`).join(" ");
    chart = (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:"visible" }}>
        <polyline points={pts} fill="none" stroke={AC} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {last10.map((e,i)=>(
          <g key={i}>
            <circle cx={xOf(i)} cy={yOf(e.weight)} r={4} fill={AC} />
            <text x={xOf(i)} y={yOf(e.weight)-10} fill="#888" fontSize="9" textAnchor="middle">{e.weight}</text>
          </g>
        ))}
      </svg>
    );
  }
  return (
    <div style={{ padding:"52px 20px 20px", overflowY:"auto" }}>
      <div style={{ fontSize:13, color:DIM, marginBottom:2 }}>{t('progress.sub')}</div>
      <div style={{ fontSize:26, fontWeight:800, marginBottom:22 }}>{t('progress.title')}</div>
      <div style={{ ...cardS, marginBottom:16 }}>
        <Lbl>{t('progress.log')}</Lbl>
        <div style={{ display:"flex", gap:10 }}>
          <div style={{ flex:1, display:"flex", alignItems:"center", background:"#1a1a1a", borderRadius:12, border:`1px solid ${BOR}` }}>
            <input type="number" value={newWeight} onChange={e=>setNewWeight(e.target.value)} placeholder="0.0" style={{ flex:1, background:"none", border:"none", color:"#fff", padding:"12px 16px", fontSize:18, fontWeight:700, outline:"none", fontFamily:"inherit" }} />
            <span style={{ color:DIM, paddingRight:14, fontSize:14 }}>kg</span>
          </div>
          <button onClick={onLog} style={{ background:AC, color:"#000", border:"none", borderRadius:12, padding:"0 20px", fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"inherit" }}>{t('progress.save')}</button>
        </div>
        {last && <div style={{ fontSize:12, color:MID, marginTop:8 }}>{t('progress.last')} <span style={{ color:"#fff", fontWeight:600 }}>{last.weight} kg</span> — {last.date}</div>}
      </div>
      {diff!==null && (
        <div style={{ display:"flex", gap:10, marginBottom:16 }}>
          {[[t('progress.stat.from'),`${first.weight} kg`,"#fff"],[t('progress.stat.now'),`${last.weight} kg`,AC],[t('progress.stat.change'),`${diff>0?"+":""}${diff} kg`,parseFloat(diff)===0?"#fff":(profile.goal==="gain"?parseFloat(diff)>0?G:R:parseFloat(diff)<0?G:R)]].map(([l,v,c])=>(
            <div key={l} style={{ flex:1, ...cardS, marginBottom:0, textAlign:"center" }}>
              <div style={{ fontSize:18, fontWeight:800, color:c }}>{v}</div>
              <div style={{ fontSize:11, color:DIM, marginTop:3 }}>{l}</div>
            </div>
          ))}
        </div>
      )}
      {hasData && (
        <div style={cardS}>
          <div style={{ fontSize:13, fontWeight:700, color:DIM, marginBottom:14 }}>{t('progress.chart.title', { n: last10.length })}</div>
          {chart}
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
            <span style={{ fontSize:11, color:"#333" }}>{last10[0]?.date}</span>
            <span style={{ fontSize:11, color:"#333" }}>{last10[last10.length-1]?.date}</span>
          </div>
        </div>
      )}
      {!hasData && (
        <div style={{ textAlign:"center", padding:"48px 0", color:DIM }}>
          <div style={{ fontSize:40, marginBottom:14 }}>📊</div>
          <div style={{ fontSize:15, fontWeight:600, color:"#333" }}>{t('progress.empty.title')}</div>
          <div style={{ fontSize:13, marginTop:6 }}>{t('progress.empty.sub')}</div>
        </div>
      )}
      {weightLog.length>0 && (
        <div style={{ marginTop:16 }}>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>{t('progress.history')}</div>
          {[...weightLog].reverse().map((e,i)=>(
            <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${BOR}` }}>
              <span style={{ color:DIM, fontSize:13 }}>{e.date}</span>
              <span style={{ fontWeight:700, fontSize:13 }}>{e.weight} kg</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SUPPLEMENTS SCREEN ───────────────────────────────────────────────────────
function SupplementsScreen({ goal }) {
  const { t, lang } = useLang();
  const supps = SUPPLEMENTS[lang].filter(s => s.goals.includes(goal));
  return (
    <div style={{ padding:"52px 20px 20px", overflowY:"auto" }}>
      <div style={{ fontSize:13, color:DIM, marginBottom:2 }}>{t('supps.sub')}</div>
      <div style={{ fontSize:26, fontWeight:800, marginBottom:6 }}>{t('supps.title')}</div>
      <div style={{ fontSize:13, color:DIM, marginBottom:24 }}>{t('supps.disclaimer')}</div>
      {supps.map(sup=>{
        const isPriority = sup.priority.includes(goal);
        return (
          <div key={sup.name} style={{ ...cardS, border:`1px solid ${isPriority?sup.color+"40":BOR}`, background:isPriority?sup.color+"08":CARD }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <span style={{ fontSize:28 }}>{sup.icon}</span>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:sup.color }}>{sup.name}</div>
                {isPriority && <div style={{ fontSize:11, fontWeight:700, color:sup.color+"99", marginTop:2 }}>{t('supps.priority')}</div>}
              </div>
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:14 }}>
              <div style={{ flex:1, background:"#0f0f0f", borderRadius:9, padding:"10px 12px" }}>
                <div style={{ fontSize:10, color:DIM, marginBottom:3, textTransform:"uppercase", letterSpacing:0.5 }}>{t('supps.dose')}</div>
                <div style={{ fontSize:13, fontWeight:700, color:"#ddd" }}>{sup.dose}</div>
              </div>
              <div style={{ flex:1, background:"#0f0f0f", borderRadius:9, padding:"10px 12px" }}>
                <div style={{ fontSize:10, color:DIM, marginBottom:3, textTransform:"uppercase", letterSpacing:0.5 }}>{t('supps.timing')}</div>
                <div style={{ fontSize:13, fontWeight:700, color:"#ddd" }}>{sup.timing}</div>
              </div>
            </div>
            <div style={{ marginBottom:12 }}>
              {sup.benefits.map((b,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:sup.color, flexShrink:0 }} />
                  <div style={{ fontSize:13, color:"#aaa" }}>{b}</div>
                </div>
              ))}
            </div>
            <div style={{ background:"#0f0f0f", borderRadius:9, padding:"10px 12px" }}>
              <div style={{ fontSize:12, color:DIM, lineHeight:1.5 }}>💡 {sup.note}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
