// ==================== 全部应用 ====================

// 所有应用列表
var ALL_APPS = [
    { name: '暖屋', icon: 'icon-cozy', onclick: 'openCozySpace()' },
    { name: '商城', icon: 'icon-shop', onclick: 'openShopModal()' },
    { name: '论坛', icon: 'icon-forum', onclick: 'openForum()' },
    { name: '信件', icon: 'icon-letter', onclick: 'openLetterModal()' },
    { name: '刮刮乐', icon: 'icon-scratch', onclick: 'openScratchCard()' },
    { name: '数独', icon: 'icon-sudoku', onclick: 'openSudoku()' },
    { name: '五子棋', icon: 'icon-gomoku', onclick: 'openGomoku()' },
    { name: '剧本杀', icon: 'icon-murder', onclick: 'openMurderMystery()' },
    { name: '视频弹幕', icon: 'icon-video', onclick: 'VideoDanmaku.open()' },
    { name: '幸福转盘', icon: 'icon-wheel', onclick: 'openWheel()' },
    { name: '书籍阅读', icon: 'icon-book', onclick: 'openBookManageModal()' },
    { name: '情侣记事本', icon: 'icon-notebook', onclick: 'openNotebookModal()' },
    { name: '主题', icon: 'icon-theme', onclick: 'openColorThemeModal()' }
];

function openAllAppsModal() {
    var overlay = document.getElementById('allAppsFullscreen');
    if (!overlay) return;
    
    overlay.style.display = 'flex';
    var body = document.getElementById('allAppsBody');
    if (!body) return;
    
    body.innerHTML = '';
    ALL_APPS.forEach(function(app) {
        var div = document.createElement('div');
        div.className = 'app-item';
        div.innerHTML = '<div class="app-icon ' + app.icon + '"><span class="icon-shape" style="display:flex;align-items:center;justify-content:center;font-size:18px;color:rgba(255,255,255,0.6);">✦</span></div><span class="app-name">' + app.name + '</span>';
        div.onclick = function() {
            closeAllAppsFullscreen();
            setTimeout(function() {
                try { eval(app.onclick); } catch(e) { console.error(e); }
            }, 200);
        };
        body.appendChild(div);
    });
}

function closeAllAppsFullscreen() {
    var overlay = document.getElementById('allAppsFullscreen');
    if (overlay) overlay.style.display = 'none';
}

// 导出到全局
window.openAllAppsModal = openAllAppsModal;
window.closeAllAppsFullscreen = closeAllAppsFullscreen;
