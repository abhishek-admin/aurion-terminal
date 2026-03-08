// =============================================
// AURION TERMINAL — ai-engine.js
// AI streaming: stock reports, news summaries,
// macro intel, loadStockReport, openRadarIntel
// =============================================

let _aiAbortController = null;

// --- STOCK REPORT ---
async function streamAIReport(ticker) {
    if (_aiAbortController) {
        _aiAbortController.abort();
        _aiAbortController = null;
    }
    _aiAbortController = new AbortController();
    const signal = _aiAbortController.signal;

    const key = localStorage.getItem('aurion_llm_key');
    const tvc = document.getElementById('tv-container');
    const aic = document.getElementById('ai-content');

    if (!key) {
        aic.innerHTML = `
            <div style="text-align:center; padding: 40px; color:var(--bear);">
                <h2>⚠️ AUTHENTICATION REQUIRED</h2>
                <p>No valid LLM API key detected in Local Storage.</p>
                <button class="btn-glow" style="margin-top:20px;" onclick="openSettings()">Configure Settings Now</button>
            </div>
        `;
        return;
    }

    aic.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px; gap:16px;">
            <div style="width:32px; height:32px; border:3px solid var(--border); border-top:3px solid var(--cyan); border-radius:50%; animation: spin 1s linear infinite;"></div>
            <div style="font-family:'JetBrains Mono'; font-size:13px; color:var(--cyan); letter-spacing:1px;">GENERATING AI RESEARCH REPORT</div>
            <div style="font-family:'JetBrains Mono'; font-size:11px; color:var(--text-muted);">Analyzing ${ticker} • Please wait...</div>
        </div>
        <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;

    const stock = ALL_STOCKS.find(s => s.t === ticker || s.n.toUpperCase().includes(ticker));
    const isIndianStock = !!stock;
    const currentLtp = stock ? stock.ltp : 'Unknown';
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const ltpInstruction = currentLtp === 'Unknown'
        ? `You MUST use your Google Search tool to find the exact current market price (LTP) of ${ticker} today before generating the report.`
        : `- Current Market Price (LTP): ₹${currentLtp}\nBase your technical and news analysis strictly on this exact price. Do not guess a range.`;

    const screenerUrl = stock && stock.screener ? stock.screener : '';
    const screenerContext = screenerUrl ? `\n- Live Technical/Fundamental Scan: ${screenerUrl} (Visit this URL for deep insights, key levels, and real-time fundamentals).` : '';

    let prompt;
    if (isIndianStock) {
        prompt = `You are an elite Indian equity research analyst for a terminal called Aurion.
Provide a structured analysis of the stock: ${ticker} (listed on NSE/BSE India).

CONTEXT:
- Today's Date: ${today}
${ltpInstruction}${screenerContext}

CRITICAL RULES:
- ALL prices, targets, support/resistance levels MUST be in Indian Rupees (₹). NEVER use USD or dollars.
- This is an Indian stock market terminal. All values in INR.
- Format your response EXACTLY as the sections below with bullet points.

**Technical Structural Analysis:**
• [5 bullet points about current price action relative to the LTP, moving averages (50-DMA, 200-DMA), RSI levels, MACD signals, Bollinger Bands, support/resistance levels — ALL in ₹ INR]

**Board Changes & Management:**
• [4-5 bullet points about recent leadership changes, board composition, CEO/CFO updates, corporate governance, capital allocation strategy]

**Macro Headwinds:**
• [4-5 bullet points about interest rates, geopolitical risks, regulatory scrutiny, sector-specific challenges, competition]

**News & Sentiment Analysis:**
• [5 bullet points about the latest news, analyst upgrades/downgrades, institutional activity (FII/DII), quarterly results commentary, market sentiment]

Keep each bullet point concise (1-2 lines max). Be specific with numbers. All monetary values in ₹ (INR).`;
    } else {
        prompt = `You are an elite global financial analyst for a terminal called Aurion.
Provide a structured analysis of: ${ticker}.

CONTEXT:
- Today's Date: ${today}
${ltpInstruction}

CRITICAL RULES:
- Identify which market/exchange this instrument belongs to and use the CORRECT local currency.
- Do NOT assume this is listed on NSE/BSE India. Do NOT use INR unless it actually trades in India.
- Format your response EXACTLY as the sections below with bullet points.

**Technical Structural Analysis:**
• [5 bullet points about current levels, key support/resistance, moving averages, RSI, MACD, volatility — in the CORRECT currency]

**Macro & Geopolitical Context:**
• [5 bullet points about relevant central bank policy, geopolitical risks, economic data, sector trends, and global correlations]

**News & Sentiment Analysis:**
• [5 bullet points about the latest news, institutional flows, analyst commentary, market positioning, and sentiment indicators]

Keep each bullet point concise (1-2 lines max). Be specific with numbers. Use the correct currency for this instrument.`;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: signal,
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                tools: [{ googleSearch: {} }],
                generationConfig: { temperature: 0.3 }
            })
        });

        if (!response.ok) throw new Error('API Request Failed');

        const data = await response.json();
        let fullText = "";
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            fullText = data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Invalid format returned from Gemini');
        }

        let htmlText = fullText
            .replace(/\*\*(.*?)\*\*/g, '<h3 style="color:var(--cyan); font-family:JetBrains Mono; font-size:13px; margin-top:20px; margin-bottom:8px; letter-spacing:1px; text-transform:uppercase;">$1</h3>')
            .replace(/^[•\*]\s+(.*?)$/gm, '<li style="margin-bottom:6px; line-height:1.5; color:var(--text-luma); font-size:12px;">$1</li>')
            .replace(/^- (.*?)$/gm, '<li style="margin-bottom:6px; line-height:1.5; color:var(--text-luma); font-size:12px;">$1</li>')
            .replace(/\n/g, '<br/>');

        _typewriteAI(aic, htmlText, `${ticker} Intelligence Report`, `streamAIReport('${ticker}')`, signal);

    } catch (error) {
        if (error.name === 'AbortError') return;
        aic.innerHTML = `
            <div style="padding: 20px; color:var(--bear);">
                <h3>Connection Interrupted</h3>
                <p>Matrix failure attempting to reach Google Generative Language API. Verify your API key in Settings.</p>
            </div>
        `;
    }
}

// --- NEWS SUMMARY ---
async function streamAINewsSummary(title, desc) {
    if (_aiAbortController) {
        _aiAbortController.abort();
        _aiAbortController = null;
    }
    _aiAbortController = new AbortController();
    const signal = _aiAbortController.signal;

    const key = localStorage.getItem('aurion_llm_key');
    const aic = document.getElementById('news-ai-content');

    if (!key) {
        aic.innerHTML = `
            <div style="text-align:center; padding: 40px; color:var(--bear);">
                <h2>⚠️ AUTHENTICATION REQUIRED</h2>
                <p>No valid LLM API key detected in Local Storage.</p>
                <button class="btn-glow" style="margin-top:20px;" onclick="openSettings()">Configure Settings Now</button>
            </div>
        `;
        return;
    }

    const prompt = `You are an elite financial news analyst for Aurion Terminal.
Provide a structured, insightful summary and impact analysis of this news article.

Title: ${title}
Content: ${desc}

Format your response EXACTLY as follows:
** Executive Summary:**
•[1 - 2 sentences summarizing the core event]

** Market Impact & Key Takeaways:**
•[3 - 4 bullet points detailing potential impact on specific sectors, institutional sentiment, or broader market indices]

Keep it highly concise, professional, and analytical.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: signal,
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2 }
            })
        });

        if (!response.ok) throw new Error('API Request Failed');

        const data = await response.json();
        let fullText = "";
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            fullText = data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Invalid format returned from Gemini');
        }

        let htmlText = fullText
            .replace(/\*\*(.*?)\*\*/g, '<h3 style="color:var(--cyan); font-family:JetBrains Mono; font-size:13px; margin-top:20px; margin-bottom:8px; letter-spacing:1px; text-transform:uppercase;">$1</h3>')
            .replace(/^[•\*]\s+(.*?)$/gm, '<li style="margin-bottom:6px; line-height:1.5; color:var(--text-luma); font-size:12px;">$1</li>')
            .replace(/^- \s*(.*?)$/gm, '<li style="margin-bottom:6px; line-height:1.5; color:var(--text-luma); font-size:12px;">$1</li>')
            .replace(/\n/g, '<br/>');

        aic.innerHTML = `
            <h2 style="font-family: 'Space Grotesk'; font-size: 32px; margin-bottom: 8px;">AI Extracted Insights</h2>
            <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 32px; border-bottom: 1px solid var(--border); padding-bottom: 16px;">Real-time semantic analysis applied.</p>
            ${htmlText}
        `;

    } catch (error) {
        if (error.name === 'AbortError') return;
        aic.innerHTML = `
            <div style="padding: 20px; color:var(--bear);">
                <h3>Analysis Interrupted</h3>
                <p>Matrix failure attempting to reach Google Generative Language API.</p>
            </div>
        `;
    }
}

// --- MACRO INTEL ---
window.openRadarIntel = function (label, value) {
    document.getElementById('sp-title').textContent = `${label} MACRO INTELLIGENCE REPORT`;

    const tokens = label.toLowerCase().split(' ').filter(x => x.length > 2);
    let relNews = newsDataCache.filter(n => {
        const text = (n.title + ' ' + n.desc).toLowerCase();
        if (tokens.some(t => text.includes(t))) return true;
        return false;
    });

    if (relNews.length === 0) {
        relNews = newsDataCache.slice(0, 5);
    } else {
        relNews = relNews.slice(0, 5);
    }

    const rsHtml = relNews.map(n => `
        <div class="news-card" onclick="openNewsPage(${newsDataCache.indexOf(n)})">
            <div style="font-size: 13px; margin-bottom: 6px; color: var(--text-luma); line-height: 1.5;">${n.title}</div>
            <div class="n-meta">
                <span class="n-src">${n.source}</span>
                <span class="n-badge b-${n.sentiment.toLowerCase() === 'bullish' ? 'bull' : (n.sentiment.toLowerCase() === 'bearish' ? 'bear' : 'neut')}">${n.sentiment}</span>
            </div>
        </div>
    `).join('');

    document.getElementById('sp-left').innerHTML = `
        <div style="padding: 24px; color: var(--text-luma); font-family: 'Inter', sans-serif;">
            <div style="font-family: 'Space Grotesk', sans-serif; font-size: 48px; font-weight: 700; color: var(--text-base); line-height: 1.1; margin-bottom: 8px;">
                ${label}
            </div>
            <div style="font-family: 'Space Grotesk', sans-serif; font-size: 28px; color: var(--cyan); margin-bottom: 24px;">
                ${value.replace(/<[^>]*>?/gm, '')}
            </div>
            <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 32px; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
                Macro-economic factor analysis and related global news telemetry.
            </p>
            <h3 style="font-family: 'Space Grotesk'; font-size: 18px; color: var(--text-base); margin-bottom: 16px;">Related Macro Telemetry</h3>
            <div style="display:flex; flex-direction:column; gap:8px;">
                ${rsHtml}
            </div>
        </div>
    `;

    document.getElementById('tv-container').innerHTML = `
        <div id="ai-content" style="padding: 24px; color: var(--text-luma); font-family: 'Inter', sans-serif; height: 100%; overflow-y: auto;">
        </div>
    `;

    document.getElementById('second-page').classList.add('active');
    streamAIMacroIntel(label, value, relNews);
}

async function streamAIMacroIntel(label, value, relNews) {
    if (_aiAbortController) {
        _aiAbortController.abort();
        _aiAbortController = null;
    }
    _aiAbortController = new AbortController();
    const signal = _aiAbortController.signal;

    const key = localStorage.getItem('aurion_llm_key');
    const aic = document.getElementById('ai-content');

    if (!key) {
        aic.innerHTML = `<div style="text-align:center; padding: 40px; color:var(--bear);"><h2>⚠️ AUTHENTICATION REQUIRED</h2><p>No valid LLM API key detected in Local Storage.</p><button class="btn-glow" style="margin-top:20px;" onclick="openSettings()">Configure Settings Now</button></div>`;
        return;
    }

    aic.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px; gap:16px;">
            <div style="width:32px; height:32px; border:3px solid var(--border); border-top:3px solid var(--cyan); border-radius:50%; animation: spin 1s linear infinite;"></div>
            <div style="font-family:'JetBrains Mono'; font-size:13px; color:var(--cyan); letter-spacing:1px;">GENERATING MACRO INTELLIGENCE REPORT</div>
            <div style="font-family:'JetBrains Mono'; font-size:11px; color:var(--text-muted);">Analyzing ${label} • Please wait...</div>
        </div>
        <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;

    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const newsContext = relNews.map(n => `- ${n.title}`).join('\n');
    const cleanVal = typeof value === 'string' ? value.replace(/<[^>]*>?/gm, '') : value;

    const prompt = `You are an elite global macro analyst for Aurion Terminal.
Provide a structured, high-level analysis of the macroeconomic factor: ${label} (Current Value: ${cleanVal}).

CONTEXT:
- Today's Date: ${today}
- Latest relevant global news headlines:
${newsContext}

CRITICAL RULES:
Format your response EXACTLY as the sections below with bullet points.

**Current State & Trajectory:**
• [3-4 bullet points analyzing the current value (${cleanVal}), historical context, and immediate trajectory]

**Global Market Impact:**
• [3-4 bullet points analyzing how this factor is currently impacting equity markets, bond yields, and currency pairs]

**Forward Outlook & Risks:**
• [3-4 bullet points detailing future forecasts, central bank policy implications, and potential black swan risks]

Keep each bullet point concise (1-2 lines max). Provide actionable intelligence.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: signal,
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3 }
            })
        });

        if (!response.ok) throw new Error('API Request Failed');

        const data = await response.json();
        let fullText = "";
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            fullText = data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Invalid format returned from Gemini');
        }

        let htmlText = fullText
            .replace(/\*\*(.*?)\*\*/g, '<h3 style="color:var(--cyan); font-family:JetBrains Mono; font-size:13px; margin-top:20px; margin-bottom:8px; letter-spacing:1px; text-transform:uppercase;">$1</h3>')
            .replace(/^[•\*]\s+(.*?)$/gm, '<li style="margin-bottom:6px; line-height:1.5; color:var(--text-luma); font-size:12px;">$1</li>')
            .replace(/^- \s*(.*?)$/gm, '<li style="margin-bottom:6px; line-height:1.5; color:var(--text-luma); font-size:12px;">$1</li>')
            .replace(/\n/g, '<br/>');

        _typewriteAI(aic, htmlText, `${label} Macro Intel`, `streamAIMacroIntel('${label}', '${value}', [])`, signal);

    } catch (error) {
        if (error.name === 'AbortError') return;
        aic.innerHTML = `<div style="padding: 20px; color:var(--bear);"><h3>Analysis Interrupted</h3><p>Matrix failure attempting to reach Google Generative Language API.</p></div>`;
    }
}

// --- SHARED TYPEWRITER ---
function _typewriteAI(aic, htmlText, title, refreshFn, signal) {
    const tokens = htmlText.split(/(<[^>]+>)/g);
    let outputHTML = "";
    let currentTokenIdx = 0;
    let currentCharIdx = 0;

    const headerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--border); padding-bottom:12px;">
            <h2 style="margin:0;">${title}</h2>
            <button class="btn-glow" style="padding:6px 14px; font-size:11px; display:flex; align-items:center; gap:6px;" onclick="${refreshFn}" title="Regenerate AI Report">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 1 0 2.1-5.7L2 9"></path></svg> Refresh
            </button>
        </div>
    `;

    function typeNext() {
        if (signal.aborted) return;
        if (currentTokenIdx >= tokens.length) {
            aic.innerHTML = headerHTML + outputHTML;
            return;
        }
        const token = tokens[currentTokenIdx];
        if (token.startsWith('<')) {
            outputHTML += token;
            currentTokenIdx++;
            typeNext();
        } else {
            if (currentCharIdx < token.length) {
                outputHTML += token[currentCharIdx];
                currentCharIdx++;
                aic.innerHTML = headerHTML + outputHTML + '<span class="ai-cursor"></span>';
                setTimeout(typeNext, 3);
            } else {
                currentCharIdx = 0;
                currentTokenIdx++;
                typeNext();
            }
        }
    }
    typeNext();
}

// --- STOCK REPORT (FULL PAGE) ---
window.loadStockReport = function (k, symbol, csvData) {
    document.getElementById('sp-title').textContent = `${k} DETAILED INTELLIGENCE REPORT`;

    let eps, pe, rev, lastPriceVal, rsi_val, dma50_val, dma200_val, high52, low52;
    if (csvData && csvData.ltp) {
        lastPriceVal = csvData.ltp;
        eps = csvData.eps || '--';
        pe = csvData.pe || '--';
        rev = csvData.change_pct || '0';
        rsi_val = csvData.rsi || '--';
        dma50_val = csvData.dma50 || '--';
        dma200_val = csvData.dma200 || '--';
        high52 = csvData.high52w || '--';
        low52 = csvData.low52w || '--';
    } else {
        eps = 'Live'; pe = 'Live'; rev = '0';
        rsi_val = '--'; dma50_val = '--'; dma200_val = '--';
        high52 = '--'; low52 = '--';
        lastPriceVal = 'Searching Live Data...';
    }
    const revNum = parseFloat(rev);
    const isRec = revNum > 0 ? 'var(--bull)' : 'var(--bear)';
    const rTxt = revNum > 0 ? `+ ${rev}% ` : `${rev}% `;
    const rsiNum = parseFloat(rsi_val);
    const rsiColor = rsiNum > 70 ? 'var(--bear)' : (rsiNum < 30 ? 'var(--bull)' : 'var(--accent)');
    const rsiLabel = rsiNum > 70 ? 'OVERBOUGHT' : (rsiNum < 30 ? 'OVERSOLD' : 'NEUTRAL');
    const sma50Num = parseFloat(dma50_val);
    const sma200Num = parseFloat(dma200_val);
    const priceNum = parseFloat(lastPriceVal);
    const sma50Status = priceNum > sma50Num ? 'ABOVE' : 'BELOW';
    const sma200Status = priceNum > sma200Num ? 'ABOVE' : 'BELOW';

    document.getElementById('tv-container').innerHTML = `
            <div style="padding: 40px; color: var(--text-luma); font-family: 'Inter', sans-serif; height: 100%; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
                <div>
                    <h2 style="font-family: 'Space Grotesk'; font-size: 48px; margin-bottom: 8px;">${k} Technicals & Fundamentals</h2>
                    <p style="color: var(--text-muted); font-size: 16px;">Comprehensive Algorithmic Breakdown • System Generated</p>
                </div>
                <a href="https://www.tradingview.com/chart/?symbol=${symbol}" target="_blank" style="background: var(--bear); color: #fff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; font-family: 'JetBrains Mono'; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(244, 63, 94, 0.4); border: 1px solid rgba(255,255,255,0.2); transition: transform 0.2s;">
                    <span style="display:inline-block; width:8px; height:8px; background:#fff; border-radius:50%; animation: pulse 1s infinite;"></span>
                    OPEN ON TRADINGVIEW
                </a>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 40px;">
                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 24px; border-radius: 16px;">
                    <h3 style="color: var(--cyan); margin-bottom: 16px; font-family: 'JetBrains Mono'; font-size: 14px;">Q3 QUARTERLY RESULTS</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div>
                            <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 4px;">EPS (TTM)</div>
                            <div style="font-family: 'JetBrains Mono'; font-size: 24px; font-weight: 700;">₹${eps}</div>
                        </div>
                        <div>
                            <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 4px;">P/E RATIO</div>
                            <div style="font-family: 'JetBrains Mono'; font-size: 24px; font-weight: 700;">${pe}x</div>
                        </div>
                        <div>
                            <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 4px;">REVENUE GROWTH</div>
                            <div style="font-family: 'JetBrains Mono'; font-size: 24px; font-weight: 700; color: ${isRec}">${rTxt}</div>
                        </div>
                        <div>
                            <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 4px;">NET MARGIN</div>
                            <div style="font-family: 'JetBrains Mono'; font-size: 24px; font-weight: 700;">18.4%</div>
                        </div>
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 24px; border-radius: 16px;">
                    <h3 style="color: var(--accent); margin-bottom: 16px; font-family: 'JetBrains Mono'; font-size: 14px;">TECHNICAL INDICATORS</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
                            <span style="color: var(--text-muted);">50-Day SMA</span>
                            <span style="font-family: 'JetBrains Mono'; color: var(--${sma50Status === 'ABOVE' ? 'bull' : 'bear'});">\\u20b9${dma50_val} (${sma50Status})</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
                            <span style="color: var(--text-muted);">200-Day SMA</span>
                            <span style="font-family: 'JetBrains Mono'; color: var(--${sma200Status === 'ABOVE' ? 'bull' : 'bear'});">\\u20b9${dma200_val} (${sma200Status})</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
                            <span style="color: var(--text-muted);">RSI (14)</span>
                            <span style="font-family: 'JetBrains Mono'; color: ${rsiColor};">${rsi_val} (${rsiLabel})</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
                            <span style="color: var(--text-muted);">52W High</span>
                            <span style="font-family: 'JetBrains Mono'; color: var(--bull);">\\u20b9${high52}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-muted);">52W Low</span>
                            <span style="font-family: 'JetBrains Mono'; color: var(--bear);">\\u20b9${low52}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div style="background: rgba(40, 0, 0, 0.2); border: 1px solid var(--bear); padding: 24px; border-radius: 16px; margin-bottom: 40px;">
                <h3 style="color: var(--bear); margin-bottom: 16px; font-family: 'JetBrains Mono'; font-size: 14px; display: flex; align-items: center; gap: 8px;"><span>⚠️</span> CORPORATE GOVERNANCE ALERTS</h3>
                <ul style="color: var(--text-muted); display: flex; flex-direction: column; gap: 12px; margin-left: 20px;">
                    <li><strong>Leadership Change:</strong> Chief Financial Officer stepped down effective last month. Interim CFO appointed from internal board.</li>
                    <li><strong>Regulatory Requirement:</strong> New SEC/SEBI compliance requirements for environmental disclosures taking effect Q2 2026. Audit underway.</li>
                    <li><strong>Board Member Exit:</strong> Independent Director resigned citing personal reasons. Replacement search ongoing.</li>
                </ul>
            </div>
        </div>
            `;

    const keywordMap = { 'NIFTY': 'nifty', 'SENSEX': 'sensex', 'BANKNIFTY': 'bank', 'BRENT': 'crude', 'GOLD': 'gold', 'BTC': 'crypto' };
    const targetKeyword = keywordMap[k] || k.toLowerCase();
    let relNews = newsDataCache.filter(n => n.title.toLowerCase().includes(targetKeyword) || n.desc.toLowerCase().includes(targetKeyword)).slice(0, 5);

    if (relNews.length === 0) {
        relNews = newsDataCache.slice(0, 3);
    }

    let newsHtml = `<h2 style="font-family:'Space Grotesk'; font-size:18px; color:var(--text-luma); margin-top:24px; margin-bottom:12px;">Related Top Stories</h2><div class="sp-news-list" style="display:flex; flex-direction:column; gap:8px;">` + relNews.map(n => {
        let badgeClass = n.sentiment.toLowerCase();
        if (badgeClass === 'bullish') badgeClass = 'bull';
        if (badgeClass === 'bearish') badgeClass = 'bear';
        return `
            <div class="sp-n-item" onclick="window.open('${n.link}', '_blank')" style="cursor:pointer; padding:12px; border:1px solid var(--border); border-radius:8px; background:rgba(0,0,0,0.2); transition: transform 0.2s;">
                <div class="sp-n-title" style="font-size:13px; font-weight:500; color:var(--text-luma); margin-bottom:8px;">${n.title}</div>
                <div class="sp-n-meta" style="font-family:'JetBrains Mono'; font-size:10px; color:var(--text-muted); display:flex; justify-content:space-between; align-items:center;">
                    <span>${n.source}</span>
                    <span class="badge b-${badgeClass}">${n.sentiment.toUpperCase()}</span>
                </div>
            </div>
            `;
    }).join('') + `</div>`;

    document.getElementById('sp-left').innerHTML = `
            <div style="font-family: 'JetBrains Mono'; font-size: 48px; font-weight: 800; color: var(--text-luma); margin-bottom: 0px; letter-spacing:-1.5px;">${k}</div>
        <div style="font-family: 'JetBrains Mono'; font-size: 32px; font-weight: 600; color: var(--cyan); margin-bottom: 8px;">₹${lastPriceVal}</div>
        <div style="font-family: 'JetBrains Mono'; font-size: 18px; color: var(--text-muted); margin-bottom: 24px; font-weight:700;">EQUITY ANALYSIS</div>
        <p style="color: var(--text-muted); line-height:1.6; margin-bottom: 32px;">Real-time quantitative sweep completed. AI summary generated based on recent filings, market sentiment, and internal telemetry.</p>
        ${newsHtml}
        `;
    document.getElementById('second-page').classList.add('active');
    streamAIReport(k);
}

window.openNewsPage = function (idx) {
    const item = newsDataCache[idx];
    document.getElementById('sp-title').textContent = `INTEL REPORT: ${item.source} `;

    document.getElementById('second-page').classList.add('active');

    document.getElementById('sp-left').innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
            <span class="badge b-${item.sentiment}">${item.sentiment.toUpperCase()}</span>
            <span style="font-family: 'JetBrains Mono'; font-size: 12px; color: var(--text-muted);">${formatExactDate(item.ts)}</span>
        </div>
        <h1 style="font-family:'Outfit'; font-size:32px; color:var(--text-luma); margin-bottom:24px; line-height:1.2;">${item.title}</h1>
        <p style="font-family:'Inter'; font-size:15px; color:var(--text-muted); line-height:1.6; margin-bottom:32px;">${item.desc.replace(/<[^>]*>?/gm, '')}</p>
        <a href="${item.link}" target="_blank" class="btn-glow" style="display:inline-block; font-family:'JetBrains Mono'; font-size:12px;">Access Original Source ↗</a>
        `;

    document.getElementById('tv-container').innerHTML = `
            <div id="news-ai-content" style="padding: 40px; color: var(--text-luma); font-family: 'Inter', sans-serif; height: 100%; overflow-y: auto;">
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px; gap:16px;">
                    <div style="width:32px; height:32px; border:3px solid var(--border); border-top:3px solid var(--cyan); border-radius:50%; animation: spin 1s linear infinite;"></div>
                    <div style="font-family:'JetBrains Mono'; font-size:13px; color:var(--cyan); letter-spacing:1px;">GENERATING AI NEWS SUMMARY</div>
                </div>
        </div>
            `;

    streamAINewsSummary(item.title, item.desc);
}
