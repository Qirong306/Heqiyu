// ==================== 论坛功能模块 ====================

if (!Array.isArray(appData.forumTopics)) {
    appData.forumTopics = [];
}
if (!appData.forumReplies) {
    appData.forumReplies = {};
}
if (!Array.isArray(appData.forumReplyLib)) {
    appData.forumReplyLib = [
        { name: '默认话题词库', replies: ['有道理', '我也这么想', '没想过这个问题呢', '挺有意思的', '让我想想...'] }
    ];
}
if (!Array.isArray(appData.forumTopicTemplates)) {
    appData.forumTopicTemplates = [
        '你觉得{词}怎么样？', '聊聊{词}吧', '最近{词}有什么新鲜事吗？',
        '你喜欢{词}吗？', '{词}这个话题你感兴趣吗？'
    ];
}
if (!Array.isArray(appData.forumTopicWords)) {
    appData.forumTopicWords = [
        '夏天的夜晚', '一个人旅行', '养宠物', '下雨天', '深夜食堂',
        '童年的味道', '最喜欢的电影', '理想的生活', '咖啡还是茶'
    ];
}

var currentViewingTopicId = null;
var newTopicType = 'normal';
var newTopicOptions = [];
var newTopicSelectMode = 'multi';

function openForum() {
    closeAllFullscreens();
    
    var overlay = document.createElement('div');
    overlay.className = 'fullscreen-overlay active';
    overlay.id = 'forumFullscreen';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:var(--bg);z-index:500;display:flex;flex-direction:column;';
    
    overlay.innerHTML = `
        <div class="fullscreen-header">
            <button class="fullscreen-back" onclick="closeForumFullscreen()">
                <span class="back-arrow"></span> 返回
            </button>
            <span class="fullscreen-title">论坛</span>
            <span id="forumMenuBtn" style="font-size:20px;cursor:pointer;color:var(--text);padding:4px 8px;">☰</span>
        </div>
        <div class="fullscreen-body" id="forumFullscreenBody" style="padding:16px;flex:1;overflow-y:auto;">
            <div id="forumTopicList" style="text-align:left;"></div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // 用 addEventListener 绑定点击事件
    var menuBtn = overlay.querySelector('#forumMenuBtn');
    if (menuBtn) {
        menuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleForumMenu();
        });
    }
    
    var menuDiv = document.createElement('div');
    menuDiv.id = 'forumDropdownMenu';
    menuDiv.style.cssText = 'display:none;position:absolute;top:50px;right:16px;background:var(--panel-bg);border:2px solid var(--border);border-radius:var(--radius-sm);z-index:10;min-width:100px;box-shadow:0 4px 12px rgba(0,0,0,0.1);';
    menuDiv.innerHTML = `
        <div onclick="newForumTopic();closeForumMenu();" style="padding:10px 16px;cursor:pointer;font-size:14px;color:var(--text);border-bottom:1px solid var(--border);">新建话题</div>
        <div onclick="importForumJSON();closeForumMenu();" style="padding:10px 16px;cursor:pointer;font-size:14px;color:var(--text);border-bottom:1px solid var(--border);">导入话题</div>
        <div onclick="exportForumJSON();closeForumMenu();" style="padding:10px 16px;cursor:pointer;font-size:14px;color:var(--text);border-bottom:1px solid var(--border);">导出话题</div>
        <div onclick="openForumReplyLib();closeForumMenu();" style="padding:10px 16px;cursor:pointer;font-size:14px;color:var(--text);border-bottom:1px solid var(--border);">回复词库</div>
        <div onclick="openForumTemplateLib();closeForumMenu();" style="padding:10px 16px;cursor:pointer;font-size:14px;color:var(--text);border-bottom:1px solid var(--border);">模板词库</div>
        <div onclick="autoGenerateTopic();closeForumMenu();" style="padding:10px 16px;cursor:pointer;font-size:14px;color:var(--text);">自动生成</div>
    `;
    var header = overlay.querySelector('.fullscreen-header');
    header.appendChild(menuDiv);
    
    currentViewingTopicId = null;
    renderForumTopics();
}
function closeForumFullscreen() {
    var el = document.getElementById('forumFullscreen');
    if (el) el.remove();
}

window.openForum = openForum;
window.closeForumFullscreen = closeForumFullscreen;

function toggleForumMenu() {
    var menu = document.getElementById('forumDropdownMenu');
    if (menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function closeForumMenu() {
    var menu = document.getElementById('forumDropdownMenu');
    if (menu) menu.style.display = 'none';
}

function renderForumTopics() {
    var list = document.getElementById('forumTopicList');
    if (!list) return;
    if (appData.forumTopics.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-system);">暂无话题<br><span style="font-size:11px;">点击右上角菜单创建话题</span></div>';
        return;
    }
    var html = '';
    for (var i = appData.forumTopics.length - 1; i >= 0; i--) {
        var topic = appData.forumTopics[i];
        var safeId = (topic.id || '').replace(/'/g, "\\'");
        var replyCount = (appData.forumReplies[topic.id] || []).length;
        var typeLabel = topic.isOption ? (topic.selectMode === 'single' ? '单选' : '多选') : '讨论';
        html += '<div class="list-item" onclick="openTopicDetail(\'' + safeId + '\')" style="cursor:pointer;flex-direction:column;align-items:flex-start;">';
        html += '<div style="display:flex;align-items:center;gap:6px;width:100%;">';
        html += '<span style="font-size:10px;background:var(--accent);padding:2px 6px;border-radius:8px;color:var(--text);flex-shrink:0;">' + typeLabel + '</span>';
        html += '<span style="font-size:14px;font-weight:bold;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHTML(topic.title || '') + '</span>';
        html += '</div>';
        html += '<div style="font-size:11px;color:var(--text-secondary);margin-top:4px;">';
        html += escapeHTML(topic.author || '') + ' · ' + formatTimeShort(topic.time);
        html += ' · ' + replyCount + ' 回复';
        if (topic.isOption && topic.options) {
            var selectedCount = 0;
            if (topic.optionSelections) {
                for (var key in topic.optionSelections) {
                    if (topic.optionSelections[key] !== undefined) selectedCount++;
                }
            }
            if (selectedCount > 0) html += ' · 已选' + selectedCount + '项';
        }
        html += '</div>';
        html += '</div>';
    }
    list.innerHTML = html;
}

function newForumTopic() {
    closeForumMenu();
    newTopicType = 'normal';
    newTopicOptions = [];
    newTopicSelectMode = 'multi';
    renderNewTopicForm();
}

function renderNewTopicForm() {
    var html = '<h4>新建话题</h4>';
    html += '<div style="display:flex;gap:8px;justify-content:center;margin-bottom:12px;">';
    html += '<button class="btn-sm ' + (newTopicType === 'normal' ? '' : 'outline') + '" onclick="setTopicType(\'normal\')">普通话题</button>';
    html += '<button class="btn-sm ' + (newTopicType === 'option' ? '' : 'outline') + '" onclick="setTopicType(\'option\')">选项话题</button>';
    html += '</div>';
    html += '<div class="form-row">';
    html += '<label>话题标题</label>';
    html += '<input type="text" id="newTopicTitle" placeholder="输入话题标题">';
    html += '</div>';
    if (newTopicType === 'option') {
        html += '<div class="form-row">';
        html += '<label>选项列表</label>';
        html += '<div id="optionListContainer" style="max-height:180px;overflow-y:auto;">';
        if (newTopicOptions.length === 0) {
            html += '<div style="text-align:center;color:var(--text-system);padding:10px;font-size:12px;">点击下方按钮添加选项</div>';
        }
        for (var i = 0; i < newTopicOptions.length; i++) {
            html += '<div class="list-item" style="margin-bottom:4px;">';
            html += '<span style="flex:1;font-size:13px;">' + escapeHTML(newTopicOptions[i]) + '</span>';
            html += '<button class="del-sm" onclick="removeNewOption(' + i + ')">删除</button>';
            html += '</div>';
        }
        html += '</div>';
        html += '</div>';
        html += '<div class="form-row">';
        html += '<div style="display:flex;gap:6px;">';
        html += '<input type="text" id="newOptionInput" placeholder="输入选项内容" style="flex:1;">';
        html += '<button class="btn-sm" onclick="addNewOption()" style="flex-shrink:0;">添加</button>';
        html += '</div>';
        html += '</div>';
        html += '<div style="display:flex;gap:8px;justify-content:center;margin-bottom:8px;">';
        html += '<span style="font-size:11px;color:var(--text-secondary);">选择模式：</span>';
        html += '<button class="btn-sm ' + (newTopicSelectMode === 'single' ? '' : 'outline') + '" onclick="setSelectMode(\'single\')" style="font-size:11px;padding:4px 10px;">单选</button>';
        html += '<button class="btn-sm ' + (newTopicSelectMode === 'multi' ? '' : 'outline') + '" onclick="setSelectMode(\'multi\')" style="font-size:11px;padding:4px 10px;">多选</button>';
        html += '</div>';
        html += '<div style="font-size:11px;color:var(--text-system);margin-bottom:8px;text-align:center;">';
        html += '对方看到后会' + (newTopicSelectMode === 'single' ? '随机选择1个选项回复' : '随机选择1~3个选项回复');
        html += '</div>';
    }
    html += '<div class="form-row">';
    html += '<label>补充说明（可选）</label>';
    html += '<textarea id="newTopicContent" placeholder="补充说明内容..."></textarea>';
    html += '</div>';
    html += '<div class="btn-row" style="justify-content:center;">';
    html += '<button class="btn-sm" onclick="createNewTopic()">发布话题</button>';
    html += '<button class="btn-sm outline" onclick="cancelNewTopic()">取消</button>';
    html += '</div>';
    openForumSubModal(html);
}

function setTopicType(type) {
    newTopicType = type;
    if (type === 'option') { newTopicOptions = []; newTopicSelectMode = 'multi'; }
    renderNewTopicForm();
}

function setSelectMode(mode) {
    newTopicSelectMode = mode;
    renderNewTopicForm();
}

function addNewOption() {
    var input = document.getElementById('newOptionInput');
    if (!input) return;
    var val = input.value.trim();
    if (!val) { showToast('请输入选项内容'); return; }
    if (newTopicOptions.length >= 20) { showToast('最多20个选项'); return; }
    newTopicOptions.push(val);
    input.value = '';
    renderNewTopicForm();
}

function removeNewOption(index) {
    newTopicOptions.splice(index, 1);
    renderNewTopicForm();
}

function createNewTopic() {
    var titleEl = document.getElementById('newTopicTitle');
    var contentEl = document.getElementById('newTopicContent');
    var title = titleEl ? titleEl.value.trim() : '';
    var content = contentEl ? contentEl.value.trim() : '';
    if (!title) { showToast('请输入话题标题'); return; }
    if (newTopicType === 'option' && newTopicOptions.length < 2) { showToast('选项话题至少需要2个选项'); return; }
    var topic = {
        id: 'topic_' + Date.now(),
        title: title,
        content: content || '',
        author: appData.myName || '我',
        time: Date.now(),
        isOption: newTopicType === 'option',
        options: newTopicType === 'option' ? newTopicOptions.slice() : null,
        optionSelections: newTopicType === 'option' ? {} : null,
        selectMode: newTopicType === 'option' ? newTopicSelectMode : null
    };
    appData.forumTopics.push(topic);
    appData.forumReplies[topic.id] = [];
    saveData();
    closeModal('subOverlay');
    openForum();
    if (topic.isOption) {
        setTimeout(function() { autoSelectOption(topic); }, 1000 + Math.random() * 2000);
    }
    showToast('话题发布成功');
}

function cancelNewTopic() {
    closeModal('subOverlay');
    openForum();
}

function autoSelectOption(topic) {
    if (!topic.isOption || !topic.options || topic.options.length === 0) return;
    var freshTopic = appData.forumTopics.find(function(t) { return t.id === topic.id; });
    if (!freshTopic) return;
    if (!freshTopic.optionSelections) freshTopic.optionSelections = {};
    var count = freshTopic.selectMode === 'single' ? 1 : Math.min(Math.floor(Math.random() * 3) + 1, freshTopic.options.length);
    var shuffled = freshTopic.options.slice().sort(function() { return Math.random() - 0.5; });
    var selected = shuffled.slice(0, count);
    if (!appData.forumReplies[topic.id]) { appData.forumReplies[topic.id] = []; }
    var selectedNames = [];
    selected.forEach(function(opt) {
        var idx = freshTopic.options.indexOf(opt);
        if (idx >= 0) {
            freshTopic.optionSelections['ai_' + idx] = idx;
            selectedNames.push(opt);
        }
    });
    var replyContent = '我选：' + selectedNames.join('、');
    appData.forumReplies[topic.id].push({
        author: appData.otherName || '甜心助手',
        content: replyContent,
        time: Date.now(),
        isOptionSelect: true,
        selectedOptions: selectedNames
    });
    saveData();
    if (currentViewingTopicId === topic.id) { openTopicDetail(topic.id); }
    renderForumTopics();
}

function quickReplyToTopic(topicId) {
    var allReplies = [];
    (appData.forumReplyLib || []).forEach(function(group) {
        if (Array.isArray(group.replies)) { allReplies = allReplies.concat(group.replies); }
    });
    if (allReplies.length === 0) { showToast('回复词库为空，请先去菜单中添加'); return; }
    var randomReply = allReplies[Math.floor(Math.random() * allReplies.length)];
    addTopicReply(topicId, randomReply);
    showToast('已回复：' + randomReply.substring(0, 20) + '...');
    if (currentViewingTopicId === topicId) { openTopicDetail(topicId); }
    renderForumTopics();
}

function addTopicReply(topicId, content) {
    if (!appData.forumReplies[topicId]) { appData.forumReplies[topicId] = []; }
    appData.forumReplies[topicId].push({
        author: appData.otherName || '甜心助手',
        content: content,
        time: Date.now()
    });
    saveData();
}

function openTopicDetail(topicId) {
    var topic = appData.forumTopics.find(function(t) { return t.id === topicId; });
    if (!topic) { showToast('话题不存在'); return; }
    currentViewingTopicId = topicId;
    closeForumFullscreen();
    var safeId = topicId.replace(/'/g, "\\'");
    var replies = appData.forumReplies[topicId] || [];
    var html = '';
    html += '<div style="max-height:50vh;overflow-y:auto;padding-right:2px;">';
    html += '<h4>' + escapeHTML(topic.title || '') + '</h4>';
    html += '<div style="font-size:11px;color:var(--text-system);margin-bottom:10px;">';
    html += escapeHTML(topic.author || '') + ' · ' + formatTime(topic.time);
    if (topic.isOption) { html += ' · ' + (topic.selectMode === 'single' ? '单选' : '多选'); }
    html += '</div>';
    if (topic.content) {
        html += '<div style="background:var(--bubble-me);padding:10px 12px;border-radius:var(--radius-sm);margin-bottom:10px;font-size:14px;">';
        html += escapeHTML(topic.content);
        html += '</div>';
    }
    if (topic.isOption && topic.options) {
        html += '<div style="margin-bottom:10px;">';
        html += '<div style="font-size:12px;color:var(--text);margin-bottom:4px;">选项：</div>';
        for (var o = 0; o < topic.options.length; o++) {
            var isSelected = false;
            if (topic.optionSelections) {
                for (var k in topic.optionSelections) {
                    if (topic.optionSelections[k] === o) { isSelected = true; break; }
                }
            }
            html += '<div style="background:var(--item-bg);border-radius:var(--radius-sm);padding:8px 10px;margin-bottom:4px;font-size:13px;border:2px solid ' + (isSelected ? 'var(--accent)' : 'transparent') + ';">';
            html += escapeHTML(topic.options[o]);
            if (isSelected) { html += '<span style="font-size:10px;color:var(--accent);margin-left:4px;">已选</span>'; }
            html += '</div>';
        }
        html += '</div>';
    }
    html += '<div style="font-size:12px;color:var(--text);margin-bottom:6px;">回复 (' + replies.length + ')</div>';
    if (replies.length === 0) {
        html += '<div style="text-align:center;padding:8px;color:var(--text-system);font-size:12px;">暂无回复，来说点什么吧</div>';
    } else {
        for (var r = 0; r < replies.length; r++) {
            var reply = replies[r];
            var isMe = reply.author === appData.myName;
            var bubbleStyle = isMe ? 'var(--bubble-me)' : 'var(--bubble-other)';
            html += '<div style="background:' + bubbleStyle + ';border-radius:var(--radius-sm);padding:8px 10px;margin-bottom:4px;font-size:12px;">';
            html += '<div style="color:var(--text-secondary);font-size:10px;margin-bottom:2px;">';
            html += escapeHTML(reply.author || '') + ' · ' + formatTimeShort(reply.time);
            html += '</div>';
            html += '<div style="color:var(--text);">' + escapeHTML(reply.content || '') + '</div>';
            html += '</div>';
        }
    }
    html += '</div>';
    html += '<div style="display:flex;gap:6px;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid var(--border);flex-shrink:0;">';
    html += '<input type="text" id="topicReplyInput" placeholder="说点什么吧..." style="flex:1;padding:8px 12px;border:2px solid var(--border);border-radius:20px;background:var(--input-box);font-size:13px;font-family:var(--font-main);outline:none;color:var(--text);height:36px;min-width:0;" onkeypress="if(event.key==\'Enter\')sendTopicReply(\'' + safeId + '\')">';
    html += '<button class="btn-sm" onclick="sendTopicReply(\'' + safeId + '\')" style="flex-shrink:0;">发送</button>';
    html += '<button class="btn-sm outline" onclick="quickReplyToTopic(\'' + safeId + '\')" style="flex-shrink:0;">快捷回复</button>';
    html += '<button class="btn-sm danger-sm" onclick="deleteTopicFromDetail(\'' + safeId + '\')" style="flex-shrink:0;">删除</button>';
    html += '</div>';
    var detailContent = document.getElementById('forumDetailContent');
    var detailOverlay = document.getElementById('forumDetailOverlay');
    if (detailContent && detailOverlay) {
        detailContent.innerHTML = html;
        detailOverlay.classList.add('show');
    }
}

function closeTopicDetail() {
    var overlay = document.getElementById('forumDetailOverlay');
    if (overlay) overlay.classList.remove('show');
    currentViewingTopicId = null;
    openForum();
}

function sendTopicReply(topicId) {
    var input = document.getElementById('topicReplyInput');
    if (!input) return;
    var content = input.value.trim();
    if (!content) { showToast('请输入回复内容'); return; }
    if (!appData.forumReplies[topicId]) { appData.forumReplies[topicId] = []; }
    appData.forumReplies[topicId].push({
        author: appData.myName || '我',
        content: content,
        time: Date.now()
    });
    input.value = '';
    saveData();
    openTopicDetail(topicId);
    renderForumTopics();
}

function deleteTopicFromDetail(topicId) {
    if (!confirm('确定删除这个话题及其所有回复吗？')) return;
    var index = appData.forumTopics.findIndex(function(t) { return t.id === topicId; });
    if (index !== -1) {
        appData.forumTopics.splice(index, 1);
        delete appData.forumReplies[topicId];
        saveData();
        closeTopicDetail();
        openForum();
        showToast('话题已删除');
    }
}

function autoGenerateTopic() {
    closeForumMenu();
    var templates = appData.forumTopicTemplates || [];
    var words = appData.forumTopicWords || [];
    if (templates.length === 0 || words.length === 0) {
        showToast('模板词库为空，请先去菜单中添加');
        openForum();
        return;
    }
    var template = templates[Math.floor(Math.random() * templates.length)];
    var word = words[Math.floor(Math.random() * words.length)];
    var title = template.replace(/\{词\}/g, word);
    var topic = {
        id: 'topic_' + Date.now(),
        title: title,
        content: '',
        author: appData.otherName || '甜心助手',
        time: Date.now(),
        isOption: false,
        options: null,
        optionSelections: null,
        selectMode: null
    };
    appData.forumTopics.push(topic);
    appData.forumReplies[topic.id] = [];
    saveData();
    openForum();
    showToast('已自动生成一个新话题');
}

function exportForumJSON() {
    closeForumMenu();
    if (appData.forumTopics.length === 0) { showToast('当前没有话题可导出'); return; }
    var exportData = [];
    for (var i = 0; i < appData.forumTopics.length; i++) {
        var topic = appData.forumTopics[i];
        var replies = appData.forumReplies[topic.id] || [];
        exportData.push({
            title: topic.title,
            content: topic.content,
            author: topic.author,
            time: topic.time,
            isOption: topic.isOption,
            selectMode: topic.selectMode,
            options: topic.options,
            optionSelections: topic.optionSelections,
            replies: replies
        });
    }
    var jsonStr = JSON.stringify(exportData, null, 2);
    if (typeof copyToClipboard === 'function') {
        copyToClipboard(jsonStr, '话题数据');
    } else {
        var ta = document.createElement('textarea');
        ta.value = jsonStr;
        ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('话题数据已复制到剪贴板');
    }
    closeForumFullscreen();
}

function importForumJSON() {
    closeForumMenu();
    var html = '<h4>导入话题JSON</h4>';
    html += '<div class="form-row">';
    html += '<label>粘贴JSON内容</label>';
    html += '<textarea id="importForumJSON" placeholder=\'粘贴JSON内容\'></textarea>';
    html += '</div>';
    html += '<div class="btn-row" style="justify-content:center;">';
    html += '<button class="btn-sm" onclick="doImportForumJSON()">导入</button>';
    html += '<button class="btn-sm outline" onclick="cancelImportForumJSON()">取消</button>';
    html += '</div>';
    openForumSubModal(html);
}

function doImportForumJSON() {
    var textarea = document.getElementById('importForumJSON');
    if (!textarea) return;
    var jsonText = textarea.value.trim();
    if (!jsonText) { showToast('请粘贴JSON内容'); return; }
    try {
        var topics = JSON.parse(jsonText);
        if (!Array.isArray(topics)) throw new Error('JSON格式错误');
        var importedCount = 0;
        for (var i = 0; i < topics.length; i++) {
            var item = topics[i];
            if (item && item.title) {
                var newId = 'topic_' + Date.now() + '_' + i;
                var topic = {
                    id: newId,
                    title: item.title,
                    content: item.content || '',
                    author: item.author || appData.myName || '我',
                    time: Date.now(),
                    isOption: item.isOption || false,
                    selectMode: item.selectMode || 'multi',
                    options: item.options || null,
                    optionSelections: item.optionSelections || null
                };
                appData.forumTopics.push(topic);
                appData.forumReplies[newId] = [];
                if (Array.isArray(item.replies)) {
                    for (var r = 0; r < item.replies.length; r++) {
                        var reply = item.replies[r];
                        appData.forumReplies[newId].push({
                            author: reply.author || '未知',
                            content: reply.content || '',
                            time: reply.time || Date.now()
                        });
                    }
                }
                importedCount++;
            }
        }
        if (importedCount === 0) { showToast('没有有效的话题数据'); return; }
        saveData();
        closeModal('subOverlay');
        openForum();
        showToast('成功导入 ' + importedCount + ' 个话题');
    } catch (e) { showToast('JSON解析失败：' + e.message); }
}

function cancelImportForumJSON() {
    closeModal('subOverlay');
    openForum();
}

function openForumReplyLib() {
    closeForumMenu();
    var templates = appData.forumReplyLib || [];
    var html = '<h4>回复词库</h4>';
    html += '<div style="font-size:12px;color:var(--text-system);margin-bottom:8px;">管理快捷回复的素材库</div>';
    for (var g = 0; g < templates.length; g++) {
        var template = templates[g];
        var replies = template.replies || [];
        html += '<div class="group-block" style="margin-bottom:8px;">';
        html += '<div class="group-header">';
        html += '<span>' + escapeHTML(template.name) + ' (' + replies.length + '条)</span>';
        html += '<div>';
        html += '<button onclick="renameForumReplyLib(' + g + ')">重命名</button>';
        if (templates.length > 1) { html += '<button onclick="deleteForumReplyLib(' + g + ')" style="color:var(--danger);">删除</button>'; }
        html += '</div></div>';
        html += '<div class="form-row">';
        html += '<textarea id="batchAddForumReply_' + g + '" placeholder="批量添加回复（一行一个，自动去重）"></textarea>';
        html += '</div>';
        html += '<button class="btn-sm" onclick="addForumReplyBatch(' + g + ')">批量添加</button>';
        if (replies.length > 0) {
            html += '<div style="max-height:150px;overflow-y:auto;margin-top:8px;">';
            for (var r = 0; r < replies.length; r++) {
                html += '<div class="list-item">';
                html += '<span style="font-size:11px;flex:1;">' + escapeHTML(replies[r]) + '</span>';
                html += '<button class="del-sm" onclick="deleteForumReplyItem(' + g + ',' + r + ')">删除</button>';
                html += '</div>';
            }
            html += '</div>';
        }
        html += '</div>';
    }
    html += '<div class="btn-row">';
    html += '<button class="btn-sm" onclick="addForumReplyLibGroup()">新建分组</button>';
    html += '<button class="btn-sm outline" onclick="cancelForumSubAction()">关闭</button>';
    html += '</div>';
    openForumSubModal(html);
}

function addForumReplyBatch(g) {
    var textarea = document.getElementById('batchAddForumReply_' + g);
    if (!textarea) return;
    var text = textarea.value.trim();
    if (!text) { showToast('请输入回复内容'); return; }
    var lines = text.split('\n').filter(function(line) { return line.trim(); });
    if (lines.length === 0) { showToast('没有有效的回复内容'); return; }
    var existing = appData.forumReplyLib[g].replies || [];
    var newLines = lines.filter(function(line) { return existing.indexOf(line) === -1; });
    if (newLines.length === 0) { showToast('所有内容已存在，无新增'); return; }
    appData.forumReplyLib[g].replies = existing.concat(newLines);
    saveData();
    openForumReplyLib();
    var dupCount = lines.length - newLines.length;
    showToast('已添加 ' + newLines.length + ' 条' + (dupCount > 0 ? '（跳过 ' + dupCount + ' 条重复）' : ''));
}

function deleteForumReplyItem(g, r) {
    if (confirm('确定删除这条回复？')) {
        appData.forumReplyLib[g].replies.splice(r, 1);
        saveData();
        openForumReplyLib();
        showToast('回复已删除');
    }
}

function addForumReplyLibGroup() {
    var name = prompt('请输入分组名称', '新分组');
    if (!name) return;
    appData.forumReplyLib.push({ name: name, replies: [] });
    saveData();
    openForumReplyLib();
    showToast('分组已创建');
}

function renameForumReplyLib(g) {
    var name = prompt('请输入新名称', appData.forumReplyLib[g].name);
    if (!name) return;
    appData.forumReplyLib[g].name = name;
    saveData();
    openForumReplyLib();
    showToast('已重命名');
}

function deleteForumReplyLib(g) {
    if (appData.forumReplyLib.length <= 1) { showToast('至少保留一个分组'); return; }
    if (confirm('确定删除分组"' + appData.forumReplyLib[g].name + '"？')) {
        appData.forumReplyLib.splice(g, 1);
        saveData();
        openForumReplyLib();
        showToast('分组已删除');
    }
}

function openForumTemplateLib() {
    closeForumMenu();
    var templates = appData.forumTopicTemplates || [];
    var words = appData.forumTopicWords || [];
    var html = '<h4>话题模板词库</h4>';
    html += '<div style="font-size:12px;color:var(--text-system);margin-bottom:8px;">用于"自动生成话题"的素材库</div>';
    html += '<div class="group-block" style="margin-bottom:8px;">';
    html += '<div class="group-header"><span>句子模板 (' + templates.length + '条)</span></div>';
    html += '<div class="form-row"><textarea id="batchAddTemplates" placeholder="批量添加模板（一行一个）&#10;使用 {词} 作为占位符"></textarea></div>';
    html += '<button class="btn-sm" onclick="addForumTemplates()">批量添加</button>';
    if (templates.length > 0) {
        html += '<div style="max-height:120px;overflow-y:auto;margin-top:8px;">';
        for (var t = 0; t < templates.length; t++) {
            html += '<div class="list-item"><span style="font-size:11px;flex:1;">' + escapeHTML(templates[t]) + '</span><button class="del-sm" onclick="deleteForumTemplateItem(' + t + ')">删除</button></div>';
        }
        html += '</div>';
    }
    html += '</div>';
    html += '<div class="group-block" style="margin-bottom:8px;">';
    html += '<div class="group-header"><span>词语库 (' + words.length + '个)</span></div>';
    html += '<div class="form-row"><textarea id="batchAddWords" placeholder="批量添加词语（一行一个）"></textarea></div>';
    html += '<button class="btn-sm" onclick="addForumWords()">批量添加</button>';
    if (words.length > 0) {
        html += '<div style="max-height:120px;overflow-y:auto;margin-top:8px;">';
        for (var w = 0; w < words.length; w++) {
            html += '<div class="list-item"><span style="font-size:11px;flex:1;">' + escapeHTML(words[w]) + '</span><button class="del-sm" onclick="deleteForumWordItem(' + w + ')">删除</button></div>';
        }
        html += '</div>';
    }
    html += '</div>';
    html += '<div class="btn-row"><button class="btn-sm outline" onclick="cancelForumSubAction()">关闭</button></div>';
    openForumSubModal(html);
}

function addForumTemplates() {
    var textarea = document.getElementById('batchAddTemplates');
    if (!textarea) return;
    var text = textarea.value.trim();
    if (!text) { showToast('请输入模板内容'); return; }
    var lines = text.split('\n').filter(function(line) { return line.trim(); });
    if (lines.length === 0) { showToast('没有有效的模板'); return; }
    appData.forumTopicTemplates = (appData.forumTopicTemplates || []).concat(lines);
    saveData();
    openForumTemplateLib();
    showToast('已添加 ' + lines.length + ' 条模板');
}

function deleteForumTemplateItem(index) {
    if (confirm('确定删除这条模板？')) {
        appData.forumTopicTemplates.splice(index, 1);
        saveData();
        openForumTemplateLib();
        showToast('模板已删除');
    }
}

function addForumWords() {
    var textarea = document.getElementById('batchAddWords');
    if (!textarea) return;
    var text = textarea.value.trim();
    if (!text) { showToast('请输入词语'); return; }
    var lines = text.split('\n').filter(function(line) { return line.trim(); });
    if (lines.length === 0) { showToast('没有有效的词语'); return; }
    appData.forumTopicWords = (appData.forumTopicWords || []).concat(lines);
    saveData();
    openForumTemplateLib();
    showToast('已添加 ' + lines.length + ' 个词语');
}

function deleteForumWordItem(index) {
    if (confirm('确定删除这个词语？')) {
        appData.forumTopicWords.splice(index, 1);
        saveData();
        openForumTemplateLib();
        showToast('词语已删除');
    }
}

function openForumSubModal(html) {
    var subModal = document.getElementById('subModal');
    var subOverlay = document.getElementById('subOverlay');
    if (subModal && subOverlay) {
        subModal.innerHTML = html;
        subOverlay.classList.add('show');
    }
}

function cancelForumSubAction() {
    closeModal('subOverlay');
    openForum();
}

document.addEventListener('click', function(e) {
    if (e.target.id === 'forumDetailOverlay') { closeTopicDetail(); }
});

