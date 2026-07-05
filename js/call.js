// ==================== 微信风格语音通话功能（纯图形图标） ====================
var callTimeout = null;
var isInCall = false;
var isRinging = false;
var callStartTime = null;
var callTimerInterval = null;
var isCallMinimized = false;
var pendingCallTimeout = null;
var isMuted = false;
var isSpeakerOn = false;

// ---------- SVG 图标（纯图形，无 emoji） ----------

// 挂断图标（红色电话听筒）
function hangupIcon() {
    return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>`;
}

// 扬声器图标
function speakerIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>`;
}

// 扬声器关闭（静音）图标
function speakerOffIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <line x1="23" y1="9" x2="17" y2="15"/>
        <line x1="17" y1="9" x2="23" y2="15"/>
    </svg>`;
}

// 麦克风图标
function micIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>`;
}

// 麦克风静音图标
function micOffIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="1" y1="1" x2="23" y2="23"/>
        <path d="M9 9v3a3 3 0 0 0 5.12 2.12L9 9z"/>
        <path d="M15 9.34V4a3 3 0 0 0-5.94-.6"/>
        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>`;
}

// 键盘图标
function keypadIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="2" width="4" height="4" rx="1"/>
        <rect x="10" y="2" width="4" height="4" rx="1"/>
        <rect x="18" y="2" width="4" height="4" rx="1"/>
        <rect x="2" y="10" width="4" height="4" rx="1"/>
        <rect x="10" y="10" width="4" height="4" rx="1"/>
        <rect x="18" y="10" width="4" height="4" rx="1"/>
        <rect x="2" y="18" width="4" height="4" rx="1"/>
        <rect x="10" y="18" width="4" height="4" rx="1"/>
        <rect x="18" y="18" width="4" height="4" rx="1"/>
    </svg>`;
}

// 最小化/缩小图标
function minimizeIcon() {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 3v3a2 2 0 0 1-2 2H3"/>
        <path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
        <path d="M3 16h3a2 2 0 0 1 2 2v3"/>
        <path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
    </svg>`;
}

// 关闭/叉号图标
function closeIcon() {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>`;
}

// ---------- 微信风格通话界面 ----------

function getWeChatCallingHTML() {
    return `
    <div id="wechat-call-ui" style="
        position:fixed;top:0;left:0;right:0;bottom:0;
        background:linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        z-index:999;
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:space-between;
        padding:50px 30px 40px;
        color:white;
        font-family:-apple-system,BlinkMacSystemFont,sans-serif;
    ">
        <!-- 顶部：最小化按钮 -->
        <div style="width:100%;display:flex;justify-content:flex-end;">
            <button onclick="minimizeCall()" style="
                background:rgba(255,255,255,0.08);
                border:none;
                color:white;
                width:40px;height:40px;
                border-radius:50%;
                display:flex;
                align-items:center;
                justify-content:center;
                cursor:pointer;
                transition:0.2s;
            ">${minimizeIcon()}</button>
        </div>

        <!-- 中间：头像 + 名字 + 状态 + 计时 -->
        <div style="text-align:center;flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;">
            <div style="
                width:120px;height:120px;
                border-radius:50%;
                background:linear-gradient(135deg,#667eea,#764ba2);
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:48px;
                font-weight:600;
                color:white;
                margin-bottom:20px;
                box-shadow:0 8px 40px rgba(102,126,234,0.4);
            ">${appData.otherName ? appData.otherName.charAt(0) : '祁'}</div>
            <div style="font-size:28px;font-weight:600;margin-bottom:6px;">${appData.otherName || '祁煜'}</div>
            <div style="font-size:15px;color:rgba(255,255,255,0.5);" id="wechatCallStatus">通话中</div>
            <div style="
                font-size:48px;
                font-weight:200;
                margin-top:14px;
                letter-spacing:3px;
                font-variant-numeric:tabular-nums;
                color:rgba(255,255,255,0.9);
            " id="wechatCallTimer">00:00</div>
        </div>

        <!-- 底部：操作按钮（纯图形） -->
        <div style="
            width:100%;
            max-width:400px;
            display:flex;
            justify-content:space-around;
            align-items:center;
            padding:10px 0;
        ">
            <!-- 扬声器 -->
            <div class="call-btn" onclick="toggleSpeaker()" style="
                display:flex;
                flex-direction:column;
                align-items:center;
                gap:6px;
                cursor:pointer;
                user-select:none;
            ">
                <div style="
                    width:56px;height:56px;
                    border-radius:50%;
                    background:rgba(255,255,255,0.06);
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    transition:0.2s;
                    color:rgba(255,255,255,0.7);
                " id="speakerBtn">${speakerIcon()}</div>
                <span style="font-size:11px;color:rgba(255,255,255,0.4);">扬声器</span>
            </div>

            <!-- 静音 -->
            <div class="call-btn" onclick="toggleMute()" style="
                display:flex;
                flex-direction:column;
                align-items:center;
                gap:6px;
                cursor:pointer;
                user-select:none;
            ">
                <div style="
                    width:56px;height:56px;
                    border-radius:50%;
                    background:rgba(255,255,255,0.06);
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    transition:0.2s;
                    color:rgba(255,255,255,0.7);
                " id="muteBtn">${micIcon()}</div>
                <span style="font-size:11px;color:rgba(255,255,255,0.4);">静音</span>
            </div>

            <!-- 挂断（红色大按钮） -->
            <div class="call-btn" onclick="hangupCall()" style="
                display:flex;
                flex-direction:column;
                align-items:center;
                gap:6px;
                cursor:pointer;
                user-select:none;
            ">
                <div style="
                    width:72px;height:72px;
                    border-radius:50%;
                    background:#ff3b30;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    box-shadow:0 4px 24px rgba(255,59,48,0.35);
                    transition:0.2s;
                    color:white;
                ">${hangupIcon()}</div>
                <span style="font-size:11px;color:rgba(255,255,255,0.4);">挂断</span>
            </div>

            <!-- 键盘 -->
            <div class="call-btn" onclick="toggleKeypad()" style="
                display:flex;
                flex-direction:column;
                align-items:center;
                gap:6px;
                cursor:pointer;
                user-select:none;
            ">
                <div style="
                    width:56px;height:56px;
                    border-radius:50%;
                    background:rgba(255,255,255,0.06);
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    transition:0.2s;
                    color:rgba(255,255,255,0.7);
                ">${keypadIcon()}</div>
                <span style="font-size:11px;color:rgba(255,255,255,0.4);">键盘</span>
            </div>
        </div>
    </div>
    `;
}

// ---------- 核心逻辑 ----------

// 发起通话
function startVoiceCall() {
    if (isInCall) { showToast('通话中，请稍后再试'); return; }
    if (isRinging) { showToast('正在呼叫中...'); return; }
    
    if (document.getElementById('morePanel')?.style.display === 'block') {
        toggleMorePanel();
    }
    
    isRinging = true;
    addSystemMsg('你发起了通话，等待对方接听...');
    showCallingModal();
    
    callTimeout = setTimeout(function() {
        if (!isRinging) return;
        var rand = Math.random();
        if (rand < 0.7) {
            addSystemMsg('对方接听了通话');
            closeModal('subOverlay');
            startCall();
        } else if (rand < 0.85) {
            addSystemMsg('对方拒绝了通话');
            showToast('对方拒绝了通话');
            endCallSession();
        } else {
            addSystemMsg('对方未接听');
            showToast('对方未接听');
            endCallSession();
        }
    }, 2000 + Math.random() * 3000);
}

function showCallingModal() {
    var html = `
    <div style="text-align:center;">
        <div style="
            width:80px;height:80px;
            border-radius:50%;
            background:linear-gradient(135deg,#667eea,#764ba2);
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:32px;
            font-weight:bold;
            color:white;
            margin:0 auto 16px;
        ">${appData.otherName ? appData.otherName.charAt(0) : '祁'}</div>
        <h3 style="margin:0 0 4px;">${appData.otherName || '祁煜'}</h3>
        <div class="subtitle" style="margin:8px 0 16px;color:rgba(255,255,255,0.5);">等待对方接听...</div>
        <button class="btn-sm outline" onclick="cancelCall()" style="
            background:rgba(255,255,255,0.08);
            border:1px solid rgba(255,255,255,0.2);
            color:white;
            padding:8px 28px;
            border-radius:20px;
            cursor:pointer;
        ">取消</button>
    </div>`;
    openSubModal(html);
}

function cancelCall() {
    if (callTimeout) clearTimeout(callTimeout);
    addSystemMsg('你取消了通话');
    showToast('已取消');
    endCallSession();
}

// ---------- 开始通话（无自动挂断） ----------
function startCall() {
    isInCall = true;
    isRinging = false;
    callStartTime = Date.now();
    showWeChatCallUI();
    
    if (callTimerInterval) clearInterval(callTimerInterval);
    callTimerInterval = setInterval(function() {
        if (isInCall && callStartTime) {
            var elapsed = Math.floor((Date.now() - callStartTime) / 1000);
            var mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
            var secs = String(elapsed % 60).padStart(2, '0');
            var timeStr = mins + ':' + secs;
            var timerEl = document.getElementById('wechatCallTimer');
            if (timerEl) timerEl.textContent = timeStr;
            var floatingTimerEl = document.getElementById('floatingCallTimer');
            if (floatingTimerEl) floatingTimerEl.textContent = timeStr;
        }
    }, 1000);
    
    // ❌ 移除了 scheduleRandomHangup() — 不再自动挂断
}

// ---------- 显示微信通话界面 ----------
function showWeChatCallUI() {
    // 关闭子弹窗
    var subOverlay = document.getElementById('subOverlay');
    if (subOverlay) {
        subOverlay.classList.remove('show');
        subOverlay.style.display = 'none';
    }
    
    // 移除旧UI
    var oldUI = document.getElementById('wechat-call-ui');
    if (oldUI) oldUI.remove();
    
    // 插入新UI
    var container = document.createElement('div');
    container.innerHTML = getWeChatCallingHTML();
    document.body.appendChild(container.firstElementChild);
    
    // 初始化计时器显示
    var timerEl = document.getElementById('wechatCallTimer');
    if (timerEl) timerEl.textContent = '00:00';
}

// ---------- 浮动小球（纯图形） ----------
function createCallFloatingBall() {
    var existingBall = document.getElementById('callFloatingBall');
    if (existingBall) existingBall.remove();
    
    var ball = document.createElement('div');
    ball.id = 'callFloatingBall';
    
    var avatarText = appData.otherName ? appData.otherName.charAt(0) : '祁';
    
    ball.innerHTML = `
    <div style="
        width:100%;height:100%;
        border-radius:50%;
        overflow:hidden;
        position:relative;
        background:linear-gradient(135deg,#667eea,#764ba2);
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:20px;
        font-weight:600;
        color:white;
    ">
        ${avatarText}
        <div style="
            position:absolute;
            bottom:0;left:0;right:0;
            background:rgba(0,0,0,0.7);
            color:white;
            font-size:9px;
            text-align:center;
            padding:2px 0;
            font-variant-numeric:tabular-nums;
        ">
            <span id="floatingCallTimer">00:00</span>
        </div>
    </div>`;
    
    var leftPos = window.innerWidth - 70;
    var topPos = window.innerHeight - 180;
    ball.style.cssText = `
        position:fixed;
        left:${leftPos}px;
        top:${topPos}px;
        width:56px;
        height:56px;
        border-radius:50%;
        z-index:160;
        cursor:grab;
        box-shadow:0 2px 12px rgba(0,0,0,0.4);
        transition:transform 0.15s;
    `;
    ball.setAttribute('draggable', 'false');
    
    document.body.appendChild(ball);
    makeDraggable(ball);
    
    ball.onclick = function(e) {
        e.stopPropagation();
        restoreCallWindow();
    };
}

// ---------- 辅助函数 ----------
function makeDraggable(element) {
    var isDragging = false;
    var startX, startY, startLeft, startTop;
    
    function onStart(e) {
        e.preventDefault();
        var touch = e.type === 'touchstart' ? e.touches[0] : e;
        startX = touch.clientX;
        startY = touch.clientY;
        var rect = element.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;
        isDragging = true;
        element.style.transition = 'none';
        
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
    }
    
    function onMove(e) {
        if (!isDragging) return;
        var clientX, clientY;
        if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
            e.preventDefault();
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        var dx = clientX - startX;
        var dy = clientY - startY;
        var newLeft = Math.max(0, Math.min(startLeft + dx, window.innerWidth - element.offsetWidth));
        var newTop = Math.max(0, Math.min(startTop + dy, window.innerHeight - element.offsetHeight));
        element.style.left = newLeft + 'px';
        element.style.top = newTop + 'px';
        element.style.right = 'auto';
        element.style.bottom = 'auto';
    }
    
    function onEnd() {
        isDragging = false;
        element.style.transition = '';
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
    }
    
    element.addEventListener('touchstart', onStart, { passive: false });
    element.addEventListener('mousedown', onStart);
    element.style.cursor = 'grab';
}

function minimizeCall() {
    if (!isInCall) return;
    isCallMinimized = true;
    
    var ui = document.getElementById('wechat-call-ui');
    if (ui) ui.remove();
    
    var subOverlay = document.getElementById('subOverlay');
    if (subOverlay) {
        subOverlay.classList.remove('show');
        subOverlay.style.display = 'none';
    }
    document.body.style.overflow = '';
    
    createCallFloatingBall();
    showToast('通话已缩小');
}

function restoreCallWindow() {
    var ball = document.getElementById('callFloatingBall');
    if (ball) ball.remove();
    isCallMinimized = false;
    
    var subOverlay = document.getElementById('subOverlay');
    if (subOverlay) {
        subOverlay.classList.remove('show');
        subOverlay.style.display = 'none';
    }
    
    if (isInCall) {
        showWeChatCallUI();
        // 恢复计时器
        if (callStartTime) {
            var elapsed = Math.floor((Date.now() - callStartTime) / 1000);
            var mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
            var secs = String(elapsed % 60).padStart(2, '0');
            var timerEl = document.getElementById('wechatCallTimer');
            if (timerEl) timerEl.textContent = mins + ':' + secs;
        }
    }
}

function hangupCall() {
    if (!isInCall) return;
    var duration = Math.floor((Date.now() - callStartTime) / 1000);
    var mins = Math.floor(duration / 60);
    var secs = duration % 60;
    var durationStr = (mins > 0 ? mins + '分' : '') + secs + '秒';
    addSystemMsg('你挂断了通话，通话时长 ' + durationStr);
    showToast('已挂断');
    endCallSession();
}

function endCallSession() {
    if (callTimeout) { clearTimeout(callTimeout); callTimeout = null; }
    if (callTimerInterval) { clearInterval(callTimerInterval); callTimerInterval = null; }
    isInCall = false;
    isRinging = false;
    isCallMinimized = false;
    callStartTime = null;
    isMuted = false;
    isSpeakerOn = false;
    
    var ui = document.getElementById('wechat-call-ui');
    if (ui) ui.remove();
    
    var subOverlay = document.getElementById('subOverlay');
    if (subOverlay && subOverlay.classList.contains('show')) {
        var modalContent = document.querySelector('#subModal');
        if (modalContent && (modalContent.innerText.includes('通话') || modalContent.innerText.includes('呼叫') || modalContent.innerText.includes('来电'))) {
            subOverlay.classList.remove('show');
            subOverlay.style.display = '';
        }
    }
    document.body.style.overflow = '';
    
    var ball = document.getElementById('callFloatingBall');
    if (ball) ball.remove();
}

// ---------- 扬声器/静音切换 ----------
function toggleSpeaker() {
    isSpeakerOn = !isSpeakerOn;
    var btn = document.getElementById('speakerBtn');
    if (btn) {
        btn.innerHTML = isSpeakerOn ? speakerOffIcon() : speakerIcon();
        btn.style.color = isSpeakerOn ? '#4CAF50' : 'rgba(255,255,255,0.7)';
    }
    showToast(isSpeakerOn ? '扬声器已开启' : '扬声器已关闭');
}

function toggleMute() {
    isMuted = !isMuted;
    var btn = document.getElementById('muteBtn');
    if (btn) {
        btn.innerHTML = isMuted ? micOffIcon() : micIcon();
        btn.style.color = isMuted ? '#ff3b30' : 'rgba(255,255,255,0.7)';
    }
    showToast(isMuted ? '已静音' : '已取消静音');
}

function toggleKeypad() {
    showToast('拨号键盘');
    // 可以扩展数字键盘
}

// ---------- 来电 ----------
function checkRandomIncomingCall() {
    if (isInCall || isRinging) return;
    if (Math.random() > 0.03) return;
    
    var settingsOverlay = document.getElementById('settingsOverlay');
    if (settingsOverlay?.classList.contains('show')) return;
    var photoOverlay = document.getElementById('photoOverlay');
    if (photoOverlay?.classList.contains('show')) return;
    
    isRinging = true;
    addSystemMsg('对方发起了通话...');
    
    pendingCallTimeout = setTimeout(function() {
        if (isRinging) {
            addSystemMsg('未接听');
            showToast('未接听');
            endCallSession();
        }
    }, 15000);
    
    showIncomingCallModal();
}

function showIncomingCallModal() {
    var html = `
    <div style="text-align:center;">
        <div style="
            width:80px;height:80px;
            border-radius:50%;
            background:linear-gradient(135deg,#667eea,#764ba2);
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:32px;
            font-weight:bold;
            color:white;
            margin:0 auto 16px;
        ">${appData.otherName ? appData.otherName.charAt(0) : '祁'}</div>
        <h3 style="margin:0 0 4px;">${appData.otherName || '祁煜'}</h3>
        <div class="subtitle" style="margin:8px 0 20px;color:rgba(255,255,255,0.5);">对方正在呼叫你...</div>
        <div style="display:flex;justify-content:center;gap:20px;">
            <button onclick="rejectIncomingCall()" style="
                width:60px;height:60px;
                border-radius:50%;
                border:none;
                background:#ff3b30;
                color:white;
                cursor:pointer;
                display:flex;
                align-items:center;
                justify-content:center;
            ">${hangupIcon()}</button>
            <button onclick="answerIncomingCall()" style="
                width:60px;height:60px;
                border-radius:50%;
                border:none;
                background:#34c759;
                color:white;
                cursor:pointer;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:28px;
            ">${micIcon()}</button>
        </div>
        <button onclick="ignoreIncomingCall()" style="
            margin-top:16px;
            background:transparent;
            border:none;
            color:rgba(255,255,255,0.3);
            cursor:pointer;
            font-size:13px;
        ">忽略</button>
    </div>`;
    openSubModal(html);
}

function answerIncomingCall() {
    if (pendingCallTimeout) { clearTimeout(pendingCallTimeout); pendingCallTimeout = null; }
    if (callTimeout) clearTimeout(callTimeout);
    isRinging = false;
    addSystemMsg('你接听了通话');
    closeModal('subOverlay');
    startCall();
}

function rejectIncomingCall() {
    if (pendingCallTimeout) { clearTimeout(pendingCallTimeout); pendingCallTimeout = null; }
    if (callTimeout) clearTimeout(callTimeout);
    addSystemMsg('你拒绝了通话');
    showToast('已拒绝');
    endCallSession();
}

function ignoreIncomingCall() {
    if (pendingCallTimeout) { clearTimeout(pendingCallTimeout); pendingCallTimeout = null; }
    if (callTimeout) clearTimeout(callTimeout);
    addSystemMsg('未接听');
    showToast('未接听');
    endCallSession();
}

// ---------- 定时检查来电 ----------
setInterval(function() {
    checkRandomIncomingCall();
}, 40000);
