// ==================== 语音通话功能（模拟） ====================
var callTimeout = null;
var isInCall = false;
var isRinging = false;
var callStartTime = null;
var callTimerInterval = null;
var isCallMinimized = false;
var pendingCallTimeout = null;

// 发起通话
function startVoiceCall() {
    if (isInCall) {
        showToast('通话中，请稍后再试');
        return;
    }
    if (isRinging) {
        showToast('正在呼叫中...');
        return;
    }
    
    if (document.getElementById('morePanel').style.display === 'block') {
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
    var html = '<div style="text-align:center;">' +
        '<h3>正在呼叫</h3>' +
        '<div class="subtitle" style="margin:16px 0;">等待对方接听...</div>' +
        '<button class="btn-sm outline" onclick="cancelCall()">取消</button>' +
        '</div>';
    openSubModal(html);
}

function cancelCall() {
    if (callTimeout) clearTimeout(callTimeout);
    addSystemMsg('你取消了通话');
    showToast('已取消');
    endCallSession();
}

function startCall() {
    isInCall = true;
    isRinging = false;
    callStartTime = Date.now();
    showCallInProgressModal();
    
    if (callTimerInterval) clearInterval(callTimerInterval);
    callTimerInterval = setInterval(function() {
        if (isInCall && callStartTime) {
            var elapsed = Math.floor((Date.now() - callStartTime) / 1000);
            var minutes = Math.floor(elapsed / 60);
            var seconds = elapsed % 60;
            var timeStr = (minutes > 0 ? minutes + '分' : '') + seconds + '秒';
            var timerEl = document.getElementById('callTimerDisplay');
            if (timerEl) timerEl.textContent = timeStr;
            var floatingTimerEl = document.getElementById('floatingCallTimer');
            if (floatingTimerEl) floatingTimerEl.textContent = timeStr;
        }
    }, 1000);
    
    scheduleRandomHangup();
}

function scheduleRandomHangup() {
    var hangupDelay = 10000 + Math.random() * 30000;
    callTimeout = setTimeout(function() {
        if (isInCall) {
            addSystemMsg('对方挂断了通话');
            showToast('对方挂断了通话');
            endCallSession();
        }
    }, hangupDelay);
}

function showCallInProgressModal() {
    var subOverlay = document.getElementById('subOverlay');
    if (subOverlay) {
        subOverlay.classList.remove('show');
        subOverlay.style.display = 'none';
    }
    
    var html = '<div style="text-align:center;">' +
        '<h3>通话中</h3>' +
        '<div class="subtitle" style="margin:16px 0;">与对方通话中...</div>' +
        '<div style="font-size:28px;font-weight:bold;margin:16px 0;" id="callTimerDisplay">0秒</div>' +
        '<div class="btn-row" style="justify-content:center;gap:16px;">' +
        '<button class="btn-sm" style="background:var(--danger);" onclick="hangupCall()">挂断</button>' +
        '<button class="btn-sm outline" onclick="minimizeCall()">缩小</button>' +
        '</div>' +
        '</div>';
    openSubModal(html);
    
    if (callStartTime) {
        var elapsed = Math.floor((Date.now() - callStartTime) / 1000);
        var minutes = Math.floor(elapsed / 60);
        var seconds = elapsed % 60;
        var timeStr = (minutes > 0 ? minutes + '分' : '') + seconds + '秒';
        var timerEl = document.getElementById('callTimerDisplay');
        if (timerEl) timerEl.textContent = timeStr;
    }
}

function minimizeCall() {
    if (!isInCall) return;
    isCallMinimized = true;
    
    var subOverlay = document.getElementById('subOverlay');
    if (subOverlay) {
        subOverlay.classList.remove('show');
        subOverlay.style.display = 'none';
    }
    document.body.style.overflow = '';
    
    createCallFloatingBall();
    showToast('通话已缩小，点击小球恢复');
}

function createCallFloatingBall() {
    var existingBall = document.getElementById('callFloatingBall');
    if (existingBall) existingBall.remove();
    
    var ball = document.createElement('div');
    ball.id = 'callFloatingBall';
    
    var avatarHtml = '';
    if (appData.otherAvatar) {
        avatarHtml = '<img src="' + appData.otherAvatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
    } else {
        avatarHtml = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;background:var(--accent);border-radius:50%;color:var(--text);">' + (appData.otherName.charAt(0) || 'T') + '</div>';
    }
    
    ball.innerHTML = '<div style="width:100%;height:100%;border-radius:50%;overflow:hidden;position:relative;">' +
        avatarHtml +
        '<div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.6);color:white;font-size:9px;text-align:center;padding:2px 0;">' +
        '<span id="floatingCallTimer">0秒</span>' +
        '</div></div>';
    
    var leftPos = window.innerWidth - 70;
    var topPos = window.innerHeight - 180;
    ball.style.cssText = 'position:fixed;left:' + leftPos + 'px;top:' + topPos + 'px;width:55px;height:55px;border-radius:50%;z-index:160;cursor:grab;box-shadow:0 2px 10px rgba(0,0,0,0.3);';
    ball.setAttribute('draggable', 'false');
    
    document.body.appendChild(ball);
    makeDraggable(ball);
    
    ball.onclick = function(e) {
        e.stopPropagation();
        restoreCallWindow();
    };
}
function makeDraggable(element) {
    var isDragging = false;
    var startX, startY, startLeft, startTop;
    
    function onStart(e) {
        e.preventDefault();
        if (e.type === 'touchstart') {
            var touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
        } else {
            startX = e.clientX;
            startY = e.clientY;
        }
        var rect = element.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;
        isDragging = true;
        element.style.cursor = 'grabbing';
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
        var newLeft = startLeft + dx;
        var newTop = startTop + dy;
        var maxLeft = window.innerWidth - element.offsetWidth;
        var maxTop = window.innerHeight - element.offsetHeight;
        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));
        element.style.left = newLeft + 'px';
        element.style.top = newTop + 'px';
        element.style.right = 'auto';
        element.style.bottom = 'auto';
    }
    
    function onEnd() {
        isDragging = false;
        element.style.cursor = 'grab';
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

function restoreCallWindow() {
    var ball = document.getElementById('callFloatingBall');
    if (ball) ball.remove();
    isCallMinimized = false;
    
    var subOverlay = document.getElementById('subOverlay');
    if (subOverlay) {
        subOverlay.classList.remove('show');
        subOverlay.style.display = 'none';
    }
    
    showCallInProgressModal();
}

function hangupCall() {
    if (!isInCall) return;
    var duration = Math.floor((Date.now() - callStartTime) / 1000);
    var minutes = Math.floor(duration / 60);
    var seconds = duration % 60;
    var durationStr = (minutes > 0 ? minutes + '分' : '') + seconds + '秒';
    addSystemMsg('你挂断了通话，通话时长 ' + durationStr);
    showToast('已挂断');
    endCallSession();
}

function endCallSession() {
    if (callTimeout) {
        clearTimeout(callTimeout);
        callTimeout = null;
    }
    if (callTimerInterval) {
        clearInterval(callTimerInterval);
        callTimerInterval = null;
    }
    isInCall = false;
    isRinging = false;
    isCallMinimized = false;
    callStartTime = null;
    
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

function checkRandomIncomingCall() {
    if (isInCall || isRinging) return;
    if (Math.random() > 0.03) return;
    
    var settingsOverlay = document.getElementById('settingsOverlay');
    if (settingsOverlay && settingsOverlay.classList.contains('show')) return;
    
    var photoOverlay = document.getElementById('photoOverlay');
    if (photoOverlay && photoOverlay.classList.contains('show')) return;
    
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
    var html = '<div style="text-align:center;">' +
        '<h3>来电</h3>' +
        '<div class="subtitle" style="margin:16px 0;">对方正在呼叫你...</div>' +
        '<div class="btn-row" style="justify-content:center;gap:16px;">' +
        '<button class="btn-sm" style="background:var(--success);" onclick="answerIncomingCall()">接听</button>' +
        '<button class="btn-sm outline" style="color:var(--danger);" onclick="rejectIncomingCall()">拒绝</button>' +
        '</div>' +
        '<button class="btn-close" onclick="ignoreIncomingCall()" style="margin-top:12px;">忽略</button>' +
        '</div>';
    openSubModal(html);
}

function answerIncomingCall() {
    if (pendingCallTimeout) {
        clearTimeout(pendingCallTimeout);
        pendingCallTimeout = null;
    }
    if (callTimeout) clearTimeout(callTimeout);
    isRinging = false;
    addSystemMsg('你接听了通话');
    closeModal('subOverlay');
    startCall();
}

function rejectIncomingCall() {
    if (pendingCallTimeout) {
        clearTimeout(pendingCallTimeout);
        pendingCallTimeout = null;
    }
    if (callTimeout) clearTimeout(callTimeout);
    addSystemMsg('你拒绝了通话');
    showToast('已拒绝');
    endCallSession();
}

function ignoreIncomingCall() {
    if (pendingCallTimeout) {
        clearTimeout(pendingCallTimeout);
        pendingCallTimeout = null;
    }
    if (callTimeout) clearTimeout(callTimeout);
    addSystemMsg('未接听');
    showToast('未接听');
    endCallSession();
}

setInterval(function() {
    checkRandomIncomingCall();
}, 40000);
