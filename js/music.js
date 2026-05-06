// ==================== 音乐模块 ====================
// 网易云外链播放器 + 歌单管理 + 浮动小球

var musicPlaylist = [];
var musicCurrentIndex = -1;
var musicPlayMode = 'order'; // 'loop' | 'order' | 'random'
var musicFloatingImg = ''; // 浮动小球自定义图片

// ========== 入口加到"+"面板 ==========
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        var grid = document.querySelector('.more-panel-grid-top');
        if (grid && !grid.querySelector('.item-music')) {
            var btn = document.createElement('div');
            btn.className = 'more-item-text item-music';
            btn.textContent = '音乐';
            btn.onclick = function() { toggleMorePanel(); openMusicPlayer(); };
            grid.appendChild(btn);
        }
    }, 600);
    
    // 创建浮动小球
    createFloatingBall();
});

// ========== 浮动小球（可拖动） ==========
function createFloatingBall() {
    if (document.getElementById('musicFloatingBall')) return;
    var ball = document.createElement('div');
    ball.id = 'musicFloatingBall';
    ball.style.cssText = 'position:fixed;bottom:100px;right:12px;width:44px;height:44px;border-radius:50%;background:var(--accent);z-index:150;display:none;cursor:grab;box-shadow:0 2px 10px rgba(0,0,0,0.15);animation:musicSpin 4s linear infinite;overflow:hidden;border:2px solid var(--border);';
    
    // 默认音符图标
    ball.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--text);">&#9835;</div>';
    
    document.body.appendChild(ball);
    
    // 旋转动画
    if (!document.getElementById('musicSpinStyle')) {
        var style = document.createElement('style');
        style.id = 'musicSpinStyle';
        style.textContent = '@keyframes musicSpin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }';
        document.head.appendChild(style);
    }
    
    // ========== 拖动逻辑 ==========
    var isDragging = false;
    var startX, startY, startLeft, startTop;
    var hasMoved = false;
    
    ball.addEventListener('touchstart', onStart, { passive: false });
    ball.addEventListener('mousedown', onStart);
    
    function onStart(e) {
        if (e.type === 'touchstart') {
            var touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
        } else {
            startX = e.clientX;
            startY = e.clientY;
        }
        var rect = ball.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;
        hasMoved = false;
        isDragging = true;
        
        ball.style.animation = 'none';
        ball.style.cursor = 'grabbing';
        ball.style.transition = 'none';
        
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
        
        e.preventDefault();
    }
    
    function onMove(e) {
        if (!isDragging) return;
        var clientX, clientY;
        if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        var dx = clientX - startX;
        var dy = clientY - startY;
        
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            hasMoved = true;
        }
        
        var newLeft = startLeft + dx;
        var newTop = startTop + dy;
        
        var maxLeft = window.innerWidth - ball.offsetWidth;
        var maxTop = window.innerHeight - ball.offsetHeight;
        
        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));
        
        ball.style.left = newLeft + 'px';
        ball.style.top = newTop + 'px';
        ball.style.right = 'auto';
        ball.style.bottom = 'auto';
        
        e.preventDefault();
    }
    
    function onEnd() {
        isDragging = false;
        ball.style.animation = 'musicSpin 4s linear infinite';
        ball.style.cursor = 'grab';
        
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        
        // 如果没拖动，视为点击
        if (!hasMoved) {
            openMusicPlayer();
        }
    }
}

function showFloatingBall() {
    var ball = document.getElementById('musicFloatingBall');
    if (ball) {
        if (musicFloatingImg) {
            ball.innerHTML = '<img src="' + musicFloatingImg + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
        } else {
            ball.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--text);">&#9835;</div>';
        }
        ball.style.display = 'block';
    }
}

function hideFloatingBall() {
    var ball = document.getElementById('musicFloatingBall');
    if (ball) ball.style.display = 'none';
}

function changeFloatingBallImage() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function() {
        var file = input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            musicFloatingImg = e.target.result;
            showFloatingBall();
            showToast('浮动球图片已更新');
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

// ========== 播放器弹窗 ==========
function openMusicPlayer() {
    hideFloatingBall();
    
    // 动态创建弹窗（如果不存在）
    if (!document.getElementById('musicOverlay')) {
        var overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'musicOverlay';
        overlay.onclick = function(e) { if (e.target === overlay) closeMusicPlayer(); };
        
        overlay.innerHTML = '<div class="modal" style="text-align:center;max-width:420px;">' +
            '<h3>音乐小憩</h3>' +
            '<div id="musicNowPlaying" style="font-size:13px;color:var(--text-secondary);margin:4px 0;">未在播放</div>' +
            '<div id="musicPlayerContainer" style="margin:8px 0;min-height:66px;"></div>' +
            '<div class="btn-row" style="justify-content:center;margin:6px 0;">' +
            '<button class="btn-sm" id="btnModeLoop" onclick="setPlayMode(\'loop\')">单曲循环</button>' +
            '<button class="btn-sm outline" id="btnModeOrder" onclick="setPlayMode(\'order\')">顺序</button>' +
            '<button class="btn-sm outline" id="btnModeRandom" onclick="setPlayMode(\'random\')">随机</button>' +
            '</div>' +
            '<div class="btn-row" style="justify-content:center;margin:4px 0;">' +
            '<button class="btn-sm outline" onclick="prevSong()">上一曲</button>' +
            '<button class="btn-sm outline" onclick="nextSong()">下一曲</button>' +
            '</div>' +
            '<div style="max-height:180px;overflow-y:auto;margin-top:10px;text-align:left;" id="musicPlaylistEl"></div>' +
            '<div class="btn-row" style="justify-content:center;margin-top:8px;">' +
            '<button class="btn-sm outline" onclick="importMusicJSON()">导入歌单</button>' +
            '<button class="btn-sm outline" onclick="exportMusicJSON()">导出歌单</button>' +
            '<button class="btn-sm outline" onclick="addSongPrompt()">添加歌曲</button>' +
            '<button class="btn-sm outline" onclick="changeFloatingBallImage()">换球图片</button>' +
            '</div>' +
            '<button class="btn-close" onclick="closeMusicPlayer()" style="margin-top:10px;">收起</button>' +
            '</div>';
        
        document.body.appendChild(overlay);
    }
    
    renderPlaylist();
    updateModeButtons();
    openModal('musicOverlay');
}

function closeMusicPlayer() {
    closeModal('musicOverlay');
    showFloatingBall();
}

// ========== 播放模式 ==========
function setPlayMode(mode) {
    musicPlayMode = mode;
    updateModeButtons();
    showToast(mode === 'loop' ? '单曲循环' : (mode === 'random' ? '随机播放' : '顺序播放'));
}

function updateModeButtons() {
    var btnLoop = document.getElementById('btnModeLoop');
    var btnOrder = document.getElementById('btnModeOrder');
    var btnRandom = document.getElementById('btnModeRandom');
    if (btnLoop) btnLoop.className = 'btn-sm' + (musicPlayMode === 'loop' ? '' : ' outline');
    if (btnOrder) btnOrder.className = 'btn-sm' + (musicPlayMode === 'order' ? '' : ' outline');
    if (btnRandom) btnRandom.className = 'btn-sm' + (musicPlayMode === 'random' ? '' : ' outline');
}

// ========== 歌曲切换 ==========
function playSong(index) {
    if (index < 0 || index >= musicPlaylist.length) return;
    musicCurrentIndex = index;
    var song = musicPlaylist[index];
    
    var container = document.getElementById('musicPlayerContainer');
    if (container) {
        container.innerHTML = '<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width="100%" height="66" src="https://music.163.com/outchain/player?type=2&id=' + song.id + '&auto=1&height=66"></iframe>';
    }
    
    var nowPlaying = document.getElementById('musicNowPlaying');
    if (nowPlaying) {
        nowPlaying.textContent = song.title + ' - ' + (song.artist || '未知歌手');
    }
    
    renderPlaylist();
}

function nextSong() {
    if (musicPlaylist.length === 0) return;
    var next;
    if (musicPlayMode === 'random') {
        next = Math.floor(Math.random() * musicPlaylist.length);
    } else if (musicPlayMode === 'loop') {
        next = musicCurrentIndex;
    } else {
        next = musicCurrentIndex + 1;
        if (next >= musicPlaylist.length) next = 0;
    }
    playSong(next);
}

function prevSong() {
    if (musicPlaylist.length === 0) return;
    var prev = musicCurrentIndex - 1;
    if (prev < 0) prev = musicPlaylist.length - 1;
    playSong(prev);
}

// ========== 歌单渲染 ==========
function renderPlaylist() {
    var el = document.getElementById('musicPlaylistEl');
    if (!el) return;
    if (musicPlaylist.length === 0) {
        el.innerHTML = '<div style="text-align:center;color:var(--text-system);padding:12px;">歌单空空，点击下方添加歌曲</div>';
        return;
    }
    var html = '';
    musicPlaylist.forEach(function(song, i) {
        var isPlaying = i === musicCurrentIndex;
        html += '<div class="music-song-item' + (isPlaying ? ' playing' : '') + '" onclick="playSong(' + i + ')">' +
            '<span class="song-index">' + (i + 1) + '</span>' +
            '<span class="song-info"><span class="song-title">' + escapeHTML(song.title) + '</span><br><span class="song-artist">' + escapeHTML(song.artist || '') + '</span></span>' +
            '<span class="song-del" onclick="event.stopPropagation();deleteSong(' + i + ')">&times;</span>' +
            '</div>';
    });
    el.innerHTML = html;
}

// ========== 歌单管理 ==========
function addSongPrompt() {
    var id = prompt('输入网易云歌曲 ID（在歌曲页网址中找 id=xxx）：');
    if (!id) return;
    var title = prompt('输入歌曲名：');
    if (!title) return;
    var artist = prompt('输入歌手名（可选）：') || '';
    musicPlaylist.push({ id: id, title: title, artist: artist });
    renderPlaylist();
    if (musicPlaylist.length === 1) playSong(0);
    showToast('已添加：' + title);
}

function deleteSong(index) {
    var song = musicPlaylist[index];
    musicPlaylist.splice(index, 1);
    if (musicCurrentIndex === index) {
        document.getElementById('musicPlayerContainer').innerHTML = '';
        document.getElementById('musicNowPlaying').textContent = '未在播放';
        musicCurrentIndex = -1;
    } else if (musicCurrentIndex > index) {
        musicCurrentIndex--;
    }
    renderPlaylist();
    showToast('已删除：' + song.title);
}

function exportMusicJSON() {
    if (musicPlaylist.length === 0) { showToast('歌单为空'); return; }
    var data = { name: '我的歌单', songs: musicPlaylist };
    copyToClipboard(JSON.stringify(data, null, 2), '歌单');
    showToast('歌单已复制到剪贴板');
}

function importMusicJSON() {
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
                if (!data.songs || !Array.isArray(data.songs)) throw new Error();
                musicPlaylist = data.songs;
                musicCurrentIndex = -1;
                document.getElementById('musicPlayerContainer').innerHTML = '';
                document.getElementById('musicNowPlaying').textContent = '未在播放';
                renderPlaylist();
                showToast('已导入 ' + musicPlaylist.length + ' 首歌');
            } catch(err) {
                showToast('歌单格式错误');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ========== 内联样式（避免改 style.css） ==========
(function injectMusicStyles() {
    if (document.getElementById('musicInlineStyles')) return;
    var css = document.createElement('style');
    css.id = 'musicInlineStyles';
    css.textContent = 
        '#musicPlayerContainer iframe { width:100%; max-width:330px; height:66px; border:none; margin:0 auto; border-radius:var(--radius-sm); }' +
        '.music-song-item { display:flex; justify-content:space-between; align-items:center; padding:6px 10px; margin:2px 0; background:var(--item-bg); border-radius:6px; cursor:pointer; font-size:12px; color:var(--text); transition:all 0.2s; }' +
        '.music-song-item.playing { border-left:3px solid var(--accent); font-weight:bold; }' +
        '.music-song-item .song-index { width:24px; text-align:center; color:var(--text-system); font-size:11px; }' +
        '.music-song-item .song-info { flex:1; margin:0 8px; }' +
        '.music-song-item .song-title { font-size:13px; }' +
        '.music-song-item .song-artist { font-size:10px; color:var(--text-system); }' +
        '.music-song-item .song-del { color:var(--danger); cursor:pointer; padding:2px 6px; font-size:14px; }' +
        '#musicFloatingBall { transition:transform 0.3s; }' +
        '#musicFloatingBall:active { transform:scale(1.2); }';
    document.head.appendChild(css);
})();
