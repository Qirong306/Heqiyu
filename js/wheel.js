// ==================== 幸福转盘模块 ====================

if (!Array.isArray(appData.wheelItems)) {
    appData.wheelItems = [
        '和朋友一起看日落', '收到一封手写信', '下雨天窝在被子里', '吃到想吃的蛋糕',
        '陌生人的微笑', '听到喜欢的歌', '完成一项挑战', '闻到咖啡香',
        '收到惊喜礼物', '和老友通电话', '看一场电影', '学会一道新菜',
        '帮助了别人', '被夸今天好看', '发现一本好书', '躺在草地上看云',
        '泡个热水澡', '收到花', '完成早起计划', '在雨中散步',
        '拍了一张好看的照片', '喝到热乎乎的奶茶', '整理完房间', '看星空',
        '听到鸟叫声', '踩落叶', '吹海风', '和家人一起吃饭',
        '完成一次运动', '写日记', '种的小植物发芽', '收到一句晚安',
        '看日出', '在公园散步', '吃到妈妈做的菜', '和朋友分享秘密',
        '完成一天工作/学习', '听到好消息', '穿新衣服', '收到点赞',
        '看烟花', '和宠物玩耍', '听到笑话大笑', '发现路边小花',
        '做了个好梦', '被记得生日', '吃到季节限定', '闻到雨后空气',
        '找到停车位', '收到退款', '听到喜欢的播客', '完成一次断舍离',
        '和朋友视频聊天', '买到划算的东西', '在书店待一下午', '看到彩虹',
        '乘公交车有座位', '收到一个拥抱', '画出满意的画', '独自旅行',
        '发现童年零食', '摘水果', '做手工', '听到海浪声',
        '看到极光', '过生日', '收到表白', '参加音乐节',
        '在图书馆待一整天', '完成拼图', '和朋友一起做饭', '骑自行车兜风',
        '喝到冰可乐', '看到双彩虹', '收到明信片', '在沙滩上写字',
        '喂流浪猫', '学会一首歌', '找到四叶草', '看到萤火虫',
        '泡温泉', '收到手作礼物', '和朋友一起露营', '在山顶看风景',
        '收到意外惊喜', '度过悠闲周末', '和家人视频', '闻到面包店香味',
        '完成一篇日记', '帮助陌生人', '在雪地里踩脚印', '收到节日祝福'
    ];
}

if (typeof appData.wheelHistory === 'undefined') {
    appData.wheelHistory = [];
}

var wheelCanvas = null;
var wheelCtx = null;
var wheelSpinning = false;
var wheelAngle = 0;
var wheelTimer = null;

function openWheel() {
    if (typeof closeAllModals === 'function') closeAllModals();
    if (typeof toggleMorePanel === 'function') {
        var p = document.getElementById('morePanel');
        if (p && p.style.display === 'block') toggleMorePanel();
    }

    var items = appData.wheelItems || [];
    if (items.length < 2) {
        showToast('至少需要2个词条，请先添加');
        return;
    }

    var overlay = document.createElement('div');
    overlay.className = 'fullscreen-overlay active';
    overlay.id = 'wheelFullscreen';
    
    overlay.innerHTML = `
        <div class="fullscreen-header">
            <button class="fullscreen-back" onclick="closeWheelFullscreen()">
                <span class="back-arrow"></span> 返回
            </button>
            <span class="fullscreen-title">幸福转盘</span>
            <span onclick="toggleWheelMenu()" style="font-size:20px;cursor:pointer;color:var(--text);padding:4px 8px;">☰</span>
        </div>
        <div class="fullscreen-body" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:20px;">
            <div style="font-size:13px;color:var(--text-secondary);">共 ${items.length} 件幸福小事</div>
            <div style="position:relative;width:300px;height:300px;">
                <canvas id="wheelCanvas" width="600" height="600" style="width:300px;height:300px;border-radius:50%;"></canvas>
                <div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:14px solid transparent;border-right:14px solid transparent;border-top:24px solid var(--danger);z-index:2;"></div>
            </div>
            <button class="btn-sm" onclick="spinWheel()" id="wheelSpinBtn">开始转动</button>
            <div id="wheelResult" style="text-align:center;font-size:16px;color:var(--accent);min-height:28px;font-weight:bold;"></div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    var menuDiv = document.createElement('div');
    menuDiv.id = 'wheelMenu';
    menuDiv.style.cssText = 'display:none;position:absolute;top:50px;right:16px;background:var(--panel-bg);border:2px solid var(--border);border-radius:var(--radius-sm);z-index:10;min-width:100px;box-shadow:0 4px 12px rgba(0,0,0,0.1);';
    menuDiv.innerHTML = `
        <div onclick="openWheelManage();closeWheelMenu();" style="padding:10px 16px;cursor:pointer;font-size:14px;color:var(--text);border-bottom:1px solid var(--border);">管理词库</div>
        <div onclick="importWheelJSON();closeWheelMenu();" style="padding:10px 16px;cursor:pointer;font-size:14px;color:var(--text);border-bottom:1px solid var(--border);">导入词库</div>
        <div onclick="exportWheelJSON();closeWheelMenu();" style="padding:10px 16px;cursor:pointer;font-size:14px;color:var(--text);">导出词库</div>
    `;
    var header = overlay.querySelector('.fullscreen-header');
    header.appendChild(menuDiv);
    
    setTimeout(function() { 
        var canvas = document.getElementById('wheelCanvas');
        if (canvas) {
            canvas.width = 600;
            canvas.height = 600;
            canvas.style.width = '300px';
            canvas.style.height = '300px';
            drawWheel();
        }
    }, 300);
}

function closeWheelFullscreen() {
    var el = document.getElementById('wheelFullscreen');
    if (el) el.remove();
    clearTimeout(wheelTimer);
    wheelSpinning = false;
    var menu = document.getElementById('wheelMenu');
    if (menu) menu.remove();
}

function drawWheel() {
    var canvas = document.getElementById('wheelCanvas');
    if (!canvas) return;
    wheelCanvas = canvas;
    wheelCtx = canvas.getContext('2d');

    var items = appData.wheelItems || [];
    var count = items.length;
    var cx = canvas.width / 2;
    var cy = canvas.height / 2;
    var radius = canvas.width / 2 - 10;
    var sliceAngle = (2 * Math.PI) / count;

    var colors = [
        '#FFD6A5', '#FFABAB', '#FFC3A0', '#FFE0B2', '#FFB7B2',
        '#F0C78E', '#E8B87A', '#FFD1DC', '#C9E4DE', '#FCE4EC',
        '#FFE5B4', '#FFCAD4', '#B5EAD7', '#FFDAC1', '#E2F0CB'
    ];

    wheelCtx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < count; i++) {
        var startAngle = wheelAngle + i * sliceAngle;
        var endAngle = startAngle + sliceAngle;

        wheelCtx.beginPath();
        wheelCtx.moveTo(cx, cy);
        wheelCtx.arc(cx, cy, radius, startAngle, endAngle);
        wheelCtx.closePath();
        wheelCtx.fillStyle = colors[i % colors.length];
        wheelCtx.fill();
        wheelCtx.strokeStyle = '#fff';
        wheelCtx.lineWidth = 2;
        wheelCtx.stroke();

        var midAngle = startAngle + sliceAngle / 2;
        var textRadius = radius * 0.65;
        var tx = cx + Math.cos(midAngle) * textRadius;
        var ty = cy + Math.sin(midAngle) * textRadius;

        wheelCtx.save();
        wheelCtx.translate(tx, ty);
        wheelCtx.rotate(midAngle + Math.PI / 2);
        wheelCtx.fillStyle = '#4a3728';
        wheelCtx.font = 'bold 12px "Ma Shan Zheng", "STKaiti", "KaiTi", sans-serif';
        wheelCtx.textAlign = 'center';
        var label = items[i].length > 6 ? items[i].substring(0, 6) + '..' : items[i];
        wheelCtx.fillText(label, 0, 0);
        wheelCtx.restore();
    }

    wheelCtx.beginPath();
    wheelCtx.arc(cx, cy, 30, 0, 2 * Math.PI);
    wheelCtx.fillStyle = '#fff';
    wheelCtx.fill();
    wheelCtx.strokeStyle = 'var(--accent)';
    wheelCtx.lineWidth = 3;
    wheelCtx.stroke();
}

function spinWheel() {
    if (wheelSpinning) return;
    var items = appData.wheelItems || [];
    if (items.length < 2) { showToast('至少需要2个词条'); return; }

    wheelSpinning = true;
    var btn = document.getElementById('wheelSpinBtn');
    if (btn) { btn.disabled = true; btn.textContent = '转动中...'; }
    document.getElementById('wheelResult').textContent = '';

    var totalSpin = Math.random() * 4 + 3;
    var randomAngle = Math.random() * 2 * Math.PI;
    var targetAngle = wheelAngle + totalSpin * 2 * Math.PI + randomAngle;
    var duration = 4000 + Math.random() * 2000;
    var startTime = Date.now();
    var startAngle = wheelAngle;

    clearTimeout(wheelTimer);
    function animate() {
        var elapsed = Date.now() - startTime;
        var progress = Math.min(elapsed / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        wheelAngle = startAngle + (targetAngle - startAngle) * eased;
        drawWheel();

        if (progress < 1) {
            wheelTimer = setTimeout(animate, 16);
        } else {
            wheelSpinning = false;
            if (btn) { btn.disabled = false; btn.textContent = '开始转动'; }

            var sliceAngle = (2 * Math.PI) / items.length;
            var normalized = wheelAngle % (2 * Math.PI);
            if (normalized < 0) normalized += 2 * Math.PI;
            var index = Math.floor(normalized / sliceAngle);
            var result = items[items.length - 1 - index];
            if (!result) result = items[0];

            document.getElementById('wheelResult').textContent = '结果：' + result;
            appData.wheelHistory.push({ item: result, time: Date.now() });
            if (appData.wheelHistory.length > 50) appData.wheelHistory.shift();
            saveData();
        }
    }
    animate();
}

function closeWheel() {
    clearTimeout(wheelTimer);
    wheelSpinning = false;
    closeModal('subOverlay');
}

function openWheelSubModal(html) {
    var subModal = document.getElementById('subModal');
    var subOverlay = document.getElementById('subOverlay');
    if (subModal && subOverlay) {
        subModal.innerHTML = html;
        subOverlay.classList.add('show');
    }
}

function toggleWheelMenu() {
    var m = document.getElementById('wheelMenu');
    if (m) m.style.display = m.style.display === 'block' ? 'none' : 'block';
}

function closeWheelMenu() {
    var m = document.getElementById('wheelMenu');
    if (m) m.style.display = 'none';
}

function openWheelManage() {
    var items = appData.wheelItems || [];
    var html = '<h4>管理幸福词库</h4>';
    html += '<div style="font-size:11px;color:var(--text-system);margin-bottom:8px;">共 ' + items.length + ' 条</div>';
    html += '<div class="form-row">';
    html += '<input type="text" id="newWheelItem" placeholder="输入新词条" style="flex:1;">';
    html += '<button class="btn-sm" onclick="addWheelItem()" style="flex-shrink:0;">添加</button>';
    html += '</div>';
    html += '<div class="form-row">';
    html += '<textarea id="batchAddWheel" placeholder="批量添加（一行一个）"></textarea>';
    html += '<button class="btn-sm" onclick="batchAddWheelItems()">批量添加</button>';
    html += '</div>';
    html += '<div style="max-height:250px;overflow-y:auto;">';
    for (var i = 0; i < items.length; i++) {
        html += '<div class="list-item">';
        html += '<span style="flex:1;font-size:12px;">' + escapeHTML(items[i]) + '</span>';
        html += '<button class="del-sm" onclick="deleteWheelItem(' + i + ')">删除</button>';
        html += '</div>';
    }
    html += '</div>';
    html += '<div class="btn-row" style="justify-content:center;margin-top:8px;">';
    html += '<button class="btn-sm danger-sm" onclick="resetWheelItems()">恢复默认</button>';
    html += '<button class="btn-sm outline" onclick="openWheel()">返回转盘</button>';
    html += '</div>';
    openWheelSubModal(html);
}

function addWheelItem() {
    var input = document.getElementById('newWheelItem');
    if (!input) return;
    var val = input.value.trim();
    if (!val) { showToast('请输入词条内容'); return; }
    appData.wheelItems.push(val);
    saveData();
    openWheelManage();
    showToast('已添加');
}

function batchAddWheelItems() {
    var textarea = document.getElementById('batchAddWheel');
    if (!textarea) return;
    var text = textarea.value.trim();
    if (!text) { showToast('请输入内容'); return; }
    var lines = text.split('\n').filter(function(l) { return l.trim(); });
    if (lines.length === 0) { showToast('没有有效内容'); return; }
    appData.wheelItems = appData.wheelItems.concat(lines);
    saveData();
    openWheelManage();
    showToast('已添加 ' + lines.length + ' 条');
}

function deleteWheelItem(index) {
    if (confirm('确定删除这条？')) {
        appData.wheelItems.splice(index, 1);
        saveData();
        openWheelManage();
        showToast('已删除');
    }
}

function resetWheelItems() {
    if (!confirm('确定恢复默认词库？当前内容将被覆盖。')) return;
    appData.wheelItems = [
        '和朋友一起看日落', '收到一封手写信', '下雨天窝在被子里', '吃到想吃的蛋糕',
        '陌生人的微笑', '听到喜欢的歌', '完成一项挑战', '闻到咖啡香',
        '收到惊喜礼物', '和老友通电话', '看一场电影', '学会一道新菜'
    ];
    saveData();
    openWheelManage();
    showToast('已恢复默认');
}

function exportWheelJSON() {
    copyToClipboard(JSON.stringify({ wheelItems: appData.wheelItems }, null, 2), '转盘词库');
    showToast('转盘词库已复制到剪贴板');
}

function importWheelJSON() {
    var input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = function() {
        var file = input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var data = JSON.parse(e.target.result);
                var items = data.wheelItems || data;
                if (!Array.isArray(items) || items.length < 2) throw new Error('格式错误');
                appData.wheelItems = items;
                saveData();
                openWheel();
                showToast('已导入 ' + items.length + ' 条');
            } catch(err) { showToast('文件格式错误'); }
        };
        reader.readAsText(file);
    };
    input.click();
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('#wheelMenu') && !e.target.closest('[onclick*="toggleWheelMenu"]')) {
        closeWheelMenu();
    }
});

window.openWheel = openWheel;
window.closeWheelFullscreen = closeWheelFullscreen;penWheel = openWheel;
window.closeWheelFullscreen = closeWheelFullscreen;
