// =============================================
// AURION TERMINAL — second-page.js
// All second-page (analytics modal) logic:
// TradingView widget, sector pages, sentiment,
// stock reports, ticker navigation
// =============================================

function loadTradingViewWidget(symbol) {
    const container = document.getElementById('tv-container');
    container.innerHTML = '';

    if (symbol.startsWith('NSE:CNX') || symbol === 'NSE:BANKNIFTY') {
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; text-align:center;">
                <div style="background: rgba(0, 240, 255, 0.05); border: 1px solid rgba(0, 240, 255, 0.3); padding: 40px; border-radius: 12px; max-width: 500px;">
                    <h3 style="color:var(--cyan); margin-bottom: 12px; font-family:'JetBrains Mono'; font-size:16px;">EXCHANGE DATA RESTRICTED</h3>
                    <p style="color:var(--text-muted); margin-bottom: 24px; font-size:13px; line-height:1.6;">Live charting for <b>${symbol}</b> is restricted by the exchange on 3rd-party terminals.<br />View the full interactive chart directly on TradingView.</p>
                    <a href="https://in.tradingview.com/chart/?symbol=${symbol}" target="_blank" style="background: var(--cyan); color: #000; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-family:'JetBrains Mono'; font-size:13px; display:inline-block; transition:all 0.2s ease; cursor:pointer;" onmouseover="this.style.boxShadow='0 0 15px rgba(0,240,255,0.4)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.boxShadow='none'; this.style.transform='translateY(0)'">
                        OPEN ON TRADINGVIEW ↗
                    </a>
                </div>
            </div>
        `;
        return;
    }

    new TradingView.widget({
        "autosize": true,
        "symbol": symbol,
        "interval": "D",
        "timezone": "Asia/Kolkata",
        "theme": "dark",
        "style": "1",
        "locale": "in",
        "enable_publishing": false,
        "backgroundColor": "rgba(0, 0, 0, 1)",
        "gridColor": "rgba(255, 255, 255, 0.05)",
        "hide_top_toolbar": false,
        "hide_legend": false,
        "save_image": false,
        "container_id": "tv-container"
    });
}

const TV_MAP = {
    'NIFTY': 'NSE:NIFTY', 'SENSEX': 'BSE:SENSEX', 'BANKNIFTY': 'NSE:BANKNIFTY',
    'INRUSD': 'FX:USDINR', 'BRENT': 'TVC:UKOIL', 'GOLD': 'TVC:GOLD',
    'VIX_US': 'TVC:VIX', 'DXY': 'TVC:DXY', 'US10Y': 'TVC:US10Y', 'NASDAQ': 'NASDAQ:NDX', 'BTC': 'BINANCE:BTCUSDT'
};

const SEC_TV_MAP = {
    'NIFTY IT': 'NSE:CNXIT', 'BANK': 'NSE:BANKNIFTY', 'PHARMA': 'NSE:CNXPHARMA',
    'AUTO': 'NSE:CNXAUTO', 'FMCG': 'NSE:CNXFMCG', 'METAL': 'NSE:CNXMETAL',
    'REALTY': 'NSE:CNXREALTY', 'ENERGY': 'NSE:CNXENERGY'
};

window.loadChartForTicker = function (k, customSymbol = null) {
    let symbol = customSymbol || TV_MAP[k] || 'NSE:NIFTY';

    document.getElementById('sp-title').textContent = `${k} OVERVIEW`;

    let priceText = '';
    let chgText = '';
    if (simPrices[k]) {
        const isUp = simPrices[k].chg_pct >= 0;
        let c_val = formatVal(simPrices[k].display);
        if (k === 'BTC' || k === 'NASDAQ') { c_val = '$' + c_val; }
        if (k === 'INRUSD') { c_val = '₹' + c_val; }

        priceText = `<div style="font-family: 'JetBrains Mono'; font-size: 48px; font-weight: 800; color: var(--text-luma); margin-bottom: 8px; letter-spacing:-1.5px;">${c_val}</div>`;
        chgText = `<div style="font-family: 'JetBrains Mono'; font-size: 18px; color: var(--${isUp ? 'bull' : 'bear'}); margin-bottom: 24px; font-weight:700;">${isUp ? '▲ +' : '▼ '}${(simPrices[k].chg_pct * 100).toFixed(2)}%</div>`;
    }

    const keywordMap = {
        'NIFTY': 'nifty', 'SENSEX': 'sensex', 'BANKNIFTY': 'bank', 'BRENT': 'crude', 'GOLD': 'gold', 'BTC': 'crypto', 'US10Y': 'fed', 'DXY': 'dollar', 'NASDAQ': 'nasdaq'
    };
    const targetKeyword = keywordMap[k] || k.toLowerCase();
    let relNews = newsDataCache.filter(n => n.title.toLowerCase().includes(targetKeyword) || n.desc.toLowerCase().includes(targetKeyword)).slice(0, 5);
    if (relNews.length === 0) relNews = newsDataCache.slice(0, 3);

    let newsHtml = `<h2 style="font-family:'Space Grotesk'; font-size:16px; color:var(--text-luma); margin-top:24px; margin-bottom:12px;">Latest Contextual News</h2><div style="display:flex; flex-direction:column; gap:6px;">` + relNews.map(n => {
        let bClass = n.sentiment === 'bullish' ? 'bull' : (n.sentiment === 'bearish' ? 'bear' : 'neutral');
        let timeStr = n.ts ? new Date(n.ts * 1000).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, day: 'numeric', month: 'short' }) : '';
        return `
            <div onclick="window.open('${n.link}', '_blank')" style="cursor:pointer; padding:10px; border:1px solid var(--border); border-radius:8px; background:rgba(0,0,0,0.2); transition:background 0.2s;">
                <div style="font-size:12px; font-weight:500; color:var(--text-luma); margin-bottom:6px; line-height:1.4;">${n.title}</div>
                <div style="font-family:'JetBrains Mono'; font-size:9px; color:var(--text-muted); display:flex; justify-content:space-between; align-items:center;">
                    <span>${n.source || 'News'}</span>
                    <span>${timeStr}</span>
                    <span class="badge b-${bClass}">${n.sentiment.toUpperCase()}</span>
                </div>
            </div>
            `;
    }).join('') + `</div>`;

    document.getElementById('sp-left').innerHTML = `
        ${priceText}
        ${chgText}
        <h1 style="font-family: 'Outfit', sans-serif; font-size: 22px; margin-bottom: 12px; color: var(--text-luma); font-weight: 800; text-transform: uppercase;">Analytics: ${k}</h1>
        <a href="https://www.tradingview.com/chart/?symbol=${symbol}" target="_blank" class="btn-glow" style="margin-bottom:16px;">Open on TradingView ↗</a>
        ${newsHtml}
        `;

    loadTradingViewWidget(symbol);
    document.getElementById('second-page').classList.add('active');
    streamAIReport(k);
}

window.openSectorPage = async function (name) {
    document.getElementById('sp-title').textContent = `${name} Constituent Analysis`;
    document.getElementById('sp-left').innerHTML = `<div class="loader" style="font-size: 16px;">Calibrating Weights...</div>`;
    document.getElementById('second-page').classList.add('active');

    loadTradingViewWidget(SEC_TV_MAP[name] || 'NSE:NIFTY');

    try {
        const r = await fetch(`/api/sector/${encodeURIComponent(name)}`);
        const data = await r.json();

        let html = '<table class="w-table"><tr><th>Symbol</th><th>Weight</th><th>Price</th><th>Chg</th></tr>';
        data.forEach(s => {
            const isUp = s.chg_pct >= 0;
            const symSimple = s.sym.replace('.NS', '');
            html += `<tr onclick="searchAndOpenTicker('${symSimple}')">
                <td style="color: var(--text-luma);">${symSimple}</td>
                <td style="color: var(--accent);">${s.weight ? s.weight.toFixed(2) + '%' : '--'}</td>
                <td style="font-family: 'JetBrains Mono'">₹${s.price.toFixed(2)}</td>
                <td style="color: ${isUp ? 'var(--bull)' : 'var(--bear)'}; font-family: 'JetBrains Mono'">${(s.chg_pct * 100).toFixed(2)}%</td>
            </tr>`;
        });
        html += '</table>';
        document.getElementById('sp-left').innerHTML = html;
    } catch (e) {
        document.getElementById('sp-left').innerHTML = `Matrix failure.`;
    }
}

window.openSentimentPage = function (idx) {
    const item = sentimentDataCache[idx];
    let k = 'UNKNOWN';
    const onMatch = item.title.match(/\bon\s+([A-Z][A-Z0-9&\s]+?)$/i);
    if (onMatch) {
        k = onMatch[1].trim().toUpperCase().replace(/\s+/g, '');
    } else {
        const knownStocks = ['TCS', 'RELIANCE', 'HDFC', 'ICICI', 'INFOSYS', 'INFY', 'SBI', 'ITC', 'BHARTI AIRTEL',
            'KOTAK', 'TITAN', 'ULTRATECH', 'NTPC', 'WIPRO', 'ZOMATO', 'PAYTM', 'JIOFIN',
            'ADANI', 'MARUTI', 'SUN PHARMA', 'HCL TECH', 'ASIAN PAINTS', 'BAJAJ FIN', 'M&M', 'TATA MOTORS', 'L&T'];
        for (const stock of knownStocks) {
            if (item.title.toUpperCase().includes(stock)) {
                k = stock.replace(/\s+/g, '');
                break;
            }
        }
    }

    const cleanT = k.replace(/[^A-Z0-9]/g, '');
    const csvStock = ALL_STOCKS.find(s => s.t === k || s.n.toUpperCase().includes(k) || s.n.toUpperCase().replace(/[^A-Z0-9]/g, '').includes(cleanT));
    window.loadStockReport(k, `NSE:${k} `, csvStock);
}

window.searchAndOpenTicker = function (val) {
    if (!val) return;
    const t = val.toUpperCase().trim();
    const cleanT = t.replace(/[^A-Z0-9]/g, '');
    let symbol = 'NSE:' + t;
    if (t === 'BTC' || t === 'CRYPTO' || t === 'BITCOIN') symbol = 'BINANCE:BTCUSDT';
    else if (t === 'BRENT' || t === 'CRUDE') symbol = 'TVC:UKOIL';
    else if (t === 'GOLD') symbol = 'TVC:GOLD';

    const csvStock = ALL_STOCKS.find(s => s.t === t || s.n.toUpperCase().includes(t) || s.n.toUpperCase().replace(/[^A-Z0-9]/g, '').includes(cleanT));
    window.loadStockReport(t, symbol, csvStock);
}

window.closeSecondPage = function () {
    document.getElementById('second-page').classList.remove('active');
    setTimeout(() => { document.getElementById('tv-container').innerHTML = ''; document.getElementById('ai-content').innerHTML = ''; }, 600);
}
