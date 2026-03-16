import sys
import subprocess
import threading
import time
import re
import os
from datetime import datetime, timezone, timedelta

REQUIRED_PACKAGES = ['flask', 'feedparser', 'yfinance', 'requests', 'werkzeug']

def install_and_import():
    try:
        import flask
        import feedparser
        import yfinance
        import requests
    except ImportError:
        print("Required packages not found. Installing automatically...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", *REQUIRED_PACKAGES])

install_and_import()

from flask import Flask, render_template, jsonify, request
import feedparser
import yfinance as yf
import requests

app = Flask(__name__)

MARKET_HOURS = {
    'NIFTY':    {'exchange': 'NSE',    'tz': 5.5,  'open': '09:15', 'close': '15:30', 'days': [0,1,2,3,4]},
    'SENSEX':   {'exchange': 'BSE',    'tz': 5.5,  'open': '09:15', 'close': '15:30', 'days': [0,1,2,3,4]},
    'BANKNIFTY':{'exchange': 'NSE',    'tz': 5.5,  'open': '09:15', 'close': '15:30', 'days': [0,1,2,3,4]},
    'INRUSD':   {'exchange': 'FOREX',  'tz': 0,    'open': '00:00', 'close': '23:59', 'days': [0,1,2,3,4]},
    'BRENT':    {'exchange': 'NYMEX',  'tz': -5,   'open': '06:00', 'close': '17:00', 'days': [0,1,2,3,4]},
    'GOLD':     {'exchange': 'COMEX',  'tz': -5,   'open': '06:00', 'close': '17:00', 'days': [0,1,2,3,4]},
    'VIX_US':   {'exchange': 'CBOE',   'tz': -5,   'open': '09:30', 'close': '16:00', 'days': [0,1,2,3,4]},
    'DXY':      {'exchange': 'ICE',    'tz': -5,   'open': '03:00', 'close': '17:00', 'days': [0,1,2,3,4]},
    'US10Y':    {'exchange': 'CBOT',   'tz': -5,   'open': '07:00', 'close': '17:00', 'days': [0,1,2,3,4]},
    'NASDAQ':   {'exchange': 'NASDAQ', 'tz': -5,   'open': '09:30', 'close': '16:00', 'days': [0,1,2,3,4]},
    'BTC':      {'exchange': 'CRYPTO', 'tz': 0,    'open': '00:00', 'close': '23:59', 'days': [0,1,2,3,4,5,6]},
}

TICKER_MAP = {
    'NIFTY': '^NSEI', 'SENSEX': '^BSESN', 'BANKNIFTY': '^NSEBANK',
    'INRUSD': 'INR=X', 'BRENT': 'BZ=F', 'GOLD': 'GC=F',
    'VIX_US': '^VIX', 'DXY': 'DX-Y.NYB', 'US10Y': '^TNX', 'NASDAQ': '^IXIC',
    'BTC': 'BTC-USD'
}

SECTORS = {
    'NIFTY IT': {'ticker': '^CNXIT', 'stocks': ['TCS.NS', 'INFY.NS', 'HCLTECH.NS', 'WIPRO.NS', 'TECHM.NS', 'LTIM.NS', 'MPHASIS.NS', 'COFORGE.NS'], 'weights': [26.50, 26.21, 9.87, 8.41, 7.8, 5.2, 4.3, 3.1]},
    'BANK': {'ticker': '^NSEBANK', 'stocks': ['HDFCBANK.NS', 'ICICIBANK.NS', 'KOTAKBANK.NS', 'AXISBANK.NS', 'SBIN.NS', 'INDUSINDBK.NS', 'BANDHANBNK.NS', 'FEDERALBNK.NS'], 'weights': [29.1, 23.4, 10.2, 9.7, 8.5, 5.4, 2.1, 1.8]},
    'PHARMA': {'ticker': 'SUNPHARMA.NS', 'stocks': ['SUNPHARMA.NS', 'DRREDDY.NS', 'CIPLA.NS', 'DIVISLAB.NS', 'AUROPHARMA.NS', 'BIOCON.NS', 'LUPIN.NS', 'TORNTPHARM.NS'], 'weights': [25.1, 15.2, 14.8, 11.2, 8.5, 6.4, 5.1, 4.2]},
    'AUTO': {'ticker': 'M&M.NS', 'stocks': ['M&M.NS', 'MARUTI.NS', 'BAJAJ-AUTO.NS', 'EICHERMOT.NS', 'HEROMOTOCO.NS', 'TVSMOTOR.NS', 'ASHOKLEY.NS', 'BALKRISIND.NS'], 'weights': [20.4, 19.5, 12.1, 10.5, 9.8, 8.2, 5.4, 4.1]},
    'FMCG': {'ticker': 'HINDUNILVR.NS', 'stocks': ['HINDUNILVR.NS', 'ITC.NS', 'NESTLEIND.NS', 'BRITANNIA.NS', 'DABUR.NS', 'MARICO.NS', 'GODREJCP.NS', 'COLPAL.NS'], 'weights': [28.5, 26.4, 14.2, 8.1, 6.5, 5.2, 4.8, 3.1]},
    'METAL': {'ticker': 'TATASTEEL.NS', 'stocks': ['TATASTEEL.NS', 'HINDALCO.NS', 'JSWSTEEL.NS', 'VEDL.NS', 'COALINDIA.NS', 'NMDC.NS', 'SAIL.NS', 'NATIONALUM.NS'], 'weights': [25.4, 21.2, 18.5, 12.1, 9.8, 5.4, 4.2, 2.1]},
    'REALTY': {'ticker': 'DLF.NS', 'stocks': ['DLF.NS', 'GODREJPROP.NS', 'OBEROIRLTY.NS', 'PRESTIGE.NS', 'PHOENIXLTD.NS', 'BRIGADE.NS'], 'weights': [32.5, 22.4, 18.1, 12.5, 8.4, 5.2]},
    'ENERGY': {'ticker': 'RELIANCE.NS', 'stocks': ['RELIANCE.NS', 'ONGC.NS', 'NTPC.NS', 'POWERGRID.NS', 'ADANIGREEN.NS', 'BPCL.NS', 'IOC.NS', 'GAIL.NS'], 'weights': [35.2, 15.4, 12.8, 10.5, 9.1, 6.2, 5.4, 4.1]}
}

BULLISH_WORDS = ["surge", "rally", "gain", "jump", "soar", "rise", "bull", "buy", "upgrade", "beat", "profit", "growth", "expansion", "record high", "outperform", "boom", "recovery", "positive", "optimistic", "strong", "robust", "rate cut", "inflow", "dividend", "buyback", "upside", "breakout", "all-time high", "lifts", "climbs", "green", "advances", "approval", "boost", "easing", "stimulus", "reform", "dii buying", "record", "surplus", "resilience", "strong demand", "eases", "mandate", "wins", "favourable", "attracts", "tops", "crosses", "accelerat"]
BEARISH_WORDS = ["crash", "fall", "drop", "plunge", "sell", "bear", "loss", "decline", "slump", "weak", "downgrade", "miss", "deficit", "inflation", "outflow", "crisis", "correction", "negative", "fear", "risk", "warning", "rate hike", "recession", "default", "fraud", "scam", "ban", "restriction", "penalty", "fda alert", "red", "slides", "sinks", "tumbles", "layoff", "debt", "sanction", "fii selling", "dumping", "tariff", "war", "attack", "shutdown", "downside", "headwind", "threat", "geopolit", "tension", "escalat", "strikes", "protest", "unrest", "slowdown", "disappoint"]
INDIA_WORDS = ["india", "indian", "nifty", "sensex", "bse", "nse", "rbi", "sebi", "rupee", "inr", "modi", "delhi", "mumbai", "infosys", "tcs", "reliance", "adani", "tata", "wipro", "hdfc", "icici", "sbi", "fii", "dii", "fpi", "mutual fund", "gst", "fiscal", "budget", "gdp", "cpi", "wpi", "monsoon", "crude oil", "gold", "pharma", "it sector", "auto", "fmcg", "metal", "realty", "energy", "power", "fed", "tariff", "global", "emerging market", "trump", "china", "pakistan", "fda", "usfda", "market", "stock", "share", "equity", "bond", "yield", "rate", "inflation", "growth", "earnings", "quarterly", "revenue", "profit"]

RSS_FEEDS = [
    'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
    'https://www.moneycontrol.com/rss/marketreports.xml',
    'https://www.livemint.com/rss/markets',
    'https://www.business-standard.com/rss/markets-106.rss',
    'https://www.ndtv.com/business/latest/rss',
    'https://www.thehindubusinessline.com/markets/?service=rss',
    'https://www.financialexpress.com/market/feed/',
    'https://www.livemint.com/rss/economy',
    'https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms',
    'https://economictimes.indiatimes.com/news/economy/policy/rssfeeds/1373381680.cms',
    'https://economictimes.indiatimes.com/news/industry/rssfeeds/13534488.cms',
    'https://www.moneycontrol.com/rss/mf.xml',
    'https://www.moneycontrol.com/rss/business.xml',
    'http://feeds.reuters.com/reuters/INbusinessNews',
    'https://www.livemint.com/rss/technology'
]

cache = {
    'market':  {'d': {}, 't': 0},
    'news':    {'d': [], 't': 0},
    'sectors': {'d': {}, 't': 0},
    'stress_hist': [],
    'sector_stocks': {}
}

def clamp(val, min_val, max_val):
    return max(min_val, min(val, max_val))

def compute_stress(market_data):
    try:
        base = 40.0
        vix = market_data.get('VIX_US', {}).get('val', 20)
        inr_chg = market_data.get('INRUSD', {}).get('chg_pct', 0) * 100
        brent_chg = market_data.get('BRENT', {}).get('chg_pct', 0) * 100
        dxy_chg = market_data.get('DXY', {}).get('chg_pct', 0) * 100
        nifty_chg = market_data.get('NIFTY', {}).get('chg_pct', 0) * 100
        us10y = market_data.get('US10Y', {}).get('val', 4.0)

        # VIX
        if vix > 35: base += 15
        elif vix > 30: base += 12
        elif vix > 25: base += 8
        elif vix > 20: base += 4
        elif vix < 14: base -= 8
        elif vix < 18: base -= 4

        # INR
        base += clamp(inr_chg * 8, -10, 10)
        # BRENT
        base += clamp(brent_chg * 3, -8, 8)
        # DXY
        base += clamp(dxy_chg * 4, -6, 6)
        # NIFTY
        base -= clamp(nifty_chg * 5, -12, 12)
        # US10Y
        if us10y > 5.0: base += 8
        elif us10y > 4.5: base += 4
        elif us10y < 3.5: base -= 4

        val = round(clamp(base, 0, 100), 1)
        cache['stress_hist'].append(val)
        if len(cache['stress_hist']) > 200:
            cache['stress_hist'].pop(0)
        return val
    except:
        return 40.0

def _fetch_market_data():
    now = time.time()
    if now - cache['market']['t'] < 18:
        return cache['market']['d']
        
    data = {}
    tickers = yf.Tickers(' '.join(TICKER_MAP.values()))
    hist = tickers.history(period='5d', interval='1d')
    for name, sym in TICKER_MAP.items():
        try:
            close_prices = hist['Close'][sym].dropna()
            if len(close_prices) >= 2:
                curr = float(close_prices.iloc[-1])
                prev = float(close_prices.iloc[-2])
                chg = curr - prev
                chgpct = chg / prev if prev else 0
                if name == 'INRUSD':
                    chgpct = -chgpct # invert for display
                data[name] = {'val': curr, 'chg': chg, 'chg_pct': chgpct}
            elif len(close_prices) == 1:
                curr = float(close_prices.iloc[-1])
                data[name] = {'val': curr, 'chg': 0, 'chg_pct': 0}
            else:
                data[name] = {'val': 0, 'chg': 0, 'chg_pct': 0}
        except:
             data[name] = {'val': 0, 'chg': 0, 'chg_pct': 0}
             
    data['RBI_POLICY'] = {'last': '2026-02-08', 'next': '2026-04-04', 'rate': 6.5}
    
    stress = compute_stress(data)
    data['STRESS'] = stress
    
    # Preserving extracted values
    if 'FII' not in cache['market']['d']:
        data['FII'] = 'AWAITING'
    else:
        data['FII'] = cache['market']['d']['FII']
        
    if 'DII' not in cache['market']['d']:
        data['DII'] = 'AWAITING'
    else:
        data['DII'] = cache['market']['d']['DII']

    cache['market']['d'] = data
    cache['market']['t'] = now
    return data

def extract_fii_dii(title):
    nums = re.findall(r'[₹rs.]*\s*([\d,]+(?:\.\d+)?)\s*(?:cr|crore)', title, flags=re.IGNORECASE)
    buy_sell = "BUY" if any(w in title.lower() for w in ["buy", "inflow", "net buyer"]) else ("SELL" if any(w in title.lower() for w in ["sell", "outflow", "net seller"]) else None)
    return nums[0] if nums else None, buy_sell

def _fetch_news():
    now = time.time()
    if now - cache['news']['t'] < 60:
        return cache['news']['d']
        
    items = []
    seen = set()
    import concurrent.futures
    
    def fetch_rss(url):
        try:
           parsed = feedparser.parse(url)
           return parsed.entries
        except:
           return []

    entries = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
        res = ex.map(fetch_rss, RSS_FEEDS)
        for r in res: entries.extend(r)
        
    for e in entries:
        title = e.get('title', '')
        desc = e.get('summary', '') or e.get('description', '')
        # Simple cleanup tag
        desc = re.sub('<[^<]+>', "", desc)
        
        text = (title + " " + desc).lower()
        if not any(w in text for w in INDIA_WORDS):
            continue
            
        if title in seen: continue
        seen.add(title)
        
        bull_c = sum(1 for w in BULLISH_WORDS if w in text)
        bear_c = sum(1 for w in BEARISH_WORDS if w in text)
        
        sentiment = 'neutral'
        if bull_c > bear_c: sentiment = 'bullish'
        elif bear_c > bull_c: sentiment = 'bearish'

        import time as tm
        import calendar
        pub = e.get('published_parsed', tm.gmtime())
        ts = calendar.timegm(pub) if pub else tm.time()

        items.append({
            'title': title,
            'desc': desc[:200] + '...' if len(desc)>200 else desc,
            'link': e.get('link', ''),
            'source': e.get('feed', {}).get('title', '') or 'News',
            'sentiment': sentiment,
            'ts': ts
        })
        
        if "fii" in title.lower() or "fpi" in title.lower():
            val, d = extract_fii_dii(title)
            if val and d:
                cache['market']['d']['FII'] = f"{d} {val}Cr"
        if "dii" in title.lower():
            val, d = extract_fii_dii(title)
            if val and d:
                cache['market']['d']['DII'] = f"{d} {val}Cr"

    items.sort(key=lambda x: x['ts'], reverse=True)
    cache['news']['d'] = items[:80]
    cache['news']['t'] = now
    return cache['news']['d']

def _fetch_sectors():
    now = time.time()
    if now - cache['sectors']['t'] < 30:
        return cache['sectors']['d']
        
    data = {}
    syms = [sec['ticker'] for sec in SECTORS.values()]
    # Fetch 1m/5m/15m data for sparklines
    # For robust, fallback to 15m.
    try:
        tickers = yf.Tickers(' '.join(syms))
        hist = tickers.history(period='2d', interval='15m', group_by='ticker')
    except:
        hist = None
    
    for sec_name, sec_info in SECTORS.items():
        sym = sec_info['ticker']
        try:
            if hist is not None and sym in hist:
                df = hist[sym]
            else:
                ticker = yf.Ticker(sym)
                df = ticker.history(period='2d', interval='15m')
                
            close_prices = df['Close'].dropna()
            volumes = df['Volume'].dropna() if 'Volume' in df else []
            if len(close_prices) > 0:
                curr = float(close_prices.iloc[-1])
                # Daily change proxy
                d_df = yf.Ticker(sym).history(period='5d', interval='1d')
                if len(d_df) >= 2:
                    prev = float(d_df['Close'].iloc[-2])
                else:
                    prev = curr
                chg_pct = (curr - prev) / prev if prev else 0
                
                sparks = close_prices[-25:].tolist()
                vol_spike = False
                if len(volumes) >= 2:
                    avg_v = volumes[-10:-1].mean() if len(volumes) >= 10 else volumes.mean()
                    if float(volumes.iloc[-1]) > float(avg_v) * 2:
                        vol_spike = True

                data[sec_name] = {
                    'val': curr,
                    'chg_pct': chg_pct,
                    'sparkline': sparks,
                    'momentum': 'GAINING' if chg_pct > 0 else 'FADING',
                    'vol_spike': vol_spike
                }
            else:
                data[sec_name] = {'val': 0, 'chg_pct': 0, 'sparkline': [], 'momentum': 'NEUTRAL', 'vol_spike': False}
        except Exception as e:
            # print("Sector fetch error", sec_name, e)
            data[sec_name] = {'val': 0, 'chg_pct': 0, 'sparkline': [], 'momentum': 'NEUTRAL', 'vol_spike': False}
    
    cache['sectors']['d'] = data
    cache['sectors']['t'] = now
    return data

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/pro')
def pro_page():
    return render_template('pro.html')

@app.route('/api/market')
def api_market():
    return jsonify({
        'data': _fetch_market_data(),
        'hours': MARKET_HOURS
    })

@app.route('/api/news')
def api_news():
    return jsonify(_fetch_news())

def _generate_mock_sentiment():
    import random
    stocks = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBI', 'L&T', 'BAJAJ FIN', 'ITC', 'BHARTI AIRTEL', 'KOTAK BANK', 'M&M', 'TATA MOTORS', 'SUN PHARMA', 'MARUTI', 'HCL TECH', 'ASIAN PAINTS', 'TITAN', 'ULTRATECH', 'NTPC', 'WIPRO', 'ZOMATO', 'PAYTM', 'JIOFIN', 'ADANI ENT', 'ADANI PORTS']
    analysts = ['Morgan Stanley', 'Goldman Sachs', 'JPMorgan', 'BofA Securities', 'Citi', 'Nomura', 'CLSA', 'Macquarie', 'Jefferies', 'UBS', 'Motilal Oswal', 'Kotak Inst', 'ICICI Sec']
    actions = [('UPGRADES to Overweight', 'bullish'), ('MAINTAINS BUY', 'bullish'), ('DOWNGRADES to Underperform', 'bearish'), ('INITIATES SELL', 'bearish'), ('MAINTAINS HOLD', 'neutral'), ('TARGET RAISED', 'bullish'), ('TARGET CUT', 'bearish'), ('ADDS to Conviction List', 'bullish'), ('REMOVES from Buy List', 'bearish')]
    
    res = []
    now = time.time()
    random.seed(int(now / 3600)) # Stable for 1 hour
    for i in range(30):
        s = random.choice(stocks)
        a = random.choice(analysts)
        act, sent = random.choice(actions)
        ts = now - random.randint(60, 43200) # last 12 hours
        title = f"{a} {act} on {s}"
        res.append({
            'source': a,
            'title': title,
            'desc': f"Analyst note highlights recent developments and valuation metrics for {s}. The revised rating reflects changes in sector dynamics and company-specific forward multiples.",
            'sentiment': sent,
            'ts': ts
        })
    res.sort(key=lambda x: x['ts'], reverse=True)
    return res

@app.route('/api/sentiment')
def api_sentiment():
    return jsonify(_generate_mock_sentiment())

@app.route('/api/sectors')
def api_sectors():
    return jsonify(_fetch_sectors())

@app.route('/api/sector/<name>')
def api_sector_detail(name):
    sec_info = SECTORS.get(name)
    if not sec_info: return jsonify([])
    now = time.time()
    cached = cache['sector_stocks'].get(name)
    if cached and now - cached['t'] < 60:
        return jsonify(cached['d'])
        
    stocks = sec_info['stocks']
    res = []
    
    for i, s in enumerate(stocks):
        weight = sec_info['weights'][i] if 'weights' in sec_info and i < len(sec_info['weights']) else 0
        try:
           df = yf.Ticker(s).history(period='5d', interval='1d')
           close_prices = df['Close'].dropna()
           if len(close_prices)>=2:
               curr = float(close_prices.iloc[-1])
               prev = float(close_prices.iloc[-2])
               chg_pct = (curr-prev)/prev
               res.append({'sym': s, 'price': curr, 'chg_pct': chg_pct, 'weight': weight})
        except:
           pass
           
    res.sort(key=lambda x: x['weight'], reverse=True)
           
    cache['sector_stocks'][name] = {'d': res, 't': now}
    return jsonify(res)

@app.route('/api/stocks')
def api_stocks():
    """Parse ALL Dhan CSV files and return all stocks with rich data for autocomplete + analytics."""
    import csv
    import glob
    
    templates_dir = os.path.join(os.path.dirname(__file__), 'templates')
    csv_files = glob.glob(os.path.join(templates_dir, 'Dhan - *.csv'))
    
    seen_names = set()
    stocks = []

    def clean_num(v):
        if not v or v == '-': return None
        return v.replace(',', '').replace('%', '').replace('₹', '').strip()

    for csv_path in csv_files:
        try:
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    name = row.get('Name', '').strip()
                    if not name or name in seen_names:
                        continue
                    seen_names.add(name)
                    stocks.append({
                        'name': name,
                        'ltp': clean_num(row.get('LTP', '')),
                        'change_pct': clean_num(row.get('Change(%)', '')),
                        'pe': clean_num(row.get('PE Ratio', '')),
                        'eps': clean_num(row.get('EPS', '')),
                        'rsi': clean_num(row.get('RSI', '')),
                        'dma50': clean_num(row.get('50 DMA', '')),
                        'dma200': clean_num(row.get('200 DMA', '')),
                        'high52w': clean_num(row.get('52W High', '')),
                        'low52w': clean_num(row.get('52W Low', '')),
                        'mcap': clean_num(row.get('Market Cap (Cr.)', '')),
                        'roe': clean_num(row.get('ROE', '')),
                        'roce': clean_num(row.get('ROCE', '')),
                        'pb': clean_num(row.get('PB Ratio', '')),
                        'dividend': clean_num(row.get('Dividend', '')),
                        'volume': clean_num(row.get('Volume', '')),
                        'ret_1m': clean_num(row.get('1M Returns', '')),
                        'ret_1y': clean_num(row.get('1 Yr Returns', '')),
                        'screener': row.get('Screener', ''),
                    })
        except Exception as e:
            print(f"CSV parse error for {csv_path}: {e}")

    print(f"Aurion: Loaded {len(stocks)} stocks from {len(csv_files)} CSV files")
    return jsonify(stocks)

@app.route('/api/refresh', methods=['POST'])
def api_refresh():
    cache['market']['t'] = 0
    cache['news']['t'] = 0
    cache['sectors']['t'] = 0
    cache['sector_stocks'] = {}
    return jsonify({"status": "cleared"})
    
def prewarm():
    print("Prewarming caches...")
    _fetch_market_data()
    _fetch_sectors()
    _fetch_news()
    print("Prewarm complete.")

if __name__ == '__main__':
    threading.Thread(target=prewarm, daemon=True).start()
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('RAILWAY_ENVIRONMENT') is None
    app.run(host='0.0.0.0', port=port, debug=debug, use_reloader=False)
