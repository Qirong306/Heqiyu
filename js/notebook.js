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
        // 原有80个词条 + 新增40条情侣互动词
        notebookData.myTemplates = [
            // 原有词条（保留）
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
            "今天犯困了", "今天笑了很久", "今天很可爱", "今天被夸了", "今天运气很好",
            // ========== 新增：情侣互动词库（40条）==========
            // 一起做的事
            "我们一起吃了火锅", "我们一起看了电影", "我们一起散了步", "我们一起喝了奶茶", 
            "我们一起做了饭", "我们一起逛了超市", "我们一起晒太阳", "我们一起听了歌", 
            "我们一起打了游戏", "我们一起发了呆",
            // 甜言蜜语
            "你刚才那句话好甜", "你笑起来真好看", "我喜欢听你说话", "你让我今天很开心", 
            "你抱一下就好了", "你摸摸我的头好不好", "你今天特别可爱", "我又想你了", 
            "你在身边真好", "你是我今天的动力",
            // 早晚安
            "早安，今天也要开心", "晚安，梦里见", "早点睡，不许熬夜", "醒来第一个想到你", 
            "今天也梦到你了", "睡醒记得想我",
            // 撒娇/情绪
            "我今天有一点点不开心", "想被你夸一下", "你理理我嘛", "我刚刚笑出声了", 
            "我今天有一点累", "我好无聊，你在干嘛", "今天有没有想我", "我想粘着你",
            // 关心/互动邀请
            "记得喝水", "别太累了", "按时吃饭了吗", "今天也要好好休息", 
            "你开心我就开心", "来陪我聊聊天",
            // ========== 长句子·安慰/情绪照顾 ==========
            "不用硬撑，累了就靠着我，我扛得住你",
            "你不需要永远积极，偶尔丧气也没关系，我照样喜欢你",
            "今天要是受了委屈，回来我帮你骂回去",
            "你所有的情绪波动，我都接得住，放心发泄",
            "不需要强颜欢笑，在我这里你可以做真实的自己",
            "不开心就不开心，我陪你一起不开心，然后再一起开心起来",
            "你哭也好闹也好，我都在旁边陪着，不会走",
            "别把自己绷太紧，你已经做得很好了，够够的",

            // ========== 长句子·日常关怀 ==========
            "今天降温了，外套穿厚一点，别着凉",
            "出门前记得带伞，我看天气预报说要下雨",
            "冰箱里有水果，记得吃，再不吃就坏了",
            "你昨晚是不是又熬夜了，黑眼圈都出来了",
            "我给你点了外卖，大概半小时到，趁热吃",
            "枕头底下给你塞了暖宝宝，手冷的时候捂一下",
            "你今天走路步数还没达标，快起来溜达两圈",

            // ========== 长句子·睡前晚安 ==========
            "晚安，不许偷偷看手机了，我看着你呢",
            "关灯了，被子盖好，梦里记得想我",
            "今天辛苦了，好好睡一觉，明天又是新的一天",
            "你先睡，我再看你一会儿就去睡",
            "睡吧，所有的烦恼今晚都归我管，明天再还给你",
            "闭上眼睛，我数三下，你就睡着了，一、二、三，晚安",

            // ========== 长句子·恋爱表白 ==========
            "你是我一天中最期待的那条消息",
            "跟你在一起，连发发呆都觉得有意思",
            "别人再好都没用，你在我这里就是满分",
            "我好像比昨天更喜欢你了，这不科学",
            "你不在的时候，我连手机都不想看，就等你出现",
            "你不用做什么特别的事，站在那里我就心动了",
            "你大概不知道，你随便一句关心我能开心一整天",

            // ========== 长句子·鼓励打气 ==========
            "慢慢来，不着急，我会一直等你",
            "你比你自己想象的要厉害得多，相信我",
            "做不好也没关系，下次再来，我陪你练",
            "不用跟别人比，你今天的自己比昨天进步了就行",
            "你只管往前冲，剩下的交给我来兜底",

            // ========== 长句子·撒娇粘人 ==========
            "我在你手机里装了监控，发现你今天没怎么想我",
            "你不理我的时候，我就假装你很忙，其实我在偷偷委屈",
            "今天我有一点点想你，不对，是很大一点点",
            "你能不能主动找我一下，每次都我先找你，我不要面子吗",

            // ========== 长句子·随性浪漫 ==========
            "今天天气很好，适合想你，也适合被你想起",
            "不用说话，就这样待着，我就觉得很舒服",
            "你听，外面下雨了，刚好有借口不出门，陪你聊天",
            // ========== 长句子·关心/陪伴（30条）==========
            "下班路上车多，慢慢开，不用赶时间",
            "要是工作压力大了，随时跟我吐槽，我一直听着",
            "中午别光啃外卖，记得多吃点有营养的",
            "文件处理不完就留到明天，身体熬坏了得不偿失",
            "等你忙完这周，咱们挑个周末好好出去放松一下",
            "在公司受了气不用憋着，回家尽管冲我撒脾气",
            "记得多起身走动走动，别一整天钉在工位上",
            "不管今天业绩如何，你在我这里永远值得被偏爱",
            "就算工作再繁琐，也别忘了照顾好自己的情绪",
            "我已经提前备好夜宵，就等我的太太回家了",
            "不用事事追求完美，在我这里，你怎样都很好",
            "职场上该争取的大胆争取，我做你最硬的底气",
            "要是觉得累了，就给自己放个小假，我全力支持",
            "哪怕每天只有一小会儿空闲，我也等着跟你聊聊天，嗯，望妻石是这样的",
            "今天辛苦了，给你留了一盏灯，热汤在锅里",
            "不用急着回复我，你先忙，忙完记得想我就行",
            "你认真工作的样子很帅，但累倒的样子我会心疼",
            "不管多晚，我都等你回家了再睡",
            "你不需要总是那么坚强，在我面前可以随便哭随便笑",
            "今天有没有被人欺负？有的话我去找他理论",
            "你开心的时候我陪你笑，你难过的时候我肩膀借你",
            "不用把所有压力都扛在自己身上，分我一半",
            "你值得被温柔对待，尤其是被你自己",
            "累了就停下来，我陪你一起摆烂也行",
            "你不用成为谁的超人，做我的小朋友就够了",
            "今天也很喜欢你，明天也是，后天也是",
            "你的碎碎念我全部都爱听，一句都不会觉得烦",
            "你不需要完美，你只需要是你自己",
            "不管世界多大，你回头我就在",
            "你不是一个人，我一直在你身后"      
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
    
    var overlay = document.createElement('div');
    overlay.className = 'fullscreen-overlay active';
    overlay.id = 'notebookFullscreen';
    
    var myCount = notebookData.myEntries.length;
    var otherCount = notebookData.otherEntries.length;
    
    overlay.innerHTML = `
        <div class="fullscreen-header">
            <button class="fullscreen-back" onclick="closeNotebookFullscreen()">
                <span class="back-arrow"></span> 返回
            </button>
            <span class="fullscreen-title">情侣记事本</span>
            <span style="width:50px;"></span>
        </div>
        <div class="fullscreen-body" id="notebookFullscreenBody" style="padding:16px;">
            <div style="text-align:center;margin-bottom:16px;">
                <div style="font-size:14px;color:var(--text-secondary);">记录日常，分享生活</div>
                <div style="display:flex;gap:12px;justify-content:center;margin-top:12px;">
                    <div style="background:var(--item-bg);border-radius:12px;padding:8px 16px;flex:1;max-width:120px;border:2px solid var(--border);">
                        <div style="font-size:20px;font-weight:bold;">${myCount}</div>
                        <div style="font-size:11px;">我的记录</div>
                    </div>
                    <div style="background:var(--item-bg);border-radius:12px;padding:8px 16px;flex:1;max-width:120px;border:2px solid var(--border);">
                        <div style="font-size:20px;font-weight:bold;">${otherCount}</div>
                        <div style="font-size:11px;">对方的记录</div>
                    </div>
                </div>
            </div>
            <div class="btn-row" style="gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:16px;">
                <button class="btn-sm" onclick="showAddMyEntryModal()">写我的日常</button>
                <button class="btn-sm outline" onclick="showOtherEntriesModal()">看对方的日常</button>
                <button class="btn-sm outline" onclick="showMyTemplatesModal()">我的词条库</button>
                <button class="btn-sm outline" onclick="exportNotebook()">导出记事本</button>
                <button class="btn-sm outline" onclick="importNotebook()">导入记事本</button>
            </div>
            <div style="max-height:50vh;overflow-y:auto;" id="notebookPreviewListFullscreen"></div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    renderNotebookPreviewFullscreen();
}

function closeNotebookFullscreen() {
    var el = document.getElementById('notebookFullscreen');
    if (el) el.remove();
}

function renderNotebookPreviewFullscreen() {
    var container = document.getElementById('notebookPreviewListFullscreen');
    if (!container) return;
    
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
        container.innerHTML = '<div style="text-align:center;color:var(--text-system);padding:20px;">暂无记录，点击写我的日常</div>';
        return;
    }
    
    var html = '';
    for (var i = 0; i < allEntries.length; i++) {
        var item = allEntries[i];
        var entry = item.entry;
        var isMy = item.type === 'my';
        var label = isMy ? '我' : appData.otherName;
        var timeStr = formatTimeShort(entry.time);
        var commentCount = entry.comments ? entry.comments.length : 0;
        
        html += '<div style="background:var(--item-bg);border-radius:10px;padding:10px;margin-bottom:8px;border:1px solid var(--border);">' +
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
    container.innerHTML = html;
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

// ========== 新版：多选词条发布日常 ==========
var selectedTemplates = [];

function showAddMyEntryModal() {
    loadNotebookData();
    selectedTemplates = [];
    renderMultiSelectTemplateModal();
}

function renderMultiSelectTemplateModal() {
    var templatesHtml = '';
    var allTemplates = notebookData.myTemplates;
    
    for (var i = 0; i < allTemplates.length; i++) {
        var t = allTemplates[i];
        var isSelected = selectedTemplates.indexOf(i) !== -1;
        templatesHtml += '<button class="template-tag ' + (isSelected ? 'selected' : '') + '" data-idx="' + i + '" onclick="toggleTemplateSelect(' + i + ')">' + escapeHTML(t) + '</button>';
    }
    
    var previewContent = selectedTemplates.map(function(idx) { return allTemplates[idx]; }).join('。');
    if (previewContent) previewContent += '。';
    
    var html = '<div style="text-align:center;">' +
        '<h4>写我的日常</h4>' +
        '<div class="subtitle">点击词条多选，自动组合成日常（可手动修改）</div>' +
        '<div style="margin-bottom:8px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">' +
        '<button class="btn-sm outline" onclick="randomSelectTemplates()">🎲 随机选1-10条</button>' +
        '<button class="btn-sm outline" onclick="clearSelectedTemplates()">清空已选</button>' +
        '</div>' +
        '<div class="template-grid" style="max-height:200px;overflow-y:auto;margin-bottom:12px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center;padding:8px;background:var(--item-bg);border-radius:12px;">' +
        templatesHtml +
        '</div>' +
        '<div class="form-row">' +
        '<label>预览 / 编辑内容</label>' +
        '<textarea id="newEntryContent" placeholder="选中的词条会组合到这里，你也可以手动修改..." style="min-height:80px;">' + escapeHTML(previewContent) + '</textarea>' +
        '</div>' +
        '<div class="btn-row" style="justify-content:center;gap:8px;margin-top:12px;">' +
        '<button class="btn-sm" onclick="addMyEntryFromMultiSelect()">发布</button>' +
        '<button class="btn-sm outline" onclick="closeModal(\'subOverlay\')">取消</button>' +
        '</div>' +
        '</div>';
    openSubModal(html);
    
    // 监听 textarea 变化，允许用户手动编辑
    var textarea = document.getElementById('newEntryContent');
    if (textarea) {
        textarea.addEventListener('input', function() {
            // 用户手动编辑时，不清空 selectedTemplates，只是内容不同步回选中的词条
            // 保持选中状态不变，最终以 textarea 内容为准
        });
    }
}

function toggleTemplateSelect(idx) {
    var pos = selectedTemplates.indexOf(idx);
    if (pos === -1) {
        if (selectedTemplates.length >= 10) {
            showToast('最多选择10条词句');
            return;
        }
        selectedTemplates.push(idx);
    } else {
        selectedTemplates.splice(pos, 1);
    }
    renderMultiSelectTemplateModal();
}

function clearSelectedTemplates() {
    selectedTemplates = [];
    renderMultiSelectTemplateModal();
}

function randomSelectTemplates() {
    var allCount = notebookData.myTemplates.length;
    if (allCount === 0) {
        showToast('词条库为空');
        return;
    }
    var randomCount = Math.floor(Math.random() * 10) + 1; // 1-10条
    randomCount = Math.min(randomCount, allCount);
    
    var shuffled = [];
    for (var i = 0; i < allCount; i++) shuffled.push(i);
    for (var i = shuffled.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }
    selectedTemplates = shuffled.slice(0, randomCount);
    renderMultiSelectTemplateModal();
    showToast('已随机选择 ' + randomCount + ' 条词句');
}

function addMyEntryFromMultiSelect() {
    var content = document.getElementById('newEntryContent').value.trim();
    if (!content) {
        showToast('请填写日常内容');
        return;
    }
    
    var entry = {
        id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        content: content,
        time: Date.now(),
        comments: [],
        templateIds: selectedTemplates.slice() // 记录选了哪些词条（可选）
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

// 显示词条库管理（保留原有功能，同时支持新增）
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
        '<div class="subtitle">可多选组合成日常，支持随机1-10条</div>' +
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

// 对方添加日常（支持多选组合）
function showOtherAddEntryModal() {
    loadNotebookData();
    selectedTemplates = [];
    renderOtherMultiSelectModal();
}

function renderOtherMultiSelectModal() {
    var templatesHtml = '';
    var allTemplates = notebookData.myTemplates;
    
    for (var i = 0; i < allTemplates.length; i++) {
        var t = allTemplates[i];
        var isSelected = selectedTemplates.indexOf(i) !== -1;
        templatesHtml += '<button class="template-tag ' + (isSelected ? 'selected' : '') + '" data-idx="' + i + '" onclick="toggleOtherTemplateSelect(' + i + ')">' + escapeHTML(t) + '</button>';
    }
    
    var previewContent = selectedTemplates.map(function(idx) { return allTemplates[idx]; }).join('。');
    if (previewContent) previewContent += '。';
    
    var html = '<div style="text-align:center;">' +
        '<h4>写日常</h4>' +
        '<div class="subtitle">点击词条多选，自动组合（可手动修改）</div>' +
        '<div style="margin-bottom:8px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">' +
        '<button class="btn-sm outline" onclick="randomSelectOtherTemplates()">🎲 随机选1-10条</button>' +
        '<button class="btn-sm outline" onclick="clearOtherSelectedTemplates()">清空已选</button>' +
        '</div>' +
        '<div class="template-grid" style="max-height:200px;overflow-y:auto;margin-bottom:12px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center;padding:8px;background:var(--item-bg);border-radius:12px;">' +
        templatesHtml +
        '</div>' +
        '<div class="form-row">' +
        '<label>预览 / 编辑内容</label>' +
        '<textarea id="otherEntryContent" style="min-height:80px;">' + escapeHTML(previewContent) + '</textarea>' +
        '</div>' +
        '<div class="btn-row" style="justify-content:center;gap:8px;margin-top:12px;">' +
        '<button class="btn-sm" onclick="addOtherEntryFromMultiSelect()">发布</button>' +
        '<button class="btn-sm outline" onclick="closeModal(\'subOverlay\')">取消</button>' +
        '</div>' +
        '</div>';
    openSubModal(html);
}

function toggleOtherTemplateSelect(idx) {
    var pos = selectedTemplates.indexOf(idx);
    if (pos === -1) {
        if (selectedTemplates.length >= 10) {
            showToast('最多选择10条词句');
            return;
        }
        selectedTemplates.push(idx);
    } else {
        selectedTemplates.splice(pos, 1);
    }
    renderOtherMultiSelectModal();
}

function clearOtherSelectedTemplates() {
    selectedTemplates = [];
    renderOtherMultiSelectModal();
}

function randomSelectOtherTemplates() {
    var allCount = notebookData.myTemplates.length;
    if (allCount === 0) {
        showToast('词条库为空');
        return;
    }
    var randomCount = Math.floor(Math.random() * 10) + 1;
    randomCount = Math.min(randomCount, allCount);
    
    var shuffled = [];
    for (var i = 0; i < allCount; i++) shuffled.push(i);
    for (var i = shuffled.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }
    selectedTemplates = shuffled.slice(0, randomCount);
    renderOtherMultiSelectModal();
    showToast('已随机选择 ' + randomCount + ' 条词句');
}

function addOtherEntryFromMultiSelect() {
    var content = document.getElementById('otherEntryContent').value.trim();
    if (!content) {
        showToast('请填写日常内容');
        return;
    }
    
    var entry = {
        id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        content: content,
        time: Date.now(),
        comments: [],
        templateIds: selectedTemplates.slice()
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

// 对方随机发布日常（支持多词组合）
function otherRandomAddEntry() {
    if (notebookData.myTemplates.length === 0) return;
    if (Math.random() > 0.3) return;
    
    var randomCount = Math.floor(Math.random() * 5) + 1; // 1-5条
    randomCount = Math.min(randomCount, notebookData.myTemplates.length);
    
    var shuffled = [];
    for (var i = 0; i < notebookData.myTemplates.length; i++) shuffled.push(i);
    for (var i = shuffled.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }
    var selectedIdx = shuffled.slice(0, randomCount);
    var content = selectedIdx.map(function(idx) { return notebookData.myTemplates[idx]; }).join('。') + '。';
    
    var entry = {
        id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        content: content,
        time: Date.now(),
        comments: [],
        templateIds: selectedIdx
    };
    notebookData.otherEntries.unshift(entry);
    if (notebookData.otherEntries.length > 100) notebookData.otherEntries.pop();
    saveNotebookData();
    
    sendNotebookToChat(appData.otherName, content);
}

// 定时检查对方随机发布
setInterval(function() {
    otherRandomAddEntry();
}, 120000);

// 添加样式（多选标签样式）
(function addTemplateTagStyles() {
    if (document.getElementById('notebook-tag-styles')) return;
    var style = document.createElement('style');
    style.id = 'notebook-tag-styles';
    style.textContent = `
        .template-tag {
            padding: 8px 14px;
            background: var(--item-bg);
            border: 2px solid var(--border);
            border-radius: 24px;
            font-size: 13px;
            color: var(--text);
            cursor: pointer;
            transition: all 0.2s;
            font-family: var(--font-main);
            letter-spacing: 0.5px;
            white-space: nowrap;
        }
        .template-tag:active {
            transform: scale(0.95);
        }
        .template-tag.selected {
            background: var(--accent);
            border-color: var(--accent);
            color: var(--text);
        }
        .template-grid {
            max-height: 200px;
            overflow-y: auto;
        }
        .template-grid::-webkit-scrollbar {
            width: 3px;
        }
    `;
    document.head.appendChild(style);
})();
window.openNotebookModal = openNotebookModal;
window.closeNotebookFullscreen = closeNotebookFullscreen;
