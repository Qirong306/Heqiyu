// ==================== 音乐模块 ====================
// 网易云外链播放器 + 歌单管理 + 浮动小球（可拖动）
// 支持简单格式 { id, title, artist } 和外部歌单 { title, sub, url, isCustom }

var musicPlaylist = [];
var musicCurrentIndex = -1;
var musicPlayMode = 'order';
var musicFloatingImg = '';
var musicAudio = null;

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
    createFloatingBall();
});

// ========== 辅助函数 ==========
function getSongIdFromUrl(url) {
    if (!url) return '';
    var match = url.match(/[?&]id=(\d+)/);
    return match ? match[1] : '';
}

function formatSeconds(sec) {
    if (isNaN(sec) || sec < 0) return '00:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

// ========== 浮动小球（可拖动） ==========
function createFloatingBall() {
    if (document.getElementById('musicFloatingBall')) return;
    var ball = document.createElement('div');
    ball.id = 'musicFloatingBall';
    ball.style.cssText = 'position:fixed;bottom:100px;right:12px;width:44px;height:44px;border-radius:50%;background:var(--accent);z-index:150;display:none;cursor:grab;box-shadow:0 2px 10px rgba(0,0,0,0.15);animation:musicSpin 4s linear infinite;overflow:hidden;border:2px solid var(--border);-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;';
    ball.setAttribute('draggable', 'false');
    ball.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--text);pointer-events:none;">&#9835;</div>';
    document.body.appendChild(ball);

    if (!document.getElementById('musicSpinStyle')) {
        var styleEl = document.createElement('style');
        styleEl.id = 'musicSpinStyle';
        styleEl.textContent = '@keyframes musicSpin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }';
        document.head.appendChild(styleEl);
    }

    var isDragging = false, startX, startY, startLeft, startTop, hasMoved = false;

    function onStart(e) {
        e.preventDefault();
        if (e.type === 'touchstart') {
            var touch = e.touches[0];
            startX = touch.clientX; startY = touch.clientY;
        } else {
            startX = e.clientX; startY = e.clientY;
        }
        var rect = ball.getBoundingClientRect();
        startLeft = rect.left; startTop = rect.top;
        hasMoved = false; isDragging = true;
        ball.style.animation = 'none';
        ball.style.cursor = 'grabbing';
        ball.style.transition = 'none';
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
    }

    function onMove(e) {
        if (!isDragging) return;
        var clientX, clientY;
        if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; e.preventDefault();
        } else {
            clientX = e.clientX; clientY = e.clientY;
        }
        var dx = clientX - startX, dy = clientY - startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved = true;
        var newLeft = startLeft + dx, newTop = startTop + dy;
        var maxLeft = window.innerWidth - ball.offsetWidth, maxTop = window.innerHeight - ball.offsetHeight;
        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));
        ball.style.left = newLeft + 'px'; ball.style.top = newTop + 'px';
        ball.style.right = 'auto'; ball.style.bottom = 'auto';
    }

    function onEnd() {
        isDragging = false;
        ball.style.animation = 'musicSpin 4s linear infinite';
        ball.style.cursor = 'grab';
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        if (!hasMoved) openMusicPlayer();
    }

    ball.addEventListener('touchstart', onStart, { passive: false });
    ball.addEventListener('mousedown', onStart);
}

function showFloatingBall() {
    var ball = document.getElementById('musicFloatingBall');
    if (!ball) return;
    if (musicFloatingImg) {
        ball.innerHTML = '<img src="' + musicFloatingImg + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;pointer-events:none;" draggable="false">';
    } else {
        ball.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--text);pointer-events:none;">&#9835;</div>';
    }
    ball.style.display = 'block';
}

function hideFloatingBall() {
    var ball = document.getElementById('musicFloatingBall');
    if (ball) ball.style.display = 'none';
}

function changeFloatingBallImage() {
    var input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
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

    if (!document.getElementById('musicOverlay')) {
        var overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'musicOverlay';
        overlay.onclick = function(e) { if (e.target === overlay) closeMusicPlayer(); };

        overlay.innerHTML = '<div class="modal" style="text-align:center;max-width:420px;padding:16px;">' +
            // 标题栏
            '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:4px;">' +
            '<h3 style="margin:0;">音乐小憩</h3>' +
            '<button class="btn-sm outline" onclick="toggleMusicMenu()" style="font-size:18px;padding:2px 10px;" title="歌单管理">&#9776;</button>' +
            '</div>' +
            // 歌曲信息
            '<div id="musicNowPlaying" style="font-size:14px;color:var(--text);margin:6px 0;font-weight:bold;min-height:20px;">未在播放</div>' +
            '<div id="musicPlayerContainer" style="margin:4px 0;min-height:40px;"></div>' +
            // 进度条
            '<div style="display:flex;align-items:center;gap:8px;padding:0 4px;margin:4px 0;">' +
            '<span id="musicCurTime" style="font-size:10px;color:var(--text-system);width:32px;">00:00</span>' +
            '<input type="range" id="musicProgress" min="0" max="100" value="0" oninput="seekMusic(this.value)" style="flex:1;height:4px;accent-color:var(--accent);cursor:pointer;">' +
            '<span id="musicDurTime" style="font-size:10px;color:var(--text-system);width:32px;">00:00</span>' +
            '</div>' +
            // 播放控制按钮（横排三个圆形按钮）
            '<div style="display:flex;align-items:center;justify-content:center;gap:24px;margin:10px 0;">' +
            '<span onclick="prevSong()" style="font-size:24px;cursor:pointer;color:var(--text);padding:4px;" title="上一曲">&#9198;</span>' +
            '<span id="btnPlayPause" onclick="togglePlayPause()" style="display:flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:50%;background:var(--accent);color:var(--text);font-size:22px;cursor:pointer;transition:all 0.2s;" title="播放/暂停">&#9654;</span>' +
            '<span onclick="nextSong()" style="font-size:24px;cursor:pointer;color:var(--text);padding:4px;" title="下一曲">&#9197;</span>' +
            '</div>' +
            // 播放模式（三个图标按钮）
            '<div style="display:flex;align-items:center;justify-content:center;gap:16px;margin:6px 0;">' +
            '<span id="btnModeLoop" onclick="setPlayMode(\'loop\')" style="font-size:18px;cursor:pointer;color:var(--text-system);padding:2px;" title="单曲循环">&#128260;</span>' +
            '<span id="btnModeOrder" onclick="setPlayMode(\'order\')" style="font-size:18px;cursor:pointer;color:var(--accent);padding:2px;" title="顺序播放">&#128259;</span>' +
            '<span id="btnModeRandom" onclick="setPlayMode(\'random\')" style="font-size:18px;cursor:pointer;color:var(--text-system);padding:2px;" title="随机播放">&#128256;</span>' +
            '</div>' +
            // 歌单区域（可折叠）
            '<div id="musicMenuArea" style="display:none;margin-top:8px;">' +
            '<div style="max-height:150px;overflow-y:auto;text-align:left;margin-bottom:6px;" id="musicPlaylistEl"></div>' +
            '<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center;">' +
            '<button class="btn-sm outline" onclick="importMusicJSON()">导入</button>' +
            '<button class="btn-sm outline" onclick="exportMusicJSON()">导出</button>' +
            '<button class="btn-sm outline" onclick="addSongPrompt()">添加</button>' +
            '<button class="btn-sm outline" onclick="changeFloatingBallImage()">换球</button>' +
            '</div>' +
            '</div>' +
            '<button class="btn-close" onclick="closeMusicPlayer()" style="margin-top:10px;">收起</button>' +
            '</div>';

        document.body.appendChild(overlay);
    }

    renderPlaylist();
    updateModeIcons();
    updatePlayPauseButton();
    openModal('musicOverlay');
}

// ========== 菜单折叠 ==========
function toggleMusicMenu() {
    var area = document.getElementById('musicMenuArea');
    if (area) {
        area.style.display = area.style.display === 'none' ? 'block' : 'none';
    }
}

// ========== 关闭 ==========
function closeMusicPlayer() {
    closeModal('musicOverlay');
    showFloatingBall();
}

// ========== 播放/暂停 ==========
function togglePlayPause() {
    if (musicAudio) {
        if (musicAudio.paused) {
            musicAudio.play();
        } else {
            musicAudio.pause();
        }
        updatePlayPauseButton();
    }
}

function updatePlayPauseButton() {
    var btn = document.getElementById('btnPlayPause');
    if (!btn) return;
    if (musicAudio && !musicAudio.paused) {
        btn.innerHTML = '&#10074;&#10074;';
    } else {
        btn.innerHTML = '&#9654;';
    }
}

// ========== 进度条 ==========
function seekMusic(value) {
    if (musicAudio && musicAudio.duration) {
        musicAudio.currentTime = (value / 100) * musicAudio.duration;
    }
}

function updateProgress() {
    if (!musicAudio) return;
    var curEl = document.getElementById('musicCurTime');
    var durEl = document.getElementById('musicDurTime');
    var progEl = document.getElementById('musicProgress');
    if (curEl) curEl.textContent = formatSeconds(musicAudio.currentTime);
    if (durEl) durEl.textContent = formatSeconds(musicAudio.duration || 0);
    if (progEl && musicAudio.duration) {
        progEl.value = (musicAudio.currentTime / musicAudio.duration) * 100;
    }
}

// ========== 歌曲切换 ==========
function playSong(index) {
    if (index < 0 || index >= musicPlaylist.length) return;
    musicCurrentIndex = index;
    var song = musicPlaylist[index];

    var container = document.getElementById('musicPlayerContainer');
    if (container) {
        if (song.url && song.isCustom) {
            if (musicAudio) {
                musicAudio.pause();
                musicAudio.removeEventListener('timeupdate', updateProgress);
                musicAudio.removeEventListener('play', updatePlayPauseButton);
                musicAudio.removeEventListener('pause', updatePlayPauseButton);
                musicAudio.removeEventListener('ended', onSongEnd);
            }
            container.innerHTML = '';
            musicAudio = new Audio(song.url);
            musicAudio.addEventListener('timeupdate', updateProgress);
            musicAudio.addEventListener('play', updatePlayPauseButton);
            musicAudio.addEventListener('pause', updatePlayPauseButton);
            musicAudio.addEventListener('ended', onSongEnd);
            musicAudio.addEventListener('loadedmetadata', updateProgress);
            musicAudio.play().catch(function() {
                showToast('播放失败，请手动点击播放');
            });
            updatePlayPauseButton();
        } else {
            if (musicAudio) { musicAudio.pause(); musicAudio = null; }
            var songId = song.id || getSongIdFromUrl(song.url);
            container.innerHTML = '<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width="100%" height="66" src="https://music.163.com/outchain/player?type=2&id=' + songId + '&auto=1&height=66"></iframe>';
        }
    }

    var nowPlaying = document.getElementById('musicNowPlaying');
    if (nowPlaying) {
        var artist = song.artist || song.sub || '';
        nowPlaying.textContent = song.title + (artist ? ' - ' + artist : '');
    }

    renderPlaylist();
    updatePlayPauseButton();
}

function onSongEnd() {
    if (musicPlayMode === 'loop') {
        playSong(musicCurrentIndex);
    } else {
        nextSong();
    }
}

function nextSong() {
    if (musicPlaylist.length === 0) return;
    var next;
    if (musicPlayMode === 'random') {
        next = Math.floor(Math.random() * musicPlaylist.length);
    } else {
        next = musicCurrentIndex + 1;
        if (next >= musicPlaylist.length) next = 0;
    }
    playSong(next);
}

function prevSong() {
    if (musicPlaylist.length === 0) return;
    if (musicAudio && musicAudio.currentTime > 3) {
        musicAudio.currentTime = 0;
        return;
    }
    var prev = musicCurrentIndex - 1;
    if (prev < 0) prev = musicPlaylist.length - 1;
    playSong(prev);
}

// ========== 播放模式图标 ==========
function setPlayMode(mode) {
    musicPlayMode = mode;
    updateModeIcons();
    var label = mode === 'loop' ? '单曲循环' : (mode === 'random' ? '随机播放' : '顺序播放');
    showToast(label);
}

function updateModeIcons() {
    var loop = document.getElementById('btnModeLoop');
    var order = document.getElementById('btnModeOrder');
    var random = document.getElementById('btnModeRandom');
    var activeColor = 'var(--accent)';
    var inactiveColor = 'var(--text-system)';
    if (loop) loop.style.color = musicPlayMode === 'loop' ? activeColor : inactiveColor;
    if (order) order.style.color = musicPlayMode === 'order' ? activeColor : inactiveColor;
    if (random) random.style.color = musicPlayMode === 'random' ? activeColor : inactiveColor;
}

// ========== 歌单渲染 ==========
function renderPlaylist() {
    var el = document.getElementById('musicPlaylistEl');
    if (!el) return;
    if (musicPlaylist.length === 0) {
        el.innerHTML = '<div style="text-align:center;color:var(--text-system);padding:12px;">歌单空空</div>';
        return;
    }
    var html = '';
    musicPlaylist.forEach(function(song, i) {
        var isPlaying = i === musicCurrentIndex;
        var artist = song.artist || song.sub || '';
        html += '<div class="music-song-item' + (isPlaying ? ' playing' : '') + '" onclick="playSong(' + i + ')">' +
            '<span class="song-index">' + (i + 1) + '</span>' +
            '<span class="song-info"><span class="song-title">' + escapeHTML(song.title) + '</span><br><span class="song-artist">' + escapeHTML(artist) + '</span></span>' +
            '<span class="song-del" onclick="event.stopPropagation();deleteSong(' + i + ')">&times;</span>' +
            '</div>';
    });
    el.innerHTML = html;
}

// ========== 歌单管理 ==========
function addSongPrompt() {
    var id = prompt('输入网易云歌曲 ID：');
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
        if (musicAudio) { musicAudio.pause(); musicAudio = null; }
        var container = document.getElementById('musicPlayerContainer');
        if (container) container.innerHTML = '';
        var nowPlaying = document.getElementById('musicNowPlaying');
        if (nowPlaying) nowPlaying.textContent = '未在播放';
        musicCurrentIndex = -1;
    } else if (musicCurrentIndex > index) {
        musicCurrentIndex--;
    }
    renderPlaylist();
    showToast('已删除：' + song.title);
}

function exportMusicJSON() {
    if (musicPlaylist.length === 0) { showToast('歌单为空'); return; }
    var data = musicPlaylist.map(function(s) {
        return {
            title: s.title,
            sub: s.artist || s.sub || '',
            url: s.url || ('https://music.163.com/song/media/outer/url?id=' + s.id + '.mp3'),
            isCustom: true
        };
    });
    copyToClipboard(JSON.stringify(data, null, 2), '歌单');
    showToast('歌单已复制到剪贴板');
}

function importMusicJSON() {
    var input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = function() {
        var file = input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var raw = JSON.parse(e.target.result);
                var data = Array.isArray(raw) ? raw : (raw.songs || []);
                if (!data.length) throw new Error();
                musicPlaylist = data.map(function(s) {
                    return {
                        title: s.title || '',
                        artist: s.sub || s.artist || '',
                        sub: s.sub || s.artist || '',
                        url: s.url || '',
                        id: s.id || getSongIdFromUrl(s.url || ''),
                        isCustom: s.isCustom !== undefined ? s.isCustom : true
                    };
                });
                musicCurrentIndex = -1;
                if (musicAudio) { musicAudio.pause(); musicAudio = null; }
                var container = document.getElementById('musicPlayerContainer');
                if (container) container.innerHTML = '';
                var nowPlaying = document.getElementById('musicNowPlaying');
                if (nowPlaying) nowPlaying.textContent = '未在播放';
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

// ========== 内联样式 ==========
(function() {
    if (document.getElementById('musicInlineStyles')) return;
    var css = document.createElement('style');
    css.id = 'musicInlineStyles';
    css.textContent =
        '#musicPlayerContainer iframe { width:100%; max-width:330px; height:66px; border:none; margin:0 auto; border-radius:var(--radius-sm); }' +
        '#musicPlayerContainer audio { width:100%; max-width:330px; height:36px; margin:0 auto; outline:none; }' +
        '#btnPlayPause:active { transform:scale(0.9); }' +
        '.music-song-item { display:flex; justify-content:space-between; align-items:center; padding:5px 8px; margin:1px 0; background:var(--item-bg); border-radius:6px; cursor:pointer; font-size:12px; color:var(--text); transition:all 0.2s; }' +
        '.music-song-item.playing { border-left:3px solid var(--accent); font-weight:bold; background:var(--bubble-me); }' +
        '.music-song-item .song-index { width:20px; text-align:center; color:var(--text-system); font-size:10px; }' +
        '.music-song-item .song-info { flex:1; margin:0 6px; }' +
        '.music-song-item .song-title { font-size:12px; }' +
        '.music-song-item .song-artist { font-size:10px; color:var(--text-system); }' +
        '.music-song-item .song-del { color:var(--danger); cursor:pointer; padding:2px 4px; font-size:14px; }' +
        '#musicFloatingBall { transition:transform 0.3s; }' +
        '#musicFloatingBall:active { transform:scale(1.2); }' +
        '#musicProgress { cursor:pointer; }';
    document.head.appendChild(css);
})();
