// =============================================
// AURION TERMINAL — renderers.js
// All rendering functions for dashboard panels
// =============================================

const TICKER_KEYS = ['NIFTY', 'SENSEX', 'BANKNIFTY', 'INRUSD', 'BRENT', 'GOLD', 'VIX_US', 'DXY', 'US10Y', 'NASDAQ', 'BTC'];
let _tickerBuilt = false;

// Build the ticker strip DOM ONCE. Subsequent updates use updateTickerValues().
function renderTickerStrip() {
    const strip = document.getElementById('ticker-strip');
    let itemsHtml = '';
    TICKER_KEYS.forEach(k => {
        const it = simPrices[k]; if (!it) return;
        itemsHtml += `<div class="tk ${it.open ? 'is-open' : ''}" data-key="${k}" onclick="loadChartForTicker('${k}')">
            <span class="tk-l">${k}</span>
            <span class="tk-v" style="color: ${it.chg_pct >= 0 ? 'var(--bull)' : 'var(--bear)'}">${formatVal(it.display)}</span>
            <span class="tk-badge">${it.open ? 'LIVE' : 'CLOSED'}</span>
        </div>`;
    });

    // Two identical content blocks for seamless infinite scroll
    const trackHTML = `<div class="ticker-track">
        <div class="ticker-content">${itemsHtml}</div>
        <div class="ticker-content">${itemsHtml}</div>
    </div>`;
    strip.innerHTML = trackHTML;
    _tickerBuilt = true;
}

// Update ticker values in-place WITHOUT rebuilding DOM (prevents animation reset)
function updateTickerValues() {
    if (!_tickerBuilt) { renderTickerStrip(); return; }
    const allTks = document.querySelectorAll('#ticker-strip .tk');
    allTks.forEach(el => {
        const k = el.getAttribute('data-key');
        if (!k || !simPrices[k]) return;
        const it = simPrices[k];
        const valSpan = el.querySelector('.tk-v');
        if (valSpan) {
            valSpan.textContent = formatVal(it.display);
            valSpan.style.color = it.chg_pct >= 0 ? 'var(--bull)' : 'var(--bear)';
        }
    });
}

function createRadarTile(label, valStr, dataStateClass, isLiveObjKey = false) {
    const isLive = (isLiveObjKey && simPrices[isLiveObjKey] && simPrices[isLiveObjKey].open);
    const liveCls = isLive ? 'is-live' : '';
    const action = isLiveObjKey ? `onclick="loadChartForTicker('${isLiveObjKey}')"` : `onclick="openRadarIntel('${label}', '${valStr}')" style="cursor:pointer;" title="View Macro Intel"`;
    return `<div class="rt ${dataStateClass} ${liveCls}" ${action}>
        <div class="rt-l">${label}</div>
        <div class="rt-v">${valStr}</div>
    </div>`;
}

function renderRadar() {
    const rg = document.getElementById('radar-grid');
    const d = marketData; let t = [];
    // R1
    t.push(createRadarTile('FED RATE', '5.50%', 'c-neutral'));
    let dxy = d.DXY || {}; t.push(createRadarTile('DXY', formatVal(dxy.val), dxy.chg_pct > 0.002 ? 'c-bear' : (dxy.chg_pct < -0.002 ? 'c-bull' : 'c-neutral'), 'DXY'));
    let brt = d.BRENT || {}; t.push(createRadarTile('BRENT', '$' + formatVal(brt.val), brt.chg_pct > 0.01 ? 'c-bear' : (brt.chg_pct < -0.01 ? 'c-bull' : 'c-neutral'), 'BRENT'));
    let u10 = d.US10Y || {}; t.push(createRadarTile('US 10Y', formatVal(u10.val) + '%', u10.val > 4.5 ? 'c-bear' : (u10.val < 3.5 ? 'c-bull' : 'c-neutral'), 'US10Y'));
    t.push(createRadarTile('CHINA PMI', '50.4', 'c-neutral'));
    let btc = d.BTC || {};
    let btc_val = simPrices['BTC'] ? simPrices['BTC'].display : (btc.val || 60000);
    t.push(createRadarTile('BITCOIN', '$' + Math.round(btc_val), btc.chg_pct > 0.01 ? 'c-bull' : (btc.chg_pct < -0.01 ? 'c-bear' : 'c-neutral'), 'BTC'));
    let vx = d.VIX_US || {}; t.push(createRadarTile('VIX (US)', formatVal(vx.val), vx.val > 25 ? 'c-bear' : (vx.val < 18 ? 'c-bull' : 'c-neutral'), 'VIX_US'));
    // R2
    t.push(createRadarTile('FII FLOW', d.FII || '--', d.FII?.startsWith('B') ? 'c-bull' : 'c-bear'));
    let gld = d.GOLD || {}; t.push(createRadarTile('GOLD', '$' + formatVal(gld.val), gld.chg_pct > 0.005 ? 'c-bull' : 'c-neutral', 'GOLD'));
    let ndx = d.NASDAQ || {}; t.push(createRadarTile('NASDAQ', formatVal(ndx.val), ndx.chg_pct > 0.005 ? 'c-bull' : (ndx.chg_pct < -0.005 ? 'c-bear' : 'c-neutral'), 'NASDAQ'));
    t.push(createRadarTile('GEOPOLIT.', 'NEUTRAL', 'c-accent'));
    let rbi = d.RBI_POLICY || {}; t.push(createRadarTile('RBI RATE', rbi.rate ? rbi.rate + '%' : '--', 'c-neutral'));
    let inr = d.INRUSD || {}; t.push(createRadarTile('INR/USD', '₹' + formatVal(inr.val), inr.chg_pct > 0.0015 ? 'c-bear' : (inr.chg_pct < -0.0015 ? 'c-bull' : 'c-neutral'), 'INRUSD'));
    t.push(createRadarTile('INDIA 10Y', '7.02%', 'c-cyan'));
    // R3
    t.push(createRadarTile('GST COLL', '₹1.7L Cr', 'c-bull'));
    t.push(createRadarTile('DII FLOW', d.DII || '--', d.DII?.startsWith('B') ? 'c-bull' : (d.DII?.startsWith('S') ? 'c-bear' : 'c-neutral')));
    t.push(createRadarTile('EARNINGS', 'Q4 FY24', 'c-neutral'));
    t.push(createRadarTile('POLICY', rbi.next || '--', 'c-neutral'));
    t.push(createRadarTile('MONSOON', 'NORMAL', 'c-bull'));
    t.push(createRadarTile('INDIA VIX', '12.4', 'c-bull'));
    t.push(createRadarTile('ADV TAX', '+18% YoY', 'c-bull'));

    rg.innerHTML = t.join('');
}

// --- TRACKED STOCKS ---
let trackedStocks = [];
try {
    const saved = localStorage.getItem('aurion_tracked_stocks');
    if (saved) trackedStocks = JSON.parse(saved);
} catch (e) { }

function renderTrackedStocks() {
    const container = document.getElementById('tracked-stocks-pills');
    const newsContainer = document.getElementById('tracked-news-pane');
    if (!container || !newsContainer) return;

    if (trackedStocks.length === 0) {
        container.innerHTML = '';
        newsContainer.innerHTML = `<div style="font-family:'JetBrains Mono'; font-size:10px; color:var(--text-muted); padding:10px; text-align:center;"> Please use the plus icon to add stocks. </div>`;
        return;
    }

    container.innerHTML = trackedStocks.map((stock, idx) => `
        <div class="tracked-stock-pill" onclick="searchAndOpenTicker('${stock}')" title="Analyze ${stock}">
            ${stock}
            <div class="delete-stock-btn" onclick="event.stopPropagation(); removeTrackedStock(${idx})" title="Remove ${stock}">✕</div>
        </div>
    `).join('');

    let stockNews = newsDataCache.filter(n => {
        const text = (n.title + ' ' + n.desc).toUpperCase();
        return trackedStocks.some(t => {
            const s = t.toUpperCase().replace(/[^A-Z0-9]/g, '');
            return text.includes(s) || text.includes(t.toUpperCase());
        });
    });

    if (stockNews.length === 0) {
        newsContainer.innerHTML = `<div style="font-family:'JetBrains Mono'; font-size:10px; color:var(--text-muted); padding:10px; text-align:center;"> No recent intel found for tracked stocks in current cycle. </div>`;
    } else {
        newsContainer.innerHTML = stockNews.map(n => {
            const i = newsDataCache.indexOf(n);
            let badgeClass = n.sentiment.toLowerCase() === 'bullish' ? 'bull' : (n.sentiment.toLowerCase() === 'bearish' ? 'bear' : 'neutral');
            return `
                <div class="n-item" onclick="openNewsPage(${i})" style="padding:10px; border-bottom:1px solid rgba(255,255,255,0.03);">
                    <div class="n-meta" style="margin-bottom:6px;">
                        <span class="n-src">${n.source}</span>
                        <span class="badge b-${badgeClass}" style="scale:0.8; transform-origin:right;">${n.sentiment.toUpperCase()}</span>
                    </div>
                    <div class="n-title" style="font-size:12px; margin-bottom:4px; line-height:1.4;">${n.title}</div>
                    <div class="n-time" style="font-family:'JetBrains Mono'; font-size:9px;">${formatExactTime(n.ts)}</div>
                </div>
            `;
        }).join('');
    }
}

function renderNews() {
    renderTrackedStocks();
    document.getElementById('news-pane').innerHTML = newsDataCache.map((n, i) => {
        let badgeClass = n.sentiment.toLowerCase();
        if (badgeClass === 'bullish') badgeClass = 'bull';
        if (badgeClass === 'bearish') badgeClass = 'bear';

        return `
            <div class="n-item" onclick="openNewsPage(${i})">
                <div class="n-meta">
                    <span class="n-src">${n.source}</span>
                    <span class="badge b-${badgeClass}">${n.sentiment}</span>
                </div>
                <div class="n-title">${n.title}</div>
                <div class="n-time">${formatExactTime(n.ts)}</div>
            </div>
        `;
    }).join('');
}

function renderSentiment() {
    let bull = 0, bear = 0, neut = 0;
    sentimentDataCache.forEach(n => {
        if (n.sentiment === 'bullish') bull++;
        else if (n.sentiment === 'bearish') bear++;
        else neut++;
    });
    const tot = Math.max(1, bull + bear + neut);
    document.getElementById('s-bar').innerHTML = `
        <div style="width:${(bull / tot) * 100}%; background:var(--bull)"></div>
        <div style="width:${(neut / tot) * 100}%; background:var(--neutral)"></div>
        <div style="width:${(bear / tot) * 100}%; background:var(--bear)"></div>
    `;
    document.getElementById('s-bull').textContent = Math.round((bull / tot) * 100) + '% BULL';
    document.getElementById('s-neut').textContent = Math.round((neut / tot) * 100) + '% NEUT';
    document.getElementById('s-bear').textContent = Math.round((bear / tot) * 100) + '% BEAR';

    document.getElementById('s-list').innerHTML = sentimentDataCache.slice(0, 20).map((n, i) => `
        <div class="ss-item" onclick="openSentimentPage(${i})">
            <div class="ss-dot" style="color: var(--${n.sentiment === 'bullish' ? 'bull' : (n.sentiment === 'bearish' ? 'bear' : 'neutral')})"></div>
            <div class="ss-content">
                <div class="ss-title">${n.title}</div>
                <div class="ss-meta">
                    <span>${n.source}</span>
                    <span>${formatExactTime(n.ts)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderSectors(data) {
    let ht = '';
    Object.keys(data).forEach(k => {
        const r = data[k]; const isUp = r.chg_pct >= 0;
        let spk = '';
        if (r.sparkline && r.sparkline.length) {
            const min = Math.min(...r.sparkline), max = Math.max(...r.sparkline), range = max - min || 1;
            const map = r.sparkline.map((v, i) => `${(i / (r.sparkline.length - 1)) * 100},${24 - ((v - min) / range) * 24} `);
            spk = `<svg class="s-spark ${isUp ? 'up' : 'dn'}" viewBox="0 0 100 24" preserveAspectRatio="none"><path d="M${map.join(' L')}" /></svg>`;
        }
        ht += `<div class="sec-row" onclick="openSectorPage('${k}')">
            <div class="s-name">${k}</div>
            <div class="s-val ${isUp ? 'c-bull' : 'c-bear'}">${(r.chg_pct * 100).toFixed(2)}%</div>
            <div>${spk}</div>
            <div style="text-align:right">
                ${r.vol_spike ? '<span class="badge b-bear" style="margin-right:6px">VOL</span>' : ''}
                <span class="badge ${isUp ? 'b-bull' : 'b-bear'}">${r.momentum}</span>
            </div>
        </div>`;
    });
    document.getElementById('sectors-pane').innerHTML = ht;
}

function generateAlerts() {
    const d = marketData; const a = [];
    if (d.VIX_US && d.VIX_US.val > 25) a.push({ l: 'CRITICAL', t: 'VIX SPIKE — India historically drops 1.5-2x on VIX > 25' });
    if (d.INRUSD && d.INRUSD.chg_pct > 0.003) a.push({ l: 'WARNING', t: 'INR WEAK — FII outflow pressure likely' });
    if (d.BRENT && d.BRENT.chg_pct > 0.02) a.push({ l: 'WARNING', t: 'CRUDE ALERT — Energy sector margin compression' });
    if (d.NIFTY && d.NIFTY.chg_pct < -0.015) a.push({ l: 'CRITICAL', t: 'SELL-OFF REVERSAL LIKELY — Check FII activity' });
    if (a.length === 0) a.push({ l: 'INFO', t: 'SYSTEM NOMINAL — All metrics aligned correctly.' });

    document.getElementById('alerts-pane').innerHTML = a.map(x => `
        <div class="alert-card a-${x.l}" style="border-left: 3px solid var(--${x.l === 'CRITICAL' ? 'bear' : (x.l === 'WARNING' ? 'accent' : 'cyan')}); position: relative;">
            ${x.l !== 'INFO' ? '<div style="position:absolute; top:12px; right:12px; width:6px; height:6px; background:var(--bear); border-radius:50%; animation:pulse 1s infinite alternate; box-shadow:0 0 8px var(--bear);"></div>' : ''}
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="badge b-${x.l === 'CRITICAL' ? 'bear' : (x.l === 'WARNING' ? 'accent' : 'cyan')}">${x.l}</span>
                <span style="font-family:'JetBrains Mono'; font-size:10px; color:var(--text-muted); padding-right: 12px;">${formatExactTime(Date.now() / 1000)}</span>
            </div>
            <div class="alert-txt">${x.t}</div>
        </div>
    `).join('');
}
