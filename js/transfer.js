// ==================== 转账系统 ====================

// 确保默认数据存在
if (!Array.isArray(appData.transferAmounts) || appData.transferAmounts.length === 0) {
    appData.transferAmounts = ['5.20', '13.14', '52.00', '131.40', '520.00'];
}
if (!Array.isArray(appData.transferNotes) || appData.transferNotes.length === 0) {
    appData.transferNotes = ['买你今晚整个人', '请你喝奶茶', '今天也很爱你', '拿去买糖', '随便花'];
}

function addTransferCard(amount, note, type, fromHistory) {
    var chat = document.getElementById('chat');
    var div = document.createElement('div');
    div.className = 'msg ' + type;
    var av = getAvatarHTMLSync(type === 'me');
    var handler = type === 'other' ? 'onclick="onOtherAvatarClick()"' : 'onclick="onMyAvatarClick()"';
    var cardHTML = '<div class="transfer-card ' + (type === 'me' ? 'transfer-me' : 'transfer-other') + '"';
    if (type === 'other' && !fromHistory) {
        cardHTML += ' onclick="collectTransfer(this, \'' + amount + '\', \'' + escapeHTML(note || '').replace(/'/g, "\\'") + '\')" style="cursor:pointer;"';
    }
    cardHTML += '><div class="transfer-label">' + (type === 'me' ? '向 ' + appData.otherName + ' 转账' : appData.otherName + ' 向你转账') + '</div>';
    cardHTML += '<div class="transfer-amount">¥ ' + amount + '</div>';
    if (note) cardHTML += '<div class="transfer-note">' + escapeHTML(note) + '</div>';
    cardHTML += '<div class="transfer-status">' + (type === 'me' ? '已转账' : (fromHistory ? '已收款' : '点击收款')) + '</div></div>';
    div.innerHTML = '<div class="avatar-wrap" ' + handler + '>' + av + '</div><div class="bubble">' + cardHTML + '<span class="msg-time">' + formatTimeShort(Date.now()) + '</span></div>';
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function collectTransfer(cardElement, amount, note) {
    if (cardElement.querySelector('.transfer-status').textContent === '已收款') {
        showToast('已经收过了');
        return;
    }
    cardElement.querySelector('.transfer-status').textContent = '已收款';
    cardElement.querySelector('.transfer-status').style.color = 'var(--success)';
    cardElement.style.cursor = 'default';
    cardElement.onclick = null;
    showToast('已收款 ¥' + amount);
    saveData(true);
}

function receiveTransferFromOtherModal() {
    if (!appData.transferAmounts.length) {
        showToast('请先设置对方转账金额');
        return;
    }
    if (!appData.transferNotes.length) {
        showToast('请先设置对方转账备注');
        return;
    }
    var amt = appData.transferAmounts[Math.floor(Math.random() * appData.transferAmounts.length)];
    var note = appData.transferNotes[Math.floor(Math.random() * appData.transferNotes.length)];
    addTransferCard(amt, note, 'other');
    appData.chatHistory.push({ type: 'transfer_other', amount: amt, note: note, time: Date.now() });
    saveData(true);
    showToast('收到 ' + appData.otherName + ' 的转账 ¥' + amt);
}

function sendTransferToOther() {
    var amt = document.getElementById('transferAmountInput').value.trim();
    var note = document.getElementById('transferNoteInput').value.trim();
    if (!amt || isNaN(parseFloat(amt)) || parseFloat(amt) <= 0) {
        showToast('请输入有效金额');
        return;
    }
    var amount = parseFloat(amt).toFixed(2);
    addTransferCard(amount, note || '', 'me');
    appData.chatHistory.push({ type: 'transfer_me', amount: amount, note: note || '', time: Date.now() });
    saveData(true);
    closeModal('subOverlay');
    showToast('已向 ' + appData.otherName + ' 转账 ¥' + amount);
}

function openTransferModal() {
    var html = '<div style="display:flex;justify-content:center;align-items:center;position:relative;margin-bottom:12px;">' +
        '<h4 style="margin:0;">转账</h4>' +
        '<div style="position:absolute;right:0;">' +
        '<span onclick="event.stopPropagation();toggleTransferDropdown()" style="font-size:20px;cursor:pointer;color:var(--text);padding:4px 8px;">&#8942;</span>' +
        '<div id="transferDropdownMenu" style="display:none;position:absolute;top:32px;right:0;background:var(--panel-bg);border:2px solid var(--border);border-radius:var(--radius-sm);z-index:10;min-width:120px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">' +
        '<div onclick="receiveTransferFromOtherModal();closeTransferDropdown();" style="padding:10px 16px;cursor:pointer;font-size:14px;color:var(--text);border-bottom:1px solid var(--border);">收转账</div>' +
        '<div onclick="openTransferAmountSettings();closeTransferDropdown();" style="padding:10px 16px;cursor:pointer;font-size:14px;color:var(--text);border-bottom:1px solid var(--border);">对方转账金额</div>' +
        '<div onclick="openTransferNoteSettings();closeTransferDropdown();" style="padding:10px 16px;cursor:pointer;font-size:14px;color:var(--text);">对方转账备注</div>' +
        '</div>' +
        '</div>' +
        '</div>';
    html += '<div class="form-row"><label>向 ' + appData.otherName + ' 转账</label><input type="number" id="transferAmountInput" placeholder="输入金额" step="0.01" min="0.01"></div>';
    html += '<div class="form-row"><label>备注</label><input type="text" id="transferNoteInput" placeholder="说点什么..."></div>';
    html += '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-top:8px;">';
    ['5.20', '13.14', '52.00', '131.40', '520.00'].forEach(function(a) {
        html += '<button class="btn-sm outline" onclick="document.getElementById(\'transferAmountInput\').value=\'' + a + '\'" style="font-size:12px;padding:6px 10px;">¥' + a + '</button>';
    });
    html += '</div><div class="btn-row" style="justify-content:center;margin-top:10px;"><button class="btn-sm" onclick="sendTransferToOther()">确认转账</button></div>';
    html += '<button class="btn-close" onclick="closeModal(\'subOverlay\')" style="margin-top:10px;">关闭</button>';
    openSubModal(html);
}

function openTransferAmountSettings() {
    var html = '<h4>对方转账金额</h4><div class="form-row"><input type="number" id="newTransferAmount" placeholder="输入金额" step="0.01" min="0.01"><button class="btn-sm" onclick="addTransferAmount()" style="margin-top:4px;">添加</button></div><div style="max-height:180px;overflow-y:auto;" id="transferAmountList">';
    appData.transferAmounts.forEach(function(a, i) {
        html += '<div class="list-item"><span>¥ ' + a + '</span><button class="del-sm" onclick="delTransferAmount(' + i + ')">删除</button></div>';
    });
    html += '</div><button class="btn-close" onclick="closeModal(\'subOverlay\')" style="margin-top:10px;">返回</button>';
    openSubModal(html);
}

function addTransferAmount() {
    var v = document.getElementById('newTransferAmount').value.trim();
    if (!v || isNaN(parseFloat(v)) || parseFloat(v) <= 0) {
        showToast('请输入有效金额');
        return;
    }
    appData.transferAmounts.push(parseFloat(v).toFixed(2));
    saveData(true);
    openTransferAmountSettings();
}

function delTransferAmount(i) {
    appData.transferAmounts.splice(i, 1);
    saveData(true);
    openTransferAmountSettings();
}

function openTransferNoteSettings() {
    var html = '<h4>对方转账备注</h4><div class="form-row"><input type="text" id="newTransferNote" placeholder="输入备注文案"><button class="btn-sm" onclick="addTransferNote()" style="margin-top:4px;">添加</button></div><div style="max-height:180px;overflow-y:auto;" id="transferNoteList">';
    appData.transferNotes.forEach(function(n, i) {
        html += '<div class="list-item"><span>' + escapeHTML(n) + '</span><button class="del-sm" onclick="delTransferNote(' + i + ')">删除</button></div>';
    });
    html += '</div><button class="btn-close" onclick="closeModal(\'subOverlay\')" style="margin-top:10px;">返回</button>';
    openSubModal(html);
}

function addTransferNote() {
    var v = document.getElementById('newTransferNote').value.trim();
    if (!v) {
        showToast('请输入备注');
        return;
    }
    appData.transferNotes.push(v);
    saveData(true);
    openTransferNoteSettings();
}

function delTransferNote(i) {
    appData.transferNotes.splice(i, 1);
    saveData(true);
    openTransferNoteSettings();
}

function toggleTransferDropdown() {
    var m = document.getElementById('transferDropdownMenu');
    if (m) m.style.display = m.style.display === 'block' ? 'none' : 'block';
}

function closeTransferDropdown() {
    var m = document.getElementById('transferDropdownMenu');
    if (m) m.style.display = 'none';
}
