// ==================== 购物商城（情侣购买） ====================
var shopItems = [];
var SHOP_STORAGE_KEY = 'shop_items_v1';

function loadShopItems() {
    var saved = localStorage.getItem(SHOP_STORAGE_KEY);
    if (saved) {
        try {
            shopItems = JSON.parse(saved);
        } catch(e) { shopItems = []; }
    }
    if (!shopItems.length) {
        // 内置80个商品
        shopItems = [
            // 日常三餐 (1-30)
            { id: 'meal_001', name: '早餐-豆浆油条套餐', price: 8.50 },
            { id: 'meal_002', name: '早餐-三明治牛奶', price: 12.00 },
            { id: 'meal_003', name: '早餐-小笼包粥', price: 10.00 },
            { id: 'meal_004', name: '早餐-煎饼果子', price: 7.00 },
            { id: 'meal_005', name: '早餐-馄饨面', price: 11.00 },
            { id: 'meal_006', name: '午餐-红烧牛肉面', price: 22.00 },
            { id: 'meal_007', name: '午餐-黄焖鸡米饭', price: 20.00 },
            { id: 'meal_008', name: '午餐-麻辣香锅', price: 35.00 },
            { id: 'meal_009', name: '午餐-酸菜鱼', price: 42.00 },
            { id: 'meal_010', name: '午餐-猪脚饭', price: 25.00 },
            { id: 'meal_011', name: '午餐-煲仔饭', price: 28.00 },
            { id: 'meal_012', name: '午餐-螺蛳粉', price: 18.00 },
            { id: 'meal_013', name: '晚餐-火锅套餐', price: 88.00 },
            { id: 'meal_014', name: '晚餐-烤肉双人餐', price: 98.00 },
            { id: 'meal_015', name: '晚餐-日式料理', price: 68.00 },
            { id: 'meal_016', name: '晚餐-西餐牛排', price: 79.00 },
            { id: 'meal_017', name: '晚餐-自助餐券', price: 128.00 },
            { id: 'meal_018', name: '晚餐-海鲜大餐', price: 158.00 },
            { id: 'meal_019', name: '甜点-提拉米苏', price: 18.00 },
            { id: 'meal_020', name: '甜点-草莓蛋糕', price: 22.00 },
            { id: 'meal_021', name: '甜点-冰淇淋', price: 12.00 },
            { id: 'meal_022', name: '甜点-马卡龙', price: 15.00 },
            { id: 'meal_023', name: '饮品-珍珠奶茶', price: 12.00 },
            { id: 'meal_024', name: '饮品-现磨咖啡', price: 15.00 },
            { id: 'meal_025', name: '饮品-鲜榨果汁', price: 18.00 },
            { id: 'meal_026', name: '饮品-酸奶', price: 8.00 },
            { id: 'meal_027', name: '水果-车厘子礼盒', price: 45.00 },
            { id: 'meal_028', name: '水果-草莓一盒', price: 25.00 },
            { id: 'meal_029', name: '水果-榴莲', price: 68.00 },
            { id: 'meal_030', name: '零食-大礼包', price: 38.00 },
            // 情侣礼物 (31-50)
            { id: 'gift_001', name: '玫瑰花束', price: 52.00 },
            { id: 'gift_002', name: '手工巧克力礼盒', price: 38.00 },
            { id: 'gift_003', name: '情侣手链', price: 45.00 },
            { id: 'gift_004', name: '暖心抱枕', price: 29.90 },
            { id: 'gift_005', name: '定制相册', price: 35.00 },
            { id: 'gift_006', name: '毛绒玩偶', price: 48.00 },
            { id: 'gift_007', name: '香薰蜡烛', price: 25.00 },
            { id: 'gift_008', name: '情侣马克杯一对', price: 32.00 },
            { id: 'gift_009', name: '星空投影灯', price: 55.00 },
            { id: 'gift_010', name: 'DIY手工材料包', price: 28.00 },
            { id: 'gift_011', name: '音乐盒', price: 42.00 },
            { id: 'gift_012', name: '围巾手套套装', price: 58.00 },
            { id: 'gift_013', name: '水晶球摆件', price: 36.00 },
            { id: 'gift_014', name: '情侣T恤', price: 65.00 },
            { id: 'gift_015', name: '刻字项链', price: 49.00 },
            { id: 'gift_016', name: '恋爱日记本', price: 22.00 },
            { id: 'gift_017', name: '情侣手机壳', price: 25.00 },
            { id: 'gift_018', name: '小夜灯', price: 19.90 },
            { id: 'gift_019', name: '情侣雨伞', price: 35.00 },
            { id: 'gift_020', name: '告白气球', price: 15.00 },
            // 健身运动 (51-62)
            { id: 'fit_001', name: '瑜伽垫', price: 39.00 },
            { id: 'fit_002', name: '运动水壶', price: 25.00 },
            { id: 'fit_003', name: '健身手套', price: 32.00 },
            { id: 'fit_004', name: '跳绳', price: 15.00 },
            { id: 'fit_005', name: '弹力带套装', price: 28.00 },
            { id: 'fit_006', name: '运动毛巾', price: 18.00 },
            { id: 'fit_007', name: '蛋白粉试用装', price: 45.00 },
            { id: 'fit_008', name: '智能运动手环', price: 99.00 },
            { id: 'fit_009', name: '运动发带', price: 12.00 },
            { id: 'fit_010', name: '护膝', price: 38.00 },
            { id: 'fit_011', name: '健腹轮', price: 42.00 },
            { id: 'fit_012', name: '哑铃套装', price: 88.00 },
            // 服饰日用品 (63-74)
            { id: 'daily_001', name: '情侣睡衣', price: 79.00 },
            { id: 'daily_002', name: '情侣拖鞋', price: 35.00 },
            { id: 'daily_003', name: '毛巾礼盒', price: 28.00 },
            { id: 'daily_004', name: '香皂花束', price: 22.00 },
            { id: 'daily_005', name: '牙刷套装', price: 18.00 },
            { id: 'daily_006', name: '情侣钥匙扣', price: 12.00 },
            { id: 'daily_007', name: '洗衣凝珠', price: 25.00 },
            { id: 'daily_008', name: '纸巾礼盒', price: 20.00 },
            { id: 'daily_009', name: '衣架套装', price: 15.00 },
            { id: 'daily_010', name: '收纳盒', price: 28.00 },
            { id: 'daily_011', name: '情侣围裙', price: 32.00 },
            { id: 'daily_012', name: '保鲜盒套装', price: 26.00 },
            // 常用药品 (75-80)
            { id: 'med_001', name: '感冒灵颗粒', price: 18.00 },
            { id: 'med_002', name: '维生素C片', price: 25.00 },
            { id: 'med_003', name: '创可贴', price: 5.00 },
            { id: 'med_004', name: '润喉糖', price: 12.00 },
            { id: 'med_005', name: '体温计', price: 15.00 },
            { id: 'med_006', name: '暖宝宝贴', price: 10.00 }
        ];
        saveShopItems();
    }
}

function saveShopItems() {
    localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(shopItems));
}

function openShopModal() {
    loadShopItems();
    
    // 创建全屏容器
    var overlay = document.createElement('div');
    overlay.className = 'fullscreen-overlay active';
    overlay.id = 'shopFullscreen';
    
    overlay.innerHTML = `
        <div class="fullscreen-header">
            <button class="fullscreen-back" onclick="closeShopFullscreen()">
                <span class="back-arrow"></span> 返回
            </button>
            <span class="fullscreen-title">购物商城</span>
            <span style="width:50px;"></span>
        </div>
        <div class="fullscreen-body" id="shopFullscreenBody">
            <div style="text-align:center;padding:20px;color:var(--text-system);">加载中...</div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    renderShopFullscreen();
}

function closeShopFullscreen() {
    var el = document.getElementById('shopFullscreen');
    if (el) el.remove();
}

function renderShopFullscreen() {
    var container = document.getElementById('shopFullscreenBody');
    if (!container) return;
    
    var isEnabled = localStorage.getItem('other_random_buy_enabled') !== 'false';
    
    var html = '';
    html += '<div style="text-align:center;padding:8px 0;margin-bottom:12px;background:var(--item-bg);border-radius:12px;border:2px solid var(--border);font-size:14px;">' +
        '温暖值：<span style="font-weight:bold;color:#e8a87c;">' + (appData.cozyRoom?.warmth || 100) + '</span>' +
        '</div>';
    
    html += '<div style="display:flex;align-items:center;justify-content:space-between;background:var(--item-bg);padding:8px 12px;border-radius:10px;margin-bottom:12px;">' +
        '<span style="font-size:13px;">允许对方随机购买</span>' +
        '<button id="randomBuySwitchBtn" onclick="toggleOtherRandomBuySwitch()" style="width:50px;height:26px;border-radius:26px;border:none;cursor:pointer;background:' + (isEnabled ? 'var(--accent)' : '#ccc') + ';transition:0.2s;position:relative;">' +
        '<span style="position:absolute;top:2px;left:' + (isEnabled ? '26px' : '2px') + ';width:22px;height:22px;border-radius:50%;background:white;transition:0.2s;"></span>' +
        '</button>' +
        '</div>';
    
    html += '<div class="btn-row" style="gap:8px;justify-content:center;margin-bottom:12px;">' +
        '<button class="btn-sm" onclick="showAddItemModal()">添加商品</button>' +
        '<button class="btn-sm outline" onclick="exportShopItems()">导出商品库</button>' +
        '<button class="btn-sm outline" onclick="importShopItems()">导入商品库</button>' +
        '</div>';
    
    html += '<div style="max-height:50vh;overflow-y:auto;" id="shopItemsList">加载中...</div>';
    
    container.innerHTML = html;
    renderShopItemsList();
}

// 修改原有的 renderShopItemsList 函数，查找 #shopItemsList
// 如果找不到，使用 document.getElementById('shopItemsList') 会返回 null
// 在 openShopModal 中我们用了 id="shopItemsList"，所以没问题

function toggleOtherRandomBuySwitch() {
    var isEnabled = localStorage.getItem('other_random_buy_enabled') !== 'false';
    var newState = !isEnabled;
    localStorage.setItem('other_random_buy_enabled', newState ? 'true' : 'false');
    
    var btn = document.getElementById('randomBuySwitchBtn');
    if (btn) {
        btn.style.background = newState ? 'var(--accent)' : '#ccc';
        var span = btn.querySelector('span');
        if (span) span.style.left = newState ? '26px' : '2px';
    }
    showToast(newState ? '已开启对方随机购买' : '已关闭对方随机购买');
}

function renderShopItemsList() {
    var container = document.getElementById('shopItemsList');
    if (!container) return;
    if (!shopItems.length) {
        container.innerHTML = '<div style="text-align:center;color:var(--text-system);padding:20px;">暂无商品，点击上方添加</div>';
        return;
    }
    var html = '<div style="display:flex;flex-direction:column;gap:10px;">';
    for (var i = 0; i < shopItems.length; i++) {
        var item = shopItems[i];
        html += '<div style="background:var(--item-bg);border-radius:12px;padding:10px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;">' +
            '<div style="flex:1;">' +
            '<div style="font-weight:bold;">' + escapeHTML(item.name) + '</div>' +
            '<div style="color:var(--accent);font-size:14px;">¥ ' + item.price.toFixed(2) + '</div>' +
            '</div>' +
            '<div style="display:flex;gap:8px;">' +
            '<button class="btn-sm outline" onclick="buyItem(\'' + item.id + '\')">购买</button>' +
            '<button class="del-sm" onclick="deleteShopItem(\'' + item.id + '\')">删除</button>' +
            '</div>' +
            '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
}

// 修改 showAddItemModal，让它能在全屏内打开
function showAddItemModal() {
    var html = '<div style="text-align:center;">' +
        '<h4>添加商品</h4>' +
        '<div class="form-row">' +
        '<label>商品名称</label>' +
        '<input type="text" id="newItemName" placeholder="例如：玫瑰花">' +
        '</div>' +
        '<div class="form-row">' +
        '<label>价格（元）</label>' +
        '<input type="number" id="newItemPrice" step="0.01" placeholder="例如：5.20">' +
        '</div>' +
        '<div class="btn-row" style="justify-content:center;gap:8px;margin-top:12px;">' +
        '<button class="btn-sm" onclick="addShopItem()">确认添加</button>' +
        '<button class="btn-sm outline" onclick="closeSubModal()">取消</button>' +
        '</div>' +
        '</div>';
    openSubModal(html);
}

function closeSubModal() {
    closeModal('subOverlay');
}

function addShopItem() {
    var name = document.getElementById('newItemName').value.trim();
    var price = parseFloat(document.getElementById('newItemPrice').value);
    if (!name) {
        showToast('请输入商品名称');
        return;
    }
    if (isNaN(price) || price <= 0) {
        showToast('请输入有效价格');
        return;
    }
    var newId = 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    shopItems.push({ id: newId, name: name, price: price });
    saveShopItems();
    closeModal('subOverlay');
    renderShopFullscreen();
    showToast('商品已添加');
}

// 修改 exportShopItems 和 importShopItems 弹窗
function exportShopItems() {
    if (!shopItems.length) {
        showToast('商品库为空，无法导出');
        return;
    }
    var exportData = { type: 'shopItems', version: '1.0', data: shopItems, count: shopItems.length };
    var jsonStr = JSON.stringify(exportData, null, 2);
    var html = '<div style="text-align:center;">' +
        '<h4>导出商品库</h4>' +
        '<div class="subtitle">共 ' + shopItems.length + ' 个商品</div>' +
        '<div class="btn-row" style="gap:8px;margin:12px 0;">' +
        '<button class="btn-sm" onclick="copyShopItemsToClipboard()">复制到剪贴板</button>' +
        '<button class="btn-sm outline" onclick="downloadShopItemsFile()">下载为文件</button>' +
        '</div>' +
        '<textarea readonly style="width:100%;height:120px;font-size:11px;margin:8px 0;padding:8px;border-radius:6px;background:var(--item-bg);border:1px solid var(--border);">' + escapeHTML(jsonStr) + '</textarea>' +
        '<button class="btn-close" onclick="closeModal(\'subOverlay\')">关闭</button>' +
        '</div>';
    openSubModal(html);
}

function showAddItemModal() {
    var html = '<div style="text-align:center;">' +
        '<h4>添加商品</h4>' +
        '<div class="form-row">' +
        '<label>商品名称</label>' +
        '<input type="text" id="newItemName" placeholder="例如：玫瑰花">' +
        '</div>' +
        '<div class="form-row">' +
        '<label>价格（元）</label>' +
        '<input type="number" id="newItemPrice" step="0.01" placeholder="例如：5.20">' +
        '</div>' +
        '<div class="btn-row" style="justify-content:center;gap:8px;margin-top:12px;">' +
        '<button class="btn-sm" onclick="addShopItem()">确认添加</button>' +
        '<button class="btn-sm outline" onclick="closeModal(\'subOverlay\')">取消</button>' +
        '</div>' +
        '</div>';
    openSubModal(html);
}

function addShopItem() {
    var name = document.getElementById('newItemName').value.trim();
    var price = parseFloat(document.getElementById('newItemPrice').value);
    if (!name) {
        showToast('请输入商品名称');
        return;
    }
    if (isNaN(price) || price <= 0) {
        showToast('请输入有效价格');
        return;
    }
    var newId = 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    shopItems.push({ id: newId, name: name, price: price });
    saveShopItems();
    closeModal('subOverlay');
    openShopModal();
    showToast('商品已添加');
}

function deleteShopItem(id) {
    if (!confirm('确定删除该商品吗？')) return;
    shopItems = shopItems.filter(function(item) { return item.id !== id; });
    saveShopItems();
    renderShopItemsList();
    showToast('已删除');
}

function buyItem(itemId, buyer) {
    var item = shopItems.find(function(i) { return i.id === itemId; });
    if (!item) {
        showToast('商品不存在');
        return;
    }
    if (!buyer) {
        showBuyerChoiceModal(item);
        return;
    }
    sendPurchaseMessage(item, buyer);
}

function showBuyerChoiceModal(item) {
    var html = '<div style="text-align:center;">' +
        '<h4>购买商品</h4>' +
        '<div class="subtitle">' + escapeHTML(item.name) + ' - ¥' + item.price.toFixed(2) + '</div>' +
        '<div class="subtitle" style="margin:12px 0;">谁购买？</div>' +
        '<div class="btn-row" style="justify-content:center;gap:16px;">' +
        '<button class="btn-sm" onclick="buyItemWithBuyer(\'' + item.id + '\', \'me\')">我购买</button>' +
        '<button class="btn-sm outline" onclick="buyItemWithBuyer(\'' + item.id + '\', \'other\')">对方购买</button>' +
        '</div>' +
        '<button class="btn-close" onclick="closeModal(\'subOverlay\')" style="margin-top:12px;">取消</button>' +
        '</div>';
    openSubModal(html);
}

function buyItemWithBuyer(itemId, buyer) {
    closeModal('subOverlay');
    var item = shopItems.find(function(i) { return i.id === itemId; });
    if (item) sendPurchaseMessage(item, buyer);
}

function sendPurchaseMessage(item, buyer) {
    var buyerName = (buyer === 'me') ? appData.myName : appData.otherName;
    var receiverName = (buyer === 'me') ? appData.otherName : appData.myName;
    addPurchaseCard(item, buyer);
    
    var systemMsg = buyerName + ' 购买了 ' + item.name + '（¥' + item.price.toFixed(2) + '）送给 ' + receiverName;
    var lastMsg = appData.chatHistory[appData.chatHistory.length - 1];
    if (!lastMsg || lastMsg.content !== systemMsg) {
        appData.chatHistory.push({ type: 'system', content: systemMsg, time: Date.now() });
    }
    showToast(buyerName + ' 购买了 ' + item.name);
    saveData();
    
    // 如果是对方购买且页面不可见，发送通知
    if (buyer === 'other' && document.hidden && typeof sendNotification === 'function') {
        sendNotification('购物通知', buyerName + ' 购买了 ' + item.name, window.location.href);
    }
}

function addPurchaseCard(item, buyer) {
    var chat = document.getElementById('chat');
    var div = document.createElement('div');
    div.className = 'msg ' + (buyer === 'me' ? 'me' : 'other');
    var av = getAvatarHTMLSync(buyer === 'me');
    var handler = buyer === 'other' ? 'onclick="onOtherAvatarClick()"' : 'onclick="onMyAvatarClick()"';
    var isFromOther = (buyer === 'other');
    var cardHTML = '<div class="transfer-card" style="border-left-color:var(--accent);"' + 
        (isFromOther ? ' onclick="confirmReceive(this, \'' + escapeHTML(item.name) + '\', \'' + item.price + '\')" style="cursor:pointer;"' : '') + '>' +
        '<div class="transfer-label">购买商品</div>' +
        '<div style="font-size:16px;font-weight:bold;margin:6px 0;">' + escapeHTML(item.name) + '</div>' +
        '<div class="transfer-amount">¥ ' + item.price.toFixed(2) + '</div>' +
        '<div class="transfer-note">' + (buyer === 'me' ? '你购买了此商品' : (isFromOther ? '点击确认收到' : '对方购买了此商品')) + '</div>' +
        '</div>';
    div.innerHTML = '<div class="avatar-wrap" ' + handler + '>' + av + '</div><div class="bubble">' + cardHTML + '<span class="msg-time">' + formatTimeShort(Date.now()) + '</span></div>';
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function confirmReceive(cardElement, itemName, itemPrice) {
    if (cardElement.querySelector('.transfer-note').textContent !== '点击确认收到') {
        showToast('已经确认过了');
        return;
    }
    cardElement.querySelector('.transfer-note').textContent = '已收到';
    cardElement.querySelector('.transfer-note').style.color = 'var(--success)';
    cardElement.style.cursor = 'default';
    cardElement.onclick = null;
    addSystemMsg('你收到了 ' + appData.otherName + ' 送的 ' + itemName);
    showToast('已收到 ' + itemName);
    saveData();
}

function exportShopItems() {
    if (!shopItems.length) {
        showToast('商品库为空，无法导出');
        return;
    }
    var exportData = { type: 'shopItems', version: '1.0', data: shopItems, count: shopItems.length };
    var jsonStr = JSON.stringify(exportData, null, 2);
    var html = '<div style="text-align:center;">' +
        '<h4>导出商品库</h4>' +
        '<div class="subtitle">共 ' + shopItems.length + ' 个商品</div>' +
        '<div class="btn-row" style="gap:8px;margin:12px 0;">' +
        '<button class="btn-sm" onclick="copyShopItemsToClipboard()">复制到剪贴板</button>' +
        '<button class="btn-sm outline" onclick="downloadShopItemsFile()">下载为文件</button>' +
        '</div>' +
        '<textarea readonly style="width:100%;height:120px;font-size:11px;margin:8px 0;padding:8px;border-radius:6px;background:var(--item-bg);border:1px solid var(--border);">' + escapeHTML(jsonStr) + '</textarea>' +
        '<button class="btn-close" onclick="closeModal(\'subOverlay\')">关闭</button>' +
        '</div>';
    openSubModal(html);
}

function copyShopItemsToClipboard() {
    var exportData = { type: 'shopItems', version: '1.0', data: shopItems, count: shopItems.length };
    copyToClipboard(JSON.stringify(exportData, null, 2), '商品库');
    closeModal('subOverlay');
}

function downloadShopItemsFile() {
    var exportData = { type: 'shopItems', version: '1.0', data: shopItems, count: shopItems.length, exportTime: new Date().toISOString() };
    var jsonStr = JSON.stringify(exportData, null, 2);
    var blob = new Blob([jsonStr], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'shop_items_' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    closeModal('subOverlay');
    showToast('商品库已下载');
}

function importShopItems() {
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
                var newItems = null;
                if (Array.isArray(data)) newItems = data;
                else if (data.type === 'shopItems' && Array.isArray(data.data)) newItems = data.data;
                else if (Array.isArray(data.items)) newItems = data.items;
                
                if (newItems && newItems.length > 0) {
                    var valid = true;
                    for (var i = 0; i < newItems.length; i++) {
                        if (!newItems[i].name || typeof newItems[i].price !== 'number') { valid = false; break; }
                        if (!newItems[i].id) newItems[i].id = 'item_' + Date.now() + '_' + i;
                    }
                    if (!valid) throw new Error('格式错误');
                    shopItems = newItems;
                    saveShopItems();
                    showToast('导入成功，共 ' + shopItems.length + ' 个商品');
                    openShopModal();
                } else throw new Error('格式错误或内容为空');
            } catch(err) {
                console.error('导入错误:', err);
                showToast('导入失败，文件格式错误');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function otherRandomBuy() {
    var isEnabled = localStorage.getItem('other_random_buy_enabled');
    if (isEnabled === 'false') return;
    if (typeof isInCall !== 'undefined' && (isInCall || isRinging)) return;
    if (typeof shopItems === 'undefined' || !shopItems.length) return;
    
    // ========== 暖屋联动：5% 概率触发暖屋随机购买 ==========
    if (Math.random() < 0.05 && typeof cozyOtherRandomBuy === 'function') {
        cozyOtherRandomBuy();
        return;
    }
    // ========== 暖屋联动结束 ==========
    
    if (Math.random() > 0.1) return;
    
    var randomIndex = Math.floor(Math.random() * shopItems.length);
    var item = shopItems[randomIndex];
    sendPurchaseMessage(item, 'other');
}

setInterval(function() {
    otherRandomBuy();
}, 30000);
window.openShopModal = openShopModal;
window.closeShopFullscreen = closeShopFullscreen;
