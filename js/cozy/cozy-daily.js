// ==================== 暖屋每日奖励 ====================

// ==================== 打开每日奖励 ====================

function openCozyDaily() {
    var daily = getTodayReward();
    var isClaimed = daily.claimed;
    var reward = daily.todayReward || '温暖值 +5';
    
    var html = '<h3>每日奖励</h3>';
    html += '<div class="sub">每天一次，领取温暖值</div>';
    
    // 奖励展示
    html += '<div class="reward-display">';
    html += '<div class="text">今日奖励</div>';
    html += '<div style="font-size:28px;font-weight:bold;color:#e8a87c;margin:8px 0;">' + reward + '</div>';
    if (isClaimed) {
        html += '<div style="color:#8b7355;font-size:13px;">已领取 ✓</div>';
    } else {
        html += '<button onclick="claimDailyFromModal()" style="padding:8px 28px;border-radius:20px;border:none;background:#e8a87c;color:white;font-family:inherit;font-size:15px;cursor:pointer;margin-top:6px;">领取</button>';
    }
    html += '</div>';
    
    // 奖励池预览
    var pool = appData.cozyRoom.daily.pool || [];
    html += '<div style="font-size:12px;color:#8b7355;margin-top:8px;">奖励池：' + pool.join(' | ') + '</div>';
    
    html += '<button onclick="closeCozyModal()" style="margin-top:12px;padding:8px 24px;border-radius:20px;border:2px solid #e8d5c4;background:transparent;font-family:inherit;font-size:13px;cursor:pointer;color:#4a3728;">关闭</button>';
    
    openCozyModal(html);
}

// ==================== 领取奖励 ====================

function claimDailyFromModal() {
    if (claimDailyReward()) {
        // 刷新弹窗
        openCozyDaily();
        updateWarmthDisplay();
    }
}

// ==================== 导入到全局 ====================

window.openCozyDaily = openCozyDaily;
window.claimDailyFromModal = claimDailyFromModal;

console.log('暖屋每日奖励已加载');
