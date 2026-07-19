// ==================== 状态词库管理 ====================

// 注意：statusList 数据已经在 core.js 的 DEFAULT_DATA 中初始化
// 下面这些是内置的默认状态词库（共约130个词）

function updateStatus() {
    var now = Date.now();
    var lastTime = appData.lastStatusTime || 0;
    
    // 4小时 = 4 * 60 * 60 * 1000 毫秒
    if (now - lastTime >= 4 * 60 * 60 * 1000 || !appData.currentStatus) {
        var list = appData.statusList || ['发呆'];
        var randomIndex = Math.floor(Math.random() * list.length);
        appData.currentStatus = list[randomIndex];
        appData.lastStatusTime = now;
        saveData();
        renderStatus();
    }
}

function renderStatus() {
    var statusEl = document.getElementById('otherStatus');
    if (statusEl) {
        statusEl.textContent = '✨ ' + (appData.currentStatus || '发呆');
    }
}

function openStatusManageModal() {
    closeModal('settingsOverlay');
    var html = '<h4>对方状态词库</h4>';
    html += '<div class="subtitle">对方会随机从这些词中选择显示状态（约4小时换一次）</div>';
    html += '<div class="form-row">';
    html += '<textarea id="statusListInput" rows="6" placeholder="每行一个状态词&#10;例如：&#10;看书&#10;听音乐&#10;喝咖啡"></textarea>';
    html += '</div>';
    html += '<div class="btn-row" style="gap:8px;flex-wrap:wrap;">';
    html += '<button class="btn-sm" onclick="saveStatusList()">保存词库</button>';
    html += '<button class="btn-sm outline" onclick="exportStatusList()">导出词库</button>';
    html += '<button class="btn-sm outline" onclick="importStatusList()">导入词库</button>';
    html += '<button class="btn-sm outline" onclick="closeModal(\'subOverlay\')">取消</button>';
    html += '</div>';
    openSubModal(html);
    
    var textarea = document.getElementById('statusListInput');
    if (textarea && appData.statusList) {
        textarea.value = appData.statusList.join('\n');
    }
}

// 导出状态词库
function exportStatusList() {
    if (!appData.statusList || appData.statusList.length === 0) {
        showToast('状态词库为空，无法导出');
        return;
    }
    var exportData = {
        type: 'statusList',
        version: '1.0',
        data: appData.statusList,
        count: appData.statusList.length,
        exportTime: new Date().toISOString()
    };
    var jsonStr = JSON.stringify(exportData, null, 2);
    
    var html = '<div style="text-align:center;">' +
        '<h4>导出状态词库</h4>' +
        '<div class="subtitle">共 ' + appData.statusList.length + ' 个状态词</div>' +
        '<div class="btn-row" style="gap:8px;margin:12px 0;">' +
        '<button class="btn-sm" onclick="copyStatusListToClipboard()">复制到剪贴板</button>' +
        '<button class="btn-sm outline" onclick="downloadStatusListFile()">下载为文件</button>' +
        '</div>' +
        '<textarea readonly style="width:100%;height:120px;font-size:11px;margin:8px 0;padding:8px;border-radius:6px;background:var(--item-bg);border:1px solid var(--border);">' + escapeHTML(jsonStr) + '</textarea>' +
        '<button class="btn-close" onclick="closeModal(\'subOverlay\')">关闭</button>' +
        '</div>';
    openSubModal(html);
}

function copyStatusListToClipboard() {
    var exportData = {
        type: 'statusList',
        version: '1.0',
        data: appData.statusList,
        count: appData.statusList.length
    };
    copyToClipboard(JSON.stringify(exportData, null, 2), '状态词库');
    closeModal('subOverlay');
}

function downloadStatusListFile() {
    var exportData = {
        type: 'statusList',
        version: '1.0',
        data: appData.statusList,
        count: appData.statusList.length,
        exportTime: new Date().toISOString()
    };
    var jsonStr = JSON.stringify(exportData, null, 2);
    var blob = new Blob([jsonStr], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'status_list_' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    closeModal('subOverlay');
    showToast('状态词库已下载');
}

// 导入状态词库
function importStatusList() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function() {
        var file = input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var data = JSON.parse(e.target.result);
                var newList = null;
                
                if (Array.isArray(data)) {
                    newList = data;
                } else if (data.type === 'statusList' && Array.isArray(data.data)) {
                    newList = data.data;
                } else if (Array.isArray(data.statusList)) {
                    newList = data.statusList;
                } else if (data.data && Array.isArray(data.data)) {
                    newList = data.data;
                }
                
                if (newList && newList.length > 0) {
                    newList = newList.filter(function(item) { return item && item.trim(); });
                    if (newList.length === 0) throw new Error('没有有效的状态词');
                    
                    appData.statusList = newList;
                    saveData();
                    showToast('导入成功，共 ' + newList.length + ' 个状态词');
                    updateStatus();
                    renderStatus();
                    openStatusManageModal();
                } else {
                    throw new Error('格式错误或内容为空');
                }
            } catch(err) {
                console.error('导入错误:', err);
                showToast('导入失败，文件格式错误');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function saveStatusList() {
    var textarea = document.getElementById('statusListInput');
    if (!textarea) return;
    var lines = textarea.value.split('\n').filter(function(l) { return l.trim(); });
    if (lines.length === 0) {
        showToast('至少需要一个状态词');
        return;
    }
    appData.statusList = lines;
    saveData();
    closeModal('subOverlay');
    showToast('状态词库已保存');
    updateStatus();
}
// 确保导出到全局（使用 _ 前缀避免冲突）
window._openStatusManageModal = openStatusManageModal;
window._exportStatusList = exportStatusList;
window._importStatusList = importStatusList;
window._saveStatusList = saveStatusList;
window._copyStatusListToClipboard = copyStatusListToClipboard;
window._downloadStatusListFile = downloadStatusListFile;
