// =============================================
// AURION TERMINAL — init.js
// Bootstrap: Initial data polls + refresh intervals
// =============================================

pollMarket(); pollNews(); pollSectors(); pollSentiment();
setInterval(pollMarket, 18000);
setInterval(pollNews, 60000);
setInterval(pollSectors, 30000);
setInterval(pollSentiment, 60000);
