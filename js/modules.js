// ==================== 功能模块 ====================
// 书籍阅读（增强版：目录+划线笔记）


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
    
    var overlay = document.createElement('div');
    overlay.className = 'fullscreen-overlay active';
    overlay.id = 'bookFullscreen';
    
    overlay.innerHTML = `
        <div class="fullscreen-header">
            <button class="fullscreen-back" onclick="closeBookFullscreen()">
                <span class="back-arrow"></span> 返回
            </button>
            <span class="fullscreen-title">书籍阅读</span>
            <span style="width:50px;"></span>
        </div>
        <div class="fullscreen-body" id="bookFullscreenBody" style="padding:16px;">
            <div style="text-align:center;font-size:14px;color:var(--text-secondary);margin-bottom:12px;">上传 txt 文件或粘贴内容</div>
            <div class="btn-row" style="justify-content:center;margin-bottom:12px;">
                <button class="btn-sm" onclick="showAddBookFormFullscreen()">添加书籍</button>
            </div>
            <div id="bookList" style="max-height:60vh;overflow-y:auto;"></div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    renderBookListFullscreen();
}

function closeBookFullscreen() {
    var el = document.getElementById('bookFullscreen');
    if (el) el.remove();
}

function renderBookListFullscreen() {
    var container = document.getElementById('bookList');
    if (!container) return;
    var books = getBooks();
    if (books.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:var(--text-system);padding:20px;">书架上还没有书</div>';
        return;
    }
    var html = '';
    books.forEach(function(book, i) {
        html += '<div class="book-list-item" onclick="openBookReader(' + i + ')" style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:var(--item-bg);border-radius:var(--radius-sm);margin-bottom:6px;cursor:pointer;border:2px solid transparent;">' +
            '<span>' + escapeHTML(book.title) + ' <span style="font-size:10px;color:var(--text-system);">(' + book.content.length + '字)</span></span>' +
            '<button class="del-sm" onclick="event.stopPropagation();deleteBook(' + i + ')" style="margin-left:10px;">删除</button>' +
            '</div>';
    });
    container.innerHTML = html;
}

function showAddBookFormFullscreen() {
    var body = document.getElementById('bookFullscreenBody');
    if (!body) return;
    body.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:12px;">
            <div class="form-row">
                <label>书名</label>
                <input type="text" id="newBookTitle" placeholder="输入书名">
            </div>
            <div class="form-row">
                <label>内容（粘贴文本或选择文件）</label>
                <textarea id="newBookContent" placeholder="在此粘贴文本内容..." style="min-height:120px;"></textarea>
            </div>
            <div class="btn-row">
                <button class="btn-sm outline" onclick="document.getElementById('bookFileInput').click()">上传文件 (txt/epub)</button>
                <input type="file" id="bookFileInput" accept=".txt,.epub" style="display:none" onchange="loadBookFile()">
            </div>
            <div class="btn-row">
                <button class="btn-sm" onclick="saveNewBookFullscreen()">保存</button>
                <button class="btn-sm outline" onclick="renderBookListFullscreen();showAddBookFormFullscreenCancel();">取消</button>
            </div>
            <div id="bookList" style="max-height:40vh;overflow-y:auto;"></div>
        </div>
    `;
    renderBookListFullscreen();
}

function showAddBookFormFullscreenCancel() {
    var body = document.getElementById('bookFullscreenBody');
    if (!body) return;
    body.innerHTML = `
        <div style="text-align:center;font-size:14px;color:var(--text-secondary);margin-bottom:12px;">上传 txt 文件或粘贴内容</div>
        <div class="btn-row" style="justify-content:center;margin-bottom:12px;">
            <button class="btn-sm" onclick="showAddBookFormFullscreen()">添加书籍</button>
        </div>
        <div id="bookList" style="max-height:60vh;overflow-y:auto;"></div>
    `;
    renderBookListFullscreen();
}

function saveNewBookFullscreen() {
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
    showAddBookFormFullscreenCancel();
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
window.openBookManageModal = openBookManageModal;
window.closeBookFullscreen = closeBookFullscreen;
