// ==================== 暖屋留言板 ====================

// ==================== 打开留言板 ====================

function openCozyMessages() {
    var messages = appData.cozyRoom.messages || [];
    
    var html = '<h3>暖屋留言</h3>';
    var subText = messages.length > 0 ? '共 ' + messages.length + ' 条留言' : '写下第一条留言吧';
    html += '<div class="sub">' + subText + '</div>';
    
    // 留言列表
    html += '<div class="msg-list">';
    if (messages.length === 0) {
        html += '<div style="text-align:center;color:#b8a99a;padding:20px;">还没有留言</div>';
    } else {
        // 倒序显示（最新的在前）
        var reversed = messages.slice().reverse();
        for (var i = 0; i < Math.min(reversed.length, 20); i++) {
            var msg = reversed[i];
            var fromLabel = msg.from === 'me' ? '我' : '对方';
            var timeStr = formatTimeShort(msg.time);
            html += '<div class="msg-item">' +
                '<span class="from">' + fromLabel + '</span>' +
                '<span class="time">' + timeStr + '</span>' +
                '<div style="margin-top:4px;">' + escapeHTML(msg.content) + '</div>' +
                '</div>';
        }
        if (messages.length > 20) {
            html += '<div style="text-align:center;color:#b8a99a;font-size:12px;padding:4px;">仅显示最近20条</div>';
        }
    }
    html += '</div>';
    
    // 输入框
    html += '<div style="display:flex;gap:6px;margin-top:8px;">' +
        '<input type="text" id="cozyMessageInput" placeholder="写留言..." maxlength="200" style="flex:1;padding:8px 14px;border:2px solid #e8d5c4;border-radius:16px;font-family:inherit;font-size:13px;background:white;outline:none;" onkeydown="if(event.key===\'Enter\')sendCozyMessage()">' +
        '<button onclick="sendCozyMessage()" style="padding:8px 18px;border-radius:16px;border:none;background:#e8a87c;color:white;font-family:inherit;font-size:13px;cursor:pointer;">发送</button>' +
        '</div>';
    
    html += '<button onclick="closeCozyModal()" style="margin-top:12px;padding:8px 24px;border-radius:20px;border:2px solid #e8d5c4;background:transparent;font-family:inherit;font-size:13px;cursor:pointer;color:#4a3728;">关闭</button>';
    
    openCozyModal(html);
    
    // 自动聚焦
    setTimeout(function() {
        var input = document.getElementById('cozyMessageInput');
        if (input) input.focus();
    }, 200);
}

// ==================== 发送留言 ====================

function sendCozyMessage() {
    var input = document.getElementById('cozyMessageInput');
    if (!input) return;
    var text = input.value.trim();
    if (!text) {
        showToast('请输入留言内容');
        return;
    }
    
    addCozyMessage(text, 'me');
    input.value = '';
    
    // 刷新留言板
    openCozyMessages();
    
    // 聊天通知
    addSystemMsg('我在暖屋留了言：' + text);
    
    // 10% 概率对方回复
    if (Math.random() < 0.1) {
        var replies = getAllReplies();
        if (replies.length > 0) {
            var reply = replies[Math.floor(Math.random() * replies.length)];
            setTimeout(function() {
                addCozyMessage(reply, 'other');
                // 不刷新，避免打扰用户
                showToast('对方在暖屋回复了留言');
                addSystemMsg('对方在暖屋回复了留言：' + reply);
            }, 2000 + Math.random() * 2000);
        }
    }
}

// ==================== 对方主动留言（定时触发） ====================

function cozyOtherAutoMessage() {
    if (Math.random() > 0.03) return;
    var replies = getAllReplies();
    if (replies.length === 0) return;
    
    var text = replies[Math.floor(Math.random() * replies.length)];
    addCozyMessage(text, 'other');
    
    // 如果暖屋开着，提示
    var overlay = document.getElementById('cozyOverlay');
    if (overlay && overlay.classList.contains('show')) {
        showToast('对方在暖屋留了言');
    }
}

// 每 2 分钟检查一次
setInterval(function() {
    cozyOtherAutoMessage();
}, 120000);

// ==================== 导入到全局 ====================

window.openCozyMessages = openCozyMessages;
window.sendCozyMessage = sendCozyMessage;

console.log('暖屋留言板已加载');
