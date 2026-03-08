// =============================================
// AURION TERMINAL — init.js
// Bootstrap: Initial data polls + refresh intervals
// =============================================

pollMarket(); pollNews(); pollSectors(); pollSentiment();
setInterval(pollMarket, 18000);
setInterval(pollNews, 60000);
setInterval(pollSectors, 30000);
setInterval(pollSentiment, 60000);

// --- SCROLL TO TOP BUTTONS ---
function initScrollTopBtn(scrollElId, btnId) {
    const el = document.getElementById(scrollElId);
    const btn = document.getElementById(btnId);
    if (!el || !btn) return;
    // Show after ~7 news items (~7 * ~42px = ~300px)
    el.addEventListener('scroll', () => {
        el.scrollTop > 300 ? btn.classList.add('visible') : btn.classList.remove('visible');
    });
}

initScrollTopBtn('news-pane', 'news-scroll-top');
initScrollTopBtn('sentiment-body', 'sentiment-scroll-top');
