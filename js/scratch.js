// ==================== 刮刮乐功能模块 ====================

// 刮刮乐数据初始化
if (!appData.scratchPrizes) {
    appData.scratchPrizes = [
        { text: '一个拥抱', weight: 3 },
        { text: '今日幸运星', weight: 2 },
        { text: '好运连连', weight: 2 },
        { text: '小惊喜', weight: 2 },
        { text: '甜心祝福', weight: 2 },
        { text: '超级幸运', weight: 1 },
        { text: '许愿机会一次', weight: 1 },
        { text: '彩虹心情', weight: 1 }
    ];
}

if (typeof appData.scratchCount !== 'number') {
    appData.scratchCount = 0;
}

if (typeof appData.scratchMaxPerDay !== 'number') {
    appData.scratchMaxPerDay = 3;
}

if (typeof appData.scratchLastDate !== 'string') {
    appData.scratchLastDate = '';
}

// 当前刮刮乐状态
var scratchCurrentPrize = null;
var scratchCanvas = null;
var scratchCtx = null;
var scratchIsDrawing = false;
var scratchTimer = null;

// ==================== 打开刮刮乐 ====================
function openScratchCard() {
    closeAllModals();

    // 检查今日次数
    var today = new Date().toDateString();
    if (appData.scratchLastDate !== today) {
        appData.scratchCount = 0;
        appData.scratchLastDate = today;
        saveData();
    }

    if (appData.scratchCount >= appData.scratchMaxPerDay) {
        showToast('今天的刮刮乐次数用完了\n明天再来吧');
        return;
    }

    // 随机抽取本次奖品
    scratchCurrentPrize = getRandomPrize();
    if (!scratchCurrentPrize) {
        scratchCurrentPrize = { text: '神秘礼物', weight: 1 };
    }

    var html = '<div class="scratch-container">';
    html += '<h4>刮刮乐</h4>';
    html += '<div style="font-size:11px;color:var(--text-system);margin-bottom:8px;" id="scratchRemainText">';
    html += '今日剩余次数：' + (appData.scratchMaxPerDay - appData.scratchCount) + '/' + appData.scratchMaxPerDay;
    html += '</div>';

    // 刮刮乐画布区域
    html += '<div class="scratch-canvas-wrap" id="scratchCanvasWrap">';
    html += '<div class="scratch-result" id="scratchResult">' + escapeHTML(scratchCurrentPrize.text) + '</div>';
    html += '<canvas id="scratchCanvas"></canvas>';
    html += '</div>';

    html += '<div class="scratch-hint" id="scratchHint">用手指刮开涂层查看奖品</div>';

    html += '<div class="btn-row" style="justify-content:center;margin-top:8px;">';
    html += '<button class="btn-sm" onclick="resetScratchCard()">再刮一次</button>';
    html += '<button class="btn-sm outline" onclick="closeScratchCard()">关闭</button>';
    html += '</div>';

    // 奖品管理入口
    html += '<div style="text-align:center;margin-top:8px;">';
    html += '<span onclick="closeModal(\'subOverlay\');openScratchManage();" style="font-size:11px;color:var(--text-system);cursor:pointer;text-decoration:underline;">管理奖品</span>';
    html += '</div>';

    html += '</div>';

    openForumSubModal(html);

    // 等弹窗渲染完成后再初始化画布
    clearTimeout(scratchTimer);
    scratchTimer = setTimeout(function() {
        initScratchCanvas();
    }, 400);
}

function closeScratchCard() {
    clearTimeout(scratchTimer);
    scratchCanvas = null;
    scratchCtx = null;
    scratchIsDrawing = false;
    scratchCurrentPrize = null;
    closeModal('subOverlay');
}

// ==================== 根据权重随机选奖品 ====================
function getRandomPrize() {
    var prizes = appData.scratchPrizes || [];
    if (prizes.length === 0) {
        return { text: '神秘礼物', weight: 1 };
    }

    // 计算总权重
    var totalWeight = 0;
    for (var i = 0; i < prizes.length; i++) {
        totalWeight += (prizes[i].weight || 1);
    }

    // 防止总权重为0
    if (totalWeight <= 0) {
        return prizes[0];
    }

    var random = Math.random() * totalWeight;
    var cumulativeWeight = 0;

    for (var j = 0; j < prizes.length; j++) {
        cumulativeWeight += (prizes[j].weight || 1);
        if (random < cumulativeWeight) {
            return prizes[j];
        }
    }

    return prizes[prizes.length - 1];
}

// ==================== 初始化画布 ====================
function initScratchCanvas() {
    var canvas = document.getElementById('scratchCanvas');
    if (!canvas) {
        console.log('刮刮乐画布未找到，重试...');
        scratchTimer = setTimeout(function() {
            initScratchCanvas();
        }, 200);
        return;
    }

    var wrap = document.getElementById('scratchCanvasWrap');
    if (!wrap) return;

    var rect = wrap.getBoundingClientRect();
    var w = rect.width;
    var h = rect.height;

    // 如果尺寸为0，使用固定尺寸并再次重试
    if (w <= 0 || h <= 0) {
        w = 280;
        h = 180;
        console.log('刮刮乐画布尺寸为0，使用默认尺寸，重试...');
        scratchTimer = setTimeout(function() {
            initScratchCanvas();
        }, 200);
        return;
    }

    canvas.width = w;
    canvas.height = h;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    scratchCanvas = canvas;
    scratchCtx = canvas.getContext('2d');

    // 绘制银灰色涂层
    scratchCtx.globalCompositeOperation = 'source-over';
    scratchCtx.fillStyle = '#C0C0C0';
    scratchCtx.fillRect(0, 0, w, h);

    // 添加随机纹理
    for (var i = 0; i < 50; i++) {
        var x = Math.random() * w;
        var y = Math.random() * h;
        var r = Math.random() * 3 + 1;
        scratchCtx.fillStyle = 'rgba(180, 180, 180, 0.5)';
        scratchCtx.beginPath();
        scratchCtx.arc(x, y, r, 0, Math.PI * 2);
        scratchCtx.fill();
    }

    // 提示文字
    scratchCtx.fillStyle = '#999';
    scratchCtx.font = '18px "Ma Shan Zheng", "STKaiti", "KaiTi", "楷体", sans-serif';
    scratchCtx.textAlign = 'center';
    scratchCtx.textBaseline = 'middle';
    scratchCtx.fillText('刮开这里', w / 2, h / 2);

    // 绑定事件
    bindScratchEvents(canvas);
}

// ==================== 刮开事件 ====================
function bindScratchEvents(canvas) {
    scratchIsDrawing = false;

    function getPos(e) {
        var rect = canvas.getBoundingClientRect();
        var clientX, clientY;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function scratch(e) {
        if (!scratchIsDrawing) return;
        e.preventDefault();

        var pos = getPos(e);
        var ctx = scratchCtx;
        if (!ctx) return;

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 28, 0, Math.PI * 2);
        ctx.fill();

        // 检查刮开比例（防抖）
        clearTimeout(scratchTimer);
        scratchTimer = setTimeout(function() {
            checkScratchProgress(canvas);
        }, 300);
    }

    function startDraw(e) {
        scratchIsDrawing = true;
        scratch(e);
    }

    function stopDraw() {
        scratchIsDrawing = false;
        // 停止时立即检查一次
        if (scratchCanvas) {
            checkScratchProgress(scratchCanvas);
        }
    }

    // 移除旧事件
    canvas.onmousedown = null;
    canvas.onmousemove = null;
    canvas.onmouseup = null;
    canvas.onmouseleave = null;
    canvas.ontouchstart = null;
    canvas.ontouchmove = null;
    canvas.ontouchend = null;

    // 绑定新事件
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', scratch);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', scratch, { passive: false });
    canvas.addEventListener('touchend', stopDraw);
}

// ==================== 检查刮开进度 ====================
function checkScratchProgress(canvas) {
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    try {
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var pixels = imageData.data;
        var transparentCount = 0;
        var totalPixels = pixels.length / 4;

        if (totalPixels <= 0) return;

        for (var i = 3; i < pixels.length; i += 4) {
            if (pixels[i] < 128) {
                transparentCount++;
            }
        }

        var progress = transparentCount / totalPixels;

        // 刮开超过35%自动清除
        if (progress > 0.35) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            var hint = document.getElementById('scratchHint');
            if (hint) hint.textContent = '恭喜获得奖品！';

            // 记录刮奖次数（只记录一次）
            if (!canvas._scratchRecorded) {
                canvas._scratchRecorded = true;
                appData.scratchCount++;
                saveData();
                updateScratchRemainCount();
            }
        }
    } catch (e) {
        // 跨域或其他错误，忽略
    }
}

function updateScratchRemainCount() {
    var remainEl = document.getElementById('scratchRemainText');
    if (remainEl) {
        remainEl.textContent = '今日剩余次数：' + (appData.scratchMaxPerDay - appData.scratchCount) + '/' + appData.scratchMaxPerDay;
    }
}

// ==================== 再刮一次 ====================
function resetScratchCard() {
    // 检查今日次数
    var today = new Date().toDateString();
    if (appData.scratchLastDate !== today) {
        appData.scratchCount = 0;
        appData.scratchLastDate = today;
    }

    if (appData.scratchCount >= appData.scratchMaxPerDay) {
        showToast('今天的刮刮乐次数用完了\n明天再来吧');
        return;
    }

    // 重新随机奖品
    scratchCurrentPrize = getRandomPrize();
    if (!scratchCurrentPrize) {
        scratchCurrentPrize = { text: '神秘礼物', weight: 1 };
    }

    // 更新奖品显示
    var result = document.getElementById('scratchResult');
    if (result) {
        result.textContent = scratchCurrentPrize.text;
    }

    // 重新绘制涂层
    var canvas = document.getElementById('scratchCanvas');
    if (canvas && canvas.width > 0 && canvas.height > 0) {
        var ctx = canvas.getContext('2d');
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 纹理
        for (var i = 0; i < 50; i++) {
            var x = Math.random() * canvas.width;
            var y = Math.random() * canvas.height;
            var r = Math.random() * 3 + 1;
            ctx.fillStyle = 'rgba(180, 180, 180, 0.5)';
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // 提示文字
        ctx.fillStyle = '#999';
        ctx.font = '18px "Ma Shan Zheng", "STKaiti", "KaiTi", "楷体", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('刮开这里', canvas.width / 2, canvas.height / 2);

        // 重置记录标记
        canvas._scratchRecorded = false;
    }

    var hint = document.getElementById('scratchHint');
    if (hint) hint.textContent = '用手指刮开涂层查看奖品';

    updateScratchRemainCount();
}

// ==================== 奖品管理 ====================
function openScratchManage() {
    closeModal('subOverlay');

    var prizes = appData.scratchPrizes || [];

    var html = '<h4>刮刮乐奖品管理</h4>';
    html += '<div style="font-size:12px;color:var(--text-system);margin-bottom:8px;">设置奖品及权重（权重越高中奖概率越大）</div>';

    // 奖品列表
    html += '<div style="max-height:250px;overflow-y:auto;">';
    if (prizes.length === 0) {
        html += '<div style="text-align:center;color:var(--text-system);padding:20px;">暂无奖品，请添加</div>';
    }
    for (var i = 0; i < prizes.length; i++) {
        html += '<div class="list-item" style="flex-wrap:nowrap;align-items:center;">';
        html += '<span style="flex:2;font-size:13px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHTML(prizes[i].text) + '</span>';
        html += '<span style="flex-shrink:0;font-size:11px;color:var(--text-system);margin:0 6px;">权重</span>';
        html += '<input type="number" id="prizeWeight_' + i + '" value="' + (prizes[i].weight || 1) + '" min="1" max="10" style="width:44px;padding:4px;text-align:center;border:2px solid var(--border);border-radius:8px;font-size:12px;font-family:var(--font-main);background:var(--input-box);color:var(--text);flex-shrink:0;">';
        html += '<button class="del-sm" onclick="deleteScratchPrizeItem(' + i + ')" style="margin-left:6px;flex-shrink:0;">删除</button>';
        html += '</div>';
    }
    html += '</div>';

    // 添加新奖品
    html += '<div style="margin-top:12px;">';
    html += '<div style="font-size:12px;color:var(--text);margin-bottom:4px;">添加新奖品</div>';
    html += '<div style="display:flex;gap:6px;align-items:center;">';
    html += '<input type="text" id="newPrizeText" placeholder="奖品名称" style="flex:2;padding:8px 12px;border:2px solid var(--border);border-radius:var(--radius-sm);font-size:13px;font-family:var(--font-main);background:var(--input-box);color:var(--text);min-width:0;">';
    html += '<input type="number" id="newPrizeWeight" value="1" min="1" max="10" style="width:50px;padding:8px;text-align:center;border:2px solid var(--border);border-radius:var(--radius-sm);font-size:13px;font-family:var(--font-main);background:var(--input-box);color:var(--text);flex-shrink:0;">';
    html += '<button class="btn-sm" onclick="addScratchPrizeItem()" style="flex-shrink:0;">添加</button>';
    html += '</div>';
    html += '<div style="font-size:10px;color:var(--text-system);margin-top:4px;">权重范围1-10，数字越大越容易抽中</div>';
    html += '</div>';

    // 每日次数设置
    html += '<div class="form-row" style="margin-top:12px;">';
    html += '<label>每日刮奖次数上限</label>';
    html += '<div style="display:flex;align-items:center;gap:8px;">';
    html += '<input type="number" id="scratchMaxPerDayInput" value="' + appData.scratchMaxPerDay + '" min="1" max="20" style="width:80px;padding:8px;text-align:center;">';
    html += '<span style="font-size:11px;color:var(--text-system);">次</span>';
    html += '</div>';
    html += '</div>';

    // 按钮
    html += '<div class="btn-row" style="margin-top:12px;justify-content:center;">';
    html += '<button class="btn-sm" onclick="saveScratchSettings()">保存设置</button>';
    html += '<button class="btn-sm outline" onclick="resetScratchPrizes()">恢复默认</button>';
    html += '<button class="btn-sm outline" onclick="closeScratchManage()">关闭</button>';
    html += '</div>';

    openForumSubModal(html);
}

function addScratchPrizeItem() {
    var textEl = document.getElementById('newPrizeText');
    var weightEl = document.getElementById('newPrizeWeight');

    var text = textEl ? textEl.value.trim() : '';
    var weight = weightEl ? parseInt(weightEl.value) || 1 : 1;

    if (!text) {
        showToast('请输入奖品名称');
        return;
    }

    if (weight < 1) weight = 1;
    if (weight > 10) weight = 10;

    appData.scratchPrizes.push({
        text: text,
        weight: weight
    });

    saveData();
    openScratchManage();
    showToast('奖品已添加');
}

function deleteScratchPrizeItem(index) {
    if (appData.scratchPrizes.length <= 1) {
        showToast('至少保留一个奖品');
        return;
    }

    if (confirm('确定删除奖品"' + appData.scratchPrizes[index].text + '"吗？')) {
        appData.scratchPrizes.splice(index, 1);
        saveData();
        openScratchManage();
        showToast('奖品已删除');
    }
}

function saveScratchSettings() {
    // 保存奖品权重
    var prizes = appData.scratchPrizes || [];
    for (var i = 0; i < prizes.length; i++) {
        var weightEl = document.getElementById('prizeWeight_' + i);
        if (weightEl) {
            var w = parseInt(weightEl.value) || 1;
            if (w < 1) w = 1;
            if (w > 10) w = 10;
            prizes[i].weight = w;
        }
    }

    // 保存每日次数
    var maxEl = document.getElementById('scratchMaxPerDayInput');
    if (maxEl) {
        var max = parseInt(maxEl.value) || 3;
        if (max < 1) max = 1;
        if (max > 20) max = 20;
        appData.scratchMaxPerDay = max;
    }

    saveData();
    closeModal('subOverlay');
    showToast('刮刮乐设置已保存');
}

function closeScratchManage() {
    closeModal('subOverlay');
}

function resetScratchPrizes() {
    if (!confirm('确定恢复默认奖品配置吗？当前设置将被覆盖。')) return;

    appData.scratchPrizes = [
        { text: '一个拥抱', weight: 3 },
        { text: '今日幸运星', weight: 2 },
        { text: '好运连连', weight: 2 },
        { text: '小惊喜', weight: 2 },
        { text: '甜心祝福', weight: 2 },
        { text: '超级幸运', weight: 1 },
        { text: '许愿机会一次', weight: 1 },
        { text: '彩虹心情', weight: 1 }
    ];
    appData.scratchMaxPerDay = 3;

    saveData();
    openScratchManage();
    showToast('已恢复默认设置');
}

// ==================== 更多面板入口 ====================
function addScratchToMorePanel() {
    var morePanel = document.querySelector('.more-panel-grid-top');
    if (morePanel && !document.getElementById('scratchMoreBtn')) {
        var btn = document.createElement('div');
        btn.className = 'more-item-text';
        btn.id = 'scratchMoreBtn';
        btn.onclick = function() {
            openScratchCard();
            toggleMorePanel();
        };
        btn.textContent = '刮刮乐';
        morePanel.appendChild(btn);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(addScratchToMorePanel, 300);
    });
} else {
    setTimeout(addScratchToMorePanel, 300);
}

console.log('刮刮乐模块已加载');
