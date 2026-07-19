// ==================== 自定义回复管理 ====================

// 注意：replyGroups 数据已经在 core.js 的 DEFAULT_DATA 中初始化
// 如果用户没有修改过，会自动使用下面的内置数据
// 此文件只负责管理界面的打开和操作

function openReplyModal() {
    closeModal('settingsOverlay');
    var groupsHtml = '';
    appData.replyGroups.forEach(function(group, g) {
        var replyItems = '';
        group.replies.forEach(function(reply, r) {
            replyItems += '<div class="list-item"><input type="checkbox" class="cb" id="cb_' + g + '_' + r + '" data-group="' + g + '" data-idx="' + r + '"><span>' + escapeHTML(reply) + '</span><button class="del-sm" onclick="delReplySingle(' + g + ',' + r + ')">删除</button></div>';
        });
        groupsHtml += '<div class="group-block"><div class="group-header"><span>' + escapeHTML(group.name) + ' (' + group.replies.length + '条)</span><div><button onclick="renameGroup(' + g + ')">重命名</button><button onclick="delGroup(' + g + ')" style="color:var(--danger);">删除分组</button></div></div><div class="form-row"><textarea id="batchAdd_' + g + '" placeholder="批量添加回复（一行一个，自动去重）"></textarea></div><div class="btn-row"><button class="btn-sm" onclick="addReplyBatchToGroup(' + g + ')">批量添加</button><button class="btn-sm outline" onclick="delSelectedReplies(' + g + ')">删除选中</button><button class="btn-sm outline" onclick="selectAllInGroup(' + g + ')">全选</button></div><div style="max-height:150px;overflow-y:auto;">' + (replyItems || '<div style="text-align:center;color:var(--text-system);padding:8px;">暂无回复</div>') + '</div></div>';
    });
    
    var headerHtml = '<div style="display:flex;align-items:center;justify-content:center;position:relative;margin-bottom:10px;">';
    headerHtml += '<h4 style="margin:0;">自定义回复</h4>';
    headerHtml += '<div style="position:absolute;right:0;">';
    headerHtml += '<span onclick="event.stopPropagation();toggleReplyLibMenu()" style="font-size:18px;cursor:pointer;color:var(--text);padding:4px 8px;">&#9776;</span>';
    headerHtml += '<div id="replyLibMenu" style="display:none;position:absolute;top:30px;right:0;background:var(--panel-bg);border:2px solid var(--border);border-radius:var(--radius-sm);z-index:10;min-width:100px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">';
    headerHtml += '<div onclick="exportReplyLib();closeReplyLibMenu();" style="padding:10px 16px;cursor:pointer;font-size:14px;color:var(--text);border-bottom:1px solid var(--border);">导出回复</div>';
    headerHtml += '<div onclick="importReplyLib();closeReplyLibMenu();" style="padding:10px 16px;cursor:pointer;font-size:14px;color:var(--text);">导入回复</div>';
    headerHtml += '</div></div></div>';
    
    openSubModal(headerHtml + '<button class="btn-sm" onclick="addNewGroup()" style="margin-bottom:10px;">+ 新建分组</button><div style="max-height:50vh;overflow-y:auto;">' + groupsHtml + '</div><button class="btn-close" onclick="closeModal(\'subOverlay\')" style="margin-top:12px;">关闭</button>');
}

function toggleReplyLibMenu() {
    var m = document.getElementById('replyLibMenu');
    if (m) m.style.display = m.style.display === 'block' ? 'none' : 'block';
}

function closeReplyLibMenu() {
    var m = document.getElementById('replyLibMenu');
    if (m) m.style.display = 'none';
}

function exportReplyLib() {
    copyToClipboard(JSON.stringify({ replyGroups: appData.replyGroups }, null, 2), '自定义回复');
    showToast('回复词库已复制到剪贴板');
}

function importReplyLib() {
    var input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = function() {
        var file = input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var data = JSON.parse(e.target.result);
                if (Array.isArray(data.replyGroups) && data.replyGroups.length > 0) {
                    appData.replyGroups = data.replyGroups;
                } else if (Array.isArray(data) && data.length > 0) {
                    appData.replyGroups = [{ name: '导入分组', replies: data }];
                } else {
                    throw new Error('格式错误');
                }
                saveData();
                openReplyModal();
                showToast('回复词库已导入');
            } catch(err) { showToast('文件格式错误'); }
        };
        reader.readAsText(file);
    };
    input.click();
}

function addNewGroup() { 
    var n = prompt('分组名称'); 
    if (!n) return; 
    appData.replyGroups.push({name:n, replies:[]}); 
    saveData(); 
    openReplyModal(); 
    showToast('分组已创建'); 
}

function renameGroup(g) { 
    var n = prompt('新名称', appData.replyGroups[g].name); 
    if (!n) return; 
    appData.replyGroups[g].name = n; 
    saveData(); 
    openReplyModal(); 
    showToast('已重命名'); 
}

function delGroup(g) { 
    if (!confirm('删除分组"' + appData.replyGroups[g].name + '"?') || appData.replyGroups.length <= 1) { 
        if (appData.replyGroups.length <= 1) showToast('至少保留一个分组'); 
        return; 
    } 
    appData.replyGroups.splice(g,1); 
    saveData(); 
    openReplyModal(); 
    showToast('分组已删除'); 
}

function addReplyBatchToGroup(g) {
    var t = document.getElementById('batchAdd_' + g).value.trim();
    if (!t) return;
    var lines = t.split('\n').filter(function(l){return l.trim();});
    if (!lines.length) return;
    var existing = appData.replyGroups[g].replies || [];
    var newLines = lines.filter(function(line) { return existing.indexOf(line) === -1; });
    if (newLines.length === 0) { showToast('所有内容已存在，无新增'); return; }
    appData.replyGroups[g].replies = existing.concat(newLines);
    saveData(); 
    openReplyModal();
    var dupCount = lines.length - newLines.length;
    showToast('已添加 ' + newLines.length + ' 条' + (dupCount > 0 ? '（跳过 ' + dupCount + ' 条重复）' : ''));
}

function delReplySingle(g, r) { 
    var d = appData.replyGroups[g].replies[r]; 
    appData.replyGroups[g].replies.splice(r,1); 
    saveData(); 
    openReplyModal(); 
    showToast('已删除「' + d + '」'); 
}

function selectAllInGroup(g) { 
    var cbs = document.querySelectorAll('#subModal input.cb[data-group="' + g + '"]'); 
    var all = true; 
    for (var i=0;i<cbs.length;i++) if (!cbs[i].checked) { all=false; break; } 
    for (var j=0;j<cbs.length;j++) cbs[j].checked = !all; 
}

function delSelectedReplies(g) { 
    var cbs = document.querySelectorAll('#subModal input.cb[data-group="' + g + '"]:checked'); 
    if (!cbs.length) return showToast('请先勾选'); 
    var idxs = []; 
    for (var i=0;i<cbs.length;i++) idxs.push(parseInt(cbs[i].getAttribute('data-idx'))); 
    idxs.sort(function(a,b){return b-a;}); 
    for (var j=0;j<idxs.length;j++) appData.replyGroups[g].replies.splice(idxs[j],1); 
    saveData(); 
    openReplyModal(); 
    showToast('已删除 ' + idxs.length + ' 条'); 
}
// 确保导出到全局
window.openReplyModal = openReplyModal;
window.exportReplyLib = exportReplyLib;
window.importReplyLib = importReplyLib;
window.addNewGroup = addNewGroup;
window.renameGroup = renameGroup;
window.delGroup = delGroup;
window.addReplyBatchToGroup = addReplyBatchToGroup;
window.delReplySingle = delReplySingle;
window.selectAllInGroup = selectAllInGroup;
window.delSelectedReplies = delSelectedReplies;
window.toggleReplyLibMenu = toggleReplyLibMenu;
window.closeReplyLibMenu = closeReplyLibMenu;
