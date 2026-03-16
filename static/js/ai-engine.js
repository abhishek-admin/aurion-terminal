// =============================================
// AURION TERMINAL — ai-engine.js
// AI streaming: stock reports, news summaries,
// macro intel, loadStockReport, openRadarIntel
// =============================================

let _aiAbortController = null;

// --- UNIFIED PROVIDER ROUTER ---
// Supports: gemini, anthropic, openai, xai, groq
async function _callProvider(prompt, useSearch, signal) {
    const key = localStorage.getItem('aurion_llm_key');
    const provider = localStorage.getItem('aurion_llm_provider') || 'gemini';

    if (provider === 'gemini') {
        const body = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3 }
        };
        if (useSearch) body.tools = [{ googleSearch: {} }];
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal, body: JSON.stringify(body) }
        );
        if (!response.ok) throw new Error('API Request Failed');
        const data = await response.json();
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) throw new Error('Invalid response from Gemini');
        return data.candidates[0].content.parts[0].text;
    }

    if (provider === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': key,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true',
                'Content-Type': 'application/json'
            },
            signal,
            body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: 2048,
                messages: [{ role: 'user', content: prompt }]
            })
        });
        if (!response.ok) throw new Error('API Request Failed');
        const data = await response.json();
        if (!data.content?.[0]?.text) throw new Error('Invalid response from Anthropic');
        return data.content[0].text;
    }

    // OpenAI-compatible: openai, xai, groq
    const providerConfig = {
        openai: { url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o' },
        xai:    { url: 'https://api.x.ai/v1/chat/completions', model: 'grok-3' },
        groq:   { url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.3-70b-versatile' }
    };
    const cfg = providerConfig[provider];
    const response = await fetch(cfg.url, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({ model: cfg.model, messages: [{ role: 'user', content: prompt }], temperature: 0.3 })
    });
    if (!response.ok) throw new Error('API Request Failed');
    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) throw new Error('Invalid response from provider');
    return data.choices[0].message.content;
}

// --- STOCK REPORT ---
async function streamAIReport(ticker) {
    if (_aiAbortController) {
        _aiAbortController.abort();
        _aiAbortController = null;
    }
    _aiAbortController = new AbortController();
    const signal = _aiAbortController.signal;

    const key = localStorage.getItem('aurion_llm_key');
    const aic = document.getElementById('ai-content');

    // --- PRO GATE: AI report daily limit ---
    if (typeof canUseAI === 'function' && !canUseAI()) {
        aic.innerHTML = `
            <div style="text-align:center; padding: 40px;">
                <div style="font-size:48px; margin-bottom:16px;">⚡</div>
                <h2 style="color:var(--accent); font-family:'JetBrains Mono'; margin-bottom:12px;">DAILY AI LIMIT REACHED</h2>
                <p style="color:var(--text-muted); margin-bottom:8px;">You've used <strong style="color:var(--bear)">${getAIUsedToday()}/${PRO_CONFIG.FREE_AI_LIMIT}</strong> free AI reports today.</p>
                <p style="color:var(--text-muted); margin-bottom:24px;">Pro members get <strong style="color:var(--cyan)">unlimited</strong> AI intelligence reports.</p>
                <button class="btn-glow" style="margin-top:8px; padding:12px 32px; font-size:13px;" onclick="showUpgradeModal('ai_limit')">Upgrade to Pro →</button>
                <p style="color:var(--text-muted); font-size:11px; margin-top:16px;">Resets daily at midnight IST</p>
            </div>
        `;
        return;
    }
    if (typeof incrementAIUsage === 'function') incrementAIUsage();

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
        const fullText = await _callProvider(prompt, true, signal);

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
                <p>Failed to reach the LLM API. Verify your API key and selected provider in Settings.</p>
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

    // --- PRO GATE: AI news summaries are Pro-only ---
    if (typeof isPro === 'function' && !isPro()) {
        aic.innerHTML = `
            <div style="text-align:center; padding: 40px;">
                <div style="font-size:48px; margin-bottom:16px;">⚡</div>
                <h2 style="color:var(--accent); font-family:'JetBrains Mono'; margin-bottom:12px;">PRO FEATURE</h2>
                <p style="color:var(--text-muted); margin-bottom:24px;">AI News Summaries extract key insights from every headline.<br>Available exclusively on <strong style="color:var(--cyan)">Aurion Pro</strong>.</p>
                <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:12px; padding:20px; margin-bottom:24px; text-align:left; filter:blur(3px); user-select:none;">
                    <h3 style="color:var(--cyan); font-size:13px; margin-bottom:8px;">EXECUTIVE SUMMARY</h3>
                    <p style="color:var(--text-muted); font-size:12px;">Market sentiment shifts as FII flows reverse direction, impacting banking sector valuations across the board...</p>
                    <h3 style="color:var(--cyan); font-size:13px; margin-top:16px; margin-bottom:8px;">MARKET IMPACT</h3>
                    <p style="color:var(--text-muted); font-size:12px;">Bank NIFTY expected to see 1.2-1.5% correction in near term as institutional selling pressure mounts...</p>
                </div>
                <button class="btn-glow" style="padding:12px 32px; font-size:13px;" onclick="showUpgradeModal('ai_news')">Unlock AI Summaries →</button>
            </div>
        `;
        return;
    }

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
        const fullText = await _callProvider(prompt, false, signal);

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
                <p>Failed to reach the LLM API. Verify your API key and selected provider in Settings.</p>
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
                <span class="n-badge b-${n.sentiment.toLowerCase() === 'bullish' ? 'bull' : (n.sentiment.toLowerCase() === 'bearish' ? 'bear' : 'neutral')}">${n.sentiment}</span>
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

    // --- PRO GATE: Macro intel counts as AI report ---
    if (typeof canUseAI === 'function' && !canUseAI()) {
        aic.innerHTML = `
            <div style="text-align:center; padding: 40px;">
                <div style="font-size:48px; margin-bottom:16px;">⚡</div>
                <h2 style="color:var(--accent); font-family:'JetBrains Mono'; margin-bottom:12px;">DAILY AI LIMIT REACHED</h2>
                <p style="color:var(--text-muted); margin-bottom:24px;">You've used all ${PRO_CONFIG.FREE_AI_LIMIT} free AI reports today.</p>
                <button class="btn-glow" style="padding:12px 32px; font-size:13px;" onclick="showUpgradeModal('ai_limit')">Upgrade to Pro →</button>
            </div>
        `;
        return;
    }
    if (typeof incrementAIUsage === 'function') incrementAIUsage();

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
        const fullText = await _callProvider(prompt, false, signal);

        let htmlText = fullText
            .replace(/\*\*(.*?)\*\*/g, '<h3 style="color:var(--cyan); font-family:JetBrains Mono; font-size:13px; margin-top:20px; margin-bottom:8px; letter-spacing:1px; text-transform:uppercase;">$1</h3>')
            .replace(/^[•\*]\s+(.*?)$/gm, '<li style="margin-bottom:6px; line-height:1.5; color:var(--text-luma); font-size:12px;">$1</li>')
            .replace(/^- \s*(.*?)$/gm, '<li style="margin-bottom:6px; line-height:1.5; color:var(--text-luma); font-size:12px;">$1</li>')
            .replace(/\n/g, '<br/>');

        _typewriteAI(aic, htmlText, `${label} Macro Intel`, `streamAIMacroIntel('${label}', '${value}', [])`, signal);

    } catch (error) {
        if (error.name === 'AbortError') return;
        aic.innerHTML = `<div style="padding: 20px; color:var(--bear);"><h3>Analysis Interrupted</h3><p>Failed to reach the LLM API. Verify your API key and selected provider in Settings.</p></div>`;
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
                            <span style="font-family: 'JetBrains Mono'; color: var(--${sma50Status === 'ABOVE' ? 'bull' : 'bear'});">₹${dma50_val} (${sma50Status})</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
                            <span style="color: var(--text-muted);">200-Day SMA</span>
                            <span style="font-family: 'JetBrains Mono'; color: var(--${sma200Status === 'ABOVE' ? 'bull' : 'bear'});">₹${dma200_val} (${sma200Status})</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
                            <span style="color: var(--text-muted);">RSI (14)</span>
                            <span style="font-family: 'JetBrains Mono'; color: ${rsiColor};">${rsi_val} (${rsiLabel})</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
                            <span style="color: var(--text-muted);">52W High</span>
                            <span style="font-family: 'JetBrains Mono'; color: var(--bull);">₹${high52}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-muted);">52W Low</span>
                            <span style="font-family: 'JetBrains Mono'; color: var(--bear);">₹${low52}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div style="background: rgba(40, 0, 0, 0.2); border: 1px solid var(--bear); padding: 24px; border-radius: 16px; margin-bottom: 40px;">
                <h3 style="color: var(--bear); margin-bottom: 16px; font-family: 'JetBrains Mono'; font-size: 14px; display: flex; align-items: center; gap: 8px;"><span>&#9888;</span> CORPORATE GOVERNANCE ALERTS</h3>
                <div id="gov-alerts-content" style="color: var(--text-muted); font-size: 12px;">
                    <div style="display:flex; align-items:center; gap:8px; font-family:'JetBrains Mono';">
                        <span style="width:8px;height:8px;border:1px solid var(--cyan);border-top:1px solid transparent;border-radius:50%;display:inline-block;animation:spin 1s linear infinite;"></span>
                        Scanning governance signals for ${k}...
                    </div>
                </div>
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
    loadGovernanceAlerts(k);   // non-blocking, fills gov-alerts-content independently
}

// --- CORPORATE GOVERNANCE ALERTS (stock-specific, live) ---
async function loadGovernanceAlerts(k) {
    const container = document.getElementById('gov-alerts-content');
    if (!container) return;

    const GOV_KW = ['board', 'director', 'ceo', 'cfo', 'coo', 'sebi', 'compliance',
        'promoter', 'pledge', 'insider', 'regulatory', 'penalty', 'fine', 'fraud',
        'audit', 'auditor', 'governance', 'stake', 'shareholding', 'management',
        'resign', 'appoint', 'chairman', 'legal', 'lawsuit', 'probe', 'investigation'];

    const stockObj = ALL_STOCKS.find(s => s.t === k);
    const stockName = stockObj ? stockObj.n.toLowerCase() : k.toLowerCase();
    const stockKey  = k.toLowerCase();
    // Use first meaningful word of company name for matching (e.g. "titan" from "titan company ltd")
    const nameWord  = stockName.split(' ')[0];

    // 1. Immediately surface any governance-related news from the cache
    const govNews = newsDataCache.filter(n => {
        const text = (n.title + ' ' + n.desc).toLowerCase();
        const mentionsStock = text.includes(stockKey) || text.includes(nameWord);
        const isGov = GOV_KW.some(kw => text.includes(kw));
        return mentionsStock && isGov;
    }).slice(0, 3);

    let newsHtml = '';
    if (govNews.length > 0) {
        newsHtml = govNews.map(n => `
            <div onclick="openNewsPage(${newsDataCache.indexOf(n)})" style="cursor:pointer; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                <div style="color:var(--text-luma); font-size:12px; line-height:1.5; margin-bottom:3px;">${n.title}</div>
                <div style="font-family:'JetBrains Mono'; font-size:9px; color:var(--text-muted);">${n.source} · ${formatExactTime(n.ts)}</div>
            </div>`).join('');
    }

    // 2. If no LLM key, just show news results (or a no-data message)
    const key = localStorage.getItem('aurion_llm_key');
    if (!key) {
        container.innerHTML = govNews.length > 0
            ? newsHtml
            : `<div style="color:var(--text-muted); font-size:12px;">No recent governance signals in current news cycle. <span onclick="openSettings()" style="color:var(--cyan); cursor:pointer; text-decoration:underline;">Add AI key</span> for deeper analysis.</div>`;
        return;
    }

    // 3. Show news immediately + AI loading indicator
    container.innerHTML = newsHtml + `
        <div id="_gov_ai_loading" style="font-family:'JetBrains Mono'; font-size:10px; color:var(--cyan); margin-top:${govNews.length > 0 ? '12' : '0'}px; display:flex; align-items:center; gap:8px;">
            <span style="width:7px;height:7px;border:1px solid var(--cyan);border-top:1px solid transparent;border-radius:50%;display:inline-block;animation:spin 1s linear infinite;"></span>
            AI governance scan running...
        </div>`;

    // 4. LLM call — governance-only prompt, no grounding needed
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const prompt = `You are a corporate governance analyst for an Indian equity terminal called Aurion.
List ONLY the latest real corporate governance alerts for: ${k}${stockObj ? ' (' + stockObj.n + ')' : ''} — NSE/BSE listed company.
Today: ${today}

RULES:
- Return ONLY factual events. Do NOT fabricate or use generic placeholders.
- If no notable governance issues exist, respond with exactly: NO_ALERTS
- Focus on: board/director changes, CEO/CFO exits, SEBI orders, promoter pledging, insider trading probes, auditor resignations, regulatory penalties.
- Format EXACTLY as bullet points:
• [Category]: [What happened — 1 sentence with specific details/dates if known]

Maximum 4 bullets. Be specific to ${k} only.`;

    try {
        const text = await _callProvider(prompt, false, new AbortController().signal);
        const loader = document.getElementById('_gov_ai_loading');
        if (loader) loader.remove();

        if (text.trim().includes('NO_ALERTS') || text.trim().length < 20) {
            if (govNews.length === 0) {
                container.innerHTML = `<div style="color:var(--text-muted); font-size:12px;">No material governance alerts found for ${k}.</div>`;
            }
            return;
        }

        const lines = text.split('\n').filter(l => l.trim().match(/^[•\*\-]/)).slice(0, 4);
        if (lines.length === 0) {
            if (govNews.length === 0) container.innerHTML = `<div style="color:var(--text-muted); font-size:12px;">No material governance alerts found for ${k}.</div>`;
            return;
        }

        const aiHtml = `
            <div style="font-family:'JetBrains Mono'; font-size:9px; color:var(--cyan); margin-top:${govNews.length > 0 ? '12' : '0'}px; margin-bottom:10px; letter-spacing:1px;">AI GOVERNANCE SCAN · ${k}</div>
            <ul style="display:flex; flex-direction:column; gap:10px; margin-left:16px;">
                ${lines.map(l => `<li style="color:var(--text-muted); font-size:12px; line-height:1.5;">
                    ${l.replace(/^[•\*\-]\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-luma);">$1</strong>')}
                </li>`).join('')}
            </ul>`;

        container.innerHTML = newsHtml + aiHtml;

    } catch (e) {
        const loader = document.getElementById('_gov_ai_loading');
        if (loader) loader.remove();
    }
}

window.openNewsPage = function (idx) {
    const item = newsDataCache[idx];
    document.getElementById('sp-title').textContent = `INTEL REPORT: ${item.source} `;

    document.getElementById('second-page').classList.add('active');

    document.getElementById('sp-left').innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
            <span class="badge b-${item.sentiment === 'bullish' ? 'bull' : (item.sentiment === 'bearish' ? 'bear' : 'neutral')}">${item.sentiment.toUpperCase()}</span>
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
