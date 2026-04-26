# Multilingual Support (IT/EN) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Italian/English language selection at registration so every UI string, food name, meal name, goal and supplement is displayed in the user's chosen language.

**Architecture:** A `LangContext` React context wraps the entire app and exposes a `t(key)` function. Translations live in two companion files (`translations/it.js`, `translations/en.js`). Bilingual food/meal data is stored in the existing arrays via added `nameEn` fields and separate EN configs; the language is saved in Supabase `profiles.language` and localStorage so it persists across sessions.

**Tech Stack:** React (hooks + context), Supabase (PostgreSQL), localStorage, no external i18n library.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `translations/it.js` | All Italian UI strings keyed by dot-notation key |
| Create | `translations/en.js` | All English UI strings (same keys) |
| Modify | `NutriCalc.jsx` | Add LangContext, bilingual data, replace all hardcoded strings |
| Modify | `supabase_setup.sql` | Document the `language` column migration |

---

## Task 1 — Create Italian translation file

**Files:**
- Create: `translations/it.js`

- [ ] **Step 1: Write the file**

```js
// translations/it.js
const it = {
  // Auth
  'auth.tagline': 'Il tuo piano alimentare',
  'auth.tab.login': 'Accedi',
  'auth.tab.register': 'Registrati',
  'auth.field.name': 'Nome',
  'auth.field.name.placeholder': 'Il tuo nome',
  'auth.field.email': 'Email',
  'auth.field.password': 'Password',
  'auth.btn.login': 'Accedi',
  'auth.btn.register': 'Crea account',
  'auth.btn.loading': '...',
  'auth.error.confirm': 'Controlla la tua email per confermare la registrazione.',
  'auth.error.generic': 'Errore. Riprova.',
  'auth.nosupabase': 'Supabase non configurato. Aggiungi REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON nelle variabili d\'ambiente.',
  'auth.lang.label': 'Lingua',
  'auth.lang.it': '🇮🇹 Italiano',
  'auth.lang.en': '🇬🇧 English',

  // Photo analysis
  'photo.title': '📷 Analizza piatto',
  'photo.upload.desc': 'Scatta una foto o carica un\'immagine del piatto. Claude analizzerà gli alimenti e stimerà le quantità.',
  'photo.upload.btn': '📷 Scatta foto / Carica immagine',
  'photo.upload.note': 'La funzione richiede una chiave API Anthropic configurata sul server.',
  'photo.analyze.btn': 'Analizza questo piatto',
  'photo.analyze.loading': 'Analisi in corso...',
  'photo.change': 'Scegli altra foto',
  'photo.recognized': 'Alimenti riconosciuti',
  'photo.add': 'Aggiungi al pasto',
  'photo.error.server': 'Errore del server',
  'photo.error.none': 'Nessun alimento riconosciuto',
  'photo.error.failed': 'Analisi fallita. Riprova.',

  // Profile
  'profile.tagline': 'Piano alimentare',
  'profile.onboarding.title': 'Parliamo\ndi te.',
  'profile.onboarding.sub': 'Inserisci i tuoi dati per calcolare il fabbisogno calorico e i macro.',
  'profile.title': 'Il tuo profilo',
  'profile.current_plan': 'Piano attuale',
  'profile.field.name': 'Il tuo nome',
  'profile.field.name.placeholder': 'Come ti chiami?',
  'profile.logout': 'Esci',
  'profile.field.gender': 'Sesso biologico',
  'profile.gender.m': '♂ Uomo',
  'profile.gender.f': '♀ Donna',
  'profile.field.age': 'Età',
  'profile.field.age.unit': 'anni',
  'profile.field.weight': 'Peso',
  'profile.field.weight.unit': 'kg',
  'profile.field.height': 'Altezza',
  'profile.field.height.unit': 'cm',
  'profile.field.bodyfat': 'Massa grassa',
  'profile.field.bodyfat.optional': '(facoltativo)',
  'profile.field.bodyfat.placeholder': 'es. 20',
  'profile.lean_mass': 'Massa magra stimata:',
  'profile.field.meals': 'Pasti al giorno',
  'profile.field.activity': 'Attività fisica',
  'profile.field.goal': 'Obiettivo',
  'profile.btn.calc': 'Calcola il mio piano',
  'profile.btn.update': 'Aggiorna piano',

  // Bottom nav
  'nav.today': 'Oggi',
  'nav.progress': 'Progressi',
  'nav.supps': 'Integratori',
  'nav.profile': 'Profilo',

  // Today screen
  'today.summary': 'Riepilogo giornaliero',
  'today.title': 'Oggi',
  'today.macro.prot': 'Prot',
  'today.macro.carbs': 'Carbo',
  'today.macro.fats': 'Grassi',
  'today.circle.goal': 'Obiettivo',
  'today.circle.eaten': 'Consumate',
  'today.circle.remaining': 'Rimanenti',
  'today.macros.title': 'Macro giornalieri',
  'today.macros.prot': 'Proteine',
  'today.macros.carbs': 'Carboidrati',
  'today.macros.fats': 'Grassi',
  'today.meals.title': 'I tuoi {n} pasti',
  'today.food.singular': 'alimento',
  'today.food.plural': 'alimenti',

  // Choose screen
  'choose.target': 'Target di questo pasto',
  'choose.suggested.title': 'Pasto suggerito',
  'choose.suggested.desc': 'Piano bilanciato già pronto. Puoi modificare le quantità dopo.',
  'choose.custom.title': 'Scegli tu gli alimenti',
  'choose.custom.desc': 'Cerca nel database locale o su USDA FoodData Central.',
  'choose.favorites': '⭐ I tuoi preferiti',
  'choose.foods_count': 'alimenti',
  'choose.fav.use': 'Usa',

  // Meal items screen
  'meal.save_fav.title': '⭐ Salva come preferito',
  'meal.save_fav.placeholder': 'Nome del pasto preferito...',
  'meal.save_fav.btn': 'Salva',
  'meal.cancel': 'Annulla',
  'meal.reset': 'Reset',
  'meal.add': '+ Aggiungi',

  // Food selector
  'food.title': 'Aggiungi alimento',
  'food.sub': 'Database locale + USDA FoodData Central',
  'food.search.placeholder': 'Cerca tra milioni di alimenti...',
  'food.source.local': '📋 Locale ({n})',
  'food.source.usda': '🇺🇸 USDA',
  'food.usda.searching': 'Ricerca su USDA...',
  'food.usda.source': 'Fonte: USDA FoodData Central — dominio pubblico',
  'food.usda.error': 'Impossibile connettersi a USDA.',
  'food.usda.use_local': 'Usa database locale',
  'food.empty': 'Nessun risultato.',

  // Progress screen
  'progress.sub': 'Andamento',
  'progress.title': 'Progressi',
  'progress.log': 'Registra il tuo peso oggi',
  'progress.save': 'Salva',
  'progress.last': 'Ultima:',
  'progress.stat.from': 'Da',
  'progress.stat.now': 'Ora',
  'progress.stat.change': 'Variazione',
  'progress.chart.title': 'Ultime {n} rilevazioni',
  'progress.history': 'Storico completo',
  'progress.empty.title': 'Nessun dato ancora',
  'progress.empty.sub': 'Registra il peso ogni settimana per vedere i progressi.',

  // Supplements screen
  'supps.sub': 'Supporto',
  'supps.title': 'Integratori',
  'supps.disclaimer': 'Suggerimenti basati sul tuo obiettivo. Consulta un medico prima di iniziare.',
  'supps.priority': 'Consigliato per il tuo obiettivo',
  'supps.dose': 'Dose',
  'supps.timing': 'Quando',

  // Misc
  'loading': 'Caricamento...',
  'kcal': 'kcal',
};

export default it;
```

- [ ] **Step 2: Verify file created (no test needed for static data — visual check)**

Run: `cat translations/it.js | head -5`
Expected: first lines of the file.

---

## Task 2 — Create English translation file

**Files:**
- Create: `translations/en.js`

- [ ] **Step 1: Write the file**

```js
// translations/en.js
const en = {
  // Auth
  'auth.tagline': 'Your nutrition plan',
  'auth.tab.login': 'Login',
  'auth.tab.register': 'Register',
  'auth.field.name': 'Name',
  'auth.field.name.placeholder': 'Your name',
  'auth.field.email': 'Email',
  'auth.field.password': 'Password',
  'auth.btn.login': 'Login',
  'auth.btn.register': 'Create account',
  'auth.btn.loading': '...',
  'auth.error.confirm': 'Check your email to confirm your registration.',
  'auth.error.generic': 'Error. Try again.',
  'auth.nosupabase': 'Supabase not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON to environment variables.',
  'auth.lang.label': 'Language',
  'auth.lang.it': '🇮🇹 Italiano',
  'auth.lang.en': '🇬🇧 English',

  // Photo analysis
  'photo.title': '📷 Analyze dish',
  'photo.upload.desc': 'Take a photo or upload an image of the dish. Claude will analyze the foods and estimate quantities.',
  'photo.upload.btn': '📷 Take photo / Upload image',
  'photo.upload.note': 'This feature requires an Anthropic API key configured on the server.',
  'photo.analyze.btn': 'Analyze this dish',
  'photo.analyze.loading': 'Analyzing...',
  'photo.change': 'Choose another photo',
  'photo.recognized': 'Recognized foods',
  'photo.add': 'Add to meal',
  'photo.error.server': 'Server error',
  'photo.error.none': 'No food recognized',
  'photo.error.failed': 'Analysis failed. Try again.',

  // Profile
  'profile.tagline': 'Nutrition plan',
  'profile.onboarding.title': 'Tell us\nabout you.',
  'profile.onboarding.sub': 'Enter your data to calculate your caloric needs and macros.',
  'profile.title': 'Your profile',
  'profile.current_plan': 'Current plan',
  'profile.field.name': 'Your name',
  'profile.field.name.placeholder': 'What\'s your name?',
  'profile.logout': 'Sign out',
  'profile.field.gender': 'Biological sex',
  'profile.gender.m': '♂ Male',
  'profile.gender.f': '♀ Female',
  'profile.field.age': 'Age',
  'profile.field.age.unit': 'years',
  'profile.field.weight': 'Weight',
  'profile.field.weight.unit': 'kg',
  'profile.field.height': 'Height',
  'profile.field.height.unit': 'cm',
  'profile.field.bodyfat': 'Body fat',
  'profile.field.bodyfat.optional': '(optional)',
  'profile.field.bodyfat.placeholder': 'e.g. 20',
  'profile.lean_mass': 'Estimated lean mass:',
  'profile.field.meals': 'Meals per day',
  'profile.field.activity': 'Physical activity',
  'profile.field.goal': 'Goal',
  'profile.btn.calc': 'Calculate my plan',
  'profile.btn.update': 'Update plan',

  // Bottom nav
  'nav.today': 'Today',
  'nav.progress': 'Progress',
  'nav.supps': 'Supplements',
  'nav.profile': 'Profile',

  // Today screen
  'today.summary': 'Daily summary',
  'today.title': 'Today',
  'today.macro.prot': 'Prot',
  'today.macro.carbs': 'Carbs',
  'today.macro.fats': 'Fats',
  'today.circle.goal': 'Goal',
  'today.circle.eaten': 'Consumed',
  'today.circle.remaining': 'Remaining',
  'today.macros.title': 'Daily macros',
  'today.macros.prot': 'Proteins',
  'today.macros.carbs': 'Carbohydrates',
  'today.macros.fats': 'Fats',
  'today.meals.title': 'Your {n} meals',
  'today.food.singular': 'food item',
  'today.food.plural': 'food items',

  // Choose screen
  'choose.target': 'Meal target',
  'choose.suggested.title': 'Suggested meal',
  'choose.suggested.desc': 'Balanced meal ready to go. You can adjust quantities after.',
  'choose.custom.title': 'Choose your own foods',
  'choose.custom.desc': 'Search the local database or USDA FoodData Central.',
  'choose.favorites': '⭐ Your favorites',
  'choose.foods_count': 'foods',
  'choose.fav.use': 'Use',

  // Meal items screen
  'meal.save_fav.title': '⭐ Save as favorite',
  'meal.save_fav.placeholder': 'Favorite meal name...',
  'meal.save_fav.btn': 'Save',
  'meal.cancel': 'Cancel',
  'meal.reset': 'Reset',
  'meal.add': '+ Add',

  // Food selector
  'food.title': 'Add food',
  'food.sub': 'Local database + USDA FoodData Central',
  'food.search.placeholder': 'Search millions of foods...',
  'food.source.local': '📋 Local ({n})',
  'food.source.usda': '🇺🇸 USDA',
  'food.usda.searching': 'Searching USDA...',
  'food.usda.source': 'Source: USDA FoodData Central — public domain',
  'food.usda.error': 'Unable to connect to USDA.',
  'food.usda.use_local': 'Use local database',
  'food.empty': 'No results.',

  // Progress screen
  'progress.sub': 'Tracking',
  'progress.title': 'Progress',
  'progress.log': 'Log your weight today',
  'progress.save': 'Save',
  'progress.last': 'Last:',
  'progress.stat.from': 'From',
  'progress.stat.now': 'Now',
  'progress.stat.change': 'Change',
  'progress.chart.title': 'Last {n} measurements',
  'progress.history': 'Full history',
  'progress.empty.title': 'No data yet',
  'progress.empty.sub': 'Log your weight every week to track progress.',

  // Supplements screen
  'supps.sub': 'Support',
  'supps.title': 'Supplements',
  'supps.disclaimer': 'Recommendations based on your goal. Consult a doctor before starting.',
  'supps.priority': 'Recommended for your goal',
  'supps.dose': 'Dose',
  'supps.timing': 'When',

  // Misc
  'loading': 'Loading...',
  'kcal': 'kcal',
};

export default en;
```

- [ ] **Step 2: Verify**

Run: `cat translations/en.js | wc -l`
Expected: ~130 lines, no error.

---

## Task 3 — Supabase migration: add `language` column

**Files:**
- Modify: `supabase_setup.sql` (append the migration comment)

- [ ] **Step 1: Run the following SQL in Supabase Dashboard → SQL Editor**

```sql
-- Aggiunge la lingua al profilo utente (valori: 'it' | 'en', default 'it')
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language text DEFAULT 'it';
```

- [ ] **Step 2: Append the migration note to supabase_setup.sql**

In `supabase_setup.sql`, after the closing comment block, add:

```sql
-- ================================================================
-- MIGRATION: Multilingual support
-- Run once in Supabase SQL Editor:
-- ================================================================
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language text DEFAULT 'it';
```

- [ ] **Step 3: Verify (no automated test — manual)**

In Supabase Table Editor, confirm the `profiles` table now has a `language` column.

---

## Task 4 — Add i18n context + language state to NutriCalc.jsx

**Files:**
- Modify: `NutriCalc.jsx`

- [ ] **Step 1: Add imports at the top of NutriCalc.jsx**

After the existing imports (line 2), add:

```js
import { useState, useEffect, useRef, createContext, useContext } from "react";
import IT from "./translations/it";
import EN from "./translations/en";
```

**Note:** Replace the existing `import { useState, useEffect, useRef } from "react";` with the line above (adds `createContext, useContext`).

- [ ] **Step 2: Add LangContext and useLang hook after the LS storage block (~line 25)**

```js
// ─── I18N ─────────────────────────────────────────────────────────────────────
const TRANSLATIONS = { it: IT, en: EN };
const LangContext = createContext({ lang: 'it', t: k => k });
const useLang = () => useContext(LangContext);
```

- [ ] **Step 3: Add `lang` state to the App component**

In the `App` function, after the existing `useState` declarations (~line 494), add:

```js
const [lang, setLang] = useState(() => LS.load("nc-lang") || "it");
const t = (key, vars = {}) => {
  let str = TRANSLATIONS[lang]?.[key] || key;
  Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{${k}}`, v); });
  return str;
};
```

- [ ] **Step 4: Update `loadUserData` to load language from Supabase profile**

In `loadUserData` (~line 526), after the `setProfile(p)` call, add:

```js
if (sbProfile.language) {
  setLang(sbProfile.language);
  LS.save("nc-lang", sbProfile.language);
}
```

- [ ] **Step 5: Update `saveProfile` to persist language**

In `saveProfile` (~line 547), add `language: lang` to the SB.saveProfile call object:

```js
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
```

- [ ] **Step 6: Wrap the App render output in LangContext.Provider**

Find the final return block in App (~line 678). Wrap the outermost `<div>` (and the `<AuthScreen>` / `<ProfileScreen>` early returns) so that all components receive the context. Add the provider at the top-level return:

```jsx
// Loading screen
if (!ready) return (
  <LangContext.Provider value={{ lang, t }}>
    <div style={{ ...ps, display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
      <style>{GFONTS}</style>
      <div style={{ color:DIM }}>{TRANSLATIONS[lang]?.['loading'] || 'Loading...'}</div>
    </div>
  </LangContext.Provider>
);

// Auth screen
if (supabase && !user) return (
  <LangContext.Provider value={{ lang, t }}>
    <AuthScreen onAuth={loadUserData} onLangChange={(l) => { setLang(l); LS.save("nc-lang", l); }} />
  </LangContext.Provider>
);

// Setup/profile screen
if (setup) return (
  <LangContext.Provider value={{ lang, t }}>
    <ProfileScreen profile={profile} setProfile={setProfile} onCalc={calcTargets} />
  </LangContext.Provider>
);
```

And wrap the main return's `<div>` similarly (replace line 678):

```jsx
return (
  <LangContext.Provider value={{ lang, t }}>
    <div style={{ ...ps, paddingBottom:70 }}>
      ...existing content...
    </div>
  </LangContext.Provider>
);
```

---

## Task 5 — Add bilingual food/meal data

**Files:**
- Modify: `NutriCalc.jsx`

- [ ] **Step 1: Add `nameEn` to every food in the FOODS object**

Replace the `FOODS` constant (lines 61–130) with the bilingual version below. Each object gains a `nameEn` field:

```js
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
    { name:"Broccoli",       nameEn:"Broccoli",      emoji:"🥦", cal:34, p:2.8, c:7,   f:0.4 },
    { name:"Spinaci",        nameEn:"Spinach",       emoji:"🥬", cal:23, p:2.9, c:3.6, f:0.4 },
    { name:"Zucchine",       nameEn:"Zucchini",      emoji:"🥒", cal:17, p:1.2, c:3.1, f:0.3 },
    { name:"Pomodori",       nameEn:"Tomatoes",      emoji:"🍅", cal:18, p:0.9, c:3.9, f:0.2 },
    { name:"Insalata mista", nameEn:"Mixed salad",   emoji:"🥗", cal:15, p:1.3, c:2.9, f:0.2 },
    { name:"Peperoni",       nameEn:"Bell peppers",  emoji:"🫑", cal:31, p:1,   c:6,   f:0.3 },
    { name:"Carote",         nameEn:"Carrots",       emoji:"🥕", cal:41, p:0.9, c:10,  f:0.2 },
    { name:"Asparagi",       nameEn:"Asparagus",     emoji:"🌿", cal:20, p:2.2, c:3.9, f:0.1 },
    { name:"Funghi",         nameEn:"Mushrooms",     emoji:"🍄", cal:22, p:3.1, c:3.3, f:0.3 },
  ],
  "Grassi": [
    { name:"Olio d'oliva",      nameEn:"Olive oil",      emoji:"🫒", cal:884, p:0,  c:0,  f:100 },
    { name:"Avocado",           nameEn:"Avocado",        emoji:"🥑", cal:160, p:2,  c:9,  f:15  },
    { name:"Mandorle",          nameEn:"Almonds",        emoji:"🌰", cal:579, p:21, c:22, f:50  },
    { name:"Noci",              nameEn:"Walnuts",        emoji:"🥜", cal:654, p:15, c:14, f:65  },
    { name:"Burro di arachidi", nameEn:"Peanut butter",  emoji:"🥜", cal:588, p:25, c:20, f:50  },
    { name:"Semi di chia",      nameEn:"Chia seeds",     emoji:"🌱", cal:486, p:17, c:42, f:31  },
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
```

- [ ] **Step 2: Add category name translations and food helpers after the FOODS block**

Replace the existing `const ALL_FOODS = ...` and `const findFood = ...` lines with:

```js
const CATEGORY_NAMES_EN = {
  "Proteine": "Proteins",
  "Carboidrati": "Carbohydrates",
  "Verdure": "Vegetables",
  "Grassi": "Fats",
  "Bevande": "Beverages",
};

// Returns FOODS with display names translated for the given language.
// Structure: { [categoryName]: [{ ...food, name: displayName }] }
function getFoods(lang) {
  if (lang === 'it') return FOODS;
  const result = {};
  for (const [cat, items] of Object.entries(FOODS)) {
    const catKey = CATEGORY_NAMES_EN[cat] || cat;
    result[catKey] = items.map(f => ({ ...f, name: f.nameEn || f.name }));
  }
  return result;
}

const ALL_FOODS_IT = Object.values(FOODS).flat();
// findFood searches by display name in current-language foods.
// Usage: findFood(name, lang)
function findFood(name, lang = 'it') {
  const all = Object.values(getFoods(lang)).flat();
  return all.find(f => f.name === name);
}
```

- [ ] **Step 3: Add bilingual MEAL_CONFIGS**

Replace `MEAL_CONFIGS` (lines 178–184) with:

```js
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
```

- [ ] **Step 4: Add bilingual SUGGESTED**

Replace `const SUGGESTED = { ... }` (lines 185–193) with:

```js
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
```

- [ ] **Step 5: Add bilingual GOALS**

Replace `const GOALS = [...]` (lines 194–198) with:

```js
const GOALS = {
  it: [
    { label:"Dimagrire", icon:"📉", value:"lose",     calAdj:-500, protein:2.2, fat:0.8, color:R },
    { label:"Mantenere", icon:"⚖️", value:"maintain", calAdj:0,    protein:1.8, fat:1.0, color:B },
    { label:"Massa",     icon:"📈", value:"gain",     calAdj:300,  protein:2.0, fat:1.0, color:G },
  ],
  en: [
    { label:"Lose weight",   icon:"📉", value:"lose",     calAdj:-500, protein:2.2, fat:0.8, color:R },
    { label:"Maintain",      icon:"⚖️", value:"maintain", calAdj:0,    protein:1.8, fat:1.0, color:B },
    { label:"Gain muscle",   icon:"📈", value:"gain",     calAdj:300,  protein:2.0, fat:1.0, color:G },
  ],
};
```

- [ ] **Step 6: Add bilingual ACTIVITY_LEVELS**

Replace `const ACTIVITY_LEVELS = [...]` (lines 199–205) with:

```js
const ACTIVITY_LEVELS = {
  it: [
    { label:"Sedentario",           desc:"Poco o nessun esercizio",           value:1.2   },
    { label:"Leggermente attivo",   desc:"1-3 giorni a settimana",            value:1.375 },
    { label:"Moderatamente attivo", desc:"3-5 giorni a settimana",            value:1.55  },
    { label:"Molto attivo",         desc:"6-7 giorni a settimana",            value:1.725 },
    { label:"Atleta",               desc:"Allenamenti doppi o lavoro fisico", value:1.9   },
  ],
  en: [
    { label:"Sedentary",           desc:"Little or no exercise",        value:1.2   },
    { label:"Lightly active",      desc:"1-3 days per week",            value:1.375 },
    { label:"Moderately active",   desc:"3-5 days per week",            value:1.55  },
    { label:"Very active",         desc:"6-7 days per week",            value:1.725 },
    { label:"Athlete",             desc:"Double training or hard work", value:1.9   },
  ],
};
```

- [ ] **Step 7: Add bilingual SUPPLEMENTS**

Replace `const SUPPLEMENTS = [...]` (lines 170–175) with:

```js
const SUPPLEMENTS = {
  it: [
    { name:"Omega-3",    icon:"🐟", color:B,        dose:"2-3g EPA+DHA al giorno",  timing:"Con i pasti principali",       benefits:["Riduce l'infiammazione","Supporta la salute cardiovascolare","Migliora il recupero muscolare"], goals:["lose","maintain","gain"], priority:["lose","maintain"], note:"Scegli prodotti con almeno 60% di EPA+DHA sul totale." },
    { name:"Magnesio",   icon:"⚡", color:"#a78bfa", dose:"300-400mg al giorno",    timing:"La sera prima di dormire",     benefits:["Migliora la qualità del sonno","Riduce stanchezza e crampi","Supporta il sistema nervoso"], goals:["lose","maintain","gain"], priority:["lose"], note:"Preferisci bisglicinato o citrato rispetto all'ossido." },
    { name:"Vitamina D", icon:"☀️", color:Y,        dose:"2000-4000 UI al giorno",  timing:"Al mattino con un pasto grasso", benefits:["Supporta il sistema immunitario","Favorisce la salute ossea","Regola l'umore"], goals:["lose","maintain","gain"], priority:["maintain"], note:"In Italia la carenza è diffusa. Fai un'analisi del sangue per verificare i tuoi livelli." },
    { name:"Creatina",   icon:"💪", color:G,        dose:"3-5g al giorno",          timing:"Qualsiasi ora, con costanza",  benefits:["Aumenta forza e potenza","Accelera la sintesi proteica","Migliora le prestazioni ad alta intensità"], goals:["gain","maintain"], priority:["gain"], note:"Uno degli integratori più studiati e sicuri. Non serve il carico iniziale." },
  ],
  en: [
    { name:"Omega-3",    icon:"🐟", color:B,        dose:"2-3g EPA+DHA per day",  timing:"With main meals",                  benefits:["Reduces inflammation","Supports cardiovascular health","Improves muscle recovery"], goals:["lose","maintain","gain"], priority:["lose","maintain"], note:"Choose products with at least 60% EPA+DHA of total." },
    { name:"Magnesium",  icon:"⚡", color:"#a78bfa", dose:"300-400mg per day",    timing:"In the evening before sleeping",    benefits:["Improves sleep quality","Reduces fatigue and cramps","Supports the nervous system"], goals:["lose","maintain","gain"], priority:["lose"], note:"Prefer bisglycinate or citrate over oxide." },
    { name:"Vitamin D",  icon:"☀️", color:Y,        dose:"2000-4000 IU per day",  timing:"In the morning with a fatty meal", benefits:["Supports the immune system","Promotes bone health","Regulates mood"], goals:["lose","maintain","gain"], priority:["maintain"], note:"Deficiency is widespread. Get a blood test to check your levels." },
    { name:"Creatine",   icon:"💪", color:G,        dose:"3-5g per day",          timing:"Any time, consistently",           benefits:["Increases strength and power","Accelerates protein synthesis","Improves high-intensity performance"], goals:["gain","maintain"], priority:["gain"], note:"One of the most studied and safe supplements. No loading phase needed." },
  ],
};
```

---

## Task 6 — Update App logic to use bilingual data

**Files:**
- Modify: `NutriCalc.jsx` — App function

- [ ] **Step 1: Update `calcTargets` to use lang-specific data**

In `calcTargets` (~line 554), replace:

```js
const gd  = GOALS.find(g=>g.value===profile.goal);
```
with:
```js
const gd  = GOALS[lang].find(g=>g.value===profile.goal);
```

And replace:
```js
const ml = MEAL_CONFIGS[profile.numMeals];
```
with:
```js
const ml = MEAL_CONFIGS[lang][profile.numMeals];
```

- [ ] **Step 2: Update `loadUserData` to restore mealList with current lang**

In `loadUserData` (~line 536), the stored mealList was saved with the user's language, so loading is fine as-is. But `loadFromLocal` also needs updating:

In `loadFromLocal` (~line 521), the loaded `ml` may already be in the right language (since it was saved with the user's lang). No change needed — the saved data is already correct.

- [ ] **Step 3: Update `applySuggested` to use lang-specific SUGGESTED**

Replace (~line 582):
```js
const applySuggested = (mealName) => {
  const names = SUGGESTED[mealName]||SUGGESTED["Pranzo"];
  const foods = names.map(n=>findFood(n)).filter(Boolean);
  updateMeals({ ...meals, [mealName]: buildItems(foods) });
  setSubscreen("items");
};
```
with:
```js
const applySuggested = (mealName) => {
  const langSuggested = SUGGESTED[lang];
  const fallback = lang === 'en' ? "Lunch" : "Pranzo";
  const names = langSuggested[mealName] || langSuggested[fallback];
  const foods = names.map(n => findFood(n, lang)).filter(Boolean);
  updateMeals({ ...meals, [mealName]: buildItems(foods) });
  setSubscreen("items");
};
```

- [ ] **Step 4: Update `applyFavorite` to use lang-aware findFood**

Replace (~line 589):
```js
const applyFavorite = (fav) => {
  const items = fav.items.map(({ foodName, quantity }) => { const food=findFood(foodName); return food?{ food, quantity }:null; }).filter(Boolean);
  updateMeals({ ...meals, [selMeal]: items }); setSubscreen("items");
};
```
with:
```js
const applyFavorite = (fav) => {
  const items = fav.items.map(({ foodName, quantity }) => {
    const food = findFood(foodName, lang);
    return food ? { food, quantity } : null;
  }).filter(Boolean);
  updateMeals({ ...meals, [selMeal]: items });
  setSubscreen("items");
};
```

---

## Task 7 — Add language selector to AuthScreen

**Files:**
- Modify: `NutriCalc.jsx` — AuthScreen component

- [ ] **Step 1: Update AuthScreen signature and add lang state**

Replace the AuthScreen function signature and state (~line 293):

```js
function AuthScreen({ onAuth, onLangChange }) {
  const { t } = useLang();
  const [mode,    setMode]    = useState("login");
  const [email,   setEmail]   = useState("");
  const [password,setPassword]= useState("");
  const [name,    setName]    = useState("");
  const [lang,    setLang]    = useState(() => LS.load("nc-lang") || "it");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const changeLang = (l) => { setLang(l); onLangChange(l); };
```

- [ ] **Step 2: Update handleSubmit to include language in signup metadata**

In `handleSubmit`, update the signUp call:
```js
const { data, error: e } = await supabase.auth.signUp({
  email, password,
  options: { data: { name, language: lang } }
});
if (e) throw e;
if (data.user) onAuth(data.user);
else setError(t('auth.error.confirm'));
```

And the error catch:
```js
setError(e.message || t('auth.error.generic'));
```

- [ ] **Step 3: Replace all hardcoded strings in AuthScreen JSX**

Apply these replacements throughout the AuthScreen return JSX:

| Old string | New expression |
|-----------|----------------|
| `"Il tuo piano alimentare"` | `{t('auth.tagline')}` |
| `"Accedi"` (tab) | `{t('auth.tab.login')}` |
| `"Registrati"` (tab) | `{t('auth.tab.register')}` |
| `"Nome"` | `{t('auth.field.name')}` |
| `"Il tuo nome"` (placeholder) | `{t('auth.field.name.placeholder')}` |
| `"Email"` | `{t('auth.field.email')}` |
| `"Password"` | `{t('auth.field.password')}` |
| `loading ? "..." : mode==="login" ? "Accedi" : "Crea account"` | `loading ? t('auth.btn.loading') : mode==="login" ? t('auth.btn.login') : t('auth.btn.register')` |
| Supabase not configured message | `{t('auth.nosupabase')}` |

- [ ] **Step 4: Add language selector UI in registration form**

Inside the `{mode==="register" && (...)}` block, after the name field, add the language toggle:

```jsx
{mode==="register" && (
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
)}
```

---

## Task 8 — Replace hardcoded strings in all screen components

**Files:**
- Modify: `NutriCalc.jsx` — all screen components

All sub-components get `const { t, lang } = useLang();` as their first line.

### 8a — BottomNav

- [ ] **Step 1: Add useLang and replace tabs array**

```js
function BottomNav({ tab, setTab }) {
  const { t } = useLang();
  const tabs = [
    ["today",    "🏠", t('nav.today')],
    ["progress", "📊", t('nav.progress')],
    ["supps",    "💊", t('nav.supps')],
    ["profile",  "👤", t('nav.profile')],
  ];
  // ...rest unchanged
```

### 8b — ProfileScreen

- [ ] **Step 1: Add useLang at top of ProfileScreen**

```js
function ProfileScreen({ profile, setProfile, onCalc, editMode, targets, user, onLogout }) {
  const { t, lang } = useLang();
  const p = (k, v) => setProfile(prev => ({ ...prev, [k]: v }));
```

- [ ] **Step 2: Replace hardcoded strings**

| Location | Old | New |
|----------|-----|-----|
| Tagline under logo | `"Piano alimentare"` | `{t('profile.tagline')}` |
| Logout button | `"Esci"` | `{t('profile.logout')}` |
| Onboarding title | `"Parliamo\ndi te."` | Replace with two `<br/>` spans using `t('profile.onboarding.title')` split by `\n` |
| Onboarding subtitle | `"Inserisci i tuoi dati..."` | `{t('profile.onboarding.sub')}` |
| "Il tuo profilo" | → | `{t('profile.title')}` |
| "Piano attuale" | → | `{t('profile.current_plan')}` |
| "Il tuo nome" label | → | `{t('profile.field.name')}` |
| "Come ti chiami?" placeholder | → | `{t('profile.field.name.placeholder')}` |
| "Sesso biologico" | → | `{t('profile.field.gender')}` |
| "♂ Uomo" | → | `{t('profile.gender.m')}` |
| "♀ Donna" | → | `{t('profile.gender.f')}` |
| age/weight/height labels and units | Use `t('profile.field.age')` etc. | See below |
| "Massa grassa" | → | `{t('profile.field.bodyfat')}` |
| "(facoltativo)" | → | `{t('profile.field.bodyfat.optional')}` |
| "es. 20" | → | `{t('profile.field.bodyfat.placeholder')}` |
| "Massa magra stimata:" | → | `{t('profile.lean_mass')}` |
| "Pasti al giorno" | → | `{t('profile.field.meals')}` |
| "Attività fisica" | → | `{t('profile.field.activity')}` |
| "Obiettivo" | → | `{t('profile.field.goal')}` |
| Calc/Update button | → | `editMode ? t('profile.btn.update') : t('profile.btn.calc')` |

Replace the `[["age","Età","anni"],["weight","Peso","kg"],["height","Altezza","cm"]]` array with:

```js
[
  ["age",    t('profile.field.age'),    t('profile.field.age.unit')],
  ["weight", t('profile.field.weight'), t('profile.field.weight.unit')],
  ["height", t('profile.field.height'), t('profile.field.height.unit')],
]
```

Replace `ACTIVITY_LEVELS.map(...)` with `ACTIVITY_LEVELS[lang].map(...)`.
Replace `GOALS.map(...)` with `GOALS[lang].map(...)`.

Also update the `profile.name || user?.email || "Piano alimentare"` line:
```js
profile.name || user?.email || t('profile.tagline')
```

### 8c — TodayScreen

- [ ] **Step 1: Add useLang and replace strings**

```js
function TodayScreen({ targets, mealList, meals, allTot, numMeals, onMealClick }) {
  const { t } = useLang();
```

Replacements:

| Old | New |
|-----|-----|
| `"Riepilogo giornaliero"` | `{t('today.summary')}` |
| `"Oggi"` (title) | `{t('today.title')}` |
| `["Prot", ...], ["Carbo",...], ["Grassi",...]` | Use `t('today.macro.prot')`, `t('today.macro.carbs')`, `t('today.macro.fats')` |
| `["Obiettivo", ...], ["Consumate",...], ["Rimanenti",...]` | Use `t('today.circle.goal')`, `t('today.circle.eaten')`, `t('today.circle.remaining')` |
| `"Macro giornalieri"` | `{t('today.macros.title')}` |
| `<MacroBar label="Proteine"` | `label={t('today.macros.prot')}` |
| `<MacroBar label="Carboidrati"` | `label={t('today.macros.carbs')}` |
| `<MacroBar label="Grassi"` | `label={t('today.macros.fats')}` |
| `"I tuoi {numMeals} pasti"` | `{t('today.meals.title', { n: numMeals })}` |
| `` `${cnt} aliment${cnt===1?"o":"i"}` `` | `` `${cnt} ${cnt===1 ? t('today.food.singular') : t('today.food.plural')}` `` |

### 8d — ChooseScreen

- [ ] **Step 1: Add useLang and replace strings**

```js
function ChooseScreen({ mealName, mealData, target, favorites, onBack, onSuggested, onCustom, onFavorite, onDeleteFav }) {
  const { t, lang } = useLang();
  const langSuggested = SUGGESTED[lang];
  const fallback = lang === 'en' ? "Lunch" : "Pranzo";
  const sugNames = langSuggested[mealName] || langSuggested[fallback];
```

Replacements:

| Old | New |
|-----|-----|
| `"Target di questo pasto"` | `{t('choose.target')}` |
| `"Pasto suggerito"` | `{t('choose.suggested.title')}` |
| `"Piano bilanciato già pronto..."` | `{t('choose.suggested.desc')}` |
| `"Scegli tu gli alimenti"` | `{t('choose.custom.title')}` |
| `"Cerca nel database locale..."` | `{t('choose.custom.desc')}` |
| `"⭐ I tuoi preferiti"` | `{t('choose.favorites')}` |
| `` `${fav.items.length} alimenti` `` | `` `${fav.items.length} ${t('choose.foods_count')}` `` |
| `"Usa"` | `{t('choose.fav.use')}` |

Also update food suggestions display:
```js
{sugNames.map(n => { const f = findFood(n, lang); return f ? <span key={n} ...>{f.emoji} {n}</span> : null; })}
```

### 8e — MealItemsScreen

- [ ] **Step 1: Add useLang and replace strings**

```js
function MealItemsScreen({ ... }) {
  const { t } = useLang();
```

Replacements:

| Old | New |
|-----|-----|
| `"⭐ Salva come preferito"` | `{t('meal.save_fav.title')}` |
| `"Nome del pasto preferito..."` | `{t('meal.save_fav.placeholder')}` |
| `"Salva"` | `{t('meal.save_fav.btn')}` |
| `"Annulla"` | `{t('meal.cancel')}` |
| `"Reset"` | `{t('meal.reset')}` |
| `"+ Aggiungi"` | `{t('meal.add')}` |

### 8f — FoodSelectorScreen

- [ ] **Step 1: Add useLang and replace strings**

```js
function FoodSelectorScreen({ mealTot, target, onBack, onAdd }) {
  const { t, lang } = useLang();
  const [cat, setCat] = useState(lang === 'en' ? "Proteins" : "Proteine");
  // ...
  const currentFoods = getFoods(lang);
  const cats = Object.keys(currentFoods);
  const ALL_FOODS_LANG = Object.values(currentFoods).flat();
```

Update the search filter and category selection:
```js
const localFiltered = search
  ? ALL_FOODS_LANG.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
  : (currentFoods[cat] || []);
```

Replacements:

| Old | New |
|-----|-----|
| `"Aggiungi alimento"` | `{t('food.title')}` |
| `"Database locale + USDA FoodData Central"` | `{t('food.sub')}` |
| `"Cerca tra milioni di alimenti..."` | `{t('food.search.placeholder')}` |
| `` `📋 Locale (${localFiltered.length})` `` | `` {t('food.source.local', { n: localFiltered.length })} `` |
| `"🇺🇸 USDA..."` | `{t('food.source.usda') + (loading ? " …" : usdaResults.length ? ` (${usdaResults.length})` : "")}` |
| `"Ricerca su USDA..."` | `{t('food.usda.searching')}` |
| `"Fonte: USDA FoodData Central — dominio pubblico"` | `{t('food.usda.source')}` |
| `"Impossibile connettersi a USDA."` | `{t('food.usda.error')}` |
| `"Usa database locale"` | `{t('food.usda.use_local')}` |
| `"Nessun risultato."` | `{t('food.empty')}` |

### 8g — ProgressScreen

- [ ] **Step 1: Add useLang and replace strings**

```js
function ProgressScreen({ weightLog, profile, newWeight, setNewWeight, onLog }) {
  const { t } = useLang();
```

Replacements:

| Old | New |
|-----|-----|
| `"Andamento"` | `{t('progress.sub')}` |
| `"Progressi"` | `{t('progress.title')}` |
| `"Registra il tuo peso oggi"` | (pass to `<Lbl>`) `{t('progress.log')}` |
| `"Salva"` | `{t('progress.save')}` |
| `"Ultima:"` | `{t('progress.last')}` |
| `["Da",...], ["Ora",...], ["Variazione",...]` | `[t('progress.stat.from'),...], [t('progress.stat.now'),...], [t('progress.stat.change'),...]` |
| `` `Ultime ${last10.length} rilevazioni` `` | `{t('progress.chart.title', { n: last10.length })}` |
| `"Storico completo"` | `{t('progress.history')}` |
| `"Nessun dato ancora"` | `{t('progress.empty.title')}` |
| `"Registra il peso ogni settimana..."` | `{t('progress.empty.sub')}` |

### 8h — SupplementsScreen

- [ ] **Step 1: Add useLang and replace strings**

```js
function SupplementsScreen({ goal }) {
  const { t, lang } = useLang();
  const supps = SUPPLEMENTS[lang].filter(s => s.goals.includes(goal));
```

Replacements:

| Old | New |
|-----|-----|
| `"Supporto"` | `{t('supps.sub')}` |
| `"Integratori"` | `{t('supps.title')}` |
| `"Suggerimenti basati..."` | `{t('supps.disclaimer')}` |
| `"Consigliato per il tuo obiettivo"` | `{t('supps.priority')}` |
| `"Dose"` | `{t('supps.dose')}` |
| `"Quando"` | `{t('supps.timing')}` |

Replace `SUPPLEMENTS.filter(...)` with `supps.map(sup => ...)`.

### 8i — PhotoAnalysisModal

- [ ] **Step 1: Add useLang and replace strings**

```js
function PhotoAnalysisModal({ onClose, onAddFoods }) {
  const { t } = useLang();
```

Also update error messages inside `analyze()`:
```js
if (!res.ok) throw new Error(t('photo.error.server'));
if (!data.foods?.length) throw new Error(t('photo.error.none'));
// catch:
setError(e.message || t('photo.error.failed'));
```

Replacements:

| Old | New |
|-----|-----|
| `"📷 Analizza piatto"` | `{t('photo.title')}` |
| `"Scatta una foto o carica..."` | `{t('photo.upload.desc')}` |
| `"📷 Scatta foto / Carica immagine"` | `{t('photo.upload.btn')}` |
| `"La funzione richiede..."` | `{t('photo.upload.note')}` |
| `loading ? "Analisi in corso..." : "Analizza questo piatto"` | `loading ? t('photo.analyze.loading') : t('photo.analyze.btn')` |
| `"Scegli altra foto"` | `{t('photo.change')}` |
| `"Alimenti riconosciuti"` | `{t('photo.recognized')}` |
| `"Aggiungi al pasto"` | `{t('photo.add')}` |

---

## Task 9 — Final wiring: pass lang to SB.saveProfile

**Files:**
- Modify: `NutriCalc.jsx` — SB data layer

- [ ] **Step 1: Update SB.saveProfile to accept and store language**

The `SB.saveProfile` function already passes whatever object it receives. No change needed there — the caller (`saveProfile` in App) already adds `language: lang` as updated in Task 4 Step 5.

- [ ] **Step 2: Update SB.loadProfile to return language**

In `loadUserData`, after loading the profile, extract language:
```js
const p = {
  name: sbProfile.name || u.user_metadata?.name || "",
  gender: sbProfile.gender || "m",
  age: sbProfile.age || "",
  weight: sbProfile.weight || "",
  height: sbProfile.height || "",
  activity: sbProfile.activity || 1.55,
  goal: sbProfile.goal || "maintain",
  numMeals: sbProfile.num_meals || 4,
  bodyFat: sbProfile.body_fat || "",
};
setProfile(p);
if (sbProfile.language) {
  setLang(sbProfile.language);
  LS.save("nc-lang", sbProfile.language);
}
```

---

## Task 10 — Smoke test

- [ ] **Step 1: Start dev server**

```bash
npm start
# or
npm run dev
```

- [ ] **Step 2: Register as English user**

1. Open the app in browser
2. Click "Registrati"
3. Select "🇬🇧 English"
4. Fill name, email, password → click "Create account"
5. Verify: all UI labels are in English (nav: Today, Progress, Supplements, Profile)

- [ ] **Step 3: Complete onboarding in English**

1. Fill profile (Goal shows "Lose weight / Maintain / Gain muscle")
2. Activity shows "Sedentary / Lightly active / ..."
3. Click "Calculate my plan"
4. Verify: Today screen shows "Daily summary", "Your 4 meals", "Breakfast / Lunch / ..."

- [ ] **Step 4: Test suggested meal in English**

1. Click "Breakfast"
2. Verify "Suggested meal" option shows English food names: "Oats", "Greek yogurt 0%", etc.
3. Apply it → verify food names in meal items are in English

- [ ] **Step 5: Verify Italian still works**

1. Log out
2. Register new Italian user (leave language as Italiano)
3. Verify all labels are in Italian throughout

- [ ] **Step 6: Commit**

```bash
git add NutriCalc.jsx translations/it.js translations/en.js supabase_setup.sql
git commit -m "feat: add Italian/English language selection at registration

Language is chosen during registration, saved in Supabase profiles.language
and localStorage. All UI strings, food names, meal names, goals, activity
levels and supplements are displayed in the user's chosen language."
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] User chooses language at registration ← Task 7
- [x] App shows everything in chosen language (UI labels) ← Tasks 8a–8i
- [x] Food names translated ← Task 5 Steps 1–2
- [x] Meal names translated ← Task 5 Step 3
- [x] Diet plan names (goals) translated ← Task 5 Step 5
- [x] Supplement names/descriptions translated ← Task 5 Step 7
- [x] Language persists across sessions ← Tasks 4, 9
- [x] Italian unaffected ← existing behavior preserved

**Placeholder scan:** No TBD/TODO in any code block. All code is complete.

**Type consistency:** `findFood(name, lang)` signature consistent across Tasks 5, 6, 8. `GOALS[lang]`, `ACTIVITY_LEVELS[lang]`, `SUPPLEMENTS[lang]`, `MEAL_CONFIGS[lang]`, `SUGGESTED[lang]` pattern consistent throughout. `useLang()` returns `{ t, lang }` used consistently.
