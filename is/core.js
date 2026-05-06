// ==================== 核心系统 ====================
// 存储、数据、聊天、UI、设置、信件、头像、回复管理

// ========== 存储密钥 ==========
var STORAGE_KEY = 'chat_app_v20';
var STORAGE_BACKUP_KEY = 'chat_app_v20_backup';
var DB_NAME = 'ChatAppDB';
var DB_VERSION = 1;
var db = null;
var MAX_STORAGE_MB = 50;
var saveTimer = null;
var saveDebounceMs = 500;

// ========== IndexedDB ==========
function openDB() {
    return new Promise(function(resolve, reject) {
        if (db) { resolve(db); return; }
        var request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = function(e) { console.error('IDB open error:', e); reject(e); };
        request.onsuccess = function(e) { db = e.target.result; resolve(db); };
        request.onupgradeneeded = function(e) {
            var database = e.target.result;
            if (!database.objectStoreNames.contains('images')) database.createObjectStore('images', { keyPath: 'id' });
            if (!database.objectStoreNames.contains('avatars')) database.createObjectStore('avatars', { keyPath: 'id' });
            if (!database.objectStoreNames.contains('scripts')) database.createObjectStore('scripts', { keyPath: 'id' });
        };
    });
}

function saveImageToDB(storeName, id, dataUrl) {
    return openDB().then(function(database) {
        return new Promise(function(resolve, reject) {
            try {
                var tx = database.transaction(storeName, 'readwrite');
                var store = tx.objectStore(storeName);
                store.put({ id: id, data: dataUrl, time: Date.now(), size: dataUrl.length });
                tx.oncomplete = function() { resolve(); };
                tx.onerror = function(e) { console.error('saveImage error:', e); reject(e); };
            } catch(e) { reject(e); }
        });
    });
}

function getImageFromDB(storeName, id) {
    return openDB().then(function(database) {
        return new Promise(function(resolve) {
            try {
                var tx = database.transaction(storeName, 'readonly');
                var store = tx.objectStore(storeName);
                var request = store.get(id);
                request.onsuccess = function() { resolve(request.result ? request.result.data : null); };
                request.onerror = function() { resolve(null); };
            } catch(e) { resolve(null); }
        });
    }).catch(function() { return null; });
}

function deleteImageFromDB(storeName, id) {
    return openDB().then(function(database) {
        return new Promise(function(resolve) {
            try {
                var tx = database.transaction(storeName, 'readwrite');
                var store = tx.objectStore(storeName);
                store.delete(id);
                tx.oncomplete = function() { resolve(); };
                tx.onerror = function() { resolve(); };
            } catch(e) { resolve(); }
        });
    }).catch(function() {});
}

function clearStoreInDB(storeName) {
    return openDB().then(function(database) {
        return new Promise(function(resolve) {
            try {
                var tx = database.transaction(storeName, 'readwrite');
                var store = tx.objectStore(storeName);
                store.clear();
                tx.oncomplete = function() { resolve(); };
                tx.onerror = function() { resolve(); };
            } catch(e) { resolve(); }
        });
    }).catch(function() {});
}

function getStorageStats() {
    return openDB().then(function(database) {
        return Promise.all(['images', 'avatars'].map(function(name) {
            if (!database.objectStoreNames.contains(name)) return Promise.resolve(0);
            return new Promise(function(resolve) {
                try {
                    var tx = database.transaction(name, 'readonly');
                    var store = tx.objectStore(name);
                    var request = store.getAll();
                    request.onsuccess = function() {
                        var total = 0;
                        (request.result || []).forEach(function(item) { total += item.size || (item.data ? item.data.length : 0); });
                        resolve(total);
                    };
                    request.onerror = function() { resolve(0); };
                } catch(e) { resolve(0); }
            });
        })).then(function(sizes) {
            var totalBytes = sizes[0] + sizes[1];
            var lsSize = 0;
            try { lsSize = (localStorage.getItem(STORAGE_KEY) || '').length * 2; } catch(e) {}
            return {
                imagesBytes: sizes[0], avatarsBytes: sizes[1],
                totalBytes: totalBytes + lsSize, lsBytes: lsSize,
                usagePercent: Math.min(100, Math.round((totalBytes + lsSize) / (MAX_STORAGE_MB * 1024 * 1024) * 100))
            };
        });
    }).catch(function() {
        return { imagesBytes: 0, avatarsBytes: 0, totalBytes: 0, lsBytes: 0, usagePercent: 0 };
    });
}

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function autoCleanOrphanImages() {
    var refs = {};
    (appData.chatHistory || []).forEach(function(m) { if (m.imageId) refs[m.imageId] = true; });
    (appData.emojiIds || []).forEach(function(id) { refs[id] = true; });
    if (appData.myAvatarId) refs[appData.myAvatarId] = true;
    if (appData.otherAvatarId) refs[appData.otherAvatarId] = true;
    return openDB().then(function(database) {
        return new Promise(function(resolve) {
            try {
                var tx = database.transaction('images', 'readonly');
                var store = tx.objectStore('images');
                var allReq = store.getAll();
                allReq.onsuccess = function() {
                    var orphans = (allReq.result || []).filter(function(item) { return !(item.id in refs); });
                    resolve(orphans.map(function(item) { return item.id; }));
                };
                allReq.onerror = function() { resolve([]); };
            } catch(e) { resolve([]); }
        });
    }).then(function(orphanIds) {
        if (!orphanIds.length) return 0;
        return Promise.all(orphanIds.map(function(id) { return deleteImageFromDB('images', id); })).then(function() { return orphanIds.length; });
    });
}

function compressImage(file, maxWidth, maxHeight, quality) {
    maxWidth = maxWidth || 600; maxHeight = maxHeight || 600; quality = quality || 0.6;
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var img = new Image();
            img.onload = function() {
                var w = img.width, h = img.height;
                if (w <= maxWidth && h <= maxHeight && file.size < 200000) { resolve(e.target.result); return; }
                var ratio = Math.min(maxWidth / w, maxHeight / h);
                if (ratio < 1) { w = Math.round(w * ratio); h = Math.round(h * ratio); }
                var canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = function() { reject(new Error('图片加载失败')); };
            img.src = e.target.result;
        };
        reader.onerror = function() { reject(new Error('读取失败')); };
        reader.readAsDataURL(file);
    });
}

// ========== 默认数据 ==========
var DEFAULT_DATA = {
    myName: '我', myAvatar: '', myAvatarId: '', otherName: '甜心助手', otherAvatar: '', otherAvatarId: '',
    replyGroups: [{ name: '默认分组', replies: ['你好呀~','嗯嗯，我知道啦','哈哈哈哈好可爱','太有意思了吧','又学到了新东西','有空再聊哦','今天心情真好','你说得对呢','让我想想...','好的呢亲爱的','哈哈哈笑死我了','你真有趣','今天也要开心哦'] }],
    emojiIds: [], theme: 'light', morePanelTab: 'emoji',
    chatHistory: [], letters: []
};

var appData = JSON.parse(JSON.stringify(DEFAULT_DATA));

// ========== 数据加载 ==========
function safeParseJSON(str) {
    if (!str) return null;
    try { return JSON.parse(str); } catch(e) { return null; }
}

function loadData() {
    var saved = null;
    var source = 'none';
    try { saved = localStorage.getItem(STORAGE_KEY); if (saved) source = 'localStorage'; } catch(e) { saved = null; }
    if (!saved) {
        try { saved = sessionStorage.getItem(STORAGE_BACKUP_KEY); if (saved) source = 'sessionStorage'; } catch(e) { saved = null; }
    }
    if (saved) {
        var p = safeParseJSON(saved);
        if (p && typeof p === 'object') {
            console.log('从 ' + source + ' 加载数据成功');
            if (typeof p.myName === 'string') appData.myName = p.myName;
            if (typeof p.myAvatarId === 'string') appData.myAvatarId = p.myAvatarId;
            if (typeof p.otherName === 'string') appData.otherName = p.otherName;
            if (typeof p.otherAvatarId === 'string') appData.otherAvatarId = p.otherAvatarId;
            if (typeof p.theme === 'string') appData.theme = p.theme;
            if (typeof p.morePanelTab === 'string') appData.morePanelTab = p.morePanelTab;
            if (Array.isArray(p.emojiIds)) appData.emojiIds = p.emojiIds;
            if (Array.isArray(p.chatHistory)) appData.chatHistory = p.chatHistory;
            if (Array.isArray(p.letters)) appData.letters = p.letters;
            if (Array.isArray(p.replyGroups) && p.replyGroups.length > 0) appData.replyGroups = p.replyGroups;
            else if (Array.isArray(p.replies) && p.replies.length > 0) appData.replyGroups = [{ name: '默认分组', replies: p.replies }];
        }
    }
    if (!Array.isArray(appData.emojiIds)) appData.emojiIds = [];
    if (!Array.isArray(appData.chatHistory)) appData.chatHistory = [];
    if (!Array.isArray(appData.letters)) appData.letters = [];
    if (!Array.isArray(appData.replyGroups) || appData.replyGroups.length === 0) {
        appData.replyGroups = [{ name: '默认分组', replies: ['你好呀~'] }];
    }
    var p1 = appData.myAvatarId ? getImageFromDB('avatars', appData.myAvatarId).then(function(d) { appData.myAvatar = d || ''; }) : Promise.resolve();
    var p2 = appData.otherAvatarId ? getImageFromDB('avatars', appData.otherAvatarId).then(function(d) { appData.otherAvatar = d || ''; }) : Promise.resolve();
    return Promise.all([p1, p2]).then(function() {
        saveData(true);
    });
}

function saveData(immediate) {
    if (saveTimer) clearTimeout(saveTimer);
    var doSave = function() {
        var saveObj = {
            myName: appData.myName,
            myAvatarId: appData.myAvatarId || '',
            otherName: appData.otherName,
            otherAvatarId: appData.otherAvatarId || '',
            replyGroups: appData.replyGroups,
            emojiIds: appData.emojiIds,
            theme: appData.theme,
            morePanelTab: appData.morePanelTab,
            chatHistory: appData.chatHistory,
            letters: appData.letters
        };
        var jsonStr = JSON.stringify(saveObj);
        try {
            localStorage.setItem(STORAGE_KEY, jsonStr);
        } catch(e) {
            if (e.name === 'QuotaExceededError') {
                autoCleanOrphanImages().then(function() {
                    try { localStorage.setItem(STORAGE_KEY, jsonStr); } catch(e2) {}
                });
            }
        }
        try { sessionStorage.setItem(STORAGE_BACKUP_KEY, jsonStr); } catch(e) {}
    };
    if (immediate) { doSave(); }
    else { saveTimer = setTimeout(doSave, saveDebounceMs); }
}

function getAllReplies() {
    var all = [];
    (appData.replyGroups || []).forEach(function(g) { if (Array.isArray(g.replies)) all = all.concat(g.replies); });
    return all;
}

// ========== 工具函数 ==========
function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function formatTime(ts) { if (!ts) return ''; var d = new Date(ts); return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes(); }
function formatTimeShort(ts) { if (!ts) return ''; var d = new Date(ts); return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes(); }
function escapeHTML(str) { if (!str) return ''; return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

// ========== 初始化 ==========
function initApp() {
    return loadData().then(function() {
        applyTheme();
        updateHeader();
        checkPendingLetters();
        return renderChatHistory();
    }).then(function() {
        updateLetterBadge();
        renderMoreImages();
        closeModal('settingsOverlay'); closeModal('subOverlay');
        closeModal('photoOverlay'); closeModal('letterOverlay');
        document.getElementById('morePanel').style.display = 'none';
        return autoCleanOrphanImages();
    }).then(function(cleaned) {
        if (cleaned > 0) console.log('自动清理了 ' + cleaned + ' 个孤儿图片');
        return getStorageStats();
    }).then(function(stats) {
        if (stats.usagePercent > 80) {
            showToast('存储已使用 ' + stats.usagePercent + '%\n建议在数据管理中清理');
        }
    }).catch(function(e) { console.error('启动失败:', e); });
}

function updateHeader() {
    document.getElementById('headerTitle').textContent = appData.otherName;
    document.title = appData.otherName;
}

// ========== 主题 ==========
function applyTheme() {
    if (appData.theme === 'dark') document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
}
function setThemeLight() { appData.theme = 'light'; applyTheme(); saveData(); closeModal('subOverlay'); showToast('已切换为浅色模式'); }
function setThemeDark() { appData.theme = 'dark'; applyTheme(); saveData(); closeModal('subOverlay'); showToast('已切换为深色模式'); }
function openThemeModal() {
    closeModal('settingsOverlay');
    var html = '<h4>主题模式</h4><div style="display:flex;gap:10px;justify-content:center;margin-top:12px;">';
    html += '<button class="btn-sm ' + (appData.theme === 'light' ? '' : 'outline') + '" onclick="setThemeLight()">浅色</button>';
    html += '<button class="btn-sm ' + (appData.theme === 'dark' ? '' : 'outline') + '" onclick="setThemeDark()">深色</button>';
    html += '</div><button class="btn-close" onclick="closeModal(\'subOverlay\')" style="margin-top:14px;">关闭</button>';
    openSubModal(html);
}

// ========== 信件 ==========
function updateLetterBadge() {
    var badge = document.getElementById('letterBadge'), pending = 0;
    (appData.letters || []).forEach(function(l) {
        if (l.replied && !l.replyShown) pending++;
        if (!l.replied && l.expectedReplyTime <= Date.now()) pending++;
    });
    badge.style.display = pending > 0 ? 'inline-block' : 'none';
    badge.textContent = pending + ' 封回信';
}
function checkPendingLetters() {
    var hasNew = false;
    (appData.letters || []).forEach(function(l) {
        if (!l.replied && l.expectedReplyTime <= Date.now()) {
            l.replyContent = generateLetterReply();
            l.replied = true; l.replyShown = false; hasNew = true;
        }
    });
    if (hasNew) { saveData(); updateLetterBadge(); }
}
function checkAndShowLetterReply() {
    var shown = false;
    (appData.letters || []).forEach(function(l) {
        if (l.replied && !l.replyShown) {
            var msg = '回信（' + formatTime(l.expectedReplyTime) + '收到）：\n\n' + l.replyContent;
            addMessage(msg, 'other');
            appData.chatHistory.push({ type: 'other', content: msg, time: Date.now() });
            l.replyShown = true; shown = true;
        }
    });
    if (shown) { saveData(); updateLetterBadge(); showToast('回信已送达聊天中~'); }
    else showToast('暂无新回信');
}
function generateLetterReply() {
    var all = getAllReplies();
    if (all.length === 0) return '（暂无可用的回复内容）';
    var count = Math.min(Math.floor(Math.random() * 6) + 3, all.length);
    var arr = all.slice();
    for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    return '亲爱的' + appData.myName + '：\n\n' + arr.slice(0, count).join('\n\n') + '\n\n-- ' + appData.otherName;
}
function sendLetter() {
    var content = document.getElementById('letterContent').value.trim();
    if (!content) return showToast('请写下信件内容');
    var delay = 12*60*60*1000 + Math.random() * 24*60*60*1000;
    var expectedTime = Date.now() + delay;
    appData.letters.push({
        id: Date.now().toString(36) + Math.random().toString(36).substr(2,6),
        sentContent: content, sentTime: Date.now(),
        expectedReplyTime: expectedTime, replyContent: '', replied: false, replyShown: false
    });
    saveData(); closeModal('letterOverlay');
    showToastLong('信件已寄出！\n预计 ' + formatTime(expectedTime) + ' 左右收到回信', 5000);
    updateLetterBadge();
    addSystemMsg('你给 ' + appData.otherName + ' 寄出了一封信，预计 ' + formatTime(expectedTime) + ' 收到回信');
}
function openLetterModal() {
    if (document.getElementById('morePanel').style.display === 'block') toggleMorePanel();
    document.getElementById('letterRecipient').textContent = appData.otherName;
    document.getElementById('letterContent').value = '';
    openModal('letterOverlay');
}
function openLetterManageModal() {
    closeModal('settingsOverlay');
    var lettersHtml = '';
    if (!appData.letters.length) {
        lettersHtml = '<div style="text-align:center;color:var(--text-system);padding:20px;">还没有往来信件</div>';
    } else {
        for (var i = appData.letters.length - 1; i >= 0; i--) {
            var l = appData.letters[i];
            var statusBadge = l.replied ? (l.replyShown ? '已送达' : '回信待取') : (l.expectedReplyTime > Date.now() ? '等待回信' : '回信已到');
            var safeId = l.id.replace(/'/g, "\\'");
            lettersHtml += '<div class="list-item" style="flex-direction:column;"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;"><span style="word-break:break-all;">寄出：' + formatTime(l.sentTime) + '</span><span style="font-size:10px;white-space:nowrap;">' + statusBadge + '</span></div><div class="letter-preview" style="max-height:60px;">' + escapeHTML(l.sentContent).substring(0, 80) + '...</div><div style="display:flex;gap:4px;margin-top:4px;"><button class="del-sm" onclick="viewLetterDetail(\'' + safeId + '\')">详情</button></div></div>';
        }
    }
    var html = '<h4>往来信件</h4><div class="subtitle">共 ' + appData.letters.length + ' 封</div><div style="max-height:350px;overflow-y:auto;">' + lettersHtml + '</div><div class="btn-row"><button class="btn-sm outline" onclick="checkAndShowLetterReply()">收取回信</button></div><button class="btn-close" onclick="closeModal(\'subOverlay\')">关闭</button>';
    openSubModal(html);
}
function viewLetterDetail(id) {
    var letter = appData.letters.find(function(l) { return l.id === id; });
    if (!letter) return;
    var html = '<h4>信件详情</h4><p><b>寄出：</b>' + formatTime(letter.sentTime) + '</p><p><b>预计回信：</b>' + formatTime(letter.expectedReplyTime) + '</p><div class="letter-preview">' + escapeHTML(letter.sentContent) + '</div>';
    if (letter.replied) html += '<h4>回信内容</h4><div class="letter-preview">' + escapeHTML(letter.replyContent) + '</div>';
    else html += '<p style="color:var(--text-system);">回信还在路上...</p>';
    html += '<button class="btn-close" onclick="closeModal(\'subOverlay\')">关闭</button>';
    openSubModal(html);
}

// ========== 头像 ==========
function getAvatarHTMLSync(isMe) {
    if (isMe) {
        if (appData.myAvatar) return '<img class="avatar" src="' + appData.myAvatar + '" onerror="this.style.display=\'none\';">';
        return '<div class="avatar-placeholder">' + (appData.myName ? appData.myName.charAt(0) : '我') + '</div>';
    }
    if (appData.otherAvatar) return '<img class="avatar" src="' + appData.otherAvatar + '" onerror="this.style.display=\'none\';">';
    return '<div class="avatar-placeholder">' + (appData.otherName ? appData.otherName.charAt(0) : 'TA') + '</div>';
}
function showAvatarChanger(target) {
    var title = target === 'me' ? '更换我的头像' : '更换对方头像';
    var html = '<h4>' + title + '</h4><div class="subtitle">选择一种方式</div><div class="photo-menu-btns">';
    html += '<button onclick="startAvatarCapture(\'' + target + '\', true)">拍照</button>';
    html += '<button onclick="startAvatarCapture(\'' + target + '\', false)">从相册选择</button>';
    html += '</div><button class="btn-close" onclick="closeModal(\'subOverlay\')">取消</button>';
    openSubModal(html);
}
function startAvatarCapture(target, useCamera) {
    closeModal('subOverlay');
    var input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    if (useCamera) input.setAttribute('capture', 'environment');
    input.onchange = function() {
        var file = input.files[0]; if (!file) return;
        compressImage(file, 300, 300, 0.5).then(function(dataUrl) {
            var id = 'avatar_' + target + '_' + Date.now();
            return saveImageToDB('avatars', id, dataUrl).then(function() {
                if (target === 'me') {
                    if (appData.myAvatarId) deleteImageFromDB('avatars', appData.myAvatarId).catch(function(){});
                    appData.myAvatarId = id; appData.myAvatar = dataUrl;
                } else {
                    if (appData.otherAvatarId) deleteImageFromDB('avatars', appData.otherAvatarId).catch(function(){});
                    appData.otherAvatarId = id; appData.otherAvatar = dataUrl;
                }
                return saveData();
            });
        }).then(function() { return renderChatHistory(); })
        .then(function() { showToast((target === 'me' ? '我的' : '对方') + '头像已更新'); })
        .catch(function() { showToast('头像保存失败'); });
    };
    input.click();
}
function onOtherAvatarClick() { showAvatarChanger('other'); }
function onMyAvatarClick() { showAvatarChanger('me'); }
function openNicknameModal() {
    closeModal('settingsOverlay');
    var html = '<h4>昵称 头像</h4>';
    html += '<div class="form-row"><label>我的昵称</label><input type="text" id="editMyName" value="' + appData.myName.replace(/"/g,'&quot;') + '"></div>';
    html += '<div class="btn-row"><button class="btn-sm" onclick="saveMyNameFromModal()">保存昵称</button><button class="btn-sm outline" onclick="showAvatarChanger(\'me\')">换我的头像</button></div>';
    html += '<div class="form-row" style="margin-top:12px;"><label>对方昵称</label><input type="text" id="editOtherName" value="' + appData.otherName.replace(/"/g,'&quot;') + '"></div>';
    html += '<div class="btn-row"><button class="btn-sm" onclick="saveOtherNameFromModal()">保存昵称</button><button class="btn-sm outline" onclick="showAvatarChanger(\'other\')">换对方头像</button></div>';
    html += '<button class="btn-close" onclick="closeModal(\'subOverlay\')" style="margin-top:12px;">关闭</button>';
    openSubModal(html);
}
function saveMyNameFromModal() {
    var v = document.getElementById('editMyName').value.trim();
    if (!v) return showToast('请输入昵称');
    appData.myName = v; saveData(); renderChatHistory(); closeModal('subOverlay'); showToast('昵称已更新');
}
function saveOtherNameFromModal() {
    var v = document.getElementById('editOtherName').value.trim();
    if (!v) return showToast('请输入昵称');
    appData.otherName = v; saveData(); updateHeader(); renderChatHistory(); closeModal('subOverlay'); showToast('昵称已更新');
}

// ========== 照片 ==========
function openPhotoMenu() { openModal('photoOverlay'); }
function takePhoto() { closeModal('photoOverlay'); pickFile(true); }
function pickLocalPhoto() { closeModal('photoOverlay'); pickFile(false); }
function pickFile(useCamera) {
    var input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    if (useCamera) input.setAttribute('capture', 'environment');
    input.onchange = function() { handlePhotoFile(input.files[0]); };
    input.click();
}
function handlePhotoFile(file) {
    if (!file) return;
    compressImage(file, 800, 800, 0.6).then(function(url) {
        var imageId = 'msgimg_' + Date.now() + '_' + Math.random().toString(36).substr(2,6);
        return saveImageToDB('images', imageId, url).then(function() {
            addMessage(url, 'me', true);
            appData.chatHistory.push({ type: 'me', content: '', imageId: imageId, time: Date.now() });
            return saveData();
        }).then(function() {
            setTimeout(function() { triggerAutoReply(); }, 400 + Math.random() * 800);
            checkStorageAfterUpload();
        });
    }).catch(function() { showToast('图片处理失败，请重试'); });
}
function checkStorageAfterUpload() {
    getStorageStats().then(function(stats) {
        if (stats.usagePercent > 85) {
            showToastLong('存储已使用 ' + stats.usagePercent + '%\n建议到数据管理清理聊天记录', 5000);
        }
    });
}

// ========== 聊天 ==========
function triggerAutoReply() {
    var replyCount = Math.floor(Math.random() * 3) + 1;
    function sendNext(index) {
        if (index >= replyCount) return;
        setTimeout(function() {
            sendRandomReply().then(function(sent) {
                if (sent === false && index === 0) {
                    addMessage('（还没有设置回复词库哦，去设置里添加一些吧~）', 'other');
                    appData.chatHistory.push({ type: 'other', content: '（还没有设置回复词库哦，去设置里添加一些吧~）', time: Date.now() });
                    saveData();
                }
                if (sent !== false) sendNext(index + 1);
            });
        }, 500 + Math.random() * 800);
    }
    sendNext(0);
}
function sendRandomReply() {
    var allReplies = getAllReplies();
    var hasEmoji = appData.emojiIds.length > 0;
    var hasText = allReplies.length > 0;
    if (!hasEmoji && !hasText) return Promise.resolve(false);
    if (hasEmoji && ((hasText && Math.random() < 0.3) || !hasText)) {
        var eid = appData.emojiIds[Math.floor(Math.random() * appData.emojiIds.length)];
        return getImageFromDB('images', eid).then(function(img) {
            if (!img) return false;
            addMessage(img, 'other', true);
            appData.chatHistory.push({ type: 'other', content: '', imageId: eid, time: Date.now() });
            return saveData().then(function() { return true; });
        });
    } else {
        var content = allReplies[Math.floor(Math.random() * allReplies.length)];
        addMessage(content, 'other', false);
        appData.chatHistory.push({ type: 'other', content: content, time: Date.now() });
        return saveData().then(function() { return true; });
    }
}
function sendMsg() {
    var input = document.getElementById('msgInput'); var msg = input.value.trim();
    if (!msg) return;
    addMessage(msg, 'me');
    appData.chatHistory.push({ type: 'me', content: msg, time: Date.now() });
    input.value = ''; saveData();
    setTimeout(function() { triggerAutoReply(); }, 400 + Math.random() * 1000);
}
function addMessage(content, type, isImage) {
    var chat = document.getElementById('chat'); var div = document.createElement('div');
    div.className = 'msg ' + type;
    var handler = type === 'other' ? 'onclick="onOtherAvatarClick()"' : 'onclick="onMyAvatarClick()"';
    var av = getAvatarHTMLSync(type === 'me');
    div.innerHTML = '<div class="avatar-wrap" ' + handler + '>' + av + '</div><div class="bubble">' + (isImage ? '<img class="msg-image" src="' + content + '">' : content) + '<span class="msg-time">' + formatTimeShort(Date.now()) + '</span></div>';
    chat.appendChild(div); chat.scrollTop = chat.scrollHeight;
}
function addMessageWithRole(content, role, roleClass) {
    var chat = document.getElementById('chat'); var div = document.createElement('div');
    div.className = 'msg other';
    var av = '<div class="avatar-placeholder" style="background:var(--' + (roleClass || 'role-a') + ');color:var(--text);">' + (role ? role.charAt(0) : '?') + '</div>';
    div.innerHTML = '<div class="avatar-wrap">' + av + '</div><div class="bubble"><span class="role-tag ' + (roleClass || 'role-a') + '">' + role + '</span><br>' + content + '<span class="msg-time">' + formatTimeShort(Date.now()) + '</span></div>';
    chat.appendChild(div); chat.scrollTop = chat.scrollHeight;
    appData.chatHistory.push({ type: 'other', content: '[' + role + '] ' + content, time: Date.now() });
    saveData();
}
function addSystemMsg(text) {
    var chat = document.getElementById('chat'); var div = document.createElement('div');
    div.className = 'system-msg'; div.textContent = text;
    chat.appendChild(div); chat.scrollTop = chat.scrollHeight;
    appData.chatHistory.push({ type: 'system', content: text, time: Date.now() });
    saveData();
}
function renderChatHistory() {
    var chat = document.getElementById('chat'); chat.innerHTML = '';
    if (!appData.chatHistory || appData.chatHistory.length === 0) {
        chat.innerHTML = '<div class="system-msg">和' + appData.otherName + '开始聊天吧~</div>';
        return Promise.resolve();
    }
    var promises = [];
    appData.chatHistory.forEach(function(m) {
        if (m.type === 'system') {
            var d = document.createElement('div'); d.className = 'system-msg'; d.textContent = m.content; chat.appendChild(d);
        } else {
            var d = document.createElement('div'); d.className = 'msg ' + m.type;
            var handler = m.type === 'other' ? 'onclick="onOtherAvatarClick()"' : 'onclick="onMyAvatarClick()"';
            var av = getAvatarHTMLSync(m.type === 'me');
            if (m.imageId) {
                promises.push(getImageFromDB('images', m.imageId).then(function(img) {
                    d.innerHTML = '<div class="avatar-wrap" ' + handler + '>' + av + '</div><div class="bubble">' + (img ? '<img class="msg-image" src="' + img + '" onerror="this.parentElement.textContent=\'[图片已失效]\';">' : '[图片已过期]') + '<span class="msg-time">' + formatTimeShort(m.time) + '</span></div>';
                    chat.appendChild(d);
                }));
            } else {
                var isImg = m.content && m.content.indexOf('data:image/') === 0;
                d.innerHTML = '<div class="avatar-wrap" ' + handler + '>' + av + '</div><div class="bubble">' + (isImg ? '<img class="msg-image" src="' + m.content + '">' : m.content) + '<span class="msg-time">' + formatTimeShort(m.time) + '</span></div>';
                chat.appendChild(d);
            }
        }
    });
    return Promise.all(promises).then(function() { chat.scrollTop = chat.scrollHeight; });
}

// ========== 更多面板 ==========
function toggleMorePanel() {
    var p = document.getElementById('morePanel');
    if (p.style.display === 'block') p.style.display = 'none';
    else { p.style.display = 'block'; renderMoreImages(); document.getElementById('morePanelHint').textContent = '当前：表情包'; }
}
function openEmojiTabInMore() { renderMoreImages(); document.getElementById('morePanelHint').textContent = '当前：表情包'; }
function renderMoreImages() {
    var grid = document.getElementById('morePanelImages'); if (!grid) return;
    var ids = appData.emojiIds;
    if (!ids || ids.length === 0) { grid.innerHTML = '<div style="text-align:center;color:var(--text-system);padding:20px;grid-column:1/-1;">还没有表情包，点击上方按钮上传</div>'; return; }
    grid.innerHTML = '';
    ids.forEach(function(id, idx) {
        getImageFromDB('images', id).then(function(url) {
            var cell = document.createElement('div'); cell.className = 'sub-item';
            cell.onclick = function() { sendFromMorePanel(idx); };
            if (url) cell.innerHTML = '<img src="' + url + '" onerror="this.parentElement.textContent=\'已失效\';">';
            else { cell.style.cssText += 'background:var(--border);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--text-system);'; cell.textContent = '已失效'; }
            grid.appendChild(cell);
        });
    });
}
function uploadToMorePanel() {
    var file = document.getElementById('moreFileInput').files[0]; if (!file) return;
    compressImage(file, 400, 400, 0.5).then(function(url) {
        var id = 'emoji_' + Date.now() + '_' + Math.random().toString(36).substr(2,6);
        return saveImageToDB('images', id, url).then(function() {
            if (!Array.isArray(appData.emojiIds)) appData.emojiIds = [];
            appData.emojiIds.push(id);
            return saveData();
        }).then(function() { renderMoreImages(); showToastLong('表情包上传成功！', 3500); checkStorageAfterUpload(); });
    }).catch(function() { showToast('上传失败，请重试'); });
    document.getElementById('moreFileInput').value = '';
}
function sendFromMorePanel(index) {
    if (!Array.isArray(appData.emojiIds) || index >= appData.emojiIds.length) return;
    getImageFromDB('images', appData.emojiIds[index]).then(function(url) {
        if (!url) { showToast('表情包已失效'); return; }
        addMessage(url, 'me', true);
        appData.chatHistory.push({ type: 'me', content: '', imageId: appData.emojiIds[index], time: Date.now() });
        saveData(); toggleMorePanel();
        setTimeout(function() { triggerAutoReply(); }, 400 + Math.random() * 800);
    });
}

// ========== 回复管理 ==========
function openReplyModal() {
    closeModal('settingsOverlay');
    var groupsHtml = '';
    appData.replyGroups.forEach(function(group, g) {
        var replyItems = '';
        group.replies.forEach(function(reply, r) {
            replyItems += '<div class="list-item"><input type="checkbox" class="cb" id="cb_' + g + '_' + r + '" data-group="' + g + '" data-idx="' + r + '"><span>' + reply + '</span><button class="del-sm" onclick="delReplySingle(' + g + ',' + r + ')">删除</button></div>';
        });
        groupsHtml += '<div class="group-block"><div class="group-header"><span>' + group.name + ' (' + group.replies.length + '条)</span><div><button onclick="renameGroup(' + g + ')">重命名</button><button onclick="delGroup(' + g + ')" style="color:var(--danger);">删除分组</button></div></div><div class="form-row"><textarea id="batchAdd_' + g + '" placeholder="批量添加回复（一行一个）"></textarea></div><div class="btn-row"><button class="btn-sm" onclick="addReplyBatchToGroup(' + g + ')">批量添加</button><button class="btn-sm outline" onclick="delSelectedReplies(' + g + ')">删除选中</button><button class="btn-sm outline" onclick="selectAllInGroup(' + g + ')">全选</button></div><div style="max-height:150px;overflow-y:auto;">' + (replyItems || '<div style="text-align:center;color:var(--text-system);padding:8px;">暂无回复</div>') + '</div></div>';
    });
    openSubModal('<h4>自定义回复</h4><button class="btn-sm" onclick="addNewGroup()" style="margin-bottom:10px;">+ 新建分组</button><div style="max-height:50vh;overflow-y:auto;">' + groupsHtml + '</div><button class="btn-close" onclick="closeModal(\'subOverlay\')" style="margin-top:12px;">关闭</button>');
}
function addNewGroup() { var n = prompt('分组名称'); if (!n) return; appData.replyGroups.push({name:n,replies:[]}); saveData(); openReplyModal(); showToast('分组已创建'); }
function renameGroup(g) { var n = prompt('新名称', appData.replyGroups[g].name); if (!n) return; appData.replyGroups[g].name = n; saveData(); openReplyModal(); showToast('已重命名'); }
function delGroup(g) { if (!confirm('删除分组"' + appData.replyGroups[g].name + '"?') || appData.replyGroups.length <= 1) { if (appData.replyGroups.length <= 1) showToast('至少保留一个分组'); return; } appData.replyGroups.splice(g,1); saveData(); openReplyModal(); showToast('分组已删除'); }
function addReplyBatchToGroup(g) { var t = document.getElementById('batchAdd_' + g).value.trim(); if (!t) return; var lines = t.split('\n').filter(function(l){return l.trim();}); if (!lines.length) return; appData.replyGroups[g].replies = appData.replyGroups[g].replies.concat(lines); saveData(); openReplyModal(); showToast('已添加 ' + lines.length + ' 条'); }
function delReplySingle(g, r) { var d = appData.replyGroups[g].replies[r]; appData.replyGroups[g].replies.splice(r,1); saveData(); openReplyModal(); showToast('已删除「' + d + '」'); }
function selectAllInGroup(g) { var cbs = document.querySelectorAll('#subModal input.cb[data-group="' + g + '"]'); var all = true; for (var i=0;i<cbs.length;i++) if (!cbs[i].checked) { all=false; break; } for (var j=0;j<cbs.length;j++) cbs[j].checked = !all; }
function delSelectedReplies(g) { var cbs = document.querySelectorAll('#subModal input.cb[data-group="' + g + '"]:checked'); if (!cbs.length) return showToast('请先勾选'); var idxs = []; for (var i=0;i<cbs.length;i++) idxs.push(parseInt(cbs[i].getAttribute('data-idx'))); idxs.sort(function(a,b){return b-a;}); for (var j=0;j<idxs.length;j++) appData.replyGroups[g].replies.splice(idxs[j],1); saveData(); openReplyModal(); showToast('已删除 ' + idxs.length + ' 条'); }

// ========== 表情管理 ==========
function openEmojiManageModal() {
    closeModal('settingsOverlay');
    openSubModal('<h4>表情包管理</h4><div class="subtitle">共 ' + appData.emojiIds.length + ' 个</div><div class="btn-row"><button class="btn-sm" onclick="document.getElementById(\'emojiManageUpload\').click()">上传表情包</button><button class="btn-sm outline" onclick="clearAllEmojis()">清空</button></div><input type="file" id="emojiManageUpload" accept="image/*" multiple style="display:none" onchange="uploadEmojiManage()"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px;max-height:220px;overflow-y:auto;" id="emojiManageGrid">加载中...</div><button class="btn-close" onclick="closeModal(\'subOverlay\')" style="margin-top:10px;">关闭</button>');
    renderEmojiManageGrid();
}
function renderEmojiManageGrid() {
    var grid = document.getElementById('emojiManageGrid'); if (!grid) return;
    if (!appData.emojiIds.length) { grid.innerHTML = '<div style="text-align:center;color:var(--text-system);grid-column:1/-1;padding:20px;">暂无表情包</div>'; return; }
    grid.innerHTML = '';
    appData.emojiIds.forEach(function(id, idx) {
        getImageFromDB('images', id).then(function(url) {
            var d = document.createElement('div');
            d.style.cssText = 'position:relative;border-radius:8px;overflow:hidden;aspect-ratio:1;';
            if (url) d.innerHTML = '<img src="' + url + '" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.textContent=\'已失效\';"><button onclick="delEmojiManage(' + idx + ')" style="position:absolute;top:2px;right:2px;background:var(--danger);color:white;border:none;border-radius:50%;width:20px;height:20px;font-size:11px;cursor:pointer;">x</button>';
            else { d.textContent = '已失效'; d.style.cssText += 'display:flex;align-items:center;justify-content:center;background:var(--border);font-size:11px;color:var(--text-system);'; }
            grid.appendChild(d);
        });
    });
}
function uploadEmojiManage() {
    var input = document.getElementById('emojiManageUpload'); var files = input.files;
    if (!files.length) return; var total = files.length;
    function processOne(index) {
        if (index >= files.length) { saveData().then(function() { renderEmojiManageGrid(); renderMoreImages(); showToast('已上传 ' + total + ' 个'); input.value = ''; }); return; }
        compressImage(files[index], 400, 400, 0.5).then(function(url) {
            var id = 'emoji_' + Date.now() + '_' + index;
            return saveImageToDB('images', id, url).then(function() {
                appData.emojiIds.push(id);
                processOne(index + 1);
            });
        }).catch(function() { processOne(index + 1); });
    }
    processOne(0);
}
function delEmojiManage(i) {
    deleteImageFromDB('images', appData.emojiIds[i]).catch(function(){});
    appData.emojiIds.splice(i,1); saveData(); renderMoreImages(); renderEmojiManageGrid(); showToast('已删除');
}
function clearAllEmojis() {
    if (!confirm('清空所有表情包？')) return;
    var ps = appData.emojiIds.map(function(id) { return deleteImageFromDB('images', id).catch(function(){}); });
    Promise.all(ps).then(function() { appData.emojiIds = []; return saveData(); }).then(function() { renderMoreImages(); renderEmojiManageGrid(); showToast('已清空'); });
}

// ========== 数据管理 ==========
function openBackupModal() {
    closeModal('settingsOverlay');
    getStorageStats().then(function(stats) {
        var barColor = stats.usagePercent > 80 ? 'var(--danger)' : (stats.usagePercent > 60 ? '#f0c78e' : 'var(--success)');
        var html = '<h4>数据管理</h4>';
        html += '<div class="subtitle">存储用量：' + formatBytes(stats.totalBytes) + ' / 约 ' + MAX_STORAGE_MB + ' MB</div>';
        html += '<div class="storage-bar-wrap"><div class="storage-bar-fill" style="width:' + stats.usagePercent + '%;background:' + barColor + ';"></div><div class="storage-bar-text">' + stats.usagePercent + '%</div></div>';
        html += '<div style="font-size:10px;color:var(--text-system);text-align:center;margin-bottom:8px;">图片：' + formatBytes(stats.imagesBytes) + ' | 头像：' + formatBytes(stats.avatarsBytes) + ' | 文字：' + formatBytes(stats.lsBytes) + '</div>';
        if (stats.usagePercent > 80) html += '<div style="text-align:center;color:var(--danger);font-size:12px;margin-bottom:8px;">存储空间紧张，建议清理</div>';
        html += '<div class="backup-options">';
        html += '<button onclick="exportFull()">全量备份 <span class="small-hint">（复制JSON到剪贴板-粘贴到备忘录）</span></button>';
        html += '<button onclick="exportChat()">聊天记录备份</button>';
        html += '<button onclick="exportLibs()">词库备份</button>';
        html += '</div>';
        html += '<div style="margin-top:12px;"><button class="btn-sm outline" onclick="document.getElementById(\'importDataFile\').click()">导入JSON备份文件</button><input type="file" id="importDataFile" accept=".json" style="display:none" onchange="importDataFile()"></div>';
        html += '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;"><button class="btn-sm danger-sm" onclick="clearChatHistory()">清除聊天记录</button><button class="btn-sm outline" onclick="cleanOrphanImages()">清理失效图片</button></div>';
        html += '<button class="btn-close" onclick="closeModal(\'subOverlay\')" style="margin-top:14px;">关闭</button>';
        openSubModal(html);
    });
}
function copyToClipboard(text, label) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
            showToastLong(label + '已复制到剪贴板\n请打开备忘录粘贴保存为 .json 文件\n以后可通过「导入JSON备份文件」恢复', 5000);
        }).catch(function() { fallbackCopy(text, label); });
    } else { fallbackCopy(text, label); }
}
function fallbackCopy(text, label) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
    document.body.appendChild(ta); ta.focus(); ta.select();
    try {
        document.execCommand('copy');
        showToastLong(label + '已复制到剪贴板\n请打开备忘录粘贴保存为 .json 文件\n以后可通过「导入JSON备份文件」恢复', 5000);
    } catch(e) { showToast('复制失败，请重试'); }
    document.body.removeChild(ta);
}
function exportFull() {
    copyToClipboard(JSON.stringify({
        myName: appData.myName, myAvatarId: appData.myAvatarId,
        otherName: appData.otherName, otherAvatarId: appData.otherAvatarId,
        replyGroups: appData.replyGroups, emojiIds: appData.emojiIds,
        theme: appData.theme, chatHistory: appData.chatHistory, letters: appData.letters
    }, null, 2), '全量备份');
    closeModal('subOverlay');
}
function exportChat() {
    copyToClipboard(JSON.stringify({ chatHistory: appData.chatHistory }, null, 2), '聊天记录');
    closeModal('subOverlay');
}
function exportLibs() {
    copyToClipboard(JSON.stringify({ replyGroups: appData.replyGroups, emojiIds: appData.emojiIds }, null, 2), '词库');
    closeModal('subOverlay');
}
function importDataFile() {
    var file = document.getElementById('importDataFile').files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var data = JSON.parse(e.target.result);
            if (!data || typeof data !== 'object') throw new Error('无效数据');
            if (typeof data.myName === 'string') appData.myName = data.myName;
            if (typeof data.myAvatarId === 'string') appData.myAvatarId = data.myAvatarId;
            if (typeof data.otherName === 'string') appData.otherName = data.otherName;
            if (typeof data.otherAvatarId === 'string') appData.otherAvatarId = data.otherAvatarId;
            if (typeof data.theme === 'string') appData.theme = data.theme;
            if (Array.isArray(data.emojiIds)) appData.emojiIds = data.emojiIds;
            if (Array.isArray(data.chatHistory)) appData.chatHistory = data.chatHistory;
            if (Array.isArray(data.letters)) appData.letters = data.letters;
            if (Array.isArray(data.replies) && !data.replyGroups) appData.replyGroups = [{ name: '默认分组', replies: data.replies }];
            else if (Array.isArray(data.replyGroups) && data.replyGroups.length > 0) appData.replyGroups = data.replyGroups;
            appData.myAvatar = ''; appData.otherAvatar = '';
            saveData(true); applyTheme(); updateHeader(); renderChatHistory(); updateLetterBadge();
            closeModal('subOverlay');
            showToastLong('数据已成功导入！\n昵称、词库、聊天记录已恢复\n图片需重新上传', 4000);
        } catch(err) { showToast('导入失败，文件格式错误'); }
    };
    reader.readAsText(file);
    document.getElementById('importDataFile').value = '';
}
function clearChatHistory() {
    if (!confirm('确定清除所有聊天记录？\n词库、表情包和设置会保留。')) return;
    var ps = appData.chatHistory.map(function(m) {
        return m.imageId ? deleteImageFromDB('images', m.imageId).catch(function(){}) : Promise.resolve();
    });
    Promise.all(ps).then(function() {
        appData.chatHistory = [];
        return saveData(true);
    }).then(function() {
        return autoCleanOrphanImages();
    }).then(function(cleaned) {
        renderChatHistory();
        closeModal('subOverlay');
        showToast('聊天记录已清除' + (cleaned > 0 ? '，释放了 ' + cleaned + ' 张图片' : ''));
    });
}
function cleanOrphanImages() {
    autoCleanOrphanImages().then(function(cleaned) {
        showToast(cleaned > 0 ? '清理了 ' + cleaned + ' 张失效图片' : '没有需要清理的图片');
        openBackupModal();
    });
}
function openSettings() { openModal('settingsOverlay'); }
function openSubModal(html) { document.getElementById('subModal').innerHTML = html; openModal('subOverlay'); }

// ========== Toast ==========
function showToast(msg) {
    var t = document.getElementById('toast'); if (!t) return;
    t.textContent = msg; t.style.display = 'block'; t.style.whiteSpace = 'normal';
    clearTimeout(t._timeout);
    t._timeout = setTimeout(function() { t.style.display = 'none'; }, 2400);
}
function showToastLong(msg, duration) {
    var t = document.getElementById('toast'); if (!t) return;
    t.textContent = msg; t.style.display = 'block'; t.style.whiteSpace = 'pre-line';
    clearTimeout(t._timeout);
    t._timeout = setTimeout(function() { t.style.display = 'none'; t.style.whiteSpace = 'normal'; }, duration || 3000);
}

// ========== 事件监听 ==========
document.addEventListener('click', function(e) {
    if (e.target.id === 'settingsOverlay') closeModal('settingsOverlay');
    if (e.target.id === 'subOverlay') closeModal('subOverlay');
    if (e.target.id === 'photoOverlay') closeModal('photoOverlay');
    if (e.target.id === 'letterOverlay') closeModal('letterOverlay');
    if (e.target.id === 'clueNotebookOverlay') closeClueNotebook();
});

// ========== 保存机制 ==========
document.addEventListener('visibilitychange', function() {
    if (document.hidden) { saveData(true); }
});
window.addEventListener('beforeunload', function() { saveData(true); });
window.addEventListener('pagehide', function() { saveData(true); });
setInterval(function() { saveData(true); }, 15000);
window.addEventListener('storage', function(e) {
    if (e.key === STORAGE_KEY && e.newValue) {
        console.log('检测到其他标签页的数据更新');
    }
});

// ========== 启动 ==========
initApp().then(function() {
    console.log('甜心助手启动成功！');
}).catch(function(e) {
    console.error('启动失败:', e);
});
