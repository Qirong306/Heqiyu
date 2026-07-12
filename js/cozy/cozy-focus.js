// ==================== 暖屋专注弹幕（补充引擎） ====================

// 注：核心功能已在 cozy-space.js 中实现
// 此文件主要提供外部调用接口和定时自动弹幕

// ==================== 外部发送弹幕接口 ====================

function sendCozyDanmakuExternal(text, from) {
    if (!text || !text.trim()) return;
    
    // 如果暖屋开着，直接显示
    var overlay = document.getElementById('cozyOverlay');
    if (overlay && overlay.classList.contains('show')) {
        showCozyDanmaku(text, from || 'other');
    }
    
    // 存储到历史
    addCozyDanmaku(text, from || 'other');
}

// ==================== 对方自动弹幕（定时） ====================

function cozyOtherAutoDanmaku() {
    if (Math.random() > 0.04) return;
    
    var replies = getAllReplies();
    if (replies.length === 0) return;
    
    var text = replies[Math.floor(Math.random() * replies.length)];
    
    // 如果暖屋开着，显示
    var overlay = document.getElementById('cozyOverlay');
    if (overlay && overlay.classList.contains('show')) {
        showCozyDanmaku(text, 'other');
    }
    
    addCozyDanmaku(text, 'other');
}

// 每 15 秒检查一次（在 cozy-space.js 中已有循环）
// 这里额外加一个独立的，防止主循环未启动

setInterval(function() {
    cozyOtherAutoDanmaku();
}, 15000);

// ==================== 清空弹幕历史 ====================

function clearCozyDanmakuHistory() {
    appData.cozyRoom.focus.danmaku = [];
    saveData();
    showToast('弹幕历史已清空');
}

// ==================== 导入到全局 ====================

window.sendCozyDanmakuExternal = sendCozyDanmakuExternal;
window.clearCozyDanmakuHistory = clearCozyDanmakuHistory;

console.log('暖屋专注弹幕已加载');
