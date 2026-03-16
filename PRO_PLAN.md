# Aurion Terminal — Free vs Pro Firewall Plan

---

## CURRENT STATE (Everything is Free)

| Feature | How It Works Today |
|---------|-------------------|
| Dashboard + 21-Factor RADAR | Open, no limits |
| 11 Tickers (18s refresh) | Open, no limits |
| 15 News Sources + Sentiment | Open, no limits |
| 8 Sectors + Sparklines + Drill-down | Open, no limits |
| Market Stress Index | Open, no limits |
| AI Reports (Stock, Macro, News, Governance) | BYO API key (user pays their own Gemini/OpenAI bill) |
| Stock Search (5000+ from Dhan CSV) | Open, no limits |
| TradingView Charts | Open, no limits |
| Custom Stock Tracking | Open, no limits |
| Drag & Drop RADAR | Open, no limits |

**Problem:** Everything is free. There's no reason to ever pay. And users bring their own AI key, so even AI costs nothing to you.

---

## THE GOLDEN RULE OF FREEMIUM

> **Free tier must be useful enough that people KEEP coming back.**
> **But limited enough that power users feel the friction daily.**

The worst mistake: Locking features that users haven't tried yet.
Nobody pays to unlock something they've never experienced.

**The right move:** Let them USE everything first. Then limit the FREQUENCY and DEPTH.

---

## RECOMMENDED FREE vs PRO SPLIT

### FREE TIER — "The Hook"

| Feature | Free Limit | Why This Limit |
|---------|-----------|----------------|
| Dashboard + RADAR | Full access, but **60s refresh** (not 18s) | They see data, but it's slower. During volatile days, 60s feels like eternity. |
| Tickers | All 11 visible, but **no live blink animation** | Dashboard looks "dead" compared to Pro. Visual FOMO. |
| News Feed | **Latest 15 articles only** (not 80) | They get a taste, but miss the full picture. |
| AI Reports | **3 reports per day** (then "Upgrade for unlimited") | Let them experience the magic, then cap it. |
| AI News Summary | **Locked** — shows blurred preview + "PRO" badge | They see the feature EXISTS but can't use it. Curiosity. |
| Sectors | **4 sectors visible** (IT, Bank, Pharma, Energy). Other 4 show lock icon. | They see other sectors exist but can't drill down. |
| Sector Drill-down | **Free for visible sectors**, but **no constituent stock prices** — just names | They see the stocks but not the data. |
| Stock Search | **NIFTY 50 + SENSEX stocks only** (not full 5000+) | Good enough for beginners. Power users need mid/small caps. |
| Stress Index | Visible, but **no spike alerts** and **no history chart** | They see the number but miss the story. |
| TradingView Charts | Full access | This is free anyway (TradingView hosts it). Don't gate someone else's free product. |
| Custom Stock Tracking | **Max 5 stocks** | Enough to try it. Not enough for a real watchlist. |
| Export/Share | **None** | Can't screenshot-share AI reports easily. |

### PRO TIER — "The Power" (₹299/month or ₹2,499/year)

| Feature | Pro Access |
|---------|-----------|
| Dashboard refresh | **18s real-time** (3x faster than free) |
| Live blink animations | **Full Bloomberg-style blink on all live tickers** |
| News Feed | **All 80 articles**, sorted by recency and sentiment |
| AI Reports | **Unlimited** per day, all tickers |
| AI News Summary | **Unlocked** — full AI extraction on any headline |
| AI Macro Intel | **Unlocked** — RADAR tile deep-dive with AI |
| All 8 Sectors | **Full access** + drill-down with live prices + weights |
| Stock Search | **Full 5000+ stocks** from Dhan database |
| Stress Index | **Spike alerts** + **rolling history chart** |
| Custom Stock Tracking | **Unlimited stocks** |
| Daily AI Market Brief | **8:30 AM email** — auto-generated morning summary |
| Telegram Alerts | **Push alerts** when stress > 60 or NIFTY drops > 1.5% |
| Export AI Reports | **PDF download** + **share as image** |
| Priority Support | Direct WhatsApp/Telegram line to you |

---

## IMPLEMENTATION PLAN — 3 PHASES

### PHASE 1: Client-Side Gating (Ship in 2-3 days)
**No backend auth needed. No payment integration yet.**

Use `localStorage` to track usage and gate features.

```
HOW IT WORKS:
1. On first visit → set localStorage: { tier: 'free', ai_count: 0, date: '2026-03-16' }
2. Every AI report call → increment ai_count
3. If ai_count >= 3 and tier === 'free' → show upgrade modal instead of report
4. Sector clicks on locked sectors → show upgrade modal
5. News feed → slice to 15 items for free users
6. Refresh interval → 60000ms for free, 18000ms for pro
```

**"But users can just clear localStorage!"**
Yes. And that's fine. Phase 1 is about:
- Testing which limits actually bother users (data collection)
- Building the upgrade UI/UX
- Creating the "Pro" brand in users' minds
- Getting feedback: "I'd pay if you also added X"

The 5% of users who clear localStorage are power users who'll eventually pay. The 95% who don't will hit the wall and either leave (they weren't going to pay anyway) or upgrade.

**Files to modify:**
- `static/js/ai-engine.js` — Add daily AI report counter check
- `static/js/init.js` — Set refresh interval based on tier
- `static/js/market.js` — Disable blink animation for free tier
- `templates/index.html` — Add lock overlays on gated sectors, upgrade modal
- `main.py` — Add `/api/news` param to limit results (`?limit=15`)

### PHASE 2: Auth + Payment (Week 2-3)
**Add Supabase auth + Razorpay payment.**

```
STACK:
- Auth: Supabase (free tier = 50k MAUs, more than enough)
- Payment: Razorpay (Indian cards, UPI, net banking)
- Tier storage: Supabase database (user_id → tier → expiry_date)
```

**Flow:**
1. User clicks "Upgrade to Pro" → Razorpay checkout opens
2. ₹299 payment → Razorpay webhook hits your backend
3. Backend sets user tier = 'pro' in Supabase
4. Frontend reads tier from Supabase on load → unlocks features
5. Tier check on both client AND server (can't bypass with localStorage)

**New files:**
- `api/auth.py` — Supabase auth endpoints (signup, login, verify)
- `api/payment.py` — Razorpay order creation + webhook handler
- `static/js/auth.js` — Login/signup modal, session management

### PHASE 3: Server-Side AI (Month 2)
**Stop making users bring their own API key. YOU provide the AI.**

```
CURRENT:  User → brings own Gemini key → calls Gemini API directly from browser
PHASE 3:  User → hits YOUR /api/ai/report endpoint → YOUR server calls Gemini → returns result
```

**Why this matters:**
- Free users get 3 AI reports/day from YOUR key (cost: ~₹2/user/day)
- Pro users get unlimited (cost covered by ₹299 subscription)
- You control the experience — no "bring your API key" friction
- You can cache popular reports (RELIANCE, TCS, INFY) — serve instantly
- You can add your own branding/disclaimer to AI output

**Cost math:**
- Gemini 2.5 Flash: ~$0.002 per report
- 100 free users × 3 reports/day = 300 calls = $0.60/day = ₹50/day
- 20 Pro users × 10 reports/day = 200 calls = $0.40/day = ₹33/day
- Total AI cost: ~₹2,500/month
- Pro revenue: 20 × ₹299 = ₹5,980/month
- Net profit: ₹3,480/month (and growing)

---

## THE UPGRADE MODAL — DESIGN

This is the most important UI element in the entire Pro strategy.
It appears when a free user hits any limit.

```
┌─────────────────────────────────────────────────┐
│                                                 │
│        ⚡ UNLOCK AURION PRO                     │
│                                                 │
│   You've used 3/3 AI reports today.             │
│   Pro members get unlimited reports,            │
│   8 sector deep-dives, 5000+ stock search,     │
│   18s real-time refresh, and daily AI briefs.   │
│                                                 │
│   ┌─────────────────┐ ┌──────────────────────┐  │
│   │   ₹299/month    │ │  ₹2,499/year (SAVE   │  │
│   │                 │ │       30%)            │  │
│   │  [Upgrade Now]  │ │  [Best Value]         │  │
│   └─────────────────┘ └──────────────────────┘  │
│                                                 │
│   🔒 Cancel anytime. UPI / Cards / Net Banking. │
│                                                 │
│   "I analyzed 47 stocks last week using Aurion  │
│    Pro. The macro radar alone is worth it."     │
│                — Founding Tester                │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Trigger points (when to show this modal):**
1. 4th AI report attempt in a day
2. Click on locked sector (Auto, FMCG, Metal, Realty)
3. Scroll past 15th news article
4. Try to add 6th stock to tracking list
5. Click "AI Summary" on any news headline

**DO NOT show it:**
- On first visit (let them explore freely)
- More than once every 5 minutes (annoying = churn)
- When they're reading data (don't interrupt consumption)

---

## WHAT TO BUILD FIRST (Priority Order)

```
PRIORITY 1 (This week — Phase 1):
├── [1] Upgrade modal component (HTML + CSS)
├── [2] AI report daily counter (localStorage)
├── [3] Sector locking (4 visible, 4 locked)
├── [4] News feed limit (15 articles for free)
└── [5] "PRO" badges on locked features

PRIORITY 2 (Week 2):
├── [6] Slower refresh for free tier (60s vs 18s)
├── [7] Disable live-blink for free tier
├── [8] Stock search limit (NIFTY 50 only for free)
├── [9] Supabase auth integration
└── [10] Razorpay payment integration

PRIORITY 3 (Month 2):
├── [11] Server-side AI (your Gemini key)
├── [12] Daily AI email brief for Pro users
├── [13] Telegram alert bot for Pro users
├── [14] PDF export for AI reports
└── [15] Stress Index history chart (Pro only)
```

---

## KEY INSIGHT: THE AI IS YOUR MOAT

Right now, the dashboard data (tickers, news, sectors) is commoditized.
Anyone can get it from MoneyControl, TradingView, or Zerodha.

**What users CAN'T get anywhere else:**
1. The 21-factor RADAR with sentiment classification → unique
2. Market Stress Index → unique
3. AI reports contextualized to Indian markets → unique
4. All of the above in ONE screen → unique

**The AI reports are your #1 monetization lever.**
They're the feature users will actually pay for.
Gate them aggressively. 3/day free. Unlimited Pro.

Everything else (dashboard, news, basic sectors) stays generous on free tier
because that's what brings people back every morning.

**The funnel:**
```
Free user visits daily (habit) → Reads RADAR + Stress (free)
→ Sees interesting ticker → Clicks for AI report (free, 1 of 3)
→ Uses 2nd report → Uses 3rd report
→ Tries 4th report → UPGRADE MODAL
→ "₹299/month for unlimited? That's ₹10/day. One good trade pays for a year."
→ Converts.
```

---

## COMPETITIVE PRICING CONTEXT

| Tool | Price | What You Get |
|------|-------|-------------|
| Bloomberg Terminal | ₹20,00,000/year | Everything |
| Screener.in Premium | ₹4,999/year | Screens + Financials |
| Tijori Finance | ₹2,999/year | Company data |
| Chartink Pro | ₹1,499/month | Scanners |
| Smallcase | ₹499/month | Curated portfolios |
| **Aurion Pro** | **₹299/month** | AI reports + Real-time dashboard + Macro radar |

₹299/month positions you as the cheapest AI-powered tool in the market.
Anyone trading F&O makes/loses ₹299 in the first 5 minutes of a session.
The price is a non-objection.

---

*Don't build the perfect paywall. Build a leaky one that 80% of users hit, and fix the leaks later when you have revenue.*
