// ==================== 功能模块 ====================
// 塔罗占卜、书籍阅读、论坛（增强版：目录+划线笔记）

// ==================== 塔罗模块 ====================

// 78张完整塔罗牌库
var majorArcana = [
    { name: "愚者", upright: "新的开始，冒险，天真，无限可能。", reversed: "鲁莽，轻率，犹豫不决，错失良机。" },
    { name: "魔术师", upright: "创造力，技能，意志，显化力量。", reversed: "欺骗，能力不足，计划受阻，滥用才华。" },
    { name: "女祭司", upright: "直觉，神秘，潜意识，内在智慧。", reversed: "忽视直觉，秘密暴露，肤浅，情绪压抑。" },
    { name: "皇后", upright: "丰饶，母性，自然，感官享受。", reversed: "依赖，创造力受阻，空虚，浪费。" },
    { name: "皇帝", upright: "权威，结构，稳定，领导力。", reversed: "暴政，僵化，失控，缺乏自律。" },
    { name: "教皇", upright: "信仰，传统，精神指引，教育。", reversed: "打破传统，非正统，盲目追随，教条。" },
    { name: "恋人", upright: "爱，和谐，关系，选择与结合。", reversed: "分离，背叛，错误选择，价值观冲突。" },
    { name: "战车", upright: "胜利，意志，决心，克服冲突。", reversed: "失控，失败，攻击性，缺乏方向。" },
    { name: "力量", upright: "勇气，内在力量，耐心，温柔驯服。", reversed: "软弱，自我怀疑，冲动，滥用力量。" },
    { name: "隐士", upright: "内省，孤独，寻求真理，指引之光。", reversed: "孤立，寂寞，逃避现实，固执。" },
    { name: "命运之轮", upright: "命运，转折，循环，机遇来临。", reversed: "厄运，阻力，停滞，不必要的变动。" },
    { name: "正义", upright: "公正，真相，因果，法律与平衡。", reversed: "不公，偏见，逃避责任，失衡。" },
    { name: "倒吊人", upright: "牺牲，换个视角，等待，灵性启迪。", reversed: "停滞，无谓牺牲，抗拒，自私。" },
    { name: "死神", upright: "结束，转变，重生，放下过去。", reversed: "抗拒改变，停滞不前，恐惧终结。" },
    { name: "节制", upright: "调和，中庸，耐心，流动与平衡。", reversed: "失衡，过度，缺乏协调，冲突。" },
    { name: "恶魔", upright: "欲望，束缚，物质主义，阴影自我。", reversed: "摆脱束缚，觉醒，拒绝诱惑，重获自由。" },
    { name: "高塔", upright: "突变，崩塌，觉醒，颠覆旧有。", reversed: "逃避灾难，恐惧变化，勉强维持。" },
    { name: "星星", upright: "希望，信念，疗愈，宁静与启迪。", reversed: "绝望，失去信心，悲观，忽视美好。" },
    { name: "月亮", upright: "幻觉，恐惧，潜意识，朦胧与不安。", reversed: "释放恐惧，看清真相，克服焦虑。" },
    { name: "太阳", upright: "喜悦，成功，活力，清晰与温暖。", reversed: "暂时挫折，阴霾，缺乏活力，消极。" },
    { name: "审判", upright: "重生，召唤，清算，内在觉醒。", reversed: "抗拒召唤，逃避审判，遗憾，无法释怀。" },
    { name: "世界", upright: "完成，整合，成就，旅程圆满。", reversed: "未完成，延迟，空虚，缺乏归属。" }
];

var minorArcana = [
    { name: "权杖王牌", upright: "灵感，新行动，热情，潜能。", reversed: "延迟，缺乏动力，错失开端。" },
    { name: "权杖二", upright: "规划，未来愿景，抉择，进展。", reversed: "恐惧未知，计划混乱，犹豫。" },
    { name: "权杖三", upright: "扩张，远见，探索，贸易。", reversed: "挫折，缺乏远见，延误。" },
    { name: "权杖四", upright: "庆祝，和谐，稳固，家园。", reversed: "不稳定，家庭冲突，过渡期。" },
    { name: "权杖五", upright: "竞争，冲突，挑战，活力。", reversed: "避免冲突，内部矛盾，妥协。" },
    { name: "权杖六", upright: "胜利，认可，自信，进步。", reversed: "自大，失败，缺乏认可。" },
    { name: "权杖七", upright: "坚守，勇气，防御立场，挑战。", reversed: "退缩，被压垮，放弃防守。" },
    { name: "权杖八", upright: "迅速行动，消息，旅行，进展。", reversed: "延迟，混乱，停滞，沟通不畅。" },
    { name: "权杖九", upright: "韧性，坚持，最后坚守，警惕。", reversed: "固执，精疲力竭，放弃。" },
    { name: "权杖十", upright: "负担，责任，压力，完成。", reversed: "卸下重担，逃避责任，过度劳累。" },
    { name: "权杖侍从", upright: "探索，新消息，热情，无畏。", reversed: "鲁莽，坏消息，缺乏方向。" },
    { name: "权杖骑士", upright: "行动，冒险，冲动，激情。", reversed: "鲁莽，急躁，分散精力。" },
    { name: "权杖王后", upright: "温暖，活力，决心，独立。", reversed: "嫉妒，自私，情绪化。" },
    { name: "权杖国王", upright: "领导力，远见，创业，荣耀。", reversed: "暴政，冲动，期望过高。" },
    { name: "圣杯王牌", upright: "爱之始，情感流淌，直觉喜悦。", reversed: "空虚，情感受阻，浪费爱。" },
    { name: "圣杯二", upright: "结合，伙伴关系，共鸣。", reversed: "分离，失衡，信任破裂。" },
    { name: "圣杯三", upright: "庆祝，友谊，团体，欢乐。", reversed: "过度放纵，孤立，流言。" },
    { name: "圣杯四", upright: "沉思，厌倦，漠不关心。", reversed: "新动力，觉醒，接受机会。" },
    { name: "圣杯五", upright: "失落，悲伤，遗憾，关注缺失。", reversed: "接纳，希望，走出阴霾。" },
    { name: "圣杯六", upright: "回忆，怀旧，纯真，给予。", reversed: "沉溺过去，无法成长，束缚。" },
    { name: "圣杯七", upright: "幻想，选择，迷惑，白日梦。", reversed: "清晰，决心，面对现实。" },
    { name: "圣杯八", upright: "离开，寻求更高意义，放弃。", reversed: "恐惧改变，徘徊，勉强维持。" },
    { name: "圣杯九", upright: "愿望成真，满足，舒适，享受。", reversed: "贪婪，不满，物质主义。" },
    { name: "圣杯十", upright: "家庭幸福，情感圆满，和谐。", reversed: "家庭不和，破碎，理想破灭。" },
    { name: "圣杯侍从", upright: "直觉，创意，新情感，信使。", reversed: "情感不成熟，坏消息，欺骗。" },
    { name: "圣杯骑士", upright: "浪漫，魅力，追求理想。", reversed: "情绪化，虚幻，欺骗。" },
    { name: "圣杯王后", upright: "同理心，温柔，直觉关怀。", reversed: "依赖，情绪勒索，不切实际。" },
    { name: "圣杯国王", upright: "情感成熟，宽容，艺术气质。", reversed: "情绪操控，冷漠，成瘾。" },
    { name: "宝剑王牌", upright: "真理，清晰，突破，理智力量。", reversed: "混乱，残忍，滥用智力。" },
    { name: "宝剑二", upright: "僵局，抉择，逃避，平衡。", reversed: "释放真相，打破僵局，信息泄露。" },
    { name: "宝剑三", upright: "心碎，悲伤，释放，接纳痛苦。", reversed: "压抑悲伤，无法释怀，孤独。" },
    { name: "宝剑四", upright: "休息，恢复，沉思，撤退。", reversed: "不安，倦怠，重新投入。" },
    { name: "宝剑五", upright: "冲突，失败，空虚胜利。", reversed: "和解，妥协，悔恨。" },
    { name: "宝剑六", upright: "过渡，疗愈，旅行，前行。", reversed: "无法离开，情感包袱，停滞。" },
    { name: "宝剑七", upright: "策略，伪装，智取。", reversed: "暴露，欺骗失败，羞愧。" },
    { name: "宝剑八", upright: "束缚，限制，无力感。", reversed: "解放，突破，新的视角。" },
    { name: "宝剑九", upright: "焦虑，噩梦，恐惧，内疚。", reversed: "释放恐惧，希望，寻求帮助。" },
    { name: "宝剑十", upright: "终结，谷底，背叛，释放。", reversed: "复苏，抗拒结束，吸取教训。" },
    { name: "宝剑侍从", upright: "警觉，新思想，沟通，探求。", reversed: "鲁莽言论，欺骗，心不在焉。" },
    { name: "宝剑骑士", upright: "迅速行动，决心，才智。", reversed: "鲁莽，冲突，无序。" },
    { name: "宝剑王后", upright: "独立，敏锐，清晰判断。", reversed: "冷漠，刻薄，孤立。" },
    { name: "宝剑国王", upright: "权威，理智，公正，纪律。", reversed: "暴虐，操纵，不公。" },
    { name: "星币王牌", upright: "稳固，物质新机，繁荣，扎根。", reversed: "错失机会，财务损失，不稳定。" },
    { name: "星币二", upright: "平衡，适应，弹性，多任务。", reversed: "失衡，混乱，财务压力。" },
    { name: "星币三", upright: "团队合作，技能，规划，建造。", reversed: "缺乏合作，低质量，懒散。" },
    { name: "星币四", upright: "保存，控制，安全，吝啬。", reversed: "贪婪，失去，开放支出。" },
    { name: "星币五", upright: "困苦，失落，孤立，信仰危机。", reversed: "恢复，找到帮助，精神回暖。" },
    { name: "星币六", upright: "给予，接受，慷慨，平衡。", reversed: "吝啬，债务，权力失衡。" },
    { name: "星币七", upright: "耐心，评估，成长，等待收获。", reversed: "焦虑，投资失败，仓促。" },
    { name: "星币八", upright: "勤奋，技艺，专注，细节。", reversed: "粗心，缺乏动力，庸碌。" },
    { name: "星币九", upright: "独立，富足，优雅，自律。", reversed: "财务问题，依赖，不稳固。" },
    { name: "星币十", upright: "传承，家族，富足，长久安定。", reversed: "家族纷争，损失，遗产问题。" },
    { name: "星币侍从", upright: "学习，务实，新机会。", reversed: "缺乏进展，不切实际，懒惰。" },
    { name: "星币骑士", upright: "效率，责任，坚韧，勤奋。", reversed: "停滞，倦怠，无趣。" },
    { name: "星币王后", upright: "滋养，务实，慷慨，舒适。", reversed: "忽视，混乱，依赖。" },
    { name: "星币国王", upright: "财富，稳定，成功，经营。", reversed: "贪婪，物质主义，破产。" }
];

var fullDeck = majorArcana.concat(minorArcana);

function getRandomCards(count) {
    if (count > fullDeck.length) count = fullDeck.length;
    var shuffled = fullDeck.slice().sort(function() { return Math.random() - 0.5; });
    return shuffled.slice(0, count).map(function(card) {
        var isUpright = Math.random() < 0.5;
        return {
            name: card.name,
            isUpright: isUpright,
            meaning: isUpright ? card.upright : card.reversed,
            orientation: isUpright ? '正位' : '逆位'
        };
    });
}

function openTarotModal() {
    var html = '<h4>塔罗占卜</h4>';
    html += '<div class="subtitle">过去 · 现在 · 未来</div>';
    html += '<div class="form-row">';
    html += '<input type="text" id="tarotQuestion" placeholder="默念你的问题，然后点击抽牌..." style="text-align:center;">';
    html += '</div>';
    html += '<button class="tarot-draw-btn" onclick="drawTarot()">抽取三张</button>';
    html += '<div class="tarot-cards-row" id="tarotCardsRow">';
    html += '<div class="tarot-placeholder">静心提问，然后抽取三张牌</div>';
    html += '</div>';
    html += '<div class="tarot-question-echo" id="tarotQuestionEcho"></div>';
    html += '<button class="btn-close" onclick="closeModal(\'subOverlay\')" style="margin-top:12px;">关闭</button>';
    openSubModal(html);
}

function drawTarot() {
    var questionInput = document.getElementById('tarotQuestion');
    var questionText = questionInput ? questionInput.value.trim() : '';
    var cards = getRandomCards(3);
    
    var row = document.getElementById('tarotCardsRow');
    if (!row) return;
    row.innerHTML = '';
    
    var positions = ['过去', '现在', '未来'];
    cards.forEach(function(card, index) {
        var div = document.createElement('div');
        div.className = 'tarot-card-mini';
        div.innerHTML = 
            '<div class="card-name">' + escapeHTML(card.name) + '</div>' +
            '<div class="card-orientation">' + card.orientation + '</div>' +
            '<div class="card-meaning">' + escapeHTML(card.meaning) + '</div>' +
            '<div class="position-hint">' + positions[index] + '</div>';
        row.appendChild(div);
    });
    
    var echo = document.getElementById('tarotQuestionEcho');
    if (echo) {
        echo.style.display = 'block';
        echo.textContent = questionText ? '问："' + questionText + '"' : '未言明的问题，牌意自现';
    }
    
    var chatMsg = '-- 塔罗占卜结果 --\n';
    if (questionText) chatMsg += '问："' + questionText + '"\n\n';
    cards.forEach(function(card, index) {
        chatMsg += '[' + positions[index] + '] ' + card.name + ' (' + card.orientation + ')\n' + card.meaning + '\n\n';
    });
    chatMsg += '--';
    
    addMessage(chatMsg, 'me');
    appData.chatHistory.push({ type: 'me', content: chatMsg, time: Date.now() });
    saveData();
    
    setTimeout(function() { triggerAutoReply(); }, 600 + Math.random() * 1200);
}

// ==================== 书籍阅读模块（增强版：目录+划线笔记） ====================

function getBooks() {
    if (!appData.books) appData.books = [];
    return appData.books;
}

function saveBookData() {
    saveData(true);
}

function showAddBookForm() {
    var html = '<h4>添加书籍</h4>';
    html += '<div class="form-row"><label>书名</label><input type="text" id="newBookTitle" placeholder="输入书名"></div>';
    html += '<div class="form-row"><label>内容（粘贴文本或选择文件）</label><textarea id="newBookContent" placeholder="在此粘贴文本内容..." style="min-height:120px;"></textarea></div>';
    html += '<div class="btn-row"><button class="btn-sm outline" onclick="document.getElementById(\'bookFileInput\').click()">上传文件 (txt/epub)</button><input type="file" id="bookFileInput" accept=".txt,.epub" style="display:none" onchange="loadBookFile()"></div>';
    html += '<div class="btn-row"><button class="btn-sm" onclick="saveNewBook()">保存</button><button class="btn-sm outline" onclick="openBookManageModal()">返回</button></div>';
    openSubModal(html);
}

function loadBookFile() {
    var file = document.getElementById('bookFileInput').files[0];
    if (!file) return;
    var fileName = file.name;
    var isEpub = fileName.toLowerCase().endsWith('.epub');
    
    if (isEpub) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var zipData = e.target.result;
            JSZip.loadAsync(zipData).then(function(zip) {
                return zip.file('META-INF/container.xml').async('text').then(function(containerXml) {
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(containerXml, 'text/xml');
                    var rootfile = doc.querySelector('rootfile');
                    var fullPath = rootfile ? rootfile.getAttribute('full-path') : null;
                    if (!fullPath) throw new Error('找不到内容文件');
                    return zip.file(fullPath).async('text').then(function(htmlContent) {
                        var htmlDoc = parser.parseFromString(htmlContent, 'text/html');
                        var text = htmlDoc.body ? htmlDoc.body.textContent : htmlContent.replace(/<[^>]*>/g, '');
                        text = text.replace(/\n{3,}/g, '\n\n').trim();
                        document.getElementById('newBookContent').value = text;
                        if (!document.getElementById('newBookTitle').value) {
                            document.getElementById('newBookTitle').value = fileName.replace(/\.epub$/i, '');
                        }
                    });
                });
            }).catch(function(err) {
                showToast('EPUB 解析失败：' + err.message);
            });
        };
        reader.readAsArrayBuffer(file);
    } else {
        var reader = new FileReader();
        reader.onload = function(e) {
            var content = e.target.result;
            document.getElementById('newBookContent').value = content;
            if (!document.getElementById('newBookTitle').value) {
                document.getElementById('newBookTitle').value = fileName.replace(/\.txt$/i, '');
            }
        };
        var blob = file.slice(0, Math.min(file.size, 2000));
        var testReader = new FileReader();
        testReader.onload = function(e) {
            var sample = e.target.result;
            var weirdCount = (sample.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g) || []).length;
            var fullReader = new FileReader();
            fullReader.onload = function(ev) {
                document.getElementById('newBookContent').value = ev.target.result;
                if (!document.getElementById('newBookTitle').value) {
                    document.getElementById('newBookTitle').value = fileName.replace(/\.txt$/i, '');
                }
            };
            if (weirdCount > sample.length * 0.1) {
                fullReader.readAsText(file, 'GBK');
            } else {
                fullReader.readAsText(file, 'UTF-8');
            }
        };
        testReader.readAsText(blob);
    }
}

function saveNewBook() {
    var title = document.getElementById('newBookTitle').value.trim();
    var content = document.getElementById('newBookContent').value.trim();
    if (!title) { showToast('请输入书名'); return; }
    if (!content) { showToast('请输入或选择文本内容'); return; }
    var books = getBooks();
    books.push({
        id: 'book_' + Date.now(),
        title: title,
        content: content,
        annotations: [],
        addedTime: Date.now()
    });
    saveBookData();
    showToast('书籍已添加');
    openBookManageModal();
}

function deleteBook(index) {
    if (!confirm('删除这本书？')) return;
    var books = getBooks();
    books.splice(index, 1);
    saveBookData();
    openBookManageModal();
}

function openBookManageModal() {
    closeModal('settingsOverlay');
    var books = getBooks();
    var html = '<h4>书籍阅读</h4><div class="subtitle">上传 txt 文件或粘贴内容</div>';
    html += '<div class="btn-row"><button class="btn-sm" onclick="showAddBookForm()">添加书籍</button></div>';
    if (books.length === 0) {
        html += '<div style="text-align:center;color:var(--text-system);padding:20px;">书架上还没有书</div>';
    } else {
        html += '<div style="max-height:300px;overflow-y:auto;">';
        books.forEach(function(book, i) {
            html += '<div class="book-list-item" onclick="openBookReader(' + i + ')" style="display:flex;justify-content:space-between;align-items:center;">';
            html += '<span>' + escapeHTML(book.title) + ' <span style="font-size:10px;color:var(--text-system);">(' + book.content.length + '字)</span></span>';
            html += '<button class="del-sm" onclick="event.stopPropagation();deleteBook(' + i + ')" style="margin-left:10px;">删除</button>';
            html += '</div>';
        });
        html += '</div>';
    }
    html += '<button class="btn-close" onclick="closeModal(\'subOverlay\')" style="margin-top:10px;">关闭</button>';
    openSubModal(html);
}

// 解析内容为章节
function parseChapters(content) {
    var lines = content.split('\n');
    var chapters = [];
    var currentTitle = '开始';
    var currentContent = '';
    var chapterRegex = /^(第[一二三四五六七八九十百千0-9]+章|Chapter\s*\d+|#+\s+)/;
    
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (chapterRegex.test(line)) {
            if (currentContent.trim()) {
                chapters.push({ title: currentTitle, text: currentContent.trim() });
            }
            currentTitle = line;
            currentContent = '';
        } else {
            currentContent += (currentContent ? '\n' : '') + lines[i];
        }
    }
    if (currentContent.trim()) {
        chapters.push({ title: currentTitle, text: currentContent.trim() });
    }
    if (chapters.length === 0 && content.trim()) {
        chapters.push({ title: '正文', text: content.trim() });
    }
    return chapters;
}

// 打开阅读器
function openBookReader(index) {
    var books = getBooks();
    if (index >= books.length) return;
    var book = books[index];
    var chapters = parseChapters(book.content);
    
    var html = '<h4>' + escapeHTML(book.title) + '</h4>';
    html += '<div style="display:flex; gap:10px; max-height:60vh;">';
    // 目录侧栏
    html += '<div style="width:30%; overflow-y:auto; border-right:1px solid var(--border); padding-right:8px;">';
    html += '<div style="font-weight:bold; margin-bottom:8px; font-size:14px;">目录</div>';
    chapters.forEach(function(ch, i) {
        html += '<div style="cursor:pointer; padding:4px 4px; font-size:13px; color:var(--text-secondary);" onclick="jumpToChapter(' + i + ')">' + escapeHTML(ch.title) + '</div>';
    });
    html += '</div>';
    // 阅读内容区域
    html += '<div id="bookContentArea" style="flex:1; overflow-y:auto; max-height:55vh; padding:0 8px; position:relative;">';
    html += '<div id="bookTextInner" style="white-space:pre-wrap; line-height:1.8; font-size:15px;">';
    chapters.forEach(function(ch, i) {
        html += '<div class="chapter-block" id="chapter_' + i + '">';
        html += '<div style="font-weight:bold; font-size:18px; margin:16px 0 8px;">' + escapeHTML(ch.title) + '</div>';
        html += '<div class="chapter-text" id="chapter_text_' + i + '">' + renderAnnotatedText(ch.text, book.annotations, i) + '</div>';
        html += '</div>';
    });
    html += '</div></div></div>';
    
    // 底部工具条
    html += '<div style="margin-top:10px; display:flex; gap:8px; align-items:center;">';
    html += '<button class="btn-sm outline" id="toggleHighlightBtn" onclick="toggleHighlightMode()">划线模式</button>';
    html += '<button class="btn-sm outline" onclick="clearAllAnnotations(' + index + ')">清除所有划线</button>';
    html += '<span id="highlightStatus" style="font-size:12px; color:var(--text-system);">点击按钮开启划线模式</span>';
    html += '</div>';
    
    html += '<button class="btn-close" onclick="exitBookReader()" style="margin-top:10px;">关闭</button>';
    openSubModal(html);
    
    window._currentBookIndex = index;
    window._highlightMode = false;
}

// 退出阅读器时清理事件
function exitBookReader() {
    var contentArea = document.getElementById('bookTextInner');
    if (contentArea) {
        contentArea.removeEventListener('touchend', handleTextSelection);
        contentArea.removeEventListener('mouseup', handleTextSelection);
    }
    closeModal('subOverlay');
}

// 渲染带划线的文本
function renderAnnotatedText(text, annotations, chapterIndex) {
    if (!annotations || annotations.length === 0) return escapeHTML(text);
    var lines = text.split('\n');
    var result = '';
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var lineAnnotations = annotations.filter(function(a) { return a.chapterIndex === chapterIndex && a.lineIndex === i; });
        if (lineAnnotations.length === 0) {
            result += escapeHTML(line) + '\n';
        } else {
            lineAnnotations.sort(function(a,b) { return a.startOffset - b.startOffset; });
            var htmlLine = '';
            var lastIdx = 0;
            lineAnnotations.forEach(function(ann) {
                htmlLine += escapeHTML(line.substring(lastIdx, ann.startOffset));
                var hasNote = ann.note && ann.note.trim().length > 0;
                var escapedText = escapeHTML(ann.text).replace(/'/g, "&#39;");
                var escapedNote = escapeHTML(ann.note || '').replace(/'/g, "&#39;");
                var titleAttr = hasNote ? escapedNote : escapedText;
                var supIcon = hasNote ? ' <sup style="font-size:10px;color:var(--accent-dark);">[笔记]</sup>' : '';
                htmlLine += '<mark style="background-color: #ffeaa7; cursor:pointer; position:relative;" title="' + titleAttr + '" onclick="showAnnotationDetail(\'' + escapedText + '\', \'' + escapedNote + '\')">' + escapeHTML(line.substring(ann.startOffset, ann.endOffset)) + supIcon + '</mark>';
                lastIdx = ann.endOffset;
            });
            htmlLine += escapeHTML(line.substring(lastIdx));
            result += htmlLine + '\n';
        }
    }
    return result;
}

// 目录跳转
function jumpToChapter(chapterIndex) {
    var target = document.getElementById('chapter_' + chapterIndex);
    if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
    }
}

// 划线模式切换
function toggleHighlightMode() {
    window._highlightMode = !window._highlightMode;
    var status = document.getElementById('highlightStatus');
    var btn = document.getElementById('toggleHighlightBtn');
    if (status) {
        status.textContent = window._highlightMode ? '划线模式已开启，选中文字后添加笔记' : '点击按钮开启划线模式';
    }
    if (btn) {
        btn.textContent = window._highlightMode ? '退出划线' : '划线模式';
        if (window._highlightMode) {
            btn.style.background = 'var(--accent)';
            btn.style.borderColor = 'var(--accent)';
            btn.style.color = 'var(--text)';
        } else {
            btn.style.background = 'transparent';
            btn.style.borderColor = 'var(--border)';
            btn.style.color = 'var(--text-secondary)';
        }
    }
    var contentArea = document.getElementById('bookTextInner');
    if (contentArea) {
        if (window._highlightMode) {
            contentArea.style.cursor = 'text';
            contentArea.addEventListener('touchend', handleTextSelection);
            contentArea.addEventListener('mouseup', handleTextSelection);
        } else {
            contentArea.removeEventListener('touchend', handleTextSelection);
            contentArea.removeEventListener('mouseup', handleTextSelection);
            contentArea.style.cursor = 'default';
        }
    }
}

// 处理文本选择
function handleTextSelection(e) {
    if (!window._highlightMode) return;
    
    setTimeout(function() {
        var sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.toString().trim()) return;
        
        var selectedText = sel.toString().trim();
        if (!selectedText || selectedText.length < 2) return;
        
        var range = sel.getRangeAt(0);
        var container = range.commonAncestorContainer;
        var chapterDiv = container.parentNode;
        while (chapterDiv && !chapterDiv.classList.contains('chapter-text')) {
            chapterDiv = chapterDiv.parentNode;
        }
        if (!chapterDiv) return;
        
        var chapterId = chapterDiv.id;
        var chapterIndex = parseInt(chapterId.split('_')[2]);
        
        var offsetStart = getTextOffset(chapterDiv, range.startContainer, range.startOffset);
        var offsetEnd = getTextOffset(chapterDiv, range.endContainer, range.endOffset);
        
        // 弹出笔记输入框
        showAnnotationInput(selectedText, chapterIndex, offsetStart, offsetEnd);
        
        // 清除选区
        sel.removeAllRanges();
    }, 100);
}

// 显示笔记输入弹窗
function showAnnotationInput(selectedText, chapterIndex, startOffset, endOffset) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:500;display:flex;align-items:center;justify-content:center;';
    overlay.id = 'annotationInputOverlay';
    
    var box = document.createElement('div');
    box.style.cssText = 'background:var(--panel-bg);border-radius:var(--radius-lg);padding:18px;width:85%;max-width:350px;box-shadow:0 8px 30px rgba(0,0,0,0.2);';
    box.innerHTML = '<h4 style="margin-bottom:8px;color:var(--text);">添加笔记</h4>' +
        '<div style="background:var(--item-bg);padding:8px 12px;border-radius:8px;margin-bottom:10px;font-size:13px;color:var(--text-secondary);max-height:60px;overflow-y:auto;">"' + escapeHTML(selectedText) + '"</div>' +
        '<textarea id="annotationNoteInput" placeholder="写点笔记..." style="width:100%;padding:10px;border:2px solid var(--border);border-radius:var(--radius-sm);font-family:var(--font-main);font-size:14px;color:var(--text);background:var(--input-box);min-height:80px;resize:vertical;outline:none;"></textarea>' +
        '<div class="btn-row" style="margin-top:10px;justify-content:flex-end;">' +
        '<button class="btn-sm outline" id="cancelAnnotationBtn">取消</button>' +
        '<button class="btn-sm" id="saveAnnotationBtn">保存</button>' +
        '</div>';
    
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    
    document.getElementById('saveAnnotationBtn').onclick = function() {
        var note = document.getElementById('annotationNoteInput').value.trim();
        saveAnnotation(selectedText, chapterIndex, startOffset, endOffset, note);
        document.body.removeChild(overlay);
    };
    document.getElementById('cancelAnnotationBtn').onclick = function() {
        document.body.removeChild(overlay);
    };
    overlay.onclick = function(e) {
        if (e.target === overlay) document.body.removeChild(overlay);
    };
    
    // 自动聚焦到输入框
    setTimeout(function() {
        var input = document.getElementById('annotationNoteInput');
        if (input) input.focus();
    }, 200);
}

// 保存标注
function saveAnnotation(text, chapterIndex, startOffset, endOffset, note) {
    var books = getBooks();
    var book = books[window._currentBookIndex];
    if (!book.annotations) book.annotations = [];
    book.annotations.push({
        chapterIndex: chapterIndex,
        startOffset: startOffset,
        endOffset: endOffset,
        text: text,
        note: note || '',
        color: '#ffeaa7',
        lineIndex: 0
    });
    saveBookData();
    showToast(note ? '笔记已保存' : '划线已保存');
    openBookReader(window._currentBookIndex);
}

// 获取文本在父节点中的绝对偏移
function getTextOffset(root, node, offset) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var currentOffset = 0;
    var currentNode;
    while (currentNode = walker.nextNode()) {
        if (currentNode === node) {
            return currentOffset + offset;
        }
        currentOffset += currentNode.textContent.length;
    }
    return 0;
}

// 查看笔记详情
function showAnnotationDetail(text, note) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:500;display:flex;align-items:center;justify-content:center;';
    overlay.onclick = function(e) { if (e.target === overlay) document.body.removeChild(overlay); };
    
    var box = document.createElement('div');
    box.style.cssText = 'background:var(--panel-bg);border-radius:var(--radius-lg);padding:18px;width:85%;max-width:350px;box-shadow:0 8px 30px rgba(0,0,0,0.2);text-align:center;';
    box.innerHTML = '<h4 style="margin-bottom:8px;color:var(--text);">笔记详情</h4>' +
        '<div style="background:var(--item-bg);padding:10px 14px;border-radius:8px;margin-bottom:10px;font-size:14px;color:var(--text);line-height:1.6;">"' + escapeHTML(text) + '"</div>' +
        '<div style="background:var(--item-bg);padding:10px 14px;border-radius:8px;font-size:13px;color:var(--text-secondary);min-height:50px;line-height:1.6;text-align:left;">' + (note ? escapeHTML(note) : '<span style="color:var(--text-system);">没有笔记内容</span>') + '</div>' +
        '<button class="btn-close" onclick="this.parentElement.parentElement.remove()" style="margin-top:12px;">关闭</button>';
    
    overlay.appendChild(box);
    document.body.appendChild(overlay);
}

// 清除所有划线
function clearAllAnnotations(index) {
    if (!confirm('确定要清除本书所有划线和笔记吗？')) return;
    var books = getBooks();
    if (books[index]) {
        books[index].annotations = [];
        saveBookData();
        openBookReader(index);
        showToast('所有划线和笔记已清除');
    }
}

// 在设置中添加"书籍阅读"入口
document.addEventListener('DOMContentLoaded', function() {
    var origOpenSettings = openSettings;
    openSettings = function() {
        openModal('settingsOverlay');
        var grid = document.querySelector('#settingsOverlay .grid-3');
        if (grid && !grid.querySelector('.card-book')) {
            var card = document.createElement('div');
            card.className = 'card card-book';
            card.onclick = function() { openBookFromSettings(); };
            card.textContent = '书籍阅读';
            grid.appendChild(card);
        }
    };
});

function openBookFromSettings() {
    closeModal('settingsOverlay');
    openBookManageModal();
}
// ==================== 论坛模块 ====================

// 默认数据
if (!appData.forumTopics) appData.forumTopics = [];
if (!appData.forumReplyLib) appData.forumReplyLib = [{ name: '默认话题词库', replies: ['有道理', '我也这么想', '没想过这个问题呢', '挺有意思的', '让我想想...'] }];
if (!appData.forumTopicTemplates) appData.forumTopicTemplates = [
    '你觉得{词}怎么样？',
    '聊聊{词}吧',
    '最近{词}有什么新鲜事吗？',
    '你喜欢{词}吗？',
    '{词}这个话题你感兴趣吗？'
];
if (!appData.forumTopicWords) appData.forumTopicWords = [
    '夏天的夜晚', '一个人旅行', '养宠物', '下雨天', '深夜食堂',
    '童年的味道', '最喜欢的电影', '理想的生活', '咖啡还是茶'
];

function getForumReplyLib() {
    if (!appData.forumReplyLib) appData.forumReplyLib = [{ name: '默认话题词库', replies: ['有道理'] }];
    return appData.forumReplyLib;
}

function getForumAllReplies() {
    var all = [];
    (getForumReplyLib() || []).forEach(function(g) { if (Array.isArray(g.replies)) all = all.concat(g.replies); });
    return all;
}

// "+"面板入口
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        var grid = document.querySelector('.more-panel-grid-top');
        if (grid && !grid.querySelector('.item-forum')) {
            var btn = document.createElement('div');
            btn.className = 'more-item-text item-forum';
            btn.textContent = '论坛';
            btn.onclick = function() { toggleMorePanel(); openForum(); };
            grid.appendChild(btn);
        }
    }, 600);
});

// 下拉菜单
function toggleForumMenu() {
    var m = document.getElementById('forumDropdownMenu');
    if (m) m.style.display = m.style.display === 'none' ? 'block' : 'none';
}
function closeForumMenu() {
    var m = document.getElementById('forumDropdownMenu');
    if (m) m.style.display = 'none';
}

// 打开论坛
function openForum() {
    renderForumTopicList();
    openModal('forumOverlay');
}
function closeForum() {
    closeModal('forumOverlay');
}

// 渲染话题卡片列表
function renderForumTopicList() {
    var el = document.getElementById('forumTopicList');
    if (!el) return;
    var topics = appData.forumTopics || [];
    if (topics.length === 0) {
        el.innerHTML = '<div style="text-align:center;color:var(--text-system);padding:20px;">还没有话题</div>';
        return;
    }
    var html = '';
    topics.forEach(function(t, i) {
        var preview = (t.content || '').substring(0, 40);
        var optCount = (t.options || []).length;
        var commentCount = (t.comments || []).length;
        html += '<div class="forum-topic-card">';
        html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;">';
        html += '<div style="flex:1;" onclick="openForumDetail(' + i + ')">';
        html += '<div class="topic-title">' + escapeHTML(t.title) + '</div>';
        html += '<div class="topic-preview">' + escapeHTML(preview) + '</div>';
        html += '<div class="topic-meta">选项:' + optCount + ' | 评论:' + commentCount + '</div>';
        html += '</div>';
        html += '<span onclick="event.stopPropagation();deleteForumTopic(' + i + ')" style="cursor:pointer;color:var(--danger);font-size:16px;padding:4px;" title="删除话题">&times;</span>';
        html += '</div>';
        html += '</div>';
    });
    el.innerHTML = html;
}

// 打开话题详情
function openForumDetail(index) {
    var topics = appData.forumTopics || [];
    if (index >= topics.length) return;
    var t = topics[index];
    var html = '<div class="forum-detail-title">' + escapeHTML(t.title) + '</div>';
    html += '<div class="forum-detail-content">' + escapeHTML(t.content || '') + '</div>';
    
    // 选项
    if (t.options && t.options.length > 0) {
        html += '<div class="forum-options">';
        t.options.forEach(function(opt, oi) {
            var voted = t.votedOption === oi;
            html += '<div class="forum-option-btn' + (voted ? ' voted' : '') + '" onclick="voteForumOption(' + index + ',' + oi + ')">' + escapeHTML(opt) + '</div>';
        });
        html += '</div>';
    }
    
    // 评论区
    html += '<div class="forum-comments">';
    var comments = t.comments || [];
    if (comments.length === 0) {
        html += '<div style="color:var(--text-system);font-size:12px;">暂无评论</div>';
    } else {
        comments.forEach(function(c) {
            html += '<div class="forum-comment"><span class="comment-author">' + escapeHTML(c.author || '对方') + '：</span>' + escapeHTML(c.text) + '</div>';
        });
    }
    html += '</div>';
    
    // 回复输入
    html += '<div style="display:flex;gap:6px;margin-top:8px;">';
    html += '<input type="text" id="forumReplyInput" placeholder="写回复..." style="flex:1;padding:8px;border:2px solid var(--border);border-radius:var(--radius-sm);font-family:var(--font-main);font-size:13px;color:var(--text);background:var(--input-box);">';
    html += '<button class="btn-sm" onclick="submitForumReply(' + index + ')">发送</button>';
    html += '</div>';
    
    html += '<button class="btn-close" onclick="closeForumDetail()" style="margin-top:10px;">返回列表</button>';
    
    document.getElementById('forumDetailContent').innerHTML = html;
    openModal('forumDetailOverlay');
}

function closeForumDetail() {
    closeModal('forumDetailOverlay');
    renderForumTopicList();
}

// 投票
function voteForumOption(topicIndex, optionIndex) {
    var topics = appData.forumTopics || [];
    if (topicIndex >= topics.length) return;
    topics[topicIndex].votedOption = optionIndex;
    // 对方自动回复
    var t = topics[topicIndex];
    var replies = getForumAllReplies();
    var reply = replies.length > 0 ? replies[Math.floor(Math.random() * replies.length)] : '有道理';
    if (!t.comments) t.comments = [];
    t.comments.push({ author: appData.otherName, text: reply });
    saveData(true);
    openForumDetail(topicIndex);
}

// 提交回复
function submitForumReply(index) {
    var input = document.getElementById('forumReplyInput');
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;
    var topics = appData.forumTopics || [];
    if (index >= topics.length) return;
    if (!topics[index].comments) topics[index].comments = [];
    topics[index].comments.push({ author: appData.myName, text: text });
    
    // 对方自动回复
    var replies = getForumAllReplies();
    var reply = replies.length > 0 ? replies[Math.floor(Math.random() * replies.length)] : '有道理';
    topics[index].comments.push({ author: appData.otherName, text: reply });
    
    saveData(true);
    openForumDetail(index);
}

// 新建话题
function newForumTopic() {
    var title = prompt('话题标题：');
    if (!title) return;
    var content = prompt('话题内容：') || '';
    var opts = prompt('选项（用逗号分隔，留空则无选项）：');
    var options = opts ? opts.split(',').map(function(s) { return s.trim(); }) : [];
    appData.forumTopics.push({
        title: title,
        content: content,
        options: options,
        votedOption: -1,
        comments: [],
        createdAt: Date.now()
    });
    saveData(true);
    renderForumTopicList();
    showToast('话题已创建');
}

// 自动生成话题
function autoGenerateTopic() {
    var templates = appData.forumTopicTemplates || ['你觉得{词}怎么样？'];
    var words = appData.forumTopicWords || ['生活', '工作', '旅行'];
    var template = templates[Math.floor(Math.random() * templates.length)];
    var word = words[Math.floor(Math.random() * words.length)];
    var title = template.replace('{词}', word);
    var content = '来聊聊：' + title;
    var options = [];
    appData.forumTopics.push({
        title: title,
        content: content,
        options: options,
        votedOption: -1,
        comments: [{ author: appData.otherName, text: '你怎么看？' }],
        createdAt: Date.now()
    });
    saveData(true);
    renderForumTopicList();
    showToast('已自动生成话题：' + title);
}

// 回复词库管理
function openForumReplyLib() {
    closeModal('forumOverlay');
    var groups = getForumReplyLib();
    var html = '<h4>话题回复词库</h4>';
    groups.forEach(function(g, gi) {
        html += '<div class="group-block"><div class="group-header">' + g.name + ' (' + g.replies.length + '条)</div>';
        html += '<div class="form-row"><textarea id="forumBatch_' + gi + '" placeholder="批量添加（一行一个）"></textarea></div>';
        html += '<div class="btn-row"><button class="btn-sm" onclick="addForumReplies(' + gi + ')">添加</button></div>';
        html += '<div style="max-height:120px;overflow-y:auto;">';
        g.replies.forEach(function(r, ri) {
            html += '<div class="list-item"><span>' + r + '</span><button class="del-sm" onclick="delForumReply(' + gi + ',' + ri + ')">删除</button></div>';
        });
        html += '</div></div>';
    });
    html += '<button class="btn-sm" onclick="addForumReplyGroup()">新建分组</button>';
    html += '<button class="btn-close" onclick="openForum()" style="margin-top:10px;">返回论坛</button>';
    openSubModal(html);
}

function addForumReplyGroup() {
    var n = prompt('分组名称：');
    if (!n) return;
    getForumReplyLib().push({ name: n, replies: [] });
    saveData(true);
    openForumReplyLib();
}

function addForumReplies(gi) {
    var text = document.getElementById('forumBatch_' + gi).value.trim();
    if (!text) return;
    var lines = text.split('\n').filter(function(l) { return l.trim(); });
    getForumReplyLib()[gi].replies = getForumReplyLib()[gi].replies.concat(lines);
    saveData(true);
    openForumReplyLib();
    showToast('已添加 ' + lines.length + ' 条');
}

function delForumReply(gi, ri) {
    getForumReplyLib()[gi].replies.splice(ri, 1);
    saveData(true);
    openForumReplyLib();
}

// 导入导出
function importForumJSON() {
    var input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = function() {
        var file = input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var data = JSON.parse(e.target.result);
                if (!Array.isArray(data)) throw new Error();
                appData.forumTopics = data;
                saveData(true);
                renderForumTopicList();
                showToast('已导入 ' + data.length + ' 个话题');
            } catch(err) {
                showToast('格式错误');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function exportForumJSON() {
    if (!appData.forumTopics || appData.forumTopics.length === 0) {
        showToast('没有话题可导出');
        return;
    }
    copyToClipboard(JSON.stringify(appData.forumTopics, null, 2), '论坛话题');
    showToast('话题已复制到剪贴板');
}

function deleteForumTopic(index) {
    if (!confirm('确定删除这个话题吗？')) return;
    appData.forumTopics.splice(index, 1);
    saveData(true);
    renderForumTopicList();
    showToast('话题已删除');
}
