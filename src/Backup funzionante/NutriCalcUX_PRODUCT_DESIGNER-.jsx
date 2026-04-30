/* eslint-disable */
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { Html5Qrcode } from "html5-qrcode";
let _lang = localStorage.getItem("nc2-lang")||"it";
const API_BASE = typeof window !== "undefined" && (window.Capacitor || window.location.protocol === "file:") ? "https://nutricalc-nine.vercel.app" : "";

// Sopprime errori "Lock stolen" di Supabase in development (hot-reload)
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', function(e) {
    if (e.reason && (
      String(e.reason).includes('Lock') ||
      String(e.reason).includes('steal') ||
      String(e.reason).includes('lock:nc2')
    )) { e.preventDefault(); }
  });
}

// CONFIG
const SB_URL = process.env.REACT_APP_SUPABASE_URL || "";
const SB_KEY  = process.env.REACT_APP_SUPABASE_ANON_KEY || "";
const USDA_K  = process.env.REACT_APP_USDA_KEY || "DEMO_KEY";
// Supabase singleton con storage custom - bypassa Web Locks API
const _sbKey = 'nc2-sb-client';
const _customStorage = {
  getItem:    (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  setItem:    (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  removeItem: (k) => { try { localStorage.removeItem(k); } catch {} },
};
const supabase = (() => {
  if (!SB_URL || !SB_KEY) return null;
  if (window[_sbKey]) return window[_sbKey];
  const client = createClient(SB_URL, SB_KEY, {
    auth: {
      storage: _customStorage,
      storageKey: 'nc2-auth',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: async (name, acquireTimeout, fn) => {
        // Bypass navigator.locks - esegui direttamente senza lock
        return await fn();
      },
    },
  });
  window[_sbKey] = client;
  return client;
})();

// Helper: data locale YYYY-MM-DD (evita shift UTC+2 con toISOString)
const localDateStr=()=>{
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

// DESIGN SYSTEM
const C = {
  bg:"#04090F", surf:"#0A1929", card:"#0F2235", cardHi:"#152D44",
  bord:"#1A3448", bord2:"#234560",
  acc:"#2DD4BF", aLo:"#2DD4BF15", aLo2:"#2DD4BF25",
  blu:"#60A5FA", bLo:"#60A5FA15",
  ora:"#FBBF24", oLo:"#FBBF2415",
  red:"#F87171", rLo:"#F8717115",
  yel:"#FDE68A", yLo:"#FDE68A15",
  pur:"#A78BFA", pLo:"#A78BFA15",
  txt:"#EEF4FB", mid:"#5B7F9A", dim:"#0C1822",
  g1:"#2DD4BF", g2:"#60A5FA",
  mCol:(name)=>{
    const n=(name||"").toLowerCase();
    if(["colazione","breakfast"].some(k=>n.includes(k))) return "#FBBF24";
    if(["pranzo","lunch"].some(k=>n.includes(k))) return "#2DD4BF";
    if(["cena","dinner"].some(k=>n.includes(k))) return "#60A5FA";
    return "#A78BFA";
  },
};
const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
input::-webkit-inner-spin-button{-webkit-appearance:none}
input[type=number]{-moz-appearance:textfield}
::-webkit-scrollbar{display:none}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes scanBar{0%,100%{top:8%}50%{top:72%}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes glow{0%,100%{box-shadow:0 0 0 0 #2DD4BF00}50%{box-shadow:0 0 28px 8px #2DD4BF44}}
@keyframes glowBar{0%,100%{box-shadow:0 0 0 0 #2DD4BF00}50%{box-shadow:0 0 10px 2px #2DD4BF66}}
@keyframes heroShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes cardIn{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes numPop{0%{transform:scale(1)}50%{transform:scale(1.1)}100%{transform:scale(1)}}
@keyframes ringFill{from{stroke-dasharray:0 1000}to{}}
@keyframes slideRight{from{width:0}to{}}
@keyframes barShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
`;
const ff = "'Plus Jakarta Sans',system-ui,sans-serif";
const ss = { background:C.bg, minHeight:"100vh", color:C.txt, fontFamily:ff, maxWidth:430, margin:"0 auto" };
const cS = {
  background:`linear-gradient(145deg, ${C.card} 0%, ${C.surf} 100%)`,
  borderRadius:24, border:`1px solid ${C.bord}`,
  padding:"18px 20px", marginBottom:14,
  boxShadow:"0 4px 24px rgba(0,0,0,.35), 0 1px 0 rgba(255,255,255,.04) inset",
};
const bP = { width:"100%", padding:"16px 24px", background:`linear-gradient(135deg, ${C.acc} 0%, #00C488 100%)`, color:"#07100D", border:"none", borderRadius:18, fontWeight:900, fontSize:16, cursor:"pointer", fontFamily:ff, letterSpacing:-0.2, transition:"opacity .15s, transform .1s", boxShadow:`0 6px 24px ${C.acc}55` };
const bS = { width:"100%", padding:"14px 24px", background:C.surf, color:C.txt, border:`1.5px solid ${C.bord2}`, borderRadius:18, fontWeight:700, fontSize:15, cursor:"pointer", fontFamily:ff };
const inp = { width:"100%", background:C.surf, border:`1.5px solid ${C.bord}`, borderRadius:14, padding:"13px 16px", color:C.txt, fontSize:15, outline:"none", fontFamily:ff, fontWeight:500 };
const rnd = n => Math.round(n);

// LOCAL STORAGE
const LS = {
  g: k => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  s: (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// SUPABASE LAYER
const DB = {
  async saveProfile(uid, d) { if (!supabase) return; const { error } = await supabase.from("profiles").upsert({ id:uid, ...d, updated_at:new Date().toISOString() }); if (error) console.error("saveProfile error:", error); },
  async loadProfile(uid) { if (!supabase) return null; const { data, error } = await supabase.from("profiles").select("*").eq("id",uid).single(); if (error && error.code !== 'PGRST116') console.error("loadProfile error:", error); return data || null; },
  async saveWeightSkip(uid, date) { if (!supabase) return; await supabase.from("profiles").upsert({ id:uid, weight_skip_date:date, updated_at:new Date().toISOString() }); },
  async loadWeightSkip(uid) { if (!supabase) return null; const { data } = await supabase.from("profiles").select("weight_skip_date").eq("id",uid).single(); return data?.weight_skip_date||null; },
  async saveWeeklyPlan(uid, plan, seed) {
    if (!supabase) return;
    await supabase.from("user_weekly_plan").upsert([{user_id:uid,plan_data:plan,plan_seed:seed||0,updated_at:new Date().toISOString()}],{onConflict:"user_id"});
  },
  async loadWeeklyPlan(uid) {
    if (!supabase) return null;
    const { data } = await supabase.from("user_weekly_plan").select("*").eq("user_id",uid).single();
    return data ? { plan:data.plan_data, seed:data.plan_seed||0 } : null;
  },
  async saveLockedMeals(uid, date, locked) {
    if (!supabase) return;
    await supabase.from("meal_logs").upsert([{user_id:uid,log_date:date,locked_meals:locked}],{onConflict:"user_id,log_date"});
  },
  async loadLockedMeals(uid, date) {
    if (!supabase) return {};
    const { data } = await supabase.from("meal_logs").select("locked_meals").eq("user_id",uid).eq("log_date",date).single();
    return data?.locked_meals||{};
  },
  async saveSeenIntro(uid) {
    if (!supabase) return;
    await supabase.from("profiles").upsert({id:uid,seen_intro:true,updated_at:new Date().toISOString()});
  },
  async loadSeenIntro(uid) {
    if (!supabase) return false;
    const { data } = await supabase.from("profiles").select("seen_intro").eq("id",uid).single();
    return !!data?.seen_intro;
  },
  async saveTargets(uid, tg, ml) {
    if (!supabase) return;
    await supabase.from("user_targets").upsert({ user_id:uid, targets:JSON.stringify(tg), meal_list:JSON.stringify(ml), updated_at:new Date().toISOString() });
  },
  async loadTargets(uid) {
    if (!supabase) return null;
    const { data } = await supabase.from("user_targets").select("*").eq("user_id",uid).single();
    return data ? { targets:JSON.parse(data.targets), mealList:JSON.parse(data.meal_list) } : null;
  },
  async saveWeightLog(uid, logs) {
    if (!supabase) return;
    const { error: delErr } = await supabase.from("weight_logs").delete().eq("user_id", uid);
    if (delErr) { console.error("saveWeightLog delete error:", delErr); return; }
    if (logs.length) {
      const { error: insErr } = await supabase.from("weight_logs").insert(logs.map(l=>({user_id:uid,date:l.date,weight:l.weight})));
      if (insErr) console.error("saveWeightLog insert error:", insErr);
    }
  },
  async loadWeightLog(uid) { if (!supabase) return []; const { data } = await supabase.from("weight_logs").select("*").eq("user_id",uid).order("date"); return data ? data.map(d=>({date:d.date,weight:d.weight})) : []; },
  async savePantry(uid, items) {
    if (!supabase) return;
    const { error: delErr } = await supabase.from("pantry").delete().eq("user_id",uid);
    if (delErr) throw delErr;
    if (items.length) {
      const { error: insErr } = await supabase.from("pantry").insert(items.map(it=>({user_id:uid,food:it.food,qty:it.qty,unit:it.unit,pid:it.id})));
      if (insErr) throw insErr;
    }
  },
  async loadPantry(uid) { if (!supabase) return []; const { data } = await supabase.from("pantry").select("*").eq("user_id",uid); return data ? data.map(d=>{ const stored=d.food; const full=ALL_FOODS.find(f=>f.name===(stored?.name||stored))||stored; return {id:d.pid||d.id,food:full||stored,qty:d.qty,unit:d.unit}; }) : []; },
  async saveMeals(uid, date, meals) {
    if (!supabase) return;
    const { error } = await supabase.from("meal_logs")
      .upsert([{user_id:uid,log_date:date,meals:JSON.stringify(meals)}],{onConflict:"user_id,log_date"});
    if (error) {
      await supabase.from("meal_logs").delete().eq("user_id",uid).eq("log_date",date);
      await supabase.from("meal_logs").insert([{user_id:uid,log_date:date,meals:JSON.stringify(meals)}]);
    }
  },
  async loadMeals(uid, date) { if (!supabase) return null; const { data } = await supabase.from("meal_logs").select("*").eq("user_id",uid).eq("log_date",date).single(); return data ? JSON.parse(data.meals) : null; },
  async saveFavMeals(uid, favs) {
    if (!supabase) return;
    const { error: delErr } = await supabase.from("fav_meals").delete().eq("user_id", uid);
    if (delErr) { console.error("saveFavMeals delete error:", delErr); return; }
    if (favs.length) {
      const { error: insErr } = await supabase.from("fav_meals").insert(favs.map(f=>({user_id:uid,fid:f.id,name:f.name,meal_type:f.mealType,items:JSON.stringify(f.items)})));
      if (insErr) console.error("saveFavMeals insert error:", insErr);
    }
  },
  async loadFavMeals(uid) {
    if (!supabase) return [];
    const { data } = await supabase.from("fav_meals").select("*").eq("user_id",uid).order("created_at");
    return data ? data.map(d=>({id:d.fid,name:d.name,mealType:d.meal_type,items:JSON.parse(d.items)})) : [];
  },
  async saveCustomFoods(uid, foods) {
    if (!supabase) return;
    const { error: delErr } = await supabase.from("custom_foods").delete().eq("user_id", uid);
    if (delErr) { console.error("saveCustomFoods delete error:", delErr); return; }
    if (foods.length) {
      const { error: insErr } = await supabase.from("custom_foods").insert(foods.map(f=>({user_id:uid, food:JSON.stringify(f)})));
      if (insErr) console.error("saveCustomFoods insert error:", insErr);
    }
  },
  async loadCustomFoods(uid) {
    if (!supabase) return [];
    const { data } = await supabase.from("custom_foods").select("*").eq("user_id",uid);
    return data ? data.map(d=>JSON.parse(d.food)) : [];
  },
  async saveNutritionLog(uid, date, mealName, calories, protein, carbs, fat) {
    if (!supabase) return;
    // upsert: atomic, non perde dati se insert fallisce dopo delete
    // RICHIEDE unique constraint su (user_id, log_date, meal_name) — vedi SQL in commento
    // SQL: ALTER TABLE nutrition_logs ADD CONSTRAINT nutrition_logs_unique UNIQUE (user_id, log_date, meal_name);
    const { error } = await supabase.from("nutrition_logs")
      .upsert([{user_id:uid,log_date:date,meal_name:mealName,calories:Math.round(calories),protein:Math.round(protein*10)/10,carbs:Math.round(carbs*10)/10,fat:Math.round(fat*10)/10}],
        {onConflict:"user_id,log_date,meal_name"});
    if(error) {
      // Fallback: delete + insert se upsert non supportato (constraint mancante)
      await supabase.from("nutrition_logs").delete().eq("user_id",uid).eq("log_date",date).eq("meal_name",mealName);
      await supabase.from("nutrition_logs").insert([{user_id:uid,log_date:date,meal_name:mealName,calories:Math.round(calories),protein:Math.round(protein*10)/10,carbs:Math.round(carbs*10)/10,fat:Math.round(fat*10)/10}]);
    }
  },
  async deleteNutritionLog(uid, date, mealName) {
    if (!supabase) return;
    await supabase.from("nutrition_logs")
      .delete().eq("user_id",uid).eq("log_date",date).eq("meal_name",mealName);
  },
  async loadNutritionLogs(uid, fromDate) {
    if (!supabase) return [];
    const { data } = await supabase.from("nutrition_logs").select("*")
      .eq("user_id",uid).gte("log_date",fromDate).order("log_date");
    return data ? data.map(d=>({date:d.log_date,mealName:d.meal_name,calories:d.calories,protein:d.protein,carbs:d.carbs,fat:d.fat})) : [];
  },
  async savePlan(uid, plan) {
    if (!supabase) return null;
    const { data, error } = await supabase.from("saved_plans")
      .insert([{ user_id:uid, name:plan.name, plan_data:plan.plan_data }])
      .select().single();
    if (error) { console.error("savePlan error:", error); return null; }
    return data;
  },
  async loadPlans(uid) {
    if (!supabase) return [];
    const { data } = await supabase.from("saved_plans").select("*")
      .eq("user_id",uid).order("created_at",{ascending:false});
    return data ? data.map(d=>({ id:d.id, name:d.name, planData:d.plan_data, createdAt:d.created_at })) : [];
  },
  async deletePlan(id) {
    if (!supabase) return;
    await supabase.from("saved_plans").delete().eq("id",id);
  },
  // SQL: CREATE TABLE IF NOT EXISTS workout_logs (id bigint generated always as identity primary key, user_id uuid references auth.users not null, log_date date not null, workouts text, unique(user_id,log_date)); ALTER TABLE profiles ADD COLUMN IF NOT EXISTS meal_ratings text;
  async saveWorkoutLogs(uid, date, workouts) {
    if (!supabase) return;
    await supabase.from("workout_logs").upsert([{user_id:uid,log_date:date,workouts:JSON.stringify(workouts)}],{onConflict:"user_id,log_date"});
  },
  async loadWorkoutLogs(uid, fromDate) {
    if (!supabase) return [];
    const { data } = await supabase.from("workout_logs").select("*").eq("user_id",uid).gte("log_date",fromDate).order("log_date");
    if (!data) return [];
    return data.flatMap(d=>{ try{return JSON.parse(d.workouts||"[]");}catch{return[];} });
  },
  async saveMealRatings(uid, ratings) {
    if (!supabase) return;
    try { await supabase.from("profiles").update({meal_ratings:JSON.stringify(ratings)}).eq("id",uid); } catch {}
  },
  async loadMealRatings(uid) {
    if (!supabase) return {};
    try { const { data } = await supabase.from("profiles").select("meal_ratings").eq("id",uid).single(); if(!data?.meal_ratings) return {}; return JSON.parse(data.meal_ratings); } catch { return {}; }
  },
};

// PRESET DIETS - 7 diete standard preimpostate
// patterns: array di 3 template giornalieri ruotati sui 7 giorni
// ogni slot = indice pasto (0=colazione, 1=pranzo/pasto1, 2=cena/pasto2, 3=spuntino, 4=spuntino2)
const PRESET_DIETS = [
  {
    id:"bilanciata", name:"Bilanciata", type:"Bilanciata", typeEn:"Balanced", emoji:"⚖️",
    color:"#00D563", description:"Equilibrio perfetto tra tutti i macronutrienti. Adatta a chi vuole mantenere il peso o aumentare la massa muscolare.", descriptionEn:"Perfect balance of all macronutrients. Suitable for maintaining weight or building muscle mass.",
    avgCal:2000, macroRatio:{p:30,c:45,f:25},
    patterns:[
      {0:["Avena","Yogurt greco 0%","Mirtilli"], 1:["Petto di pollo","Riso bianco cotto","Broccoli"], 2:["Salmone","Patate cotte","Spinaci"], 3:["Banana","Mandorle"]},
      {0:["Fiocchi d'avena","Albumi","Fragole"], 1:["Tacchino","Quinoa cotta","Zucchine"], 2:["Merluzzo","Riso integrale cotto","Peperoni"], 3:["Mela","Yogurt greco 0%"]},
      {0:["Pane integrale","Uova intere","Pomodori"], 1:["Manzo magro","Pasta cotta","Insalata mista"], 2:["Tonno al naturale","Patate cotte","Carote"], 3:["Ricotta magra","Fragole"]},
    ],
  },
  {
    id:"high_protein", name:"High Protein", type:"High Protein", typeEn:"High Protein", emoji:"💪",
    color:"#58A6FF", description:"Alta concentrazione proteica per massimizzare la sintesi muscolare. Ideale per chi si allena con i pesi.", descriptionEn:"High protein concentration to maximize muscle synthesis. Ideal for those who train with weights.",
    avgCal:2200, macroRatio:{p:40,c:35,f:25},
    patterns:[
      {0:["Albumi","Avena","Yogurt greco 0%"], 1:["Petto di pollo","Riso bianco cotto","Broccoli"], 2:["Tonno al naturale","Patate cotte","Spinaci"], 3:["Whey protein","Banana"]},
      {0:["Uova intere","Albumi","Fiocchi d'avena"], 1:["Tacchino","Quinoa cotta","Peperoni"], 2:["Salmone","Riso integrale cotto","Asparagi"], 3:["Yogurt greco 0%","Mirtilli"]},
      {0:["Albumi","Pane integrale","Ricotta magra"], 1:["Gamberetti","Pasta integrale cotta","Zucchine"], 2:["Petto di pollo","Patate cotte","Cavolfiore"], 3:["Whey protein","Mela"]},
    ],
  },
  {
    id:"low_carb", name:"Low Carb", type:"Low Carb", typeEn:"Low Carb", emoji:"📉",
    color:"#FFA657", description:"Riduzione dei carboidrati per favorire il dimagrimento mantenendo la massa muscolare.", descriptionEn:"Carbohydrate reduction to promote fat loss while maintaining muscle mass.",
    avgCal:1800, macroRatio:{p:35,c:20,f:45},
    patterns:[
      {0:["Uova intere","Albumi","Avocado"], 1:["Petto di pollo","Zucchine","Spinaci"], 2:["Salmone","Broccoli","Cavolfiore"], 3:["Mandorle","Yogurt greco 0%"]},
      {0:["Albumi","Ricotta magra","Fragole"], 1:["Tacchino","Peperoni","Funghi"], 2:["Merluzzo","Zucchine","Insalata mista"], 3:["Noci","Bresaola"]},
      {0:["Uova intere","Avocado","Pomodori"], 1:["Manzo magro","Broccoli","Asparagi"], 2:["Tonno al naturale","Cetrioli","Spinaci"], 3:["Mandorle","Yogurt greco 0%"]},
    ],
  },
  {
    id:"keto", name:"Keto", type:"Chetogenica", typeEn:"Ketogenic", emoji:"🥑",
    color:"#D29922", description:"Dieta chetogenica: pochissimi carboidrati, grassi elevati. Il corpo brucia grassi come fonte primaria di energia.", descriptionEn:"Ketogenic diet: very few carbs, high fat. The body burns fat as its primary energy source.",
    avgCal:1900, macroRatio:{p:15,c:5,f:80},
    patterns:[
      {0:["Uova intere","Avocado","Olio d'oliva"], 1:["Petto di pollo","Zucchine","Olio d'oliva"], 2:["Salmone","Spinaci","Mandorle"], 3:["Noci","Bresaola"]},
      {0:["Albumi","Uova intere","Avocado"], 1:["Tacchino","Cavolfiore","Olio d'oliva"], 2:["Manzo magro","Broccoli","Noci"], 3:["Mandorle","Ricotta magra"]},
      {0:["Uova intere","Avocado","Pomodori"], 1:["Sgombro","Insalata mista","Olio d'oliva"], 2:["Petto di pollo","Funghi","Olio d'oliva"], 3:["Noci","Bresaola"]},
    ],
  },
  {
    id:"mediterranea", name:"Mediterranea", type:"Mediterranea", typeEn:"Mediterranean", emoji:"🫒",
    color:"#3FCCA0", description:"Ricca di pesce, legumi, olio extravergine e cereali integrali. Protegge il sistema cardiovascolare.", descriptionEn:"Rich in fish, legumes, extra virgin olive oil and whole grains. Protects the cardiovascular system.",
    avgCal:2000, macroRatio:{p:25,c:50,f:25},
    patterns:[
      {0:["Pane integrale","Yogurt greco 0%","Mirtilli"], 1:["Tonno al naturale","Ceci cotti","Insalata mista"], 2:["Salmone","Riso integrale cotto","Pomodori"], 3:["Mela","Mandorle"]},
      {0:["Avena","Mela"], 1:["Sgombro","Lenticchie cotte","Spinaci"], 2:["Petto di pollo","Pasta cotta","Zucchine"], 3:["Fragole","Noci"]},
      {0:["Pane integrale","Uova intere","Pomodori"], 1:["Merluzzo","Fagioli cotti","Peperoni"], 2:["Salmone","Quinoa cotta","Broccoli"], 3:["Banana","Mandorle"]},
    ],
  },
  {
    id:"vegetariana", name:"Vegetariana", type:"Vegetariana", typeEn:"Vegetarian", emoji:"🥗",
    color:"#4CAF50", description:"Nessuna carne o pesce. Proteine da uova, latticini e legumi. Ricca di fibre e micronutrienti.", descriptionEn:"No meat or fish. Protein from eggs, dairy and legumes. Rich in fiber and micronutrients.",
    avgCal:1900, macroRatio:{p:25,c:50,f:25},
    patterns:[
      {0:["Yogurt greco 0%","Avena","Fragole"], 1:["Uova intere","Quinoa cotta","Spinaci"], 2:["Tofu","Riso bianco cotto","Broccoli"], 3:["Mela","Noci"]},
      {0:["Fiocchi d'avena","Ricotta magra","Mirtilli"], 1:["Albumi","Lenticchie cotte","Peperoni"], 2:["Tempeh","Pasta cotta","Zucchine"], 3:["Banana","Mandorle"]},
      {0:["Pane integrale","Uova intere","Pomodori"], 1:["Tofu","Ceci cotti","Cavolfiore"], 2:["Ricotta magra","Riso integrale cotto","Funghi"], 3:["Yogurt greco 0%","Fragole"]},
    ],
  },
  {
    id:"vegana", name:"Vegana", type:"Vegana", typeEn:"Vegan", emoji:"🌱",
    color:"#8BC34A", description:"100% vegetale. Proteine da tofu, tempeh, legumi e cereali integrali. Rispetta l'ambiente e la salute.", descriptionEn:"100% plant-based. Protein from tofu, tempeh, legumes and whole grains. Respects the environment and health.",
    avgCal:1900, macroRatio:{p:20,c:55,f:25},
    patterns:[
      {0:["Fiocchi d'avena","Mirtilli","Banana"], 1:["Tofu","Riso bianco cotto","Broccoli"], 2:["Tempeh","Lenticchie cotte","Spinaci"], 3:["Mandorle","Mela"]},
      {0:["Avena","Fragole"], 1:["Tempeh","Quinoa cotta","Peperoni"], 2:["Tofu","Fagioli cotti","Zucchine"], 3:["Banana","Noci"]},
      {0:["Pane integrale","Mirtilli","Banana"], 1:["Tofu","Ceci cotti","Cavolfiore"], 2:["Tempeh","Riso integrale cotto","Funghi"], 3:["Mandorle","Mela"]},
    ],
  },
  {
    id:"ss_nutrition", name:"SS Nutrition", type:"High Protein Cycling", typeEn:"High Protein Cycling", emoji:"🏋️",
    color:"#E040FB",
    description:"Alternanza Giornata Standard (35/35/30) e Carico Glucidico (31/46/23). ~2460-2674 kcal. Proteina stabile ~215-230g. Pensato per composizione corporea su atleti 85-100kg.",
    descriptionEn:"Alternating Standard Day (35/35/30) and Carb Load (31/46/23). ~2460-2674 kcal. Stable protein ~215-230g. Designed for body composition for 85-100kg athletes.",
    avgCal:2568, macroRatio:{p:33,c:41,f:26},
    patterns:[
      {
        0:["Albumi","Fiocchi d'avena","Mirtilli","Noci"],
        1:["Whey protein","Mela"],
        2:["Riso integrale cotto","Petto di pollo","Insalata mista","Olio d'oliva"],
        3:["Bresaola","Galletta di riso integrale"],
        4:["Manzo magro","Pane integrale","Broccoli","Olio d'oliva"],
      },
      {
        0:["Albumi","Fiocchi d'avena","Mirtilli","Noci"],
        1:["Whey protein","Mela"],
        2:["Riso integrale cotto","Petto di pollo","Insalata mista","Olio d'oliva"],
        3:["Bresaola","Galletta di riso integrale"],
        4:["Manzo magro","Pane integrale","Broccoli","Olio d'oliva"],
      },
      {
        0:["Albumi","Fiocchi d'avena","Mirtilli","Noci"],
        1:["Whey protein","Mela"],
        2:["Riso integrale cotto","Petto di pollo","Insalata mista","Olio d'oliva"],
        3:["Bresaola","Galletta di riso integrale"],
        4:["Manzo magro","Pane integrale","Broccoli","Olio d'oliva"],
      },
      {
        0:["Albumi","Fiocchi d'avena","Mirtilli","Noci"],
        1:["Whey protein","Mela"],
        2:["Riso integrale cotto","Petto di pollo","Insalata mista","Olio d'oliva"],
        3:["Bresaola","Galletta di riso integrale"],
        4:["Manzo magro","Pane integrale","Broccoli","Olio d'oliva"],
      },
      {
        0:["Albumi","Fiocchi d'avena","Mirtilli","Noci"],
        1:["Whey protein","Mela"],
        2:["Riso integrale cotto","Petto di pollo","Insalata mista","Olio d'oliva"],
        3:["Bresaola","Galletta di riso integrale"],
        4:["Manzo magro","Pane integrale","Broccoli","Olio d'oliva"],
      },
      {
        0:["Latte scremato","Fiocchi d'avena","Pane integrale"],
        1:["Whey protein","Galletta di riso integrale","Noci"],
        2:["Galletta di riso integrale","Petto di pollo","Insalata mista","Olio d'oliva"],
        3:["Yogurt greco 0%","Whey protein","Mela"],
        4:["Tacchino","Riso integrale cotto","Insalata mista","Olio d'oliva"],
      },
      {
        0:["Latte scremato","Fiocchi d'avena","Pane integrale"],
        1:["Whey protein","Galletta di riso integrale","Noci"],
        2:["Galletta di riso integrale","Petto di pollo","Insalata mista","Olio d'oliva"],
        3:["Yogurt greco 0%","Whey protein","Mela"],
        4:["Tacchino","Riso integrale cotto","Insalata mista","Olio d'oliva"],
      },
    ],
  },
];

// FOOD DATABASE
const CATEGORY_NAMES_EN = {
  "Proteine":"Proteins","Carboidrati":"Carbohydrates","Verdure":"Vegetables","Grassi":"Fats","Latticini":"Dairy","Bevande":"Beverages",
};
function getCatName(cat,lang) { const l=lang||(localStorage.getItem("nc2-lang")||"it"); return l==="en" ? (CATEGORY_NAMES_EN[cat]||cat) : cat; }
function getFoodName(food,lang) { const l=lang||(localStorage.getItem("nc2-lang")||"it"); return l==="en" ? (food.nameEn||food.name) : food.name; }

const FOODS = {
  "Proteine": [
    {name:"Petto di pollo",nameEn:"Chicken breast",emoji:"🍗",cal:165,p:31,c:0,f:3.6},
    {name:"Tacchino",nameEn:"Turkey",emoji:"🦃",cal:189,p:29,c:0,f:7},
    {name:"Manzo magro",nameEn:"Lean beef",emoji:"🥩",cal:143,p:22,c:0,f:6},
    {name:"Salmone",nameEn:"Salmon",emoji:"🐠",cal:208,p:20,c:0,f:13},
    {name:"Tonno al naturale",nameEn:"Tuna in water",emoji:"🐟",cal:116,p:26,c:0,f:1},
    {name:"Merluzzo",nameEn:"Cod",emoji:"🐡",cal:82,p:18,c:0,f:0.7},
    {name:"Sgombro",nameEn:"Mackerel",emoji:"🐟",cal:205,p:19,c:0,f:14},
    {name:"Uova intere",nameEn:"Whole eggs",emoji:"🥚",cal:155,p:13,c:1.1,f:11},
    {name:"Albumi",nameEn:"Egg whites",emoji:"🥣",cal:52,p:11,c:0.7,f:0.2},
    {name:"Yogurt greco 0%",nameEn:"Greek yogurt 0%",emoji:"🫙",cal:59,p:10,c:3.6,f:0.4,maxQty:200},
    {name:"Ricotta magra",nameEn:"Low-fat ricotta",emoji:"🧀",cal:138,p:11,c:4,f:8,maxQty:200},
    {name:"Tofu",nameEn:"Tofu",emoji:"🍱",cal:76,p:8,c:2,f:4},
    {name:"Whey protein",nameEn:"Whey protein",emoji:"🥛",cal:380,p:75,c:7,f:5,maxQty:50},
    {name:"Caseina",nameEn:"Casein",emoji:"🥛",cal:370,p:72,c:8,f:4,maxQty:50},
    {name:"Gamberetti",nameEn:"Shrimp",emoji:"🦐",cal:85,p:18,c:0.9,f:0.9},
    {name:"Bresaola",nameEn:"Bresaola",emoji:"🥩",cal:151,p:32,c:0.5,f:2},
    {name:"Prosciutto cotto",nameEn:"Cooked ham",emoji:"🥩",cal:149,p:19,c:1,f:7},
    {name:"Tempeh",nameEn:"Tempeh",emoji:"🌱",cal:193,p:19,c:9,f:11},
    {name:"Acciuga sott'olio, sgocciolata",emoji:"🫒",cal:182.0,p:26.4,c:0.2,f:8.5},
    {name:"Agnello, carré, crudo (Australia, Nuova Zelanda)",emoji:"🥚",cal:156.0,p:20.3,c:0.0,f:8.3},
    {name:"Agnello, lombata, cruda (Australia, Nuova Zelanda)",emoji:"🥚",cal:117.0,p:21.8,c:0.0,f:3.3},
    {name:"Agnello, spezzatino, crudo (Svizzera)",emoji:"📦",cal:154.0,p:19.6,c:0.0,f:8.4},
    {name:"Bevanda a base di avena, naturale",emoji:"🌾",cal:47.0,p:0.5,c:7.8,f:1.5},
    {name:"Bevanda a base di mandorla, naturale",emoji:"🌰",cal:33.0,p:1.1,c:1.3,f:2.6},
    {name:"Bevanda a base di soia, naturale",emoji:"🫘",cal:40.0,p:3.6,c:1.5,f:2.1},
    {name:"Carne salmistrata cruda (media)",emoji:"📦",cal:240.0,p:31.0,c:0.4,f:12.7},
    {name:"Carne salmistrata da cuocere (media)",emoji:"📦",cal:223.0,p:19.8,c:0.7,f:15.6},
    {name:"Cervelat",emoji:"📦",cal:249.0,p:13.4,c:0.5,f:21.5},
    {name:"Cordon bleu di maiale, preparato",emoji:"🥩",cal:241.0,p:23.2,c:10.3,f:11.7},
    {name:"Cordon bleu di vitello, preparato",emoji:"🥩",cal:233.0,p:22.9,c:10.3,f:11.0},
    {name:"Cotto",emoji:"📦",cal:93.0,p:15.7,c:0.6,f:3.1},
    {name:"Cozza, cotta",emoji:"📦",cal:108.0,p:17.2,c:5.1,f:2.1},
    {name:"Cozze, crude",emoji:"📦",cal:85.0,p:11.7,c:3.4,f:2.7},
    {name:"Crostaceo (media), crudi",emoji:"📦",cal:77.0,p:15.5,c:1.0,f:1.2},
    {name:"Fleischkäse (pasticcio di carne)",emoji:"📦",cal:256.0,p:12.5,c:1.4,f:22.3},
    {name:"Gambero, cotto",emoji:"🦐",cal:50.0,p:9.0,c:1.3,f:1.0},
    {name:"Landjäger (salamino affumicato)",emoji:"📦",cal:491.0,p:26.6,c:0.0,f:42.7},
    {name:"Lioner di pollo",emoji:"🍗",cal:205.0,p:13.5,c:0.9,f:16.4},
    {name:"Luganiga",emoji:"📦",cal:292.0,p:21.7,c:0.5,f:22.4},
    {name:"Maiale, costine, crude",emoji:"🥩",cal:239.0,p:17.9,c:0.0,f:18.6},
    {name:"Pantli",emoji:"📦",cal:538.0,p:21.1,c:0.9,f:50.0},
    {name:"Paté di campgagna",emoji:"📦",cal:298.0,p:13.6,c:0.9,f:26.5},
    {name:"Prosciutto arrotolato",emoji:"🥩",cal:181.0,p:20.3,c:1.2,f:10.6},
    {name:"Prosciutto cotto di coscia",emoji:"🥩",cal:104.0,p:20.2,c:0.7,f:2.3},
    {name:"Prosciutto cotto di spalla",emoji:"🥩",cal:106.0,p:18.6,c:0.4,f:3.3},
    {name:"Rollmops",emoji:"📦",cal:191.0,p:13.7,c:3.0,f:13.8},
    {name:"Salmone, affumicato",emoji:"🐠",cal:173.0,p:23.2,c:0.0,f:8.9},
    {name:"Salsiccette Minipic",emoji:"📦",cal:460.0,p:26.1,c:0.8,f:39.1},
    {name:"Salsiz",emoji:"📦",cal:415.0,p:25.2,c:0.0,f:34.9},
    {name:"Saltimbocca, cotto in olio di colza HOLL",emoji:"🫒",cal:216.0,p:28.8,c:0.1,f:11.2},
    {name:"Sanguinaccio",emoji:"📦",cal:149.0,p:10.2,c:2.5,f:10.9},
    {name:"Sardina sott'olio, sgocciolata",emoji:"🫒",cal:204.0,p:24.4,c:0.5,f:11.6},
    {name:"Saucisse aux choux",emoji:"📦",cal:363.0,p:15.9,c:1.6,f:32.4},
    {name:"Scaloppina di vitello, cotta in olio di colza HOLL",emoji:"🥩",cal:185.0,p:26.8,c:0.0,f:8.6},
    {name:"Schüblig di campagna",emoji:"📦",cal:524.0,p:21.3,c:0.3,f:48.5},
    {name:"Schüblig di San Gallo",emoji:"📦",cal:237.0,p:12.6,c:0.2,f:20.7},
    {name:"Seitan",emoji:"🍱",cal:193.0,p:28.0,c:3.0,f:7.2},
    {name:"Sostituto del formaggio, a base di anacardi",emoji:"🧀",cal:442.0,p:14.5,c:15.2,f:35.3},
    {name:"Sostituto dello yogurt, a base di cocco, naturale",emoji:"🫙",cal:92.0,p:0.7,c:5.0,f:7.6},
    {name:"Sostituto dello yogurt, a base di soia, naturale",emoji:"🫙",cal:43.0,p:4.1,c:2.1,f:1.9},
    {name:"Surimi",emoji:"📦",cal:125.0,p:8.3,c:11.8,f:4.9},
    {name:"Tartare di manzo, preparato",emoji:"🥩",cal:125.0,p:16.1,c:3.2,f:5.2},
    {name:"Tempeh, al naturale",emoji:"🍱",cal:157.0,p:17.6,c:7.9,f:4.7},
    {name:"Terrina di cacciagione",emoji:"📦",cal:242.0,p:16.4,c:1.6,f:18.6},
    {name:"Tofu, affumicato (media)",emoji:"🍱",cal:164.0,p:16.4,c:2.9,f:9.5},
    {name:"Tofu, affumicato (prodotto con nigari)",emoji:"🍱",cal:164.0,p:16.4,c:2.9,f:9.5},
    {name:"Tofu, affumicato (prodotto con sale di calcio)",emoji:"🍱",cal:164.0,p:16.4,c:2.9,f:9.5},
    {name:"Tofu, setoso (morbido), al naturale",emoji:"🍱",cal:53.0,p:5.0,c:1.5,f:2.9},
    {name:"Tofu, solido, al naturale (media)",emoji:"🍱",cal:148.0,p:14.7,c:2.9,f:8.5},
    {name:"Tofu, solido, al naturale (prodotto con nigari)",emoji:"🍱",cal:148.0,p:14.7,c:2.9,f:8.5},
    {name:"Tonno, in salamoia, sgocciolato",emoji:"🐟",cal:109.0,p:24.9,c:0.0,f:1.0},
    {name:"Tonno, sott'olio, sgocciolato",emoji:"🐟",cal:199.0,p:27.3,c:0.9,f:9.6},
    {name:"Trota, affumicata",emoji:"📦",cal:177.0,p:23.4,c:0.0,f:9.3},
    {name:"Uovo di gallina, intero, cotto, sodo",emoji:"🍗",cal:156.0,p:14.0,c:0.3,f:10.9},
  
    // Banca Dati Svizzera dei Valori Nutritivi
    {name:"Hamburger (manzo), fatto in casa, cotto in olio di colza HOLL",emoji:"🥩",cal:231.0,p:17.8,c:6.4,f:14.7},
    {name:"Agnello (media, senza interiora e cotoletta), crudo",emoji:"🍽️",cal:137.0,p:20.5,c:0.0,f:6.1},
    {name:"Agnello, cosciotto (Svizzera, Nuova Zelanda), crudo",emoji:"🥚",cal:155.0,p:20.2,c:0.0,f:8.2},
    {name:"Agnello, cosciotto, arrosto (senza aggiunta di grassi o sale)",emoji:"🍽️",cal:203.0,p:28.6,c:0.0,f:9.8},
    {name:"Agnello, filetto, cotto in padella, cottura media (senza aggiunta di grassi o sale)",emoji:"🍽️",cal:147.0,p:25.8,c:0.0,f:4.8},
    {name:"Agnello, filetto, crudo",emoji:"🍽️",cal:122.0,p:20.4,c:0.0,f:4.5},
    {name:"Burger (solo la carne, manzo), fatto in casa, grigliato (senza aggiunta di grassi)",emoji:"🥩",cal:208.0,p:18.3,c:6.5,f:12.0},
    {name:"Fegato (media di vitello, manzo, maiale), cotto in padella (senza aggiunta di grassi o sale)",emoji:"🥩",cal:155.0,p:23.5,c:4.4,f:4.9},
    {name:"Fegato (media di vitello, manzo, maiale), crudo",emoji:"🥩",cal:133.0,p:20.3,c:3.6,f:4.2},
    {name:"Manzo, collo, spezzatino (gulash), crudo",emoji:"🥩",cal:150.0,p:19.3,c:0.0,f:8.1},
    {name:"Manzo, entrecôte, crudo",emoji:"🥩",cal:133.0,p:23.2,c:0.0,f:4.5},
    {name:"Manzo, fegato, crudo",emoji:"🥩",cal:142.0,p:20.5,c:5.3,f:4.3},
    {name:"Manzo, filetto, cotto in padella, cottura media (senza aggiunta di grassi o sale)",emoji:"🥩",cal:147.0,p:27.7,c:0.0,f:4.0},
    {name:"Manzo, filetto, crudo",emoji:"🥩",cal:123.0,p:21.9,c:0.0,f:4.0},
    {name:"Manzo, girello, crudo",emoji:"🥩",cal:106.0,p:22.4,c:0.0,f:1.8},
    {name:"Manzo, per bollito, magro, bollito (senza aggiunta di grassi e sale)",emoji:"🥩",cal:190.0,p:31.7,c:0.0,f:7.1},
    {name:"Manzo, per bollito, magro, crudo",emoji:"🥩",cal:132.0,p:20.7,c:0.0,f:5.5},
    {name:"Manzo, per bollito, misto, bollito (senza aggiunta di grassi o sale)",emoji:"🥩",cal:276.0,p:26.6,c:0.0,f:18.9},
    {name:"Manzo, per bollito, misto, crudo",emoji:"🥩",cal:227.0,p:19.5,c:0.0,f:16.6},
    {name:"Manzo, petto, cotto (senza aggiunta di grassi e sale)",emoji:"🥩",cal:254.0,p:28.3,c:0.0,f:15.6},
    {name:"Manzo, petto, crudo",emoji:"🥩",cal:188.0,p:18.9,c:0.0,f:12.5},
    {name:"Manzo, sminuzzato, crudo",emoji:"🥩",cal:102.0,p:22.2,c:0.0,f:1.5},
    {name:"Manzo, spalla, arrosto, crudo",emoji:"🥩",cal:117.0,p:21.6,c:0.0,f:3.5},
    {name:"Manzo, spezzatino, crudo",emoji:"🥩",cal:97.0,p:21.2,c:0.0,f:1.3},
    {name:"Merluzzo bianco, crudo",emoji:"🐡",cal:78.0,p:18.1,c:0.0,f:0.6},
    {name:"Merluzzo bianco, filetto, al vapore (senza aggiunta di grassi o sale)",emoji:"🐡",cal:74.0,p:17.0,c:0.0,f:0.6},
    {name:"Merluzzo nero, crudo",emoji:"🐡",cal:84.0,p:19.3,c:0.0,f:0.8},
    {name:"Pollo, intero con pelle, crudo",emoji:"🍗",cal:168.0,p:18.8,c:0.0,f:10.3},
    {name:"Pollo, petto con pelle, crudo",emoji:"🍗",cal:152.0,p:23.3,c:0.0,f:6.5},
    {name:"Pollo, petto senza pelle, crudo",emoji:"🍗",cal:107.0,p:24.6,c:0.0,f:1.0},
    {name:"Pollo, petto, fettina o sminuzzato, cotto in padella (senza aggiunta di grassi o sale)",emoji:"🍗",cal:128.0,p:30.1,c:0.0,f:0.8},
    {name:"Rognone di vitello, crudo",emoji:"🥩",cal:95.0,p:15.8,c:1.0,f:3.1},
    {name:"Salmone d'allevamento, crudo",emoji:"🐠",cal:223.0,p:19.9,c:0.0,f:15.9},
    {name:"Salmone d'allevamento, filetto, al vapore (senza aggiunta di grassi o sale)",emoji:"🐠",cal:200.0,p:18.7,c:0.0,f:13.9},
    {name:"Salmone selvatico, crudo",emoji:"🐠",cal:182.0,p:19.7,c:0.0,f:11.5},
    {name:"Spezzatino (media di manzo, vitello, maiale e pollame), cotto in padella (senza aggiunta di grassi o sale)",emoji:"🥩",cal:142.0,p:29.5,c:0.2,f:2.6},
    {name:"Spezzatino (media di manzo, vitello, maiale e pollame), crudo",emoji:"🥩",cal:111.0,p:22.5,c:0.2,f:2.3},
    {name:"Tonno, crudo",emoji:"🐟",cal:114.0,p:25.8,c:0.0,f:1.3},
    {name:"Vitello, arrosto di spalla, cotto al forno (senza aggiunta di grassi e sale)",emoji:"🥩",cal:161.0,p:28.6,c:0.0,f:5.2},
    {name:"Vitello, bistecca,  cotto in padella (senza aggiunta di grassi o sale)",emoji:"🥩",cal:144.0,p:27.3,c:0.0,f:3.9},
    {name:"Vitello, fegato, crudo",emoji:"🥩",cal:127.0,p:19.6,c:4.6,f:3.4},
    {name:"Vitello, filetto, crudo",emoji:"🥩",cal:119.0,p:21.2,c:0.0,f:3.8},
    {name:"Vitello, geretto, crudo",emoji:"🥩",cal:116.0,p:20.7,c:0.0,f:3.7},
    {name:"Vitello, macinato, crudo",emoji:"🥩",cal:105.0,p:20.5,c:0.0,f:2.6},
    {name:"Vitello, petto, cotto (senza aggiunta di grassi e sale)",emoji:"🥩",cal:234.0,p:23.5,c:0.0,f:15.5},
    {name:"Vitello, petto, crudo",emoji:"🥩",cal:204.0,p:18.3,c:0.0,f:14.5},
    {name:"Vitello, sminuzzato, cotto in padella (senza aggiunta di grassi o sale)",emoji:"🥩",cal:123.0,p:28.2,c:0.0,f:1.1},
    {name:"Vitello, sminuzzato, crudo",emoji:"🥩",cal:98.0,p:22.0,c:0.0,f:1.1},
    {name:"Vitello, spalla, arrosto, crudo",emoji:"🥩",cal:122.0,p:20.2,c:0.0,f:4.6},
    {name:"Vitello, spezzatino, crudo",emoji:"🥩",cal:102.0,p:20.0,c:0.0,f:2.4},
    {name:"Bastoncino di pesce (impanato e prefritto), cotto in olio di colza HOLL",emoji:"🐡",cal:302.0,p:16.0,c:16.8,f:18.9},
    {name:"Agnello, costoletta, cruda",emoji:"🍽️",cal:179.0,p:20.2,c:0.0,f:10.9},
    {name:"Carne di manzo (media, senza interiora e costine), cruda",emoji:"🥩",cal:137.0,p:21.4,c:0.0,f:5.7},
    {name:"Carne di vitello (media, escluse interiora e la cotoletta), cruda",emoji:"🥩",cal:127.0,p:21.1,c:0.0,f:4.8},
    {name:"Carne tritata (media di manzo, vitello, maiale e pollo), cruda",emoji:"🍗",cal:183.0,p:20.1,c:0.0,f:11.4},
    {name:"Carne tritata (media di manzo,vitello, maiale e pollo), cotta in padella (senza aggiunta di grassi o sale)",emoji:"🍗",cal:205.0,p:24.4,c:0.0,f:12.0},
    {name:"Costoletta (media di vitello, maiale e agnello), cotta in padella (senza aggiunta di grassi o sale)",emoji:"🥩",cal:223.0,p:28.8,c:0.0,f:12.0},
    {name:"Costoletta (media di vitello, maiale e agnello), cruda",emoji:"🥩",cal:177.0,p:21.3,c:0.0,f:10.2},
    {name:"Fettina (media di vitello, manzo, maiale, pollo), cotta in padella (senza aggiunta di grassi o sale)",emoji:"🍗",cal:141.0,p:29.7,c:0.2,f:2.4},
    {name:"Fettina (media di vitello, manzo, maiale, pollo), cruda",emoji:"🍗",cal:110.0,p:22.6,c:0.2,f:2.1},
    {name:"Fettina (media di vitello, manzo, maiale, pollo), impanata e preparata",emoji:"🍗",cal:229.0,p:23.9,c:10.2,f:10.2},
    {name:"Lingua (media di vitello e manzo), cruda",emoji:"🥩",cal:191.0,p:16.6,c:2.8,f:12.6},
    {name:"Manzo, bistecca, cruda",emoji:"🥩",cal:165.0,p:21.1,c:0.0,f:9.0},
    {name:"Manzo, carne macinata, cotta in padella (senza aggiunta di grassi o sale)",emoji:"🥩",cal:211.0,p:32.6,c:0.0,f:8.9},
    {name:"Manzo, carne macinata, cruda",emoji:"🥩",cal:208.0,p:19.2,c:0.0,f:14.6},
    {name:"Manzo, carne macinata, magra, cruda",emoji:"🥩",cal:154.0,p:21.6,c:0.0,f:7.5},
    {name:"Manzo, entrecôte, cotta, cottura media (senza aggiunta di grassi o sale)",emoji:"🥩",cal:162.0,p:30.2,c:0.0,f:4.6},
    {name:"Manzo, fettina, cruda",emoji:"🥩",cal:111.0,p:22.6,c:0.0,f:2.3},
    {name:"Manzo, lingua, cruda",emoji:"🥩",cal:196.0,p:16.0,c:3.7,f:13.0},
    {name:"Manzo, spalla, arrostita al forno, ben cotta (senza aggiunta di grassi o sale)",emoji:"🥩",cal:170.0,p:33.1,c:0.0,f:4.2},
    {name:"Manzo, spalla, arrostita al forno, cottura al sangue (senza aggiunta di grassi o sale)",emoji:"🥩",cal:135.0,p:26.3,c:0.0,f:3.3},
    {name:"Manzo, spalla, arrostita al forno, cottura media (senza aggiunta di grassi o sale)",emoji:"🥩",cal:146.0,p:28.5,c:0.0,f:3.6},
  ],
  "Carboidrati": [
    {name:"Riso bianco cotto",nameEn:"White rice cooked",emoji:"🍚",cal:130,p:2.7,c:28,f:0.3},
    {name:"Riso integrale cotto",nameEn:"Brown rice cooked",emoji:"🍚",cal:112,p:2.6,c:23,f:0.9},
    {name:"Pasta cotta",nameEn:"Pasta cooked",emoji:"🍝",cal:158,p:5.8,c:31,f:0.9},
    {name:"Pasta integrale cotta",nameEn:"Whole wheat pasta cooked",emoji:"🍝",cal:150,p:5.5,c:28,f:1.1},
    {name:"Avena",nameEn:"Oats",emoji:"🌾",cal:389,p:17,c:66,f:7},
    {name:"Fiocchi d'avena",nameEn:"Rolled oats",emoji:"🌾",cal:368,p:13,c:66,f:7},
    {name:"Pane integrale",nameEn:"Whole wheat bread",emoji:"🍞",cal:247,p:13,c:41,f:3.4},
    {name:"Pane bianco",nameEn:"White bread",emoji:"🥖",cal:265,p:9,c:49,f:3.2},
    {name:"Patate cotte",nameEn:"Potatoes cooked",emoji:"🥔",cal:87,p:1.9,c:20,f:0.1},
    {name:"Quinoa cotta",nameEn:"Quinoa cooked",emoji:"🌿",cal:120,p:4.4,c:21,f:1.9},
    {name:"Lenticchie cotte",nameEn:"Lentils cooked",emoji:"🫘",cal:116,p:9,c:20,f:0.4},
    {name:"Ceci cotti",nameEn:"Chickpeas cooked",emoji:"🫘",cal:164,p:8.9,c:27,f:2.6},
    {name:"Fagioli cotti",nameEn:"Beans cooked",emoji:"🫘",cal:127,p:8.7,c:23,f:0.5},
    {name:"Banana",nameEn:"Banana",emoji:"🍌",cal:89,p:1.1,c:23,f:0.3},
    {name:"Mela",nameEn:"Apple",emoji:"🍎",cal:52,p:0.3,c:14,f:0.2},
    {name:"Mirtilli",nameEn:"Blueberries",emoji:"🫐",cal:57,p:0.7,c:14,f:0.3},
    {name:"Fragole",nameEn:"Strawberries",emoji:"🍓",cal:32,p:0.7,c:7.7,f:0.3},
    {name:"Farro cotto",nameEn:"Spelt cooked",emoji:"🌾",cal:140,p:5,c:27,f:1},
    {name:"Albicocca, sciroppata, in scatola, sgocciolata",emoji:"🍑",cal:62.0,p:0.9,c:13.7,f:0.1},
    {name:"Albicocche, secche",emoji:"📦",cal:239.0,p:2.9,c:59.1,f:0.5},
    {name:"Ananas, con edulcorante, in scatola, sgocciolata",emoji:"📦",cal:42.0,p:0.5,c:9.4,f:0.1},
    {name:"Ananas, sciroppato, in scatola, sgocciolata",emoji:"📦",cal:70.0,p:0.5,c:15.9,f:0.1},
    {name:"Bacche (media), crude",emoji:"📦",cal:43.0,p:0.9,c:7.0,f:0.5},
    {name:"Bastoncini di pasta sfoglia",emoji:"🍝",cal:490.0,p:7.1,c:40.4,f:32.9},
    {name:"Bürli di San Gallo (farina semi-bianca)",emoji:"🌱",cal:231.0,p:9.1,c:44.6,f:1.0},
    {name:"Ceci, secchi",emoji:"🫘",cal:327.0,p:18.6,c:44.3,f:4.9},
    {name:"Ciliegie, crude",emoji:"🍒",cal:62.0,p:0.8,c:13.0,f:0.4},
    {name:"Cornetti (media)",emoji:"📦",cal:398.0,p:7.8,c:40.4,f:22.0},
    {name:"Cornetto al burro, bianco",emoji:"📦",cal:432.0,p:8.7,c:43.5,f:24.2},
    {name:"Cornetto al burro, integrale",emoji:"📦",cal:365.0,p:6.8,c:37.3,f:19.7},
    {name:"Cornetto al prosciutto",emoji:"🥩",cal:340.0,p:11.1,c:26.0,f:20.9},
    {name:"Crusca d'avena",emoji:"🌾",cal:371.0,p:18.5,c:50.8,f:7.0},
    {name:"Datteri, secchi",emoji:"📦",cal:287.0,p:2.4,c:64.7,f:0.4},
    {name:"Dulce de Leche",emoji:"📦",cal:299.0,p:5.7,c:52.6,f:7.3},
    {name:"Fagioli di soia, secchi",emoji:"🫘",cal:396.0,p:38.2,c:8.7,f:18.3},
    {name:"Farina bianca (media)",emoji:"📦",cal:345.0,p:12.0,c:69.7,f:1.3},
    {name:"Farina di grano saraceno",emoji:"📦",cal:343.0,p:12.0,c:65.4,f:2.8},
    {name:"Farina di segale, integrale, cruschello tipo 1800",emoji:"📦",cal:321.0,p:10.8,c:56.6,f:1.5},
    {name:"Farina di segale tipo 1050",emoji:"📦",cal:340.0,p:9.0,c:67.8,f:1.2},
    {name:"Farina di segale tipo 815",emoji:"📦",cal:334.0,p:6.9,c:71.0,f:1.0},
    {name:"Farina di soia integrale (intera)",emoji:"🫘",cal:470.0,p:40.8,c:17.3,f:22.4},
    {name:"Farina di soia, sgrassata",emoji:"🫘",cal:296.0,p:51.5,c:7.5,f:1.2},
    {name:"Farina di spelta bianca tipo 550",emoji:"📦",cal:348.0,p:13.3,c:68.2,f:1.6},
    {name:"Farina di spelta integrale tipo 1900",emoji:"📦",cal:345.0,p:15.0,c:58.0,f:2.5},
    {name:"Farina di spelta tipo 1100",emoji:"📦",cal:348.0,p:14.3,c:65.0,f:2.2},
    {name:"Farina (media)",emoji:"📦",cal:344.0,p:12.0,c:68.8,f:1.4},
    {name:"Farina per knöpfli",emoji:"📦",cal:347.0,p:12.9,c:67.6,f:1.5},
    {name:"Fichi, secchi",emoji:"📦",cal:267.0,p:3.1,c:55.9,f:1.2},
    {name:"Fiocchi di avena",emoji:"🌾",cal:381.0,p:13.5,c:59.5,f:7.5},
    {name:"Fiocchi di cereali (in media)",emoji:"🌾",cal:352.0,p:11.5,c:63.5,f:3.7},
    {name:"Fiocchi di miglio, integrali",emoji:"🌾",cal:360.0,p:10.6,c:68.8,f:3.9},
    {name:"Fiocchi di orzo",emoji:"🌾",cal:333.0,p:8.5,c:66.1,f:1.5},
    {name:"Galletta di riso integrale",emoji:"🍚",cal:390.0,p:7.7,c:81.5,f:2.8,minQty:10,maxQty:30},
    {name:"Galletta di riso integrale, con copertura dolce",emoji:"🍚",cal:500.0,p:6.1,c:63.6,f:23.9},
    {name:"Gnocchi di patate, cotti",emoji:"📦",cal:177.0,p:5.0,c:33.6,f:2.1},
    {name:"Grano saraceno, decorticato",emoji:"📦",cal:341.0,p:13.1,c:62.4,f:3.1},
    {name:"Impasto fermentato",emoji:"📦",cal:199.0,p:7.8,c:38.3,f:0.9},
    {name:"Legumi (media), secchi",emoji:"🫘",cal:336.0,p:25.1,c:39.7,f:4.9},
    {name:"Lenticchie, intere, secche",emoji:"🫘",cal:324.0,p:24.4,c:44.8,f:1.5},
    {name:"Mele, purea, non zuccherata, conserva",emoji:"📦",cal:55.0,p:0.3,c:11.7,f:0.3},
    {name:"Mele, purea, zuccherata, conserva",emoji:"📦",cal:89.0,p:0.3,c:20.5,f:0.3},
    {name:"Mele, sbucciate, secche",emoji:"📦",cal:264.0,p:1.4,c:55.4,f:1.6},
    {name:"Miglio, grano decorticato",emoji:"📦",cal:360.0,p:10.6,c:68.8,f:3.9},
    {name:"Migliotto, cotto",emoji:"📦",cal:144.0,p:3.6,c:24.7,f:3.0},
    {name:"Mirtillo, liofilizzato",emoji:"🫐",cal:338.0,p:6.1,c:56.4,f:4.4},
    {name:"Miscela per muesli croccante, zuccherata (media)",emoji:"🌾",cal:432.0,p:9.4,c:58.8,f:15.9},
    {name:"Nettare d'arancia",emoji:"🍊",cal:44.0,p:0.4,c:10.5,f:0.0},
    {name:"Orzotto, cotto",emoji:"📦",cal:131.0,p:3.0,c:22.2,f:2.4},
    {name:"Pane alle noci",emoji:"🍞",cal:331.0,p:9.2,c:30.2,f:17.9},
    {name:"Pane bigio",emoji:"🍞",cal:234.0,p:9.5,c:44.3,f:1.2},
    {name:"Pane contadino",emoji:"🍞",cal:242.0,p:9.2,c:44.3,f:2.0},
    {name:"Pane croccante (Knäckebrot), integrale",emoji:"🍞",cal:325.0,p:12.0,c:57.9,f:1.7},
    {name:"Pane di segale vallesano",emoji:"🍞",cal:218.0,p:7.6,c:38.8,f:1.0},
    {name:"Pane di tritello di segale",emoji:"🍞",cal:225.0,p:7.7,c:40.0,f:1.1},
    {name:"Pane integrale di grano",emoji:"🍞",cal:213.0,p:8.6,c:38.3,f:1.3},
    {name:"Pane (media)",emoji:"🍞",cal:264.0,p:9.2,c:44.6,f:4.6},
    {name:"Pane per toast al burro",emoji:"🍞",cal:316.0,p:8.9,c:45.7,f:10.4},
    {name:"Pane per toast all'olio vegetale",emoji:"🍞",cal:267.0,p:8.7,c:49.2,f:3.3},
    {name:"Pane per toast integrale",emoji:"🍞",cal:271.0,p:9.3,c:43.7,f:4.9},
    {name:"Pane per toast, scuro o multicereali",emoji:"🍞",cal:272.0,p:9.1,c:45.6,f:4.7},
    {name:"Pane semi-bianco",emoji:"🍞",cal:240.0,p:9.4,c:46.4,f:1.1},
    {name:"Pane ticinese",emoji:"🍞",cal:323.0,p:10.3,c:57.1,f:5.2},
    {name:"Pangrattato",emoji:"📦",cal:373.0,p:12.7,c:73.5,f:2.1},
    {name:"Panino",emoji:"📦",cal:255.0,p:8.7,c:51.8,f:0.8},
    {name:"Panino al latte",emoji:"🥛",cal:309.0,p:9.4,c:47.3,f:8.7},
    {name:"Panino \"Bürli\" (farina semibianca)",emoji:"🌱",cal:215.0,p:8.6,c:41.4,f:1.0},
    {name:"Panino \"michetta\"",emoji:"📦",cal:245.0,p:9.2,c:48.5,f:0.9},
    {name:"Pasta, cotta in acqua salata (sale non iodato)",emoji:"🍝",cal:158.0,p:5.9,c:31.2,f:0.6},
    {name:"Pasta fresca, con ripieno di carne, cotta",emoji:"🍝",cal:174.0,p:6.9,c:25.1,f:4.7},
    {name:"Patate fritte (cotte nel forno), non salate",emoji:"📦",cal:213.0,p:3.8,c:32.6,f:6.6},
    {name:"Patate, pelate, crude",emoji:"📦",cal:76.0,p:2.0,c:15.6,f:0.1},
    {name:"Pera, con edulcorante, in scatola, sgocciolata",emoji:"🍐",cal:50.0,p:0.5,c:9.9,f:0.3},
    {name:"Pera, sciroppata, in scatola, sgocciolata",emoji:"🍐",cal:71.0,p:0.4,c:15.2,f:0.4},
    {name:"Pere, secche",emoji:"📦",cal:288.0,p:2.3,c:59.7,f:1.4},
    {name:"Pesca, con edulcorante, in scatola, sgocciolata",emoji:"🍑",cal:40.0,p:0.8,c:8.1,f:0.1},
    {name:"Pesca, sciroppata, in scatola, sgocciolata",emoji:"🍑",cal:82.0,p:0.7,c:18.6,f:0.1},
    {name:"Piselli, semi maturi, decorticati, secchi",emoji:"🌱",cal:331.0,p:21.3,c:51.9,f:1.7},
    {name:"Polenta nera, preparata",emoji:"📦",cal:111.0,p:4.1,c:12.4,f:4.8},
    {name:"Prugne susine, crude",emoji:"📦",cal:43.0,p:0.6,c:8.8,f:0.1},
    {name:"Riso soffiato, croccante",emoji:"🍚",cal:385.0,p:6.3,c:86.0,f:1.5},
    {name:"Risotto con formaggio, fatto in casa",emoji:"🧀",cal:143.0,p:4.2,c:23.1,f:3.7},
    {name:"Risotto senza formaggio, cotto",emoji:"🧀",cal:124.0,p:2.3,c:24.8,f:1.6},
  
    // Banca Dati Svizzera dei Valori Nutritivi
    {name:"Pasta fresca, con ripieno di spinaci e ricotta, cotta (senza aggiunta di grasso e sale)",emoji:"🧀",cal:177.0,p:7.5,c:24.5,f:4.9},
    {name:"Pasta fresca, con ripieno di spinaci e ricotta, cruda",emoji:"🧀",cal:212.0,p:8.7,c:30.0,f:5.7},
    {name:"Patata dolce, al vapore (senza aggiunta di sale)",emoji:"🥔",cal:81.0,p:1.6,c:17.1,f:0.1},
    {name:"Riso integrale, bollito in acqua salata (sale non iodato)",emoji:"🍚",cal:126.0,p:2.7,c:25.7,f:1.0},
    {name:"Riso raffinato, bollito in acqua salata (sale non iodato)",emoji:"🍚",cal:116.0,p:2.3,c:25.8,f:0.3},
    {name:"Riso tipo parboiled, bollito in acqua salata (sale non iodato)",emoji:"🍚",cal:120.0,p:2.4,c:26.7,f:0.3},
    {name:"Ceci, cotti (senza aggiunta di grassi e sale)",emoji:"🫘",cal:127.0,p:7.3,c:16.8,f:2.0},
    {name:"Galletta di riso integrale, con miele o frutta",emoji:"🍚",cal:379.0,p:6.6,c:81.0,f:2.4},
    {name:"Lenticchie, decorticate, cotte (senza aggiunta di grassi e sale)",emoji:"🫘",cal:134.0,p:11.0,c:19.0,f:0.6},
    {name:"Lenticchie, intere, cotte (senza aggiunta di grassi e sale)",emoji:"🫘",cal:115.0,p:8.8,c:15.6,f:0.5},
    {name:"Pane bigio (con sale iodato)",emoji:"🍞",cal:234.0,p:9.5,c:44.3,f:1.2},
    {name:"Pane croccante (Knäckebrot), integrale, con semi di lino",emoji:"🍞",cal:345.0,p:12.9,c:52.4,f:5.8},
    {name:"Pane croccante (Knäckebrot), integrale, con semi di sesamo",emoji:"🍞",cal:354.0,p:13.1,c:52.4,f:6.9},
    {name:"Pane di segale (con lievito)",emoji:"🍞",cal:210.0,p:6.5,c:39.0,f:0.9},
    {name:"Pane semi-bianco (con sale iodato)",emoji:"🍞",cal:240.0,p:9.4,c:46.4,f:1.1},
    {name:"Pasta all'uovo, cotta in acqua salata (sale non iodato)",emoji:"🥚",cal:132.0,p:5.0,c:25.0,f:1.1},
    {name:"Pasta all'uovo, secca",emoji:"🥚",cal:365.0,p:13.3,c:69.9,f:2.8},
    {name:"Pasta frolla (con burro), dolce, cotta al forno",emoji:"🍝",cal:530.0,p:9.8,c:57.3,f:28.6},
    {name:"Pasta frolla (con burro), dolce, cruda",emoji:"🍝",cal:424.0,p:7.8,c:45.8,f:22.9},
    {name:"Pasta frolla (con grasso vegetale ), dolce, cotta al forno",emoji:"🍝",cal:494.0,p:8.0,c:58.4,f:24.9},
    {name:"Pasta frolla (con grasso vegetale), dolce, cruda",emoji:"🍝",cal:395.0,p:6.4,c:46.7,f:19.9},
    {name:"Pasta integrale, cotta in acqua salata (sale non iodato)",emoji:"🍝",cal:152.0,p:5.9,c:26.8,f:1.2},
    {name:"Pasta integrale, secca",emoji:"🍝",cal:338.0,p:12.6,c:60.6,f:2.5},
    {name:"Pasta lievitata (con burro), dolce, cruda",emoji:"🍝",cal:311.0,p:8.7,c:43.2,f:11.1},
    {name:"Pasta lievitata (con grassa vegetale), dolce, cruda",emoji:"🍝",cal:300.0,p:9.2,c:39.9,f:11.1},
    {name:"Pasta per flammkuchen, cruda",emoji:"🍝",cal:221.0,p:7.5,c:39.9,f:2.9},
    {name:"Pasta per strudel, cruda",emoji:"🍝",cal:234.0,p:7.6,c:44.3,f:2.5},
    {name:"Pasta per torta (con burro), cruda",emoji:"🍝",cal:375.0,p:6.7,c:38.5,f:21.2},
    {name:"Pasta per torta (con grasso vegetale), cruda",emoji:"🍝",cal:394.0,p:6.6,c:38.1,f:23.5},
    {name:"Pasta per torta, integrale (con burro), cruda",emoji:"🍝",cal:372.0,p:7.6,c:33.8,f:21.5},
    {name:"Pasta per torta, integrale (con grasso vegetale), cruda",emoji:"🍝",cal:359.0,p:7.6,c:33.7,f:20.2},
    {name:"Pasta sfoglia (con grasso vegetale), cruda",emoji:"🍝",cal:385.0,p:5.7,c:35.1,f:24.3},
    {name:"Pasta sfoglia di quark (con burro), cruda",emoji:"🍝",cal:401.0,p:7.1,c:29.0,f:28.3},
    {name:"Pasta sfoglia di quark (con grasso vegetale), cruda",emoji:"🍝",cal:388.0,p:7.1,c:28.8,f:26.9},
    {name:"Pasta sfoglia, fatta in casa (al burro), cruda",emoji:"🍝",cal:364.0,p:5.2,c:29.4,f:24.7},
    {name:"Pasta sfoglia, fatta in casa (con grasso vegetale), cruda",emoji:"🍝",cal:349.0,p:5.2,c:29.3,f:23.2},
    {name:"Pasta, secca",emoji:"🍝",cal:353.0,p:12.6,c:70.5,f:1.2},
    {name:"Patata dolce, cotta al forno (senza aggiunta di grassi o sale)",emoji:"🥔",cal:100.0,p:1.9,c:21.1,f:0.1},
    {name:"Patata dolce, cruda",emoji:"🥔",cal:81.0,p:1.6,c:17.1,f:0.1},
    {name:"Patata novella, con buccia, bollita (senza sale)",emoji:"🥔",cal:66.0,p:1.8,c:13.6,f:0.1},
    {name:"Patata, con buccia, cotta al forno (senza aggiunta di grassi o sale)",emoji:"🥔",cal:100.0,p:2.5,c:20.7,f:0.2},
    {name:"Riso integrale, secco",emoji:"🍚",cal:350.0,p:7.4,c:71.4,f:2.8},
    {name:"Riso raffinato, secco",emoji:"🍚",cal:352.0,p:7.4,c:78.0,f:0.9},
    {name:"Riso tipo parboiled, secco",emoji:"🍚",cal:356.0,p:7.5,c:78.6,f:1.0},
    {name:"Succo di carota",emoji:"🥕",cal:30.0,p:0.6,c:6.2,f:0.1},
    {name:"Succo di pomodoro",emoji:"🍅",cal:15.0,p:0.7,c:2.7,f:0.1},
    {name:"Amaranto, seme, cotto (senza aggiunta di grassi e sale)",emoji:"🍽️",cal:119.0,p:5.0,c:18.1,f:2.1},
    {name:"Amaranto, seme, crudo",emoji:"🍽️",cal:376.0,p:15.8,c:56.8,f:7.0},
    {name:"Ananas, crudo",emoji:"🍽️",cal:52.0,p:0.5,c:11.7,f:0.1},
    {name:"Cachi, crudo",emoji:"🍽️",cal:77.0,p:0.9,c:16.0,f:0.3},
    {name:"Couscous (granelli di semola di grano duro precotta), cotto (senza aggiunta di grassi o sale)",emoji:"🍽️",cal:158.0,p:5.0,c:31.0,f:1.0},
    {name:"Fagiolo comuno (tutti tipi), seme mature, cotto (senza aggiunta di grassi e sale)",emoji:"🍽️",cal:111.0,p:7.7,c:14.5,f:0.6},
    {name:"Fagiolo di soia, cotto (senza aggiunta di grassi o sale)",emoji:"🍽️",cal:157.0,p:15.0,c:3.3,f:7.3},
    {name:"Fico, crudo",emoji:"🍽️",cal:71.0,p:1.2,c:13.5,f:0.5},
    {name:"Fiocchi di patate, in polvere con latte e sale (purea istantanea)",emoji:"🥛",cal:365.0,p:11.3,c:65.5,f:5.3},
  ],
  "Verdure": [
    {name:"Broccoli",nameEn:"Broccoli",emoji:"🥦",cal:34,p:2.8,c:7,f:0.4},
    {name:"Spinaci",nameEn:"Spinach",emoji:"🥬",cal:23,p:2.9,c:3.6,f:0.4},
    {name:"Zucchine",nameEn:"Zucchini",emoji:"🥒",cal:17,p:1.2,c:3.1,f:0.3},
    {name:"Pomodori",nameEn:"Tomatoes",emoji:"🍅",cal:18,p:0.9,c:3.9,f:0.2},
    {name:"Insalata mista",nameEn:"Mixed salad",emoji:"🥗",cal:15,p:1.3,c:2.9,f:0.2},
    {name:"Peperoni",nameEn:"Bell peppers",emoji:"🫑",cal:31,p:1,c:6,f:0.3},
    {name:"Carote",nameEn:"Carrots",emoji:"🥕",cal:41,p:0.9,c:10,f:0.2},
    {name:"Asparagi",nameEn:"Asparagus",emoji:"🌿",cal:20,p:2.2,c:3.9,f:0.1},
    {name:"Funghi",nameEn:"Mushrooms",emoji:"🍄",cal:22,p:3.1,c:3.3,f:0.3},
    {name:"Cavolfiore",nameEn:"Cauliflower",emoji:"🥦",cal:25,p:1.9,c:5,f:0.3},
    {name:"Melanzane",nameEn:"Eggplant",emoji:"🍆",cal:25,p:1,c:6,f:0.2},
    {name:"Cetrioli",nameEn:"Cucumbers",emoji:"🥒",cal:16,p:0.7,c:3.6,f:0.1},
    {name:"Basilico, fresco",emoji:"📦",cal:46.0,p:3.1,c:5.1,f:0.8},
    {name:"Broccoli, crudi",emoji:"🥦",cal:39.0,p:3.6,c:3.2,f:0.6},
    {name:"Carciofo, cuore, in scatola, sgocciolato",emoji:"📦",cal:27.0,p:1.8,c:2.3,f:0.5},
    {name:"Cavoli (media), crudi",emoji:"📦",cal:32.0,p:2.2,c:3.3,f:0.5},
    {name:"Cetriolini, sott'aceto",emoji:"📦",cal:14.0,p:0.7,c:2.1,f:0.1},
    {name:"Cipolline, sott'aceto",emoji:"📦",cal:28.0,p:0.9,c:4.9,f:0.2},
    {name:"Concentrato di pomodoro",emoji:"🍅",cal:77.0,p:4.5,c:12.9,f:0.2},
    {name:"Crauti, sott’aceto",emoji:"📦",cal:19.0,p:1.3,c:1.7,f:0.3},
    {name:"Erba cipollina, fresca",emoji:"📦",cal:30.0,p:3.0,c:1.9,f:0.6},
    {name:"Fagiolini verdi, secchi",emoji:"🫘",cal:318.0,p:20.2,c:42.1,f:2.0},
    {name:"Fette di sedano rapa, impanate, preparate",emoji:"📦",cal:139.0,p:4.7,c:15.4,f:5.7},
    {name:"Funghi (media), crudi",emoji:"🍄",cal:26.0,p:3.6,c:1.0,f:0.3},
    {name:"Funghi prataioli, conserva",emoji:"🍄",cal:19.0,p:2.2,c:0.5,f:0.3},
    {name:"Germogli di soia, crudi",emoji:"🫘",cal:55.0,p:5.5,c:4.7,f:1.0},
    {name:"Lattuga (media), crude",emoji:"🥬",cal:17.0,p:1.3,c:1.6,f:0.3},
    {name:"Mais dolce, conserva",emoji:"📦",cal:105.0,p:3.0,c:18.2,f:1.7},
    {name:"Menta, fresca",emoji:"📦",cal:49.0,p:3.8,c:5.3,f:0.7},
    {name:"Pannocchiette di mais, sott'aceto",emoji:"📦",cal:119.0,p:3.4,c:21.0,f:1.4},
    {name:"Piselli, conserva",emoji:"📦",cal:87.0,p:4.8,c:12.8,f:0.8},
    {name:"Piselli e carote, conserva",emoji:"🥕",cal:68.0,p:4.2,c:9.6,f:0.6},
    {name:"Pomodoro, pelato, conserva",emoji:"🍅",cal:22.0,p:1.1,c:3.8,f:0.1},
    {name:"Pomodoro, secco, sott'olio, sgocciolato",emoji:"🍅",cal:187.0,p:4.3,c:13.4,f:11.7},
    {name:"Prezzemolo, fresco",emoji:"📦",cal:58.0,p:3.9,c:7.4,f:0.5},
    {name:"Ratatouille, preparato",emoji:"📦",cal:45.0,p:1.3,c:4.1,f:2.1},
    {name:"Ravanelli, crudi",emoji:"📦",cal:14.0,p:0.9,c:1.5,f:0.1},
    {name:"Rosmarino, fresco",emoji:"📦",cal:62.0,p:0.8,c:7.7,f:2.5},
    {name:"Salvia, fresca",emoji:"📦",cal:59.0,p:1.7,c:6.9,f:2.1},
    {name:"Spinaci alla panna, cotti",emoji:"🥬",cal:65.0,p:2.9,c:4.0,f:3.8},
    {name:"Spinaci, crudi",emoji:"🥬",cal:25.0,p:2.6,c:1.3,f:0.6},
    {name:"Taccole, crude",emoji:"📦",cal:48.0,p:3.8,c:6.4,f:0.3},
    {name:"Timo, fresco",emoji:"📦",cal:52.0,p:1.5,c:7.3,f:1.2},
    {name:"Verdura (media), cotta",emoji:"📦",cal:28.0,p:1.2,c:4.0,f:0.3},
  
    // Banca Dati Svizzera dei Valori Nutritivi
    {name:"Asparago (bianco o verde), al vapore (senza aggiunta di sale)",emoji:"🥗",cal:25.0,p:2.0,c:2.7,f:0.3},
    {name:"Asparago (bianco o verde), crudo",emoji:"🥗",cal:26.0,p:2.2,c:2.8,f:0.3},
    {name:"Asparago, bianco, crudo",emoji:"🥗",cal:26.0,p:2.4,c:2.5,f:0.3},
    {name:"Asparago, verde, crudo",emoji:"🥗",cal:26.0,p:1.9,c:3.1,f:0.3},
    {name:"Broccoli, al vapore (senza aggiunta di sale)",emoji:"🥦",cal:35.0,p:3.3,c:2.9,f:0.5},
    {name:"Carota, al vapore (senza aggiunta di sale)",emoji:"🥕",cal:44.0,p:0.7,c:8.0,f:0.4},
    {name:"Fagiolini verdi secchi, messi a bagno, cotti al vapore (senza aggiunta di sale)",emoji:"🫘",cal:79.0,p:5.1,c:10.5,f:0.5},
    {name:"Fagiolini verdi, al vapore (senza agigunta di sale)",emoji:"🫘",cal:34.0,p:2.0,c:4.4,f:0.2},
    {name:"Fagiolino verde, crudo",emoji:"🫘",cal:32.0,p:1.9,c:4.1,f:0.2},
    {name:"Pomodoro, crudo",emoji:"🍅",cal:21.0,p:0.9,c:3.3,f:0.3},
    {name:"Pomodoro, secco, sott'olio, sgocciolato",emoji:"🍅",cal:187.0,p:4.3,c:13.4,f:11.7},
    {name:"Spinaci, al vapore (senza aggiunta di sale)",emoji:"🥬",cal:31.0,p:3.3,c:1.6,f:0.8},
    {name:"Zucchina, al vapore (senza aggiunta di sale)",emoji:"🥗",cal:18.0,p:1.3,c:1.9,f:0.3},
    {name:"Avocado, crudo",emoji:"🥑",cal:158.0,p:1.6,c:1.2,f:15.1},
    {name:"Broccoli, crudi",emoji:"🥦",cal:39.0,p:3.6,c:3.2,f:0.6},
    {name:"Carota, cruda",emoji:"🥕",cal:42.0,p:0.6,c:7.6,f:0.4},
    {name:"Concentrato di pomodoro",emoji:"🍅",cal:77.0,p:4.5,c:12.9,f:0.2},
    {name:"Edamame (fagioli di soia, immaturi), decorticato, congelato",emoji:"🫘",cal:143.0,p:11.5,c:5.1,f:7.4},
    {name:"Fagiolini verdi, secchi",emoji:"🫘",cal:318.0,p:20.2,c:42.1,f:2.0},
    {name:"Pomodoro, pelato, conserva",emoji:"🍅",cal:22.0,p:1.1,c:3.8,f:0.1},
    {name:"Pomodoro, secco",emoji:"🍅",cal:282.0,p:14.1,c:43.5,f:3.0},
    {name:"Pomodoro, stufato (senza aggiunta di grasso e sale)",emoji:"🍅",cal:26.0,p:1.1,c:4.0,f:0.3},
    {name:"Spinaci alla panna, cotti",emoji:"🥬",cal:65.0,p:2.9,c:4.0,f:3.8},
    {name:"Spinaci, crudi",emoji:"🥬",cal:25.0,p:2.6,c:1.3,f:0.6},
    {name:"Zucchina, cruda",emoji:"🥗",cal:17.0,p:1.2,c:1.8,f:0.3},
    {name:"Zucchina, stufata (senza aggiunta di grassi e sale)",emoji:"🥗",cal:20.0,p:1.5,c:2.2,f:0.3},
    {name:"Aglio, crudo",emoji:"🥗",cal:107.0,p:6.4,c:16.3,f:0.5},
    {name:"Barbabietola, al vapore (senza aggiunta di sale)",emoji:"🥗",cal:56.0,p:2.0,c:10.0,f:0.4},
    {name:"Bietola, al vapore (senza aggiunta di sale)",emoji:"🥗",cal:20.0,p:1.3,c:2.0,f:0.3},
    {name:"Cavolfiore, al vapore (senza aggiunta di sale)",emoji:"🥗",cal:26.0,p:1.8,c:2.1,f:0.7},
    {name:"Cavolfiore, crudo",emoji:"🥗",cal:26.0,p:1.8,c:2.1,f:0.7},
    {name:"Cavolini di Bruxelles, al vapore (senza aggiunta di sale)",emoji:"🥗",cal:37.0,p:3.6,c:3.0,f:0.4},
    {name:"Cavolino di Bruxelles, crudo",emoji:"🥗",cal:41.0,p:4.0,c:3.3,f:0.4},
    {name:"Cavolo bianco, al vapore (senza aggiunta di grasso e sale)",emoji:"🥗",cal:35.0,p:1.3,c:4.4,f:0.6},
    {name:"Cavolo bianco, crudo",emoji:"🥗",cal:36.0,p:1.4,c:4.6,f:0.6},
    {name:"Cavolo cinese, crudo",emoji:"🥗",cal:14.0,p:1.4,c:1.2,f:0.2},
    {name:"Cavolo piuma, crudo",emoji:"🥗",cal:44.0,p:4.3,c:2.5,f:0.9},
    {name:"Cavolo rapa, al vapore (senza aggiunta di sale)",emoji:"🥗",cal:28.0,p:2.0,c:3.9,f:0.2},
    {name:"Cavolo rapa, crudo",emoji:"🥗",cal:27.0,p:1.9,c:3.7,f:0.2},
    {name:"Cavolo rosso, crudo",emoji:"🥗",cal:29.0,p:1.1,c:4.3,f:0.2},
    {name:"Cetriolo, crudo",emoji:"🥗",cal:12.0,p:0.7,c:1.8,f:0.0},
    {name:"Champignon, crudo",emoji:"🥗",cal:25.0,p:3.7,c:1.1,f:0.3},
    {name:"Cicoria belga, al vapore (senza aggiunta di sale)",emoji:"🥗",cal:20.0,p:1.1,c:2.8,f:0.2},
    {name:"Crescione, crudo",emoji:"🥗",cal:19.0,p:1.7,c:1.9,f:0.2},
    {name:"Finocchio, al vapore (senza aggiunta di sale)",emoji:"🥗",cal:22.0,p:1.0,c:2.5,f:0.4},
    {name:"Finocchio, crudo",emoji:"🥗",cal:23.0,p:1.0,c:2.6,f:0.4},
    {name:"Formentino, crudo",emoji:"🥗",cal:18.0,p:2.0,c:0.8,f:0.2},
    {name:"Fungo porcino, crudo",emoji:"🍄",cal:39.0,p:5.4,c:0.5,f:0.4},
    {name:"Gallinaccio, crudo",emoji:"🍗",cal:24.0,p:2.3,c:0.2,f:0.5},
    {name:"Mais dolce, crudo",emoji:"🥗",cal:85.0,p:3.2,c:12.6,f:1.8},
    {name:"Melanzana, al vapore (senza aggiunta di sale)",emoji:"🍎",cal:21.0,p:1.1,c:2.4,f:0.1},
    {name:"Peperone rosso, crudo",emoji:"🫑",cal:32.0,p:0.9,c:5.9,f:0.1},
    {name:"Peperone verde, crudo",emoji:"🫑",cal:22.0,p:0.9,c:3.0,f:0.3},
    {name:"Piselli, verdi, al vapore (senza aggiunta sale)",emoji:"🥗",cal:99.0,p:7.6,c:12.5,f:0.8},
    {name:"Pisello, crudo",emoji:"🥗",cal:90.0,p:6.9,c:11.3,f:0.7},
    {name:"Porro, crudo",emoji:"🥗",cal:32.0,p:2.0,c:4.0,f:0.2},
    {name:"Rafano, crudo",emoji:"🥗",cal:24.0,p:1.0,c:3.9,f:0.1},
    {name:"Scalogno, crudo",emoji:"🥗",cal:66.0,p:1.8,c:12.2,f:0.0},
    {name:"Scorzonera, al vapore (senza aggiunta di sale)",emoji:"🥗",cal:56.0,p:1.5,c:2.2,f:0.3},
    {name:"Sedano rapa, al vapore (senza aggiunta di sale)",emoji:"🥗",cal:32.0,p:1.4,c:4.0,f:0.3},
  ],
  "Grassi": [
    {name:"Olio d'oliva",nameEn:"Olive oil",emoji:"🫒",cal:884,p:0,c:0,f:100,maxQty:30},
    {name:"Avocado",nameEn:"Avocado",emoji:"🥑",cal:160,p:2,c:9,f:15,maxQty:150},
    {name:"Mandorle",nameEn:"Almonds",emoji:"🌰",cal:579,p:21,c:22,f:50,maxQty:50},
    {name:"Noci",nameEn:"Walnuts",emoji:"🥜",cal:654,p:15,c:14,f:65,maxQty:40},
    {name:"Burro di arachidi",nameEn:"Peanut butter",emoji:"🥜",cal:588,p:25,c:20,f:50,maxQty:40},
    {name:"Semi di chia",nameEn:"Chia seeds",emoji:"🌱",cal:486,p:17,c:42,f:31,maxQty:30},
    {name:"Semi di lino",nameEn:"Flax seeds",emoji:"🌱",cal:534,p:18,c:29,f:42,maxQty:20},
    {name:"Nocciole",nameEn:"Hazelnuts",emoji:"🌰",cal:628,p:15,c:17,f:61,maxQty:40},
    {name:"Anacardi",emoji:"📦",cal:619.0,p:21.5,c:23.2,f:48.1},
    {name:"Arachide",emoji:"🥜",cal:623.0,p:26.1,c:14.8,f:49.1},
    {name:"Burro da cucina",emoji:"📦",cal:745.0,p:0.5,c:0.7,f:82.2},
    {name:"Burro del caseificio",emoji:"📦",cal:747.0,p:0.4,c:0.6,f:82.5},
    {name:"Burro per arrostire",emoji:"📦",cal:885.0,p:0.1,c:0.0,f:98.3},
    {name:"Burro semigrasso",emoji:"🌱",cal:391.0,p:4.8,c:3.5,f:39.8},
    {name:"Burro speciale",emoji:"📦",cal:746.0,p:0.7,c:0.7,f:82.3},
    {name:"Castagne, crude",emoji:"📦",cal:210.0,p:2.9,c:41.2,f:1.9},
    {name:"Doppia panna, pastorizzata",emoji:"📦",cal:468.0,p:1.9,c:2.7,f:50.0},
    {name:"Espresso, con cremino, non zuccherato",emoji:"📦",cal:28.0,p:0.5,c:0.8,f:2.5},
    {name:"Grasso di cocco",emoji:"📦",cal:894.0,p:0.8,c:0.0,f:99.0},
    {name:"Grasso di palma - Olio di palma",emoji:"🫒",cal:899.0,p:0.0,c:0.0,f:99.9},
    {name:"Latte di cocco",emoji:"🥛",cal:214.0,p:2.4,c:3.1,f:21.3},
    {name:"Limonata con aromi, zuccherata",emoji:"📦",cal:38.0,p:0.0,c:9.5,f:0.0},
    {name:"Margarina, 35 - 40 % di grasso",emoji:"📦",cal:357.0,p:0.3,c:1.1,f:39.0},
    {name:"Margarina, senza burro, 70 - 80 % di grasso",emoji:"📦",cal:696.0,p:0.5,c:0.2,f:77.0},
    {name:"Noce del Brasile",emoji:"🌰",cal:698.0,p:17.0,c:4.2,f:66.5},
    {name:"Noce di cocco",emoji:"🌰",cal:384.0,p:4.6,c:4.8,f:36.5},
    {name:"Olio di arachidi",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di canapa",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di cartamo",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di colza",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di colza HOLL (high oleic, low linolenic)",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di germi di grano",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di girasole HO, raffinato",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di nocciole",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di noce",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di semi di girasole",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di semi di lino, spremuto a freddo",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di semi di mais",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di semi di zucca",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di sesamo",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di soia",emoji:"🫘",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di vinaccioli",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olive, nere",emoji:"📦",cal:176.0,p:1.4,c:0.8,f:17.2},
    {name:"Panna acida, semigrassa",emoji:"🌱",cal:173.0,p:2.7,c:3.2,f:16.6},
    {name:"Panna acidula",emoji:"📦",cal:336.0,p:2.4,c:2.8,f:35.0},
    {name:"Panna da caffè UHT",emoji:"📦",cal:161.0,p:2.6,c:3.8,f:15.0},
    {name:"Panna intera, pastorizzata",emoji:"📦",cal:334.0,p:2.0,c:3.1,f:34.8},
    {name:"Panna intera, UHT",emoji:"📦",cal:335.0,p:2.0,c:3.1,f:34.9},
    {name:"Panna (media)",emoji:"📦",cal:279.0,p:2.2,c:3.3,f:28.6},
    {name:"Panna semigrassa, pastorizzata",emoji:"🌱",cal:274.0,p:2.3,c:3.3,f:27.9},
    {name:"Panna semigrassa, UHT",emoji:"🌱",cal:251.0,p:2.5,c:3.7,f:25.1},
    {name:"Pinoli",emoji:"🌰",cal:688.0,p:16.5,c:13.0,f:61.9},
    {name:"Pistacchi",emoji:"📦",cal:621.0,p:25.5,c:12.3,f:50.3},
    {name:"Semi di girasole",emoji:"🌱",cal:621.0,p:25.1,c:3.6,f:54.5},
    {name:"Semi di sesamo, decorticati",emoji:"🌱",cal:660.0,p:26.8,c:4.6,f:57.4},
    {name:"Semi di sesamo, non decorticati",emoji:"🌱",cal:619.0,p:23.1,c:4.0,f:53.8},
    {name:"Semi di zucca",emoji:"🌱",cal:615.0,p:35.6,c:4.7,f:49.1},
    {name:"Semi e noci (media), senza aggiunta di sale",emoji:"🌱",cal:618.0,p:20.8,c:9.4,f:52.9},
    {name:"Té freddo, zuccherato",emoji:"📦",cal:30.0,p:0.0,c:7.5,f:0.0},
  
    // Banca Dati Svizzera dei Valori Nutritivi
    {name:"Salsa per insalate con yogurt (senza olio)",emoji:"🫙",cal:58.0,p:3.2,c:4.5,f:3.0},
    {name:"Bevanda al cacao, con zucchero, preparata (con latte)",emoji:"🥛",cal:81.0,p:3.4,c:10.0,f:3.0},
    {name:"Grasso di palma - Olio di palma",emoji:"🫒",cal:899.0,p:0.0,c:0.0,f:99.9},
    {name:"Latte di cocco",emoji:"🥛",cal:214.0,p:2.4,c:3.1,f:21.3},
    {name:"Maionese, con olio di colza, fatta in casa",emoji:"🫒",cal:792.0,p:2.4,c:0.1,f:86.9},
    {name:"Mandorle, tostate e salate",emoji:"🌰",cal:649.0,p:25.6,c:7.2,f:55.2},
    {name:"Mandorle, tostate senza grasso e salate",emoji:"🌰",cal:637.0,p:25.4,c:10.1,f:52.5},
    {name:"Olio di arachidi",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di canapa",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di cartamo",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di colza",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di colza HOLL (high oleic, low linolenic)",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di germi di grano",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di girasole HO, raffinato",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di nocciole",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di noce",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di semi di girasole",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di semi di lino, spremuto a freddo",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di semi di mais",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di semi di zucca",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di sesamo",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di soia",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Olio di vinaccioli",emoji:"🫒",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Salsa per insalata \"aceto-olio\", fatta in casa (con olio di colza)",emoji:"🫒",cal:287.0,p:0.7,c:2.5,f:30.2},
    {name:"Salsa per insalata francese, fatta in casa (con olio di colza)",emoji:"🫒",cal:377.0,p:0.9,c:1.3,f:40.8},
    {name:"Salsa per insalata italiana, fatta in casa (con olio d'oliva)",emoji:"🫒",cal:421.0,p:0.3,c:1.0,f:46.1},
    {name:"Salsa per insalata, con yogurt, fatta in casa",emoji:"🫙",cal:279.0,p:2.2,c:8.0,f:26.5},
    {name:"Semi e noci (media), senza aggiunta di sale",emoji:"🥜",cal:618.0,p:20.8,c:9.4,f:52.9},
    {name:"Vinaigrette (con olio di colza)",emoji:"🫒",cal:232.0,p:4.2,c:1.8,f:22.9},
    {name:"Anacardi",emoji:"🥜",cal:619.0,p:21.5,c:23.2,f:48.1},
    {name:"Arachide",emoji:"🥜",cal:623.0,p:26.1,c:14.8,f:49.1},
    {name:"Bevanda gassata a base di cola zuccherata",emoji:"🍽️",cal:40.0,p:0.0,c:10.0,f:0.0},
    {name:"Birra ai cinque cereali",emoji:"🌾",cal:40.0,p:0.6,c:2.0,f:0.0},
    {name:"Birra panaché (media)",emoji:"🍽️",cal:39.0,p:0.2,c:7.4,f:0.0},
    {name:"Birra, analcolica",emoji:"🍽️",cal:23.0,p:0.4,c:4.9,f:0.0},
    {name:"Burro da cucina",emoji:"🥜",cal:745.0,p:0.5,c:0.7,f:82.2},
    {name:"Burro del caseificio",emoji:"🥜",cal:747.0,p:0.4,c:0.6,f:82.5},
    {name:"Burro di cacao",emoji:"🥜",cal:900.0,p:0.0,c:0.0,f:100.0},
    {name:"Burro per arrostire",emoji:"🥜",cal:885.0,p:0.1,c:0.0,f:98.3},
    {name:"Burro semigrasso",emoji:"🥜",cal:391.0,p:4.8,c:3.5,f:39.8},
  ],
  "Latticini": [
    {name:"Latte intero",nameEn:"Whole milk",emoji:"🥛",cal:61,p:3.2,c:4.8,f:3.3,unit:"ml",maxQty:300},
    {name:"Latte scremato",nameEn:"Skim milk",emoji:"🥛",cal:35,p:3.4,c:4.9,f:0.1,unit:"ml",maxQty:300},
    {name:"Yogurt bianco intero",nameEn:"Plain whole yogurt",emoji:"🫙",cal:61,p:3.5,c:4.7,f:3.3,maxQty:200},
    {name:"Mozzarella",nameEn:"Mozzarella",emoji:"🧀",cal:253,p:17,c:2.7,f:20,maxQty:150},
    {name:"Parmigiano",nameEn:"Parmesan",emoji:"🧀",cal:392,p:36,c:0,f:26,maxQty:50},
    {name:"Fiocchi di latte",nameEn:"Cottage cheese",emoji:"🥛",cal:98,p:11,c:3.4,f:4.5,maxQty:200},
    {name:"Formaggio Brie, alla panna",emoji:"🧀",cal:342.0,p:17.7,c:0.0,f:30.0},
    {name:"Formaggio Brie, grasso",emoji:"🧀",cal:298.0,p:21.4,c:0.0,f:23.5},
    {name:"Formaggio Camembert, alla panna",emoji:"🧀",cal:355.0,p:17.1,c:0.0,f:31.7},
    {name:"Formaggio Camembert, grasso",emoji:"🧀",cal:297.0,p:20.8,c:0.0,f:23.7},
    {name:"Formaggio Camembert, semigrasso",emoji:"🧀",cal:188.0,p:24.4,c:0.0,f:10.0},
    {name:"Formaggio delle alpi di Berna",emoji:"🧀",cal:453.0,p:27.1,c:0.0,f:38.3},
    {name:"Formaggio fresco, alla doppia panna",emoji:"🧀",cal:351.0,p:11.1,c:4.5,f:32.1},
    {name:"Formaggio fresco granulato, al naturale",emoji:"🧀",cal:100.0,p:12.4,c:2.4,f:4.5},
    {name:"Formaggio fuso a fette, alla panna",emoji:"🧀",cal:327.0,p:14.3,c:0.0,f:30.0},
    {name:"Formaggio fuso a fette, di latte intero",emoji:"🥛",cal:316.0,p:22.8,c:0.0,f:25.0},
    {name:"Formaggio fuso a fette, un quarto grasso",emoji:"🧀",cal:155.0,p:19.4,c:0.0,f:8.6},
    {name:"Formaggio fuso da spalmare, alla panna",emoji:"🧀",cal:316.0,p:12.9,c:0.0,f:29.4},
    {name:"Formaggio fuso da spalmare, di latte intero",emoji:"🥛",cal:247.0,p:14.1,c:0.0,f:21.2},
    {name:"Formaggio fuso da spalmare, un quarto grasso",emoji:"🧀",cal:150.0,p:16.4,c:0.0,f:9.3},
    {name:"Formaggio grattugiato",emoji:"🧀",cal:406.0,p:29.3,c:0.0,f:32.1},
    {name:"Formaggio in salamoia (di latte di mucca)",emoji:"🥛",cal:256.0,p:16.0,c:1.4,f:20.7},
    {name:"Formaggio in salamoia (di latte di pecora e capra)",emoji:"🥛",cal:281.0,p:14.8,c:0.7,f:24.3},
    {name:"Formaggio Limburger/Münster",emoji:"🧀",cal:273.0,p:20.0,c:0.0,f:21.4},
    {name:"Formaggio maturato a pasta molle, alla panna",emoji:"🧀",cal:347.0,p:17.4,c:0.0,f:30.9},
    {name:"Formaggio maturato a pasta molle, grasso",emoji:"🧀",cal:296.0,p:20.6,c:0.0,f:23.7},
    {name:"Formaggio morbido, alla doppia panna",emoji:"🧀",cal:376.0,p:9.7,c:0.0,f:37.5},
    {name:"Formaggio Reblochon",emoji:"🧀",cal:307.0,p:19.9,c:0.0,f:25.2},
    {name:"Formaggio Roquefort",emoji:"🧀",cal:382.0,p:19.2,c:0.0,f:33.9},
    {name:"Formaggio St. Paulin",emoji:"🧀",cal:325.0,p:21.8,c:0.0,f:26.4},
    {name:"Formaggio Tête de Moine",emoji:"🧀",cal:417.0,p:24.2,c:0.0,f:35.5},
    {name:"Gorgonzola",emoji:"📦",cal:357.0,p:19.0,c:0.1,f:31.2},
    {name:"Latte condensato, non zuccherato",emoji:"🥛",cal:131.0,p:6.4,c:9.3,f:7.6},
    {name:"Latte condensato, zuccherato",emoji:"🥛",cal:339.0,p:8.0,c:54.3,f:10.0},
    {name:"Latte di capra",emoji:"🥛",cal:57.0,p:2.8,c:4.2,f:3.2},
    {name:"Latte di  pecora",emoji:"🥛",cal:105.0,p:5.5,c:4.7,f:7.1},
    {name:"Latte intero, in polvere",emoji:"🥛",cal:480.0,p:24.7,c:35.1,f:26.2},
    {name:"Latte intero, pastorizzato",emoji:"🥛",cal:68.0,p:3.2,c:4.7,f:4.0},
    {name:"Latte intero, standardizzato, 3.5 % di grasso, UHT",emoji:"🥛",cal:65.0,p:3.2,c:5.0,f:3.5},
    {name:"Latte intero, UHT",emoji:"🥛",cal:68.0,p:3.2,c:4.6,f:4.1},
    {name:"Latte macchiato, non zuccherato",emoji:"🥛",cal:54.0,p:2.5,c:3.7,f:3.2},
    {name:"Latte (media)",emoji:"🥛",cal:59.0,p:3.2,c:4.8,f:2.9},
    {name:"Latte parzialmente scremato, pastorizzato",emoji:"🥛",cal:56.0,p:3.1,c:4.7,f:2.8},
    {name:"Latte parzialmente scremato, UHT",emoji:"🥛",cal:57.0,p:3.3,c:4.6,f:2.8},
    {name:"Latte scremato, in polvere",emoji:"🥛",cal:348.0,p:34.3,c:50.5,f:1.0},
    {name:"Latte scremato, UHT",emoji:"🥛",cal:33.0,p:3.3,c:4.7,f:0.1},
    {name:"Latte, semiscremato 1.5% di gasso, UHT",emoji:"🥛",cal:46.0,p:3.2,c:4.8,f:1.5},
    {name:"Latticello",emoji:"📦",cal:34.0,p:3.4,c:4.0,f:0.5},
    {name:"Mascarpone",emoji:"📦",cal:435.0,p:4.5,c:4.1,f:44.5},
    {name:"Quark, alla frutta",emoji:"📦",cal:112.0,p:8.4,c:14.1,f:2.4},
    {name:"Quark, natuale, semigrasso",emoji:"🌱",cal:99.0,p:9.4,c:4.1,f:5.0},
    {name:"Quark, naturale, alla panna",emoji:"📦",cal:183.0,p:6.9,c:3.7,f:15.6},
    {name:"Quark, naturale, magro",emoji:"📦",cal:61.0,p:10.6,c:4.2,f:0.2},
    {name:"Ricotta svizzera",emoji:"🧀",cal:122.0,p:10.9,c:3.3,f:7.2},
    {name:"Siero di latte, dolce",emoji:"🥛",cal:24.0,p:0.8,c:4.7,f:0.2},
    {name:"Tomino",emoji:"📦",cal:284.0,p:20.3,c:0.0,f:22.5},
    {name:"Yogurt, al caffè",emoji:"🫙",cal:99.0,p:3.7,c:14.1,f:3.1},
    {name:"Yogurt, al caffè bio",emoji:"🫙",cal:95.0,p:3.4,c:13.1,f:3.3},
    {name:"Yogurt, alla fragola",emoji:"🫙",cal:101.0,p:3.4,c:15.2,f:2.7},
    {name:"Yogurt, alla vaniglia",emoji:"🫙",cal:98.0,p:3.7,c:14.0,f:3.0},
    {name:"Yogurt, alle nocciole",emoji:"🫙",cal:119.0,p:3.8,c:15.0,f:4.6},
    {name:"Yogurt, naturale",emoji:"🫙",cal:66.0,p:3.9,c:4.5,f:3.6},
    {name:"Yogurt, naturale magro",emoji:"🫙",cal:42.0,p:4.7,c:5.5,f:0.1},
    {name:"Yogurt zuccherato (media)",emoji:"🫙",cal:105.0,p:3.7,c:14.7,f:3.4},
  
    // Banca Dati Svizzera dei Valori Nutritivi
    {name:"Formaggio a pasta dura e semi dura, grasso (in media)",emoji:"🧀",cal:397.0,p:26.6,c:0.0,f:32.1},
    {name:"Formaggio a pasta molle (media senza prodotti sgrassati)",emoji:"🧀",cal:327.0,p:19.4,c:0.0,f:27.7},
    {name:"Formaggio di capra, a pasta molle",emoji:"🧀",cal:283.0,p:18.4,c:0.0,f:23.3},
    {name:"Formaggio maturato a pasta molle, alla panna",emoji:"🧀",cal:347.0,p:17.4,c:0.0,f:30.9},
    {name:"Formaggio maturato a pasta molle, grasso",emoji:"🧀",cal:296.0,p:20.6,c:0.0,f:23.7},
    {name:"Caffelatte (scuro), non zuccherato",emoji:"🥛",cal:16.0,p:0.7,c:1.2,f:0.9},
    {name:"Caffelatte, chiaro, non zuccherato",emoji:"🥛",cal:22.0,p:1.0,c:1.6,f:1.2},
    {name:"Caffelatte, non zuccherato",emoji:"🥛",cal:19.0,p:0.9,c:1.4,f:1.1},
    {name:"Formaggio Tilsiter di latte crudo, grasso",emoji:"🥛",cal:376.0,p:25.6,c:0.0,f:30.2},
    {name:"Formaggio fuso a fette, di latte intero",emoji:"🥛",cal:316.0,p:22.8,c:0.0,f:25.0},
    {name:"Formaggio fuso da spalmare, di latte intero",emoji:"🥛",cal:247.0,p:14.1,c:0.0,f:21.2},
    {name:"Formaggio in salamoia (di latte di mucca)",emoji:"🥛",cal:256.0,p:16.0,c:1.4,f:20.7},
    {name:"Formaggio in salamoia (di latte di pecora e capra)",emoji:"🥛",cal:281.0,p:14.8,c:0.7,f:24.3},
    {name:"Latte (media)",emoji:"🥛",cal:59.0,p:3.2,c:4.8,f:2.9},
    {name:"Latte condensato, non zuccherato",emoji:"🥛",cal:131.0,p:6.4,c:9.3,f:7.6},
    {name:"Latte condensato, zuccherato",emoji:"🥛",cal:339.0,p:8.0,c:54.3,f:10.0},
    {name:"Latte di  pecora",emoji:"🥛",cal:105.0,p:5.5,c:4.7,f:7.1},
    {name:"Latte di capra",emoji:"🥛",cal:57.0,p:2.8,c:4.2,f:3.2},
    {name:"Latte intero, UHT",emoji:"🥛",cal:68.0,p:3.2,c:4.6,f:4.1},
    {name:"Latte intero, in polvere",emoji:"🥛",cal:480.0,p:24.7,c:35.1,f:26.2},
    {name:"Latte intero, pastorizzato",emoji:"🥛",cal:68.0,p:3.2,c:4.7,f:4.0},
    {name:"Latte intero, standardizzato, 3.5 % di grasso, UHT",emoji:"🥛",cal:65.0,p:3.2,c:5.0,f:3.5},
    {name:"Latte macchiato, non zuccherato",emoji:"🥛",cal:54.0,p:2.5,c:3.7,f:3.2},
    {name:"Latte parzialmente scremato, UHT",emoji:"🥛",cal:57.0,p:3.3,c:4.6,f:2.8},
    {name:"Latte parzialmente scremato, pastorizzato",emoji:"🥛",cal:56.0,p:3.1,c:4.7,f:2.8},
    {name:"Latte scremato, UHT",emoji:"🥛",cal:33.0,p:3.3,c:4.7,f:0.1},
    {name:"Latte scremato, in polvere",emoji:"🥛",cal:348.0,p:34.3,c:50.5,f:1.0},
    {name:"Latte, semiscremato 1.5% di gasso, UHT",emoji:"🥛",cal:46.0,p:3.2,c:4.8,f:1.5},
    {name:"Ricotta svizzera",emoji:"🧀",cal:122.0,p:10.9,c:3.3,f:7.2},
    {name:"Siero di latte, dolce",emoji:"🥛",cal:24.0,p:0.8,c:4.7,f:0.2},
    {name:"Sostituto del formaggio a base di olio di cocco e amido",emoji:"🧀",cal:272.0,p:0.0,c:21.2,f:20.1},
    {name:"Sostituto dello yogurt, a base di cocco, con frutta o aromi, con zucchero",emoji:"🫙",cal:107.0,p:0.7,c:12.3,f:5.9},
    {name:"Sostituto dello yogurt, a base di cocco, naturale",emoji:"🫙",cal:92.0,p:0.7,c:5.0,f:7.6},
    {name:"Sostituto dello yogurt, a base di mandorla, con frutta o aromi, con zucchero",emoji:"🫙",cal:99.0,p:2.3,c:10.3,f:5.4},
    {name:"Sostituto dello yogurt, a base di mandorla, naturale",emoji:"🫙",cal:60.0,p:1.3,c:4.8,f:4.0},
    {name:"Sostituto dello yogurt, a base di soia, con frutta o aromi, con zucchero",emoji:"🫙",cal:76.0,p:3.6,c:11.1,f:1.7},
    {name:"Sostituto dello yogurt, a base di soia, con frutta o aromi, con zucchero, arricchito di calcio e vitamine",emoji:"🫙",cal:85.0,p:3.0,c:12.9,f:2.3},
    {name:"Sostituto dello yogurt, a base di soia, naturale",emoji:"🫙",cal:43.0,p:4.1,c:2.1,f:1.9},
    {name:"Sostituto dello yogurt, a base di soia, naturale, arricchito di calcio e vitamine",emoji:"🫙",cal:40.0,p:3.9,c:1.1,f:2.1},
    {name:"Yogurt alla frutta, magro con edulcoranti",emoji:"🫙",cal:49.0,p:4.5,c:7.0,f:0.1},
  ],
};
// ALL_FOODS iniziale dal bundle (fallback offline)
const BUNDLE_FOODS = Object.values(FOODS).flat();
// ALL_FOODS è dinamico: si aggiorna con i dati da Supabase
let ALL_FOODS = BUNDLE_FOODS;
const findFood = n => ALL_FOODS.find(f => f.name === n);

// Sincronizza il database alimenti da Supabase
// - Prima verifica cache localStorage (TTL 24h)
// - Se scaduta o mancante, scarica da Supabase
// - Aggiorna ALL_FOODS con i dati freschi
const FOODS_CACHE_KEY = 'nc2-foods-cache';
const FOODS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 ore

async function syncFoodsFromSupabase() {
  try {
    // Controlla cache
    const cached = LS.g(FOODS_CACHE_KEY);
    const cacheValid = cached && cached.ts && (Date.now() - cached.ts) < FOODS_CACHE_TTL && cached.foods?.length > 100 && cached.foods.some(f => f.nameEn);
    if (cacheValid) {
      ALL_FOODS = cached.foods;
      return cached.foods;
    }
    // Scarica da Supabase (tutte le righe, paginando se necessario)
    let allRows = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from('foods')
        .select('name,emoji,cal,p,c,f,unit,max_qty,category,barcode')
        .range(from, from + pageSize - 1);
      if (error || !data?.length) break;
      allRows = allRows.concat(data);
      if (data.length < pageSize) break;
      from += pageSize;
    }
    if (allRows.length > 0) {
      // Normalizza i campi dal DB al formato interno della app
      const normalized = allRows.map(r => {
        const bundle = BUNDLE_FOODS.find(f => f.name === r.name);
        return {
          name: r.name,
          emoji: r.emoji || '🍽️',
          cal: parseFloat(r.cal) || 0,
          p: parseFloat(r.p) || 0,
          c: parseFloat(r.c) || 0,
          f: parseFloat(r.f) || 0,
          unit: r.unit || undefined,
          maxQty: r.max_qty || undefined,
          barcode: r.barcode || undefined,
          nameEn: bundle?.nameEn || undefined,
        };
      });
      ALL_FOODS = normalized;
      LS.s(FOODS_CACHE_KEY, { ts: Date.now(), foods: normalized });
      return normalized;
    }
  } catch (e) {
    console.warn('syncFoodsFromSupabase error:', e.message);
  }
  return ALL_FOODS;
}

// Salva un nuovo alimento su Supabase (contributo utente)
// Evita duplicati controllando il nome
async function saveFoodToSupabase(food, userId) {
  if (!food?.name || !food?.cal) return;
  try {
    await supabase.from('foods').insert({
      name: food.name,
      emoji: food.emoji || '🍽️',
      cal: food.cal,
      p: food.p || 0,
      c: food.c || 0,
      f: food.f || 0,
      unit: food.unit || null,
      max_qty: food.maxQty || null,
      barcode: food.barcode || null,
      category: food.category || 'Proteine',
      source: food.source || 'user',
      created_by: userId || null,
    });
    // Invalida la cache per forzare sync alla prossima apertura
    const cached = LS.g(FOODS_CACHE_KEY);
    if (cached) LS.s(FOODS_CACHE_KEY, { ...cached, ts: 0 });
  } catch { /* ignora errori duplicati */ }
}

// EXTERNAL APIs
const NUTRISCORE_COLOR = {a:"#1a7c3e",b:"#6aaa1e",c:"#f7c84e",d:"#f08c1f",e:"#e63312"};
function NutriScoreBadge({score}) {
  if(!score) return null;
  const s=score.toLowerCase();
  const color=NUTRISCORE_COLOR[s]||C.mid;
  return (
    <div style={{display:"inline-flex",alignItems:"center",gap:3,background:color+"22",border:`1px solid ${color}44`,borderRadius:6,padding:"2px 7px"}}>
      <span style={{fontSize:9,fontWeight:700,color,letterSpacing:.5,textTransform:"uppercase"}}>Nutri-Score</span>
      <span style={{fontSize:13,fontWeight:900,color}}>{s.toUpperCase()}</span>
    </div>
  );
}
function parseOFF(p) {
  if (!p) return null;
  const n = p.nutriments || {};
  const kcal = n["energy-kcal_100g"] || (n["energy_100g"] ? Math.round(n["energy_100g"]/4.184) : 0);
  if (!kcal) return null;
  // Priorità: nome italiano > nome generico > nome inglese
  const name = (p.product_name_it || p.product_name || p.product_name_en || "").trim().slice(0,60);
  if (!name) return null;
  const nutriscore = p.nutriscore_grade || p.nutrition_grade_fr || null;
  return { name, emoji:"📦", cal:Math.round(kcal*10)/10, p:Math.round((n["proteins_100g"]||0)*10)/10, c:Math.round((n["carbohydrates_100g"]||0)*10)/10, f:Math.round((n["fat_100g"]||0)*10)/10, brand:p.brands||"", barcode:p.code||"", nutriscore, source:"off" };
}
async function lookupBarcode(code) {
  try {
    const res = await fetch(`${API_BASE}/api/search-foods?type=barcode&code=${encodeURIComponent(code)}`);
    const d = await res.json();
    return d.status === 1 ? parseOFF(d.product) : null;
  } catch { return null; }
}
async function searchOFFText(q) {
  try {
    const lang = localStorage.getItem("nc2-lang") || "it";
    const res = await fetch(`${API_BASE}/api/search-foods?type=text&q=${encodeURIComponent(q)}&lang=${lang}`);
    if (!res.ok) return [];
    const d = await res.json();
    const products = d.products || [];
    return products
      .map(p => parseOFF(p))
      .filter(Boolean)
      .slice(0, 12);
  } catch { return []; }
}
async function searchFoodsOnline(q) {
  // Lancia OFF e USDA in parallelo, unisce i risultati
  const [off, usda] = await Promise.allSettled([searchOFFText(q), searchUSDA(q)]);
  const offRes = off.status === "fulfilled" ? off.value : [];
  const usdaRes = usda.status === "fulfilled" ? usda.value : [];
  // OFF ha priorità: deduplica per nome
  const seen = new Set();
  return [...offRes, ...usdaRes].filter(f => {
    if (seen.has(f.name)) return false;
    seen.add(f.name);
    return true;
  });
}
async function searchUSDA(q) {
  if (!USDA_K) return [];
  try {
    const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(q)}&api_key=${USDA_K}&pageSize=12&dataType=Foundation,SR%20Legacy`);
    if (res.status === 429 || res.status === 403) return [];
    const d = await res.json();
    if (d.error) return [];
    return (d.foods||[]).map(f => {
      const nu = f.foodNutrients||[];
      const g = k => nu.find(n=>n.nutrientName?.toLowerCase().includes(k))?.value||0;
      const cal = g("energy");
      if (!cal) return null;
      return { name:(f.description||"").slice(0,60), emoji:"🔬", cal:Math.round(cal*10)/10, p:Math.round(g("protein")*10)/10, c:Math.round(g("carbohydrate")*10)/10, f:Math.round(g("total lipid")*10)/10, brand:f.brandName||"", source:"usda" };
    }).filter(Boolean).slice(0,10);
  } catch { return []; }
}

// NUTRITION MATH
const ACTIVITY_LEVELS = [
  {labelIt:"Sedentario",labelEn:"Sedentary",subIt:"Poco o nessun movimento",subEn:"Little or no exercise",val:1.2},
  {labelIt:"Leggermente attivo",labelEn:"Lightly active",subIt:"1-2 allenamenti a settimana",subEn:"1-2 workouts per week",val:1.375},
  {labelIt:"Moderatamente attivo",labelEn:"Moderately active",subIt:"3-4 allenamenti a settimana",subEn:"3-4 workouts per week",val:1.55},
  {labelIt:"Molto attivo",labelEn:"Very active",subIt:"5-6 allenamenti a settimana",subEn:"5-6 workouts per week",val:1.725},
  {labelIt:"Atleta",labelEn:"Athlete",subIt:"Doppia seduta o lavoro fisico",subEn:"Twice daily or physical work",val:1.9},
];
const GOALS = [
  {labelIt:"Dimagrire",labelEn:"Lose fat",subIt:"Deficit controllato, massima perdita di grasso",subEn:"Controlled deficit, maximum fat loss",val:"lose",icon:"📉",calAdj:-400,pCoef:2.2,fCoef:0.8,color:C.red},
  {labelIt:"Ricomposizione",labelEn:"Recomposition",subIt:"Perdi grasso e costruisci muscolo",subEn:"Lose fat and build muscle",val:"recomp",icon:"⚖️",calAdj:-150,pCoef:2.4,fCoef:1.0,color:C.blu},
  {labelIt:"Massa magra",labelEn:"Build muscle",subIt:"Surplus pulito per crescita muscolare",subEn:"Clean surplus for muscle growth",val:"gain",icon:"📈",calAdj:300,pCoef:2.0,fCoef:1.0,color:C.acc},
];

// Interpreta grasso viscerale (scala Tanita 1-59)
function viscFatLevel(vf) {
  if(!vf||vf<=0) return "unknown";
  if(vf<=9)  return "normal";
  if(vf<=14) return "high";
  return "very_high";
}

function calcMacros(profile) {
  const w=parseFloat(profile.weight), h=parseFloat(profile.height), a=parseInt(profile.age);
  if (!w||!h||!a) return null;

  // ── BIA DATA ──────────────────────────────────────────────────────────────
  const bf    = parseFloat(profile.bodyFat)||0;
  const fmKg  = parseFloat(profile.bia_fm)||0;       // massa grassa kg
  const vf    = parseFloat(profile.bia_vf)||0;       // grasso viscerale
  const bmrBia= parseFloat(profile.bia_bmr)||0;      // BMR dalla BIA
  const ffmKg = parseFloat(profile.bia_ffm)||0;      // peso senza grasso kg
  const scFat = parseFloat(profile.bia_sc_fat)||0;   // grasso sottocutaneo %
  const smi   = parseFloat(profile.bia_smi)||0;      // Skeletal Muscle Index
  const whr   = parseFloat(profile.bia_whr)||0;      // Waist-Hip Ratio
  const smmKg = parseFloat(profile.bia_smm)||0;      // peso muscolo-scheletrico kg

  const hasBia = fmKg>0 || ffmKg>0 || bmrBia>0 || smmKg>0;

  // ── LBM (Lean Body Mass) ─────────────────────────────────────────────────
  let lbm;
  if(ffmKg>0)        lbm=ffmKg;               // BIA diretta: più precisa
  else if(fmKg>0)    lbm=Math.max(1,w-fmKg);  // BIA: peso - massa grassa
  else if(bf>0)      lbm=w*(1-bf/100);        // calcolo da % grasso
  else               lbm=w;                    // fallback

  // ── BMR ──────────────────────────────────────────────────────────────────
  let bmr;
  if(bmrBia>0) {
    // BIA fornisce BMR diretto — lo usiamo come base
    bmr = bmrBia;
  } else if(hasBia && smmKg>0) {
    // Formula potenziata: tessuto muscolare scheletrico (13 kcal/kg/die)
    // + organi/tessuto magro rimanente (7 kcal/kg/die) + grasso (4.5 kcal/kg/die)
    const otherLbm = lbm - smmKg;
    const fmForCalc = fmKg>0 ? fmKg : (bf>0 ? w*(bf/100) : w-lbm);
    bmr = Math.round(smmKg*13 + Math.max(0,otherLbm)*7 + fmForCalc*4.5);
  } else if(lbm<w) {
    bmr = 370 + 21.6*lbm;  // Katch-McArdle
  } else {
    bmr = profile.gender==="m" ? 10*w+6.25*h-5*a+5 : 10*w+6.25*h-5*a-161; // Mifflin
  }

  const tdee = bmr * profile.activity;
  const goal = GOALS.find(g=>g.val===profile.goal)||GOALS[0];

  // ── AGGIUSTAMENTO CALORICO BASE SUL GRASSO VISCERALE ──────────────────────
  const viscLevel = viscFatLevel(vf);
  let calAdj = goal.calAdj;
  if(viscLevel==="high"&&goal.val==="lose")      calAdj = Math.min(calAdj, -400); // deficit minimo 400
  if(viscLevel==="very_high"&&goal.val==="lose") calAdj = Math.min(calAdj, -500);
  if(viscLevel==="high"&&goal.val==="gain")      calAdj = Math.min(calAdj,  250); // surplus conservativo
  if(viscLevel==="very_high"&&goal.val==="gain") calAdj = Math.min(calAdj,  150);

  const calFloor = Math.max(Math.round(lbm * 22), profile.gender === "m" ? 1600 : 1400);
  const rawCal = Math.round(tdee + calAdj);
  const calFloorActive = rawCal < calFloor;
  const totalCal = Math.max(calFloor, rawCal);

  // ── PROTEINE su LBM ──────────────────────────────────────────────────────
  // Ricomposizione con BIA: aumenta coeff proteico perché la LBM è nota con precisione
  let pCoef = goal.pCoef;
  if(hasBia) {
    if(goal.val==="lose")   pCoef = viscLevel==="very_high" ? 2.8 : 2.6;
    if(goal.val==="recomp") pCoef = 2.8;
    if(goal.val==="gain")   pCoef = 2.2;
  }
  const protG = Math.round(lbm * pCoef);

  // ── GRASSI ────────────────────────────────────────────────────────────────
  // WHR alto o viscerale alto → grassi da fonti sane, quota moderata
  let fatCoef = goal.fCoef;
  if(whr>0.95||viscLevel==="very_high") fatCoef = 0.9; // riduce grassi per favorire CH
  const fatG = Math.max(Math.round(lbm*0.5), Math.min(Math.round(w*fatCoef), Math.round((totalCal*0.35)/9))); // min 0.5g/kg LBM, max 35% kcal

  // ── CARBOIDRATI ──────────────────────────────────────────────────────────
  // Residuo calorico dopo prot+grassi
  // Con visceral alto: abbassa CHO (insulino-resistenza parziale)
  let carbG = Math.max(0, Math.round((totalCal - protG*4 - fatG*9) / 4));
  if(viscLevel==="very_high"&&carbG>150) carbG = Math.round(carbG*0.85); // -15% CHO
  const carbsWarning = carbG < 50;

  return {
    calories:totalCal, protein:protG, carbs:carbG, fat:fatG,
    tdee:Math.round(tdee), bmr:Math.round(bmr),
    lbm:Math.round(lbm*10)/10,
    method: hasBia ? (bmrBia>0 ? "BIA-Direct" : smmKg>0 ? "BIA-SMM" : "BIA-LBM") : (bf>0?"Katch-McArdle":"Mifflin-St Jeor"),
    viscLevel, whr, smi, calFloorActive, carbsWarning,
  };
}

// OPTIMIZER
// Quantità minime realistiche per tipo di alimento
function getMinQty(food) {
  if (!food) return 20;
  const n = food.name.toLowerCase();
  if (food.unit === "ml") return 100;           // liquidi: min 100ml
  if (n.includes("olio")) return 2;            // olio: min 2g
  if (n.includes("semi di") || n.includes("lino")) return 10; // semi: min 10g
  if (n.includes("parmigiano")) return 20;      // parmigiano: min 20g
  if (n.includes("whey") || n.includes("caseina")) return 30; // proteine in polvere: min 30g
  if (n.includes("marmellata") || n.includes("miele")) return 15;
  return 30; // default solidi: min 30g
}

function optimize(foods, tgt) {
  if (!foods.length) return [];
  const maxQ = foods.map(f => f.maxQty || 500);
  const minQ = foods.map(f => getMinQty(f));
  const q = foods.map((f, i) => minQ[i]);

  // Classifica ogni alimento per macro dominante
  const getRole = f => {
    const k = Math.max(f.cal, 1);
    if (f.p * 4 / k > 0.30) return 'P'; // proteico
    if (f.c * 4 / k > 0.40) return 'C'; // glucidico
    if (f.f * 9 / k > 0.40) return 'F'; // lipidico
    return 'V'; // verdura/misto
  };

  const pIdx = [], cIdx = [], fIdx = [], vIdx = [];
  foods.forEach((f, i) => {
    const r = getRole(f);
    if (r==='P') pIdx.push(i);
    else if (r==='C') cIdx.push(i);
    else if (r==='F') fIdx.push(i);
    else vIdx.push(i);
  });

  // Step 1: alimenti proteici → raggiungi target proteico
  if (pIdx.length > 0) {
    const totalP = pIdx.reduce((s, i) => s + foods[i].p, 0);
    if (totalP > 0) {
      const qPerFood = (tgt.protein / totalP) * 100 / pIdx.length;
      pIdx.forEach(i => { q[i] = Math.max(minQ[i], Math.min(maxQ[i], qPerFood)); });
    }
  }

  // Step 2: alimenti lipidici → raggiungi target grassi (sottratti quelli già presenti)
  if (fIdx.length > 0) {
    const fatSoFar = foods.reduce((s, f, i) => s + q[i] * f.f / 100, 0);
    const fatNeeded = Math.max(0, tgt.fat - fatSoFar);
    const totalF = fIdx.reduce((s, i) => s + foods[i].f, 0);
    if (totalF > 0) {
      const qPerFood = (fatNeeded / totalF) * 100 / fIdx.length;
      fIdx.forEach(i => { q[i] = Math.max(minQ[i], Math.min(maxQ[i], qPerFood)); });
    }
  }

  // Step 3: alimenti glucidici → riempi le calorie rimanenti
  const calSoFar = () => foods.reduce((s, f, i) => s + q[i] * f.cal / 100, 0);
  if (cIdx.length > 0) {
    const calNeeded = Math.max(0, tgt.calories - calSoFar());
    const totalCal = cIdx.reduce((s, i) => s + foods[i].cal, 0);
    if (totalCal > 0) {
      const qPerFood = (calNeeded / totalCal) * 100 / cIdx.length;
      cIdx.forEach(i => { q[i] = Math.max(minQ[i], Math.min(maxQ[i], qPerFood)); });
    }
  } else {
    // Nessun alimento glucidico: scala tutto proporzionalmente al target calorico
    const cur = calSoFar();
    if (cur > 0) {
      const factor = tgt.calories / cur;
      foods.forEach((_, i) => { q[i] = Math.max(minQ[i], Math.min(maxQ[i], q[i] * factor)); });
    }
  }

  // Step 3b: verdure/misto → quantità fissa 150g (non partecipano al bilancio calorico)
  vIdx.forEach(i => { q[i] = Math.max(minQ[i], Math.min(maxQ[i], 150)); });

  // Step 4: calibrazione finale sulle calorie solo su P/C/F (escludi verdure)
  const nonVIdx = [...pIdx, ...cIdx, ...fIdx];
  const calNonV = () => nonVIdx.reduce((s, i) => s + q[i] * foods[i].cal / 100, 0);
  const calV = vIdx.reduce((s, i) => s + q[i] * foods[i].cal / 100, 0);
  const targetNonV = Math.max(0, tgt.calories - calV);
  const curNonV = calNonV();
  if (curNonV > 0 && Math.abs(curNonV - targetNonV) / (targetNonV||1) > 0.04) {
    const factor = targetNonV / curNonV;
    nonVIdx.forEach(i => { q[i] = Math.max(minQ[i], Math.min(maxQ[i], q[i] * factor)); });
  }

  return q.map((x, i) => Math.max(minQ[i], Math.min(maxQ[i], Math.round(x / 5) * 5)));
}

// Filtra alimenti sotto soglia calorica (< 5% del totale pasto)
// Poi re-ottimizza le quantità sui soli alimenti rimasti per rispettare i target
function filterRealisticItems(items, tgt) {
  if (items.length <= 1) return items;
  const totalCal = items.reduce((s, it) => {
    const div = it.food.unit === "pz" ? 1 : 100;
    return s + it.food.cal * it.quantity / div;
  }, 0);
  if (totalCal <= 0) return items;
  const filtered = items.filter(it => {
    const div = it.food.unit === "pz" ? 1 : 100;
    const isVeg = (it.food.cal || 0) < 50; // verdure: bassa densità calorica, non eliminare
    if (isVeg) return true;
    return (it.food.cal * it.quantity / div) / totalCal >= 0.02;
  });
  const kept = filtered.length >= 2 ? filtered : items.slice(0, 2);
  // Re-ottimizza le quantità sui soli alimenti rimasti
  if (tgt && kept.length < items.length) {
    const foods = kept.map(it => it.food);
    const qtys = optimize(foods, tgt);
    return foods.map((food, i) => ({ ...kept[i], quantity: qtys[i] }));
  }
  return kept;
}
function totals(items) {
  return items.reduce((a,it)=>{
    const div=it.food.unit==="pz"?1:100;
    const x=it.quantity/div;
    return {cal:a.cal+it.food.cal*x,p:a.p+it.food.p*x,c:a.c+it.food.c*x,f:a.f+it.food.f*x};
  },{cal:0,p:0,c:0,f:0});
}

// MEAL CONFIGS

// ─── SISTEMA SLOT CULINARI ────────────────────────────────────────────────────
// Ogni alimento appartiene a un "slot culinario" che definisce il suo ruolo nel pasto.
// Questo garantisce combinazioni appetibili: mai whey + passata, mai olio da solo come proteina.

// Mappa keyword → slot culinario
const CULINARY_SLOTS = {
  // Proteine animali carne
  protein_meat:   ["pollo","tacchino","manzo","vitello","agnello","maiale","bresaola","prosciutto","speck","mortadella","salame","salsiccia","hamburger","bistecca","filetto","scaloppina","fettina","spezzatino","roastbeef","affettato"],
  // Proteine pesce
  protein_fish:   ["salmone","tonno","merluzzo","sgombro","trota","spigola","orata","gamberetti","gamberi","calamari","polpo","cozze","vongole","acciughe","sardine","halibut","branzino"],
  // Uova
  protein_egg:    ["uov","album"],
  // Latticini proteici
  protein_dairy:  ["yogurt greco","ricotta","fiocchi di latte","cottage","quark","skyr"],
  // Legumi (proteina + carbo)
  protein_legume: ["lenticch","ceci","fagioli","soia","edamame","tempeh","tofu"],
  // Integratori (solo colazione)
  protein_supp:   ["whey","caseina","proteine in polvere"],
  // Carboidrati pasta/riso/cereali
  carb_grain:     ["pasta","riso","farro","orzo","quinoa","bulgur","couscous","polenta","grano"],
  // Pane e sostituti
  carb_bread:     ["pane","gallette","galletta","crackers","friselle","grissini"],
  // Tuberi
  carb_potato:    ["patata","patate"],
  // Avena/cereali per colazione
  carb_oat:       ["avena","fiocchi d'avena","fiocchi di avena","muesli","granola","cereali"],
  // Frutta
  carb_fruit:     ["mela","banana","arancia","pera","fragol","kiwi","ananas","uva","melone","anguria","albicocca","mango","pesca","cilieghe","lamponi","mirtill","fico","dattero"],
  // Verdure (ruolo accessorio, non mai protagonista)
  veg:            ["spinaci","broccoli","zucchini","zucchina","pomodor","insalata","lattuga","cavolo","peperone","melanzana","cetriolo","cavolfiore","carciofo","carota","bietola","sedano","finocchio","asparagi","rucola","radicchio","fagiolini","piselli","verza","coste","cicoria"],
  // Grassi/condimenti (mai come protagonista del pasto)
  fat:            ["olio","mandorle","noci","nocciole","pistacchi","semi di","avocado","burro di arachidi","tahini"],
  // Latticini liquidi
  dairy_drink:    ["latte"],
};

// Assegna lo slot culinario a un alimento
function getFoodSlot(food) {
  const n = (food.name||"").toLowerCase();
  for(const [slot, kws] of Object.entries(CULINARY_SLOTS)) {
    if(kws.some(kw=>n.includes(kw))) return slot;
  }
  // Fallback: classifica per macro dominante
  const k=food.cal||1;
  if(food.p*4/k>0.30) return "protein_meat";
  if(food.c*4/k>0.40) return "carb_grain";
  if(food.f*9/k>0.40) return "fat";
  return "veg";
}

// Gruppi di slot compatibili: se cerco "protein_fish" accetto anche "protein_meat" come fallback
const SLOT_FALLBACKS = {
  protein_meat:   ["protein_meat","protein_fish","protein_egg","protein_dairy","protein_legume"],
  protein_fish:   ["protein_fish","protein_meat","protein_egg","protein_dairy","protein_legume"],
  protein_egg:    ["protein_egg","protein_dairy","protein_meat","protein_fish"],
  protein_dairy:  ["protein_dairy","protein_egg","protein_legume","protein_meat"],
  protein_legume: ["protein_legume","protein_meat","protein_fish","protein_dairy"],
  protein_supp:   ["protein_supp","protein_egg","protein_dairy"],
  carb_grain:     ["carb_grain","carb_potato","carb_bread","carb_oat"],
  carb_bread:     ["carb_bread","carb_grain","carb_oat","carb_potato"],
  carb_potato:    ["carb_potato","carb_grain","carb_bread"],
  carb_oat:       ["carb_oat","carb_bread","carb_grain","carb_fruit"],
  carb_fruit:     ["carb_fruit","carb_oat","carb_bread"],
  veg:            ["veg","carb_fruit"],
  fat:            ["fat"],
  dairy_drink:    ["dairy_drink","protein_dairy"],
};

// Trova il miglior sostituto dalla credenza per uno slot culinario
function findBestForSlot(slot, pantryFoods, seen, rotationIdx=0) {
  const fallbacks = SLOT_FALLBACKS[slot] || [slot];
  for(const s of fallbacks) {
    const candidates = pantryFoods
      .filter(f=>!seen.has(f.name) && getFoodSlot(f)===s);
    if(!candidates.length) continue;
    // Ordina per qualità proteica (p/cal), ruota con rotationIdx
    candidates.sort((a,b)=>(b.p/(b.cal||1))-(a.p/(a.cal||1)));
    return candidates[rotationIdx % candidates.length];
  }
  return null;
}

// ─── SELEZIONE DALLA CREDENZA BASATA SU RICETTA (Opzione A) ─────────────────
// Scegli una ricetta da WEEK_RECIPES, poi sostituisci ogni ingrediente
// con il miglior equivalente disponibile in credenza.
// Garantisce combinazioni culinariamente sensate E macro bilanciati.
function selectPantryFoodsForRecipe(mealName, pantryFoods, recipes, rotationIdx=0, ratings={}) {
  if(!pantryFoods||!pantryFoods.length) return [];

  // 1. Scegli la ricetta migliore (preferisci quelle con alimenti votati bene)
  const highRatedFoods = new Set(
    Object.values(ratings).flat()
      .filter(r=>r.rating>=4)
      .flatMap(r=>r.foods||[])
  );
  const scored = recipes.map((r,i)=>({
    r, i,
    score: r.foods.filter(f=>highRatedFoods.has(f)).length,
  }));
  scored.sort((a,b)=>b.score-a.score);
  const topScore = scored[0].score;
  const topGroup = scored.filter(s=>s.score===topScore);
  const recipe = topGroup[rotationIdx % topGroup.length].r;

  // 2. Per ogni ingrediente della ricetta, trova il miglior sostituto in credenza
  const seen = new Set();
  const selected = [];

  for(const foodName of recipe.foods) {
    // Determina lo slot dell'ingrediente originale (es. "Petto di pollo" → protein_meat)
    const templateFood = { name: foodName, cal:0, p:0, c:0, f:0 };
    const slot = getFoodSlot(templateFood);

    // Cerca il miglior sostituto in credenza per quello slot
    const sub = findBestForSlot(slot, pantryFoods, seen, rotationIdx);
    if(sub) {
      seen.add(sub.name);
      selected.push(sub);
    }
  }

  // 3. Se non abbiamo trovato abbastanza alimenti (credenza limitata),
  //    aggiungi i migliori disponibili per macro senza duplicati
  if(selected.length < 2) {
    const byProtein = pantryFoods
      .filter(f=>!seen.has(f.name))
      .sort((a,b)=>(b.p/(b.cal||1))-(a.p/(a.cal||1)));
    for(const f of byProtein) {
      if(selected.length>=3) break;
      if(!seen.has(f.name)) { seen.add(f.name); selected.push(f); }
    }
  }

  return selected.slice(0,4);
}
// ────────────────────────────────────────────────────────────────────────────

const MEAL_CONFIGS = {
  1:[{name:"Pasto unico",nameEn:"Single meal",icon:"🍽️",time:"13:00",pct:1.00}],
  2:[{name:"Pranzo",nameEn:"Lunch",icon:"🕛",time:"13:00",pct:0.45},{name:"Cena",nameEn:"Dinner",icon:"🌙",time:"19:30",pct:0.55}],
  3:[{name:"Colazione",nameEn:"Breakfast",icon:"☀️",time:"07:30",pct:0.20},{name:"Pranzo",nameEn:"Lunch",icon:"🕛",time:"13:00",pct:0.40},{name:"Cena",nameEn:"Dinner",icon:"🌙",time:"19:30",pct:0.40}],
  4:[{name:"Colazione",nameEn:"Breakfast",icon:"☀️",time:"07:30",pct:0.20},{name:"Pranzo",nameEn:"Lunch",icon:"🕛",time:"13:00",pct:0.37},{name:"Spuntino",nameEn:"Snack",icon:"🍎",time:"16:30",pct:0.08},{name:"Cena",nameEn:"Dinner",icon:"🌙",time:"19:30",pct:0.35}],
  5:[{name:"Colazione",nameEn:"Breakfast",icon:"☀️",time:"07:30",pct:0.20},{name:"Spuntino mattina",nameEn:"Morning snack",icon:"🍎",time:"10:00",pct:0.08},{name:"Pranzo",nameEn:"Lunch",icon:"🕛",time:"13:00",pct:0.35},{name:"Spuntino pomeriggio",nameEn:"Afternoon snack",icon:"🍐",time:"16:30",pct:0.07},{name:"Cena",nameEn:"Dinner",icon:"🌙",time:"19:30",pct:0.30}],
};
// Restituisce il nome del pasto nella lingua corrente
// eslint-disable-next-line no-unused-vars
function mealName(m) { return _lang==="en"&&m.nameEn ? m.nameEn : m.name; }
// Calcola target per ogni pasto in base alla percentuale
function mealTarget(targets, mealNameArg, numMeals) {
  const ml = MEAL_CONFIGS[numMeals] || MEAL_CONFIGS[3];
  const m = ml.find(x => x.name === mealNameArg || x.nameEn === mealNameArg);
  const pct = m ? m.pct : 1/numMeals;
  return {
    calories: Math.round(targets.calories * pct),
    protein:  Math.round(targets.protein  * pct),
    carbs:    Math.round(targets.carbs    * pct),
    fat:      Math.round(targets.fat      * pct),
  };
}
const SUGGESTED = {
  "Colazione":["Fiocchi d'avena","Yogurt greco 0%","Banana","Whey protein"],
  "Spuntino mattina":["Yogurt greco 0%","Mela","Mandorle"],
  "Pranzo":["Petto di pollo","Riso bianco cotto","Broccoli","Olio d'oliva"],
  "Spuntino":["Yogurt greco 0%","Mela","Mandorle"],
  "Spuntino pomeriggio":["Albumi","Fragole","Mandorle"],
  "Cena":["Salmone","Patate cotte","Spinaci","Olio d'oliva"],
  "Pasto unico":["Petto di pollo","Riso bianco cotto","Broccoli","Olio d'oliva","Yogurt greco 0%"],
};

// RICETTE SETTIMANALI - ispirate a piani bodybuilding mediterranei
// 7 varianti per ogni slot pasto, una per ogni giorno della settimana
// RICETTE SETTIMANALI - basate sul piano SS Nutrition (Dott. Salvatore Solimeno)
// Schema: proteina principale + carboidrato complesso + verdura + olio evo
// 7 varianti per slot, una per giorno. Le quantità vengono calibrate dall'ottimizzatore.
const WEEK_RECIPES = {
  // Colazione: giorni allenamento = avena/cereali + albumi + latticino
  //            giorni recupero    = pane integrale + albumi + yogurt
  "Colazione":[
    {name:"Cereali con albumi e latte",         foods:["Fiocchi d'avena","Albumi","Latte scremato"]},
    {name:"Pane integrale con albumi e yogurt", foods:["Pane integrale","Albumi","Yogurt greco 0%"]},
    {name:"Avena con proteine e latte",         foods:["Fiocchi d'avena","Whey protein","Latte scremato"]},
    {name:"Pane integrale con albumi e mela",   foods:["Pane integrale","Albumi","Yogurt greco 0%","Mela"]},
    {name:"Cereali con proteine e yogurt",      foods:["Fiocchi d'avena","Whey protein","Yogurt greco 0%"]},
    {name:"Uova con avena e latte",             foods:["Uova intere","Albumi","Fiocchi d'avena","Latte scremato"]},
    {name:"Pane integrale con uova e yogurt",   foods:["Pane integrale","Uova intere","Yogurt greco 0%"]},
  ],
  // Spuntino mattina: giorni allenamento = pane + proteina magra
  //                   giorni recupero    = proteina magra + frutta secca
  "Spuntino mattina":[
    {name:"Bresaola e pane integrale",    foods:["Bresaola","Pane integrale"]},
    {name:"Tacchino e mandorle",          foods:["Tacchino","Mandorle"]},
    {name:"Tonno al naturale e noci",     foods:["Tonno al naturale","Noci"]},
    {name:"Bresaola e noci con mela",     foods:["Bresaola","Noci","Mela"]},
    {name:"Tacchino e pane integrale",    foods:["Tacchino","Pane integrale"]},
    {name:"Tonno e mandorle",             foods:["Tonno al naturale","Mandorle"]},
    {name:"Bresaola e mandorle con mela", foods:["Bresaola","Mandorle","Mela"]},
  ],
  // Pranzo: carboidrato complesso + proteina + verdura + olio evo
  "Pranzo":[
    {name:"Pasta integrale con pollo e pomodori",  foods:["Pasta integrale cotta","Petto di pollo","Pomodori","Olio d'oliva"]},
    {name:"Riso integrale con tonno e zucchine",   foods:["Riso integrale cotto","Tonno al naturale","Zucchine","Olio d'oliva"]},
    {name:"Farro con merluzzo e spinaci",          foods:["Farro cotto","Merluzzo","Spinaci","Olio d'oliva"]},
    {name:"Pasta integrale con salmone e spinaci", foods:["Pasta integrale cotta","Salmone","Spinaci","Olio d'oliva"]},
    {name:"Riso integrale con pollo e broccoli",   foods:["Riso integrale cotto","Petto di pollo","Broccoli","Olio d'oliva"]},
    {name:"Lenticchie con tacchino e insalata",    foods:["Lenticchie cotte","Tacchino","Insalata mista","Olio d'oliva"]},
    {name:"Pasta integrale con manzo e pomodori",  foods:["Pasta integrale cotta","Manzo magro","Pomodori","Olio d'oliva"]},
  ],
  // Spuntino pomeriggio: proteina magra + carboidrato (tacchino/bresaola + pane)
  "Spuntino pomeriggio":[
    {name:"Tacchino con pane integrale",    foods:["Tacchino","Pane integrale"]},
    {name:"Bresaola con pane integrale",    foods:["Bresaola","Pane integrale"]},
    {name:"Tonno e mandorle",               foods:["Tonno al naturale","Mandorle"]},
    {name:"Manzo magro con pane integrale", foods:["Manzo magro","Pane integrale"]},
    {name:"Tacchino e mandorle",            foods:["Tacchino","Mandorle"]},
    {name:"Bresaola e noci",                foods:["Bresaola","Noci"]},
    {name:"Tonno con pane integrale",       foods:["Tonno al naturale","Pane integrale"]},
  ],
  // Spuntino (4 pasti): stessa logica spuntino pomeriggio
  "Spuntino":[
    {name:"Tacchino con pane integrale",    foods:["Tacchino","Pane integrale"]},
    {name:"Bresaola e mandorle",            foods:["Bresaola","Mandorle"]},
    {name:"Tonno e noci",                   foods:["Tonno al naturale","Noci"]},
    {name:"Manzo magro con pane integrale", foods:["Manzo magro","Pane integrale"]},
    {name:"Tacchino e noci",                foods:["Tacchino","Noci"]},
    {name:"Bresaola con pane integrale",    foods:["Bresaola","Pane integrale"]},
    {name:"Yogurt greco con mandorle",      foods:["Yogurt greco 0%","Mandorle","Mela"]},
  ],
  // Cena: carboidrato complesso + proteina + verdura + olio evo
  "Cena":[
    {name:"Riso integrale con merluzzo e spinaci",   foods:["Riso integrale cotto","Merluzzo","Spinaci","Olio d'oliva"]},
    {name:"Pasta integrale con salmone e zucchine",  foods:["Pasta integrale cotta","Salmone","Zucchine","Olio d'oliva"]},
    {name:"Patate con pollo e broccoli",             foods:["Patate cotte","Petto di pollo","Broccoli","Olio d'oliva"]},
    {name:"Riso integrale con manzo e pomodori",     foods:["Riso integrale cotto","Manzo magro","Pomodori","Olio d'oliva"]},
    {name:"Pasta integrale con tacchino e zucchine", foods:["Pasta integrale cotta","Tacchino","Zucchine","Olio d'oliva"]},
    {name:"Patate con merluzzo e spinaci",           foods:["Patate cotte","Merluzzo","Spinaci","Olio d'oliva"]},
    {name:"Riso integrale con salmone e broccoli",   foods:["Riso integrale cotto","Salmone","Broccoli","Olio d'oliva"]},
  ],
  // Pasto unico: proteina + carbo + verdura + grasso sano
  "Pasto unico":[
    {name:"Pasta integrale pollo e pomodori",    foods:["Pasta integrale cotta","Petto di pollo","Pomodori","Olio d'oliva"]},
    {name:"Riso integrale tonno e zucchine",     foods:["Riso integrale cotto","Tonno al naturale","Zucchine","Olio d'oliva"]},
    {name:"Farro salmone e spinaci",             foods:["Farro cotto","Salmone","Spinaci","Olio d'oliva"]},
    {name:"Riso integrale manzo e broccoli",     foods:["Riso integrale cotto","Manzo magro","Broccoli","Olio d'oliva"]},
    {name:"Pasta integrale merluzzo e pomodori", foods:["Pasta integrale cotta","Merluzzo","Pomodori","Olio d'oliva"]},
    {name:"Lenticchie pollo e insalata",         foods:["Lenticchie cotte","Petto di pollo","Insalata mista","Olio d'oliva"]},
    {name:"Patate tacchino e broccoli",          foods:["Patate cotte","Tacchino","Broccoli","Olio d'oliva"]},
  ],
};

// Genera piano settimanale di 7 giorni con quantità calibrate ai macro
// Mappa qualsiasi nome pasto (italiano, inglese, variante importata) alla chiave italiana di WEEK_RECIPES
function resolveItalianMealKey(name) {
  if (!name) return "Pranzo";
  const n = name.toLowerCase().trim();
  if (n.includes("colazione") || n.includes("breakfast") || n.includes("morning meal")) return "Colazione";
  // compound names BEFORE generic "spuntino/snack"
  if (n.includes("spuntino mattina") || n.includes("morning snack") || n.includes("mid-morning") || n.includes("spuntino mat")) return "Spuntino mattina";
  if (n.includes("spuntino pomeriggio") || n.includes("afternoon snack") || n.includes("pomeriggio") || n.includes("pomeridiano") || n.includes("merenda")) return "Spuntino pomeriggio";
  if (n.includes("pranzo") || n.includes("lunch") || n.includes("mezzogiorno")) return "Pranzo";
  if (n.includes("spuntino") || n.includes("snack")) return "Spuntino";
  if (n.includes("cena") || n.includes("dinner") || n.includes("serale")) return "Cena";
  if (n.includes("pasto unico") || n.includes("single meal")) return "Pasto unico";
  return "Pranzo";
}

// Lista tag di esclusione alimenti — ogni id è una keyword per match case-insensitive
const EXCLUSION_TAGS = [
  {id:"pollo",     label:"Pollo",           labelEn:"Chicken",        emoji:"🍗"},
  {id:"tacchino",  label:"Tacchino",        labelEn:"Turkey",         emoji:"🦃"},
  {id:"manzo",     label:"Manzo/Bovino",    labelEn:"Beef",           emoji:"🥩"},
  {id:"maiale",    label:"Maiale",          labelEn:"Pork",           emoji:"🐷"},
  {id:"agnello",   label:"Agnello",         labelEn:"Lamb",           emoji:"🐑"},
  {id:"bresaola",  label:"Bresaola",        labelEn:"Bresaola",       emoji:"🥩"},
  {id:"prosciutto",label:"Prosciutto",      labelEn:"Prosciutto",     emoji:"🥩"},
  {id:"salmone",   label:"Salmone",         labelEn:"Salmon",         emoji:"🐠"},
  {id:"tonno",     label:"Tonno",           labelEn:"Tuna",           emoji:"🐟"},
  {id:"merluzzo",  label:"Merluzzo",        labelEn:"Cod",            emoji:"🐡"},
  {id:"sgombro",   label:"Sgombro",         labelEn:"Mackerel",       emoji:"🐟"},
  {id:"gamber",    label:"Gamberi",         labelEn:"Shrimp",         emoji:"🦐"},
  {id:"cozze",     label:"Cozze/Crostacei", labelEn:"Shellfish",      emoji:"🐚"},
  {id:"latte",     label:"Latte",           labelEn:"Milk",           emoji:"🥛"},
  {id:"yogurt",    label:"Yogurt",          labelEn:"Yogurt",         emoji:"🫙"},
  {id:"ricotta",   label:"Ricotta",         labelEn:"Ricotta",        emoji:"🧀"},
  {id:"mozzarella",label:"Mozzarella",      labelEn:"Mozzarella",     emoji:"🧀"},
  {id:"formaggio", label:"Formaggio",       labelEn:"Cheese",         emoji:"🧀"},
  {id:"uov",       label:"Uova",            labelEn:"Eggs",           emoji:"🥚"},
  {id:"albumi",    label:"Albumi",          labelEn:"Egg Whites",     emoji:"🥣"},
  {id:"tofu",      label:"Tofu",            labelEn:"Tofu",           emoji:"🍱"},
  {id:"tempeh",    label:"Tempeh",          labelEn:"Tempeh",         emoji:"🌱"},
  {id:"soia",      label:"Soia",            labelEn:"Soy",            emoji:"🫘"},
  {id:"pasta",     label:"Pasta",           labelEn:"Pasta",          emoji:"🍝"},
  {id:"riso",      label:"Riso",            labelEn:"Rice",           emoji:"🍚"},
  {id:"pane",      label:"Pane",            labelEn:"Bread",          emoji:"🍞"},
  {id:"avena",     label:"Avena",           labelEn:"Oats",           emoji:"🌾"},
  {id:"farro",     label:"Farro/Orzo",      labelEn:"Spelt/Barley",   emoji:"🌾"},
  {id:"funghi",    label:"Funghi",          labelEn:"Mushrooms",      emoji:"🍄"},
  {id:"whey",      label:"Whey/Caseina",    labelEn:"Whey/Casein",    emoji:"🥤"},
];

// Restituisce true se il nome cibo contiene una delle keyword escluse
const isExcluded = (foodName, excludedIds) => {
  if (!excludedIds || !excludedIds.length) return false;
  const lower = (foodName || '').toLowerCase();
  return excludedIds.some(id => lower.includes(id.toLowerCase()));
};

function generateWeeklyPlan(targets, mealList, seed=0, numMeals, excludedFoods=[]) {
  if (!targets || !mealList.length) return null;
  const plan = [];
  for (let day = 0; day < 7; day++) {
    const dayMeals = {};
    mealList.forEach(meal => {
      const mKey = meal.name;
      // Usa SEMPRE meal.pct dalla mealList — evita il bug numMeals/MEAL_CONFIGS mismatch
      // che causava snack a 33% delle calorie invece di 7-8%
      const pct = meal.pct || (1/mealList.length);
      const mTgt = {
        calories: Math.round(targets.calories * pct),
        protein:  Math.round(targets.protein  * pct),
        carbs:    Math.round(targets.carbs    * pct),
        fat:      Math.round(targets.fat      * pct),
      };
      const recipeKey = resolveItalianMealKey(mKey);
      const templates = WEEK_RECIPES[recipeKey] || WEEK_RECIPES["Pranzo"];
      const template = templates[(day + seed) % templates.length];
      // Usa direttamente gli alimenti della ricetta (già appetibili per costruzione)
      const foods = template.foods.map(n => findFood(n)).filter(Boolean).filter(f => !isExcluded(f.name, excludedFoods));
      if (!foods.length) { dayMeals[mKey] = []; return; }
      const qtys = optimize(foods, mTgt);
      const rawItems = foods.map((food, i) => ({ food, quantity: qtys[i], recipeName: template.name }));
      dayMeals[mKey] = filterRealisticItems(rawItems, mTgt);
    });
    plan.push(dayMeals);
  }
  return plan;
}

// UI COMPONENTS
function Logo({ size=48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="ncLg" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2DD4BF"/>
          <stop offset="1" stopColor="#3B82F6"/>
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill="url(#ncLg)"/>
      {/* N — left vertical, diagonal, right vertical */}
      <path d="M8,36 L8,12 L22,36 L22,12" stroke="white" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* C — arc opening toward N */}
      <path d="M37,16 C34,11 25,11 22,17 C19,21 19,27 22,31 C25,37 34,37 37,32" stroke="white" strokeWidth="3.4" strokeLinecap="round" fill="none"/>
    </svg>
  );
}
function Lbl({children,color=C.mid}) { return <div style={{fontSize:11,fontWeight:700,color,letterSpacing:.9,textTransform:"uppercase",marginBottom:10}}>{children}</div>; }
function BackBtn({onClick}) { return <button onClick={onClick} style={{width:40,height:40,borderRadius:12,background:C.surf,border:`1px solid ${C.bord}`,color:C.txt,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:ff,flexShrink:0}}>←</button>; }
function Spin({size=22,color=C.acc}) { return <div style={{width:size,height:size,borderRadius:"50%",border:`2.5px solid ${color}30`,borderTopColor:color,animation:"spin .8s linear infinite"}}/>; }
function MacroBar({label,val,target,color}) {
  const pct=Math.min(100,(val/(target||1))*100), over=val>target*1.05;
  const isGood=pct>=85&&pct<=115;
  const barColor=over?C.red:color;
  const barColor2=over?"#FCA5A5":color==="#00E5A0"?"#38BDF8":color==="#38BDF8"?"#A78BFA":"#FDE68A";
  return (
    <div style={{marginBottom:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:7}}>
        <span style={{fontSize:12,color:C.mid,fontWeight:700,letterSpacing:.5,textTransform:"uppercase"}}>{label}</span>
        <div style={{display:"flex",alignItems:"baseline",gap:4}}>
          <span style={{fontSize:15,fontWeight:900,color:over?C.red:C.txt}}>{rnd(val)}</span>
          <span style={{fontSize:11,color:C.mid,fontWeight:500}}>/ {target}g</span>
          <span style={{fontSize:11,fontWeight:800,color:barColor,marginLeft:4,background:`${barColor}18`,padding:"1px 6px",borderRadius:6}}>{Math.round(pct)}%</span>
        </div>
      </div>
      <div style={{background:"rgba(255,255,255,.06)",borderRadius:10,height:10,overflow:"hidden",position:"relative"}}>
        <div style={{
          width:`${pct}%`,
          background:`linear-gradient(90deg, ${barColor}, ${barColor2})`,
          borderRadius:10, height:10,
          transition:"width .7s cubic-bezier(.4,0,.2,1)",
          boxShadow:isGood?`0 0 10px ${barColor}99`:"none",
          animation:"slideRight .7s ease-out",
        }}/>
      </div>
    </div>
  );
}
function MacroRing({cal,target,size=160}) {
  const R2=size/2-13, circ=2*Math.PI*R2;
  const pct=Math.min(100,(cal/(target||1))*100), over=cal>target*1.05;
  const gradId=`rg${size}`;
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{filter:over?"none":`drop-shadow(0 0 12px #00E5A044)`}}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={over?C.red:C.acc}/>
            <stop offset="100%" stopColor={over?"#FF6B78":C.blu}/>
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={R2} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={12}/>
        <circle cx={size/2} cy={size/2} r={R2} fill="none" stroke={`url(#${gradId})`} strokeWidth={12}
          strokeDasharray={`${circ*pct/100} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{transition:"stroke-dasharray .6s cubic-bezier(.4,0,.2,1)"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontSize:28,fontWeight:900,letterSpacing:-1,color:over?C.red:C.acc,lineHeight:1}}>{rnd(cal)}</div>
        <div style={{fontSize:10,color:C.mid,fontWeight:600,letterSpacing:.5,marginTop:2}}>KCAL</div>
        <div style={{fontSize:11,fontWeight:700,color:C.mid,marginTop:3}}>{Math.round(pct)}%</div>
      </div>
    </div>
  );
}
function MealSummaryBar({tot,target}) {
  const macros=[["kcal",rnd(tot.cal),target.calories,C.txt,null],[`P`,`${rnd(tot.p)}`,`${target.protein}`,C.acc,"g"],[`C`,`${rnd(tot.c)}`,`${target.carbs}`,C.blu,"g"],[`G`,`${rnd(tot.f)}`,`${target.fat}`,C.ora,"g"]];
  return (
    <div style={{
      background:`linear-gradient(145deg,${C.card},${C.surf})`,
      borderRadius:22,border:`1px solid ${C.bord}`,
      padding:"16px 18px",marginBottom:16,
      boxShadow:"0 4px 20px rgba(0,0,0,.3)",
    }}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
        {macros.map(([l,v,tgt,c,unit])=>(
          <div key={l} style={{textAlign:"center",flex:1}}>
            <div style={{fontSize:9,color:C.mid,fontWeight:700,letterSpacing:.5,textTransform:"uppercase",marginBottom:4}}>{l}</div>
            <div style={{fontSize:17,fontWeight:900,color:c,letterSpacing:-0.5}}>{v}<span style={{fontSize:10,fontWeight:500}}>{unit||""}</span></div>
            <div style={{fontSize:9,color:C.mid,marginTop:2}}>/{tgt}{unit||""}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:5}}>
        {[[tot.p,target.protein,C.acc],[tot.c,target.carbs,C.blu],[tot.f,target.fat,C.ora]].map(([e,thr,c],i)=>{
          const pct=Math.min(100,(e/(thr||1))*100), ov=e>thr*1.05;
          return <div key={i} style={{flex:1,background:"rgba(255,255,255,.06)",borderRadius:6,height:6,overflow:"hidden"}}><div style={{width:`${pct}%`,background:ov?C.red:c,height:6,borderRadius:6,transition:"width .6s"}}/></div>;
        })}
      </div>
    </div>
  );
}
const NAV_ICONS = {
  today: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 12L12 3L21 12V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V12Z"
        fill={active?"url(#ng0)":"none"} stroke={active?"url(#ng0)":C.mid} strokeWidth="1.8" strokeLinejoin="round"/>
      <defs><linearGradient id="ng0" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={C.acc}/><stop offset="100%" stopColor={C.blu}/></linearGradient></defs>
    </svg>
  ),
  piano: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="16" rx="3" stroke={active?"url(#ng4)":C.mid} strokeWidth="1.8" fill={active?"url(#ng4)":"none"} fillOpacity={active?.15:0}/>
      <line x1="3" y1="10" x2="21" y2="10" stroke={active?"url(#ng4)":C.mid} strokeWidth="1.5"/>
      <line x1="8" y1="3" x2="8" y2="7" stroke={active?"url(#ng4)":C.mid} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="16" y1="3" x2="16" y2="7" stroke={active?"url(#ng4)":C.mid} strokeWidth="1.8" strokeLinecap="round"/>
      <rect x="7" y="13.5" width="3" height="3" rx="1" fill={active?"url(#ng4)":C.mid} opacity={active?1:.7}/>
      <rect x="14" y="13.5" width="3" height="3" rx="1" fill={active?"url(#ng4)":C.mid} opacity={active?1:.4}/>
      <defs><linearGradient id="ng4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={C.acc}/><stop offset="100%" stopColor={C.blu}/></linearGradient></defs>
    </svg>
  ),
  progress: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="12" width="4" height="9" rx="2" fill={active?"url(#ng1)":C.mid} opacity={active?1:.7}/>
      <rect x="10" y="7" width="4" height="14" rx="2" fill={active?"url(#ng1)":C.mid} opacity={active?1:.5}/>
      <rect x="17" y="3" width="4" height="18" rx="2" fill={active?"url(#ng1)":C.mid} opacity={active?1:.3}/>
      <defs><linearGradient id="ng1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={C.acc}/><stop offset="100%" stopColor={C.blu}/></linearGradient></defs>
    </svg>
  ),
  credenza: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M9 3H15C15 3 16 3 16.5 4L19 9H5L7.5 4C8 3 9 3 9 3Z" stroke={active?"url(#ng2)":C.mid} strokeWidth="1.8" fill={active?"url(#ng2)":"none"} fillOpacity={active?.2:0} strokeLinejoin="round"/>
      <rect x="4" y="9" width="16" height="12" rx="2" stroke={active?"url(#ng2)":C.mid} strokeWidth="1.8" fill={active?"url(#ng2)":"none"} fillOpacity={active?.1:0}/>
      <line x1="4" y1="13" x2="20" y2="13" stroke={active?"url(#ng2)":C.mid} strokeWidth="1.5"/>
      <defs><linearGradient id="ng2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={C.ora}/><stop offset="100%" stopColor={C.yel}/></linearGradient></defs>
    </svg>
  ),
  profile: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={active?"url(#ng3)":C.mid} strokeWidth="1.8" fill={active?"url(#ng3)":"none"} fillOpacity={active?.2:0}/>
      <path d="M4 20C4 16.7 7.6 14 12 14C16.4 14 20 16.7 20 20" stroke={active?"url(#ng3)":C.mid} strokeWidth="1.8" strokeLinecap="round"/>
      <defs><linearGradient id="ng3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={C.blu}/><stop offset="100%" stopColor={C.pur}/></linearGradient></defs>
    </svg>
  ),
  diary: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="3" width="14" height="18" rx="2" stroke={active?"url(#ng5)":C.mid} strokeWidth="1.8" fill={active?"url(#ng5)":"none"} fillOpacity={active?.12:0}/>
      <line x1="8" y1="8" x2="14" y2="8" stroke={active?"url(#ng5)":C.mid} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="8" y1="12" x2="14" y2="12" stroke={active?"url(#ng5)":C.mid} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="8" y1="16" x2="11" y2="16" stroke={active?"url(#ng5)":C.mid} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="18" cy="18" r="4" fill={active?"url(#ng5)":C.mid} fillOpacity={active?1:.6}/>
      <line x1="18" y1="16" x2="18" y2="18" stroke="#0D1117" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="18" cy="19.5" r=".6" fill="#0D1117"/>
      <defs><linearGradient id="ng5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={C.ora}/><stop offset="100%" stopColor={C.yel}/></linearGradient></defs>
    </svg>
  ),
};
function BottomNav({tab,setTab,lang,setSubScreen}) {
  const tabs=[["today",t("today",lang)],["piano",t("pianoTab",lang)],["diary",t("diaryTab",lang)],["credenza",t("pantryTab",lang)],["profile",t("profile",lang)]];
  return (
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:`rgba(13,20,34,.92)`,borderTop:`1px solid ${C.bord}`,display:"flex",padding:"10px 4px 24px",zIndex:50,backdropFilter:"blur(20px)"}}>
      {tabs.map(([id,lbl])=>{
        const active=tab===id;
        return (
          <button key={id} onClick={()=>{setTab(id);setSubScreen&&setSubScreen(null);}}
            style={{flex:1,background:"none",border:"none",color:active?C.acc:C.mid,cursor:"pointer",padding:"4px 0",fontFamily:ff,display:"flex",flexDirection:"column",alignItems:"center",gap:4,position:"relative",transition:"color .2s"}}>
            {active&&(
              <div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",width:40,height:3,borderRadius:99,background:`linear-gradient(90deg,${C.acc},${C.blu})`,boxShadow:`0 0 12px ${C.acc}99`}}/>
            )}
            <div style={{
              width:46,height:36,borderRadius:12,
              background:active?`linear-gradient(135deg,${C.acc}18,${C.blu}12)`:"transparent",
              display:"flex",alignItems:"center",justifyContent:"center",
              transition:"background .25s, transform .2s",
              transform:active?"scale(1.1)":"scale(1)",
            }}>
              {NAV_ICONS[id]?.(active)}
            </div>
            <div style={{fontSize:10,fontWeight:active?800:500,letterSpacing:.3}}>{lbl}</div>
          </button>
        );
      })}
    </div>
  );
}
const LANG = {
  it: {
    today:"Oggi", progress:"Progressi", pantryTab:"Credenza", profile:"Profilo", diaryTab:"Diario",
    pianoTab:"Piano", pianoTitle:"Piano Alimentare", pianoSubtitle:"7 giorni · macro calibrati",
    generatePlan:"Genera piano settimanale", regenPlan:"🔄 Rigenera",
    noPlan:"Nessun piano generato", noPlanDesc:"Genera il piano settimanale basato sui tuoi macro e sui cibi a migliore qualità nutrizionale.",
    personalizza:"📝 Modifica giorno", personalizzaOn:"✓ Modificato",
    pianoToday:"Piano di oggi", viewPlan:"Vedi piano",
    diary:"Diario", diaryTitle:"Diario alimentare", diaryReset:"Resetta diario",
    calories:"Calorie", protein:"Proteine", carbs:"Carboidrati", fat:"Grassi",
    goal:"Obiettivo", eaten:"Consumate", remaining:"Rimanenti",
    daily_macros:"Macro giornalieri",
    good_morning:"Buongiorno", good_afternoon:"Buon pomeriggio", good_evening:"Buonasera",
    meals:"I tuoi {n} pasti", generate:"Genera il pasto automaticamente",
    fromPantry:"Usa la Credenza", fromDB:"Usa il Database",
    addFood:"+ Aggiungi alimento", saveFav:"⭐ Salva pasto preferito",
    favMeals:"Pasti salvati", noFavs:"Nessun pasto salvato.",
    applyMeal:"Applica", deleteMeal:"Elimina",
    login:"Accedi", register:"Registrati", logout:"Esci", reset:"🔄 Reset",
    save:"Salva", cancel:"Annulla", edit:"✏️ Modifica", close:"Chiudi",
    search:"Cerca alimento...", language:"Lingua",
    pantryEmpty:"La Credenza è vuota.", pantryExhausted:"Alimenti esauriti.",
    recalc:"🔄 Ricalcola", addFoodBtn:"+ Aggiungi",
    chooseLanguage:"Scegli la lingua", currentPlan:"Piano corrente",
    savedMeals:"Pasti salvati", noSavedMeals:"Nessun pasto salvato.",
    saveMealPrompt:"Nome del pasto", saveMealBtn:"Salva pasto",
    weight:"Peso", height:"Altezza", age:"Età", bodyFat:"Massa grassa (Facoltativo)",
    currentWeight:"Peso attuale", weightChange:"Variazione",
    measurements:"misurazioni", logWeight:"Registra peso di oggi",
    activity:"Livello di attività", objective:"Il tuo obiettivo", mealsPerDay:"Quanti pasti al giorno?",
    results:"Il tuo piano", editProfile:"Modifica profilo", closeEdit:"Chiudi modifica",
    recalcPlan:"Ricalcola piano", addFood2:"+ Aggiungi alimento",
    usePantry:"🫙 Usa la Credenza", useDB:"📋 Usa il Database",
    generateAuto:"Genera il pasto automaticamente",
    generateDesc:"Scegli da dove prendere gli alimenti per costruire il pasto.",
    myItems:"⭐ Miei", pantryItems:"🫙 Credenza",
    nothingLogged:"Nessun alimento registrato",
    diaryDesc:"Aggiungi quello che hai mangiato oggi per tracciare il tuo apporto.",
    todayTotal:"Totale di oggi", forgotPassword:"Hai dimenticato la password?",
    resetEmailSent:"Email inviata", resetEmailDesc:"Controlla la casella",
    resetEmailAction:"Torna al login", backToLogin:"Torna al login",
    confirm:"Controlla la tua email", confirmDesc:"Abbiamo inviato un link di conferma a",
    welcome:"Benvenuto", chooseGoal:"Il tuo obiettivo", choosePlan:"Scegli il piano",
    loading:"Caricamento...", createAccount:"Crea account", signIn:"Accedi",
    name:"Il tuo nome", email:"Email", password:"Password",
    biological_sex:"Sesso biologico", male:"♂ Uomo", female:"♀ Donna",
    online_search:"Ricerca online", online_search_sub:"Open Food Facts · salva nel database interno",
    search_results:"{n} prodotti trovati", no_results:"Nessun risultato.",
    searching:"Ricerca in corso...", search_hint:"Scrivi il nome del prodotto e premi Cerca",
    save_food:"+ Salva", saved_food:"✓ Salvato",
    create_food:"Crea alimento", values_per:"Valori nutrizionali per",
    preview:"Anteprima", save_item:"Salva alimento",
    fav_meals_title:"Pasti preferiti",
    apply_fav:"Usa", delete_fav:"✕",
    importDiet:"Importa dieta", importDietTitle:"Importa dieta da PDF",
    importDietDesc:"Carica il PDF della tua dieta. L'IA legge il documento ed estrae i pasti automaticamente.",
    importBtn:"📄 Carica PDF dieta",
    importAnalyzing:"Analisi del documento in corso...",
    importSuccess:"Dieta importata con successo!",
    importApply:"📅 Importa nel Piano settimanale",
    importReset:"Carica un altro PDF",
    importError:"Errore durante l'analisi. Verifica che il PDF contenga un piano alimentare.",
    importNote:"Funziona con qualsiasi dieta in formato PDF: piani nutrizionali, prescrizioni dietistiche, menu settimanali.",
    importMealsFound:"pasti trovati",
    importFoodsIn:"alimenti in",
    dietProgress:"Progressi dieta",
    dietProgressTitle:"Progressi dieta",
    periodDay:"Oggi",periodWeek:"Settimana",periodMonth:"Mese",
    totalCalories:"Calorie totali",totalProtein:"Proteine totali",totalCarbs:"Carboidrati totali",totalFat:"Grassi totali",
    vsTarget:"vs obiettivo",avgPerDay:"Media giornaliera",daysTracked:"Giorni registrati",
    confirmMeal:"✓ Confermato",unconfirmMeal:"Conferma",confirmMealToast:"Pasto confermato",
    progressChart:"Calorie ultime 7 notti",noNutritionData:"Nessun pasto confermato ancora.",
    noNutritionDataDesc:"Conferma i tuoi pasti ogni giorno per vedere le statistiche qui.",
    motivationPerfect:"Perfetto! Stai rispettando i tuoi obiettivi. Continua così!",
    motivationGood:"Ottimo lavoro! Sei sulla buona strada. Qualche piccola correzione e centrerai il target.",
    motivationLow:"Stai mangiando troppo poco. Ricorda: il deficit eccessivo rallenta il metabolismo.",
    motivationHigh:"Stai superando le calorie. Monitora le porzioni e torna in carreggiata.",
    caloriesTarget:"Obiettivo calorico",
  },
  en: {
    today:"Today", progress:"Progress", pantryTab:"Pantry", profile:"Profile", diaryTab:"Diary",
    pianoTab:"Plan", pianoTitle:"Meal Plan", pianoSubtitle:"7 days · calibrated macros",
    generatePlan:"Generate weekly plan", regenPlan:"🔄 Regenerate",
    noPlan:"No plan generated", noPlanDesc:"Generate a weekly plan based on your macros and best-quality foods.",
    personalizza:"📝 Edit today", personalizzaOn:"✓ Edited",
    pianoToday:"Today's plan", viewPlan:"View plan",
    diary:"Diary", diaryTitle:"Food diary", diaryReset:"Reset diary",
    calories:"Calories", protein:"Protein", carbs:"Carbs", fat:"Fat",
    goal:"Goal", eaten:"Consumed", remaining:"Remaining",
    daily_macros:"Daily macros",
    good_morning:"Good morning", good_afternoon:"Good afternoon", good_evening:"Good evening",
    meals:"Your {n} meals", generate:"Generate meal automatically",
    fromPantry:"Use Pantry", fromDB:"Use Database",
    addFood:"+ Add food", saveFav:"⭐ Save favourite meal",
    favMeals:"Saved meals", noFavs:"No saved meals.",
    applyMeal:"Apply", deleteMeal:"Delete",
    login:"Sign in", register:"Sign up", logout:"Sign out", reset:"🔄 Reset",
    save:"Save", cancel:"Cancel", edit:"✏️ Edit", close:"Close",
    search:"Search food...", language:"Language",
    pantryEmpty:"Pantry is empty.", pantryExhausted:"All items exhausted.",
    recalc:"🔄 Recalculate", addFoodBtn:"+ Add",
    chooseLanguage:"Choose language", currentPlan:"Current plan",
    savedMeals:"Saved meals", noSavedMeals:"No saved meals.",
    saveMealPrompt:"Meal name", saveMealBtn:"Save meal",
    weight:"Weight", height:"Height", age:"Age", bodyFat:"Body fat % (Optional)",
    currentWeight:"Current weight", weightChange:"Change",
    measurements:"measurements", logWeight:"Log today's weight",
    activity:"Activity level", objective:"Your goal", mealsPerDay:"How many meals per day?",
    results:"Your plan", editProfile:"Edit profile", closeEdit:"Close edit",
    recalcPlan:"Recalculate plan", addFood2:"+ Add food",
    usePantry:"🫙 Use Pantry", useDB:"📋 Use Database",
    generateAuto:"Generate meal automatically",
    generateDesc:"Choose where to get foods to build the meal.",
    myItems:"⭐ Mine", pantryItems:"🫙 Pantry",
    nothingLogged:"Nothing logged yet",
    diaryDesc:"Add what you ate today to track your intake.",
    todayTotal:"Today's total", forgotPassword:"Forgot your password?",
    resetEmailSent:"Email sent", resetEmailDesc:"Check your inbox",
    resetEmailAction:"Back to login", backToLogin:"Back to login",
    confirm:"Check your email", confirmDesc:"We sent a confirmation link to",
    welcome:"Welcome", chooseGoal:"Your goal", choosePlan:"Choose plan",
    loading:"Loading...", createAccount:"Create account", signIn:"Sign in",
    name:"Your name", email:"Email", password:"Password",
    biological_sex:"Biological sex", male:"♂ Male", female:"♀ Female",
    online_search:"Online search", online_search_sub:"Open Food Facts · save to internal database",
    search_results:"{n} products found", no_results:"No results.",
    searching:"Searching...", search_hint:"Type the product name and press Search",
    save_food:"+ Save", saved_food:"✓ Saved",
    create_food:"Create food", values_per:"Nutritional values per",
    preview:"Preview", save_item:"Save food",
    fav_meals_title:"Saved meals",
    apply_fav:"Use", delete_fav:"✕",
    importDiet:"Import diet", importDietTitle:"Import diet from PDF",
    importDietDesc:"Upload your diet PDF. The AI reads the document and extracts meals automatically.",
    importBtn:"📄 Upload diet PDF",
    importAnalyzing:"Analysing document...",
    importSuccess:"Diet imported successfully!",
    importApply:"📅 Import to Weekly Plan",
    importReset:"Upload another PDF",
    importError:"Analysis failed. Make sure the PDF contains a meal plan.",
    importNote:"Works with any diet PDF: nutrition plans, dietitian prescriptions, weekly menus.",
    importMealsFound:"meals found",
    importFoodsIn:"foods in",
    dietProgress:"Diet progress",
    dietProgressTitle:"Diet progress",
    periodDay:"Today",periodWeek:"Week",periodMonth:"Month",
    totalCalories:"Total calories",totalProtein:"Total protein",totalCarbs:"Total carbs",totalFat:"Total fat",
    vsTarget:"vs target",avgPerDay:"Daily average",daysTracked:"Days tracked",
    confirmMeal:"✓ Confirmed",unconfirmMeal:"Confirm meal",confirmMealToast:"Meal confirmed",
    progressChart:"Calories last 7 days",noNutritionData:"No meals confirmed yet.",
    noNutritionDataDesc:"Confirm your meals every day to see statistics here.",
    motivationPerfect:"Perfect! You're nailing your goals. Keep it up!",
    motivationGood:"Great work! You're on track. A small adjustment and you'll hit the target.",
    motivationLow:"You're eating too little. Excessive deficit slows down your metabolism.",
    motivationHigh:"You're going over calories. Watch your portions and get back on track.",
    caloriesTarget:"Calorie target",
  },
};
function t(key, lang, vars) {
  // Supporta sia t(key) che t(key,lang) che t(key,vars)
  if(lang && typeof lang==="object" && !Array.isArray(lang)) { vars=lang; lang=null; }
  const L=lang||_lang;
  let str = (LANG[L]||LANG.it)[key] || (LANG.it[key]) || key;
  if(vars) Object.entries(vars).forEach(([k,v])=>{ str=str.replace("{"+k+"}",v); });
  return str;
}
function setLang(l) { _lang=l; localStorage.setItem("nc2-lang",l); }

// LANGUAGE SELECT SCREEN
function LangSelectScreen({ onSelect }) {
  const features = [
    { icon:"🎯", it:"Calcola calorie e macro in base ai tuoi dati reali", en:"Calculate calories and macros from your real data" },
    { icon:"🫙", it:"Credenza: costruisci pasti dagli alimenti di casa", en:"Pantry: build meals from foods you have at home" },
    { icon:"✨", it:"Piano pasti settimanale generato in automatico", en:"Auto-generated weekly meal plan" },
    { icon:"📦", it:"Milioni di alimenti — cerca o scansiona il barcode", en:"Millions of foods — search or scan barcodes" },
    { icon:"📊", it:"Progressi, diario alimentare e analisi BIA", en:"Progress tracking, food diary and BIA analysis" },
  ];
  return (
    <div style={{...ss, display:"flex", flexDirection:"column", justifyContent:"center", minHeight:"100vh", padding:"0 28px"}}>
      <style>{FONTS}</style>
      <div style={{maxWidth:430, margin:"0 auto", width:"100%", paddingTop:56, paddingBottom:56}}>
        <div style={{display:"flex", alignItems:"center", gap:16, marginBottom:10}}>
          <Logo size={56}/>
          <div>
            <div style={{fontSize:28, fontWeight:900, letterSpacing:-1, background:"linear-gradient(90deg,#2DD4BF,#60A5FA)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"}}>NutriCalc</div>
            <div style={{fontSize:12, color:C.mid, marginTop:2}}>Nutrition · Nutrizione</div>
          </div>
        </div>
        <div style={{fontSize:15, fontWeight:600, color:C.txt, marginBottom:28, opacity:0.7, fontStyle:"italic"}}>
          Eat smart. Live better. · Mangia bene. Vivi meglio.
        </div>
        <div style={{marginBottom:32}}>
          {features.map(({icon, it, en}) => (
            <div key={icon} style={{display:"flex", gap:14, marginBottom:14, alignItems:"flex-start"}}>
              <span style={{fontSize:18, flexShrink:0, marginTop:2}}>{icon}</span>
              <div>
                <div style={{fontSize:14, color:C.txt, fontWeight:600, lineHeight:1.4}}>{it}</div>
                <div style={{fontSize:12, color:C.mid, lineHeight:1.4}}>{en}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{fontSize:11, color:C.mid, textAlign:"center", marginBottom:14, letterSpacing:1, textTransform:"uppercase", fontWeight:700}}>
          Scegli la lingua · Choose your language
        </div>
        <div style={{display:"flex", gap:12}}>
          {[["it","🇮🇹","Italiano"],["en","🇬🇧","English"]].map(([l, flag, label]) => (
            <button key={l} onClick={()=>onSelect(l)} style={{flex:1, padding:"18px 12px", borderRadius:16, border:`1.5px solid ${C.bord2}`, background:C.card, color:C.txt, cursor:"pointer", fontFamily:ff, display:"flex", flexDirection:"column", alignItems:"center", gap:6, transition:"border-color .2s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.acc}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.bord2}>
              <span style={{fontSize:22}}>{flag}</span>
              <span style={{fontSize:13, fontWeight:700}}>{label}</span>
            </button>
          ))}
        </div>
        <div style={{marginTop:32, textAlign:"center", fontSize:11, color:C.mid, opacity:0.6}}>
          © 2025 Giovanni Guida · NutriCalc
        </div>
      </div>
    </div>
  );
}

// WELCOME SLIDESHOW
function getSlides(L) {
  return [
    {
      emoji:"🥗", color:"#00A84B",
      title: L==="en"?"Your personalized nutrition plan":"Il tuo piano nutrizionale su misura",
      text:  L==="en"?"NutriCalc calculates calories and macros based on your real data: weight, height, goal and activity level. No generic values.":"NutriCalc calcola calorie e macro in base ai tuoi dati reali: peso, altezza, obiettivo e livello di attività. Niente valori generici.",
    },
    {
      emoji:"🫙", color:"#2563EB",
      title: L==="en"?"Build your Pantry":"Crea la tua Credenza",
      text:  L==="en"?"Save foods you have at home with their quantities. The app uses them as the starting point to build your meals.":"Salva nella Credenza gli alimenti che hai in casa con le relative quantità. La app li usa come punto di partenza per costruire i tuoi pasti.",
    },
    {
      emoji:"✨", color:"#EA6C00",
      title: L==="en"?"Auto-generated meals":"Pasti generati automaticamente",
      text:  L==="en"?"With one tap, NutriCalc generates your meal using Pantry foods and calculates exact quantities to hit your macros.":"Con un solo tasto, NutriCalc genera la composizione del pasto usando gli alimenti della tua Credenza e calcola le quantità esatte per raggiungere i tuoi macro.",
    },
    {
      emoji:"📦", color:"#7C3AED",
      title: L==="en"?"Millions of foods at your fingertips":"Milioni di alimenti a portata di mano",
      text:  L==="en"?"Search any food by name or scan the barcode with your camera. Save frequently used products to your personal database.":"Cerca qualsiasi alimento per nome o scansiona il codice a barre con la fotocamera. Salva i prodotti che usi spesso nel tuo database personale.",
    },
    {
      emoji:"📊", color:"#DC2626",
      title: L==="en"?"Track your progress":"Monitora i tuoi progressi",
      text:  L==="en"?"Log your weight every week and follow the curve over time. Adjust your plan at any time: change calories and macro percentages as you like.":"Registra il peso ogni settimana e segui la curva nel tempo. Modifica il piano in qualsiasi momento: puoi aggiustare calorie e percentuali dei macro a tuo piacimento.",
    },
  ];
}

function WelcomeSlideshow({onDone}) {
  const [idx, setIdx] = useState(0);
  const L = _lang;
  const SLIDES = getSlides(L);
  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  return (
    <div style={{...ss, display:"flex", flexDirection:"column", minHeight:"100vh", padding:"0 28px"}}>
      <style>{FONTS}</style>
      {/* Skip */}
      <div style={{display:"flex", justifyContent:"flex-end", paddingTop:52, marginBottom:0}}>
        <button onClick={onDone} style={{background:"none", border:"none", color:C.mid, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:ff}}>{L==="en"?"Skip →":"Salta →"}</button>
      </div>

      {/* Slide content */}
      <div style={{flex:1, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", textAlign:"center", paddingBottom:40}}>
        <div style={{
          width:120, height:120, borderRadius:36, background:slide.color+"18",
          border:`2px solid ${slide.color}33`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:56, marginBottom:32,
          transition:"all .35s ease",
          animation:"fadeUp .4s ease",
        }}>
          {slide.emoji}
        </div>
        <div key={idx} style={{animation:"fadeUp .4s ease"}}>
          <div style={{fontSize:24, fontWeight:900, letterSpacing:-0.8, lineHeight:1.2, marginBottom:16, color:C.txt}}>
            {slide.title}
          </div>
          <div style={{fontSize:15, color:C.mid, lineHeight:1.7, maxWidth:320}}>
            {slide.text}
          </div>
        </div>
      </div>

      {/* Dots */}
      <div style={{display:"flex", justifyContent:"center", gap:8, marginBottom:24}}>
        {SLIDES.map((_, i) => (
          <div key={i} onClick={() => setIdx(i)} style={{
            width: i===idx ? 24 : 8, height:8, borderRadius:4,
            background: i===idx ? slide.color : C.bord,
            cursor:"pointer", transition:"all .3s ease",
          }}/>
        ))}
      </div>

      {/* Buttons */}
      <div style={{display:"flex", gap:10, paddingBottom:52}}>
        {idx > 0 && (
          <button onClick={()=>setIdx(i=>i-1)} style={{...bS, flex:1}}>{L==="en"?"← Back":"← Indietro"}</button>
        )}
        <button
          onClick={()=>{ if(isLast) onDone(); else setIdx(i=>i+1); }}
          style={{...bP, flex:2, background:slide.color}}
        >
          {isLast ? (L==="en"?"Start now 🚀":"Inizia subito 🚀") : (L==="en"?"Next →":"Avanti →")}
        </button>
      </div>
    </div>
  );
}

// AUTH SCREEN
function AuthScreen({onAuth}) {
  const [mode,setMode]=useState("login");
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const [confirmed,setConfirmed]=useState(false);
  const [resetSent,setResetSent]=useState(false);
  const [regLang,setRegLang]=useState(localStorage.getItem("nc2-lang")||"it");

  const submit = async () => {
    setErr(""); setLoading(true);
    try {
      if (mode==="login") {
        const {data,error:e}=await supabase.auth.signInWithPassword({email,password:pass});
        if (e) throw e;
        onAuth(data.user);
      } else {
        setLang(regLang); localStorage.setItem("nc2-lang",regLang);
        const {data,error:e}=await supabase.auth.signUp({email,password:pass,options:{data:{name}}});
        if (e) throw e;
        if (data.user?.identities?.length===0) throw new Error("Email già registrata. Accedi.");
        setConfirmed(true);
      }
    } catch(e) { setErr(e.message||"Errore. Riprova."); }
    setLoading(false);
  };
  const sendReset = async () => {
    if(!email) { setErr("Inserisci la tua email per recuperare la password."); return; }
    setLoading(true); setErr("");
    try {
      const {error:e}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});
      if(e) throw e;
      setResetSent(true);
    } catch(e) { setErr(e.message||"Errore. Riprova."); }
    setLoading(false);
  };

  const google = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin}});
  };

  if (resetSent) return (
    <div style={{...ss,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"0 32px",textAlign:"center"}}>
      <style>{FONTS}</style>
      <div style={{fontSize:52,marginBottom:20}}>🔑</div>
      <div style={{fontSize:22,fontWeight:800,marginBottom:12}}>{t("resetEmailSent",_lang)}</div>
      <div style={{fontSize:15,color:C.mid,lineHeight:1.6,marginBottom:28}}>Controlla la casella <strong style={{color:C.txt}}>{email}</strong> e clicca il link per reimpostare la password.</div>
      <button onClick={()=>{setResetSent(false);setMode("login");}} style={{...bS,width:"auto",padding:"12px 28px"}}>{t("backToLogin",_lang)}</button>
    </div>
  );

  if (confirmed) return (
    <div style={{...ss,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"0 32px",textAlign:"center"}}>
      <style>{FONTS}</style>
      <div style={{fontSize:52,marginBottom:20}}>📬</div>
      <div style={{fontSize:22,fontWeight:800,marginBottom:12}}>{t("confirm",_lang)}</div>
      <div style={{fontSize:15,color:C.mid,lineHeight:1.6,marginBottom:28}}>Abbiamo inviato un link di conferma a <strong style={{color:C.txt}}>{email}</strong>. Clicca il link per attivare il tuo account.</div>
      <button onClick={()=>{setConfirmed(false);setMode("login");}} style={{...bS,width:"auto",padding:"12px 28px"}}>{t("backToLogin",_lang)}</button>
    </div>
  );

  return (
    <div style={{...ss,display:"flex",flexDirection:"column",justifyContent:"center",minHeight:"100vh",position:"relative",overflow:"hidden"}}>
      <style>{FONTS}</style>
      {/* Decorative background glows */}
      <div style={{position:"absolute",top:"10%",left:"50%",transform:"translateX(-50%)",width:300,height:300,borderRadius:"50%",background:`radial-gradient(circle, ${C.acc}10 0%, transparent 65%)`,pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:"5%",right:"-20%",width:250,height:250,borderRadius:"50%",background:`radial-gradient(circle, ${C.blu}08 0%, transparent 65%)`,pointerEvents:"none"}}/>
      <div style={{padding:"0 28px",position:"relative",zIndex:1}}>
        {/* Logo & Branding */}
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:72,height:72,borderRadius:22,background:`linear-gradient(135deg,${C.acc}22,${C.blu}15)`,border:`1px solid ${C.acc}33`,marginBottom:16,boxShadow:`0 8px 32px ${C.acc}22`}}>
            <Logo size={44}/>
          </div>
          <div style={{fontSize:28,fontWeight:900,letterSpacing:-1,background:"linear-gradient(90deg,#2DD4BF,#60A5FA)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>NutriCalc</div>
          <div style={{fontSize:13,color:C.mid,marginTop:4,fontWeight:500,fontStyle:"italic"}}>{_lang==="en"?"Eat smart. Live better.":"Mangia bene. Vivi meglio."}</div>
        </div>

        <div style={{display:"flex",background:"rgba(255,255,255,.04)",borderRadius:16,padding:4,border:`1px solid ${C.bord}`,marginBottom:28}}>
          {[["login",t("signIn",_lang)],["register",t("register",_lang)]].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m);setErr("");}} style={{
              flex:1,padding:"11px 0",borderRadius:13,border:"none",
              background:mode===m?`linear-gradient(135deg,${C.card},${C.cardHi})`:"transparent",
              color:mode===m?C.txt:C.mid,
              fontWeight:800,cursor:"pointer",fontSize:14,fontFamily:ff,transition:"all .2s",
              boxShadow:mode===m?"0 2px 8px rgba(0,0,0,.3)":"none",
            }}>{l}</button>
          ))}
        </div>

        {mode==="register" && (
          <div style={{marginBottom:14}}>
            <Lbl>Il tuo nome</Lbl>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Come ti chiami?" style={inp}/>
          </div>
        )}
        <div style={{marginBottom:14}}>
          <Lbl>Email</Lbl>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nome@email.com" style={inp}/>
        </div>
        <div style={{marginBottom:mode==="login"?8:24}}>
          <Lbl>Password</Lbl>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" style={inp} onKeyDown={e=>e.key==="Enter"&&submit()}/>
        </div>
        {mode==="login"&&(
          <div style={{textAlign:"right",marginBottom:20}}>
            <button onClick={sendReset} style={{background:"none",border:"none",color:C.blu,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:ff}}>{t("forgotPassword",_lang)}</button>
          </div>
        )}
        {mode==="register"&&(
          <div style={{marginBottom:20}}>
            <Lbl>Lingua della app</Lbl>
            <div style={{display:"flex",gap:10}}>
              {[["it","🇮🇹 Italiano"],["en","🇬🇧 English"]].map(([l,lbl])=>(
                <button key={l} onClick={()=>setRegLang(l)} style={{flex:1,padding:"12px 0",borderRadius:14,border:`2px solid ${regLang===l?C.acc:C.bord}`,background:regLang===l?C.aLo:"transparent",color:regLang===l?C.acc:C.mid,fontWeight:700,cursor:"pointer",fontFamily:ff,fontSize:14}}>{lbl}</button>
              ))}
            </div>
          </div>
        )}
        {err && <div style={{background:C.rLo,border:`1px solid ${C.red}44`,borderRadius:14,padding:"12px 16px",color:C.red,fontSize:13,marginBottom:16,fontWeight:600}}>{err}</div>}
        <button onClick={submit} disabled={loading} style={{...bP,marginBottom:14,opacity:loading?.6:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {loading?<Spin size={18} color="#060A10"/>:mode==="login"?t("signIn",_lang):t("createAccount",_lang)}
        </button>
        {supabase && (
          <button onClick={google} style={{...bS,display:"flex",alignItems:"center",justifyContent:"center",gap:10,border:`1.5px solid ${C.bord2}`}}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continua con Google
          </button>
        )}
        {!supabase && <div style={{marginTop:20,padding:14,background:"rgba(255,255,255,.03)",borderRadius:14,border:`1px solid ${C.bord}`,fontSize:12,color:C.mid,lineHeight:1.7}}>Configura le variabili REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY per attivare il login.</div>}
        <div style={{marginTop:32,textAlign:"center",fontSize:11,color:C.mid,opacity:0.5}}>© 2025 Giovanni Guida · NutriCalc</div>
      </div>
    </div>
  );
}

// ONBOARDING (multi-step)
function OnboardingScreen({user,onComplete,isNewUser}) {
  const _l = localStorage.getItem("nc2-lang")||"it";
  // Lingua già scelta su LangSelectScreen — partiamo sempre dallo step 1
  const startStep = 1;
  const [step,setStep]=useState(startStep);
  const [selLang,setSelLang]=useState(_l);
  const [profile,setProfile]=useState({name:user?.user_metadata?.name||"",gender:"m",age:"",weight:"",height:"",bodyFat:"",activity:1.55,goal:"lose",numMeals:3,excludedFoods:[],bia_fm:"",bia_vf:"",bia_bmr:"",bia_ffm:"",bia_sc_fat:"",bia_smi:"",bia_whr:"",bia_smm:""});
  const [results,setResults]=useState(null);
  const [selectedProtocol,setSelectedProtocol]=useState(null);
  const p=(k,v)=>setProfile(prev=>({...prev,[k]:v}));
  // Step 1=Profilo, 2=Attività, 3=Obiettivo, 4=Pasti, 5=Esclusioni, 6=Risultati
  const STEPS = selLang==="en"
    ? ["Profile","Activity","Goal","Meals","Exclusions","Results"]
    : ["Profilo","Attività","Obiettivo","Pasti","Alimenti","Risultati"];

  const next=()=>{
    const lastDataStep = 4;
    if (step===lastDataStep) { const r=calcMacros(profile); setResults(r); }
    setStep(s=>Math.min(s+1, 6));
  };
  const prev=()=>setStep(s=>s>startStep?s-1:s);
  const done=()=>onComplete(profile,results,selectedProtocol);

  const stepValid=()=>{
    if(step===1) return profile.name&&profile.name.trim().length>=2&&profile.age&&profile.weight&&profile.height;
    return true;
  };

  const goal=GOALS.find(g=>g.val===profile.goal);

  return (
    <div style={{...ss,overflowY:"auto"}}>
      <style>{FONTS}</style>
      <div style={{padding:"52px 24px 48px"}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:36}}>
          <Logo size={44}/>
          <div>
            <div style={{fontSize:22,fontWeight:800}}>NutriCalc</div>
            <div style={{fontSize:12,color:C.mid}}>{selLang==="en"?"Step":"Passo"} {step} / {STEPS.length}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:36}}>
          {STEPS.map((s,i)=>(
            <div key={i} style={{flex:1,height:4,borderRadius:2,background:i<=(step-startStep)?C.acc:C.dim,transition:"background .3s"}}/>
          ))}
        </div>

        {step===1 && (
          <div style={{animation:"fadeUp .4s ease"}}>
            <div style={{fontSize:28,fontWeight:900,letterSpacing:-1,lineHeight:1.2,marginBottom:8}}>{selLang==="en"?"Hello!":"Benvenuto!"}</div>
            <div style={{fontSize:14,color:C.mid,marginBottom:24,lineHeight:1.6}}>{selLang==="en"?"Tell us your name first, then we will enter your physical data.":"Prima di tutto dimmi come ti chiami, poi inseriremo i tuoi dati fisici."}</div>
            <div style={{marginBottom:20}}>
              <Lbl>{selLang==="en"?"Your name":"Il tuo nome"}</Lbl>
              <input value={profile.name} onChange={e=>p("name",e.target.value)} placeholder={selLang==="en"?"Full name":"Nome e cognome"} style={inp}/>
            </div>
            <Lbl>{selLang==="en"?"Biological sex":"Sesso biologico"}</Lbl>
            <div style={{display:"flex",gap:10,marginBottom:20}}>
              {(selLang==="en"?[["m","♂ Male"],["f","♀ Female"]]:[["m","♂ Uomo"],["f","♀ Donna"]]).map(([v,l])=>(
                <button key={v} onClick={()=>p("gender",v)} style={{flex:1,padding:14,borderRadius:14,border:`2px solid ${profile.gender===v?C.acc:C.bord}`,background:profile.gender===v?C.aLo:"transparent",color:profile.gender===v?C.acc:C.mid,fontWeight:700,cursor:"pointer",fontSize:15,fontFamily:ff}}>{l}</button>
              ))}
            </div>
            {(selLang==="en"?[["age","Age","yrs"],["weight","Current weight","kg"],["height","Height","cm"]]:[["age","Età","anni"],["weight","Peso attuale","kg"],["height","Altezza","cm"]]).map(([k,l,u])=>(
              <div key={k} style={{marginBottom:14}}>
                <Lbl>{l}</Lbl>
                <div style={{display:"flex",alignItems:"center",background:C.surf,borderRadius:14,border:`1.5px solid ${C.bord}`}}>
                  <input type="number" value={profile[k]} onChange={e=>p(k,e.target.value)} placeholder="0" style={{flex:1,background:"none",border:"none",color:C.txt,padding:"14px 18px",fontSize:18,fontWeight:700,outline:"none",fontFamily:ff}}/>
                  <span style={{color:C.mid,paddingRight:18,fontSize:14}}>{u}</span>
                </div>
              </div>
            ))}
            <div style={{marginBottom:20}}>
              <Lbl>% Massa grassa <span style={{fontSize:11,fontWeight:400,textTransform:"none",letterSpacing:0,color:C.mid}}>{selLang==="en"?"(Optional)":"(Facoltativo)"}</span></Lbl>
              <div style={{display:"flex",alignItems:"center",background:C.surf,borderRadius:14,border:`1.5px solid ${C.bord}`}}>
                <input type="number" value={profile.bodyFat} onChange={e=>p("bodyFat",e.target.value)} placeholder="es. 20" style={{flex:1,background:"none",border:"none",color:C.txt,padding:"14px 18px",fontSize:18,fontWeight:700,outline:"none",fontFamily:ff}}/>
                <span style={{color:C.mid,paddingRight:18,fontSize:14}}>%</span>
              </div>
              {profile.bodyFat&&parseFloat(profile.bodyFat)>0&&profile.weight&&(
                <div style={{fontSize:12,color:C.mid,marginTop:6,paddingLeft:4}}>{selLang==="en"?"Estimated lean mass:":"Massa magra stimata:"} <strong style={{color:C.acc}}>{Math.round(parseFloat(profile.weight)*(1-parseFloat(profile.bodyFat)/100))} kg</strong></div>
              )}
            </div>
          </div>
        )}

        {step===2 && (
          <div style={{animation:"fadeUp .4s ease"}}>
            <div style={{fontSize:28,fontWeight:900,letterSpacing:-1,lineHeight:1.2,marginBottom:8}}>{selLang==="en"?"Activity level":"Livello di attività"}</div>
            <div style={{fontSize:14,color:C.mid,marginBottom:28,lineHeight:1.6}}>{selLang==="en"?"Indicate your average weekly physical activity level. This determines your TDEE.":"Indica il tuo livello medio settimanale di attività fisica. Questo determina il TDEE."}</div>
            {ACTIVITY_LEVELS.map(al=>(
              <div key={al.val} onClick={()=>p("activity",al.val)} style={{...cS,cursor:"pointer",border:`2px solid ${profile.activity===al.val?C.acc:C.bord}`,background:profile.activity===al.val?C.aLo:C.card,marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:15,marginBottom:2,color:profile.activity===al.val?C.acc:C.txt}}>{selLang==="en"?al.labelEn:al.labelIt}</div>
                    <div style={{fontSize:12,color:C.mid}}>{selLang==="en"?al.subEn:al.subIt}</div>
                  </div>
                  <div style={{fontSize:13,fontWeight:700,color:C.mid}}>×{al.val}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {step===3 && (
          <div style={{animation:"fadeUp .4s ease"}}>
            <div style={{fontSize:28,fontWeight:900,letterSpacing:-1,lineHeight:1.2,marginBottom:8}}>{selLang==="en"?"Your goal":"Il tuo obiettivo"}</div>
            <div style={{fontSize:14,color:C.mid,marginBottom:28,lineHeight:1.6}}>{selLang==="en"?"Choose what you want to achieve. The app calibrates calories and macros for each goal.":"Scegli cosa vuoi ottenere. La app calibra calorie e macro in modo specifico per ogni obiettivo."}</div>
            {GOALS.map(g=>(
              <div key={g.val} onClick={()=>p("goal",g.val)} style={{...cS,cursor:"pointer",border:`2px solid ${profile.goal===g.val?g.color:C.bord}`,background:profile.goal===g.val?g.color+"14":C.card,marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <span style={{fontSize:28}}>{g.icon}</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:16,color:profile.goal===g.val?g.color:C.txt,marginBottom:3}}>{selLang==="en"?g.labelEn:g.labelIt}</div>
                    <div style={{fontSize:12,color:C.mid}}>{selLang==="en"?g.subEn:g.subIt}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {step===4 && (
          <div style={{animation:"fadeUp .4s ease"}}>
            <div style={{fontSize:28,fontWeight:900,letterSpacing:-1,lineHeight:1.2,marginBottom:8}}>{selLang==="en"?"How many meals per day?":"Quanti pasti al giorno?"}</div>
            <div style={{fontSize:14,color:C.mid,marginBottom:28,lineHeight:1.6}}>{selLang==="en"?"Total calories and macros are distributed among your meals.":"Le calorie e i macro totali vengono suddivisi equamente tra i pasti che scegli."}</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {[1,2,3,4,5].map(n=>(
                <button key={n} onClick={()=>p("numMeals",n)} style={{flex:"1 0 calc(20% - 8px)",padding:"18px 0",borderRadius:16,border:`2px solid ${profile.numMeals===n?C.acc:C.bord}`,background:profile.numMeals===n?C.aLo:"transparent",color:profile.numMeals===n?C.acc:C.mid,fontWeight:800,cursor:"pointer",fontSize:20,fontFamily:ff}}>{n}</button>
              ))}
            </div>
            <div style={{marginTop:20,fontSize:12,color:C.mid,textAlign:"center"}}>
              {MEAL_CONFIGS[profile.numMeals].map(m=>selLang==="en"&&m.nameEn?m.nameEn:m.name).join(" · ")}
            </div>
          </div>
        )}

        {step===5 && (
          <div style={{animation:"fadeUp .4s ease"}}>
            <div style={{fontSize:28,fontWeight:900,letterSpacing:-1,lineHeight:1.2,marginBottom:8}}>{selLang==="en"?"Excluded foods":"Alimenti da escludere"}</div>
            <div style={{fontSize:14,color:C.mid,marginBottom:20,lineHeight:1.6}}>{selLang==="en"?"The app will never use these foods when generating automatic meal plans. Skip if you have no restrictions.":"La app non userà mai questi alimenti quando genera i piani automatici. Salta se non hai restrizioni."}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:8}}>
              {EXCLUSION_TAGS.map(tag=>{
                const sel=(profile.excludedFoods||[]).includes(tag.id);
                return (
                  <button key={tag.id} onClick={()=>p("excludedFoods",sel?(profile.excludedFoods||[]).filter(x=>x!==tag.id):[...(profile.excludedFoods||[]),tag.id])}
                    style={{padding:"8px 14px",borderRadius:20,border:`2px solid ${sel?C.red:C.bord}`,background:sel?C.rLo:C.surf,color:sel?C.red:C.mid,fontWeight:700,cursor:"pointer",fontFamily:ff,fontSize:13,display:"flex",alignItems:"center",gap:5}}>
                    <span>{tag.emoji}</span>{selLang==="en"?tag.labelEn:tag.label}
                    {sel&&<span style={{fontSize:11}}>✕</span>}
                  </button>
                );
              })}
            </div>
            {(profile.excludedFoods||[]).length>0&&(
              <div style={{...cS,background:C.rLo,border:`1px solid ${C.red}22`,marginTop:8,padding:"10px 14px"}}>
                <div style={{fontSize:12,color:C.red,fontWeight:700}}>{selLang==="en"?`${(profile.excludedFoods||[]).length} foods excluded from automatic generation`:`${(profile.excludedFoods||[]).length} alimenti esclusi dalla generazione automatica`}</div>
              </div>
            )}
          </div>
        )}

        {step===6 && results && (
          <div style={{animation:"fadeUp .4s ease"}}>
            <div style={{fontSize:28,fontWeight:900,letterSpacing:-1,lineHeight:1.2,marginBottom:6}}>{selLang==="en"?"Your plan":"Il tuo piano"}</div>
            <div style={{fontSize:14,color:C.mid,marginBottom:24}}>{selLang==="en"?"Method:":"Metodo:"} {results.method||"Mifflin-St Jeor"}{results.lbm>0?` · LBM: ${results.lbm} kg`:""}</div>
            <div style={{...cS,background:`linear-gradient(135deg, ${C.aLo2}, ${C.card})`,border:`1px solid ${C.acc}44`,marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:C.acc+"88",letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>{selLang==="en"?"Daily requirement":"Fabbisogno giornaliero"}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <span style={{color:C.mid,fontSize:13}}>BMR</span><span style={{fontWeight:700}}>{results.bmr} kcal</span>
              </div>
              {results.lbm>0&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <span style={{color:C.mid,fontSize:13}}>LBM</span><span style={{fontWeight:700}}>{results.lbm} kg</span>
              </div>}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <span style={{color:C.mid,fontSize:13}}>TDEE</span><span style={{fontWeight:700}}>{results.tdee} kcal</span>
              </div>
              <div style={{height:1,background:C.bord,margin:"12px 0"}}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{color:C.mid,fontSize:13}}>{selLang==="en"?"Goal":"Obiettivo"} ({selLang==="en"?goal?.labelEn:goal?.labelIt})</span>
                <span style={{fontWeight:800,fontSize:18,color:C.acc}}>{results.calories} kcal</span>
              </div>
            </div>
            <div style={{...cS,marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:C.mid,letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>{selLang==="en"?"Daily macros":"Macro giornalieri"}</div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                {[[selLang==="en"?"Protein":"Proteine",`${results.protein}g`,C.acc],[selLang==="en"?"Carbs":"Carboidrati",`${results.carbs}g`,C.blu],[selLang==="en"?"Fat":"Grassi",`${results.fat}g`,C.ora]].map(([l,v,c])=>(
                  <div key={l} style={{textAlign:"center"}}>
                    <div style={{fontSize:22,fontWeight:800,color:c}}>{v}</div>
                    <div style={{fontSize:11,color:C.mid,marginTop:3}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            {(()=>{
              const cfg=MEAL_CONFIGS[profile.numMeals]||MEAL_CONFIGS[3];
              const main=cfg.reduce((a,b)=>b.pct>a.pct?b:a);
              const mt=mealTarget(results,main.name,profile.numMeals);
              const mLabel=selLang==="en"?main.nameEn:main.name;
              return (
                <div style={{...cS,background:C.bLo,border:`1px solid ${C.blu}33`}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.blu+"88",letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>{selLang==="en"?`Main meal · ${mLabel}`:`Pasto principale · ${mLabel}`}</div>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    {[["kcal",mt.calories,C.txt],["Prot",mt.protein+"g",C.acc],["Carbo",mt.carbs+"g",C.blu],["Grassi",mt.fat+"g",C.ora]].map(([l,v,c])=>(
                      <div key={l} style={{textAlign:"center"}}>
                        <div style={{fontSize:18,fontWeight:800,color:c}}>{v}</div>
                        <div style={{fontSize:11,color:C.mid,marginTop:2}}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
            {results.calFloorActive&&<div style={{background:`${C.yel}18`,border:`1px solid ${C.yel}44`,borderRadius:12,padding:"10px 14px",color:C.yel,fontSize:12,marginTop:8}}>⚠️ {selLang==="en"?"Your calorie target has been raised to meet the safe minimum for your body size. Consider consulting a healthcare professional.":"Il target calorico è stato alzato al minimo sicuro per la tua corporatura. Considera di consultare un professionista della salute."}</div>}
            {results.carbsWarning&&<div style={{background:`${C.ora}18`,border:`1px solid ${C.ora}44`,borderRadius:12,padding:"10px 14px",color:C.ora,fontSize:12,marginTop:8}}>⚠️ {selLang==="en"?"Carbohydrate target is very low (<50g). This may cause fatigue. Consider increasing total calories or reducing protein.":"Target carboidrati molto basso (<50g). Potrebbe causare affaticamento. Considera di aumentare le calorie totali o ridurre le proteine."}</div>}
            {/* Selezione protocollo opzionale */}
            <div style={{marginTop:20}}>
              <div style={{fontSize:13,fontWeight:700,color:C.mid,marginBottom:12,letterSpacing:.5}}>
                {selLang==="en"?"Choose a dietary protocol (optional)":"Scegli un protocollo alimentare (opzionale)"}
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {PRESET_DIETS.map(d=>{
                  const sel=selectedProtocol?.id===d.id;
                  return (
                    <button key={d.id} onClick={()=>setSelectedProtocol(sel?null:d)}
                      style={{padding:"8px 14px",borderRadius:12,border:`2px solid ${sel?d.color:C.bord}`,background:sel?d.color+"22":"transparent",color:sel?d.color:C.mid,fontWeight:700,cursor:"pointer",fontFamily:ff,fontSize:12,display:"flex",alignItems:"center",gap:5}}>
                      <span>{d.emoji}</span>{selLang==="en"?d.type:d.name}
                      {sel&&<span style={{fontSize:10}}>✓</span>}
                    </button>
                  );
                })}
              </div>
              {selectedProtocol&&(
                <div style={{fontSize:11,color:C.mid,marginTop:8,lineHeight:1.5,padding:"8px 12px",background:C.surf,borderRadius:10,border:`1px solid ${C.bord}`}}>
                  {selectedProtocol.description}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{display:"flex",gap:10,marginTop:28}}>
          {step>startStep&&<button onClick={prev} style={{...bS,flex:1}}>{selLang==="en"?"← Back":"← Indietro"}</button>}
          {step<6
            ? <button onClick={next} disabled={!stepValid()} style={{...bP,flex:step>startStep?2:1,opacity:stepValid()?1:.4}}>{selLang==="en"?"Next →":"Avanti →"}</button>
            : <div style={{flex:2,display:"flex",flexDirection:"column",gap:10}}>
                <button onClick={done} style={{...bP,animation:"glow 2s ease-in-out infinite"}}>{selLang==="en"?"Start NutriCalc 🚀":"Inizia NutriCalc 🚀"}</button>
                <button onClick={()=>{setStep(2);setResults(null);}} style={{...bS,fontSize:13}}>🔄 {selLang==="en"?"Recalculate":"Ricalcola"}</button>
              </div>
          }
        </div>
      </div>
    </div>
  );
}

// WEIGHT PROMPT MODAL
function WeightModal({profile,onSave,onSkip,lang}) {
  const [w,setW]=useState("");
  const save=()=>{ const n=parseFloat(w); if (n&&n>30&&n<300) onSave(n); };
  return (
    <div style={{position:"fixed",inset:0,background:"#000a",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{background:C.surf,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:430,padding:"28px 24px 48px",border:`1px solid ${C.bord}`}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:40,marginBottom:10}}>⚖️</div>
          <div style={{fontSize:20,fontWeight:800,marginBottom:6}}>{lang==="en"?"Update weight":"Aggiorna il peso"}</div>
          <div style={{fontSize:14,color:C.mid,lineHeight:1.6}}>{lang==="en"?"7 days since your last measurement. How much do you weigh today?":"Sono passati 7 giorni dall'ultima misurazione. Quanto pesi oggi?"}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",background:C.card,borderRadius:14,border:`1.5px solid ${C.bord}`,marginBottom:16}}>
          <input type="number" value={w} onChange={e=>setW(e.target.value)} placeholder={profile.weight||"70"} style={{flex:1,background:"none",border:"none",color:C.txt,padding:"16px 18px",fontSize:22,fontWeight:700,outline:"none",fontFamily:ff,textAlign:"center"}} onKeyDown={e=>e.key==="Enter"&&save()}/>
          <span style={{color:C.mid,paddingRight:18,fontSize:16,fontWeight:600}}>kg</span>
        </div>
        <button onClick={save} disabled={!w} style={{...bP,marginBottom:10,opacity:w?.6:1}} >{w?(lang==="en"?"Save weight":"Salva peso"):(lang==="en"?"Enter weight":"Inserisci il peso")}</button>
        <button onClick={onSkip} style={{...bS}}>{lang==="en"?"Skip for now":"Salta per ora"}</button>
      </div>
    </div>
  );
}

// TODAY SCREEN
function TodayScreen({targets,mealList,meals,weeklyPlan,isCustomized,allTot,planMealTargets,profile,lang,weightLog,confirmedMeals,lockedMeals,onConfirmMeal,onUnlockMeal,onMealClick,onCustomize,onRegenFromPantry,onWeightUpdate,onPhotoMeal,pantry,customFoods,onSwapFood,onOpenPiano,onOpenImport,onOpenDiary}) {
  const [swapModal,setSwapModal]=useState(null); // {mealName, itemIndex, item}
  const [fabOpen,setFabOpen]=useState(false);
  const [chipDismissed,setChipDismissed]=useState(()=>!!LS.g("nc2-today-chip-seen"));
  useEffect(()=>{ return ()=>setFabOpen(false); },[]);
  // Chiudi il FAB quando TodayScreen viene rimontato o perde focus
  useEffect(()=>{ setFabOpen(false); },[]);
  const DAY_IT=["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"];
  const DAY_EN=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const todayLabel=new Date().toLocaleDateString(lang==="en"?"en-US":"it-IT",{weekday:"long",day:"numeric",month:"long"});
  const hour=new Date().getHours();
  const greet=hour<12?t("good_morning",lang):hour<18?t("good_afternoon",lang):t("good_evening",lang);
  const jsDay=new Date().getDay();
  const dayIdx=(jsDay+6)%7;
  const dayName=lang==="en"?DAY_EN[jsDay]:DAY_IT[jsDay];

  const planDay = weeklyPlan ? weeklyPlan[dayIdx] : null;
  const displayMeals = isCustomized ? meals : (planDay || meals);
  const activeMealNamesSet = new Set(mealList.map(m=>m.name));
  const planTot = mealList.length ? totals(Object.entries(displayMeals).filter(([k])=>activeMealNamesSet.has(k)).flatMap(([,v])=>v)) : allTot;

  // Target giornaliero: se esiste pianMealTargets somma i target per pasto (riflette la dieta importata)
  // altrimenti usa i target globali
  // effectiveTargets usa sempre targets direttamente.
  // planMealTargets serve solo per i target per-pasto, non per il totale giornaliero.
  const effectiveTargets = targets || { calories:0, protein:0, carbs:0, fat:0 };

  // Controlla se il peso è scaduto (>7 giorni) per mostrare banner
  const todayStr=localDateStr();
  const lastEntry=weightLog&&weightLog.length?weightLog[weightLog.length-1]:null;
  const daysSinceWeight=lastEntry?(new Date()-new Date(lastEntry.date))/(1000*60*60*24):999;
  const weightDue=daysSinceWeight>=7;
  const skippedToday=typeof localStorage!=="undefined"&&localStorage.getItem("nc2-weight-skip-date")===todayStr;
  const showWeightBanner=weightDue&&!skippedToday;

  return (
    <div style={{padding:"52px 20px 100px",overflowY:"auto"}}>
      {swapModal&&(
        <SwapFoodModal
          mealName={swapModal.mealName}
          itemIndex={swapModal.itemIndex}
          currentItem={swapModal.item}
          pantry={pantry||[]}
          customFoods={customFoods||[]}
          lang={lang}
          onClose={()=>setSwapModal(null)}
          onSwap={(newFood,newQty)=>{
            onSwapFood&&onSwapFood(swapModal.mealName,swapModal.itemIndex,newFood,newQty);
            setSwapModal(null);
          }}
        />
      )}
      {showWeightBanner&&(
        <div onClick={onWeightUpdate} style={{display:"flex",alignItems:"center",gap:12,background:`linear-gradient(135deg,${C.oLo},transparent)`,border:`1.5px solid ${C.ora}44`,borderRadius:16,padding:"13px 16px",marginBottom:16,cursor:"pointer",boxShadow:`0 4px 16px ${C.ora}18`}}>
          <div style={{width:38,height:38,borderRadius:12,background:`${C.ora}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>⚖️</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:800,fontSize:13,color:C.ora}}>{lang==="en"?"Time to update your weight":"Aggiorna il tuo peso"}</div>
            <div style={{fontSize:11,color:C.mid,marginTop:2}}>{lang==="en"?`Last update ${Math.floor(daysSinceWeight)} days ago`:`Ultimo aggiornamento ${Math.floor(daysSinceWeight)} giorni fa`}</div>
          </div>
          <div style={{width:28,height:28,borderRadius:8,background:`${C.ora}22`,display:"flex",alignItems:"center",justifyContent:"center",color:C.ora,fontSize:16,fontWeight:900}}>›</div>
        </div>
      )}

      {/* HERO HEADER */}
      <div style={{
        background:`linear-gradient(135deg, #142232 0%, #0A1520 50%, #142232 100%)`,
        borderRadius:24, border:`1px solid ${C.bord}`,
        padding:"20px 20px 18px", marginBottom:16,
        boxShadow:"0 8px 32px rgba(0,0,0,.4)",
        position:"relative", overflow:"hidden",
      }}>
        <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:`radial-gradient(circle, ${C.acc}18 0%, transparent 70%)`,pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-20,left:-10,width:80,height:80,borderRadius:"50%",background:`radial-gradient(circle, ${C.blu}12 0%, transparent 70%)`,pointerEvents:"none"}}/>
        <div style={{fontSize:12,color:C.mid,fontWeight:600,letterSpacing:.5,textTransform:"capitalize",marginBottom:6}}>{todayLabel}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:26,fontWeight:900,letterSpacing:-1,lineHeight:1.2,background:`linear-gradient(90deg,${C.txt},${C.mid})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
              {greet}
            </div>
            {profile.name&&<div style={{fontSize:22,fontWeight:900,letterSpacing:-0.8,color:C.acc}}>{profile.name.split(" ")[0]}</div>}
          </div>
          <button onClick={onCustomize} style={{
            padding:"9px 15px",borderRadius:14,
            border:`1.5px solid ${isCustomized?C.acc:C.bord2}`,
            background:isCustomized?`linear-gradient(135deg,${C.aLo2},${C.bLo})`:`rgba(255,255,255,.04)`,
            color:isCustomized?C.acc:C.mid,
            fontWeight:800,cursor:"pointer",fontFamily:ff,fontSize:12,flexShrink:0,
            boxShadow:isCustomized?`0 0 12px ${C.acc}44`:"none",
            transition:"all .2s",
          }}>
            {isCustomized?t("personalizzaOn",lang):t("personalizza",lang)}
          </button>
        </div>
        {!isCustomized&&planDay&&(
          <div style={{fontSize:11,color:C.mid,marginTop:8,display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:13}}>📅</span>
            <span>{lang==="en"?`${dayName}'s plan`:`Piano di ${dayName}`}</span>
          </div>
        )}
        {isCustomized&&(
          <div style={{fontSize:11,color:C.acc,marginTop:8,fontWeight:600}}>
            {lang==="en"?"Tap a meal to customize it":"Tocca un pasto per personalizzarlo"}
          </div>
        )}
      </div>

      {!chipDismissed&&<div style={{background:`${C.acc}12`,border:`1px solid ${C.acc}33`,borderRadius:14,padding:"11px 14px",marginBottom:14,display:"flex",alignItems:"flex-start",gap:10}}>
        <span style={{fontSize:16,flexShrink:0}}>💡</span>
        <div style={{flex:1,fontSize:12,color:C.txt,lineHeight:1.5}}>{lang==="en"?"These are today's planned meals. Tap a meal to view or edit it. Use \"📝 Edit today\" to log your own meals instead.":"Questi sono i pasti pianificati per oggi. Tocca un pasto per vederlo o modificarlo. Usa \"📝 Modifica giorno\" per inserire i tuoi pasti liberamente."}</div>
        <button onClick={()=>{setChipDismissed(true);LS.s("nc2-today-chip-seen",true);}} style={{background:"none",border:"none",color:C.mid,cursor:"pointer",fontSize:16,padding:"0 4px",flexShrink:0,fontFamily:ff}}>✕</button>
      </div>}

      {/* CALORIE HERO CARD */}
      <div style={{
        background:`linear-gradient(145deg, #152433 0%, #0C1A26 100%)`,
        borderRadius:24, border:`1px solid ${C.bord}`,
        padding:"22px 20px", marginBottom:14,
        boxShadow:`0 8px 32px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,.03) inset`,
        position:"relative",overflow:"hidden",
      }}>
        <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,borderRadius:"50%",background:`radial-gradient(circle, ${C.acc}10 0%, transparent 65%)`,pointerEvents:"none"}}/>
        <div style={{display:"flex",alignItems:"center",gap:20}}>
          <MacroRing cal={planTot.cal} target={effectiveTargets.calories}/>
          <div style={{flex:1}}>
            {[
              [t("goal",lang),`${effectiveTargets.calories}`,C.mid,"kcal"],
              [isCustomized?t("eaten",lang):(lang==="en"?"Planned":"Pianificate"),`${rnd(planTot.cal)}`,C.acc,"kcal"],
              [isCustomized?(t("remaining",lang)):(lang==="en"?"Difference":"Differenza"),`${Math.max(0,effectiveTargets.calories-rnd(planTot.cal))}`,effectiveTargets.calories-planTot.cal<0?C.red:C.blu,"kcal"],
            ].map(([l,v,c,unit])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,paddingBottom:10,borderBottom:`1px solid rgba(255,255,255,.04)`}}>
                <span style={{fontSize:12,color:C.mid,fontWeight:600}}>{l}</span>
                <div style={{display:"flex",alignItems:"baseline",gap:3}}>
                  <span style={{fontSize:16,fontWeight:900,color:c}}>{v}</span>
                  <span style={{fontSize:10,color:C.mid}}>{unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MACRO BARS CARD */}
      <div style={{
        background:`linear-gradient(145deg, #152433 0%, #0C1A26 100%)`,
        borderRadius:24, border:`1px solid ${C.bord}`,
        padding:"18px 20px", marginBottom:20,
        boxShadow:"0 4px 24px rgba(0,0,0,.35)",
      }}>
        <div style={{fontSize:11,fontWeight:800,color:C.mid,letterSpacing:1.2,textTransform:"uppercase",marginBottom:18}}>{t("daily_macros",lang)}</div>
        <MacroBar label={t("protein",lang)} val={rnd(planTot.p)} target={effectiveTargets.protein} color={C.acc}/>
        <MacroBar label={t("carbs",lang)} val={rnd(planTot.c)} target={effectiveTargets.carbs} color={C.blu}/>
        <MacroBar label={t("fat",lang)} val={rnd(planTot.f)} target={effectiveTargets.fat} color={C.ora}/>
      </div>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div style={{fontSize:17,fontWeight:900,letterSpacing:-0.3}}>{t("meals",lang,{n:mealList.length})}</div>
        <div style={{fontSize:11,color:C.mid,fontWeight:600}}>{lang==="en"?"tap to edit":"tocca per modificare"}</div>
      </div>

      {/* FAB Quick Actions */}
      {fabOpen&&(
        <div onClick={()=>setFabOpen(false)} onTouchStart={()=>setFabOpen(false)} style={{position:"fixed",inset:0,zIndex:60,background:"rgba(0,0,0,.6)",backdropFilter:"blur(4px)"}}/>
      )}
      {fabOpen&&(
        <div style={{position:"fixed",bottom:160,right:16,zIndex:61,display:"flex",flexDirection:"column",gap:10,alignItems:"flex-end"}}>
          {[
            [()=>{setFabOpen(false);onOpenPiano&&onOpenPiano();},"📅",lang==="en"?"Weekly Plan":"Piano settimanale",C.blu],
            [()=>{setFabOpen(false);onOpenImport&&onOpenImport();},"📥",lang==="en"?"Import Diet PDF":"Importa dieta PDF",C.yel],
            [()=>{setFabOpen(false);onOpenDiary&&onOpenDiary();},"📓",lang==="en"?"Food Diary":"Diario alimentare",C.ora],
          ].map(([fn,ic,lbl,col])=>(
            <button key={lbl} onClick={fn} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 18px",background:`linear-gradient(135deg,${C.card},${C.surf})`,border:`1.5px solid ${col}44`,borderRadius:18,color:C.txt,fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:ff,whiteSpace:"nowrap",boxShadow:`0 6px 24px rgba(0,0,0,.5), 0 0 0 1px ${col}22`}}>
              <span style={{fontSize:22,width:28,textAlign:"center"}}>{ic}</span>
              <span>{lbl}</span>
            </button>
          ))}
        </div>
      )}
      <button onClick={()=>setFabOpen(o=>!o)} style={{
        position:"fixed",bottom:94,right:16,zIndex:62,
        width:54,height:54,borderRadius:18,
        background:fabOpen?`${C.mid}`:` linear-gradient(135deg,${C.acc},#0EC060)`,
        border:"none",color:"#07100D",fontSize:28,fontWeight:900,
        cursor:"pointer",boxShadow:fabOpen?"0 4px 16px rgba(0,0,0,.4)":`0 6px 24px ${C.acc}66`,
        display:"flex",alignItems:"center",justifyContent:"center",fontFamily:ff,
        transition:"all .2s cubic-bezier(.4,0,.2,1)",
        transform:fabOpen?"rotate(45deg) scale(.95)":"rotate(0deg) scale(1)",
      }}>+</button>

      {mealList.map((meal,mIdx)=>{
        const {name,icon,time}=meal;
        const items=displayMeals[name]||[];
        const tot2=totals(items);
        const cnt=items.length;
        const displayName=_lang==="en"&&meal.nameEn?meal.nameEn:name;
        const mCol=C.mCol(name);
        const isConfirmed=confirmedMeals&&confirmedMeals[name];
        const isLocked=lockedMeals&&lockedMeals[name];
        return (
          <div key={name} onClick={()=>!isLocked&&onMealClick(name)}
            style={{
              background:`linear-gradient(145deg, ${C.card} 0%, ${C.surf} 100%)`,
              borderRadius:22,
              border:`1px solid ${C.bord}`,
              borderLeft:`3px solid ${isLocked?C.acc:mCol}`,
              padding:"16px 16px 16px 18px",
              marginBottom:12,
              cursor:isLocked?"default":"pointer",
              opacity:isLocked?0.9:1,
              boxShadow:isLocked?`0 4px 20px rgba(0,0,0,.3), 0 0 0 1px ${C.acc}22`:`0 4px 20px rgba(0,0,0,.3)`,
              animation:`cardIn .4s ${mIdx*60}ms both ease-out`,
              transition:"box-shadow .2s, border-color .2s",
            }}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:cnt>0&&!isCustomized?12:0}}>
              <div style={{display:"flex",alignItems:"center",gap:13}}>
                <div style={{
                  width:48,height:48,
                  background:`${mCol}18`,
                  borderRadius:16,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:24,border:`1.5px solid ${mCol}30`,flexShrink:0,
                  boxShadow:`0 4px 12px ${mCol}22`,
                }}>{icon}</div>
                <div>
                  <div style={{fontWeight:800,fontSize:15,letterSpacing:-0.3,marginBottom:3}}>{displayName}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{fontSize:11,color:C.mid,fontWeight:500}}>{cnt>0?`${cnt} ${lang==="en"?`item${cnt===1?"":"s"}`:`aliment${cnt===1?"o":"i"}`}`:time}</div>
                    {isLocked&&<div style={{fontSize:10,color:C.acc,fontWeight:800,background:`${C.acc}18`,border:`1px solid ${C.acc}44`,borderRadius:6,padding:"1px 7px"}}>🔒 OK</div>}
            {isConfirmed&&!isLocked&&<div style={{fontSize:10,color:C.acc,fontWeight:800,background:`${C.acc}18`,border:`1px solid ${C.acc}44`,borderRadius:6,padding:"1px 7px"}}>✓ OK</div>}
                  </div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {!isLocked&&<button onClick={e=>{e.stopPropagation();onPhotoMeal&&onPhotoMeal(name);}} style={{width:36,height:36,borderRadius:11,background:C.bLo,border:`1px solid ${C.blu}33`,color:C.blu,fontSize:17,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:ff}}>📷</button>}
                <div style={{textAlign:"right",minWidth:60}}>
                  <div style={{fontWeight:900,color:cnt>0?mCol:C.mid,fontSize:22,letterSpacing:-0.8,lineHeight:1}}>{cnt>0?rnd(tot2.cal):"—"}</div>
                  {cnt>0?<div style={{color:C.mid,fontSize:10,marginTop:3,fontWeight:600}}>P:{rnd(tot2.p)} C:{rnd(tot2.c)} G:{rnd(tot2.f)}</div>:<div style={{fontSize:10,color:C.mid,marginTop:3}}>kcal</div>}
                </div>
              </div>
            </div>
            {cnt>0&&(
              <div style={{paddingTop:12,borderTop:`1px solid rgba(255,255,255,.05)`}}>
                {items.slice(0,4).map((item,i)=>{
                  const div2=item.food.unit==="pz"?1:100;
                  const x2=item.quantity/div2;
                  return (
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:i<Math.min(3,items.length-1)?8:0,padding:"3px 0"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
                        <span style={{fontSize:15,flexShrink:0}}>{item.food.emoji}</span>
                        <span style={{fontSize:12,color:C.mid,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{getFoodName(item.food)}</span>
                        <span style={{fontSize:10,color:C.txt,background:"rgba(255,255,255,.07)",padding:"2px 7px",borderRadius:7,flexShrink:0,fontWeight:600}}>{item.quantity}{item.food.unit||"g"}</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginLeft:8}}>
                        <span style={{fontSize:11,color:mCol,fontWeight:800}}>{rnd(item.food.cal*x2)}</span>
                        {!isLocked&&<button
                          onClick={e=>{e.stopPropagation();setSwapModal({mealName:name,itemIndex:i,item});}}
                          style={{width:40,height:40,borderRadius:8,background:"rgba(255,255,255,.06)",border:`1px solid ${C.bord2}`,color:C.mid,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,fontFamily:ff,flexShrink:0}}
                        >⇄</button>}
                      </div>
                    </div>
                  );
                })}
                {items.length>4&&<div style={{fontSize:11,color:C.mid,marginTop:6,fontWeight:600}}>+{items.length-4} {lang==="en"?"more items":"altri alimenti"}</div>}
                <div style={{display:"flex",gap:8,marginTop:12}}>
                  {isLocked?(
                    <button
                      onClick={e=>{e.stopPropagation();onUnlockMeal&&onUnlockMeal(name);}}
                      style={{flex:1,padding:"10px 0",background:`${C.yLo}`,border:`1.5px solid ${C.yel}44`,borderRadius:13,color:C.yel,fontWeight:700,cursor:"pointer",fontFamily:ff,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}
                    >
                      🔓 {lang==="en"?"Unlock":"Sblocca"}
                    </button>
                  ):(
                    <button
                      onClick={e=>{e.stopPropagation();onRegenFromPantry(name);}}
                      style={{flex:1,padding:"10px 0",background:"rgba(255,255,255,.04)",border:`1.5px solid ${C.acc}33`,borderRadius:13,color:C.acc,fontWeight:700,cursor:"pointer",fontFamily:ff,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}
                    >
                      🫙 {lang==="en"?"Pantry":"Credenza"}
                    </button>
                  )}
                  <button
                    onClick={e=>{e.stopPropagation();onConfirmMeal(name,tot2);}}
                    style={{
                      flex:1,padding:"10px 0",
                      background:isConfirmed?`linear-gradient(135deg,${C.acc}28,${C.blu}18)`:`${C.acc}15`,
                      border:`1.5px solid ${isConfirmed?C.acc:C.acc+"44"}`,
                      borderRadius:13,
                      color:C.acc,fontWeight:800,cursor:"pointer",fontFamily:ff,fontSize:12,
                      display:"flex",alignItems:"center",justifyContent:"center",gap:5,
                      transition:"all .25s",
                      boxShadow:isConfirmed?`0 0 12px ${C.acc}44`:"none",
                    }}
                  >
                    {isConfirmed?"✓ "+t("confirmMeal",lang):t("unconfirmMeal",lang)}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


// SWAP FOOD MODAL
function SwapFoodModal({mealName, itemIndex, currentItem, pantry, customFoods, lang, onClose, onSwap}) {
  const div0 = currentItem.food.unit === "pz" ? 1 : 100;
  const targetCal = currentItem.food.cal * (currentItem.quantity / div0);
  const [search, setSearch] = useState("");
  const [selCat, setSelCat] = useState("all");
  const [swapSource, setSwapSource] = useState(pantry&&pantry.length>0?"pantry":"db"); // pantry | db
  const [dbCat, setDbCat] = useState("Proteine");

  // Categorie per grouping — riusa la stessa logica di CredenzaScreen
  const getSwapCat=(food)=>{
    const n=(food.name||"").toLowerCase();
    const isVeg=["broccoli","spinaci","zucchine","zucchina","pomodor","insalata","lattuga","cavolo","peperone","peperoni","melanzana","cetriolo","cavolfiore","carciofo","carota","carote","bietola","sedano","finocchio","asparagi","verdur","rucola","radicchio","funghi","fagiolini","piselli","cipolla","aglio","porro","basilico","prezzemolo","rosmarino","salvia","menta","timo","barbabietola","edamame","germogli","mais","crescione"].some(k=>n.includes(k));
    const isFruit=["mela","pera","banana","arancia","fragol","kiwi","ananas","uva","melone","anguria","albicocca","mango","mirtill","lamponi","more","ciliegie","pesca","prugna","fico","cachi","dattero","melograno","papaya","lime","limone"].some(k=>n.includes(k));
    if(isVeg||isFruit) return "V";
    const cal=food.cal||1; const pPct=(food.p*4)/cal; const cPct=(food.c*4)/cal; const fPct=(food.f*9)/cal;
    if(pPct>=0.28) return "P";
    if(fPct>=0.40) return "G";
    if(cPct>=0.40) return "C";
    return "A";
  };

  const SWAP_CATS=[
    {key:"all", labelIt:"Tutti", labelEn:"All", emoji:"🫙"},
    {key:"P",   labelIt:"Proteine",   labelEn:"Proteins",    emoji:"🥩"},
    {key:"C",   labelIt:"Carboidrati",labelEn:"Carbs",       emoji:"🌾"},
    {key:"G",   labelIt:"Grassi",     labelEn:"Fats",        emoji:"🫒"},
    {key:"V",   labelIt:"Frutta/Verd",labelEn:"Fruit/Veg",   emoji:"🥦"},
    {key:"A",   labelIt:"Altro",      labelEn:"Other",       emoji:"🍽️"},
  ];

  // Calcola quantità equivalente per ogni alimento in credenza
  const calcEntry=(pantryEntry)=>{
    const food=pantryEntry.food;
    const calPer=food.cal;
    let newQty, incompatible=false, reason="";
    if(!calPer||calPer<=0){
      incompatible=true; newQty=10;
      reason=lang==="en"?"No calorie data":"Dati calorici assenti";
    } else if(food.unit==="pz"){
      newQty=Math.round(targetCal/calPer);
      if(newQty<1){newQty=1;incompatible=true;reason=lang==="en"?"Too caloric/piece":"Troppo calorico per pz";}
      if(newQty>20){newQty=20;incompatible=true;reason=lang==="en"?"Too many pieces":"Troppi pezzi necessari";}
    } else {
      newQty=Math.round((targetCal/calPer)*100);
      if(newQty<10){newQty=10;incompatible=true;reason=lang==="en"?"Too caloric":"Troppo calorico";}
      if(newQty>800){newQty=800;incompatible=true;reason=lang==="en"?"Too much quantity":"Quantità troppo alta";}
    }
    const isExhausted=pantryEntry.qty<=0;
    const isLow=!isExhausted&&pantryEntry.qty<100;
    return {food, newQty, incompatible, reason, isExhausted, isLow, pantryQty:pantryEntry.qty};
  };

  // Tutti gli alimenti in credenza (escluso quello corrente, inclusi esauriti)
  const allCandidates=pantry
    .filter(p=>p.food.name!==currentItem.food.name)
    .map(calcEntry);

  // Filtra per ricerca + categoria
  const filtered=allCandidates.filter(c=>{
    const matchSearch=c.food.name.toLowerCase().includes(search.toLowerCase())||(c.food.nameEn&&c.food.nameEn.toLowerCase().includes(search.toLowerCase()));
    const matchCat=selCat==="all"||getSwapCat(c.food)===selCat;
    return matchSearch&&matchCat;
  });

  // Categorie presenti nella credenza (per mostrare solo tab rilevanti)
  const presentCats=new Set(allCandidates.map(c=>getSwapCat(c.food)));
  const visibleCats=SWAP_CATS.filter(c=>c.key==="all"||presentCats.has(c.key));

  // DB foods for swap: ALL_FOODS + customFoods, filtered
  const allDbFoods = [...ALL_FOODS,...(customFoods||[])];
  const dbCats = Object.keys(FOODS);
  const dbFiltered = dbCat==="__custom__"?(customFoods||[])
    : search.length>=2 ? allDbFoods.filter(f=>f.name.toLowerCase().includes(search.toLowerCase())||(f.nameEn&&f.nameEn.toLowerCase().includes(search.toLowerCase()))).slice(0,40)
    : (FOODS[dbCat]||[]);
  const calcDbEntry=(food)=>{
    const calPer=food.cal; let newQty, incompatible=false, reason="";
    if(!calPer||calPer<=0){incompatible=true;newQty=100;reason=lang==="en"?"No calorie data":"Dati assenti";}
    else if(food.unit==="pz"){newQty=Math.max(1,Math.round(targetCal/calPer));if(newQty>20){newQty=20;incompatible=true;}}
    else{newQty=Math.round((targetCal/calPer)*100);if(newQty<10){newQty=10;incompatible=true;}if(newQty>800){newQty=800;incompatible=true;}}
    return {food,newQty,incompatible,reason,isExhausted:false,isLow:false};
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",flexDirection:"column",background:"rgba(0,0,0,0.72)"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{marginTop:"auto",background:C.surf,borderRadius:"24px 24px 0 0",border:`1px solid ${C.bord}`,maxHeight:"85vh",display:"flex",flexDirection:"column"}}>
        {/* Header */}
        <div style={{padding:"20px 20px 0",flexShrink:0}}>
          <div style={{width:40,height:4,borderRadius:4,background:C.bord2,margin:"0 auto 16px"}}/>
          <div style={{fontWeight:800,fontSize:16,marginBottom:4}}>{lang==="en"?"Swap food":"Cambia alimento"}</div>
          <div style={{fontSize:12,color:C.mid,marginBottom:12}}>
            {lang==="en"?`Replacing: ${currentItem.food.emoji} ${getFoodName(currentItem.food)} · ~${Math.round(targetCal)} kcal`:`Sostituisci: ${currentItem.food.emoji} ${currentItem.food.name} · ~${Math.round(targetCal)} kcal`}
          </div>
          {/* Source selector */}
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            {[["pantry","🫙 "+(lang==="en"?"Pantry":"Credenza")],["db","📋 "+(lang==="en"?"Database":"Database")]].map(([src,lbl])=>(
              <button key={src} onClick={()=>setSwapSource(src)}
                style={{flex:1,padding:"9px 0",borderRadius:12,border:`2px solid ${swapSource===src?C.acc:C.bord}`,background:swapSource===src?C.aLo:"transparent",color:swapSource===src?C.acc:C.mid,fontWeight:700,cursor:"pointer",fontFamily:ff,fontSize:13}}>
                {lbl}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder={swapSource==="pantry"?(lang==="en"?"Search pantry...":"Cerca in credenza..."):(lang==="en"?"Search database...":"Cerca nel database...")}
            style={{...inp,marginBottom:10,fontSize:14}}
            autoFocus
          />
          {/* Category tabs */}
          {swapSource==="pantry"?(
            <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:12,marginLeft:-4,paddingLeft:4}}>
              {visibleCats.map(cat=>(
                <button key={cat.key} onClick={()=>setSelCat(cat.key)}
                  style={{padding:"6px 12px",borderRadius:16,border:"none",background:selCat===cat.key?C.acc:C.card,color:selCat===cat.key?"#0D1117":C.mid,fontWeight:700,cursor:"pointer",fontSize:11,whiteSpace:"nowrap",fontFamily:ff,flexShrink:0}}>
                  {cat.emoji} {lang==="en"?cat.labelEn:cat.labelIt}
                </button>
              ))}
            </div>
          ):(
            <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:12,marginLeft:-4,paddingLeft:4}}>
              {[...dbCats,...((customFoods&&customFoods.length>0)?["__custom__"]:[])]
                .filter(c=>search.length<2?true:true)
                .slice(0,search.length>=2?1:20)
                .map(c=>(
                  search.length>=2?null:
                  <button key={c} onClick={()=>setDbCat(c)}
                    style={{padding:"6px 12px",borderRadius:16,border:"none",background:dbCat===c?C.acc:C.card,color:dbCat===c?"#0D1117":C.mid,fontWeight:700,cursor:"pointer",fontSize:11,whiteSpace:"nowrap",fontFamily:ff,flexShrink:0}}>
                    {c==="__custom__"?("⭐ "+(lang==="en"?"Mine":"Miei")):getCatName(c)}
                  </button>
                )).filter(Boolean)}
              {search.length>=2&&<span style={{fontSize:12,color:C.mid,padding:"6px 0"}}>{dbFiltered.length} risultati</span>}
            </div>
          )}
        </div>
        {/* Lista alimenti */}
        <div style={{overflowY:"auto",padding:"0 20px 32px"}}>
          {swapSource==="pantry"?(
          <>
          {filtered.length===0&&(
            <div style={{textAlign:"center",color:C.mid,fontSize:13,padding:"24px 0"}}>
              {lang==="en"?"No items found":"Nessun alimento trovato"}<br/>
              <button onClick={()=>setSwapSource("db")} style={{marginTop:10,padding:"8px 16px",background:C.aLo,border:`1px solid ${C.acc}44`,borderRadius:10,color:C.acc,fontWeight:700,cursor:"pointer",fontFamily:ff,fontSize:12}}>
                {lang==="en"?"Search in database":"Cerca nel database"}
              </button>
            </div>
          )}
          {filtered.map((c,i)=>{
            const borderCol=c.isExhausted?C.red:c.isLow?C.yel:C.bord;
            const bgCol=c.isExhausted?`${C.red}0A`:c.isLow?`${C.yel}08`:C.card;
            return (
              <div key={i} onClick={()=>!c.isExhausted&&onSwap(c.food, c.newQty)}
                style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                  padding:"12px 14px",borderRadius:14,background:bgCol,
                  border:`1.5px solid ${borderCol}`,marginBottom:8,
                  cursor:c.isExhausted?"not-allowed":"pointer",
                  opacity:c.isExhausted?0.55:1}}>
                <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}>
                  <span style={{fontSize:20}}>{c.food.emoji}</span>
                  <div style={{minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                      <span style={{fontWeight:700,fontSize:13,color:c.isExhausted?C.mid:C.txt}}>{getFoodName(c.food)}</span>
                      {c.isExhausted&&<span style={{fontSize:9,fontWeight:800,color:C.red,background:`${C.red}20`,borderRadius:5,padding:"1px 5px"}}>ESAURITO</span>}
                      {c.isLow&&<span style={{fontSize:9,fontWeight:800,color:C.yel,background:`${C.yel}20`,borderRadius:5,padding:"1px 5px"}}>⚠ {c.pantryQty}g</span>}
                      {c.incompatible&&!c.isExhausted&&<span style={{fontSize:9,color:C.red,background:`${C.red}18`,borderRadius:5,padding:"1px 5px"}}>⚠ {c.reason}</span>}
                    </div>
                    <div style={{fontSize:11,color:C.mid,marginTop:1}}>
                      {c.food.cal} {c.food.unit==="pz"?"kcal/pz":"kcal/100g"}
                      {!c.isExhausted&&<span style={{marginLeft:6,color:C.mid}}>· disp. {c.pantryQty}{c.food.unit||"g"}</span>}
                    </div>
                  </div>
                </div>
                {!c.isExhausted&&(
                  <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
                    <div style={{fontWeight:800,fontSize:15,color:c.incompatible?C.red:C.acc}}>
                      {c.newQty}{c.food.unit||"g"}
                    </div>
                    <div style={{fontSize:10,color:C.mid}}>{Math.round(c.food.cal*(c.newQty/100))} kcal</div>
                  </div>
                )}
              </div>
            );
          })}
          </>
          ):(
            <>
            {dbFiltered.length===0&&(
              <div style={{textAlign:"center",color:C.mid,fontSize:13,padding:"24px 0"}}>{lang==="en"?"No results":"Nessun risultato"}</div>
            )}
            {dbFiltered.map((food,i)=>{
              const c=calcDbEntry(food);
              return (
                <div key={i} onClick={()=>onSwap(food,c.newQty)}
                  style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",borderRadius:14,background:C.card,border:`1.5px solid ${C.bord}`,marginBottom:8,cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}>
                    <span style={{fontSize:20}}>{food.emoji}</span>
                    <div style={{minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:13,color:C.txt,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{getFoodName(food)}</div>
                      <div style={{fontSize:11,color:C.mid}}>P:{food.p}g · C:{food.c}g · G:{food.f}g</div>
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
                    <div style={{fontWeight:800,fontSize:14,color:c.incompatible?C.yel:C.acc}}>{c.newQty}{food.unit||"g"}</div>
                    <div style={{fontSize:10,color:C.mid}}>{Math.round(food.cal*(c.newQty/100))} kcal</div>
                  </div>
                </div>
              );
            })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// DIET LIBRARY SCREEN
function DietLibraryScreen({weeklyPlan, savedPlans, lang, onApplyPreset, onSaveCurrentPlan, onDeleteSavedPlan, onApplySaved, onBack}) {
  const [view, setView] = useState("list"); // list | detail
  const [selDiet, setSelDiet] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);

  const MacroPill = ({label, pct, color}) => (
    <div style={{display:"flex",alignItems:"center",gap:4}}>
      <div style={{width:8,height:8,borderRadius:"50%",background:color,flexShrink:0}}/>
      <span style={{fontSize:10,color:C.mid}}>{label} {pct}%</span>
    </div>
  );

  if (view === "detail" && selDiet) {
    const d = selDiet;
    return (
      <div style={{padding:"52px 20px 100px",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
          <BackBtn onClick={()=>setView("list")}/>
          <div style={{fontSize:19,fontWeight:800}}>{d.emoji} {d.name}</div>
        </div>
        <div style={{...cS,background:`linear-gradient(135deg,${d.color}18,${C.card})`,border:`1.5px solid ${d.color}44`,marginBottom:16}}>
          <div style={{display:"inline-block",background:`${d.color}22`,border:`1px solid ${d.color}44`,borderRadius:20,padding:"3px 12px",fontSize:11,fontWeight:700,color:d.color,marginBottom:12}}>{lang==="en"?d.typeEn:d.type}</div>
          <div style={{fontSize:28,fontWeight:900,marginBottom:4,color:C.txt}}>~{d.avgCal} <span style={{fontSize:14,fontWeight:500,color:C.mid}}>{lang==="en"?"kcal/day":"kcal/giorno"}</span></div>
          <div style={{fontSize:13,color:C.mid,lineHeight:1.6,marginBottom:16}}>{lang==="en"?d.descriptionEn:d.description}</div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <MacroPill label="Prot" pct={d.macroRatio.p} color={C.acc}/>
            <MacroPill label={lang==="en"?"Carbs":"Carbo"} pct={d.macroRatio.c} color={C.blu}/>
            <MacroPill label={lang==="en"?"Fats":"Grassi"} pct={d.macroRatio.f} color={C.ora}/>
          </div>
        </div>
        <div style={{...cS,marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:700,color:C.mid,letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>{lang==="en"?"Sample plan (3 of 7 days)":"Esempio piano (3 giorni su 7)"}</div>
          {d.patterns.slice(0,3).map((pat, pi) => (
            <div key={pi} style={{marginBottom:pi<2?16:0}}>
              <div style={{fontSize:11,fontWeight:700,color:d.color,marginBottom:6}}>{lang==="en"?"Day":"Giorno"} {pi+1}</div>
              {Object.entries(pat).slice(0,3).map(([slot, foods]) => (
                <div key={slot} style={{display:"flex",gap:6,marginBottom:4,flexWrap:"wrap"}}>
                  <span style={{fontSize:10,color:C.mid,minWidth:60}}>{lang==="en"?"Meal":"Pasto"} {parseInt(slot)+1}</span>
                  <span style={{fontSize:11,color:C.txt}}>{foods.join(", ")}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <button onClick={()=>onApplyPreset(d)} style={{...bP,marginBottom:0}}>
          ✅ {lang==="en"?"Use this diet":"Usa questa dieta"}
        </button>
      </div>
    );
  }

  return (
    <div style={{padding:"52px 20px 100px",overflowY:"auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <BackBtn onClick={onBack}/>
        <div>
          <div style={{fontSize:19,fontWeight:800}}>📚 {lang==="en"?"Diet Library":"Libreria Diete"}</div>
          <div style={{fontSize:12,color:C.mid,marginTop:2}}>{lang==="en"?"Preset diets and your saved plans":"Diete preimpostate e piani salvati"}</div>
        </div>
      </div>

      {/* Salva piano corrente */}
      {weeklyPlan && (
        <div style={{...cS,background:`${C.acc}10`,border:`1.5px solid ${C.acc}33`,marginBottom:20}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>{lang==="en"?"Save current plan":"Salva piano attuale"}</div>
          <div style={{fontSize:12,color:C.mid,marginBottom:10}}>{lang==="en"?"Save the current 7-day plan to reuse it later":"Salva il piano attuale di 7 giorni per riutilizzarlo"}</div>
          {showSaveInput ? (
            <div style={{display:"flex",gap:8}}>
              <input value={saveName} onChange={e=>setSaveName(e.target.value)}
                placeholder={lang==="en"?"Plan name...":"Nome del piano..."}
                style={{...inp,flex:1,fontSize:13,padding:"10px 14px"}}
                autoFocus
              />
              <button onClick={async()=>{
                if(!saveName.trim()) return;
                setSaving(true);
                await onSaveCurrentPlan(saveName.trim());
                setSaveName(""); setShowSaveInput(false); setSaving(false);
              }} style={{padding:"10px 18px",background:C.acc,border:"none",borderRadius:12,color:"#0D1117",fontWeight:800,cursor:"pointer",fontFamily:ff,fontSize:13}}>
                {saving?"...":lang==="en"?"Save":"Salva"}
              </button>
              <button onClick={()=>{setShowSaveInput(false);setSaveName("");}} style={{padding:"10px 14px",background:C.surf,border:`1px solid ${C.bord}`,borderRadius:12,color:C.mid,cursor:"pointer",fontFamily:ff,fontSize:13}}>✕</button>
            </div>
          ) : (
            <button onClick={()=>setShowSaveInput(true)} style={{...bS,padding:"11px 0",fontSize:13}}>
              💾 {lang==="en"?"Save plan":"Salva piano"}
            </button>
          )}
        </div>
      )}

      {/* Piani salvati */}
      {savedPlans && savedPlans.length > 0 && (
        <div style={{marginBottom:24}}>
          <div style={{fontSize:13,fontWeight:800,color:C.mid,letterSpacing:0.5,textTransform:"uppercase",marginBottom:12}}>
            {lang==="en"?"Your saved plans":"I tuoi piani salvati"}
          </div>
          {savedPlans.map(sp => (
            <div key={sp.id} style={{...cS,marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontWeight:700,fontSize:14}}>{sp.name}</div>
                <div style={{fontSize:11,color:C.mid,marginTop:2}}>{new Date(sp.createdAt).toLocaleDateString("it-IT",{day:"numeric",month:"short",year:"numeric"})}</div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>onApplySaved(sp)} style={{padding:"8px 14px",background:C.aLo,border:`1px solid ${C.acc}44`,borderRadius:10,color:C.acc,fontWeight:700,cursor:"pointer",fontSize:12,fontFamily:ff}}>
                  {lang==="en"?"Load":"Carica"}
                </button>
                <button onClick={()=>onDeleteSavedPlan(sp.id)} style={{padding:"8px 10px",background:C.rLo,border:`1px solid ${C.red}44`,borderRadius:10,color:C.red,fontWeight:700,cursor:"pointer",fontSize:12,fontFamily:ff}}>
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Diete preimpostate */}
      <div style={{fontSize:13,fontWeight:800,color:C.mid,letterSpacing:0.5,textTransform:"uppercase",marginBottom:12}}>
        {lang==="en"?"Preset diets":"Diete preimpostate"}
      </div>
      {PRESET_DIETS.map(d => (
        <div key={d.id} onClick={()=>{setSelDiet(d);setView("detail");}}
          style={{...cS,marginBottom:10,cursor:"pointer",background:`linear-gradient(135deg,${d.color}10,${C.card})`,border:`1px solid ${d.color}30`,transition:"border .15s"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:48,height:48,borderRadius:14,background:`${d.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{d.emoji}</div>
              <div>
                <div style={{fontWeight:800,fontSize:15}}>{d.name}</div>
                <div style={{display:"inline-block",background:`${d.color}22`,border:`1px solid ${d.color}44`,borderRadius:20,padding:"2px 10px",fontSize:10,fontWeight:700,color:d.color,marginTop:4}}>{lang==="en"?d.typeEn:d.type}</div>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontWeight:800,fontSize:17,color:d.color}}>~{d.avgCal}</div>
              <div style={{fontSize:10,color:C.mid}}>{lang==="en"?"kcal/day":"kcal/giorno"}</div>
            </div>
          </div>
          <div style={{fontSize:12,color:C.mid,lineHeight:1.5,marginBottom:10}}>{lang==="en"?d.descriptionEn:d.description}</div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",borderTop:`1px solid ${C.dim}`,paddingTop:8}}>
            <MacroPill label="Prot" pct={d.macroRatio.p} color={C.acc}/>
            <MacroPill label={lang==="en"?"Carbs":"Carbo"} pct={d.macroRatio.c} color={C.blu}/>
            <MacroPill label={lang==="en"?"Fats":"Grassi"} pct={d.macroRatio.f} color={C.ora}/>
            <span style={{marginLeft:"auto",fontSize:11,color:d.color,fontWeight:700}}>{lang==="en"?"Details ›":"Dettagli ›"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// CREA ALIMENTO
function CreateFoodScreen({onBack,onSave,lang="it"}) {
  const [form,setForm]=useState({name:"",emoji:"🍽️",cal:"",p:"",c:"",f:"",unit:"g"});
  const [err,setErr]=useState("");
  const f=(k,v)=>setForm(prev=>({...prev,[k]:v}));
  const emojis=["🍽️","🥩","🐟","🥚","🥗","🌾","🥛","🥦","🍎","🥜","🫒","🍞","🧀","🫙","🍚","🍝","🥔","📦"];
  const save=()=>{
    if(!form.name.trim()){setErr(lang==="en"?"Enter the food name.":"Inserisci il nome dell'alimento.");return;}
    if(!form.cal||isNaN(form.cal)){setErr(lang==="en"?"Enter the calories.":"Inserisci le calorie.");return;}
    const food={
      name:form.name.trim(), emoji:form.emoji,
      cal:parseFloat(form.cal)||0, p:parseFloat(form.p)||0,
      c:parseFloat(form.c)||0, f:parseFloat(form.f)||0,
      unit:form.unit, source:"custom",
    };
    onSave(food);
  };
  return (
    <div style={{...ss,overflowY:"auto"}}>
      <style>{FONTS}</style>
      <div style={{padding:"52px 20px 60px"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
          <BackBtn onClick={onBack}/>
          <div>
            <div style={{fontSize:19,fontWeight:800}}>{lang==="en"?"Create food":"Crea alimento"}</div>
            <div style={{fontSize:11,color:C.mid,marginTop:1}}>{lang==="en"?"Values per 100g/ml · or per 1 piece (pz)":"Valori per 100g/ml · oppure per 1 pezzo (pz)"}</div>
          </div>
        </div>
        <div style={{marginBottom:16}}>
          <Lbl>Emoji</Lbl>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:4}}>
            {emojis.map(e=>(
              <button key={e} onClick={()=>f("emoji",e)} style={{width:40,height:40,borderRadius:10,border:`2px solid ${form.emoji===e?C.acc:C.bord}`,background:form.emoji===e?C.aLo:C.surf,fontSize:20,cursor:"pointer"}}>{e}</button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:14}}>
          <Lbl>{lang==="en"?"Food name":"Nome alimento"}</Lbl>
          <input value={form.name} onChange={e=>f("name",e.target.value)} placeholder={lang==="en"?"e.g. Homemade cheesecake":"es. Pastiera napoletana"} style={inp}/>
        </div>
        <div style={{marginBottom:14}}>
          <Lbl>{lang==="en"?"Unit of measure":"Unità di misura"}</Lbl>
          <div style={{display:"flex",gap:8}}>
            {["g","ml","pz"].map(u=>(
              <button key={u} onClick={()=>f("unit",u)} style={{flex:1,padding:"12px 0",borderRadius:12,border:`2px solid ${form.unit===u?C.acc:C.bord}`,background:form.unit===u?C.aLo:C.surf,color:form.unit===u?C.acc:C.mid,fontWeight:700,cursor:"pointer",fontFamily:ff,fontSize:14}}>{u}</button>
            ))}
          </div>
        </div>
        <div style={{...cS,marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,color:C.mid,letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>{lang==="en"?`Nutritional values per ${form.unit==="pz"?"1 piece":`100 ${form.unit}`}`:`Valori nutrizionali per ${form.unit==="pz"?"1 pezzo":`100 ${form.unit}`}`}</div>
          {(lang==="en"?[["cal","Calories","kcal"],["p","Protein","g"],["c","Carbs","g"],["f","Fat","g"]]:[["cal","Calorie","kcal"],["p","Proteine","g"],["c","Carboidrati","g"],["f","Grassi","g"]]).map(([k,label,unit])=>(
            <div key={k} style={{marginBottom:12}}>
              <Lbl>{label}</Lbl>
              <div style={{display:"flex",alignItems:"center",background:C.bg,borderRadius:12,border:`1.5px solid ${C.bord}`}}>
                <input type="number" value={form[k]} onChange={e=>f(k,e.target.value)} placeholder="0" style={{flex:1,background:"none",border:"none",color:C.txt,padding:"12px 16px",fontSize:17,fontWeight:700,outline:"none",fontFamily:ff}}/>
                <span style={{color:C.mid,paddingRight:16,fontSize:13,fontWeight:600}}>{unit}</span>
              </div>
            </div>
          ))}
        </div>
        {err&&<div style={{background:C.rLo,border:`1px solid ${C.red}33`,borderRadius:12,padding:"10px 14px",color:C.red,fontSize:13,marginBottom:16}}>{err}</div>}
        {form.name&&form.cal&&(
          <div style={{...cS,background:C.aLo,border:`1px solid ${C.acc}33`,marginBottom:16}}>
            <div style={{fontSize:11,color:C.acc,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>{lang==="en"?"Preview":"Anteprima"}</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:24}}>{form.emoji}</span>
                <div>
                  <div style={{fontWeight:700,fontSize:14}}>{form.name}</div>
                  <div style={{fontSize:12,color:C.mid}}>P:{form.p||0}g C:{form.c||0}g G:{form.f||0}g</div>
                </div>
              </div>
              <div style={{color:C.acc,fontWeight:800,fontSize:15}}>{form.cal} kcal</div>
            </div>
          </div>
        )}
        <button onClick={save} style={bP}>{lang==="en"?"Save food":"Salva alimento"}</button>
      </div>
    </div>
  );
}


// RICERCA DATABASE ONLINE
function OnlineSearchScreen({onBack,onSaveToDb}) {
  const [search,setSearch]=useState("");
  const [results,setResults]=useState([]);
  const [loading,setLoading]=useState(false);
  const [saved,setSaved]=useState({});
  const [searched,setSearched]=useState(false);

  const doSearch=async()=>{
    const q=search.trim();
    if(q.length<2) return;
    setLoading(true); setResults([]); setSearched(true);
    try {
      const results = await searchFoodsOnline(q);
      setResults(results.slice(0, 35));
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  const save=(food)=>{
    onSaveToDb(food);
    setSaved(prev=>({...prev,[food.name]:true}));
  };

  return (
    <div style={{...ss,display:"flex",flexDirection:"column",height:"100vh"}}>
      <style>{FONTS}</style>
      <div style={{padding:"52px 20px 0",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <BackBtn onClick={onBack}/>
          <div>
            <div style={{fontSize:19,fontWeight:800}}>Ricerca online</div>
            <div style={{fontSize:11,color:C.mid,marginTop:1}}>Open Food Facts · salva nel database interno</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doSearch()} placeholder="es. Mulino Bianco, pane di casa..." style={{...inp,flex:1}}/>
          <button onClick={doSearch} disabled={loading} style={{padding:"0 18px",background:C.acc,border:"none",borderRadius:14,color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:ff,fontSize:14,opacity:loading?.6:1}}>
            {loading?<Spin size={16} color="#fff"/>:"🔍"}
          </button>
        </div>
        <div style={{fontSize:12,color:C.mid,marginBottom:10}}>
          {loading&&"Ricerca in corso..."}
          {!loading&&searched&&results.length===0&&"Nessun risultato. Prova con un termine diverso."}
          {!loading&&results.length>0&&`${results.length} prodotti trovati`}
          {!searched&&"Scrivi il nome del prodotto e premi Cerca"}
        </div>
      </div>
      <div style={{overflowY:"auto",flex:1,padding:"0 20px 60px"}}>
        {results.map((food,i)=>(
          <div key={i} style={{...cS,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{getFoodName(food)}</div>
              {food.brand&&<div style={{fontSize:11,color:C.mid,marginTop:1}}>{food.brand}</div>}
              <div style={{fontSize:12,color:C.mid,marginTop:3,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                <span><span style={{color:C.acc,fontWeight:700}}>{food.cal} kcal</span>{" · "}P:{food.p}g C:{food.c}g G:{food.f}g</span>
                {food.nutriscore&&<NutriScoreBadge score={food.nutriscore}/>}
              </div>
            </div>
            <button
              onClick={()=>save(food)}
              disabled={saved[food.name]}
              style={{marginLeft:12,padding:"8px 14px",background:saved[food.name]?C.aLo:C.acc,border:saved[food.name]?`1px solid ${C.acc}`:"none",borderRadius:12,color:saved[food.name]?C.acc:"#fff",fontWeight:700,cursor:saved[food.name]?"default":"pointer",fontSize:12,fontFamily:ff,flexShrink:0,transition:"all .2s"}}
            >
              {saved[food.name]?"✓ Salvato":"+ Salva"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// BARCODE SCANNER - html5-qrcode con dimensioni fisse in pixel (fix mobile)
function BarcodeScanner({onClose,onDetect}) {
  const scannerRef=useRef(null);
  const mountedRef=useRef(false);
  const divId="nc2-qr-div";
  const [status,setStatus]=useState("idle");
  const [errMsg,setErrMsg]=useState("");
  const [manual,setManual]=useState("");

  // Dimensioni fisse in pixel - CRITICO per html5-qrcode su mobile
  const HEADER_H=56, MANUAL_H=110;
  const CAM_W=Math.min(window.innerWidth, 430);
  const CAM_H=Math.max(320, window.innerHeight - HEADER_H - MANUAL_H);
  // Box di scansione ottimizzato per EAN-13 (codici a barre prodotti alimentari)
  // Rapporto ideale 3:1 larghezza/altezza, margini generosi
  const BOX_W=Math.min(300, Math.round(CAM_W*0.82));
  const BOX_H=Math.round(BOX_W/3);

  const stopScanner=()=>{
    if(scannerRef.current){
      scannerRef.current.stop().catch(()=>{});
      scannerRef.current=null;
    }
  };

  const startScanner=async()=>{
    if(!mountedRef.current) return;
    // Verifica che il div esista e abbia dimensioni
    const el=document.getElementById(divId);
    if(!el||el.offsetWidth===0){
      setTimeout(startScanner, 200);
      return;
    }
    setStatus("starting");
    try {
      const scanner=new Html5Qrcode(divId, {verbose:false});
      scannerRef.current=scanner;
      await scanner.start(
        {facingMode:"environment"},
        {
          fps:15,
          qrbox:{width:BOX_W, height:BOX_H},
          disableFlip:false,
          rememberLastUsedCamera:true,
          supportedScanTypes:[0], // 0=SCAN_TYPE_CAMERA
        },
        (code)=>{
          if(!mountedRef.current) return;
          stopScanner();
          handleFound(code);
        },
        ()=>{}
      );
      if(mountedRef.current) setStatus("scanning");
    } catch(e) {
      if(!mountedRef.current) return;
      const msg=String(e).toLowerCase();
      let txt="";
      if(msg.includes("permission")||msg.includes("notallowed")){
        txt=_lang==="en"
          ?"Camera permission denied. Enable it in browser settings."
          :"Permesso fotocamera negato. Abilitalo nelle impostazioni del browser.";
      } else if(msg.includes("notfound")||msg.includes("no camera")){
        txt=_lang==="en"?"No camera found.":"Nessuna fotocamera trovata.";
      } else if(msg.includes("size of")||msg.includes("0")){
        txt=_lang==="en"
          ?"Camera container error. Try rotating the device."
          :"Errore container fotocamera. Prova a ruotare il dispositivo.";
      } else {
        txt=(_lang==="en"?"Error: ":"Errore: ")+String(e).slice(0,100);
      }
      setErrMsg(txt);
      setStatus("error");
    }
  };

  useEffect(()=>{
    mountedRef.current=true;
    // Attendi 300ms per essere sicuri che il DOM sia pronto
    const t=setTimeout(startScanner, 300);
    return ()=>{
      mountedRef.current=false;
      clearTimeout(t);
      stopScanner();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const handleFound=async(code)=>{
    if(!mountedRef.current) return;
    setStatus("loading");
    const food=await lookupBarcode(code);
    if(!mountedRef.current) return;
    if(food){ onDetect(food); }
    else {
      setErrMsg(_lang==="en"
        ?`Code ${code} not found. Try manual entry.`
        :`Codice ${code} non trovato. Prova l'inserimento manuale.`);
      setStatus("error");
    }
  };

  const handleManual=()=>{
    const code=manual.trim();
    if(!code||status==="loading") return;
    stopScanner();
    handleFound(code);
  };

  const retry=()=>{
    setErrMsg(""); setStatus("idle");
    setTimeout(startScanner, 300);
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"#000",display:"flex",flexDirection:"column"}}>
      {/* Header fisso */}
      <div style={{height:HEADER_H,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",background:"#111",flexShrink:0}}>
        <span style={{fontSize:15,fontWeight:700,color:"#fff"}}>
          📷 {_lang==="en"?"Scan barcode":"Scansione barcode"}
        </span>
        <button onClick={()=>{stopScanner();onClose();}} style={{background:"none",border:"none",color:"#aaa",fontSize:26,cursor:"pointer",lineHeight:1}}>✕</button>
      </div>

      {/* Div con dimensioni fisse in pixel - CRITICO per html5-qrcode su mobile */}
      <div style={{position:"relative",width:"100%",height:CAM_H,flexShrink:0,background:"#000",overflow:"hidden"}}>
        <div id={divId} style={{width:CAM_W,height:CAM_H,margin:"0 auto"}}/>

        {(status==="idle"||status==="starting")&&(
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,background:"rgba(0,0,0,.7)"}}>
            <Spin size={40} color={C.acc}/>
            <div style={{color:"#ddd",fontSize:14}}>
              {_lang==="en"?"Starting camera...":"Avvio fotocamera..."}
            </div>
          </div>
        )}

        {status==="scanning"&&(
          <div style={{position:"absolute",bottom:14,left:0,right:0,textAlign:"center",color:"rgba(255,255,255,.7)",fontSize:13}}>
            {_lang==="en"?"Point at barcode":"Punta sul codice a barre"}
          </div>
        )}

        {status==="loading"&&(
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.88)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>
            <Spin size={40} color={C.acc}/>
            <div style={{color:"#fff",fontSize:14}}>
              {_lang==="en"?"Looking up product...":"Ricerca prodotto..."}
            </div>
          </div>
        )}

        {status==="error"&&(
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.93)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,padding:"20px"}}>
            <div style={{fontSize:38}}>⚠️</div>
            <div style={{color:"#fff",textAlign:"center",fontSize:13,lineHeight:1.7}}>{errMsg}</div>
            <button onClick={retry} style={{padding:"10px 28px",background:C.acc,border:"none",borderRadius:12,color:"#0D1117",fontWeight:700,cursor:"pointer",fontFamily:ff}}>
              {_lang==="en"?"Retry":"Riprova"}
            </button>
          </div>
        )}
      </div>

      {/* Input manuale con altezza fissa */}
      <div style={{height:MANUAL_H,padding:"12px 20px",background:C.surf,borderTop:`1px solid ${C.bord}`,flexShrink:0,display:"flex",flexDirection:"column",justifyContent:"center"}}>
        <div style={{fontSize:11,color:C.mid,marginBottom:8,fontWeight:600,letterSpacing:.3}}>
          {_lang==="en"?"Enter barcode manually":"Inserisci il codice manualmente"}
        </div>
        <div style={{display:"flex",gap:10}}>
          <input
            value={manual}
            onChange={e=>setManual(e.target.value)}
            placeholder="es. 8001835000168"
            inputMode="numeric"
            style={{...inp,flex:1,fontSize:15,background:C.card,border:`1.5px solid ${C.acc}66`,color:C.txt,padding:"10px 14px"}}
            onKeyDown={e=>e.key==="Enter"&&handleManual()}
          />
          <button
            onClick={handleManual}
            disabled={!manual.trim()||status==="loading"}
            style={{padding:"0 18px",background:C.acc,border:"none",borderRadius:14,color:"#0D1117",fontWeight:700,cursor:"pointer",fontFamily:ff,fontSize:14,flexShrink:0,opacity:(manual.trim()&&status!=="loading")?1:.4}}
          >
            {_lang==="en"?"Go":"Cerca"}
          </button>
        </div>
      </div>
    </div>
  );
}

// FOOD SELECTOR
function FoodSelectorScreen({mealTot,target,pantry,customFoods,lang:fLang,onBack,onAdd,onSaveCustomFood}) {
  const [cat,setCat]=useState("Proteine");
  const [search,setSearch]=useState("");
  const [extResults,setExtResults]=useState([]);
  const [loadingExt,setLoadingExt]=useState(false);
  const [showBarcode,setShowBarcode]=useState(false);
  const [showCreate,setShowCreate]=useState(false);
  const [showOnline,setShowOnline]=useState(false);
  const cats=Object.keys(FOODS);

  useEffect(()=>{
    if(search.length<2){setExtResults([]);setLoadingExt(false);return;}
    setExtResults([]); // azzera subito i risultati precedenti
    setLoadingExt(true);
    const t=setTimeout(async()=>{
      try {
        const off=await searchFoodsOnline(search);
        const usda=[];
        const seen=new Set();
        const merged=[...off,...usda].filter(f=>{if(seen.has(f.name))return false;seen.add(f.name);return true;});
        setExtResults(merged);
      } catch { setExtResults([]); }
      finally { setLoadingExt(false); }
    },400);
    return ()=>clearTimeout(t);
  },[search]);

  const searching=search.length>=2;
  // Quando si cerca: mostra locale + esterni in una lista unificata
  const allLocal=[...ALL_FOODS,...(customFoods||[])];
  const localFiltered=allLocal.filter(f=>(_lang!=="en"||f.nameEn)&&(f.name.toLowerCase().includes(search.toLowerCase())||(f.nameEn&&f.nameEn.toLowerCase().includes(search.toLowerCase()))));
  const pantryFiltered=pantry.map(it=>it.food).filter(f=>f.name.toLowerCase().includes(search.toLowerCase())||(f.nameEn&&f.nameEn.toLowerCase().includes(search.toLowerCase())));
  const mergedSearch=searching
    ? (() => {
        const seen=new Set();
        return [...pantryFiltered,...localFiltered,...extResults].filter(f=>{
          if(seen.has(f.name))return false; seen.add(f.name); return true;
        });
      })()
    : null;
  const enOnly=_lang==="en";
  const listToShow=searching?mergedSearch
    :cat==="__pantry__"?[]
    :cat==="__custom__"?(customFoods||[])
    :(enOnly?(FOODS[cat]||[]).filter(f=>f.nameEn):(FOODS[cat]||[]));

  if(showBarcode) return <BarcodeScanner onClose={()=>setShowBarcode(false)} onDetect={f=>{setShowBarcode(false);onAdd(f);if(onSaveCustomFood) onSaveCustomFood(f);}}/>;
  if(showOnline) return <OnlineSearchScreen onBack={()=>setShowOnline(false)} onSaveToDb={f=>{ if(onSaveCustomFood) onSaveCustomFood(f); else { const cf=customFoods||[]; if(!cf.find(x=>x.name===f.name)){ cf.push(f); LS.s("nc2-customfoods",cf); } } }}/>;
  if(showCreate) return <CreateFoodScreen lang={fLang} onBack={()=>setShowCreate(false)} onSave={f=>{
    onAdd(f, f.unit==="pz" ? 1 : 100);
    if(onSaveCustomFood) onSaveCustomFood(f);
    else { const cf=customFoods||[]; if(!cf.find(x=>x.name===f.name)){ cf.push(f); LS.s("nc2-customfoods",cf); } }
    setShowCreate(false);
  }}/>;

  return (
    <div style={{...ss,display:"flex",flexDirection:"column",height:"100vh"}}>
      <style>{FONTS}</style>
      <div style={{padding:"52px 20px 0",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <BackBtn onClick={onBack}/>
          <div style={{flex:1}}>
            <div style={{fontSize:18,fontWeight:800}}>{t("addFood2",fLang||_lang)}</div>
            <div style={{fontSize:10,color:C.mid,marginTop:1}}>{(fLang||_lang)==="en"?"Local · Open Food Facts · USDA":"Locale · Open Food Facts · USDA"}</div>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
          <button onClick={()=>setShowOnline(true)} style={{width:"100%",padding:"9px 12px",background:"#F0FDF4",border:`1px solid ${C.acc}44`,borderRadius:12,color:C.acc,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:ff,textAlign:"center"}}>{(fLang||_lang)==="en"?"🌍 Online search":"🌍 Ricerca Online"}</button>
          <button onClick={()=>setShowCreate(true)} style={{width:"100%",padding:"9px 12px",background:C.bLo,border:`1px solid ${C.blu}33`,borderRadius:12,color:C.blu,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:ff,textAlign:"center"}}>{(fLang||_lang)==="en"?"✏️ Create food":"✏️ Crea alimento"}</button>
          <button onClick={()=>setShowBarcode(true)} style={{width:"100%",padding:"9px 12px",background:C.aLo,border:`1px solid ${C.acc}33`,borderRadius:12,color:C.acc,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:ff,textAlign:"center"}}>📷 {(fLang||_lang)==="en"?"Barcode scan":"Codice a barre"}</button>
        </div>
        <MealSummaryBar tot={mealTot} target={target}/>
        <div style={{position:"relative",marginBottom:10}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={(fLang||_lang)==="en"?"Type food name...":"Scrivi il nome dell'alimento..."} style={{...inp,paddingRight:40}}/>
          {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.mid,cursor:"pointer",fontSize:16}}>✕</button>}
        </div>
        {searching?(
          <div style={{fontSize:12,color:C.mid,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
            {loadingExt&&<Spin size={12}/>}
            <span>{loadingExt?"Ricerca nel database online...": mergedSearch.length>0?`${mergedSearch.length} risultati trovati`:"Nessun risultato"}</span>
          </div>
        ):(
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:12}}>
            {pantry.length>0&&<button onClick={()=>setCat("__pantry__")} style={{padding:"8px 16px",borderRadius:18,border:"none",background:cat==="__pantry__"?C.acc:C.surf,color:cat==="__pantry__"?"#000":C.mid,fontWeight:700,cursor:"pointer",fontSize:12,whiteSpace:"nowrap",fontFamily:ff,flexShrink:0}}>🫙 {fLang==="en"?"Pantry":"Credenza"}</button>}
            {cats.map(c=>(
              <button key={c} onClick={()=>setCat(c)} style={{padding:"8px 16px",borderRadius:18,border:"none",background:cat===c?C.acc:C.surf,color:cat===c?"#000":C.mid,fontWeight:700,cursor:"pointer",fontSize:12,whiteSpace:"nowrap",fontFamily:ff,flexShrink:0}}>{getCatName(c,fLang)}</button>
            ))}
            {customFoods&&customFoods.length>0&&<button onClick={()=>setCat("__custom__")} style={{padding:"8px 16px",borderRadius:18,border:"none",background:cat==="__custom__"?C.acc:C.surf,color:cat==="__custom__"?"#000":C.mid,fontWeight:700,cursor:"pointer",fontSize:12,whiteSpace:"nowrap",fontFamily:ff,flexShrink:0}}>⭐ {fLang==="en"?"Mine":"Miei"}</button>}
          </div>
        )}
      </div>
      <div style={{overflowY:"auto",flex:1,padding:"0 20px 60px"}}>
        {listToShow.map((food,i)=>(
          <div key={i} onClick={()=>onAdd(food)} style={{...cS,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",transition:"background .1s"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,flex:1,minWidth:0}}>
              <span style={{fontSize:22,flexShrink:0}}>{food.emoji}</span>
              <div style={{minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{getFoodName(food)}</div>
                {food.brand&&<div style={{fontSize:11,color:C.mid,marginTop:1}}>{food.brand}</div>}
                <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3,flexWrap:"wrap"}}>
                  <span style={{fontSize:12,color:C.mid}}>P:{food.p}g · C:{food.c}g · G:{food.f}g</span>
                  {food.nutriscore&&<NutriScoreBadge score={food.nutriscore}/>}
                </div>
              </div>
            </div>
            <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
              <div style={{color:C.acc,fontWeight:800,fontSize:14}}>{food.cal}</div>
              <div style={{fontSize:10,color:C.mid}}>kcal</div>
            </div>
          </div>
        ))}
        {!searching&&cat==="__pantry__"&&pantry.map((it,i)=>(
          <div key={i} onClick={()=>onAdd(it.food)} style={{...cS,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,flex:1,minWidth:0}}>
              <span style={{fontSize:22}}>{it.food.emoji}</span>
              <div>
                <div style={{fontWeight:700,fontSize:14}}>{getFoodName(it.food)}</div>
                <div style={{fontSize:12,color:C.mid}}>{(fLang||_lang)==="en"?"Available":"Disponibile"}: {it.qty}{it.unit||"g"}</div>
              </div>
            </div>
            <div style={{color:C.acc,fontWeight:800,fontSize:14}}>{it.food.cal}<div style={{fontSize:10,color:C.mid,fontWeight:400}}>kcal</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// MEAL DETAIL SCREEN
// PHOTO MEAL SCREEN - scatta foto del pasto e Claude riconosce gli alimenti
function PhotoMealScreen({mealName,mealData,lang,onBack,onConfirm}) {
  const [status,setStatus]=useState("idle"); // idle|loading|review|error
  const [previewItems,setPreviewItems]=useState([]);
  const [capturedImage,setCapturedImage]=useState(null);
  const [errMsg,setErrMsg]=useState("");
  const fileRef=useRef();
  const galleryRef=useRef();

  const handleCapture=async(e)=>{
    const file=e.target.files?.[0];
    if(!file) return;
    setStatus("loading"); setErrMsg("");
    try {
      // Comprimi l'immagine lato client prima di inviarla (max 1024px, qualità 0.75)
      const {base64, imageType} = await new Promise((res,rej)=>{
        const r=new FileReader();
        r.onload=()=>{
          const img=new Image();
          img.onload=()=>{
            const MAX=1024;
            let w=img.width, h=img.height;
            if(w>MAX||h>MAX){ const ratio=Math.min(MAX/w,MAX/h); w=Math.round(w*ratio); h=Math.round(h*ratio); }
            const canvas=document.createElement("canvas");
            canvas.width=w; canvas.height=h;
            canvas.getContext("2d").drawImage(img,0,0,w,h);
            const dataUrl=canvas.toDataURL("image/jpeg",0.75);
            setCapturedImage(dataUrl);
            res({base64:dataUrl.split(",")[1], imageType:"image/jpeg"});
          };
          img.onerror=()=>rej(new Error("Image load failed"));
          img.src=r.result;
        };
        r.onerror=()=>rej(new Error("Read failed"));
        r.readAsDataURL(file);
      });
      const response=await fetch(`${API_BASE}/api/analyze-photo`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({imageBase64:base64,imageType,lang})
      });
      if(!response.ok){
        const errData=await response.json().catch(()=>({}));
        throw new Error(errData.error||"Server error "+response.status);
      }
      const data=await response.json();
      if(!data.items||!data.items.length) throw new Error(lang==="en"?"No foods recognized in photo":"Nessun alimento riconosciuto nella foto");
      // Normalizza: AI restituisce per-quantità, convertiamo a per-100g (stesso contratto dell'import PDF)
      const items=data.items.map(f=>{
        const qty=Number(f.quantity)||100;
        const factor=qty>0?(100/qty):1;
        return {
          food:{
            name:f.name,
            cal:Math.round(Number(f.cal||0)*factor*10)/10,
            p:Math.round(Number(f.p||0)*factor*10)/10,
            c:Math.round(Number(f.c||0)*factor*10)/10,
            f:Math.round(Number(f.f||0)*factor*10)/10,
            emoji:f.emoji||"🍽️",
            unit:f.unit||"g",
            source:"photo",
          },
          quantity:qty,
        };
      });
      setPreviewItems(items);
      setStatus("review");
    } catch(e) {
      console.error("Photo analysis error:",e);
      setErrMsg((lang==="en"?"Analysis failed: ":"Analisi fallita: ")+String(e).slice(0,100));
      setStatus("error");
    }
    if(fileRef.current) fileRef.current.value="";
    if(galleryRef.current) galleryRef.current.value="";
  };

  const updateQty=(idx,qty)=>setPreviewItems(prev=>prev.map((item,i)=>i===idx?{...item,quantity:Math.max(1,Number(qty)||1)}:item));
  const removeItem=(idx)=>setPreviewItems(prev=>prev.filter((_,i)=>i!==idx));

  const prevTot=previewItems.reduce((acc,item)=>{
    const x=item.quantity/100;
    return {cal:acc.cal+item.food.cal*x, p:acc.p+item.food.p*x, c:acc.c+item.food.c*x, f:acc.f+item.food.f*x};
  },{cal:0,p:0,c:0,f:0});

  return (
    <div style={{...ss,overflowY:"auto"}}>
      <style>{FONTS}</style>
      <div style={{padding:"52px 20px 40px"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:22}}>
          <BackBtn onClick={onBack}/>
          <div style={{flex:1}}>
            <div style={{fontSize:21,fontWeight:800}}>📷 {lang==="en"?"Scan meal":"Scansiona pasto"}</div>
            <div style={{fontSize:12,color:C.mid}}>{mealData?.icon} {lang==="en"&&mealData?.nameEn?mealData.nameEn:mealName}</div>
          </div>
        </div>

        {status==="idle"&&(
          <div style={{...cS,textAlign:"center",padding:"40px 20px"}}>
            <div style={{fontSize:52,marginBottom:16}}>📸</div>
            <div style={{fontWeight:700,fontSize:16,marginBottom:8}}>{lang==="en"?"Take a photo of your meal":"Scatta una foto del tuo pasto"}</div>
            <div style={{fontSize:13,color:C.mid,marginBottom:28,lineHeight:1.6}}>
              {lang==="en"?"AI identifies foods and estimates quantities. Review and edit before confirming.":"L'AI identifica gli alimenti e stima le quantità. Verifica e modifica prima di confermare."}
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleCapture} style={{display:"none"}} id="nc2-photo-cam"/>
            <label htmlFor="nc2-photo-cam" style={{...bP,display:"inline-block",cursor:"pointer",width:"auto",padding:"14px 28px",marginBottom:12}}>
              📷 {lang==="en"?"Take photo":"Scatta foto"}
            </label>
            <br/>
            <input ref={galleryRef} type="file" accept="image/*" onChange={handleCapture} style={{display:"none"}} id="nc2-photo-gallery"/>
            <label htmlFor="nc2-photo-gallery" style={{...bS,display:"inline-block",cursor:"pointer",width:"auto",padding:"11px 22px"}}>
              🖼️ {lang==="en"?"Choose from gallery":"Scegli dalla galleria"}
            </label>
            <div style={{fontSize:11,color:C.mid,marginTop:20,lineHeight:1.5,padding:"10px 14px",background:C.surf,borderRadius:10}}>
              ⚠️ {lang==="en"?"Weight estimation has ±20-30% margin. Always review results.":"La stima del peso ha margine ±20-30%. Verifica sempre i risultati."}
            </div>
          </div>
        )}

        {status==="loading"&&(
          <div style={{...cS,textAlign:"center",padding:"40px 20px"}}>
            {capturedImage&&<img src={capturedImage} style={{width:"100%",maxHeight:200,objectFit:"cover",borderRadius:12,marginBottom:20}} alt=""/>}
            <Spin size={44}/>
            <div style={{fontWeight:700,fontSize:16,marginTop:20,marginBottom:8}}>{lang==="en"?"Analysing meal...":"Analisi pasto in corso..."}</div>
            <div style={{fontSize:13,color:C.mid,lineHeight:1.6}}>{lang==="en"?"AI is identifying foods and estimating portions.":"L'AI sta identificando gli alimenti e stimando le porzioni."}</div>
          </div>
        )}

        {status==="error"&&(
          <div style={{...cS,textAlign:"center",padding:"36px 20px"}}>
            <div style={{fontSize:44,marginBottom:14}}>⚠️</div>
            <div style={{fontWeight:700,fontSize:15,marginBottom:8,color:C.red}}>{lang==="en"?"Error":"Errore"}</div>
            <div style={{fontSize:13,color:C.mid,marginBottom:24,lineHeight:1.6}}>{errMsg}</div>
            <button onClick={()=>{setStatus("idle");setErrMsg("");setCapturedImage(null);}} style={{...bS,width:"auto",padding:"12px 28px"}}>
              {lang==="en"?"Try again":"Riprova"}
            </button>
          </div>
        )}

        {status==="review"&&previewItems.length>0&&(
          <div>
            {capturedImage&&<img src={capturedImage} style={{width:"100%",maxHeight:180,objectFit:"cover",borderRadius:12,marginBottom:16}} alt=""/>}
            <div style={{...cS,background:`${C.acc}18`,border:`1px solid ${C.acc}44`,marginBottom:16,padding:"14px 16px"}}>
              <div style={{fontSize:14,fontWeight:800,color:C.acc,marginBottom:8}}>
                ✅ {previewItems.length} {lang==="en"?"foods identified":"alimenti identificati"}
              </div>
              <div style={{display:"flex",gap:8}}>
                {[["Cal",Math.round(prevTot.cal)+"",C.acc],["P",Math.round(prevTot.p)+"g",C.acc],["C",Math.round(prevTot.c)+"g",C.blu],["G",Math.round(prevTot.f)+"g",C.ora]].map(([l,v,c])=>(
                  <div key={l} style={{flex:1,background:C.surf,borderRadius:8,padding:"6px 4px",textAlign:"center"}}>
                    <div style={{fontSize:12,fontWeight:700,color:c}}>{v}</div>
                    <div style={{fontSize:10,color:C.mid}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{fontSize:11,color:C.mid,marginBottom:10,fontWeight:700,letterSpacing:.8,textTransform:"uppercase"}}>
              {lang==="en"?"Review and edit":"Verifica e modifica"}
            </div>
            {previewItems.map((item,idx)=>{
              const x=item.quantity/100;
              return (
                <div key={idx} style={cS}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:22}}>{item.food.emoji}</span>
                      <div>
                        <div style={{fontWeight:700,fontSize:14}}>{getFoodName(item.food)}</div>
                        <div style={{color:C.acc,fontSize:13,fontWeight:700}}>{rnd(item.food.cal*x)} kcal</div>
                      </div>
                    </div>
                    <button onClick={()=>removeItem(idx)} style={{background:C.rLo,border:"none",borderRadius:9,padding:"6px 10px",color:C.red,cursor:"pointer",fontSize:14,fontFamily:ff}}>✕</button>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <button onClick={()=>updateQty(idx,Math.max(5,item.quantity-10))} style={{width:34,height:34,borderRadius:9,background:C.surf,border:`1px solid ${C.bord}`,color:C.txt,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:ff}}>−</button>
                    <input type="number" value={item.quantity} onChange={e=>updateQty(idx,e.target.value)} style={{flex:1,background:C.surf,border:`1px solid ${C.bord}`,color:C.txt,padding:"7px",borderRadius:9,textAlign:"center",fontSize:16,fontWeight:700,outline:"none",fontFamily:ff}}/>
                    <span style={{color:C.mid,fontSize:13,fontWeight:600}}>{item.food.unit||"g"}</span>
                    <button onClick={()=>updateQty(idx,item.quantity+10)} style={{width:34,height:34,borderRadius:9,background:C.surf,border:`1px solid ${C.bord}`,color:C.txt,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:ff}}>+</button>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    {[["P",rnd(item.food.p*x),C.acc],["C",rnd(item.food.c*x),C.blu],["G",rnd(item.food.f*x),C.ora]].map(([l,v,c])=>(
                      <div key={l} style={{flex:1,background:C.surf,borderRadius:8,padding:8,textAlign:"center"}}>
                        <div style={{fontSize:13,fontWeight:700,color:c}}>{v}g</div>
                        <div style={{fontSize:10,color:C.mid}}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <div style={{display:"flex",gap:8,marginTop:16}}>
              <button onClick={()=>{setStatus("idle");setCapturedImage(null);setPreviewItems([]);}} style={{...bS,flex:1}}>
                {lang==="en"?"Retake":"Rifai foto"}
              </button>
              <button onClick={()=>onConfirm(previewItems)} style={{...bP,flex:2}} disabled={previewItems.length===0}>
                {lang==="en"?"✓ Add to meal":"✓ Aggiungi al pasto"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MealDetailScreen({mealName,mealData,items,tot,target,pantry,customFoods,favMeals,lang,onBack,onAdd,onRemove,onQty,onUnit,onGenerate,onGenerateDB,onClear,onSaveFav,onApplyFav,onDeleteFav,onRecalc,onAddItems,isConfirmed,isLocked,onUnconfirm,onUnlock,onSaveCustomFood,onSwap}) {
  const [showSel,setShowSel]=useState(false);
  const [showPhoto,setShowPhoto]=useState(false);
  const [swapModal,setSwapModal]=useState(null);
  if(showSel) return <FoodSelectorScreen mealTot={tot} target={target} pantry={pantry} customFoods={customFoods||[]} lang={lang} onBack={()=>setShowSel(false)} onAdd={f=>{onAdd(f);setShowSel(false);}} onSaveCustomFood={onSaveCustomFood}/>;
  if(showPhoto) return <PhotoMealScreen mealName={mealName} mealData={mealData} lang={lang} onBack={()=>setShowPhoto(false)} onConfirm={photoItems=>{onAddItems(photoItems);setShowPhoto(false);}}/>;
  return (
    <div style={{...ss,overflowY:"auto"}}>
      <style>{FONTS}</style>
      {swapModal&&(
        <SwapFoodModal
          mealName={mealName}
          itemIndex={swapModal.idx}
          currentItem={swapModal.item}
          pantry={pantry||[]}
          customFoods={customFoods||[]}
          lang={lang}
          onClose={()=>setSwapModal(null)}
          onSwap={(newFood,newQty)=>{ onSwap&&onSwap(swapModal.idx,newFood,newQty); setSwapModal(null); }}
        />
      )}
      <div style={{padding:"52px 20px 40px"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:22}}>
          <BackBtn onClick={onBack}/>
          <div style={{flex:1}}>
            <div style={{fontSize:21,fontWeight:800}}>{mealData?.icon} {_lang==="en"&&mealData?.nameEn?mealData.nameEn:mealName}</div>
            <div style={{fontSize:12,color:C.mid}}>{mealData?.time}</div>
          </div>
          {isLocked?(
            <button onClick={onUnlock} style={{background:"#FEF3C7",border:"1px solid #FCD34D33",borderRadius:10,padding:"8px 12px",color:"#92400E",cursor:"pointer",fontSize:14,fontWeight:600,fontFamily:ff,marginRight:4}} title={lang==="en"?"Unlock to edit":"Sblocca per modificare"}>
              🔒
            </button>
          ):isConfirmed?(
            <button style={{background:"#ECFDF5",border:"1px solid #6EE7B733",borderRadius:10,padding:"8px 12px",color:C.acc,cursor:"default",fontSize:14,fontWeight:600,fontFamily:ff,marginRight:4}}>
              🔓
            </button>
          ):null}
          {items.length>0&&!isLocked&&<button onClick={onClear} style={{background:"#FFF3E0",border:"1px solid #FBBF8833",borderRadius:10,padding:"8px 12px",color:C.ora,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:ff}}>🗑️ Reset</button>}
        </div>
        <MealSummaryBar tot={tot} target={target}/>
        {isLocked&&isConfirmed&&(
          <div style={{...cS,background:"#00D56310",border:`1px solid ${C.acc}44`,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20}}>🔒</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:13,color:C.acc}}>{lang==="en"?"Meal confirmed":"Pasto confermato"}</div>
              <div style={{fontSize:11,color:C.mid,marginTop:2}}>{lang==="en"?"Tap 🔓 to unlock and edit":"Tocca 🔓 per sbloccare e modificare"}</div>
            </div>
          </div>
        )}
        {items.length===0&&(
          <div style={{...cS,padding:"24px 20px",marginBottom:16}}>
            <div style={{fontSize:30,textAlign:"center",marginBottom:10}}>✨</div>
            <div style={{fontWeight:800,fontSize:15,textAlign:"center",marginBottom:6}}>{t("generateAuto",lang)}</div>
            <div style={{fontSize:13,color:C.mid,textAlign:"center",marginBottom:20,lineHeight:1.6}}>{t("generateDesc",lang)}</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <button onClick={()=>onGenerate()} style={{...bP,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                <span style={{fontSize:20}}>🫙</span>
                <div style={{textAlign:"left"}}>
                  <div style={{fontWeight:800,fontSize:14}}>{t("usePantry",lang)}</div>
                  <div style={{fontSize:11,fontWeight:400,opacity:.85}}>{lang==="en"?"Items you have at home, scaled quantities":"Alimenti che hai in casa, quantità scalate"}</div>
                </div>
              </button>
              <button onClick={onGenerateDB} style={{...bS,display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"14px 20px"}}>
                <span style={{fontSize:20}}>📋</span>
                <div style={{textAlign:"left"}}>
                  <div style={{fontWeight:800,fontSize:14}}>{t("useDB",lang)}</div>
                  <div style={{fontSize:11,fontWeight:400,color:C.mid}}>{lang==="en"?"Recommended foods from the general database":"Alimenti consigliati dal database generale"}</div>
                </div>
              </button>
            </div>
          </div>
        )}
        {items.map((item,idx)=>{
          const x=item.quantity/(item.food.unit==="pz"?1:100);
          return (
            <div key={idx} style={cS}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:22}}>{item.food.emoji}</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:14}}>{getFoodName(item.food)}</div>
                    {item.food.brand&&<div style={{fontSize:11,color:C.mid}}>{item.food.brand}</div>}
                    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                      <span style={{color:C.acc,fontSize:13,fontWeight:700}}>{rnd(item.food.cal*x)} kcal</span>
                      {item.food.nutriscore&&<NutriScoreBadge score={item.food.nutriscore}/>}
                    </div>
                  </div>
                </div>
                {!isLocked&&<div style={{display:"flex",gap:6}}>
                  <button onClick={()=>setSwapModal({idx,item})} style={{background:"rgba(255,255,255,.06)",border:`1px solid ${C.bord2}`,borderRadius:9,padding:"6px 10px",color:C.mid,cursor:"pointer",fontSize:14,fontFamily:ff}}>⇄</button>
                  <button onClick={()=>onRemove(idx)} style={{background:C.rLo,border:"none",borderRadius:9,padding:"6px 10px",color:C.red,cursor:"pointer",fontSize:14,fontFamily:ff}}>✕</button>
                </div>}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                {["g","ml","pz"].map(u=>(
                  <button key={u} onClick={()=>onUnit(idx,u)} style={{padding:"4px 10px",borderRadius:8,border:`1.5px solid ${(item.food.unit||"g")===u?C.acc:C.bord}`,background:(item.food.unit||"g")===u?C.aLo:C.surf,color:(item.food.unit||"g")===u?C.acc:C.mid,fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:ff}}>{u}</button>
                ))}
              </div>
              {!isLocked&&<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                {(()=>{const isPz=(item.food.unit||"g")==="pz",step=isPz?1:10;return(<>
                  <button onClick={()=>onQty(idx,Math.max(isPz?1:5,item.quantity-step))} style={{width:34,height:34,borderRadius:9,background:C.surf,border:`1px solid ${C.bord}`,color:C.txt,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:ff}}>−</button>
                  <input type="number" value={item.quantity} onChange={e=>onQty(idx,e.target.value)} style={{flex:1,background:C.surf,border:`1px solid ${C.bord}`,color:C.txt,padding:"7px",borderRadius:9,textAlign:"center",fontSize:16,fontWeight:700,outline:"none",fontFamily:ff}}/>
                  <span style={{color:C.mid,fontSize:13,fontWeight:600}}>{item.food.unit||"g"}</span>
                  <button onClick={()=>onQty(idx,item.quantity+step)} style={{width:34,height:34,borderRadius:9,background:C.surf,border:`1px solid ${C.bord}`,color:C.txt,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:ff}}>+</button>
                </>);})()}
              </div>}
              <div style={{display:"flex",gap:6}}>
                {[["P",rnd(item.food.p*x),C.acc],["C",rnd(item.food.c*x),C.blu],["G",rnd(item.food.f*x),C.ora]].map(([l,v,c])=>(
                  <div key={l} style={{flex:1,background:C.surf,borderRadius:8,padding:8,textAlign:"center"}}>
                    <div style={{fontSize:13,fontWeight:700,color:c}}>{v}g</div>
                    <div style={{fontSize:10,color:C.mid}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
          <button onClick={()=>!isLocked&&setShowSel(true)} style={{flex:2,minWidth:0,padding:"12px 10px",background:isLocked?C.surf:C.acc,color:isLocked?C.mid:"#0D1117",border:isLocked?`1.5px solid ${C.bord}`:"none",borderRadius:14,fontWeight:700,fontSize:13,cursor:isLocked?"not-allowed":"pointer",fontFamily:ff,opacity:isLocked?0.5:1}}>{isLocked?"🔒":" "}{t("addFood2",lang)}</button>
          <button onClick={()=>setShowPhoto(true)} style={{padding:"10px 12px",background:C.bLo,border:`1px solid ${C.blu}33`,borderRadius:14,color:C.blu,fontWeight:700,cursor:"pointer",fontFamily:ff,fontSize:13,flexShrink:0}}>📷</button>
          {items.length>0&&!isConfirmed&&<button onClick={onRecalc} style={{padding:"10px 12px",background:C.bLo,border:`1px solid ${C.blu}33`,borderRadius:14,color:C.blu,fontWeight:700,cursor:"pointer",fontFamily:ff,fontSize:12,flexShrink:0}}>{t("recalc",lang)}</button>}
          {items.length>0&&!isConfirmed&&!isLocked&&<button onClick={onUnconfirm} style={{padding:"10px 14px",background:`linear-gradient(135deg,${C.acc},${C.blu})`,border:"none",borderRadius:14,color:"#0D1117",fontWeight:800,cursor:"pointer",fontFamily:ff,fontSize:12,flexShrink:0}}>✓ {lang==="en"?"Confirm":"Conferma"}</button>}
          {items.length>0&&isConfirmed&&<div style={{padding:"10px 14px",background:`${C.acc}18`,border:`1px solid ${C.acc}44`,borderRadius:14,color:C.acc,fontWeight:700,fontSize:12,flexShrink:0}}>✓ {lang==="en"?"Confirmed":"Confermato"}</div>}
          {items.length>0&&<SaveMealBtn onSave={onSaveFav} lang={lang} showLabel={true}/>}
        </div>
        {favMeals&&favMeals.length>0&&(
          <div style={{marginTop:16}}>
            <div style={{fontSize:11,fontWeight:700,color:C.mid,letterSpacing:.8,textTransform:"uppercase",marginBottom:10}}>{t("fav_meals_title",lang)}</div>
            {favMeals.map(fav=>(
              <div key={fav.id} style={{...cS,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px"}}>
                <div onClick={()=>onApplyFav(fav)} style={{flex:1,cursor:"pointer"}}>
                  <div style={{fontWeight:700,fontSize:13}}>⭐ {fav.name}</div>
                  <div style={{fontSize:11,color:C.mid,marginTop:2}}>{fav.items?.length} alimenti</div>
                </div>
                <button onClick={()=>onDeleteFav(fav.id)} style={{background:C.rLo,border:"none",borderRadius:8,padding:"5px 9px",color:C.red,cursor:"pointer",fontSize:13,fontFamily:ff}}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// CREDENZA — classificazione alimenti unificata (8 categorie, keyword-first)
function getFoodCat(food) {
  const n = (food.name||"").toLowerCase();
  // Verdure
  if(["broccol","spinac","zucchi","pomodor","insalat","lattuga","peperone","carota","asparag",
      "funghi","cavolfiore","cavol","cetriolo","melanzana","sedano","finocchio","radicchio",
      "rucola","bietola","fagiolini","cipolla","aglio","porro","carc","verdur","crescione",
      "barbabietola","germogl","mais dolce","carciofo","piselli"].some(k=>n.includes(k)))
    return "V";
  // Frutta
  if(["mela","pera","banana","arancia","fragol","kiwi","ananas","uva","melone","anguria",
      "albicocca","mango","mirtill","lamponi","more","ciliegi","pesca","prugna","fico",
      "cachi","dattero","melograno","papaya","lime","limone","mandarino","clementina",
      "pompelmo","frutto della passione"].some(k=>n.includes(k)))
    return "FR";
  // Latticini
  if(["latte","yogurt","ricotta","formaggio","mozzarella","parmigiano","grana","pecorino",
      "burrata","mascarpone","fiocchi di latte","cottage","skyr","quark","kefir",
      "bevanda a base di"].some(k=>n.includes(k)))
    return "L";
  // Uova
  if(["uov","album"].some(k=>n.includes(k))) return "U";
  // Cereali e amidi
  if(["pasta","riso","farro","orzo","quinoa","bulgur","couscous","cous cous","polenta","grano",
      "pane","galletta","crackers","frisella","grissini","patata","patate","avena","fiocchi d'avena",
      "fiocchi di avena","muesli","granola","tortilla","amaranto","kamut","piadina","focaccia",
      "gnocchi","polpett"].some(k=>n.includes(k)))
    return "C";
  // Proteine vegetali
  if(["lenticch","ceci","fagioli","soia","tempeh","tofu","seitan"].some(k=>n.includes(k)))
    return "PV";
  // Grassi & frutta secca
  if(["olio","mandorle","noci","nocciole","pistacchi","semi di","avocado","burro di arachidi",
      "tahini","burro di","cocco","frutta secca"].some(k=>n.includes(k)))
    return "G";
  // Supplementi
  if(["whey","caseina","proteine in polvere","creatina","integratore"].some(k=>n.includes(k)))
    return "S";
  // Fallback macro
  const cal=food.cal||1, pPct=(food.p*4)/cal;
  if(pPct>=0.30 || food.p>=18) return "P";
  if((food.c*4)/cal>=0.50) return "C";
  if((food.f*9)/cal>=0.40) return "G";
  if(food.cal<55) return "V";
  return "A";
}
// Compatibilità backward per codice esistente
const getCategoryGlobal = getFoodCat;

const PANTRY_CATS=[
  {key:"P",  labelIt:"Carni & Pesce",        labelEn:"Meat & Fish",       color:C.acc,      emoji:"🥩"},
  {key:"PV", labelIt:"Proteine Vegetali",    labelEn:"Plant Proteins",    color:"#4ADE80",  emoji:"🫘"},
  {key:"U",  labelIt:"Uova",                 labelEn:"Eggs",              color:"#FDE68A",  emoji:"🥚"},
  {key:"L",  labelIt:"Latticini",            labelEn:"Dairy",             color:"#A78BFA",  emoji:"🧀"},
  {key:"C",  labelIt:"Cereali & Amidi",      labelEn:"Grains & Starches", color:C.blu,      emoji:"🌾"},
  {key:"V",  labelIt:"Verdure",              labelEn:"Vegetables",        color:"#4CAF50",  emoji:"🥦"},
  {key:"FR", labelIt:"Frutta",               labelEn:"Fruit",             color:"#F97316",  emoji:"🍎"},
  {key:"G",  labelIt:"Grassi & Frutta Secca",labelEn:"Fats & Nuts",      color:C.ora,      emoji:"🫒"},
  {key:"S",  labelIt:"Supplementi",          labelEn:"Supplements",       color:C.pur,      emoji:"💊"},
  {key:"A",  labelIt:"Altro",                labelEn:"Other",             color:C.mid,      emoji:"🍽️"},
];

// Deduplicazione + sort + raggruppamento per credenza/manual picker
function groupPantryFoods(pantryFoods) {
  const seen=new Set();
  const deduped=pantryFoods.filter(f=>{ if(seen.has(f.name)) return false; seen.add(f.name); return true; });
  return PANTRY_CATS.map(cat=>({
    ...cat,
    items: deduped.filter(f=>getCategoryGlobal(f)===cat.key).sort((a,b)=>a.name.localeCompare(b.name,"it")),
  })).filter(cat=>cat.items.length>0);
}

function CredenzaScreen({pantry,setPantry,savePantry,lang,user,customFoods,setCustomFoods}) {
  const [showAdd,setShowAdd]=useState(false);
  const [editQty,setEditQty]=useState({});
  const [showCreate,setShowCreate]=useState(false);

  // Pulizia automatica: rimuovi alimenti esauriti da >24h
  useEffect(()=>{
    const h24=24*60*60*1000;
    const now=Date.now();
    const cleaned=pantry.filter(it=>!it.exhaustedAt||(now-it.exhaustedAt<h24));
    if(cleaned.length!==pantry.length){ setPantry(cleaned); savePantry(cleaned); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const getCategory = getFoodCat;

  const addItem=food=>{
    const existing=pantry.find(it=>it.food.name===food.name);
    let updated;
    if(existing) { updated=pantry.map(it=>it.food.name===food.name?{...it,qty:it.qty+100}:it); }
    else { const enrichedFood=ALL_FOODS.find(f=>f.name===food.name)||food; updated=[...pantry,{id:Date.now(),food:enrichedFood,qty:100,unit:enrichedFood.unit||"g"}]; }
    // Deduplicazione: rimuovi eventuali duplicati per nome
    const seen=new Set(); 
    updated=updated.filter(it=>{ if(seen.has(it.food.name)) return false; seen.add(it.food.name); return true; });
    setPantry(updated); savePantry(updated); setShowAdd(false);
  };

  const removeItem=id=>{ const u=pantry.filter(it=>it.id!==id); setPantry(u); savePantry(u); };
  const updateQty=(id,qty)=>{
    const n=parseFloat(qty);
    if(isNaN(n)||n<0) return;
    // Se la quantità torna sopra 0, rimuovi lo stato esaurito
    const u=pantry.map(it=>it.id===id?{...it,qty:n,...(n>0?{exhaustedAt:undefined}:{})}:it);
    setPantry(u); savePantry(u);
  };
  const addQtyToItem=(id,delta)=>{
    const it=pantry.find(i=>i.id===id); if(!it) return;
    const newQty=Math.max(0,it.qty+delta);
    const u=pantry.map(i=>i.id===id?{...i,qty:newQty,...(newQty>0?{exhaustedAt:undefined}:{})}:i);
    setPantry(u); savePantry(u);
  };

  // Salva un alimento custom: stato App + LS + Supabase custom_foods
  const saveCustomFood=(food)=>{
    const current=customFoods||[];
    if(current.find(f=>f.name===food.name)) return; // già presente
    const updated=[...current,food];
    if(setCustomFoods) setCustomFoods(updated);
    LS.s("nc2-customfoods",updated);
    if(user) DB.saveCustomFoods(user.id,updated).catch(e=>console.error("saveCustomFoods error:",e));
  };

  if(showAdd) return <FoodSelectorScreen mealTot={{cal:0,p:0,c:0,f:0}} target={{calories:2000,protein:100,carbs:200,fat:70}} pantry={[]} customFoods={customFoods||LS.g("nc2-customfoods")||[]} lang={lang} onBack={()=>setShowAdd(false)} onAdd={addItem}/>;
  if(showCreate) return <CreateFoodScreen lang={lang} onBack={()=>setShowCreate(false)} onSave={food=>{
    addItem(food);
    saveCustomFood(food);
    setShowCreate(false);
  }}/>;

  // Deduplicazione in display + raggruppamento + ordine alfabetico
  const seen=new Set();
  const dedupedPantry=pantry.filter(it=>{ if(seen.has(it.food.name)) return false; seen.add(it.food.name); return true; });
  const activeCount=dedupedPantry.filter(it=>it.qty>0).length;
  const lowCount=dedupedPantry.filter(it=>it.qty>0&&it.qty<100).length;
  const exhaustedCount=dedupedPantry.filter(it=>it.qty<=0).length;

  const grouped=PANTRY_CATS.map(cat=>({
    ...cat,
    items: dedupedPantry
      .filter(it=>getCategory(it.food)===cat.key)
      .sort((a,b)=>a.food.name.localeCompare(b.food.name,"it")),
  })).filter(cat=>cat.items.length>0);

  return (
    <div style={{padding:"52px 20px 100px",overflowY:"auto"}}>
      {/* HEADER */}
      <div style={{
        background:`linear-gradient(145deg,#152433,#0C1A26)`,
        borderRadius:22,border:`1px solid ${C.bord}`,
        padding:"18px 20px",marginBottom:18,
        boxShadow:"0 4px 20px rgba(0,0,0,.3)",
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div>
            <div style={{fontSize:22,fontWeight:900,letterSpacing:-0.5}}>{lang==="en"?"Pantry":"Credenza"}</div>
            <div style={{fontSize:12,color:C.mid,marginTop:3,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <span style={{color:C.acc,fontWeight:700}}>{activeCount} {lang==="en"?"available":"disponibili"}</span>
              {lowCount>0&&<span style={{color:C.yel,fontWeight:700}}>⚠ {lowCount} {lang==="en"?"low":"in esaurimento"}</span>}
              {exhaustedCount>0&&<span style={{color:C.red,fontWeight:700}}>✕ {exhaustedCount} {lang==="en"?"exhausted":"esauriti"}</span>}
            </div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
            <button onClick={()=>setShowAdd(true)} style={{padding:"9px 13px",background:`${C.acc}15`,border:`1px solid ${C.acc}33`,borderRadius:12,color:C.acc,fontWeight:700,cursor:"pointer",fontFamily:ff,fontSize:12}}>📋 Database</button>
            <button onClick={()=>setShowCreate(true)} style={{padding:"9px 13px",background:C.bLo,border:`1px solid ${C.blu}33`,borderRadius:12,color:C.blu,fontWeight:700,cursor:"pointer",fontFamily:ff,fontSize:12}}>✏️ {lang==="en"?"Create":"Crea"}</button>
            <button onClick={()=>setShowAdd(true)} style={{padding:"9px 16px",background:`linear-gradient(135deg,${C.acc},#00C488)`,border:"none",borderRadius:12,color:"#07100D",fontWeight:900,cursor:"pointer",fontFamily:ff,fontSize:13}}>+ {lang==="en"?"Add":"Aggiungi"}</button>
          </div>
        </div>
        {/* Categoria pills */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {grouped.map(cat=>(
            <div key={cat.key} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:20,background:`${cat.color}18`,border:`1px solid ${cat.color}33`,fontSize:11,fontWeight:700,color:cat.color}}>
              <span>{cat.emoji}</span>
              <span>{cat.items.length}</span>
            </div>
          ))}
        </div>
      </div>

      {dedupedPantry.length===0&&(
        <div style={{...cS,textAlign:"center",padding:"40px 20px",marginTop:20}}>
          <div style={{fontSize:48,marginBottom:14}}>🫙</div>
          <div style={{fontWeight:700,fontSize:16,marginBottom:8}}>{lang==="en"?"Pantry is empty":"La credenza è vuota"}</div>
          <div style={{fontSize:14,color:C.mid,lineHeight:1.6,marginBottom:20}}>{lang==="en"?"Add items you have at home. The app will use them to generate meals automatically.":"Aggiungi gli alimenti che hai in casa. La app li userà per generare i pasti automatici."}</div>
          <button onClick={()=>setShowAdd(true)} style={{...bP,width:"auto",padding:"14px 24px"}}>{lang==="en"?"Add first item":"Aggiungi primo alimento"}</button>
        </div>
      )}

      {grouped.map(cat=>(
        <div key={cat.key} style={{marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,paddingBottom:8,borderBottom:`2px solid ${cat.color}44`}}>
            <span style={{fontSize:18}}>{cat.emoji}</span>
            <div style={{fontSize:13,fontWeight:800,color:cat.color,letterSpacing:.8,textTransform:"uppercase"}}>
              {lang==="en"?cat.labelEn:cat.labelIt}
            </div>
            <div style={{fontSize:11,color:C.mid,marginLeft:"auto"}}>{cat.items.length}</div>
          </div>
          {cat.items.map(it=>{
            const isExhausted=it.qty<=0;
            const isLow=!isExhausted&&it.qty<100;
            const borderColor=isExhausted?C.red:isLow?C.yel:C.bord;
            const bgOverlay=isExhausted?`${C.red}0A`:isLow?`${C.yel}08`:"transparent";
            const exhaustedHrs=it.exhaustedAt?Math.round((Date.now()-it.exhaustedAt)/3600000):0;
            return (
            <div key={it.id} style={{...cS,marginBottom:8,border:`1.5px solid ${borderColor}`,background:`${C.card}`,position:"relative",overflow:"hidden"}}>
              {(isLow||isExhausted)&&<div style={{position:"absolute",inset:0,background:bgOverlay,pointerEvents:"none"}}/>}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:22,opacity:isExhausted?0.45:1}}>{it.food.emoji}</span>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                      <span style={{fontWeight:700,fontSize:14,color:isExhausted?C.mid:C.txt}}>{getFoodName(it.food,lang)}</span>
                      {isExhausted&&<span style={{fontSize:10,fontWeight:800,color:C.red,background:`${C.red}18`,border:`1px solid ${C.red}44`,borderRadius:6,padding:"1px 6px",letterSpacing:.5}}>ESAURITO</span>}
                      {isLow&&<span style={{fontSize:10,fontWeight:800,color:C.yel,background:`${C.yel}18`,border:`1px solid ${C.yel}44`,borderRadius:6,padding:"1px 6px",letterSpacing:.5}}>⚠ BASSO</span>}
                    </div>
                    <div style={{fontSize:11,color:C.mid}}>
                      {it.food.cal} kcal · P:{it.food.p}g C:{it.food.c}g G:{it.food.f}g
                      {isExhausted&&it.exhaustedAt&&<span style={{color:C.red,marginLeft:6}}>· esaurito {exhaustedHrs}h fa</span>}
                    </div>
                  </div>
                </div>
                <button onClick={()=>removeItem(it.id)} style={{background:C.rLo,border:"none",borderRadius:9,padding:"6px 10px",color:C.red,cursor:"pointer",fontSize:14,fontFamily:ff}}>✕</button>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <button onClick={()=>addQtyToItem(it.id,-50)} style={{width:34,height:34,borderRadius:9,background:C.surf,border:`1px solid ${C.bord}`,color:C.txt,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:ff}}>−</button>
                <input type="number" value={editQty[it.id]!==undefined?editQty[it.id]:it.qty} onChange={e=>setEditQty(prev=>({...prev,[it.id]:e.target.value}))} onBlur={e=>{updateQty(it.id,e.target.value);setEditQty(prev=>{const x={...prev};delete x[it.id];return x;});}} style={{flex:1,background:C.surf,border:`1.5px solid ${borderColor}`,color:isExhausted?C.red:isLow?C.yel:C.txt,padding:"7px",borderRadius:9,textAlign:"center",fontSize:16,fontWeight:700,outline:"none",fontFamily:ff}}/>
                <span style={{color:C.mid,fontSize:13,fontWeight:600}}>{it.unit||"g"}</span>
                <button onClick={()=>addQtyToItem(it.id,50)} style={{width:34,height:34,borderRadius:9,background:isExhausted?`${C.acc}22`:C.surf,border:`1.5px solid ${isExhausted?C.acc:C.bord}`,color:isExhausted?C.acc:C.txt,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:ff}}>+</button>
              </div>
              {isExhausted&&<div style={{marginTop:8,fontSize:11,color:C.acc,textAlign:"center",fontWeight:600}}>
                {lang==="en"?"Add quantity to restore this item":"+ Aggiungi quantità per ripristinare"}
              </div>}
            </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// PROGRESS SCREEN

// PIANO ALIMENTARE - piano settimanale 7 giorni
function MealPlanScreen({weeklyPlan,mealList,targets,lang,onGenerate,onGenerateFromPantry,onReset,onMealClick,onOpenDietLibrary,onBack}) {
  const DAY_IT=["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];
  const DAY_EN=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const dayNames=lang==="en"?DAY_EN:DAY_IT;
  const jsDay=new Date().getDay();
  const todayIdx=(jsDay+6)%7;
  const [selDay,setSelDay]=useState(todayIdx);

  if(!weeklyPlan) return (
    <div style={{...ss,overflowY:"auto",paddingBottom:70}}>
      <div style={{position:"sticky",top:0,background:C.surf,borderBottom:`1px solid ${C.bord}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{width:36,height:36,borderRadius:10,background:C.card,border:`1px solid ${C.bord}`,color:C.txt,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:ff}}>‹</button>
        <div style={{fontSize:17,fontWeight:900}}>{t("pianoTitle",lang)}</div>
      </div>
      <div style={{padding:"20px 16px"}}>
        <div style={{fontSize:13,color:C.mid,marginBottom:24}}>{lang==="en"?"7 days · best nutritional quality foods":"7 giorni · cibi a migliore qualità nutrizionale"}</div>
        <div style={{...cS,textAlign:"center",padding:"44px 20px"}}>
          <div style={{fontSize:56,marginBottom:16}}>📅</div>
          <div style={{fontWeight:800,fontSize:16,marginBottom:8}}>{t("noPlan",lang)}</div>
          <div style={{fontSize:13,color:C.mid,lineHeight:1.7,marginBottom:28}}>{t("noPlanDesc",lang)}</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <button onClick={()=>onGenerate()} style={bP}>🗄️ {lang==="en"?"Generate from Database":"Genera con Database"}</button>
            <button onClick={()=>onGenerateFromPantry()} style={{...bP,background:C.bLo,border:`1px solid ${C.blu}33`,color:C.blu}}>🫙 {lang==="en"?"Generate from Pantry":"Genera con Credenza"}</button>
            <button onClick={()=>onOpenDietLibrary&&onOpenDietLibrary()} style={{...bP,background:"#D2992218",border:`1px solid ${C.yel}33`,color:C.yel}}>📚 {lang==="en"?"Diet Library":"Libreria Diete"}</button>
          </div>
        </div>
      </div>
    </div>
  );

  const dayPlan=weeklyPlan[selDay]||{};

  // Totale giornaliero del giorno selezionato
  const dayTot = totals(Object.values(dayPlan).flat());

  return (
    <div style={{...ss,overflowY:"auto",paddingBottom:70}}>
      <div style={{position:"sticky",top:0,background:C.surf,borderBottom:`1px solid ${C.bord}`,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{width:36,height:36,borderRadius:10,background:C.card,border:`1px solid ${C.bord}`,color:C.txt,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:ff}}>‹</button>
        <div style={{flex:1}}>
          <div style={{fontSize:17,fontWeight:900}}>{t("pianoTitle",lang)}</div>
          <div style={{fontSize:11,color:C.mid}}>{t("pianoSubtitle",lang)}</div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>onGenerate()} title={lang==="en"?"Database":"Database"} style={{width:34,height:34,borderRadius:10,background:C.aLo,border:`1px solid ${C.acc}33`,color:C.acc,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:ff}}>🗄️</button>
          <button onClick={()=>onGenerateFromPantry()} title={lang==="en"?"Pantry":"Credenza"} style={{width:34,height:34,borderRadius:10,background:C.bLo,border:`1px solid ${C.blu}33`,color:C.blu,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:ff}}>🫙</button>
          <button onClick={()=>onOpenDietLibrary&&onOpenDietLibrary()} title={lang==="en"?"Library":"Libreria"} style={{width:34,height:34,borderRadius:10,background:"#D2992218",border:`1px solid ${C.yel}33`,color:C.yel,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:ff}}>📚</button>
          <button onClick={onReset} title={lang==="en"?"Reset":"Azzera"} style={{width:34,height:34,borderRadius:10,background:C.rLo,border:`1px solid ${C.red}33`,color:C.red,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:ff}}>🗑️</button>
        </div>
      </div>
      <div style={{padding:"16px"}}>

      {/* Totale giornaliero */}
      <div style={{...cS,background:`linear-gradient(135deg,${C.aLo},${C.card})`,border:`1px solid ${C.acc}44`,marginBottom:16,padding:"14px 16px"}}>
        <div style={{fontSize:11,fontWeight:700,color:C.acc+"80",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>
          {lang==="en"?"Daily total":"Totale giornaliero"} · {dayNames[selDay]}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
          {[
            ["kcal",rnd(dayTot.cal),`/ ${targets?.calories||0}`,C.txt],
            [lang==="en"?"Prot":"Prot",`${rnd(dayTot.p)}g`,`/ ${targets?.protein||0}g`,C.acc],
            [lang==="en"?"Carbs":"Carbo",`${rnd(dayTot.c)}g`,`/ ${targets?.carbs||0}g`,C.blu],
            [lang==="en"?"Fat":"Grassi",`${rnd(dayTot.f)}g`,`/ ${targets?.fat||0}g`,C.ora],
          ].map(([l,v,sub,c])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontSize:17,fontWeight:800,color:c}}>{v}</div>
              <div style={{fontSize:10,color:C.mid,marginTop:1}}>{sub}</div>
              <div style={{fontSize:10,color:C.mid}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:4}}>
          {[[dayTot.p,targets?.protein,C.acc],[dayTot.c,targets?.carbs,C.blu],[dayTot.f,targets?.fat,C.ora]].map(([v,tg,c],i)=>{
            const pct=Math.min(100,(v/(tg||1))*100);
            return <div key={i} style={{flex:1,background:C.dim,borderRadius:4,height:4}}><div style={{width:`${pct}%`,background:c,height:4,borderRadius:4}}/></div>;
          })}
        </div>
      </div>

      {/* Selettore giorno */}
      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:12,marginBottom:20}}>
        {dayNames.map((day,i)=>(
          <button key={i} onClick={()=>setSelDay(i)} style={{
            padding:"9px 13px",borderRadius:12,border:i===todayIdx?`2px solid ${C.acc}`:`1px solid ${C.bord}`,
            background:selDay===i?C.acc:C.surf,
            color:selDay===i?"#0D1117":i===todayIdx?C.acc:C.mid,
            fontWeight:700,cursor:"pointer",fontSize:11,whiteSpace:"nowrap",fontFamily:ff,flexShrink:0,
          }}>
            {day.slice(0,3)}{i===todayIdx?" •":""}
          </button>
        ))}
      </div>

      <div style={{fontSize:17,fontWeight:800,marginBottom:14}}>
        {dayNames[selDay]}{selDay===todayIdx&&<span style={{fontSize:12,color:C.acc,fontWeight:600,marginLeft:8}}>({lang==="en"?"today":"oggi"})</span>}
      </div>

      {mealList.map(meal=>{
        const mKey=meal.name;
        const items=dayPlan[mKey]||[];
        const tot3=totals(items);
        const mTgt=mealTarget(targets,mKey,mealList.length);
        const recipeName=items[0]?.recipeName;
        return (
          <div key={mKey} onClick={()=>onMealClick&&onMealClick(mKey,selDay,items,mTgt)} style={{...cS,marginBottom:12,cursor:onMealClick?"pointer":"default"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:42,height:42,background:C.surf,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{meal.icon}</div>
                <div>
                  <div style={{fontWeight:800,fontSize:14}}>{_lang==="en"&&meal.nameEn?meal.nameEn:mKey}</div>
                  {recipeName&&<div style={{fontSize:11,color:C.acc,marginTop:1}}>{recipeName}</div>}
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontWeight:800,color:C.acc,fontSize:15}}>{rnd(tot3.cal)} kcal</div>
                <div style={{fontSize:10,color:tot3.cal>mTgt.calories*1.08?C.red:C.mid}}>target {mTgt.calories}</div>
              </div>
            </div>
            {items.map((item,i)=>{
              const div3=item.food.unit==="pz"?1:100;
              const x3=item.quantity/div3;
              return (
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:i<items.length-1?8:0,marginBottom:i<items.length-1?8:0,borderBottom:i<items.length-1?`1px solid ${C.dim}`:"none"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:18,flexShrink:0}}>{item.food.emoji}</span>
                    <div>
                      <div style={{fontWeight:600,fontSize:13}}>{getFoodName(item.food)}</div>
                      <div style={{fontSize:11,color:C.mid}}>{item.quantity}{item.food.unit||"g"}</div>
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontWeight:700,color:C.acc,fontSize:12}}>{rnd(item.food.cal*x3)} kcal</div>
                    <div style={{fontSize:10,color:C.mid}}>P:{rnd(item.food.p*x3)} C:{rnd(item.food.c*x3)} G:{rnd(item.food.f*x3)}</div>
                  </div>
                </div>
              );
            })}
            <div style={{display:"flex",gap:6,marginTop:10,paddingTop:8,borderTop:`1px solid ${C.dim}`}}>
              {[["P",rnd(tot3.p),C.acc],["C",rnd(tot3.c),C.blu],["G",rnd(tot3.f),C.ora]].map(([l,v,c])=>(
                <div key={l} style={{flex:1,background:C.surf,borderRadius:8,padding:"5px 0",textAlign:"center"}}>
                  <div style={{fontSize:12,fontWeight:800,color:c}}>{v}g</div>
                  <div style={{fontSize:10,color:C.mid}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}


// PLAN MEAL DETAIL SCREEN - gestione pasto dal piano importato con credenza
function PlanMealDetailScreen({mealName,dayIdx,items,target,pantry,lang,optimize,filterRealisticItems,onBack,onSave}) {
  const DAY_IT=["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];
  const DAY_EN=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const dayNames=lang==="en"?DAY_EN:DAY_IT;

  const [mode,setMode]=useState("view"); // view|auto|manual
  const [currentItems,setCurrentItems]=useState(items||[]);
  const [selectedFoods,setSelectedFoods]=useState([]); // [{food,checked}] per modalità manuale
  const [generatedItems,setGeneratedItems]=useState([]);
  const [search,setSearch]=useState("");

  const mealTot=totals(currentItems);

  // Alimenti disponibili in credenza
  const pantryFoods=pantry.filter(it=>it.qty>0).map(it=>it.food);

  const filteredPantry=pantryFoods.filter(f=>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  // Genera automaticamente da credenza usando la selezione strutturata
  const handleAutoGenerate=()=>{
    if(!pantryFoods.length){ setMode("auto"); setGeneratedItems([]); return; }
    const _pmKey=resolveItalianMealKey(mealName);
    const _pmRecipes=WEEK_RECIPES[_pmKey]||WEEK_RECIPES["Pranzo"];
    const foods=selectPantryFoodsForRecipe(mealName, pantryFoods, _pmRecipes, 0, {});
    if(!foods.length){ setMode("auto"); setGeneratedItems([]); return; }
    const qtys=optimize(foods,target);
    const raw=foods.map((food,i)=>({food,quantity:qtys[i]}));
    const filtered=filterRealisticItems(raw,target);
    setGeneratedItems(filtered);
    setMode("auto");
  };

  const confirmAuto=()=>{
    setCurrentItems(generatedItems);
    setMode("view");
  };

  // Modalità manuale: toggle selezione alimento
  const toggleFood=(food)=>{
    setSelectedFoods(prev=>{
      const exists=prev.find(f=>f.food.name===food.name);
      if(exists) return prev.filter(f=>f.food.name!==food.name);
      return [...prev,{food}];
    });
  };

  // Calcola quantità per alimenti selezionati manualmente
  const handleManualConfirm=()=>{
    const foods=selectedFoods.map(sf=>sf.food);
    if(!foods.length) return;
    const qtys=optimize(foods,target);
    const raw=foods.map((food,i)=>({food,quantity:qtys[i]}));
    const filtered=filterRealisticItems(raw,target);
    setCurrentItems(filtered);
    setSelectedFoods([]);
    setSearch("");
    setMode("view");
  };

  const autoTot=totals(generatedItems);
  const isSelectedFood=(food)=>!!selectedFoods.find(f=>f.food.name===food.name);

  return (
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:200,display:"flex",flexDirection:"column"}}>
      {/* Header */}
      <div style={{padding:"16px 20px",background:C.surf,borderBottom:`1px solid ${C.bord}`,display:"flex",alignItems:"center",gap:14,flexShrink:0}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:C.acc,fontSize:22,cursor:"pointer",padding:"4px 8px",fontFamily:ff}}>‹</button>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:16}}>{mealName}</div>
          <div style={{fontSize:12,color:C.mid}}>{dayNames[dayIdx]} · target {target.calories} kcal · P:{target.protein}g C:{target.carbs}g G:{target.fat}g</div>
        </div>
        <button onClick={()=>{
          if(mode==="manual"&&selectedFoods.length>0){
            const foods=selectedFoods.map(sf=>sf.food);
            const qtys=optimize(foods,target);
            const raw=foods.map((food,i)=>({food,quantity:qtys[i]}));
            const filtered=filterRealisticItems(raw,target);
            onSave(filtered);
          } else {
            onSave(currentItems);
          }
        }} style={{...bP,padding:"10px 16px",fontSize:12}}>
          ✓ {lang==="en"?"Save":"Salva"}
        </button>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"16px 20px 100px"}}>

        {/* Vista corrente pasto */}
        {mode==="view"&&(
          <>
            {/* Riepilogo macro */}
            <div style={{...cS,background:`linear-gradient(135deg,${C.aLo},${C.card})`,border:`1px solid ${C.acc}44`,marginBottom:16,padding:"14px 16px"}}>
              <div style={{fontSize:11,fontWeight:700,color:C.acc+"80",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>
                {lang==="en"?"Current meal":"Pasto corrente"}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                {[
                  ["kcal",rnd(mealTot.cal),target.calories,C.txt],
                  ["P",`${rnd(mealTot.p)}g`,`${target.protein}g`,C.acc],
                  ["C",`${rnd(mealTot.c)}g`,`${target.carbs}g`,C.blu],
                  ["G",`${rnd(mealTot.f)}g`,`${target.fat}g`,C.ora],
                ].map(([l,v,tg,c])=>(
                  <div key={l} style={{textAlign:"center"}}>
                    <div style={{fontSize:16,fontWeight:800,color:c}}>{v}</div>
                    <div style={{fontSize:10,color:C.mid}}>/ {tg}</div>
                    <div style={{fontSize:10,color:C.mid}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alimenti del pasto */}
            {currentItems.length>0?(
              <div style={{...cS,marginBottom:16}}>
                {currentItems.map((item,i)=>{
                  const div=item.food.unit==="pz"?1:100;
                  const x=item.quantity/div;
                  return (
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:i<currentItems.length-1?10:0,marginBottom:i<currentItems.length-1?10:0,borderBottom:i<currentItems.length-1?`1px solid ${C.dim}`:"none"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}>
                        <span style={{fontSize:20,flexShrink:0}}>{item.food.emoji}</span>
                        <div style={{minWidth:0,flex:1}}>
                          <div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{getFoodName(item.food)}</div>
                          <div style={{fontSize:11,color:C.mid}}>{item.quantity}{item.food.unit||"g"} · {rnd(item.food.cal*x)} kcal</div>
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:10,color:C.mid}}>P:{rnd(item.food.p*x)} C:{rnd(item.food.c*x)} G:{rnd(item.food.f*x)}</div>
                        </div>
                        <button onClick={()=>setCurrentItems(prev=>prev.filter((_,j)=>j!==i))}
                          style={{width:28,height:28,borderRadius:8,background:C.rLo,border:`1px solid ${C.red}44`,color:C.red,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:ff,flexShrink:0}}>
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ):(
              <div style={{...cS,textAlign:"center",padding:"32px 20px",marginBottom:16}}>
                <div style={{fontSize:32,marginBottom:8}}>🫙</div>
                <div style={{fontSize:13,color:C.mid}}>{lang==="en"?"No foods in this meal":"Nessun alimento in questo pasto"}</div>
              </div>
            )}

            {/* Bottoni azione */}
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <button onClick={handleAutoGenerate} style={{...bP,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                <span>⚡</span>
                <span>{lang==="en"?"Auto-generate from Pantry":"Genera automaticamente dalla Credenza"}</span>
              </button>
              <button onClick={()=>{setMode("manual");setSearch("");}} style={{...bP,background:C.bLo,border:`1px solid ${C.blu}33`,color:C.blu,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                <span>🫙</span>
                <span>{lang==="en"?"Choose from Pantry":"Scegli dalla Credenza"}</span>
              </button>
            </div>
          </>
        )}

        {/* Modalità auto: preview risultato */}
        {mode==="auto"&&(
          <>
            <div style={{fontWeight:800,fontSize:16,marginBottom:4}}>{lang==="en"?"Generated meal":"Pasto generato"}</div>
            <div style={{fontSize:12,color:C.mid,marginBottom:16}}>{lang==="en"?"Based on your Pantry":"Basato sulla tua Credenza"}</div>

            {generatedItems.length===0?(
              <div style={{...cS,textAlign:"center",padding:"32px 20px",marginBottom:16}}>
                <div style={{fontSize:32,marginBottom:8}}>🫙</div>
                <div style={{fontWeight:700,marginBottom:6}}>{lang==="en"?"Pantry empty":"Credenza vuota"}</div>
                <div style={{fontSize:13,color:C.mid}}>{lang==="en"?"Add foods to your Pantry first.":"Aggiungi alimenti alla Credenza prima."}</div>
              </div>
            ):(
              <>
                <div style={{...cS,background:`linear-gradient(135deg,${C.aLo},${C.card})`,border:`1px solid ${C.acc}44`,marginBottom:12,padding:"12px 16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    {[["kcal",rnd(autoTot.cal),target.calories,C.txt],["P",`${rnd(autoTot.p)}g`,`${target.protein}g`,C.acc],["C",`${rnd(autoTot.c)}g`,`${target.carbs}g`,C.blu],["G",`${rnd(autoTot.f)}g`,`${target.fat}g`,C.ora]].map(([l,v,tg,c])=>(
                      <div key={l} style={{textAlign:"center"}}>
                        <div style={{fontSize:15,fontWeight:800,color:c}}>{v}</div>
                        <div style={{fontSize:10,color:C.mid}}>/ {tg}</div>
                        <div style={{fontSize:10,color:C.mid}}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{...cS,marginBottom:16}}>
                  {generatedItems.map((item,i)=>{
                    const div=item.food.unit==="pz"?1:100;
                    const x=item.quantity/div;
                    return (
                      <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:i<generatedItems.length-1?10:0,marginBottom:i<generatedItems.length-1?10:0,borderBottom:i<generatedItems.length-1?`1px solid ${C.dim}`:"none"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <span style={{fontSize:20}}>{item.food.emoji}</span>
                          <div>
                            <div style={{fontWeight:600,fontSize:13}}>{getFoodName(item.food)}</div>
                            <div style={{fontSize:11,color:C.mid}}>{item.quantity}{item.food.unit||"g"}</div>
                          </div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontWeight:700,color:C.acc,fontSize:12}}>{rnd(item.food.cal*x)} kcal</div>
                          <div style={{fontSize:10,color:C.mid}}>P:{rnd(item.food.p*x)} C:{rnd(item.food.c*x)} G:{rnd(item.food.f*x)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setMode("view")} style={{...bP,flex:1,background:C.surf,border:`1px solid ${C.bord}`,color:C.txt}}>{lang==="en"?"Back":"Indietro"}</button>
              {generatedItems.length>0&&<button onClick={confirmAuto} style={{...bP,flex:2}}>{lang==="en"?"Apply":"Applica"}</button>}
            </div>
          </>
        )}

        {/* Modalità manuale: lista credenza con checkbox - suddivisa per categoria */}
        {mode==="manual"&&(
          <>
            <div style={{fontWeight:800,fontSize:16,marginBottom:4}}>{lang==="en"?"Choose from Pantry":"Scegli dalla Credenza"}</div>
            <div style={{fontSize:12,color:C.mid,marginBottom:12}}>{lang==="en"?"Select foods, app calculates quantities":"Seleziona gli alimenti, la app calcola le quantità"}</div>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder={lang==="en"?"Search...":"Cerca..."} 
              style={{width:"100%",padding:"11px 14px",borderRadius:12,border:`1px solid ${C.bord}`,background:C.surf,color:C.txt,fontSize:14,fontFamily:ff,marginBottom:14,boxSizing:"border-box",outline:"none"}}/>
            {pantryFoods.length===0?(
              <div style={{...cS,textAlign:"center",padding:"32px 20px"}}>
                <div style={{fontSize:32,marginBottom:8}}>🫙</div>
                <div style={{fontWeight:700,marginBottom:6}}>{lang==="en"?"Pantry empty":"Credenza vuota"}</div>
                <div style={{fontSize:13,color:C.mid}}>{lang==="en"?"Add foods to your Pantry first.":"Aggiungi alimenti alla Credenza prima."}</div>
              </div>
            ):(()=>{
              // Deduplicazione + filtro ricerca + raggruppamento
              const searchLow=search.toLowerCase();
              const filtered=searchLow
                ? pantryFoods.filter(f=>f.name.toLowerCase().includes(searchLow))
                : pantryFoods;
              const groups=groupPantryFoods(filtered);
              if(groups.length===0) return <div style={{...cS,textAlign:"center",padding:"24px",color:C.mid}}>{lang==="en"?"No results":"Nessun risultato"}</div>;
              return groups.map(cat=>(
                <div key={cat.key} style={{marginBottom:20}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,paddingBottom:6,borderBottom:`2px solid ${cat.color}44`}}>
                    <span style={{fontSize:14}}>{cat.emoji}</span>
                    <span style={{fontSize:11,fontWeight:800,color:cat.color,letterSpacing:.8,textTransform:"uppercase"}}>{lang==="en"?cat.labelEn:cat.labelIt}</span>
                  </div>
                  {cat.items.map((food,i)=>{
                    const sel=isSelectedFood(food);
                    return (
                      <div key={i} onClick={()=>toggleFood(food)} style={{...cS,marginBottom:6,cursor:"pointer",border:`2px solid ${sel?cat.color:C.bord}`,background:sel?cat.color+"18":C.card,display:"flex",alignItems:"center",gap:10,padding:"10px 12px"}}>
                        <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${sel?cat.color:C.mid}`,background:sel?cat.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          {sel&&<span style={{color:"#0D1117",fontSize:12,fontWeight:900}}>✓</span>}
                        </div>
                        <span style={{fontSize:18,flexShrink:0}}>{food.emoji}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{getFoodName(food)}</div>
                          <div style={{fontSize:10,color:C.mid}}>{food.cal} kcal · P:{food.p} C:{food.c} G:{food.f}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ));
            })()}
            <div style={{height:80}}/>
          </>
        )}
      </div>

      {/* Bottom bar per modalità manuale */}
      {mode==="manual"&&(
        <div style={{position:"fixed",bottom:0,left:0,right:0,padding:"12px 20px",background:C.surf,borderTop:`1px solid ${C.bord}`,display:"flex",gap:10}}>
          <button onClick={()=>{setMode("view");setSelectedFoods([]);setSearch("");}} style={{...bP,flex:1,background:C.surf,border:`1px solid ${C.bord}`,color:C.txt}}>{lang==="en"?"Cancel":"Annulla"}</button>
          <button onClick={handleManualConfirm} disabled={selectedFoods.length===0} style={{...bP,flex:2,opacity:selectedFoods.length===0?0.4:1}}>
            {lang==="en"?`Apply ${selectedFoods.length} foods`:`Applica ${selectedFoods.length} aliment${selectedFoods.length===1?"o":"i"}`}
          </button>
        </div>
      )}
    </div>
  );
}

// PROFILE SCREEN (include progressi peso)
function ProfileScreen({profile,setProfile,targets,user,weightLog,newWeight,setNewWeight,onLog,onCalc,onLogout,onReset,onManualMacros,onSaveExcluded,onSaveProfile,lang,onChangeLang,onShowProgress,onOpenPiano,onOpenImport,onOpenDietLibrary}) {
  const [editing,setEditing]=useState(false);
  const [editMacros,setEditMacros]=useState(false);
  const [macroForm,setMacroForm]=useState(null);
  const p=(k,v)=>setProfile(prev=>({...prev,[k]:v}));
  const goal=GOALS.find(g=>g.val===profile.goal);

  return (
    <div style={{padding:"52px 20px 100px",overflowY:"auto"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <Logo size={44}/>
          <div>
            <div style={{fontSize:20,fontWeight:800}}>{profile.name||"NutriCalc"}</div>
            <div style={{fontSize:13,color:C.mid}}>{user?.email||(lang==="en"?"Nutrition plan":"Piano alimentare")}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onReset} style={{background:"#FFF3E0",border:"1px solid #FBBF8833",borderRadius:10,padding:"8px 14px",color:C.ora,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:ff}}>{t("reset",lang)}</button>
        </div>
      </div>
      {/* Quick actions row */}
      <div style={{display:"flex",gap:10,marginBottom:20}}>
        {[
          [onShowProgress,"📊",lang==="en"?"Progress":"Progressi",C.acc],
          [onOpenPiano,"📅",lang==="en"?"Meal Plan":"Piano",C.blu],
          [onOpenImport,"📥",lang==="en"?"Import":"Importa",C.yel],
          [onOpenDietLibrary,"⚖️",lang==="en"?"Protocols":"Protocolli",C.ora],
        ].map(([fn,ic,lbl,col])=>(
          <button key={lbl} onClick={fn} style={{flex:1,padding:"14px 4px",background:C.card,border:`1.5px solid ${col}33`,borderRadius:16,cursor:"pointer",fontFamily:ff,display:"flex",flexDirection:"column",alignItems:"center",gap:6,transition:"border-color .2s"}}>
            <span style={{fontSize:22}}>{ic}</span>
            <span style={{fontSize:10,fontWeight:700,color:col,letterSpacing:.3}}>{lbl}</span>
          </button>
        ))}
      </div>

      {/* Piano corrente */}
      {targets&&(()=>{
        const totKcal = targets.protein*4 + targets.carbs*4 + targets.fat*9;
        const pPct = totKcal>0 ? Math.round(targets.protein*4/totKcal*100) : 30;
        const cPct = totKcal>0 ? Math.round(targets.carbs*4/totKcal*100) : 45;
        const fPct = 100 - pPct - cPct;
        const recalcFromCal = (cal, pp, cp, fp) => ({
          calories: cal,
          protein:  Math.round(cal * pp/100 / 4),
          carbs:    Math.round(cal * cp/100 / 4),
          fat:      Math.round(cal * fp/100 / 9),
        });
        return (
        <div style={{...cS,background:`linear-gradient(135deg, ${C.aLo}, ${C.card})`,border:`1px solid ${C.acc}44`,marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:C.acc+"80",letterSpacing:1,textTransform:"uppercase"}}>Piano corrente · {goal?(_lang==="en"?goal.labelEn:goal.labelIt):""}</div>
            <button onClick={()=>{
              setEditMacros(!editMacros);
              setMacroForm({
                calories: targets.calories,
                protein:  targets.protein,
                carbs:    targets.carbs,
                fat:      targets.fat,
                pPct, cPct, fPct,
              });
            }} style={{padding:"4px 12px",background:editMacros?C.acc:C.aLo2,border:`1px solid ${C.acc}44`,borderRadius:8,color:editMacros?"#0D1117":C.acc,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:ff}}>
              {editMacros?"✓ Chiudi":"✏️ Modifica"}
            </button>
          </div>

          {!editMacros&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
                {[["kcal",targets.calories,"","#1a1a1a",C.txt],["Prot",`${targets.protein}g`,`${pPct}%`,"",C.acc],["Carbo",`${targets.carbs}g`,`${cPct}%`,"",C.blu],["Grassi",`${targets.fat}g`,`${fPct}%`,"",C.ora]].map(([l,v,pct,bg,c])=>(
                  <div key={l} style={{textAlign:"center"}}>
                    <div style={{fontSize:18,fontWeight:800,color:c}}>{v}</div>
                    {pct&&<div style={{fontSize:11,fontWeight:700,color:c,opacity:.7,marginTop:1}}>{pct}</div>}
                    <div style={{fontSize:11,color:C.mid,marginTop:2}}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",borderRadius:8,overflow:"hidden",height:8,gap:2}}>
                <div style={{width:`${pPct}%`,background:C.acc,borderRadius:"8px 0 0 8px"}}/>
                <div style={{width:`${cPct}%`,background:C.blu}}/>
                <div style={{flex:1,background:C.ora,borderRadius:"0 8px 8px 0"}}/>
              </div>
              <div style={{display:"flex",gap:16,marginTop:8}}>
                {[["Prot",pPct,C.acc],["Carbo",cPct,C.blu],["Grassi",fPct,C.ora]].map(([l,v,c])=>(
                  <div key={l} style={{display:"flex",alignItems:"center",gap:4}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:c}}/>
                    <span style={{fontSize:11,color:C.mid}}>{l} <strong style={{color:c}}>{v}%</strong></span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {editMacros&&macroForm&&(()=>{
            const mf = macroForm;
            const sumPct = (mf.pPct||0)+(mf.cPct||0)+(mf.fPct||0);
            const balanced = sumPct===100;
            const updateCal = (cal) => {
              const updated = recalcFromCal(cal, mf.pPct, mf.cPct, mf.fPct);
              setMacroForm(prev=>({...prev,...updated,calories:cal}));
            };
            const updatePct = (key, val) => {
              const newForm = {...mf, [key]: val};
              const s = (newForm.pPct||0)+(newForm.cPct||0)+(newForm.fPct||0);
              if(s===100) {
                const updated = recalcFromCal(newForm.calories, newForm.pPct, newForm.cPct, newForm.fPct);
                setMacroForm({...newForm,...updated});
              } else {
                setMacroForm(newForm);
              }
            };
            return (
              <div>
                <div style={{fontSize:12,color:C.mid,marginBottom:14,lineHeight:1.5}}>
                  Modifica le calorie totali oppure le percentuali dei macro. I grammi si aggiornano automaticamente quando la somma delle percentuali fa 100%.
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,color:C.mid,marginBottom:4,fontWeight:600}}>Calorie totali</div>
                  <div style={{display:"flex",alignItems:"center",background:C.surf,borderRadius:10,border:`1.5px solid ${C.acc}44`}}>
                    <input type="number" value={mf.calories} onChange={e=>updateCal(parseInt(e.target.value)||0)} style={{flex:1,background:"none",border:"none",color:C.txt,padding:"10px 14px",fontSize:17,fontWeight:800,outline:"none",fontFamily:ff}}/>
                    <span style={{color:C.mid,paddingRight:12,fontSize:12}}>kcal</span>
                  </div>
                </div>
                <div style={{...cS,background:C.bg,marginBottom:12,padding:"12px 14px"}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.mid,letterSpacing:.8,textTransform:"uppercase",marginBottom:10}}>Distribuzione macro</div>
                  {[["pPct","Proteine",C.acc],["cPct","Carboidrati",C.blu],["fPct","Grassi",C.ora]].map(([k,label,c])=>(
                    <div key={k} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:12,color:C.mid,fontWeight:600}}>{label}</span>
                        <span style={{fontSize:12,fontWeight:800,color:c}}>{mf[k]}%</span>
                      </div>
                      <input type="range" min="5" max="70" value={mf[k]} onChange={e=>updatePct(k,parseInt(e.target.value))}
                        style={{width:"100%",accentColor:c,cursor:"pointer"}}/>
                    </div>
                  ))}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4}}>
                    <div style={{fontSize:12,color:C.mid}}>Somma: <strong style={{color:balanced?C.acc:C.red}}>{sumPct}%</strong></div>
                    {!balanced&&<div style={{fontSize:11,color:C.red}}>Deve fare 100%</div>}
                  </div>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:14,padding:"10px 14px",background:C.surf,borderRadius:12,border:`1px solid ${C.bord}`}}>
                  {[["Prot",`${mf.protein}g`,C.acc],["Carbo",`${mf.carbs}g`,C.blu],["Grassi",`${mf.fat}g`,C.ora]].map(([l,v,c])=>(
                    <div key={l} style={{textAlign:"center"}}>
                      <div style={{fontSize:16,fontWeight:800,color:c}}>{v}</div>
                      <div style={{fontSize:10,color:C.mid}}>{l}</div>
                    </div>
                  ))}
                </div>
                <button onClick={()=>{ onManualMacros({calories:mf.calories,protein:mf.protein,carbs:mf.carbs,fat:mf.fat}); setEditMacros(false); }} disabled={!balanced} style={{...bP,padding:"12px 20px",fontSize:14,opacity:balanced?1:.4}}>
                  Salva piano personalizzato
                </button>
              </div>
            );
          })()}
        </div>
        );
      })()}

      {/* SEZIONE PROGRESSI PESO */}
      <div style={{...cS,marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:800,color:C.txt,marginBottom:16}}>{t("progress",lang)}</div>
        {weightLog&&weightLog.length>0&&(()=>{
          const vals=weightLog.map(e=>e.weight);
          const current=vals[vals.length-1];
          const start=parseFloat(profile.weight)||vals[0];
          const delta=current-start;
          const W=360, H=110, PAD=16;
          let chart=null;
          if(weightLog.length>1) {
            const minV=Math.min(...vals)-.5, maxV=Math.max(...vals)+.5;
            const pts=weightLog.slice(-12).map((e,i,arr)=>{
              const x=PAD+(i/(arr.length-1))*(W-PAD*2);
              const y=H-PAD-(e.weight-minV)/(maxV-minV)*(H-PAD*2);
              return [x,y];
            });
            const d="M"+pts.map(pt=>pt.join(",")).join(" L");
            chart=(
              <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{display:"block",marginBottom:6}}>
                <defs><linearGradient id="pg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.acc} stopOpacity=".25"/><stop offset="100%" stopColor={C.acc} stopOpacity="0"/></linearGradient></defs>
                <path d={d+` L${pts[pts.length-1][0]},${H} L${pts[0][0]},${H} Z`} fill="url(#pg2)"/>
                <path d={d} stroke={C.acc} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                {pts.map(([x,y],i)=><circle key={i} cx={x} cy={y} r="3.5" fill={C.acc}/>)}
                <text x={pts[0][0]} y={pts[0][1]-8} textAnchor="middle" fill={C.mid} fontSize="10" fontFamily={ff}>{vals[vals.length-Math.min(12,vals.length)]}kg</text>
                <text x={pts[pts.length-1][0]} y={pts[pts.length-1][1]-8} textAnchor="middle" fill={C.acc} fontSize="11" fontWeight="700" fontFamily={ff}>{current}kg</text>
              </svg>
            );
          }
          return (
            <div>
              <div style={{display:"flex",gap:12,marginBottom:14}}>
                {[[lang==="en"?"Current":"Attuale",`${current} kg`,C.acc],[lang==="en"?"Change":"Variazione",`${delta>=0?"+":""}${Math.round(delta*10)/10} kg`,delta<0?C.acc:delta>0?C.red:C.mid]].map(([l,v,c])=>(
                  <div key={l} style={{flex:1,background:C.surf,borderRadius:12,padding:"10px 12px",textAlign:"center",border:`1px solid ${C.bord}`}}>
                    <div style={{fontSize:18,fontWeight:800,color:c,marginBottom:2}}>{v}</div>
                    <div style={{fontSize:11,color:C.mid}}>{l}</div>
                  </div>
                ))}
              </div>
              {chart}
              <div style={{fontSize:10,color:C.mid,textAlign:"center",marginBottom:12}}>{Math.min(12,weightLog.length)} {lang==="en"?"measurements":"misurazioni"}</div>
              {/* Storico compatto */}
              <div style={{maxHeight:140,overflowY:"auto"}}>
                {[...weightLog].reverse().slice(0,8).map((e,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",paddingBottom:6,marginBottom:6,borderBottom:i<7?`1px solid ${C.dim}`:"none"}}>
                    <span style={{fontSize:12,color:C.mid}}>{new Date(e.date).toLocaleDateString("it-IT",{day:"numeric",month:"short",year:"numeric"})}</span>
                    <span style={{fontSize:13,fontWeight:700}}>{e.weight} kg</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
        <div style={{display:"flex",alignItems:"center",background:C.surf,borderRadius:12,border:`1.5px solid ${C.bord}`,marginTop:12,marginBottom:10}}>
          <input type="number" value={newWeight} onChange={e=>setNewWeight(e.target.value)} placeholder={String(weightLog.length?weightLog[weightLog.length-1].weight:profile.weight||70)} style={{flex:1,background:"none",border:"none",color:C.txt,padding:"12px 16px",fontSize:17,fontWeight:700,outline:"none",fontFamily:ff}} onKeyDown={e=>e.key==="Enter"&&onLog()}/>
          <span style={{color:C.mid,paddingRight:14,fontSize:13}}>kg</span>
        </div>
        <button onClick={onLog} disabled={!newWeight} style={{...bP,padding:"13px",opacity:newWeight?1:.4}}>
          {lang==="en"?"Save weight":"Salva peso"}
        </button>
      </div>

      {/* Card BIA sempre visibile */}
      {(()=>{
        const hasBia=['bia_fm','bia_ffm','bia_smm','bia_bmr','bia_vf','bia_smi','bia_whr'].some(k=>parseFloat(profile[k])>0);
        const vf=parseFloat(profile.bia_vf)||0;
        const whr=parseFloat(profile.bia_whr)||0;
        const ffm=parseFloat(profile.bia_ffm)||0;
        const smm=parseFloat(profile.bia_smm)||0;
        const bmrBia=parseFloat(profile.bia_bmr)||0;
        return (
          <div style={{...cS,background:`${C.blu}0A`,border:`1px solid ${C.blu}33`,marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:hasBia?12:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:18}}>🔬</span>
                <div>
                  <div style={{fontSize:13,fontWeight:800,color:C.blu}}>{lang==="en"?"BIA Analysis":"Analisi BIA"}</div>
                  {!hasBia&&<div style={{fontSize:11,color:C.mid,marginTop:2}}>{lang==="en"?"No data — click Edit to enter values":"Nessun dato — clicca Modifica per inserire i valori"}</div>}
                </div>
              </div>
              <button onClick={()=>setEditing(true)} style={{padding:"6px 14px",background:C.bLo,border:`1px solid ${C.blu}44`,borderRadius:10,color:C.blu,fontWeight:700,cursor:"pointer",fontFamily:ff,fontSize:12}}>
                {hasBia?(lang==="en"?"Update":"Aggiorna"):(lang==="en"?"+ Enter data":"+ Inserisci dati")}
              </button>
            </div>
            {hasBia&&(
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {[
                  ffm>0&&["LBM",`${ffm} kg`,C.acc],
                  smm>0&&[lang==="en"?"Muscle":"Muscolo",`${smm} kg`,"#4CAF50"],
                  bmrBia>0&&["BMR",`${bmrBia} kcal`,C.blu],
                  vf>0&&[lang==="en"?"Visc.fat":"G.viscerale",`${vf}`,vf<=9?C.acc:vf<=14?C.yel:C.red],
                  whr>0&&["WHR",`${whr}`,whr<=0.85?C.acc:whr<=0.95?C.yel:C.red],
                ].filter(Boolean).map(([lbl,val,col])=>(
                  <div key={lbl} style={{padding:"6px 12px",background:col+"15",border:`1px solid ${col}33`,borderRadius:10,display:"flex",flexDirection:"column",alignItems:"center"}}>
                    <div style={{fontSize:14,fontWeight:800,color:col}}>{val}</div>
                    <div style={{fontSize:9,color:C.mid,marginTop:1,textTransform:"uppercase",letterSpacing:.5}}>{lbl}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      <button onClick={()=>{ if(editing&&onSaveProfile) onSaveProfile(profile); setEditing(!editing); }} style={{...bS,marginBottom:16}}>{editing?t("closeEdit",lang):t("editProfile",lang)}</button>

      {editing&&(
        <div style={{animation:"fadeUp .3s ease"}}>
          <div style={{marginBottom:14}}>
            <Lbl>Nome</Lbl>
            <input value={profile.name||""} onChange={e=>p("name",e.target.value)} style={inp}/>
          </div>
          <Lbl>{lang==="en"?"Biological sex":"Sesso"}</Lbl>
          <div style={{display:"flex",gap:10,marginBottom:20}}>
            {(lang==="en"?[["m","♂ Male"],["f","♀ Female"]]:[["m","♂ Uomo"],["f","♀ Donna"]]).map(([v,l])=>(
              <button key={v} onClick={()=>p("gender",v)} style={{flex:1,padding:13,borderRadius:14,border:`2px solid ${profile.gender===v?C.acc:C.bord}`,background:profile.gender===v?C.aLo:"transparent",color:profile.gender===v?C.acc:C.mid,fontWeight:700,cursor:"pointer",fontFamily:ff}}>{l}</button>
            ))}
          </div>
          {[["age",t("age",lang),"anni"],["weight",t("weight",lang),"kg"],["height",t("height",lang),"cm"],["bodyFat",t("bodyFat",lang),"%"]].map(([k,l,u])=>(
            <div key={k} style={{marginBottom:14}}>
              <Lbl>{l}</Lbl>
              <div style={{display:"flex",alignItems:"center",background:C.surf,borderRadius:14,border:`1.5px solid ${C.bord}`}}>
                <input type="number" value={profile[k]||""} onChange={e=>p(k,e.target.value)} placeholder="0" style={{flex:1,background:"none",border:"none",color:C.txt,padding:"14px 18px",fontSize:17,fontWeight:700,outline:"none",fontFamily:ff}}/>
                <span style={{color:C.mid,paddingRight:18,fontSize:14}}>{u}</span>
              </div>
            </div>
          ))}
          <Lbl>Obiettivo</Lbl>
          <div style={{display:"flex",gap:8,marginBottom:20}}>
            {GOALS.map(g=>(
              <button key={g.val} onClick={()=>p("goal",g.val)} style={{flex:1,padding:"12px 8px",borderRadius:14,border:`2px solid ${profile.goal===g.val?g.color:C.bord}`,background:profile.goal===g.val?g.color+"14":"transparent",color:profile.goal===g.val?g.color:C.mid,fontWeight:700,cursor:"pointer",fontSize:11,fontFamily:ff}}>{g.icon} {lang==="en"?g.labelEn:g.labelIt}</button>
            ))}
          </div>
          <Lbl>{lang==="en"?"Meals per day":"Pasti al giorno"}</Lbl>
          <div style={{display:"flex",gap:8,marginBottom:24}}>
            {[1,2,3,4,5].map(n=>(
              <button key={n} onClick={()=>p("numMeals",n)} style={{flex:1,padding:"13px 0",borderRadius:12,border:`2px solid ${profile.numMeals===n?C.acc:C.bord}`,background:profile.numMeals===n?C.aLo:"transparent",color:profile.numMeals===n?C.acc:C.mid,fontWeight:800,cursor:"pointer",fontSize:18,fontFamily:ff}}>{n}</button>
            ))}
          </div>
          {/* ── DATI BIA (Opzionale) ── */}
          <div style={{...cS,background:`${C.blu}0A`,border:`1px solid ${C.blu}22`,marginBottom:20,padding:"14px 16px"}}>
            <div style={{fontSize:12,fontWeight:800,color:C.blu,letterSpacing:.8,textTransform:"uppercase",marginBottom:4}}>
              🔬 {lang==="en"?"BIA Data (Optional)":"Dati BIA (Opzionale)"}
            </div>
            <div style={{fontSize:11,color:C.mid,marginBottom:14,lineHeight:1.5}}>
              {lang==="en"?"Insert values from your bioimpedance analysis for a more accurate calculation.":"Inserisci i valori dalla tua analisi bioimpedenziometrica per un calcolo più accurato."}
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
              {[
                ["bia_fm",   lang==="en"?"Fat mass (kg)":"Massa grassa (kg)"],
                ["bia_ffm",  lang==="en"?"Fat-free mass (kg)":"Massa magra (kg)"],
                ["bia_smm",  lang==="en"?"Skeletal muscle (kg)":"Muscolo scheletrico (kg)"],
                ["bia_bmr",  lang==="en"?"BMR (kcal)":"Metabolismo basale (kcal)"],
                ["bia_vf",   lang==="en"?"Visceral fat level":"Grasso viscerale"],
                ["bia_sc_fat",lang==="en"?"Subcutaneous fat (%)":"Grasso sottocutaneo (%)"],
                ["bia_smi",  "SMI"],
                ["bia_whr",  "WHR"],
              ].map(([k,lbl])=>(
                <div key={k} style={{flex:"1 0 calc(50% - 5px)",minWidth:140}}>
                  <div style={{fontSize:10,color:C.mid,marginBottom:4,fontWeight:600}}>{lbl}</div>
                  <div style={{display:"flex",alignItems:"center",background:C.surf,borderRadius:10,border:`1px solid ${C.bord}`}}>
                    <input type="number" value={profile[k]||""} onChange={e=>p(k,e.target.value)}
                      placeholder="—" step="0.1"
                      style={{flex:1,background:"none",border:"none",color:C.txt,padding:"10px 12px",fontSize:14,fontWeight:700,outline:"none",fontFamily:ff}}/>
                  </div>
                </div>
              ))}
            </div>
            {/* Analisi interpretativa */}
            {(()=>{
              const vf=parseFloat(profile.bia_vf)||0;
              const whr=parseFloat(profile.bia_whr)||0;
              const smi=parseFloat(profile.bia_smi)||0;
              const items=[];
              if(vf>0){
                const lvl=viscFatLevel(vf);
                items.push([lvl==="normal"?"✅":"⚠️", lang==="en"?"Visceral fat:":"Grasso viscerale:", lvl==="normal"?(lang==="en"?"Normal (≤9)":"Normale (≤9)"):lvl==="high"?(lang==="en"?"High (10-14) — reduce carbs":"Alto (10-14) — riduci carboidrati"):(lang==="en"?"Very high (>14) — priority: visceral reduction":"Molto alto (>14) — priorità: riduzione viscerale"), lvl==="normal"?C.acc:lvl==="high"?C.yel:C.red]);
              }
              if(whr>0){
                const risk=whr>0.95?"high":whr>0.85?"moderate":"low";
                items.push([risk==="low"?"✅":risk==="moderate"?"⚠️":"🔴", "WHR:", whr.toFixed(2)+" — "+(risk==="low"?(lang==="en"?"Low risk":"Basso rischio"):risk==="moderate"?(lang==="en"?"Moderate risk":"Rischio moderato"):(lang==="en"?"High risk — androidal distribution":"Alto rischio — distribuzione androide")), risk==="low"?C.acc:risk==="moderate"?C.yel:C.red]);
              }
              if(smi>0){
                const low=(profile.gender==="f"?smi<5.7:smi<7.0);
                items.push([low?"⚠️":"✅", "SMI:", smi.toFixed(1)+(low?(lang==="en"?" — muscle mass below threshold":"—  massa muscolare sotto soglia"):(lang==="en"?" — adequate muscle mass":" — massa muscolare adeguata")), low?C.yel:C.acc]);
              }
              if(!items.length) return null;
              return (
                <div style={{marginTop:14,borderTop:`1px solid ${C.bord}`,paddingTop:12}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.mid,marginBottom:8,letterSpacing:.5,textTransform:"uppercase"}}>{lang==="en"?"Interpretation":"Interpretazione"}</div>
                  {items.map(([ic,label,txt,col],i)=>(
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:6,padding:"6px 10px",background:col+"10",borderRadius:8,border:`1px solid ${col}22`}}>
                      <span style={{fontSize:14,flexShrink:0}}>{ic}</span>
                      <div style={{fontSize:11,color:C.txt,lineHeight:1.5}}>
                        <strong style={{color:col}}>{label}</strong> {txt}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
          <button onClick={()=>{if(onSaveProfile)onSaveProfile(profile);onCalc();setEditing(false);}} style={bP}>{t("recalcPlan",lang)}</button>
        </div>
      )}
      {/* SEZIONE ALIMENTI ESCLUSI */}
      <div style={{...cS,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:800,color:C.txt}}>{lang==="en"?"Excluded from meal plans":"Esclusi dalla generazione pasti"}</div>
          <div style={{fontSize:11,color:C.mid}}>{(profile.excludedFoods||[]).length} {lang==="en"?"active":"attivi"}</div>
        </div>
        <div style={{fontSize:12,color:C.mid,marginBottom:14,lineHeight:1.5}}>
          {lang==="en"?"These foods are never used in automatic meal plan generation.":"Questi alimenti non vengono mai usati nella generazione automatica del piano pasti."}
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:12}}>
          {EXCLUSION_TAGS.map(tag=>{
            const sel=(profile.excludedFoods||[]).includes(tag.id);
            return (
              <button key={tag.id}
                onClick={()=>{
                  const updated=sel?(profile.excludedFoods||[]).filter(x=>x!==tag.id):[...(profile.excludedFoods||[]),tag.id];
                  const pr={...profile,excludedFoods:updated};
                  setProfile(pr);
                  if(onSaveExcluded) onSaveExcluded(pr);
                }}
                style={{padding:"6px 12px",borderRadius:20,border:`2px solid ${sel?C.red:C.bord}`,background:sel?C.rLo:C.surf,color:sel?C.red:C.mid,fontWeight:700,cursor:"pointer",fontFamily:ff,fontSize:12,display:"flex",alignItems:"center",gap:4}}>
                <span style={{fontSize:14}}>{tag.emoji}</span>{lang==="en"?tag.labelEn:tag.label}
                {sel&&<span style={{fontSize:10}}>✕</span>}
              </button>
            );
          })}
        </div>
        {(profile.excludedFoods||[]).length>0&&(
          <button onClick={()=>{const pr={...profile,excludedFoods:[]};setProfile(pr);if(onSaveExcluded)onSaveExcluded(pr);}}
            style={{fontSize:12,color:C.mid,background:"none",border:"none",cursor:"pointer",fontFamily:ff,padding:"4px 0",textDecoration:"underline"}}>
            {lang==="en"?"Clear all exclusions":"Rimuovi tutte le esclusioni"}
          </button>
        )}
      </div>

      {user&&(
        <div style={{marginTop:32,paddingTop:24,borderTop:`1px solid ${C.bord}`,display:"flex",justifyContent:"flex-end"}}>
          <button onClick={onLogout} style={{background:C.rLo,border:`1px solid ${C.red}33`,borderRadius:12,padding:"10px 20px",color:C.red,cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:ff}}>
            {t("logout",lang)} →
          </button>
        </div>
      )}
    </div>
  );
}



// SAVE MEAL BUTTON con nome custom
function SaveMealBtn({onSave,lang,showLabel}) {
  const [open,setOpen]=useState(false);
  const [name,setName]=useState("");
  if(!open) return (
    <button onClick={()=>setOpen(true)} style={{padding:"10px 12px",background:"#FEFCE8",border:"1px solid #FDE68A",borderRadius:14,color:"#92400E",fontWeight:700,cursor:"pointer",fontFamily:ff,fontSize:12,flexShrink:0,display:"flex",alignItems:"center",gap:4}}>⭐{showLabel&&<span>{lang==="en"?" Save":" Salva"}</span>}</button>
  );
  return (
    <div style={{position:"fixed",inset:0,background:"#000a",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{background:C.surf,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:430,padding:"24px 20px 40px",border:`1px solid ${C.bord}`}}>
        <div style={{fontWeight:800,fontSize:16,marginBottom:14}}>⭐ {t("saveMealPrompt",lang)}</div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder={lang==="en"?"e.g. My lunch":"es. Il mio pranzo"} style={{...inp,marginBottom:14}} onKeyDown={e=>e.key==="Enter"&&name&&(onSave(name),setOpen(false),setName(""))}/>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>{if(name){onSave(name);setOpen(false);setName("");}}} disabled={!name} style={{...bP,flex:2,opacity:name?1:.4,padding:"13px"}}>{t("saveMealBtn",lang)}</button>
          <button onClick={()=>{setOpen(false);setName("");}} style={{...bS,flex:1,padding:"13px"}}>{t("cancel",lang)}</button>
        </div>
      </div>
    </div>
  );
}

// DIARIO ALIMENTARE
function DiaryScreen({lang,pantry,customFoods,onBack=null}) {
  const today=localDateStr();
  const KEY=`nc2-diary-${today}`;
  const [entries,setEntries]=useState(()=>{ try{return JSON.parse(localStorage.getItem(KEY))||[];}catch{return [];} });
  const [showSel,setShowSel]=useState(false);
  const [showPhoto,setShowPhoto]=useState(false);

  const save=(list)=>{ setEntries(list); localStorage.setItem(KEY,JSON.stringify(list)); };
  const addFood=(food,qty=100)=>{ const updated=[...entries,{id:Date.now(),food,quantity:qty}]; save(updated); setShowSel(false); };
  const addPhotoItems=(photoItems)=>{ const newEntries=photoItems.map((item,i)=>({id:Date.now()+i,food:item.food,quantity:item.quantity})); save([...entries,...newEntries]); };
  const removeEntry=(id)=>save(entries.filter(e=>e.id!==id));
  const updateQty=(id,qty)=>save(entries.map(e=>e.id===id?{...e,quantity:Math.max(0,parseInt(qty)||0)}:e));
  const reset=()=>{ save([]); };

  const tot=entries.reduce((a,e)=>{
    const div=e.food.unit==="pz"?1:100;
    const x=e.quantity/div;
    return {cal:a.cal+e.food.cal*x,p:a.p+e.food.p*x,c:a.c+e.food.c*x,f:a.f+e.food.f*x};
  },{cal:0,p:0,c:0,f:0});

  if(showPhoto) return <PhotoMealScreen mealName={lang==="en"?"Diary":"Diario"} mealData={null} lang={lang} onBack={()=>setShowPhoto(false)} onConfirm={photoItems=>{addPhotoItems(photoItems);setShowPhoto(false);}}/>;

  if(showSel) return (
    <FoodSelectorScreen
      mealTot={tot} target={{calories:9999,protein:999,carbs:999,fat:999}}
      pantry={pantry} customFoods={customFoods||[]} lang={lang}
      onBack={()=>setShowSel(false)} onAdd={addFood}
    />
  );

  const dateLabel=new Date().toLocaleDateString(lang==="en"?"en-US":"it-IT",{weekday:"long",day:"numeric",month:"long"});

  return (
    <div style={{padding:"52px 20px 110px",overflowY:"auto"}}>
      {onBack&&(
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
          <BackBtn onClick={onBack}/>
          <div style={{fontSize:20,fontWeight:900}}>{t("diaryTitle",lang)}</div>
        </div>
      )}
      <div style={{marginBottom:16}}>
        {!onBack&&<div style={{fontSize:13,color:C.mid,marginBottom:3,textTransform:"capitalize"}}>{dateLabel}</div>}
        {!onBack&&<div style={{fontSize:24,fontWeight:900,letterSpacing:-0.5,marginBottom:10}}>{t("diaryTitle",lang)}</div>}
        <div style={{...cS,background:C.bLo,border:`1px solid ${C.blu}33`,padding:"12px 16px",marginBottom:0}}>
          <div style={{fontSize:13,color:C.txt,lineHeight:1.7}}>
            {lang==="en"
              ? "📓 Use this section to track everything you eat during the day. The app calculates your total calorie and macro intake in real time, so you can monitor proteins, carbs and fats without following a structured meal plan."
              : "📓 Usa questa sezione per registrare tutto quello che mangi durante la giornata. La app calcola il totale di calorie e macro in tempo reale, così puoi monitorare proteine, carboidrati e grassi senza seguire un piano pasti strutturato."}
          </div>
        </div>
      </div>

      {/* Totali */}
      <div style={{...cS,marginBottom:20}}>
        <div style={{fontSize:11,fontWeight:700,color:C.mid,letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>
          {lang==="en"?"Today's total":"Totale di oggi"}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          {(()=>{
            const totalKcal=tot.p*4+tot.c*4+tot.f*9||1;
            const pPct=Math.round(tot.p*4/totalKcal*100);
            const cPct=Math.round(tot.c*4/totalKcal*100);
            const fPct=100-pPct-cPct;
            return [["kcal",rnd(tot.cal),"",C.txt],[t("protein",lang),`${rnd(tot.p)}g`,`${pPct}%`,C.acc],[t("carbs",lang),`${rnd(tot.c)}g`,`${cPct}%`,C.blu],[t("fat",lang),`${rnd(tot.f)}g`,`${fPct}%`,C.ora]].map(([l,v,pct,c])=>(
              <div key={l} style={{textAlign:"center"}}>
                <div style={{fontSize:17,fontWeight:800,color:c}}>{v}</div>
                {pct&&<div style={{fontSize:10,fontWeight:700,color:c,opacity:.75}}>{pct}</div>}
                <div style={{fontSize:10,color:C.mid,marginTop:1}}>{l}</div>
              </div>
            ));
          })()}
        </div>
        <div style={{display:"flex",gap:6}}>
          {[[tot.p,C.acc],[tot.c,C.blu],[tot.f,C.ora]].map(([v,c],i)=>(
            <div key={i} style={{flex:1,background:C.dim,borderRadius:4,height:4}}>
              <div style={{width:`${Math.min(100,(v/(v+1))*100)}%`,background:c,height:4,borderRadius:4}}/>
            </div>
          ))}
        </div>
      </div>

      {/* Lista alimenti */}
      {entries.length===0&&(
        <div style={{...cS,textAlign:"center",padding:"32px 20px"}}>
          <div style={{fontSize:36,marginBottom:10}}>📓</div>
          <div style={{fontWeight:700,fontSize:15,marginBottom:8}}>
            {lang==="en"?"Nothing logged yet":"Nessun alimento registrato"}
          </div>
          <div style={{fontSize:13,color:C.mid,lineHeight:1.6}}>
            {lang==="en"?"Add what you ate today to track your intake.":"Aggiungi quello che hai mangiato oggi per tracciare il tuo apporto."}
          </div>
        </div>
      )}
      {entries.map(e=>{
        const div=e.food.unit==="pz"?1:100;
        const x=e.quantity/div;
        return (
          <div key={e.id} style={cS}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}>
                <span style={{fontSize:22,flexShrink:0}}>{e.food.emoji}</span>
                <div style={{minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{getFoodName(e.food)}</div>
                  <div style={{color:C.acc,fontSize:12,fontWeight:700}}>{rnd(e.food.cal*x)} kcal · P:{rnd(e.food.p*x)}g C:{rnd(e.food.c*x)}g G:{rnd(e.food.f*x)}g</div>
                </div>
              </div>
              <button onClick={()=>removeEntry(e.id)} style={{background:C.rLo,border:"none",borderRadius:8,padding:"5px 9px",color:C.red,cursor:"pointer",fontSize:14,fontFamily:ff,flexShrink:0,marginLeft:8}}>✕</button>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button onClick={()=>updateQty(e.id,e.quantity-10)} style={{width:32,height:32,borderRadius:9,background:C.surf,border:`1px solid ${C.bord}`,color:C.txt,fontSize:17,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:ff}}>−</button>
              <input type="number" value={e.quantity} onChange={ev=>updateQty(e.id,ev.target.value)} style={{flex:1,background:C.surf,border:`1px solid ${C.bord}`,color:C.txt,padding:"6px",borderRadius:9,textAlign:"center",fontSize:15,fontWeight:700,outline:"none",fontFamily:ff}}/>
              <span style={{color:C.mid,fontSize:12,fontWeight:600}}>{e.food.unit||"g"}</span>
              <button onClick={()=>updateQty(e.id,e.quantity+10)} style={{width:32,height:32,borderRadius:9,background:C.surf,border:`1px solid ${C.bord}`,color:C.txt,fontSize:17,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:ff}}>+</button>
            </div>
          </div>
        );
      })}

      {/* Bottoni fondo */}
      <div style={{display:"flex",gap:10,marginTop:16}}>
        <button onClick={()=>setShowSel(true)} style={{...bP,flex:2}}>
          {t("addFood",lang)}
        </button>
        <button onClick={()=>setShowPhoto(true)} style={{padding:"16px 14px",background:C.bLo,border:`1px solid ${C.blu}33`,borderRadius:18,color:C.blu,fontWeight:700,cursor:"pointer",fontFamily:ff,fontSize:17,flexShrink:0}}>
          📷
        </button>
        {entries.length>0&&(
          <button onClick={reset} style={{flex:1,padding:"16px 0",background:"#FFF3E0",border:"1px solid #FBBF8833",borderRadius:18,color:C.ora,fontWeight:700,cursor:"pointer",fontFamily:ff,fontSize:14}}>
            {lang==="en"?"Reset":"Reset"}
          </button>
        )}
      </div>
    </div>
  );
}


// IMPORTA DIETA - usa Claude AI per leggere PDF e estrarre pasti
function ImportDietScreen({lang,mealList,onApply,onApplyToPlan,onBack}) {
  const [status,setStatus]=useState("idle"); // idle|loading|review|error
  const [parsedDays,setParsedDays]=useState([]); // [{label, meals, confirmed, weekDay}]
  const [summary,setSummary]=useState("");
  const [errMsg,setErrMsg]=useState("");
  const fileRef=useRef();

  const DAY_IT=["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];
  const DAY_EN=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const dayNames=lang==="en"?DAY_EN:DAY_IT;

  const handleFile=async(e)=>{
    const file=e.target.files?.[0];
    if(!file) return;
    if(file.type!=="application/pdf"){ setErrMsg(lang==="en"?"File must be a PDF.":"Il file deve essere un PDF."); setStatus("error"); return; }
    setStatus("loading"); setErrMsg(""); setParsedDays([]);
    try {
      const base64=await new Promise((res,rej)=>{
        const r=new FileReader();
        r.onload=()=>res(r.result.split(",")[1]);
        r.onerror=()=>rej(new Error("Read failed"));
        r.readAsDataURL(file);
      });

      const mealNamesStr=mealList.length>0
        ? mealList.map(m=>m.name).join(", ")
        : "Colazione, Pranzo, Cena";

      const response=await fetch(`${API_BASE}/api/analyze-diet`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({base64, mealNames:mealNamesStr})
      });

      if(!response.ok){
        const errData=await response.json().catch(()=>({}));
        throw new Error(errData.error||"Server error "+response.status);
      }
      const raw=await response.json();

      // Normalizza: supporta sia il nuovo formato {days:[]} che il vecchio {meals:{}}
      let parsed=raw;
      if(!parsed.days && parsed.meals && typeof parsed.meals==="object") {
        parsed={
          type:"single",
          summary:parsed.summary||"",
          days:[{label:"Giorno 1", meals:parsed.meals}],
        };
      }
      if(!parsed.days||!parsed.days.length) throw new Error("Invalid structure");

      setSummary(parsed.summary||"");
      const initialized=parsed.days.map((day,i)=>({
        ...day,
        confirmed: true,
        weekDay: i % 7,
      }));
      setParsedDays(initialized);
      setStatus("review");
    } catch(e) {
      console.error("Import error:",e);
      setErrMsg(t("importError",lang)+" ("+String(e).slice(0,80)+")");
      setStatus("error");
    }
    if(fileRef.current) fileRef.current.value="";
  };

  const convertMealDict=(mealsDict)=>{
    const out={};
    Object.entries(mealsDict).forEach(([mName,foods])=>{
      if(!Array.isArray(foods)) return;
      out[mName]=foods.map(f=>{
        const qty=Number(f.quantity)||100;
        const raw_cal=Number(f.cal)||0;
        const raw_p=Number(f.p)||0;
        const raw_c=Number(f.c)||0;
        const raw_fat=Number(f.f)||0;
        // L'AI restituisce valori per la quantità specificata (non per 100g).
        // Normalizziamo sempre a per-100g dividendo per (qty/100).
        // Questo è il contratto stabile: AI restituisce per-quantità, app salva per-100g.
        const factor = qty > 0 ? (100 / qty) : 1;
        return {
          food:{
            name:f.name,
            cal:Math.round(raw_cal*factor*10)/10,
            p:Math.round(raw_p*factor*10)/10,
            c:Math.round(raw_c*factor*10)/10,
            f:Math.round(raw_fat*factor*10)/10,
            emoji:f.emoji||"🍽️",
            unit:f.unit||"g",
            source:"import",
          },
          quantity:qty,
          recipeName:lang==="en"?"Imported from PDF":"Importato da PDF",
        };
      });
    });
    return out;
  };

  const toggleDay=(idx)=>{
    setParsedDays(prev=>prev.map((d,i)=>i===idx?{...d,confirmed:!d.confirmed}:d));
  };

  const setWeekDay=(idx,wd)=>{
    setParsedDays(prev=>prev.map((d,i)=>i===idx?{...d,weekDay:wd}:d));
  };

  const applySelected=()=>{
    const confirmed=parsedDays.filter(d=>d.confirmed);
    if(!confirmed.length) return;

    // Costruisci weekPlan: parte da 7 slot null
    const weekPlan=Array(7).fill(null).map(()=>({}));

    if(confirmed.length===1) {
      // 1 giorno confermato: replica su tutti e 7
      const converted=convertMealDict(confirmed[0].meals||{});
      for(let d=0;d<7;d++) weekPlan[d]={...converted};
    } else {
      // Più giorni: piazza ciascuno nella posizione scelta
      confirmed.forEach(day=>{
        const wd=day.weekDay;
        weekPlan[wd]={...convertMealDict(day.meals||{})};
      });
      // Giorni non coperti: replica il più vicino
      for(let d=0;d<7;d++){
        if(!Object.keys(weekPlan[d]).length){
          const fallback=confirmed[d%confirmed.length];
          weekPlan[d]={...convertMealDict(fallback.meals||{})};
        }
      }
    }

    // Calcola macro medi dal primo giorno confermato come nuovi target
    const firstConverted=weekPlan[confirmed[0].weekDay]||weekPlan[0];
    const allItems=Object.values(firstConverted).flat();
    const dayTotals=totals(allItems); // usa totals() per coerenza con il resto dell'app

    const newTargets=dayTotals.cal>500?{
      calories:Math.round(dayTotals.cal),
      protein: Math.round(dayTotals.p),
      carbs:   Math.round(dayTotals.c),
      fat:     Math.round(dayTotals.f),
    }:null;

    onApplyToPlan(weekPlan, newTargets);
  };

  const confirmedCount=parsedDays.filter(d=>d.confirmed).length;
  const isMulti=parsedDays.length>1;

  return (
    <div style={{padding:"52px 20px 100px",overflowY:"auto"}}>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:24,fontWeight:900,letterSpacing:-0.5,marginBottom:8}}>{t("importDietTitle",lang)}</div>
        <div style={{...cS,background:C.bLo,border:`1px solid ${C.blu}33`,padding:"12px 16px"}}>
          <div style={{fontSize:13,color:C.txt,lineHeight:1.7}}>{t("importNote",lang)}</div>
        </div>
      </div>

      {/* idle */}
      {status==="idle"&&(
        <div style={{...cS,textAlign:"center",padding:"40px 20px"}}>
          <div style={{fontSize:52,marginBottom:16}}>📄</div>
          <div style={{fontWeight:700,fontSize:16,marginBottom:8}}>{t("importDietDesc",lang)}</div>
          <div style={{fontSize:13,color:C.mid,marginBottom:28,lineHeight:1.6}}>
            {lang==="en"
              ?"The AI reads the document, extracts all meals and supports multi-day plans."
              :"L'IA legge il documento, estrae tutti i pasti e supporta piani multi-giorno."}
          </div>
          <input ref={fileRef} type="file" accept="application/pdf" onChange={handleFile} style={{display:"none"}} id="nc2-pdf-input"/>
          <label htmlFor="nc2-pdf-input" style={{...bP,display:"inline-block",cursor:"pointer",width:"auto",padding:"16px 32px"}}>
            {t("importBtn",lang)}
          </label>
        </div>
      )}

      {/* loading */}
      {status==="loading"&&(
        <div style={{...cS,textAlign:"center",padding:"48px 20px"}}>
          <Spin size={44}/>
          <div style={{fontWeight:700,fontSize:16,marginTop:20,marginBottom:8}}>{t("importAnalyzing",lang)}</div>
          <div style={{fontSize:13,color:C.mid,lineHeight:1.6}}>
            {lang==="en"?"AI is reading your diet plan. This takes about 10-20 seconds.":"L'AI sta leggendo il tuo piano alimentare. Richiede circa 10-20 secondi."}
          </div>
        </div>
      )}

      {/* error */}
      {status==="error"&&(
        <div style={{...cS,textAlign:"center",padding:"36px 20px"}}>
          <div style={{fontSize:44,marginBottom:14}}>⚠️</div>
          <div style={{fontWeight:700,fontSize:15,marginBottom:8,color:C.red}}>{lang==="en"?"Error":"Errore"}</div>
          <div style={{fontSize:13,color:C.mid,marginBottom:24,lineHeight:1.6}}>{errMsg}</div>
          <button onClick={()=>{setStatus("idle");setErrMsg("");}} style={{...bS,width:"auto",padding:"12px 28px"}}>
            {t("importReset",lang)}
          </button>
        </div>
      )}

      {/* review */}
      {status==="review"&&parsedDays.length>0&&(
        <div>
          {/* Header risultato */}
          <div style={{...cS,background:`${C.acc}18`,border:`1px solid ${C.acc}44`,marginBottom:16,padding:"16px 18px"}}>
            <div style={{fontSize:15,fontWeight:800,color:C.acc,marginBottom:4}}>
              ✅ {isMulti
                ?(lang==="en"?`${parsedDays.length} days detected`:`${parsedDays.length} giorni rilevati`)
                :(lang==="en"?"Plan extracted":"Piano estratto")}
            </div>
            {summary&&<div style={{fontSize:13,color:C.txt,marginTop:4,lineHeight:1.6,fontStyle:"italic"}}>&ldquo;{summary}&rdquo;</div>}
            <div style={{fontSize:12,color:C.acc,marginTop:10,padding:"7px 10px",background:C.aLo,borderRadius:8,fontWeight:600}}>
              ⚡ {lang==="en"
                ?"Calories and macros will be updated based on the imported diet."
                :"Calorie e macro del tuo piano verranno aggiornati in base alla dieta importata."}
            </div>
          </div>

          {/* Istruzione multi-giorno */}
          {isMulti&&(
            <div style={{...cS,background:C.bLo,border:`1px solid ${C.blu}33`,padding:"12px 14px",marginBottom:16}}>
              <div style={{fontSize:13,color:C.txt,lineHeight:1.7}}>
                {lang==="en"
                  ?"Select which days to import and choose the day of the week for each one. Deselect a day to exclude it."
                  :"Seleziona quali giorni importare e scegli il giorno della settimana per ognuno. Deseleziona un giorno per escluderlo."}
              </div>
            </div>
          )}

          {/* Lista giorni */}
          {parsedDays.map((day,idx)=>{
            const mealKeys=Object.keys(day.meals||{});
            const dayTot=Object.values(day.meals||{}).flat().reduce((acc,f)=>{
              return {cal:acc.cal+(f.cal||0), p:acc.p+(f.p||0)};
            },{cal:0,p:0});
            return (
              <div key={idx} style={{...cS,marginBottom:12,opacity:day.confirmed?1:0.45,transition:"opacity .2s"}}>
                {/* Header giorno */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <button onClick={()=>toggleDay(idx)} style={{
                      width:26,height:26,borderRadius:8,border:`2px solid ${day.confirmed?C.acc:C.bord}`,
                      background:day.confirmed?C.acc:"transparent",cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,
                    }}>{day.confirmed?"✓":""}</button>
                    <div>
                      <div style={{fontWeight:800,fontSize:15}}>{day.label||`Giorno ${idx+1}`}</div>
                      <div style={{fontSize:11,color:C.mid,marginTop:1}}>{mealKeys.length} pasti · {Math.round(dayTot.cal)} kcal · P:{Math.round(dayTot.p)}g</div>
                    </div>
                  </div>
                  {/* Selettore giorno settimana */}
                  {day.confirmed&&(
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                      <div style={{fontSize:10,color:C.mid,fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>
                        {lang==="en"?"Week day":"Giorno settimana"}
                      </div>
                      <select
                        value={day.weekDay}
                        onChange={e=>setWeekDay(idx,parseInt(e.target.value))}
                        style={{background:C.surf,border:`1.5px solid ${C.acc}`,borderRadius:8,color:C.txt,
                          padding:"5px 8px",fontSize:12,fontFamily:ff,fontWeight:700,cursor:"pointer",outline:"none"}}
                      >
                        {dayNames.map((dn,di)=>(
                          <option key={di} value={di}>{dn}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Preview pasti del giorno - collassabile */}
                {day.confirmed&&mealKeys.map(mName=>{
                  const foods=day.meals[mName]||[];
                  return (
                    <div key={mName} style={{marginBottom:8,paddingBottom:8,borderBottom:`1px solid ${C.dim}`}}>
                      <div style={{fontWeight:700,fontSize:13,color:C.acc,marginBottom:6}}>🍽️ {mName} <span style={{fontSize:11,color:C.mid,fontWeight:400}}>({foods.length} alimenti)</span></div>
                      {foods.map((f,i)=>(
                        <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                          <div style={{display:"flex",alignItems:"center",gap:6,flex:1,minWidth:0}}>
                            <span style={{fontSize:16,flexShrink:0}}>{f.emoji||"🍽️"}</span>
                            <span style={{fontSize:12,color:C.txt,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</span>
                            <span style={{fontSize:10,color:C.mid,flexShrink:0}}>{f.quantity}{f.unit||"g"}</span>
                          </div>
                          <span style={{fontSize:11,color:C.acc,fontWeight:700,flexShrink:0,marginLeft:6}}>{f.cal} kcal</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Nota 1 giorno */}
          {!isMulti&&(
            <div style={{fontSize:12,color:C.mid,marginTop:4,marginBottom:10,lineHeight:1.6,padding:"8px 12px",background:C.surf,borderRadius:10,border:`1px solid ${C.bord}`}}>
              ℹ️ {lang==="en"
                ?"Single day detected: the plan will be repeated across all 7 days."
                :"Rilevato un solo giorno: il piano verrà replicato su tutti e 7 i giorni."}
            </div>
          )}

          {/* Bottoni */}
          <div style={{display:"flex",gap:10,marginTop:12}}>
            <button
              onClick={applySelected}
              disabled={confirmedCount===0}
              style={{...bP,flex:2,opacity:confirmedCount>0?1:.4}}
            >
              📅 {confirmedCount===1&&!isMulti
                ?(lang==="en"?"Import to all 7 days":"Importa su tutti i 7 giorni")
                :(lang==="en"?`Import ${confirmedCount} day${confirmedCount>1?"s":""}`:`Importa ${confirmedCount} giorn${confirmedCount===1?"o":"i"}`)}
            </button>
            <button onClick={()=>{setStatus("idle");setParsedDays([]);setSummary("");}} style={{...bS,flex:1}}>
              {t("importReset",lang)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// DIET PROGRESS SCREEN
function DietProgressScreen({targets,nutritionLogs,workoutLogs=[],lang,onBack,onSaveWorkout,onRemoveWorkout}) {
  const [period,setPeriod]=useState("day"); // day | week | month
  const [showWorkoutInput,setShowWorkoutInput]=useState(false);
  const [wkcal,setWkcal]=useState("");
  const [wtype,setWtype]=useState("weights");
  const [wdur,setWdur]=useState("");
  const today=localDateStr();
  const [viewDate,setViewDate]=useState(today); // date navigation for "day" view

  // Tipi allenamento con stima kcal/min
  const WORKOUT_TYPES=[
    {id:"weights",labelIt:"Pesi",labelEn:"Weights",kcalMin:6,emoji:"🏋️"},
    {id:"cardio",labelIt:"Cardio",labelEn:"Cardio",kcalMin:10,emoji:"🏃"},
    {id:"cycling",labelIt:"Ciclismo",labelEn:"Cycling",kcalMin:8,emoji:"🚴"},
    {id:"swim",labelIt:"Nuoto",labelEn:"Swimming",kcalMin:9,emoji:"🏊"},
    {id:"hiit",labelIt:"HIIT",labelEn:"HIIT",kcalMin:12,emoji:"⚡"},
    {id:"other",labelIt:"Altro",labelEn:"Other",kcalMin:7,emoji:"🤸"},
  ];
  const getWtype=id=>WORKOUT_TYPES.find(w=>w.id===id)||WORKOUT_TYPES[0];

  const getStartDate=(p)=>{
    const d=new Date();
    if(p==="week") d.setDate(d.getDate()-6);
    else if(p==="month") d.setDate(d.getDate()-29);
    return d.toISOString().slice(0,10);
  };

  const filteredLogs=period==="day"
    ? nutritionLogs.filter(l=>l.date===viewDate)
    : nutritionLogs.filter(l=>l.date>=getStartDate(period)&&l.date<=today);
  const filteredWorkouts=period==="day"
    ? workoutLogs.filter(w=>w.date===viewDate)
    : workoutLogs.filter(w=>w.date>=getStartDate(period)&&w.date<=today);

  const sumLogs=(logs)=>logs.reduce((a,l)=>({cal:a.cal+l.calories,p:a.p+l.protein,c:a.c+l.carbs,f:a.f+l.fat}),{cal:0,p:0,c:0,f:0});

  const totals2=sumLogs(filteredLogs);

  const daysInPeriod=period==="day"?1:period==="week"?7:30;
  const daysTracked=period==="day"
    ? (filteredLogs.length>0?1:0)
    : [...new Set(filteredLogs.map(l=>l.date))].length;

  const targetMultiplier=daysTracked||1;
  const targetCal=(targets?.calories||0)*targetMultiplier;
  const targetP=(targets?.protein||0)*targetMultiplier;
  const targetC=(targets?.carbs||0)*targetMultiplier;
  const targetF=(targets?.fat||0)*targetMultiplier;

  const pct=(v,t)=>t>0?Math.round(v/t*100):0;
  const statusColor=(p)=>{
    if(p>=85&&p<=115) return C.acc;
    if(p>=70&&p<=130) return C.yel;
    return C.red;
  };
  const statusLabel=(p,lang)=>{
    if(p>=85&&p<=115) return lang==="en"?"On target":"In target";
    if(p<70) return lang==="en"?"Too low":"Troppo basso";
    if(p>130) return lang==="en"?"Too high":"Troppo alto";
    return lang==="en"?"Almost there":"Quasi in target";
  };

  // motivational message
  const calPct=pct(totals2.cal,targetCal);
  const motivMsg=calPct===0
    ? t("noNutritionDataDesc",lang)
    : calPct>=85&&calPct<=115
      ? t("motivationPerfect",lang)
      : calPct>=70&&calPct<=130
        ? t("motivationGood",lang)
        : calPct<70
          ? t("motivationLow",lang)
          : t("motivationHigh",lang);

  const motivColor=calPct===0?C.mid:calPct>=85&&calPct<=115?C.acc:calPct>=70&&calPct<=130?C.yel:C.red;
  const motivEmoji=calPct===0?"📊":calPct>=85&&calPct<=115?"🏆":calPct>=70&&calPct<=130?"💪":calPct<70?"⚡":"⚠️";

  // Grafico ultime 7 notti — raggruppa per data
  const CARB_LOAD_THRESHOLD = targets?.carbs ? targets.carbs * 1.15 : 280;
  const last7=[];
  for(let i=6;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i);
    const ds=d.toISOString().slice(0,10);
    const dayLogs=nutritionLogs.filter(l=>l.date===ds);
    const daySum=sumLogs(dayLogs);
    const dayWorkouts=workoutLogs.filter(w=>w.date===ds);
    const dayBurned=dayWorkouts.reduce((s,w)=>s+w.kcal,0);
    const isCarbLoad=daySum.c>0&&daySum.c>CARB_LOAD_THRESHOLD;
    last7.push({
      date:ds, cal:daySum.cal, carb:daySum.c, burned:dayBurned,
      netCal:Math.max(0,daySum.cal-dayBurned), isCarbLoad,
      label:d.toLocaleDateString(lang==="en"?"en-US":"it-IT",{weekday:"short"}),
    });
  }
  // Calorie bruciate nel giorno visualizzato
  const todayBurned=(period==="day"?filteredWorkouts:workoutLogs.filter(w=>w.date===viewDate)).reduce((s,w)=>s+w.kcal,0);
  const maxCal=Math.max(...last7.map(d=>d.cal),targets?.calories||1);
  const W=360,H=130,PAD=12,BAR_W=36,GAP=4;
  const totalBars=last7.length;
  const barGroupW=(W-PAD*2)/totalBars;

  const macroItems=[
    {label:t("totalProtein",lang),val:totals2.p,target:targetP,unit:"g",color:C.acc},
    {label:t("totalCarbs",lang),val:totals2.c,target:targetC,unit:"g",color:C.blu},
    {label:t("totalFat",lang),val:totals2.f,target:targetF,unit:"g",color:C.ora},
  ];

  return (
    <div style={{padding:"52px 20px 100px",overflowY:"auto",animation:"fadeUp .3s ease"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24}}>
        <button onClick={onBack} style={{width:38,height:38,borderRadius:11,background:C.surf,border:`1px solid ${C.bord}`,color:C.txt,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:ff}}>‹</button>
        <div>
          <div style={{fontSize:20,fontWeight:900,letterSpacing:-0.5}}>{t("dietProgressTitle",lang)}</div>
          <div style={{fontSize:12,color:C.mid,marginTop:2}}>{lang==="en"?"Track your nutrition over time":"Monitora la tua nutrizione nel tempo"}</div>
        </div>
      </div>

      {/* Period selector */}
      <div style={{display:"flex",gap:6,marginBottom:period==="day"?8:20,background:C.surf,borderRadius:14,padding:4,border:`1px solid ${C.bord}`}}>
        {[["day",t("periodDay",lang)],["week",t("periodWeek",lang)],["month",t("periodMonth",lang)]].map(([p,l])=>(
          <button key={p} onClick={()=>setPeriod(p)} style={{flex:1,padding:"10px 0",borderRadius:10,background:period===p?C.acc:"transparent",color:period===p?"#0D1117":C.mid,fontWeight:800,fontSize:13,border:"none",cursor:"pointer",fontFamily:ff,transition:"all .2s"}}>{l}</button>
        ))}
      </div>
      {/* Date navigation - last 7 days, only for day view */}
      {period==="day"&&(
        <div style={{display:"flex",gap:5,marginBottom:20,overflowX:"auto",paddingBottom:4}}>
          {Array.from({length:7},(_,i)=>{
            const d=new Date(); d.setDate(d.getDate()-(6-i));
            const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            const isToday=ds===today; const isSel=ds===viewDate;
            const hasData=nutritionLogs.some(l=>l.date===ds);
            return (
              <button key={ds} onClick={()=>setViewDate(ds)}
                style={{flex:"0 0 auto",minWidth:44,padding:"8px 6px",borderRadius:12,border:`2px solid ${isSel?C.acc:hasData?C.acc+"44":C.bord}`,background:isSel?C.acc:hasData?"#00D56310":"transparent",color:isSel?"#0D1117":hasData?C.acc:C.mid,fontWeight:isSel?800:600,cursor:"pointer",fontFamily:ff,fontSize:10,textAlign:"center",flexShrink:0}}>
                <div>{d.toLocaleDateString(lang==="en"?"en-US":"it-IT",{weekday:"short"})}</div>
                <div style={{fontSize:13,fontWeight:800}}>{d.getDate()}</div>
                {isToday&&<div style={{fontSize:8,marginTop:1,color:isSel?"#0D1117":C.acc}}>●</div>}
              </button>
            );
          })}
        </div>
      )}

      {filteredLogs.length===0&&(
        <div style={{...cS,textAlign:"center",padding:"40px 20px",marginBottom:16}}>
          <div style={{fontSize:48,marginBottom:12}}>📊</div>
          <div style={{fontWeight:800,fontSize:16,marginBottom:8}}>{t("noNutritionData",lang)}</div>
          <div style={{fontSize:13,color:C.mid,lineHeight:1.6}}>{t("noNutritionDataDesc",lang)}</div>
        </div>
      )}

      {/* Calorie principale */}
      {targetCal>0&&(()=>{
        const p=pct(totals2.cal,targetCal);
        const sc=statusColor(p);
        const fillW=Math.min(100,p);
        return (
          <div style={{...cS,background:`linear-gradient(135deg,${C.card},${sc}0A)`,border:`1px solid ${sc}44`,marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:sc,letterSpacing:1,textTransform:"uppercase"}}>{t("totalCalories",lang)}</div>
                <div style={{fontSize:32,fontWeight:900,letterSpacing:-1,color:C.txt,marginTop:4}}>{rnd(totals2.cal)} <span style={{fontSize:14,color:C.mid,fontWeight:500}}>kcal</span></div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:28,fontWeight:900,color:sc}}>{p}%</div>
                <div style={{fontSize:11,color:sc,fontWeight:700,marginTop:2}}>{statusLabel(p,lang)}</div>
              </div>
            </div>
            <div style={{background:C.dim,borderRadius:8,height:10,marginBottom:8,overflow:"hidden"}}>
              <div style={{width:`${fillW}%`,height:10,borderRadius:8,background:sc,transition:"width .6s ease",boxShadow:`0 0 10px ${sc}66`}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.mid}}>
              <span>{t("vsTarget",lang)}: {rnd(targetCal)} kcal</span>
              {daysTracked>1&&<span>{t("avgPerDay",lang)}: {rnd(totals2.cal/daysTracked)} kcal</span>}
            </div>
          </div>
        );
      })()}

      {/* Sezione allenamento — calorie bruciate oggi */}
      <div style={{...cS,marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:todayBurned>0||showWorkoutInput?12:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:18}}>🏋️</span>
            <div>
              <div style={{fontSize:13,fontWeight:700}}>{lang==="en"?"Today's workout":"Allenamento di oggi"}</div>
              {todayBurned>0&&<div style={{fontSize:11,color:"#FF6B6B",fontWeight:700}}>-{todayBurned} kcal {lang==="en"?"burned":"bruciate"}</div>}
            </div>
          </div>
          <button onClick={()=>setShowWorkoutInput(v=>!v)}
            style={{padding:"7px 14px",background:showWorkoutInput?C.surf:C.aLo,border:`1px solid ${C.acc}44`,borderRadius:12,color:C.acc,fontWeight:700,cursor:"pointer",fontFamily:ff,fontSize:12}}>
            {showWorkoutInput?(lang==="en"?"Cancel":"Annulla"):`+ ${lang==="en"?"Add":"Aggiungi"}`}
          </button>
        </div>
        {showWorkoutInput&&(
          <div>
            {/* Tipo allenamento */}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
              {WORKOUT_TYPES.map(wt=>(
                <button key={wt.id} onClick={()=>{setWtype(wt.id);if(wdur) setWkcal(String(Math.round(getWtype(wt.id).kcalMin*(parseFloat(wdur)||0))));}}
                  style={{padding:"6px 12px",borderRadius:10,border:`2px solid ${wtype===wt.id?C.acc:C.bord}`,background:wtype===wt.id?C.aLo:"transparent",color:wtype===wt.id?C.acc:C.mid,fontWeight:700,cursor:"pointer",fontFamily:ff,fontSize:12}}>
                  {wt.emoji} {lang==="en"?wt.labelEn:wt.labelIt}
                </button>
              ))}
            </div>
            {/* Durata + stima kcal */}
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:C.mid,marginBottom:4,fontWeight:600}}>{lang==="en"?"Duration (min)":"Durata (min)"}</div>
                <input type="number" value={wdur} onChange={e=>{setWdur(e.target.value);setWkcal(String(Math.round(getWtype(wtype).kcalMin*(parseFloat(e.target.value)||0))));}}
                  placeholder="45" style={{...inp,padding:"10px 12px",fontSize:15}}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:C.mid,marginBottom:4,fontWeight:600}}>{lang==="en"?"Burned kcal":"Kcal bruciate"}</div>
                <input type="number" value={wkcal} onChange={e=>setWkcal(e.target.value)}
                  placeholder="300" style={{...inp,padding:"10px 12px",fontSize:15}}/>
              </div>
            </div>
            <div style={{fontSize:11,color:C.mid,marginBottom:12,fontStyle:"italic"}}>
              {lang==="en"?"Edit kcal manually if you have data from your device (watch, hrm).":"Modifica le kcal manualmente se hai i dati dal tuo dispositivo (orologio, cardiofrequenzimetro)."}
            </div>
            <button onClick={()=>{
              const k=parseFloat(wkcal); if(!k||k<=0) return;
              onSaveWorkout&&onSaveWorkout(k,wtype,parseFloat(wdur)||0);
              setShowWorkoutInput(false); setWkcal(""); setWdur("");
            }} style={{...bP,marginBottom:0}} disabled={!wkcal||parseFloat(wkcal)<=0}>
              ✓ {lang==="en"?"Save workout":"Salva allenamento"}
            </button>
          </div>
        )}
        {/* Lista workout salvati oggi */}
        {workoutLogs.filter(w=>w.date===today).map(w=>{
          const wt=getWtype(w.type);
          return (
            <div key={w.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10,padding:"8px 12px",background:C.surf,borderRadius:10,border:`1px solid ${C.bord}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16}}>{wt.emoji}</span>
                <div>
                  <div style={{fontSize:13,fontWeight:700}}>{lang==="en"?wt.labelEn:wt.labelIt}{w.duration>0?` · ${w.duration} min`:""}</div>
                  <div style={{fontSize:11,color:"#FF6B6B",fontWeight:700}}>-{w.kcal} kcal</div>
                </div>
              </div>
              <button onClick={()=>onRemoveWorkout&&onRemoveWorkout(w.id)}
                style={{background:C.rLo,border:"none",borderRadius:8,padding:"5px 9px",color:C.red,cursor:"pointer",fontFamily:ff,fontSize:13}}>✕</button>
            </div>
          );
        })}
        {/* Bilancio netto se ci sono workout */}
        {todayBurned>0&&filteredLogs.filter(l=>l.date===today).length>0&&(()=>{
          const todayLogsCal=sumLogs(filteredLogs.filter(l=>l.date===today)).cal;
          const net=todayLogsCal-todayBurned;
          return (
            <div style={{marginTop:12,padding:"10px 14px",background:net<(targets?.calories||0)?C.aLo:C.rLo,borderRadius:10,border:`1px solid ${net<(targets?.calories||0)?C.acc:C.red}44`}}>
              <div style={{fontSize:12,fontWeight:700,color:net<(targets?.calories||0)?C.acc:C.red}}>
                {lang==="en"?"Net calories today:":"Calorie nette oggi:"} {rnd(net)} kcal
              </div>
              <div style={{fontSize:11,color:C.mid,marginTop:2}}>
                {rnd(todayLogsCal)} {lang==="en"?"eaten":"assunte"} − {todayBurned} {lang==="en"?"burned":"bruciate"} = {rnd(net)} kcal {lang==="en"?"net":"nette"}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Sezione allenamento */}
      <div style={{...cS,marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:showWorkoutInput||workoutLogs.filter(w=>w.date===today).length>0?12:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:18}}>🏋️</span>
            <div>
              <div style={{fontSize:13,fontWeight:700}}>{lang==="en"?"Today's workout":"Allenamento di oggi"}</div>
              {todayBurned>0&&<div style={{fontSize:11,color:"#FF6B6B",fontWeight:700}}>-{todayBurned} kcal {lang==="en"?"burned":"bruciate"}</div>}
            </div>
          </div>
          <button onClick={()=>setShowWorkoutInput(v=>!v)}
            style={{padding:"7px 14px",background:showWorkoutInput?C.surf:C.aLo,border:`1px solid ${C.acc}44`,borderRadius:12,color:C.acc,fontWeight:700,cursor:"pointer",fontFamily:ff,fontSize:12}}>
            {showWorkoutInput?(lang==="en"?"Cancel":"Annulla"):`+ ${lang==="en"?"Add":"Aggiungi"}`}
          </button>
        </div>
        {showWorkoutInput&&(
          <div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
              {WORKOUT_TYPES.map(wt=>(
                <button key={wt.id} onClick={()=>{setWtype(wt.id);if(wdur) setWkcal(String(Math.round(getWtype(wt.id).kcalMin*(parseFloat(wdur)||0))));}}
                  style={{padding:"6px 12px",borderRadius:10,border:`2px solid ${wtype===wt.id?C.acc:C.bord}`,background:wtype===wt.id?C.aLo:"transparent",color:wtype===wt.id?C.acc:C.mid,fontWeight:700,cursor:"pointer",fontFamily:ff,fontSize:12}}>
                  {wt.emoji} {lang==="en"?wt.labelEn:wt.labelIt}
                </button>
              ))}
            </div>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:C.mid,marginBottom:4,fontWeight:600}}>{lang==="en"?"Duration (min)":"Durata (min)"}</div>
                <input type="number" value={wdur} onChange={e=>{setWdur(e.target.value);setWkcal(String(Math.round(getWtype(wtype).kcalMin*(parseFloat(e.target.value)||0))));}}
                  placeholder="45" style={{...inp,padding:"10px 12px",fontSize:15}}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:C.mid,marginBottom:4,fontWeight:600}}>{lang==="en"?"Burned kcal":"Kcal bruciate"}</div>
                <input type="number" value={wkcal} onChange={e=>setWkcal(e.target.value)}
                  placeholder="300" style={{...inp,padding:"10px 12px",fontSize:15}}/>
              </div>
            </div>
            <div style={{fontSize:11,color:C.mid,marginBottom:10,fontStyle:"italic"}}>
              {lang==="en"?"Edit kcal manually if you have data from your device.":"Modifica le kcal se hai i dati dal tuo dispositivo (orologio, cardiofrequenzimetro)."}
            </div>
            <button onClick={()=>{
              const k=parseFloat(wkcal); if(!k||k<=0) return;
              onSaveWorkout&&onSaveWorkout(k,wtype,parseFloat(wdur)||0);
              setShowWorkoutInput(false); setWkcal(""); setWdur("");
            }} style={{...bP,marginBottom:0}} disabled={!wkcal||parseFloat(wkcal)<=0}>
              ✓ {lang==="en"?"Save workout":"Salva allenamento"}
            </button>
          </div>
        )}
        {workoutLogs.filter(w=>w.date===today).map(w=>{
          const wt=getWtype(w.type);
          return (
            <div key={w.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10,padding:"8px 12px",background:C.surf,borderRadius:10,border:`1px solid ${C.bord}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16}}>{wt.emoji}</span>
                <div>
                  <div style={{fontSize:13,fontWeight:700}}>{lang==="en"?wt.labelEn:wt.labelIt}{w.duration>0?` · ${w.duration} min`:""}</div>
                  <div style={{fontSize:11,color:"#FF6B6B",fontWeight:700}}>-{w.kcal} kcal</div>
                </div>
              </div>
              <button onClick={()=>onRemoveWorkout&&onRemoveWorkout(w.id)}
                style={{background:C.rLo,border:"none",borderRadius:8,padding:"5px 9px",color:C.red,cursor:"pointer",fontFamily:ff,fontSize:13}}>✕</button>
            </div>
          );
        })}
        {todayBurned>0&&filteredLogs.filter(l=>l.date===today).length>0&&(()=>{
          const todayLogsCal=sumLogs(filteredLogs.filter(l=>l.date===today)).cal;
          const net=todayLogsCal-todayBurned;
          return (
            <div style={{marginTop:12,padding:"10px 14px",background:net<=(targets?.calories||9999)?C.aLo:C.rLo,borderRadius:10,border:`1px solid ${net<=(targets?.calories||9999)?C.acc:C.red}44`}}>
              <div style={{fontSize:12,fontWeight:700,color:net<=(targets?.calories||9999)?C.acc:C.red}}>
                {lang==="en"?"Net calories today:":"Calorie nette oggi:"} {rnd(net)} kcal
              </div>
              <div style={{fontSize:11,color:C.mid,marginTop:2}}>
                {rnd(todayLogsCal)} {lang==="en"?"eaten":"assunte"} − {todayBurned} {lang==="en"?"burned":"bruciate"} = {rnd(net)} kcal
              </div>
            </div>
          );
        })()}
      </div>

      {/* Motivational banner */}
      {(filteredLogs.length>0||true)&&(
        <div style={{...cS,background:`${motivColor}0F`,border:`1px solid ${motivColor}33`,marginBottom:20,display:"flex",alignItems:"flex-start",gap:12}}>
          <div style={{fontSize:28,flexShrink:0,marginTop:2}}>{motivEmoji}</div>
          <div style={{fontSize:13,color:C.txt,lineHeight:1.7,fontWeight:500}}>{motivMsg}</div>
        </div>
      )}

      {/* Grafico a barre 7 giorni */}
      <div style={{...cS,marginBottom:20}}>
        <div style={{fontSize:11,fontWeight:700,color:C.mid,letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>{t("progressChart",lang)}</div>
        <svg width="100%" height={H+50} viewBox={`0 0 ${W} ${H+50}`} style={{display:"block",overflow:"visible"}}>
          {/* Target line */}
          {targets?.calories>0&&(()=>{
            const ty=H-(targets.calories/maxCal)*(H-PAD);
            return <line x1={PAD} y1={ty} x2={W-PAD} y2={ty} stroke={C.bord2} strokeWidth="1" strokeDasharray="4,3"/>;
          })()}
          {last7.map((d,i)=>{
            const barH=d.cal>0?Math.max(4,(d.cal/maxCal)*(H-PAD)):0;
            const x=PAD+i*barGroupW+(barGroupW-BAR_W)/2;
            const y=H-barH;
            const p=targets?.calories>0?pct(d.cal,targets.calories):100;
            const bc=d.cal===0?C.bord:statusColor(p);
            // Linea calorie bruciate sopra la barra
            const burnedH=d.burned>0?Math.max(2,(d.burned/maxCal)*(H-PAD)):0;
            return (
              <g key={d.date}>
                {/* Barra calorie */}
                <rect x={x} y={H-Math.max(2,barH)} width={BAR_W} height={Math.max(2,barH)} rx="6"
                  fill={d.cal===0?C.dim:bc} opacity={d.date===today?1:0.65}/>
                {/* Indicatore carico glucidico */}
                {d.isCarbLoad&&(
                  <text x={x+BAR_W/2} y={H-Math.max(2,barH)-8} textAnchor="middle" fontSize="10" fontFamily={ff}>🔥</text>
                )}
                {/* Linea workout (calorie bruciate) */}
                {d.burned>0&&(
                  <rect x={x+4} y={H-burnedH-2} width={BAR_W-8} height={4} rx="2" fill="#FF6B6B" opacity={0.9}/>
                )}
                {d.cal>0&&!d.isCarbLoad&&<text x={x+BAR_W/2} y={y-5} textAnchor="middle" fill={bc} fontSize="9" fontWeight="700" fontFamily={ff}>{rnd(d.cal)}</text>}
                <text x={x+BAR_W/2} y={H+16} textAnchor="middle" fill={d.date===today?C.txt:C.mid} fontSize="10" fontWeight={d.date===today?"800":"500"} fontFamily={ff}>{d.label}</text>
                {/* Label carb load sotto etichetta */}
                {d.isCarbLoad&&<text x={x+BAR_W/2} y={H+28} textAnchor="middle" fill="#FF9800" fontSize="8" fontWeight="700" fontFamily={ff}>{lang==="en"?"LOAD":"CARICO"}</text>}
              </g>
            );
          })}
        </svg>
        <div style={{display:"flex",alignItems:"center",gap:12,marginTop:4,paddingTop:8,borderTop:`1px solid ${C.dim}`,flexWrap:"wrap"}}>
          {[[C.acc,lang==="en"?"On target":"In target"],[C.yel,lang==="en"?"Almost":"Quasi"],[C.red,lang==="en"?"Off track":"Fuori"]].map(([c,l])=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:10,height:10,borderRadius:3,background:c}}/>
              <span style={{fontSize:10,color:C.mid}}>{l}</span>
            </div>
          ))}
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:10,height:4,borderRadius:2,background:"#FF6B6B"}}/>
            <span style={{fontSize:10,color:C.mid}}>{lang==="en"?"Burned":"Bruciate"}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:10}}>🔥</span>
            <span style={{fontSize:10,color:C.mid}}>{lang==="en"?"Carb load":"Carico glucidico"}</span>
          </div>
        </div>
      </div>

      {/* Macro cards */}
      <div style={{fontSize:11,fontWeight:700,color:C.mid,letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>{lang==="en"?"Macronutrients":"Macronutrienti"}</div>
      {macroItems.map(({label,val,target,unit,color})=>{
        const p=pct(val,target);
        const sc=target>0?statusColor(p):color;
        const fillW=target>0?Math.min(100,p):Math.min(100,(val/(val+1))*100);
        return (
          <div key={label} style={{...cS,marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:C.mid}}>{label}</div>
                <div style={{fontSize:22,fontWeight:900,color:C.txt,marginTop:2}}>{rnd(val)}<span style={{fontSize:13,fontWeight:500,color:C.mid}}>{unit}</span></div>
              </div>
              {target>0&&(
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:20,fontWeight:900,color:sc}}>{p}%</div>
                  <div style={{fontSize:11,color:sc}}>{statusLabel(p,lang)}</div>
                </div>
              )}
            </div>
            <div style={{background:C.dim,borderRadius:6,height:8,overflow:"hidden"}}>
              <div style={{width:`${fillW}%`,height:8,borderRadius:6,background:sc,transition:"width .5s ease"}}/>
            </div>
            {target>0&&<div style={{fontSize:10,color:C.mid,marginTop:5}}>{t("vsTarget",lang)}: {rnd(target)}{unit}{daysTracked>1?` · ${t("avgPerDay",lang)}: ${rnd(val/daysTracked)}${unit}`:""}</div>}
          </div>
        );
      })}

      {/* Giorni registrati */}
      {filteredLogs.length>0&&(
        <div style={{...cS,display:"flex",justifyContent:"space-around",marginTop:4}}>
          {[[lang==="en"?"Days tracked":"Giorni registrati",daysTracked,C.acc],[lang==="en"?"Total meals":"Pasti totali",filteredLogs.length,C.blu],[lang==="en"?"Period":"Periodo",`${daysInPeriod}gg`,C.mid]].map(([l,v,c])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:900,color:c}}>{v}</div>
              <div style={{fontSize:11,color:C.mid,marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// DiaryScreen wrapper con tasto Back
function DiaryScreenWithBack({lang,pantry,customFoods,onBack}) {
  // Renders DiaryScreen with a back button injected before its title
  return <DiaryScreen lang={lang} pantry={pantry} customFoods={customFoods} onBack={onBack}/>;
}

// RATING MODAL - shown after meal confirmation
function RatingModal({mealName,lang,onRate,onSkip}) {
  const [sel,setSel]=useState(0);
  const [hov,setHov]=useState(0);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{background:C.surf,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:430,padding:"28px 24px 48px",border:`1px solid ${C.bord}`}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:36,marginBottom:8}}>⭐</div>
          <div style={{fontSize:17,fontWeight:800,marginBottom:4}}>{lang==="en"?"Rate this meal":"Valuta questo pasto"}</div>
          <div style={{fontSize:13,color:C.mid,marginBottom:4}}>{mealName}</div>
          <div style={{fontSize:11,color:C.mid}}>{lang==="en"?"Helps suggest similar meals in the future":"Aiuta a proporti pasti simili in futuro"}</div>
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:10,marginBottom:24}}>
          {[1,2,3,4,5].map(s=>(
            <button key={s} onClick={()=>setSel(s)} onMouseEnter={()=>setHov(s)} onMouseLeave={()=>setHov(0)}
              style={{background:"none",border:"none",cursor:"pointer",fontSize:38,opacity:(hov||sel)>=s?1:0.25,transform:(hov||sel)>=s?"scale(1.15)":"scale(1)",transition:"all .12s",padding:4}}>
              ⭐
            </button>
          ))}
        </div>
        {sel>0&&<div style={{textAlign:"center",fontSize:13,color:C.acc,fontWeight:700,marginBottom:12}}>
          {[null,lang==="en"?"Not great":"Scarso",lang==="en"?"Okay":"Discreto",lang==="en"?"Good":"Buono",lang==="en"?"Very good":"Ottimo",lang==="en"?"Excellent!":"Eccellente!"][sel]}
        </div>}
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>sel>0&&onRate(sel)} disabled={!sel}
            style={{...bP,flex:2,opacity:sel?1:0.4,padding:"14px 0"}}>
            {lang==="en"?"Save rating":"Salva valutazione"}
          </button>
          <button onClick={onSkip} style={{...bS,flex:1,padding:"14px 0"}}>{lang==="en"?"Skip":"Salta"}</button>
        </div>
      </div>
    </div>
  );
}

// APP ROOT
export default function App() {
  const [ready,setReady]=useState(false);
  const [showIntro,setShowIntro]=useState(()=>!LS.g('nc2-seen-intro'));
  const [user,setUser]=useState(null);
  const [onboarded,setOnboarded]=useState(false);
  const [profile,setProfile]=useState({name:"",gender:"m",age:"",weight:"",height:"",bodyFat:"",activity:1.55,goal:"lose",numMeals:3,bia_fm:"",bia_vf:"",bia_bmr:"",bia_ffm:"",bia_sc_fat:"",bia_smi:"",bia_whr:"",bia_smm:""});
  const [targets,setTargets]=useState(null);
  const [mealList,setMealList]=useState([]);
  const [meals,setMeals]=useState({});
  const [pantry,setPantry]=useState(()=>LS.g("nc2-pantry")||[]);
  const [customFoods,setCustomFoods]=useState(()=>LS.g("nc2-customfoods")||[]);
  const [favMeals,setFavMeals]=useState(()=>LS.g("nc2-favmeals")||[]);
  const [lang,setLangState]=useState(()=>localStorage.getItem("nc2-lang")||"it");
  const changeLang=(l)=>{ setLang(l); setLangState(l); };
  const [langChosen,setLangChosen]=useState(()=>!!LS.g("nc2-lang-chosen"));
  const selectLang=(l)=>{ setLang(l); setLangState(l); LS.s("nc2-lang-chosen",true); setLangChosen(true); };
  const [weightLog,setWeightLog]=useState([]);
  const [weeklyPlan,setWeeklyPlan]=useState(()=>LS.g("nc2-weeklyplan"));
  const [planSeed,setPlanSeed]=useState(()=>LS.g("nc2-planseed")||0);
  const [isCustomized,setIsCustomized]=useState(()=>LS.g(`nc2-customized-${localDateStr()}`)||false);
  const [tab,setTab]=useState("today");
  const [selMeal,setSelMeal]=useState(null);
  const [photoMealName,setPhotoMealName]=useState(null);
  const [planSelMeal,setPlanSelMeal]=useState(null); // {mealName, dayIdx, items, target}
  const [pantryEditMeal,setPantryEditMeal]=useState(null); // {mealName, items, target}
  const [showWeightModal,setShowWeightModal]=useState(false);
  const [newWeight,setNewWeight]=useState("");
  const [confirmedMeals,setConfirmedMeals]=useState(()=>LS.g(`nc2-confirmed-${localDateStr()}`)||{});
  const [lockedMeals,setLockedMeals]=useState(()=>LS.g(`nc2-locked-${localDateStr()}`)||{});
  const [workoutLogs,setWorkoutLogs]=useState(()=>LS.g("nc2-workouts")||[]);
  const [subScreen,setSubScreen]=useState(null); // null|"piano"|"import"|"diary"
  const [nutritionLogs,setNutritionLogs]=useState([]);
  const [savedPlans,setSavedPlans]=useState([]);
  const [mealRatings,setMealRatings]=useState(()=>LS.g("nc2-meal-ratings")||{});
  const [pendingRatingMeal,setPendingRatingMeal]=useState(null); // {mealName, key, foods}
  const [showDietLibrary,setShowDietLibrary]=useState(false);
  const today=localDateStr();

  const loadingRef=useRef(false);
  const subRef=useRef(null);
  useEffect(()=>{
    // Sincronizza database alimenti da Supabase in background
    syncFoodsFromSupabase();
    if(!supabase){ loadLocal(user?.id); setReady(true); return; }
    // Evita doppia subscription (React StrictMode)
    if(subRef.current) return;
    const {data:{subscription}}=supabase.auth.onAuthStateChange(async(event,sess)=>{
      if(event==="SIGNED_OUT"){ setUser(null); setOnboarded(false); setReady(true); return; }
      if(sess?.user) {
        if(loadingRef.current) return;
        loadingRef.current=true;
        await loadUser(sess.user);
        loadingRef.current=false;
      } else if(!loadingRef.current) {
        setReady(true);
      }
    });
    subRef.current=subscription;
    return ()=>{
      if(subRef.current){ subRef.current.unsubscribe(); subRef.current=null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // Controlla peso ogni volta che l'app torna in foreground
  useEffect(()=>{
    const handleVisibility=()=>{
      if(document.visibilityState==="visible"){
        const wl=LS.g("nc2-weightlog")||[];
        checkWeightPrompt(wl);
      }
    };
    document.addEventListener("visibilitychange",handleVisibility);
    return ()=>document.removeEventListener("visibilitychange",handleVisibility);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[weightLog]);

  // Bug 7 fix: azzera confirmedMeals al cambio di giorno (app aperta attraverso mezzanotte)
  useEffect(()=>{
    let lastDay=localDateStr();
    const interval=setInterval(()=>{
      const newDay=localDateStr();
      if(newDay!==lastDay){
        lastDay=newDay;
        setConfirmedMeals({});
        LS.s(`nc2-confirmed-${newDay}`,{});
        setLockedMeals({});
        LS.s(`nc2-locked-${newDay}`,{});
      }
    },60000);
    return ()=>clearInterval(interval);
  },[]);

  // Persisti isCustomized per giorno in localStorage
  useEffect(()=>{
    LS.s(`nc2-customized-${today}`,isCustomized);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[isCustomized]);

  // Auto-sync weeklyPlan su Supabase con debounce
  useEffect(()=>{
    if(!user||!weeklyPlan) return;
    const t=setTimeout(()=>{ DB.saveWeeklyPlan(user.id,weeklyPlan,planSeed).catch(()=>{}); },1000);
    return ()=>clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[weeklyPlan,planSeed,user]);

  // Auto-sync lockedMeals su Supabase con debounce
  useEffect(()=>{
    if(!user||!Object.keys(lockedMeals||{}).length) return;
    const t=setTimeout(()=>{ DB.saveLockedMeals(user.id,today,lockedMeals).catch(()=>{}); },500);
    return ()=>clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[lockedMeals,user]);

  const loadLocal = (uid) => {
    const pr = LS.g(`nc2-profile${uid?"-"+uid:""}`) || LS.g("nc2-profile");
    const tg = LS.g(`nc2-targets${uid?"-"+uid:""}`) || LS.g("nc2-targets");
    const ml = LS.g(`nc2-meallist${uid?"-"+uid:""}`) || LS.g("nc2-meallist");
    const ms = LS.g(`nc2-meals${uid?"-"+uid:""}-${today}`) || LS.g(`nc2-meals-${today}`);
    const pt = LS.g("nc2-pantry");
    const wl = LS.g("nc2-weightlog");
    if(pr) setProfile(pr);
    if(tg&&ml) { setTargets(tg); setMealList(ml); setMeals(ms||ml.reduce((a,x)=>({...a,[x.name]:[]}),{})); setOnboarded(true); }
    if(pt) setPantry(pt);
    if(wl) { setWeightLog(wl); checkWeightPrompt(wl); }
  };

  const loadUser=async(u)=>{
    setUser(u);
    // Fast path: restore from localStorage immediately (stale-while-revalidate)
    const _lsPr=LS.g(`nc2-profile-${u.id}`);
    const _lsTg=LS.g(`nc2-targets-${u.id}`)||LS.g("nc2-targets");
    const _lsMl=LS.g(`nc2-meallist-${u.id}`)||LS.g("nc2-meallist");
    const _lsCacheHit=!!(_lsTg&&_lsMl);
    if(_lsPr) setProfile(_lsPr);
    if(_lsCacheHit){
      setTargets(_lsTg); setMealList(_lsMl);
      const _lsMs=LS.g(`nc2-meals-${u.id}-${today}`)||LS.g(`nc2-meals-${today}`);
      setMeals(_lsMs||_lsMl.reduce((a,x)=>({...a,[x.name]:[]}),{}));
      setOnboarded(true);
      const _lsConf=LS.g(`nc2-confirmed-${localDateStr()}`);
      if(_lsConf&&Object.keys(_lsConf).length>0) setConfirmedMeals(_lsConf);
      const _lsLogs=LS.g("nc2-nutrition-logs-all");
      if(_lsLogs?.length) setNutritionLogs(_lsLogs);
      LS.s('nc2-seen-intro',true); setShowIntro(false);
      setReady(true); // show UI immediately from cache — Supabase refreshes in background
    }
    // Background Supabase refresh (waves 1+2 merged into background when cache hit)
    if(_lsCacheHit){
      Promise.all([
        DB.loadProfile(u.id).then(sbP=>{
          if(!sbP) return;
          const pr={name:sbP.name||u.user_metadata?.name||"",gender:sbP.gender||"m",age:sbP.age||"",weight:sbP.weight||"",height:sbP.height||"",bodyFat:sbP.body_fat||"",activity:sbP.activity||1.55,goal:sbP.goal||"lose",numMeals:sbP.num_meals||3,excludedFoods:sbP.excluded_foods||[],bia_fm:sbP.bia_fm||"",bia_vf:sbP.bia_vf||"",bia_bmr:sbP.bia_bmr||"",bia_ffm:sbP.bia_ffm||"",bia_sc_fat:sbP.bia_sc_fat||"",bia_smi:sbP.bia_smi||"",bia_whr:sbP.bia_whr||"",bia_smm:sbP.bia_smm||""};
          setProfile(pr); LS.s(`nc2-profile-${u.id}`,pr);
        }).catch(()=>{}),
        DB.loadTargets(u.id).then(sbT=>{
          if(!sbT) return;
          setTargets(sbT.targets); setMealList(sbT.mealList);
          LS.s(`nc2-targets-${u.id}`,sbT.targets); LS.s(`nc2-meallist-${u.id}`,sbT.mealList);
        }).catch(()=>{}),
        DB.loadMeals(u.id,today).then(ms=>{
          if(!ms) return;
          setMeals(ms); LS.s(`nc2-meals-${u.id}-${today}`,ms);
        }).catch(()=>{}),
      ]).catch(()=>{});
    } else {
      // No cache — must wait for Supabase before showing UI (first install path)
      try {
        const [sbP,sbT]=await Promise.all([
          DB.loadProfile(u.id).catch(()=>null),
          DB.loadTargets(u.id).catch(()=>null),
        ]);
        if(sbP) {
          const pr={name:sbP.name||u.user_metadata?.name||"",gender:sbP.gender||"m",age:sbP.age||"",weight:sbP.weight||"",height:sbP.height||"",bodyFat:sbP.body_fat||"",activity:sbP.activity||1.55,goal:sbP.goal||"lose",numMeals:sbP.num_meals||3,excludedFoods:sbP.excluded_foods||[],bia_fm:sbP.bia_fm||"",bia_vf:sbP.bia_vf||"",bia_bmr:sbP.bia_bmr||"",bia_ffm:sbP.bia_ffm||"",bia_sc_fat:sbP.bia_sc_fat||"",bia_smi:sbP.bia_smi||"",bia_whr:sbP.bia_whr||"",bia_smm:sbP.bia_smm||""};
          setProfile(pr); LS.s(`nc2-profile-${u.id}`,pr);
        } else {
          const lsPr=LS.g(`nc2-profile-${u.id}`); if(lsPr) setProfile(lsPr);
        }
        let tg=null, ml=null;
        if(sbT) { tg=sbT.targets; ml=sbT.mealList; }
        if(!tg) { tg=LS.g(`nc2-targets-${u.id}`)||LS.g("nc2-targets"); }
        if(!ml) { ml=LS.g(`nc2-meallist-${u.id}`)||LS.g("nc2-meallist"); }
        if(tg&&ml) {
          setTargets(tg); setMealList(ml);
          try {
            const ms=await DB.loadMeals(u.id,today);
            const lsMs=LS.g(`nc2-meals-${u.id}-${today}`)||LS.g(`nc2-meals-${today}`);
            const finalMs=ms||lsMs||ml.reduce((a,x)=>({...a,[x.name]:[]}),{});
            setMeals(finalMs);
            if(!ms&&lsMs) DB.saveMeals(u.id,today,lsMs).catch(()=>{});
          } catch {
            const lsMs=LS.g(`nc2-meals-${u.id}-${today}`)||LS.g(`nc2-meals-${today}`);
            setMeals(lsMs||ml.reduce((a,x)=>({...a,[x.name]:[]}),{}));
          }
          setOnboarded(true);
        }
      } catch(e) { console.warn("loadUser error:", e); }
      const todayStr2=localDateStr();
      const lsConfirmed=LS.g(`nc2-confirmed-${todayStr2}`);
      if(lsConfirmed&&Object.keys(lsConfirmed).length>0){
        setConfirmedMeals(prev=>Object.keys(prev).length>0?prev:lsConfirmed);
      }
      const lsLogs=LS.g("nc2-nutrition-logs-all");
      if(lsLogs?.length){ setNutritionLogs(prev=>prev.length?prev:lsLogs); }
      LS.s('nc2-seen-intro',true); setShowIntro(false);
      setReady(true);
    }
    // Wave 3: all remaining fetches in parallel, non-blocking
    const _f30=new Date(); _f30.setDate(_f30.getDate()-30);
    const _from30Str=`${_f30.getFullYear()}-${String(_f30.getMonth()+1).padStart(2,'0')}-${String(_f30.getDate()).padStart(2,'0')}`;
    const _fw30=new Date(); _fw30.setDate(_fw30.getDate()-30);
    const _from30wStr=`${_fw30.getFullYear()}-${String(_fw30.getMonth()+1).padStart(2,'0')}-${String(_fw30.getDate()).padStart(2,'0')}`;
    const _todayStr=localDateStr();
    Promise.all([
      DB.loadWeightLog(u.id).then(wl=>{ if(wl?.length){ setWeightLog(wl); LS.s("nc2-weightlog",wl); checkWeightPrompt(wl); }}).catch(()=>{}),
      DB.loadWeightSkip(u.id).then(wsd=>{ if(wsd) LS.s("nc2-weight-skip-date",wsd); }).catch(()=>{}),
      DB.loadPantry(u.id).then(pt=>{
        if(pt?.length){
          const lsPantryTs=LS.g("nc2-pantry-ts")||0; const nowTs=Date.now();
          if(nowTs-lsPantryTs>10000){ setPantry(pt); LS.s("nc2-pantry",pt); LS.s("nc2-pantry-ts",nowTs); }
          else { const lsPt=LS.g("nc2-pantry")||[]; setPantry(lsPt.length?lsPt:pt); }
        }
      }).catch(()=>{}),
      DB.loadFavMeals(u.id).then(fav=>{ if(fav?.length){ setFavMeals(fav); LS.s("nc2-favmeals",fav); }}).catch(()=>{}),
      DB.loadCustomFoods(u.id).then(cf=>{ if(cf?.length){ setCustomFoods(cf); LS.s("nc2-customfoods",cf); }}).catch(()=>{}),
      DB.loadNutritionLogs(u.id,_from30Str).then(async nl=>{
        if(nl){
          const todayStr=localDateStr();
          const todayLogs=nl.filter(l=>l.date===todayStr);
          if(todayLogs.length>0){
            const rebuilt=todayLogs.reduce((acc,l)=>({...acc,[l.mealName]:true}),{});
            setConfirmedMeals(rebuilt); LS.s(`nc2-confirmed-${todayStr}`,rebuilt);
          }
          const _lsLogs=LS.g("nc2-nutrition-logs-all");
          if(_lsLogs?.length){
            const key=l=>`${l.date}|${l.mealName}`;
            const sbKeys=new Set(nl.map(key));
            const missing=_lsLogs.filter(l=>!sbKeys.has(key(l)));
            setNutritionLogs(missing.length>0?[...nl,...missing]:nl);
          } else { setNutritionLogs(nl); }
          try { const sp=await DB.loadPlans(u.id); if(sp) setSavedPlans(sp); } catch {}
        }
      }).catch(()=>{}),
      DB.loadWorkoutLogs(u.id,_from30wStr).then(_wls=>{ if(_wls&&_wls.length){ setWorkoutLogs(_wls); LS.s("nc2-workouts",_wls); }}).catch(()=>{}),
      DB.loadMealRatings(u.id).then(_mr=>{ if(_mr&&Object.keys(_mr).length){ setMealRatings(_mr); LS.s("nc2-meal-ratings",_mr); }}).catch(()=>{}),
      DB.loadWeeklyPlan(u.id).then(wp=>{
        if(wp?.plan){ setWeeklyPlan(wp.plan); LS.s("nc2-weeklyplan",wp.plan); }
        else { const lsWp=LS.g("nc2-weeklyplan"); const lsSeed=LS.g("nc2-planseed")||0; if(lsWp){ setWeeklyPlan(lsWp); DB.saveWeeklyPlan(u.id,lsWp,lsSeed).catch(()=>{}); } }
        if(wp?.seed!=null){ setPlanSeed(wp.seed); LS.s("nc2-planseed",wp.seed); }
      }).catch(()=>{}),
      DB.loadLockedMeals(u.id,_todayStr).then(locked=>{ if(locked&&Object.keys(locked).length){ setLockedMeals(locked); LS.s(`nc2-locked-${_todayStr}`,locked); }}).catch(()=>{}),
      DB.loadSeenIntro(u.id).then(si=>{ if(si){ LS.s("nc2-seen-intro",true); setShowIntro(false); }}).catch(()=>{}),
    ]).catch(e=>console.error("loadUser wave3 error:",e));
  };

  const checkWeightPrompt=wl=>{
    if(!wl||!wl.length) return;
    const last=new Date(wl[wl.length-1].date);
    const diff=(new Date()-last)/(1000*60*60*24);
    if(diff>=7){
      const skippedToday=LS.g("nc2-weight-skip-date")===today;
      if(!skippedToday) setShowWeightModal(true);
    }
  };

  const savePantry=async(pt)=>{ LS.s("nc2-pantry",pt); LS.s("nc2-pantry-ts",Date.now()); if(user){ try{ await DB.savePantry(user.id,pt); }catch(e){ console.error("savePantry Supabase error:",e); } } };
  // Salva un alimento custom in stato, LS e Supabase custom_foods
  const saveCustomFood=(food)=>{
    setCustomFoods(prev=>{
      if(prev.find(f=>f.name===food.name)) return prev;
      const updated=[...prev,food];
      LS.s("nc2-customfoods",updated);
      if(user) DB.saveCustomFoods(user.id,updated).catch(e=>console.error("saveCustomFoods error:",e));
      return updated;
    });
  };
  const saveMeals=ms=>{ LS.s(`nc2-meals${user?"-"+user.id:""}-${today}`,ms); if(user) DB.saveMeals(user.id,today,ms).catch(e=>console.error("saveMeals error:",e)); };
  const profileToDB = pr => ({
    name: pr.name, gender: pr.gender, age: pr.age, weight: pr.weight,
    height: pr.height, body_fat: pr.bodyFat||null, activity: pr.activity,
    goal: pr.goal, num_meals: pr.numMeals, excluded_foods: pr.excludedFoods||[],
    bia_fm: pr.bia_fm||null, bia_vf: pr.bia_vf||null, bia_bmr: pr.bia_bmr||null,
    bia_ffm: pr.bia_ffm||null, bia_sc_fat: pr.bia_sc_fat||null,
    bia_smi: pr.bia_smi||null, bia_whr: pr.bia_whr||null, bia_smm: pr.bia_smm||null,
  });
  const saveProfile=pr=>{ LS.s(`nc2-profile${user?"-"+user.id:""}`,pr); if(user) DB.saveProfile(user.id,profileToDB(pr)).catch(e=>console.error("saveProfile error:",e)); };

  const completeOnboarding=(pr,tg,currentUser,presetDiet=null)=>{
    const ml=MEAL_CONFIGS[pr.numMeals];
    const ms=ml.reduce((a,x)=>({...a,[x.name]:[]}),{});
    setProfile(pr); setTargets(tg); setMealList(ml); setMeals(ms); setOnboarded(true);
    const uid=currentUser?.id||user?.id;
    // Salva profilo su LS e Supabase
    LS.s(`nc2-profile${uid?"-"+uid:""}`,pr);
    LS.s(`nc2-onboarded${uid?"-"+uid:""}`,true); // flag onboarding completato
    if(uid&&supabase) DB.saveProfile(uid,profileToDB(pr)).catch(e=>console.error("saveProfile error:",e));
    // Salva targets su LS e Supabase
    LS.s(`nc2-targets${uid?"-"+uid:""}`,tg);
    LS.s(`nc2-meallist${uid?"-"+uid:""}`,ml);
    if(uid&&supabase) DB.saveTargets(uid,tg,ml);
    saveMeals(ms);
    // Se l'utente ha scelto un protocollo durante l'onboarding, applicarlo
    if(presetDiet){
      const newPlan=Array.from({length:7},(_,dayIdx)=>{
        const pat=presetDiet.patterns[dayIdx%presetDiet.patterns.length];
        const dayMeals={};
        ml.forEach((meal,slotIdx)=>{
          const foodNames=pat[slotIdx]||pat[slotIdx%Object.keys(pat).length]||[];
          const foods=foodNames.map(n=>ALL_FOODS.find(f=>f.name===n)).filter(Boolean);
          if(foods.length){
            const mt=mealTarget(tg,meal.name,pr.numMeals);
            const qtys=optimize(foods,mt);
            dayMeals[meal.name]=filterRealisticItems(foods.map((food,i)=>({food,quantity:qtys[i]})),mt);
          } else { dayMeals[meal.name]=[]; }
        });
        return dayMeals;
      });
      setWeeklyPlan(newPlan);
      LS.s("nc2-weeklyplan",newPlan);
      if(uid&&supabase) DB.saveWeeklyPlan(uid,newPlan,0).catch(e=>console.error("saveWeeklyPlan error:",e));
    }
    setTimeout(()=>setTab("today"),100);
  };

  const recalc=()=>{
    const tg=calcMacros(profile);
    if(!tg) return;
    const ml=MEAL_CONFIGS[profile.numMeals];
    setTargets(tg); setMealList(ml);
    LS.s(`nc2-targets${user?"-"+user.id:""}`,tg);
    LS.s(`nc2-meallist${user?"-"+user.id:""}`,ml);
    if(user&&supabase) DB.saveTargets(user.id,tg,ml);
    saveProfile(profile);
  };
  const saveFavMeal=(mealName,items,customName)=>{
    const fav={id:Date.now(),name:customName||mealName,mealType:mealName,items:items.map(i=>({foodName:i.food.name,quantity:i.quantity,food:i.food}))};
    const updated=[...favMeals,fav];
    setFavMeals(updated); LS.s("nc2-favmeals",updated);
    if(user) DB.saveFavMeals(user.id,updated);
  };
  const deleteFavMeal=(id)=>{
    const updated=favMeals.filter(f=>f.id!==id);
    setFavMeals(updated); LS.s("nc2-favmeals",updated);
    if(user) DB.saveFavMeals(user.id,updated);
  };
  const applyFavMeal=(fav)=>{
    const items=fav.items.map(i=>({food:i.food,quantity:i.quantity})).filter(i=>i.food);
    const nm={...meals,[selMeal]:items}; setMeals(nm); saveMeals(nm);
  };
  const manualMacros=(form)=>{
    const tg={...targets,...form};
    setTargets(tg);
    LS.s(`nc2-targets${user?"-"+user.id:""}`,tg);
  };

  const confirmMeal=async(mealName,tot2)=>{
    const already=confirmedMeals&&confirmedMeals[mealName];
    // Helper: ottieni items del pasto corrente (meals o piano)
    const _tPIdx=(new Date().getDay()+6)%7;
    const _planDay=weeklyPlan?weeklyPlan[_tPIdx]:null;
    const mealItemsNow=(meals[mealName]||[]).length>0?meals[mealName]:(_planDay?.[mealName]||[]);

    if(already){
      // De-conferma: ripristina quantità in credenza
      const restoredPantry=pantry.map(p=>{
        const item=mealItemsNow.find(i=>i.food&&i.food.name===p.food.name);
        if(!item) return p;
        const newQty=p.qty+(item.quantity||0);
        return {...p,qty:newQty,exhaustedAt:undefined};
      });
      setPantry(restoredPantry); savePantry(restoredPantry);
      // De-conferma log
      const updated={...confirmedMeals};
      delete updated[mealName];
      setConfirmedMeals(updated);
      LS.s(`nc2-confirmed-${today}`,updated);
      // Rimuovi lock
      const updLocked={...lockedMeals};
      delete updLocked[mealName];
      setLockedMeals(updLocked);
      LS.s(`nc2-locked-${today}`,updLocked);
      if(user) DB.deleteNutritionLog(user.id,today,mealName);
      setNutritionLogs(prev=>prev.filter(l=>!(l.date===today&&l.mealName===mealName)));
    } else {
      // Conferma: detrai quantità dalla credenza
      const now=Date.now();
      const deductedPantry=pantry.map(p=>{
        const item=mealItemsNow.find(i=>i.food&&i.food.name===p.food.name);
        if(!item) return p;
        const newQty=Math.max(0,p.qty-(item.quantity||0));
        const isExhausted=newQty<=0;
        return {...p,qty:newQty,...(isExhausted?{exhaustedAt:p.exhaustedAt||now}:{exhaustedAt:undefined})};
      });
      setPantry(deductedPantry); savePantry(deductedPantry);
      // Conferma log
      const updated={...confirmedMeals,[mealName]:true};
      setConfirmedMeals(updated);
      LS.s(`nc2-confirmed-${today}`,updated);
      // Auto-blocca il pasto alla conferma
      const newLocked={...lockedMeals,[mealName]:true};
      setLockedMeals(newLocked);
      LS.s(`nc2-locked-${today}`,newLocked);
      const entry={date:today,mealName,calories:Math.round(tot2.cal),protein:Math.round(tot2.p*10)/10,carbs:Math.round(tot2.c*10)/10,fat:Math.round(tot2.f*10)/10};
      const updatedLogs=[...nutritionLogs.filter(l=>!(l.date===today&&l.mealName===mealName)),entry];
      setNutritionLogs(updatedLogs);
      // Salva in localStorage come backup multi-giorno (Bug 2 fix)
      // Salva su LS multi-giorno con merge: preserva log di tutti i giorni
      const allLsLogs=LS.g("nc2-nutrition-logs-all")||[];
      const mergedLsLogs=[...allLsLogs.filter(l=>!(l.date===entry.date&&l.mealName===entry.mealName)),entry];
      LS.s("nc2-nutrition-logs-all",mergedLsLogs);
      if(user){ try{ await DB.saveNutritionLog(user.id,today,mealName,tot2.cal,tot2.p,tot2.c,tot2.f); }catch(e){ console.error("saveNutritionLog failed:",e); } }
      // Trigger rating prompt
      const _rkey=resolveItalianMealKey(mealName);
      const _fnames=(mealItemsNow||[]).map(i=>i.food?.name).filter(Boolean);
      if(_fnames.length) setPendingRatingMeal({mealName,key:_rkey,foods:_fnames});
    }
  };

  const applyPresetDiet=(diet)=>{
    if(!targets) return;
    // Usa sempre il numero di pasti scelto dall'utente — adatta la dieta, non il profilo
    const activeMealList=mealList.length>0?mealList:(MEAL_CONFIGS[profile.numMeals]||MEAL_CONFIGS[3]);
    const activeNumMeals=activeMealList.length; // usa il valore locale, non profile (async)
    const newPlan=Array.from({length:7},(_,dayIdx)=>{
      const pat=diet.patterns[dayIdx%diet.patterns.length];
      const dayMeals={};
      activeMealList.forEach((meal,slotIdx)=>{
        const foodNames=pat[slotIdx]||pat[slotIdx%Object.keys(pat).length]||[];
        const foods=foodNames.map(n=>findFood(n)).filter(Boolean);
        if(foods.length){
          // Calcola target direttamente con activeNumMeals (non profile.numMeals che è stale)
          const mt=mealTarget(targets,meal.name,activeNumMeals);
          const qtys=optimize(foods,mt);
          const raw=foods.map((food,i)=>({food,quantity:qtys[i]}));
          dayMeals[meal.name]=filterRealisticItems(raw,mt);
        } else {
          dayMeals[meal.name]=[];
        }
      });
      return dayMeals;
    });
    // Azzera i pasti del giorno corrente
    const emptyMeals=activeMealList.reduce((a,x)=>({...a,[x.name]:[]}),{});
    setMeals(emptyMeals); saveMeals(emptyMeals);
    setWeeklyPlan(newPlan); LS.s("nc2-weeklyplan",newPlan);
    setIsCustomized(false); setShowDietLibrary(false); setSubScreen("piano");
  };

  const saveCurrentPlan=async(name)=>{
    if(!weeklyPlan||!user) return;
    const saved=await DB.savePlan(user.id,{name,plan_data:weeklyPlan});
    if(saved){ const sp=await DB.loadPlans(user.id); setSavedPlans(sp||[]); }
  };

  const deleteSavedPlan=async(id)=>{
    await DB.deletePlan(id);
    setSavedPlans(prev=>prev.filter(p=>p.id!==id));
  };

  const applySavedPlan=(sp)=>{
    // Azzera pasti del giorno prima di applicare il piano salvato
    const emptyMeals=mealList.reduce((a,x)=>({...a,[x.name]:[]}),{});
    setMeals(emptyMeals); saveMeals(emptyMeals);
    setWeeklyPlan(sp.planData); LS.s("nc2-weeklyplan",sp.planData);
    setIsCustomized(false); setShowDietLibrary(false); setSubScreen("piano");
  };

  const handleGeneratePlan=(seed)=>{
    if(!targets||!mealList.length) return;
    const validSeed = (typeof seed === 'number' && Number.isFinite(seed));
    const newSeed = validSeed ? seed : ((planSeed + 1) % 7);
    const plan=generateWeeklyPlan(targets,mealList,newSeed,profile.numMeals,profile.excludedFoods||[]);
    const emptyMeals=mealList.reduce((a,x)=>({...a,[x.name]:[]}),{});
    setMeals(emptyMeals); saveMeals(emptyMeals);
    setWeeklyPlan(plan);
    setPlanSeed(newSeed);
    LS.s("nc2-weeklyplan",plan);
    LS.s("nc2-planseed",newSeed);
    setIsCustomized(false);
  };

  const handleGeneratePlanFromPantry=()=>{
    if(!targets||!mealList.length) return;
    const available=pantry.filter(it=>it.qty>0).map(it=>it.food);
    if(!available.length){ alert(lang==="en"?"Pantry is empty. Add foods first.":"La Credenza è vuota. Aggiungi alimenti prima."); return; }
    const plan=[];
    const excl14=profile.excludedFoods||[];
    for(let day=0;day<7;day++){
      const dayMeals={};
      mealList.forEach(meal=>{
        const mKey=meal.name;
        const _pct=meal.pct||(1/mealList.length);
        const mTgt={calories:Math.round(targets.calories*_pct),protein:Math.round(targets.protein*_pct),carbs:Math.round(targets.carbs*_pct),fat:Math.round(targets.fat*_pct)};
        const foods=(selectPantryFoodsForTarget(mTgt,mKey)||[]).filter(f=>!isExcluded(f.name,excl14));
        if(!foods.length){ dayMeals[mKey]=[]; return; }
        const qtys=optimize(foods,mTgt);
        const raw=foods.map((food,i)=>({food,quantity:qtys[i]}));
        dayMeals[mKey]=filterRealisticItems(raw,mTgt);
      });
      plan.push(dayMeals);
    }
    setWeeklyPlan(plan);
    LS.s("nc2-weeklyplan",plan);
    setIsCustomized(false);
  };

  const buildItems=(foods,mealName)=>{ if(!targets) return []; const name=mealName||selMeal; const _bml=mealList.find(m=>m.name===name||m.nameEn===name); const _bpct=_bml?.pct||(1/(mealList.length||profile.numMeals)); const mt={calories:Math.round(targets.calories*_bpct),protein:Math.round(targets.protein*_bpct),carbs:Math.round(targets.carbs*_bpct),fat:Math.round(targets.fat*_bpct)}; const qtys=optimize(foods,mt); const raw=foods.map((food,i)=>({food,quantity:qtys[i]})); return filterRealisticItems(raw,mt); };

  // Seleziona cibi dalla Credenza bilanciando categorie macro in base ai target reali del pasto
  const selectPantryFoodsForTarget=(mTgt,mealNameArg,rotIdx=0)=>{
    const excl=profile.excludedFoods||[];
    const available=pantry.filter(it=>it.qty>0).map(it=>it.food).filter(f=>!isExcluded(f.name,excl));
    if(!available.length) return null;
    const mKey=resolveItalianMealKey(mealNameArg||selMeal||"");
    const recipes=WEEK_RECIPES[mKey]||WEEK_RECIPES["Pranzo"];
    // Usa selezione basata su ricetta (Opzione A): compatibilità culinaria garantita
    return selectPantryFoodsForRecipe(mealNameArg||selMeal||"", available, recipes, rotIdx, mealRatings||{});
  };

  // Seleziona i migliori cibi dalla Credenza in base all'obiettivo (usato da generateMeal)
  const selectBestPantryFoods=(name)=>{
    const excl=profile.excludedFoods||[];
    const available=pantry.filter(it=>it.qty>0).map(it=>it.food).filter(f=>!isExcluded(f.name,excl));
    if(!available.length) return null;
    const goal=profile.goal||"maintain";
    const scored=available.map(f=>{
      let sc=0; const kcal=f.cal||1;
      sc+=(f.p/kcal)*10;
      if(goal==="lose"){ sc+=(f.p/kcal)*5; sc-=(f.c/kcal)*3; sc-=(kcal/500); }
      else if(goal==="gain"){ sc+=(f.p/kcal)*4; sc+=(f.c/kcal)*2; }
      else { sc+=(f.p/kcal)*3; }
      return {food:f,score:sc};
    });
    scored.sort((a,b)=>b.score-a.score);
    return scored.slice(0,4).map(s=>s.food);
  };

  // Ricalcola pasto con cibi della Credenza rispettando calorie E tutti i macro del pasto
  const regenMealFromPantry=(mealName)=>{
    if(!pantry.length) return;
    // Target reali del pasto: dal piano importato se disponibile
    const jsDay2=new Date().getDay();
    const todayIdx2=(jsDay2+6)%7;
    let mTgt;
    if(weeklyPlan&&weeklyPlan[todayIdx2]&&weeklyPlan[todayIdx2][mealName]){
      const planItems=weeklyPlan[todayIdx2][mealName];
      const pt=totals(planItems);
      mTgt={calories:Math.round(pt.cal),protein:Math.round(pt.p),carbs:Math.round(pt.c),fat:Math.round(pt.f)};
    } else {
      const _rml=mealList.find(m=>m.name===mealName||m.nameEn===mealName);
      const _rpct=_rml?.pct||(1/(mealList.length||profile.numMeals));
      mTgt={calories:Math.round(targets.calories*_rpct),protein:Math.round(targets.protein*_rpct),carbs:Math.round(targets.carbs*_rpct),fat:Math.round(targets.fat*_rpct)};
    }
    // Seleziona cibi bilanciati sui macro target del pasto
    const bestFoods=selectPantryFoodsForTarget(mTgt,mealName);
    if(!bestFoods||!bestFoods.length) return;
    // Ottimizza quantità per colpire calorie E tutti i macro
    const qtys=optimize(bestFoods,mTgt);
    const newItems=bestFoods.map((food,i)=>({food,quantity:qtys[i]}));
    if(weeklyPlan){
      const updated=weeklyPlan.map((day,di)=>{
        if(di===todayIdx2) return {...day,[mealName]:newItems};
        return day;
      });
      setWeeklyPlan(updated); LS.s("nc2-weeklyplan",updated);
    }
    const nm={...meals,[mealName]:newItems};
    setMeals(nm); saveMeals(nm);
  };

  const unlockMeal=(mealName)=>{
    const updated={...lockedMeals};
    delete updated[mealName];
    setLockedMeals(updated);
    LS.s(`nc2-locked-${today}`,updated);
  };

  const generateMeal=name=>{
    if(lockedMeals&&lockedMeals[name]){ alert(lang==="en"?"Meal is locked. Unlock it first to modify.":"Pasto bloccato. Sbloccalo prima di modificarlo."); return; }
    if(pantry.length===0) {
      alert(lang==="en"?"Pantry is empty. Add items to Pantry first.":"La Credenza è vuota. Aggiungi degli alimenti nella Credenza prima di generare un pasto automatico.");
      return;
    }
    const _mealInfo=mealList.find(m=>m.name===name||m.nameEn===name);
    const _pctM=_mealInfo?.pct||(1/(mealList.length||profile.numMeals));
    const _genMTgt={calories:Math.round(targets.calories*_pctM),protein:Math.round(targets.protein*_pctM),carbs:Math.round(targets.carbs*_pctM),fat:Math.round(targets.fat*_pctM)};
    // Rotazione basata su seed + pasti già confermati oggi per variare gli alimenti
    const _rotIdx=(planSeed+Object.keys(confirmedMeals||{}).length)%7;
    const bestFoods=selectPantryFoodsForTarget(_genMTgt,name,_rotIdx);
    if(!bestFoods||!bestFoods.length) {
      alert(lang==="en"?"All pantry items are exhausted or no suitable foods for this meal. Update quantities.":"Credenza esaurita o nessun alimento adatto per questo pasto. Aggiorna le quantità.");
      return;
    }
    const items=buildItems(bestFoods,name);
    const nm={...meals,[name]:items};
    setMeals(nm); saveMeals(nm);
    // Toast con nome ricetta usata
    const _mKeyToast=resolveItalianMealKey(name);
    const _recipesT=WEEK_RECIPES[_mKeyToast]||WEEK_RECIPES["Pranzo"];
    const _ratingT=mealRatings||{};
    const _hrf=new Set(Object.values(_ratingT).flat().filter(r=>r.rating>=4).flatMap(r=>r.foods||[]));
    const _sc=_recipesT.map((r,i)=>({r,i,score:r.foods.filter(f=>_hrf.has(f)).length}));
    _sc.sort((a,b)=>b.score-a.score);
    const _tg=_sc.filter(s=>s.score===_sc[0].score);
    const _ri=(_rotIdx)%_tg.length;
    const _toastRecipe=_tg[_ri].r;
    const _el=document.createElement('div');
    _el.textContent='🫙 '+_toastRecipe.name;
    _el.style.cssText='position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#0A1318;color:#00E5A0;padding:10px 18px;border-radius:12px;font-weight:700;font-size:13px;border:1px solid #00E5A044;z-index:999;pointer-events:none';
    document.body.appendChild(_el); setTimeout(()=>_el.remove(),2500);
    // Sottrai le quantità usate dalla credenza
    const usedQtys={};
    items.forEach(it=>{ usedQtys[it.food.name]=(usedQtys[it.food.name]||0)+it.quantity; });
    const updated=pantry.map(it=>{
      if(usedQtys[it.food.name]) {
        const remaining=Math.max(0,it.qty-usedQtys[it.food.name]);
        return remaining>0?{...it,qty:remaining}:null;
      }
      return it;
    }).filter(Boolean);
    setPantry(updated); savePantry(updated);
  };

  const generateMealFromDB=name=>{
    if(lockedMeals&&lockedMeals[name]){ alert(lang==="en"?"Meal is locked. Unlock it first to modify.":"Pasto bloccato. Sbloccalo prima di modificarlo."); return; }
    const key=resolveItalianMealKey(name);
    const recipes=WEEK_RECIPES[key]||WEEK_RECIPES["Pranzo"];
    // Scegli ricetta in base a seed + pasti confermati oggi + punteggio rating
    // Le ricette con alimenti più votati ottengono un bonus nel punteggio
    const ratings=(mealRatings||{})[key]||[];
    const highRatedFoods=new Set(
      ratings.filter(r=>r.rating>=4).flatMap(r=>r.foods)
    );
    // Punteggio ricetta: +1 per ogni alimento della ricetta già votato bene
    const scored=recipes.map((r,i)=>({
      recipe:r, idx:i,
      score: r.foods.filter(f=>highRatedFoods.has(f)).length
    }));
    // Raggruppa le ricette per punteggio: preferisci le votate, ruota all'interno del gruppo
    scored.sort((a,b)=>b.score-a.score);
    const topScore=scored[0].score;
    const topGroup=scored.filter(s=>s.score===topScore);
    const rotBase=(planSeed+Object.keys(confirmedMeals||{}).length);
    const recipe=topGroup[rotBase%topGroup.length].recipe;
    const excl=profile.excludedFoods||[];
    // Usa SOLO i cibi della ricetta scelta (max 4) — nessuna aggiunta da history
    let foods=recipe.foods.map(n=>findFood(n)).filter(Boolean).filter(f=>!isExcluded(f.name,excl));
    if(!foods.length) return;
    const items=buildItems(foods,name);
    const nm={...meals,[name]:items};
    setMeals(nm); saveMeals(nm);
    // Toast with recipe name
    const _el=document.createElement('div');
    _el.textContent='🍽️ '+recipe.name;
    _el.style.cssText='position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#0A1318;color:#00E5A0;padding:10px 18px;border-radius:12px;font-weight:700;font-size:13px;border:1px solid #00E5A044;z-index:999;pointer-events:none';
    document.body.appendChild(_el); setTimeout(()=>_el.remove(),2500);
  };

  // Costruisce snapshot completo: merge meals state + piano per slot vuoti
  const buildMealSnapshot=(planDayNow,name,items)=>{
    const allKeys=new Set([...Object.keys(meals),...(planDayNow?Object.keys(planDayNow):[])]);
    const snap={};
    allKeys.forEach(k=>{ snap[k]=(meals[k]||[]).length>0?meals[k]:(planDayNow?.[k]||[]); });
    snap[name]=items;
    return snap;
  };

  const addFood=(name,food)=>{
    const todayIdx2=(new Date().getDay()+6)%7;
    const planDayNow=weeklyPlan?weeklyPlan[todayIdx2]:null;
    const baseItems=(meals[name]||[]).length>0?meals[name]:(planDayNow?.[name]||[]);
    // Auto-calcola quantità ottimale per rispettare il budget calorico residuo del pasto
    let initQty;
    if(food.unit==="pz"){ initQty=1; }
    else {
      const mInfo=mealList.find(m=>m.name===name||m.nameEn===name);
      const pct=mInfo?.pct||(1/(mealList.length||profile.numMeals));
      const mTgt=targets?{calories:Math.round(targets.calories*pct),protein:Math.round(targets.protein*pct),carbs:Math.round(targets.carbs*pct),fat:Math.round(targets.fat*pct)}:null;
      if(mTgt&&food.cal>0){
        const curTot=totals(baseItems);
        const remainCal=Math.max(0, mTgt.calories - curTot.cal);
        if(remainCal>10){
          // Quantità per colpire le calorie rimanenti (per 100g)
          initQty=Math.round((remainCal/food.cal)*100);
          initQty=Math.max(30,Math.min(400,initQty));
        } else { initQty=50; }
      } else { initQty=100; }
    }
    const items=[...baseItems,{food,quantity:initQty}];
    const nm=buildMealSnapshot(planDayNow,name,items);
    if(weeklyPlan){
      const upd=weeklyPlan.map((day,di)=>di===todayIdx2?{...day,[name]:items}:day);
      setWeeklyPlan(upd); LS.s("nc2-weeklyplan",upd);
    }
    setMeals(nm); saveMeals(nm); setIsCustomized(true);
  };
  const addFoodItems=(name,newItems)=>{
    const todayIdx2=(new Date().getDay()+6)%7;
    const planDayNow=weeklyPlan?weeklyPlan[todayIdx2]:null;
    const baseItems=(meals[name]||[]).length>0?meals[name]:(planDayNow?.[name]||[]);
    const merged=[...baseItems,...newItems];
    const nm=buildMealSnapshot(planDayNow,name,merged);
    if(weeklyPlan){
      const upd=weeklyPlan.map((day,di)=>di===todayIdx2?{...day,[name]:merged}:day);
      setWeeklyPlan(upd); LS.s("nc2-weeklyplan",upd);
    }
    setMeals(nm); saveMeals(nm); setIsCustomized(true);
  };
  const removeFood=(name,idx)=>{
    const todayIdx2=(new Date().getDay()+6)%7;
    const planDayNow=weeklyPlan?weeklyPlan[todayIdx2]:null;
    const baseItems=(meals[name]||[]).length>0?meals[name]:(planDayNow?.[name]||[]);
    // NON ricalcolare le rimanenti — rimuove solo l'elemento indicato
    const items=baseItems.filter((_,i)=>i!==idx);
    const nm=buildMealSnapshot(planDayNow,name,items);
    if(weeklyPlan){
      const upd=weeklyPlan.map((day,di)=>di===todayIdx2?{...day,[name]:items}:day);
      setWeeklyPlan(upd); LS.s("nc2-weeklyplan",upd);
    }
    setMeals(nm); saveMeals(nm); setIsCustomized(true);
  };
  const updateQty=(name,idx,qty)=>{
    const todayIdx2=(new Date().getDay()+6)%7;
    const planDayNow=weeklyPlan?weeklyPlan[todayIdx2]:null;
    const baseItems=(meals[name]||[]).length>0?meals[name]:(planDayNow?.[name]||[]);
    const u=[...baseItems]; u[idx]={...u[idx],quantity:Math.max(0,parseInt(qty)||0)};
    const nm=buildMealSnapshot(planDayNow,name,u);
    if(weeklyPlan){
      const upd=weeklyPlan.map((day,di)=>di===todayIdx2?{...day,[name]:u}:day);
      setWeeklyPlan(upd); LS.s("nc2-weeklyplan",upd);
    }
    setMeals(nm); saveMeals(nm); setIsCustomized(true);
  };
  const updateUnit=(name,idx,unit)=>{
    const todayIdx2=(new Date().getDay()+6)%7;
    const planDayNow=weeklyPlan?weeklyPlan[todayIdx2]:null;
    const baseItems=(meals[name]||[]).length>0?meals[name]:(planDayNow?.[name]||[]);
    const u=[...baseItems]; const def=unit==="pz"?1:100;
    u[idx]={...u[idx],food:{...u[idx].food,unit},quantity:def};
    const nm=buildMealSnapshot(planDayNow,name,u);
    if(weeklyPlan){
      const upd=weeklyPlan.map((day,di)=>di===todayIdx2?{...day,[name]:u}:day);
      setWeeklyPlan(upd); LS.s("nc2-weeklyplan",upd);
    }
    setMeals(nm); saveMeals(nm); setIsCustomized(true);
  };

  const saveWorkout=(kcal,type,duration)=>{
    const entry={id:Date.now(),date:today,kcal:Math.round(kcal),type,duration};
    const updated=[...workoutLogs.filter(w=>!(w.date===today&&w.type===type)),entry];
    setWorkoutLogs(updated); LS.s("nc2-workouts",updated);
    if(user) DB.saveWorkoutLogs(user.id,today,updated.filter(w=>w.date===today)).catch(()=>{});
  };
  const saveMealRating=(mealKey,foods,rating)=>{
    const entry={rating,foods,ts:Date.now()};
    // Keep last 10 rated combos per meal type
    const existing=(mealRatings[mealKey]||[]).filter(r=>JSON.stringify([...r.foods].sort())!==JSON.stringify([...foods].sort())).slice(-9);
    const updated={...mealRatings,[mealKey]:[...existing,entry]};
    setMealRatings(updated); LS.s("nc2-meal-ratings",updated);
    if(user) DB.saveMealRatings(user.id,updated).catch(()=>{});
  };
  const removeWorkout=(id)=>{
    const updated=workoutLogs.filter(w=>w.id!==id);
    setWorkoutLogs(updated); LS.s("nc2-workouts",updated);
  };


  const logWeight=w=>{ const entry={date:today,weight:w}; const updated=[...weightLog.filter(e=>e.date!==today),entry].sort((a,b)=>a.date.localeCompare(b.date)); setWeightLog(updated); LS.s("nc2-weightlog",updated); if(user) DB.saveWeightLog(user.id,updated); setShowWeightModal(false); };
  const manualLogWeight=()=>{ const w=parseFloat(newWeight); if(w&&w>30&&w<300){logWeight(w);setNewWeight("");} };

  const handleLogout=async()=>{
    try { if(supabase) await supabase.auth.signOut(); } catch(e) { console.warn("signOut error:",e); }
    setUser(null);
    setOnboarded(false);
    setProfile({ name:"", gender:"m", age:"", weight:"", height:"", bodyFat:"", activity:1.55, goal:"lose", numMeals:3, excludedFoods:[], bia_fm:"", bia_vf:"", bia_bmr:"", bia_ffm:"", bia_sc_fat:"", bia_smi:"", bia_whr:"", bia_smm:"" });
    setTargets(null);
    setMealList([]);
    setMeals({});
    setPantry([]);
    setWeightLog([]);
    setWeeklyPlan(null);
    setPlanSeed(0);
    setFavMeals([]);
    setNutritionLogs([]);
    setConfirmedMeals({});
  };
  const handleReset=()=>{
    const keys=["nc2-profile","nc2-targets","nc2-meallist","nc2-pantry","nc2-weightlog","nc2-weeklyplan","nc2-planseed"];
    if(user) keys.forEach(k=>localStorage.removeItem(k+"-"+user.id));
    keys.forEach(k=>localStorage.removeItem(k));
    setProfile({name:user?.user_metadata?.name||"",gender:"m",age:"",weight:"",height:"",bodyFat:"",activity:1.55,goal:"lose",numMeals:3,bia_fm:"",bia_vf:"",bia_bmr:"",bia_ffm:"",bia_sc_fat:"",bia_smi:"",bia_whr:"",bia_smm:""});
    setTargets(null); setMealList([]); setMeals({}); setPantry([]); setWeightLog([]);
    setWeeklyPlan(null); setPlanSeed(0);
    setOnboarded(false);
  };

  if(!langChosen) return <LangSelectScreen onSelect={selectLang}/>;
  if(!ready) return <div style={{...ss,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}><style>{FONTS}</style><Spin size={32}/></div>;
  if(showIntro) return <WelcomeSlideshow onDone={()=>{ LS.s('nc2-seen-intro',true); setShowIntro(false); setTab("profile"); if(user) DB.saveSeenIntro(user.id).catch(()=>{}); }}/>;
  if(supabase&&!user) return <AuthScreen onAuth={loadUser}/>;
  if(!onboarded) return <OnboardingScreen user={user} isNewUser={!LS.g(`nc2-onboarded${user?"-"+user?.id:""}`)} onComplete={(pr,tg,presetDiet)=>completeOnboarding(pr,tg,user,presetDiet)}/>;

  const activeMealNames=new Set(mealList.map(m=>m.name));
  const allTot=totals(Object.entries(meals).filter(([k])=>activeMealNames.has(k)).flatMap(([,v])=>v));
  const mealData=mealList.find(m=>m.name===selMeal);

  // todayPlanIdx deve essere definito PRIMA di mealItems
  const jsDay=new Date().getDay();
  const todayPlanIdx=(jsDay+6)%7;

  // Fallback a planDay quando meals[selMeal] è vuoto (dati nel piano settimanale)
  const _todayPlanDay = weeklyPlan ? weeklyPlan[todayPlanIdx] : null;
  const mealItems = (meals[selMeal]||[]).length > 0
    ? meals[selMeal]
    : (_todayPlanDay?.[selMeal] || []);
  const mealTot=totals(mealItems);
  const planMealTargets = (() => {
    if (!weeklyPlan || !mealList.length) return null;
    const dayPlan = weeklyPlan[todayPlanIdx] || {};
    const out = {};
    mealList.forEach(meal => {
      const items = dayPlan[meal.name] || [];
      if (!items.length) {
        out[meal.name] = mealTarget(targets, meal.name, profile.numMeals);
        return;
      }
      const t2 = totals(items);
      out[meal.name] = {
        calories: Math.round(t2.cal),
        protein:  Math.round(t2.p),
        carbs:    Math.round(t2.c),
        fat:      Math.round(t2.f),
      };
    });
    return out;
  })();

  const getMealTarget = (mealName) =>
    (planMealTargets && planMealTargets[mealName]) || mealTarget(targets, mealName, profile.numMeals);

  if(photoMealName) {
    const pmd=mealList.find(m=>m.name===photoMealName);
    return (
      <>
        <style>{FONTS}</style>
        <div style={ss}>
          <PhotoMealScreen mealName={photoMealName} mealData={pmd} lang={lang} onBack={()=>setPhotoMealName(null)} onConfirm={photoItems=>{
          // Se siamo in modalità piano (isCustomized=false), copiamo prima i dati
          // del piano nel tracked state per non perdere i pasti già pianificati
          const planDay2=weeklyPlan?weeklyPlan[todayPlanIdx]:null;
          const baseMeals=(!isCustomized&&planDay2)
            ? mealList.reduce((a,m)=>({...a,[m.name]:(meals[m.name]||[]).length?(meals[m.name]||[]):(planDay2[m.name]||[])}),{})
            : meals;
          const nm={...baseMeals,[photoMealName]:[...(baseMeals[photoMealName]||[]),...photoItems]};
          setMeals(nm); saveMeals(nm);
          // Aggiorna anche weeklyPlan per consistenza totale (sia isCustomized che non)
          if(weeklyPlan){
            const upd=weeklyPlan.map((day,di)=>di===todayPlanIdx?{...day,[photoMealName]:nm[photoMealName]}:day);
            setWeeklyPlan(upd); LS.s("nc2-weeklyplan",upd);
          }
          setIsCustomized(true); setPhotoMealName(null);
        }}/>
        </div>
      </>
    );
  }

  if(tab==="progress") return (
    <>
      <style>{FONTS}</style>
      <div style={ss}>
        <DietProgressScreen targets={targets} nutritionLogs={nutritionLogs} workoutLogs={workoutLogs} lang={lang} onBack={()=>setTab("today")} onSaveWorkout={saveWorkout} onRemoveWorkout={removeWorkout}/>
      </div>
    </>
  );
  // Rating modal overlay (shown after meal confirmation)
  const ratingOverlay=pendingRatingMeal&&(
    <RatingModal
      mealName={pendingRatingMeal.mealName}
      lang={lang}
      onRate={r=>{ saveMealRating(pendingRatingMeal.key,pendingRatingMeal.foods,r); setPendingRatingMeal(null); }}
      onSkip={()=>setPendingRatingMeal(null)}
    />
  );

  if(showDietLibrary) return (
    <>
      <style>{FONTS}</style>
      <div style={ss}>
        <DietLibraryScreen
          weeklyPlan={weeklyPlan}
          savedPlans={savedPlans}
          lang={lang}
          onApplyPreset={applyPresetDiet}
          onSaveCurrentPlan={saveCurrentPlan}
          onDeleteSavedPlan={deleteSavedPlan}
          onApplySaved={applySavedPlan}
          onBack={()=>setShowDietLibrary(false)}
        />
      </div>
    </>
  );

  if(tab==="piano"&&planSelMeal) return (
    <>
      <style>{FONTS}</style>
      <div style={ss}>
        <PlanMealDetailScreen
          mealName={planSelMeal.mealName} dayIdx={planSelMeal.dayIdx}
          items={planSelMeal.items} target={planSelMeal.target}
          pantry={pantry} lang={lang} optimize={optimize} filterRealisticItems={filterRealisticItems}
          onBack={()=>setPlanSelMeal(null)}
          onSave={(newItems)=>{
            const updated=weeklyPlan.map((day,di)=>di!==planSelMeal.dayIdx?day:{...day,[planSelMeal.mealName]:newItems});
            setWeeklyPlan(updated); LS.s("nc2-weeklyplan",updated); setPlanSelMeal(null);
          }}
        />
      </div>
    </>
  );

  if(tab==="piano"&&!planSelMeal) return (
    <>
      <style>{FONTS}</style>
      <div style={ss}>
        <MealPlanScreen weeklyPlan={weeklyPlan} mealList={mealList} targets={targets} lang={lang}
          onGenerate={handleGeneratePlan} onGenerateFromPantry={handleGeneratePlanFromPantry}
          onReset={()=>{ setWeeklyPlan(null); LS.s("nc2-weeklyplan",null); }}
          onMealClick={(mealName,dayIdx,items,target)=>setPlanSelMeal({mealName,dayIdx,items,target})}
          onOpenDietLibrary={()=>setShowDietLibrary(true)}
          onBack={()=>setTab("today")}
        />
        <BottomNav tab={tab} setTab={setTab} lang={lang} setSubScreen={setSubScreen}/>
      </div>
    </>
  );

  if(subScreen==="piano"&&!planSelMeal) return (
    <>
      <style>{FONTS}</style>
      <div style={ss}>
        <MealPlanScreen weeklyPlan={weeklyPlan} mealList={mealList} targets={targets} lang={lang}
          onGenerate={handleGeneratePlan} onGenerateFromPantry={handleGeneratePlanFromPantry}
          onReset={()=>{ setWeeklyPlan(null); LS.s("nc2-weeklyplan",null); }}
          onMealClick={(mealName,dayIdx,items,target)=>setPlanSelMeal({mealName,dayIdx,items,target})}
          onOpenDietLibrary={()=>{setSubScreen(null);setShowDietLibrary(true);}}
          onBack={()=>setSubScreen(null)}
        />
      </div>
    </>
  );

  if(subScreen==="piano"&&planSelMeal) return (
    <>
      <style>{FONTS}</style>
      <div style={ss}>
        <PlanMealDetailScreen
          mealName={planSelMeal.mealName} dayIdx={planSelMeal.dayIdx}
          items={planSelMeal.items} target={planSelMeal.target}
          pantry={pantry} lang={lang} optimize={optimize} filterRealisticItems={filterRealisticItems}
          onBack={()=>setPlanSelMeal(null)}
          onSave={(newItems)=>{
            const updated=weeklyPlan.map((day,di)=>di!==planSelMeal.dayIdx?day:{...day,[planSelMeal.mealName]:newItems});
            setWeeklyPlan(updated); LS.s("nc2-weeklyplan",updated); setPlanSelMeal(null);
          }}
        />
      </div>
    </>
  );

  if(subScreen==="import") return (
    <>
      <style>{FONTS}</style>
      <div style={ss}>
        <ImportDietScreen lang={lang} mealList={mealList}
          onBack={()=>setSubScreen(null)}
          onApply={(importedMeals)=>{ setMeals(importedMeals); saveMeals(importedMeals); setSubScreen(null); setTab("today"); }}
          onApplyToPlan={(importedWeekPlan, newTargets)=>{
            const firstDay=Object.values(importedWeekPlan||{}).find(d=>d&&Object.keys(d).length>0)||{};
            const importedMealNames=Object.keys(firstDay);
            const importedNum=importedMealNames.length||profile.numMeals;
            const bestCfg=MEAL_CONFIGS[importedNum]||MEAL_CONFIGS[Math.min(5,Math.max(1,importedNum))];
            const newML=importedMealNames.length>0
              ? importedMealNames.map((name,i)=>{ const cfg=bestCfg[i]||bestCfg[bestCfg.length-1]; return {name,nameEn:name,icon:cfg.icon,time:cfg.time,pct:1/importedNum}; })
              : mealList;
            const emptyMeals=newML.reduce((a,x)=>({...a,[x.name]:[]}),{});
            setMeals(emptyMeals); saveMeals(emptyMeals);
            setWeeklyPlan(importedWeekPlan); LS.s("nc2-weeklyplan",importedWeekPlan); setIsCustomized(false);
            const updProf={...profile,numMeals:importedNum};
            setProfile(updProf); setMealList(newML);
            LS.s(`nc2-profile${user?"-"+user.id:""}`,updProf);
            LS.s(`nc2-meallist${user?"-"+user.id:""}`,newML);
            if(newTargets){ setTargets(newTargets); LS.s(`nc2-targets${user?"-"+user.id:""}`,newTargets); if(user&&supabase) DB.saveTargets(user.id,newTargets,newML); }
            setSubScreen("piano");
          }}
        />
      </div>
    </>
  );

  if(subScreen==="diary"||tab==="diary") return (
    <>
      <style>{FONTS}</style>
      <div style={ss}>
        <DiaryScreen lang={lang} pantry={pantry} customFoods={customFoods} onBack={()=>{ subScreen==="diary"?setSubScreen(null):setTab("today"); }}/>
      </div>
      {tab==="diary"&&<BottomNav tab={tab} setTab={setTab} lang={lang} setSubScreen={setSubScreen}/>}
    </>
  );



  if(selMeal) return (
    <>
      <style>{FONTS}</style>
      <div style={ss}>
        <MealDetailScreen mealName={selMeal} mealData={mealData} items={mealItems} tot={mealTot} target={getMealTarget(selMeal)} pantry={pantry} customFoods={customFoods}
          favMeals={favMeals.filter(f=>f.mealType===selMeal)} lang={lang}
          onBack={()=>setSelMeal(null)} onAdd={f=>addFood(selMeal,f)} onRemove={idx=>removeFood(selMeal,idx)} onQty={(idx,qty)=>updateQty(selMeal,idx,qty)} onUnit={(idx,unit)=>updateUnit(selMeal,idx,unit)} onGenerate={()=>generateMeal(selMeal)} onGenerateDB={()=>generateMealFromDB(selMeal)} onClear={()=>{ const nm={...meals,[selMeal]:[]}; setMeals(nm); saveMeals(nm); }}
          onRecalc={()=>{ const mTgt=getMealTarget(selMeal); const foods=mealItems.map(it=>it.food); if(!foods.length||!mTgt) return; const qtys=optimize(foods,mTgt); const newItems=foods.map((food,i)=>({food,quantity:qtys[i]})); const nm=buildMealSnapshot(_todayPlanDay,selMeal,newItems); if(weeklyPlan){ const upd=weeklyPlan.map((day,di)=>di===todayPlanIdx?{...day,[selMeal]:newItems}:day); setWeeklyPlan(upd); LS.s("nc2-weeklyplan",upd); } setMeals(nm); saveMeals(nm); }}
          onSwap={(idx,newFood,newQty)=>{ const newItems=mealItems.map((it,i)=>i===idx?{food:newFood,quantity:newQty}:it); const nm={...meals,[selMeal]:newItems}; setMeals(nm); saveMeals(nm); }}
          onSaveFav={(name)=>saveFavMeal(selMeal,mealItems,name)} onApplyFav={applyFavMeal} onDeleteFav={deleteFavMeal} onAddItems={items=>addFoodItems(selMeal,items)}
          isConfirmed={!!(confirmedMeals&&confirmedMeals[selMeal])}
          isLocked={!!(lockedMeals&&lockedMeals[selMeal])}
          onUnconfirm={()=>confirmMeal(selMeal,mealTot)}
          onUnlock={()=>unlockMeal(selMeal)}
          onSaveCustomFood={saveCustomFood}/>
      </div>
    </>
  );



  return (
    <div key={lang} style={{...ss,paddingBottom:70}}>
      <style>{FONTS}</style>
      {showWeightModal&&<WeightModal profile={profile} onSave={logWeight} onSkip={()=>{ LS.s("nc2-weight-skip-date",today); setShowWeightModal(false); if(user) DB.saveWeightSkip(user.id,today); }} lang={lang}/>}
      {tab==="today"&&!pantryEditMeal&&<TodayScreen targets={targets} mealList={mealList} meals={meals} weeklyPlan={weeklyPlan} isCustomized={isCustomized} allTot={allTot} planMealTargets={planMealTargets} profile={profile} lang={lang} weightLog={weightLog} confirmedMeals={confirmedMeals} lockedMeals={lockedMeals} onConfirmMeal={confirmMeal} onUnlockMeal={unlockMeal} customFoods={customFoods} onMealClick={name=>{
          const todayIdx2=(new Date().getDay()+6)%7;
          const planDay2=weeklyPlan?weeklyPlan[todayIdx2]:null;
          if(planDay2&&!(meals[name]||[]).length){
            const populated={...meals,[name]:planDay2[name]||[]};
            setMeals(populated); saveMeals(populated);
          }
          setIsCustomized(true); setSelMeal(name);
        }} onCustomize={()=>{
          if(!isCustomized&&weeklyPlan){
            const todayIdx2=(new Date().getDay()+6)%7;
            const planDay2=weeklyPlan[todayIdx2];
            if(planDay2){
              const populated=mealList.reduce((acc,m)=>{
                acc[m.name]=(meals[m.name]||[]).length>0?meals[m.name]:(planDay2[m.name]||[]);
                return acc;
              },{});
              setMeals(populated); saveMeals(populated);
            }
          }
          setIsCustomized(c=>!c);
        }} onWeightUpdate={()=>setShowWeightModal(true)} onPhotoMeal={name=>setPhotoMealName(name)} pantry={pantry}
        onSwapFood={(mealName,itemIndex,newFood,newQty)=>{
          const todayIdx2=(new Date().getDay()+6)%7;
          const planDay=weeklyPlan?weeklyPlan[todayIdx2]:null;
          const base=mealList.reduce((acc,m)=>{
            acc[m.name]=(meals[m.name]||[]).length?(meals[m.name]||[]):(planDay?.[m.name]||[]);
            return acc;
          },{});
          const current=[...(base[mealName]||[])];
          current[itemIndex]={...current[itemIndex],food:newFood,quantity:newQty};
          const nm={...base,[mealName]:current};
          setMeals(nm); saveMeals(nm);
          if(weeklyPlan){
            const upd=weeklyPlan.map((day,di)=>di===todayIdx2?{...day,[mealName]:current}:day);
            setWeeklyPlan(upd); LS.s("nc2-weeklyplan",upd);
          }
          setIsCustomized(true);
        }}
        onRegenFromPantry={(mealName)=>{
          const jsDay2=new Date().getDay();
          const todayIdx2=(jsDay2+6)%7;
          let mTgt;
          if(weeklyPlan&&weeklyPlan[todayIdx2]&&weeklyPlan[todayIdx2][mealName]){
            const pt=totals(weeklyPlan[todayIdx2][mealName]);
            mTgt={calories:Math.round(pt.cal),protein:Math.round(pt.p),carbs:Math.round(pt.c),fat:Math.round(pt.f)};
          } else {
            mTgt=mealTarget(targets,mealName,profile.numMeals);
          }
          const planItems=(weeklyPlan&&weeklyPlan[todayIdx2]&&weeklyPlan[todayIdx2][mealName])||[];
          const currentItems=(meals[mealName]||[]).length?(meals[mealName]||[]):planItems;
          setPantryEditMeal({mealName,items:currentItems,target:mTgt});
        }}
        onOpenPiano={()=>{setSelMeal(null);setSubScreen("piano");}}
        onOpenImport={()=>{setSelMeal(null);setSubScreen("import");}}
        onOpenDiary={()=>{setSelMeal(null);setSubScreen("diary");}}
        />}
      {tab==="today"&&pantryEditMeal&&<PlanMealDetailScreen
        mealName={pantryEditMeal.mealName}
        dayIdx={(new Date().getDay()+6)%7}
        items={pantryEditMeal.items}
        target={pantryEditMeal.target}
        pantry={pantry}
        lang={lang}
        optimize={optimize}
        filterRealisticItems={filterRealisticItems}
        onBack={()=>setPantryEditMeal(null)}
        onSave={(newItems)=>{
          const mealName=pantryEditMeal.mealName;
          const nm={...meals,[mealName]:newItems};
          setMeals(nm); saveMeals(nm);
          const todayIdx2=(new Date().getDay()+6)%7;
          if(weeklyPlan){
            const updated=weeklyPlan.map((day,di)=>di===todayIdx2?{...day,[mealName]:newItems}:day);
            setWeeklyPlan(updated); LS.s("nc2-weeklyplan",updated);
          }
          setIsCustomized(true); // forza il display a usare meals aggiornato
          setPantryEditMeal(null);
        }}
      />}
      {/* diary now accessible via FAB */}
      {/* import now accessible via FAB */}
      {ratingOverlay}
      {tab==="credenza"&&<CredenzaScreen pantry={pantry} setPantry={setPantry} savePantry={savePantry} lang={lang} user={user} customFoods={customFoods} setCustomFoods={setCustomFoods}/>}
      {/* piano now accessible via FAB or ProfileScreen */}
      {tab==="profile"&&<ProfileScreen profile={profile} setProfile={setProfile} targets={targets} user={user} weightLog={weightLog} newWeight={newWeight} setNewWeight={setNewWeight} onLog={manualLogWeight} onCalc={recalc} onLogout={handleLogout} onReset={handleReset} onManualMacros={manualMacros} onSaveExcluded={pr=>{setProfile(pr);saveProfile(pr);}} onSaveProfile={pr=>{
  setProfile(pr);
  saveProfile(pr);
  if(pr.numMeals!==profile.numMeals){
    const newML=MEAL_CONFIGS[pr.numMeals]||MEAL_CONFIGS[3];
    setMealList(newML);
    LS.s(`nc2-meallist${user?"-"+user.id:""}`,newML);
    if(user&&supabase) DB.saveTargets(user.id,targets,newML);
  }
}} lang={lang} onChangeLang={changeLang} onShowProgress={()=>{setSelMeal(null);setTab("progress");}} onOpenPiano={()=>{setSelMeal(null);setSubScreen("piano");}} onOpenImport={()=>{setSelMeal(null);setSubScreen("import");}} onOpenDietLibrary={()=>setShowDietLibrary(true)}/>}
      <BottomNav tab={tab} setTab={setTab} lang={lang} setSubScreen={setSubScreen}/>
    </div>
  );
}
