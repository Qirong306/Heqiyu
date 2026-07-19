// ==================== 书籍阅读模块（小说阅读软件风格） ====================

function getBooks() {
    if (!appData.books) appData.books = [];
    return appData.books;
}

function saveBookData() {
    saveData(true);
}

// ==================== 书籍列表界面（书架风格，一行三本） ====================

function openBookManageModal() {
    closeAllFullscreens();
    
    var overlay = document.createElement('div');
    overlay.className = 'fullscreen-overlay active';
    overlay.id = 'bookFullscreen';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:var(--bg);z-index:500;display:flex;flex-direction:column;';
    
    overlay.innerHTML = `
        <div class="fullscreen-header">
            <button class="fullscreen-back" onclick="closeBookFullscreen()">
                <span class="back-arrow"></span> 返回
            </button>
            <span class="fullscreen-title">书籍阅读</span>
            <div style="display:flex;align-items:center;gap:8px;">
                <button onclick="showAddBookFormFullscreen()" style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--text);padding:4px 8px;">☰</button>
                <button onclick="closeBookFullscreen()" style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--text-secondary);padding:4px 8px;">✕</button>
            </div>
        </div>
        <div class="fullscreen-body" id="bookFullscreenBody" style="padding:16px;flex:1;overflow-y:auto;background:var(--bg);">
            <div id="bookGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px 12px;padding:8px 4px;"></div>
        </div>
    `;
    document.body.appendChild(overlay);
    renderBookGrid();
}

function closeBookFullscreen() {
    var el = document.getElementById('bookFullscreen');
    if (el) el.remove();
}

// ==================== 渲染书架（一行三本） ====================

function renderBookGrid() {
    var grid = document.getElementById('bookGrid');
    if (!grid) return;
    var books = getBooks();
    
    if (books.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-system);padding:40px 20px;font-size:14px;">📚 书架上还没有书<br><span style="font-size:12px;color:var(--text-system);">点击右上角 ☰ 添加书籍</span></div>';
        return;
    }
    
    var html = '';
    books.forEach(function(book, index) {
        var coverColor = ['#e8d5c4', '#d4c8b8', '#c5c4e8', '#b8d9c6', '#f0c8c8', '#d4d8c8', '#f0d8c8', '#c8d8e8'][index % 8];
        var titleShort = book.title.length > 6 ? book.title.substring(0, 6) + '..' : book.title;
        var wordCount = book.content ? book.content.length : 0;
        var wordDisplay = wordCount > 10000 ? (wordCount / 10000).toFixed(1) + '万' : wordCount + '字';
        
        html += `
            <div class="book-card" onclick="openBookReader(${index})" style="
                display:flex;
                flex-direction:column;
                align-items:center;
                cursor:pointer;
                transition:transform 0.2s;
                border-radius:8px;
                padding:8px 4px;
            ">
                <div style="
                    width:100%;
                    aspect-ratio:0.7;
                    background:${coverColor};
                    border-radius:8px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-size:22px;
                    font-weight:bold;
                    color:#4a3728;
                    box-shadow:0 2px 8px rgba(0,0,0,0.08);
                    border:1px solid rgba(255,255,255,0.3);
                    text-align:center;
                    padding:8px;
                    word-break:break-all;
                    line-height:1.3;
                ">${escapeHTML(titleShort)}</div>
                <div style="
                    font-size:12px;
                    color:var(--text);
                    margin-top:6px;
                    text-align:center;
                    width:100%;
                    overflow:hidden;
                    text-overflow:ellipsis;
                    white-space:nowrap;
                ">${escapeHTML(book.title)}</div>
                <div style="
                    font-size:10px;
                    color:var(--text-system);
                ">${wordDisplay}</div>
            </div>
        `;
    });
    grid.innerHTML = html;
}

// ==================== 添加书籍界面 ====================

function showAddBookFormFullscreen() {
    var body = document.getElementById('bookFullscreenBody');
    if (!body) return;
    body.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:12px;max-width:400px;margin:0 auto;width:100%;padding:8px 0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <span style="font-size:16px;color:var(--text);font-weight:bold;">添加书籍</span>
                <button onclick="renderBookGrid();showAddBookFormFullscreenCancel();" style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--text-secondary);">✕</button>
            </div>
            <div class="form-row">
                <label>书名</label>
                <input type="text" id="newBookTitle" placeholder="输入书名" style="width:100%;">
            </div>
            <div class="form-row">
                <label>内容（粘贴文本或选择文件）</label>
                <textarea id="newBookContent" placeholder="在此粘贴文本内容..." style="min-height:150px;width:100%;"></textarea>
            </div>
            <div class="btn-row" style="gap:8px;flex-wrap:wrap;">
                <button class="btn-sm outline" onclick="document.getElementById('bookFileInput').click()">📄 上传文件 (txt/epub)</button>
                <input type="file" id="bookFileInput" accept=".txt,.epub" style="display:none" onchange="loadBookFile()">
            </div>
            <div class="btn-row" style="gap:8px;margin-top:4px;">
                <button class="btn-sm" onclick="saveNewBookFullscreen()">保存</button>
                <button class="btn-sm outline" onclick="renderBookGrid();showAddBookFormFullscreenCancel();">取消</button>
            </div>
        </div>
    `;
}

function showAddBookFormFullscreenCancel() {
    var body = document.getElementById('bookFullscreenBody');
    if (!body) return;
    body.innerHTML = `<div id="bookGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px 12px;padding:8px 4px;"></div>`;
    renderBookGrid();
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
                        showToast('文件加载成功');
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
            showToast('文件加载成功');
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
                showToast('文件加载成功');
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

function deleteBook(index) {
    if (!confirm('确定删除这本书吗？')) return;
    var books = getBooks();
    books.splice(index, 1);
    saveBookData();
    renderBookGrid();
    showToast('已删除');
}

// ==================== 小说阅读器（全屏阅读模式） ====================

var readerState = {
    currentBookIndex: -1,
    currentChapterIndex: 0,
    fontSize: 18,
    theme: 'default',
    showSettings: false
};

function openBookReader(index) {
    var books = getBooks();
    if (index >= books.length) return;
    
    readerState.currentBookIndex = index;
    readerState.currentChapterIndex = 0;
    readerState.showSettings = false;
    
    var book = books[index];
    var chapters = parseChapters(book.content);
    
    // 关闭书架
    var bookshelf = document.getElementById('bookFullscreen');
    if (bookshelf) bookshelf.style.display = 'none';
    
    // 创建阅读器全屏
    var overlay = document.createElement('div');
    overlay.className = 'fullscreen-overlay active';
    overlay.id = 'bookReaderFullscreen';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:' + getReaderBgColor() + ';z-index:600;display:flex;flex-direction:column;';
    
    overlay.innerHTML = `
        <div class="fullscreen-header" style="background:${getReaderHeaderColor()};border-bottom:1px solid ${getReaderBorderColor()};">
            <button class="fullscreen-back" onclick="closeBookReader()" style="color:${getReaderTextColor()};">
                <span class="back-arrow"></span> 返回
            </button>
            <span class="fullscreen-title" style="color:${getReaderTextColor()};font-size:15px;">${escapeHTML(book.title)}</span>
            <button onclick="toggleReaderSettings()" style="background:none;border:none;font-size:18px;cursor:pointer;color:${getReaderTextColor()};padding:4px 8px;">⚙</button>
        </div>
        <div class="fullscreen-body" id="bookReaderBody" style="padding:20px 24px;flex:1;overflow-y:auto;background:${getReaderBgColor()};">
            <div id="readerContent" style="font-size:${readerState.fontSize}px;line-height:1.8;color:${getReaderTextColor()};max-width:600px;margin:0 auto;padding:8px 0;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 20px;background:${getReaderHeaderColor()};border-top:1px solid ${getReaderBorderColor()};flex-shrink:0;">
            <button onclick="prevChapter()" style="background:none;border:none;font-size:14px;cursor:pointer;color:${getReaderTextColor()};padding:6px 12px;">上一章</button>
            <span id="chapterIndicator" style="font-size:12px;color:${getReaderTextSecondaryColor()};">第 1/${chapters.length} 章</span>
            <button onclick="nextChapter()" style="background:none;border:none;font-size:14px;cursor:pointer;color:${getReaderTextColor()};padding:6px 12px;">下一章</button>
        </div>
        <!-- 阅读设置面板 -->
        <div id="readerSettingsPanel" style="display:none;position:absolute;bottom:60px;left:0;right:0;background:var(--panel-bg);padding:16px 20px;border-top:1px solid var(--border);z-index:10;">
            <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;justify-content:center;">
                <span style="font-size:12px;color:var(--text-secondary);">字号</span>
                <button onclick="changeReaderFontSize(-2)" style="width:28px;height:28px;border-radius:50%;border:1px solid var(--border);background:var(--item-bg);cursor:pointer;font-size:14px;">A-</button>
                <span id="fontSizeDisplay" style="font-size:13px;color:var(--text);min-width:30px;text-align:center;">${readerState.fontSize}</span>
                <button onclick="changeReaderFontSize(2)" style="width:28px;height:28px;border-radius:50%;border:1px solid var(--border);background:var(--item-bg);cursor:pointer;font-size:14px;">A+</button>
                <span style="font-size:12px;color:var(--text-secondary);margin-left:8px;">主题</span>
                <button onclick="setReaderTheme('default')" style="width:24px;height:24px;border-radius:50%;border:2px solid ${readerState.theme === 'default' ? 'var(--accent)' : 'transparent'};background:#f5f0eb;cursor:pointer;"></button>
                <button onclick="setReaderTheme('dark')" style="width:24px;height:24px;border-radius:50%;border:2px solid ${readerState.theme === 'dark' ? 'var(--accent)' : 'transparent'};background:#2c2420;cursor:pointer;"></button>
                <button onclick="setReaderTheme('sepia')" style="width:24px;height:24px;border-radius:50%;border:2px solid ${readerState.theme === 'sepia' ? 'var(--accent)' : 'transparent'};background:#f4edd5;cursor:pointer;"></button>
                <button onclick="setReaderTheme('green')" style="width:24px;height:24px;border-radius:50%;border:2px solid ${readerState.theme === 'green' ? 'var(--accent)' : 'transparent'};background:#d4e8d4;cursor:pointer;"></button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // 渲染章节内容
    renderChapter(0);
}

// ==================== 阅读器主题配置 ====================

var readerThemes = {
    'default': { bg: '#f5f0eb', text: '#4a3728', header: '#faf7f4', border: '#e8d5c4', textSecondary: '#8b7355' },
    'dark': { bg: '#1a1a1a', text: '#e0e0e0', header: '#2a2a2a', border: '#333333', textSecondary: '#888888' },
    'sepia': { bg: '#f4edd5', text: '#5a4a3a', header: '#e8dfc8', border: '#d4c8b8', textSecondary: '#8a7a6a' },
    'green': { bg: '#d4e8d4', text: '#2a4a2a', header: '#c8dcc8', border: '#b0c8b0', textSecondary: '#5a7a5a' }
};

function getReaderBgColor() {
    return readerThemes[readerState.theme]?.bg || '#f5f0eb';
}

function getReaderTextColor() {
    return readerThemes[readerState.theme]?.text || '#4a3728';
}

function getReaderHeaderColor() {
    return readerThemes[readerState.theme]?.header || '#faf7f4';
}

function getReaderBorderColor() {
    return readerThemes[readerState.theme]?.border || '#e8d5c4';
}

function getReaderTextSecondaryColor() {
    return readerThemes[readerState.theme]?.textSecondary || '#8b7355';
}

function setReaderTheme(theme) {
    if (readerThemes[theme]) {
        readerState.theme = theme;
        // 更新阅读器样式
        var reader = document.getElementById('bookReaderFullscreen');
        if (reader) {
            reader.style.background = getReaderBgColor();
            var header = reader.querySelector('.fullscreen-header');
            if (header) {
                header.style.background = getReaderHeaderColor();
                header.style.borderBottomColor = getReaderBorderColor();
                var title = header.querySelector('.fullscreen-title');
                if (title) title.style.color = getReaderTextColor();
                var backBtn = header.querySelector('.fullscreen-back');
                if (backBtn) backBtn.style.color = getReaderTextColor();
            }
            var body = document.getElementById('bookReaderBody');
            if (body) body.style.background = getReaderBgColor();
            var content = document.getElementById('readerContent');
            if (content) content.style.color = getReaderTextColor();
            var footer = reader.querySelector('div:last-child');
            if (footer) {
                footer.style.background = getReaderHeaderColor();
                footer.style.borderTopColor = getReaderBorderColor();
                var btns = footer.querySelectorAll('button');
                btns.forEach(function(btn) { btn.style.color = getReaderTextColor(); });
                var indicator = document.getElementById('chapterIndicator');
                if (indicator) indicator.style.color = getReaderTextSecondaryColor();
            }
            // 更新设置面板按钮边框
            var themeBtns = document.querySelectorAll('#readerSettingsPanel button');
            themeBtns.forEach(function(btn) {
                if (btn.style.background && btn.style.background.includes('#')) {
                    var color = btn.style.background;
                    if (color === 'rgb(245, 240, 235)' || color === '#f5f0eb') {
                        btn.style.borderColor = readerState.theme === 'default' ? 'var(--accent)' : 'transparent';
                    } else if (color === 'rgb(44, 36, 32)' || color === '#2c2420') {
                        btn.style.borderColor = readerState.theme === 'dark' ? 'var(--accent)' : 'transparent';
                    } else if (color === 'rgb(244, 237, 213)' || color === '#f4edd5') {
                        btn.style.borderColor = readerState.theme === 'sepia' ? 'var(--accent)' : 'transparent';
                    } else if (color === 'rgb(212, 232, 212)' || color === '#d4e8d4') {
                        btn.style.borderColor = readerState.theme === 'green' ? 'var(--accent)' : 'transparent';
                    }
                }
            });
        }
        showToast('已切换主题');
    }
}

function toggleReaderSettings() {
    var panel = document.getElementById('readerSettingsPanel');
    if (panel) {
        readerState.showSettings = !readerState.showSettings;
        panel.style.display = readerState.showSettings ? 'block' : 'none';
    }
}

function changeReaderFontSize(delta) {
    var newSize = readerState.fontSize + delta;
    if (newSize < 12 || newSize > 32) return;
    readerState.fontSize = newSize;
    var content = document.getElementById('readerContent');
    if (content) content.style.fontSize = newSize + 'px';
    var display = document.getElementById('fontSizeDisplay');
    if (display) display.textContent = newSize;
}

// ==================== 章节渲染 ====================

function renderChapter(chapterIndex) {
    var books = getBooks();
    var book = books[readerState.currentBookIndex];
    if (!book) return;
    
    var chapters = parseChapters(book.content);
    if (chapterIndex < 0) chapterIndex = 0;
    if (chapterIndex >= chapters.length) chapterIndex = chapters.length - 1;
    
    readerState.currentChapterIndex = chapterIndex;
    
    var content = document.getElementById('readerContent');
    if (content) {
        var chapter = chapters[chapterIndex];
        var text = chapter.text || '';
        // 段落处理
        var paragraphs = text.split('\n').filter(function(p) { return p.trim(); });
        var html = '<div style="margin-bottom:20px;font-weight:bold;font-size:' + (readerState.fontSize + 4) + 'px;text-align:center;color:' + getReaderTextColor() + ';">' + escapeHTML(chapter.title) + '</div>';
        paragraphs.forEach(function(p) {
            html += '<p style="text-indent:2em;margin-bottom:12px;">' + escapeHTML(p.trim()) + '</p>';
        });
        content.innerHTML = html;
        // 滚动到顶部
        var body = document.getElementById('bookReaderBody');
        if (body) body.scrollTop = 0;
    }
    
    // 更新章节指示器
    var indicator = document.getElementById('chapterIndicator');
    if (indicator) {
        indicator.textContent = '第 ' + (chapterIndex + 1) + '/' + chapters.length + ' 章';
    }
}

function nextChapter() {
    var books = getBooks();
    var book = books[readerState.currentBookIndex];
    if (!book) return;
    var chapters = parseChapters(book.content);
    if (readerState.currentChapterIndex < chapters.length - 1) {
        renderChapter(readerState.currentChapterIndex + 1);
    } else {
        showToast('已到最后一章');
    }
}

function prevChapter() {
    if (readerState.currentChapterIndex > 0) {
        renderChapter(readerState.currentChapterIndex - 1);
    } else {
        showToast('已到第一章');
    }
}

function closeBookReader() {
    var overlay = document.getElementById('bookReaderFullscreen');
    if (overlay) overlay.remove();
    // 恢复书架显示
    var bookshelf = document.getElementById('bookFullscreen');
    if (bookshelf) bookshelf.style.display = 'flex';
}

// ==================== 解析章节 ====================

function parseChapters(content) {
    if (!content) return [{ title: '正文', text: '' }];
    var lines = content.split('\n');
    var chapters = [];
    var currentTitle = '开始';
    var currentContent = '';
    var chapterRegex = /^(第[一二三四五六七八九十百千0-9]+章|Chapter\s*\d+|#+\s+)/i;
    
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

// ==================== 导出到全局 ====================

window.openBookManageModal = openBookManageModal;
window.closeBookFullscreen = closeBookFullscreen;
window.openBookReader = openBookReader;
window.closeBookReader = closeBookReader;
window.renderBookGrid = renderBookGrid;
window.showAddBookFormFullscreen = showAddBookFormFullscreen;
window.showAddBookFormFullscreenCancel = showAddBookFormFullscreenCancel;
window.saveNewBookFullscreen = saveNewBookFullscreen;
window.loadBookFile = loadBookFile;
window.deleteBook = deleteBook;
window.nextChapter = nextChapter;
window.prevChapter = prevChapter;
window.renderChapter = renderChapter;
window.toggleReaderSettings = toggleReaderSettings;
window.changeReaderFontSize = changeReaderFontSize;
window.setReaderTheme = setReaderTheme;

console.log('书籍阅读模块已加载（小说阅读软件风格）');
