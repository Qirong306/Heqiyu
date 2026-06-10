// ==================== 情侣记事本 ====================
var notebookData = {
    myEntries: [],
    otherEntries: [],
    myTemplates: []
};
var NOTEBOOK_STORAGE_KEY = 'notebook_data_v1';

// 加载记事本数据
function loadNotebookData() {
    var saved = localStorage.getItem(NOTEBOOK_STORAGE_KEY);
    if (saved) {
        try {
            var data = JSON.parse(saved);
            notebookData.myEntries = data.myEntries || [];
            notebookData.otherEntries = data.otherEntries || [];
            notebookData.myTemplates = data.myTemplates || [];
        } catch(e) { console.error('加载记事本失败:', e); }
    }
    if (notebookData.myTemplates.length === 0) {
        // 内置80个词条模板
        notebookData.myTemplates = [
            "今天心情很好", "今天有点累", "今天很开心", "今天有点难过", "今天很充实",
            "今天很无聊", "今天很兴奋", "今天很平静", "今天很感动", "今天很期待",
            "今天工作效率很高", "今天加班了", "今天学到了新东西", "今天完成了任务", "今天被表扬了",
            "今天遇到了困难", "今天开会很久", "今天很有灵感", "今天考试顺利", "今天项目上线了",
            "今天想你了", "今天梦到你了", "今天收到惊喜", "今天约会很开心", "今天被暖到了",
            "今天有点想你", "今天很甜", "今天说了晚安", "今天一起吃饭", "今天牵手了",
            "今天吃了好吃的", "今天喝奶茶了", "今天自己做饭了", "今天吃火锅了", "今天吃烧烤了",
            "今天吃甜品了", "今天吃水果了", "今天喝咖啡了", "今天吃早餐了", "今天吃宵夜了",
            "今天运动了", "今天早起了", "今天早睡了", "今天喝了很多水", "今天走了很多路",
            "今天跑步了", "今天健身了", "今天瑜伽了", "今天爬山了", "今天骑车了",
            "今天打扫卫生了", "今天洗衣服了", "今天整理房间了", "今天买花了", "今天逛超市了",
            "今天看电影了", "今天听音乐了", "今天看书了", "今天写日记了", "今天拍照了",
            "今天天气很好", "今天下雨了", "今天出太阳了", "今天很热", "今天很冷",
            "今天刮风了", "今天下雪了", "今天阴天", "今天彩虹出现了", "今天晚霞很美",
            "今天摸鱼了", "今天发呆了", "今天打游戏赢了", "今天追剧了", "今天睡懒觉了",
            "今天犯困了", "今天笑了很久", "今天很可爱", "今天被夸了", "今天运气很好"
        ];
        saveNotebookData();
    }
}

function saveNotebookData() {
    localStorage.setItem(NOTEBOOK_STORAGE_KEY, JSON.stringify(notebookData));
}

// 打开记事本主界面
function openNotebookModal() {
    loadNotebookData();
    closeModal('settingsOverlay');
    
    var myCount = notebookData.myEntries.length;
    var otherCount = notebookData.otherEntries.length;
    
    var html = '<div style="text-align:center;">' +
        '<h3>情侣记事本</h3>' +
        '<div class="subtitle">记录日常，分享生活</div>' +
        '<div style="display:flex;gap:12px;justify-content:center;margin-bottom:16px;">' +
        '<div style="background:var(--item-bg);border-radius:12px;padding:8px 16px;flex:1;"><div style="font-size:20px;font-weight:bold;">' + myCount + '</div><div style="font-size:11px;">我的记录</div></div>' +
        '<div style="background:var(--item-bg);border-radius:12px;padding:8px 16px;flex:1;"><div style="font-size:20px;font-weight:bold;">' + otherCount + '</div><div style="font-size:11px;">对方的记录</div></div>' +
        '</div>' +
        '<div class="btn-row" style="gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:16px;">' +
        '<button class="btn-sm" onclick="showAddMyEntryModal()">写我的日常</button>' +
        '<button class="btn-sm outline" onclick="showOtherEntriesModal()">看对方的日常</button>' +
        '<button class="btn-sm outline" onclick="showMyTemplatesModal()">我的词条库</button>' +
        '<button class="btn-sm outline" onclick="exportNotebook()">导出记事本</button>' +
        '<button class="btn-sm outline" onclick="importNotebook()">导入记事本</button>' +
        '</div>' +
        '<div style="max-height:300px;overflow-y:auto;text-align:left;" id="notebookPreviewList">' +
        renderNotebookPreview() +
        '</div>' +
        '<button class="btn-close" onclick="closeModal(\'subOverlay\')" style="margin-top:12px;">关闭</button>' +
        '</div>';
    openSubModal(html);
}

function renderNotebookPreview() {
    var allEntries = [];
    for (var i = 0; i < notebookData.myEntries.length; i++) {
        allEntries.push({ type: 'my', entry: notebookData.myEntries[i] });
    }
    for (var i = 0; i < notebookData.otherEntries.length; i++) {
        allEntries.push({ type: 'other', entry: notebookData.otherEntries[i] });
    }
    allEntries.sort(function(a, b) { return b.entry.time - a.entry.time; });
    allEntries = allEntries.slice(0, 10);
    
    if (allEntries.length === 0) {
        return '<div style="text-align:center;color:var(--text-system);padding:20px;">暂无记录，点击写我的日常</div>';
    }
    
    var html = '';
    for (var i = 0; i < allEntries.length; i++) {
        var item = allEntries[i];
        var entry = item.entry;
        var isMy = item.type === 'my';
        var label = isMy ? '我' : appData.otherName;
        var timeStr = formatTimeShort(entry.time);
        var commentCount = entry.comments ? entry.comments.length : 0;
        
        html += '<div style="background:var(--item-bg);border-radius:10px;padding:10px;margin-bottom:8px;">' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:6px;">' +
            '<span style="font-size:12px;font-weight:bold;color:var(--accent);">' + escapeHTML(label) + '</span>' +
            '<span style="font-size:10px;color:var(--text-system);">' + timeStr + '</span>' +
            '</div>' +
            '<div style="font-size:13px;margin-bottom:6px;">' + escapeHTML(entry.content) + '</div>' +
            '<div style="display:flex;justify-content:space-between;align-items:center;">' +
            '<span style="font-size:10px;color:var(--text-system);">评论(' + commentCount + ')</span>' +
            '<button class="del-sm" onclick="viewEntryDetail(\'' + entry.id + '\', \'' + (isMy ? 'my' : 'other') + '\')" style="font-size:10px;padding:2px 8px;">查看评论</button>' +
            '</div>' +
            '</div>';
    }
    return html;
}

// 显示添加我的日常弹窗
function showAddMyEntryModal() {
    loadNotebookData();
    
    var templatesHtml = '';
    if (notebookData.myTemplates.length > 0) {
        templatesHtml = '<div style="margin-top:8px;"><div class="subtitle" style="font-size:11px;">快捷词条</div><div style="display:flex;flex-wrap:wrap;gap:6px;">';
        for (var i = 0; i < notebookData.myTemplates.length; i++) {
            var t = notebookData.myTemplates[i];
            templatesHtml += '<button class="btn-sm outline" onclick="document.getElementById(\'newEntryContent\').value=\'' + escapeHTML(t).replace(/'/g, "\\'") + '\'" style="font-size:10px;padding:4px 8px;">' + escapeHTML(t) + '</button>';
        }
        templatesHtml += '</div></div>';
    }
    
    var html = '<div style="text-align:center;">' +
        '<h4>写我的日常</h4>' +
        '<div class="subtitle">记录今天的点滴</div>' +
        '<div class="form-row">' +
        '<textarea id="newEntryContent" placeholder="写下你的日常..." style="min-height:100px;"></textarea>' +
        '</div>' +
        templatesHtml +
        '<div class="btn-row" style="justify-content:center;gap:8px;margin-top:12px;">' +
        '<button class="btn-sm" onclick="addMyEntry()">发布</button>' +
        '<button class="btn-sm outline" onclick="closeModal(\'subOverlay\')">取消</button>' +
        '</div>' +
        '</div>';
    openSubModal(html);
}

// 添加我的日常
function addMyEntry() {
    var content = document.getElementById('newEntryContent').value.trim();
    if (!content) {
        showToast('请填写日常内容');
        return;
    }
    
    var entry = {
        id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        content: content,
        time: Date.now(),
        comments: []
    };
    notebookData.myEntries.unshift(entry);
    if (notebookData.myEntries.length > 100) notebookData.myEntries.pop();
    saveNotebookData();
    
    sendNotebookToChat('我', content);
    
    closeModal('subOverlay');
    showToast('日常已发布');
    openNotebookModal();
}

// 显示对方的日常列表
function showOtherEntriesModal() {
    loadNotebookData();
    
    if (notebookData.otherEntries.length === 0) {
        var html = '<div style="text-align:center;">' +
            '<h4>对方的日常</h4>' +
            '<div class="subtitle" style="margin:16px 0;">暂无记录</div>' +
            '<button class="btn-close" onclick="closeModal(\'subOverlay\')">关闭</button>' +
            '</div>';
        openSubModal(html);
        return;
    }
    
    var entriesHtml = '';
    for (var i = 0; i < notebookData.otherEntries.length; i++) {
        var entry = notebookData.otherEntries[i];
        var timeStr = formatTimeShort(entry.time);
        var commentCount = entry.comments ? entry.comments.length : 0;
        
        entriesHtml += '<div style="background:var(--item-bg);border-radius:10px;padding:10px;margin-bottom:8px;">' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:6px;">' +
            '<span style="font-size:12px;font-weight:bold;color:var(--accent);">' + escapeHTML(appData.otherName) + '</span>' +
            '<span style="font-size:10px;color:var(--text-system);">' + timeStr + '</span>' +
            '</div>' +
            '<div style="font-size:13px;margin-bottom:6px;">' + escapeHTML(entry.content) + '</div>' +
            '<div style="display:flex;justify-content:space-between;align-items:center;">' +
            '<span style="font-size:10px;color:var(--text-system);">评论(' + commentCount + ')</span>' +
            '<button class="del-sm" onclick="viewEntryDetail(\'' + entry.id + '\', \'other\')" style="font-size:10px;padding:2px 8px;">查看评论</button>' +
            '</div>' +
            '</div>';
    }
    
    var html = '<div style="text-align:center;">' +
        '<h4>对方的日常</h4>' +
        '<div class="subtitle">共 ' + notebookData.otherEntries.length + ' 条记录</div>' +
        '<div style="max-height:400px;overflow-y:auto;text-align:left;">' + entriesHtml + '</div>' +
        '<button class="btn-close" onclick="closeModal(\'subOverlay\')" style="margin-top:12px;">关闭</button>' +
        '</div>';
    openSubModal(html);
}

// 查看条目详情和评论
function viewEntryDetail(entryId, type) {
    var entry = null;
    if (type === 'my') {
        entry = notebookData.myEntries.find(function(e) { return e.id === entryId; });
    } else {
        entry = notebookData.otherEntries.find(function(e) { return e.id === entryId; });
    }
    if (!entry) return;
    
    var commentsHtml = '';
    if (entry.comments && entry.comments.length > 0) {
        for (var i = 0; i < entry.comments.length; i++) {
            var c = entry.comments[i];
            var commenter = c.by === 'me' ? '我' : appData.otherName;
            commentsHtml += '<div style="background:var(--item-bg);border-radius:8px;padding:6px 10px;margin-bottom:6px;">' +
                '<span style="font-size:11px;font-weight:bold;color:var(--accent);">' + escapeHTML(commenter) + '</span> ' +
                '<span style="font-size:12px;">' + escapeHTML(c.content) + '</span>' +
                '<span style="font-size:10px;color:var(--text-system);margin-left:8px;">' + formatTimeShort(c.time) + '</span>' +
                '</div>';
        }
    } else {
        commentsHtml = '<div style="text-align:center;color:var(--text-system);padding:16px;">暂无评论</div>';
    }
    
    var html = '<div style="text-align:center;">' +
        '<h4>日常详情</h4>' +
        '<div style="background:var(--item-bg);border-radius:10px;padding:12px;margin:12px 0;text-align:left;">' +
        '<div style="margin-bottom:8px;color:var(--accent);">' + (type === 'my' ? '我的记录' : appData.otherName + '的记录') + '</div>' +
        '<div style="font-size:14px;margin-bottom:12px;">' + escapeHTML(entry.content) + '</div>' +
        '<div style="font-size:10px;color:var(--text-system);">' + formatTimeShort(entry.time) + '</div>' +
        '</div>' +
        '<div style="text-align:left;"><div style="font-weight:bold;margin-bottom:8px;">评论</div>' + commentsHtml + '</div>' +
        '<div class="form-row" style="margin-top:12px;">' +
        '<textarea id="commentContent" placeholder="写下评论..." style="min-height:60px;"></textarea>' +
        '</div>' +
        '<div class="btn-row" style="justify-content:center;gap:8px;">' +
        '<button class="btn-sm" onclick="addComment(\'' + entryId + '\', \'' + type + '\')">发送评论</button>' +
        '<button class="btn-sm outline" onclick="closeModal(\'subOverlay\')">关闭</button>' +
        '</div>' +
        '</div>';
    openSubModal(html);
}

// 添加评论
function addComment(entryId, type) {
    var content = document.getElementById('commentContent').value.trim();
    if (!content) {
        showToast('请填写评论');
        return;
    }
    
    var comment = {
        content: content,
        time: Date.now(),
        by: 'me'
    };
    
    if (type === 'my') {
        var myEntry = notebookData.myEntries.find(function(e) { return e.id === entryId; });
        if (myEntry) {
            if (!myEntry.comments) myEntry.comments = [];
            myEntry.comments.push(comment);
        }
    } else {
        var otherEntry = notebookData.otherEntries.find(function(e) { return e.id === entryId; });
        if (otherEntry) {
            if (!otherEntry.comments) otherEntry.comments = [];
            otherEntry.comments.push(comment);
        }
    }
    saveNotebookData();
    
    closeModal('subOverlay');
    showToast('评论已发送');
    viewEntryDetail(entryId, type);
}

// 显示词条库管理
function showMyTemplatesModal() {
    loadNotebookData();
    
    var templatesHtml = '';
    for (var i = 0; i < notebookData.myTemplates.length; i++) {
        templatesHtml += '<div class="list-item">' +
            '<span>' + escapeHTML(notebookData.myTemplates[i]) + '</span>' +
            '<button class="del-sm" onclick="deleteTemplate(' + i + ')">删除</button>' +
            '</div>';
    }
    
    var html = '<div style="text-align:center;">' +
        '<h4>我的词条库</h4>' +
        '<div class="subtitle">对方发布日常时可选择这些词条</div>' +
        '<div class="form-row">' +
        '<input type="text" id="newTemplateInput" placeholder="输入新词条">' +
        '<button class="btn-sm" onclick="addTemplate()" style="margin-top:4px;">添加</button>' +
        '</div>' +
        '<div style="max-height:250px;overflow-y:auto;text-align:left;">' + templatesHtml + '</div>' +
        '<div class="btn-row" style="margin-top:12px;">' +
        '<button class="btn-sm outline" onclick="exportTemplates()">导出词条</button>' +
        '<button class="btn-sm outline" onclick="importTemplates()">导入词条</button>' +
        '</div>' +
        '<button class="btn-close" onclick="closeModal(\'subOverlay\')" style="margin-top:12px;">关闭</button>' +
        '</div>';
    openSubModal(html);
}

function addTemplate() {
    var input = document.getElementById('newTemplateInput');
    var text = input.value.trim();
    if (!text) {
        showToast('请输入词条');
        return;
    }
    notebookData.myTemplates.push(text);
    saveNotebookData();
    input.value = '';
    showMyTemplatesModal();
    showToast('词条已添加');
}

function deleteTemplate(index) {
    notebookData.myTemplates.splice(index, 1);
    saveNotebookData();
    showMyTemplatesModal();
    showToast('已删除');
}

// 发送到聊天界面
function sendNotebookToChat(name, content) {
    var msg = name + ' 的日常：' + content;
    addSystemMsg(msg);
}

// 对方添加日常（供对方使用词条库）
function showOtherAddEntryModal() {
    loadNotebookData();
    
    var templatesHtml = '';
    if (notebookData.myTemplates.length > 0) {
        templatesHtml = '<div style="margin-top:8px;"><div class="subtitle" style="font-size:11px;">快捷词条（来自对方词库）</div><div style="display:flex;flex-wrap:wrap;gap:6px;">';
        for (var i = 0; i < notebookData.myTemplates.length; i++) {
            var t = notebookData.myTemplates[i];
            templatesHtml += '<button class="btn-sm outline" onclick="document.getElementById(\'otherEntryContent\').value=\'' + escapeHTML(t).replace(/'/g, "\\'") + '\'" style="font-size:10px;padding:4px 8px;">' + escapeHTML(t) + '</button>';
        }
        templatesHtml += '</div></div>';
    }
    
    var html = '<div style="text-align:center;">' +
        '<h4>写日常</h4>' +
        '<div class="subtitle">记录你的日常</div>' +
        '<div class="form-row">' +
        '<textarea id="otherEntryContent" placeholder="写下你的日常..." style="min-height:100px;"></textarea>' +
        '</div>' +
        templatesHtml +
        '<div class="btn-row" style="justify-content:center;gap:8px;margin-top:12px;">' +
        '<button class="btn-sm" onclick="addOtherEntry()">发布</button>' +
        '<button class="btn-sm outline" onclick="closeModal(\'subOverlay\')">取消</button>' +
        '</div>' +
        '</div>';
    openSubModal(html);
}

// 对方添加日常
function addOtherEntry() {
    var content = document.getElementById('otherEntryContent').value.trim();
    if (!content) {
        showToast('请填写日常内容');
        return;
    }
    
    var entry = {
        id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        content: content,
        time: Date.now(),
        comments: []
    };
    notebookData.otherEntries.unshift(entry);
    if (notebookData.otherEntries.length > 100) notebookData.otherEntries.pop();
    saveNotebookData();
    
    sendNotebookToChat(appData.otherName, content);
    
    closeModal('subOverlay');
    showToast('日常已发布');
}

// 导出记事本
function exportNotebook() {
    var exportData = {
        type: 'notebook',
        version: '1.0',
        data: notebookData,
        exportTime: new Date().toISOString()
    };
    var jsonStr = JSON.stringify(exportData, null, 2);
    
    var html = '<div style="text-align:center;">' +
        '<h4>导出记事本</h4>' +
        '<div class="subtitle">共 ' + notebookData.myEntries.length + ' 条我的记录，' + notebookData.otherEntries.length + ' 条对方记录</div>' +
        '<div class="btn-row" style="gap:8px;margin:12px 0;">' +
        '<button class="btn-sm" onclick="copyNotebookToClipboard()">复制到剪贴板</button>' +
        '<button class="btn-sm outline" onclick="downloadNotebookFile()">下载为文件</button>' +
        '</div>' +
        '<textarea readonly style="width:100%;height:120px;font-size:11px;margin:8px 0;padding:8px;border-radius:6px;background:var(--item-bg);border:1px solid var(--border);">' + escapeHTML(jsonStr) + '</textarea>' +
        '<button class="btn-close" onclick="closeModal(\'subOverlay\')">关闭</button>' +
        '</div>';
    openSubModal(html);
}

function copyNotebookToClipboard() {
    var exportData = {
        type: 'notebook',
        version: '1.0',
        data: notebookData
    };
    copyToClipboard(JSON.stringify(exportData, null, 2), '记事本');
    closeModal('subOverlay');
}

function downloadNotebookFile() {
    var exportData = {
        type: 'notebook',
        version: '1.0',
        data: notebookData,
        exportTime: new Date().toISOString()
    };
    var jsonStr = JSON.stringify(exportData, null, 2);
    var blob = new Blob([jsonStr], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'notebook_' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    closeModal('subOverlay');
    showToast('记事本已下载');
}

// 导入记事本
function importNotebook() {
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
                var newData = null;
                
                if (data.type === 'notebook' && data.data) {
                    newData = data.data;
                } else if (data.myEntries && data.otherEntries) {
                    newData = data;
                } else if (data.data && data.data.myEntries) {
                    newData = data.data;
                }
                
                if (newData && (newData.myEntries || newData.otherEntries || newData.myTemplates)) {
                    notebookData.myEntries = newData.myEntries || [];
                    notebookData.otherEntries = newData.otherEntries || [];
                    notebookData.myTemplates = newData.myTemplates || [];
                    saveNotebookData();
                    showToast('导入成功');
                    openNotebookModal();
                } else {
                    throw new Error('格式错误');
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

// 导出词条
function exportTemplates() {
    var exportData = {
        type: 'templates',
        version: '1.0',
        data: notebookData.myTemplates
    };
    copyToClipboard(JSON.stringify(exportData, null, 2), '词条库');
    closeModal('subOverlay');
    showToast('词条库已复制到剪贴板');
}

// 导入词条
function importTemplates() {
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
                var newTemplates = null;
                
                if (Array.isArray(data)) {
                    newTemplates = data;
                } else if (data.type === 'templates' && Array.isArray(data.data)) {
                    newTemplates = data.data;
                } else if (Array.isArray(data.templates)) {
                    newTemplates = data.templates;
                }
                
                if (newTemplates && newTemplates.length > 0) {
                    notebookData.myTemplates = newTemplates;
                    saveNotebookData();
                    showToast('导入成功，共 ' + newTemplates.length + ' 个词条');
                    showMyTemplatesModal();
                } else {
                    throw new Error('格式错误');
                }
            } catch(err) {
                showToast('导入失败，文件格式错误');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// 对方随机发布日常
function otherRandomAddEntry() {
    if (notebookData.myTemplates.length === 0) return;
    if (Math.random() > 0.01) return;
    
    var randomIndex = Math.floor(Math.random() * notebookData.myTemplates.length);
    var content = notebookData.myTemplates[randomIndex];
    
    var entry = {
        id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        content: content,
        time: Date.now(),
        comments: []
    };
    notebookData.otherEntries.unshift(entry);
    if (notebookData.otherEntries.length > 100) notebookData.otherEntries.pop();
    saveNotebookData();
    
    sendNotebookToChat(appData.otherName, content);
}

// 定时检查对方随机发布（每2分钟检查一次）
setInterval(function() {
    otherRandomAddEntry();
}, 120000);
