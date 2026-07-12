// ==================== 暖屋家具商城 ====================

// ==================== 打开商城 ====================

function openCozyShop() {
    var html = '<h3>家具商城</h3>';
    html += '<div class="sub">用温暖值添置家具</div>';
    
    // 当前温暖值
    html += '<div style="text-align:center;padding:8px 0;margin-bottom:12px;background:#f5ede4;border-radius:12px;font-size:14px;">' +
        '当前温暖值：<span style="font-weight:bold;color:#e8a87c;">' + appData.cozyRoom.warmth + '</span>' +
        '</div>';
    
    // 分类 Tab
    var categories = ['sofa', 'bed', 'bookshelf', 'desk', 'flower', 'doll', 'pillow', 'window', 'floor', 'weather'];
    var labels = ['沙发', '床', '书架', '书桌', '花', '玩偶', '枕头', '窗户', '地板', '天气'];
    
    html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;">';
    for (var i = 0; i < categories.length; i++) {
        var cat = categories[i];
        var label = labels[i];
        var active = (window._cozyShopCategory === cat) ? 'background:#e8d5c4;' : 'background:#fffcf8;';
        html += '<button onclick="switchCozyShopCategory(\'' + cat + '\')" style="padding:4px 12px;border-radius:12px;border:2px solid #e8d5c4;' + active + 'font-family:inherit;font-size:12px;cursor:pointer;color:#4a3728;">' + label + '</button>';
    }
    html += '</div>';
    
    // 当前分类商品列表
    var currentCat = window._cozyShopCategory || 'sofa';
    var options = getCozyOptions(currentCat);
    var label = getCozyLabel(currentCat);
    
    html += '<div style="font-size:13px;color:#8b7355;margin-bottom:8px;">' + label + '</div>';
    html += '<div class="shop-grid">';
    
    options.forEach(function(opt) {
        var owned = isCozyOwned(currentCat, opt.id);
        var active = (appData.cozyRoom[currentCat] === opt.id);
        var priceText = opt.price === 0 ? '初始' : opt.price + '温暖值';
        
        html += '<div class="shop-item" style="' + (active ? 'border-color:#d4b8a0;background:#f5ede4;' : '') + '">' +
            '<div class="info">' +
                '<span class="name">' + opt.name + 
                (active ? ' <span style="color:#8b7355;font-size:11px;">(使用中)</span>' : '') +
                '</span>' +
                '<span class="price">' + priceText + '</span>' +
            '</div>' +
            (owned ? 
                '<button class="btn-buy owned" onclick="switchFromShop(\'' + currentCat + '\',\'' + opt.id + '\')" ' + (active ? 'style="background:#d4b8a0;"' : '') + '>' + (active ? '使用中' : '切换') + '</button>' :
                (opt.price === 0 ? 
                    '<button class="btn-buy owned" onclick="switchFromShop(\'' + currentCat + '\',\'' + opt.id + '\')">使用</button>' :
                    '<button class="btn-buy" onclick="buyFromShop(\'' + currentCat + '\',\'' + opt.id + '\')">购买</button>'
                )
            ) +
            '</div>';
    });
    
    html += '</div>';
    html += '<button onclick="closeCozyModal()" style="margin-top:12px;padding:8px 24px;border-radius:20px;border:2px solid #e8d5c4;background:transparent;font-family:inherit;font-size:13px;cursor:pointer;color:#4a3728;">关闭</button>';
    
    openCozyModal(html);
}

// ==================== 切换商城分类 ====================

function switchCozyShopCategory(category) {
    window._cozyShopCategory = category;
    openCozyShop();
}

// ==================== 从商城购买 ====================

function buyFromShop(category, id) {
    var price = getCozyPrice(category, id);
    if (price === 0) {
        showToast('这是初始款式，无需购买');
        return;
    }
    
    if (appData.cozyRoom.warmth < price) {
        showToast('温暖值不足，需要 ' + price + ' 点');
        return;
    }
    
    if (isCozyOwned(category, id)) {
        showToast('已拥有');
        return;
    }
    
    // 扣温暖值
    appData.cozyRoom.warmth -= price;
    
    // 记录购买
    if (!appData.cozyRoom.purchased[category]) {
        appData.cozyRoom.purchased[category] = [];
    }
    appData.cozyRoom.purchased[category].push(id);
    
    // 自动换上
    appData.cozyRoom[category] = id;
    
    saveData();
    
    // 刷新商城
    openCozyShop();
    renderCozyFurniture();
    updateWarmthDisplay();
    
    // 天气特殊处理
    if (category === 'weather') {
        updateWeather();
    }
    
    showToast('已购买 ' + getOptionName(category, id));
    addSystemMsg('我在暖屋添置了 ' + getOptionName(category, id));
}

// ==================== 从商城切换 ====================

function switchFromShop(category, id) {
    if (!isCozyOwned(category, id)) {
        showToast('尚未购买');
        return;
    }
    
    appData.cozyRoom[category] = id;
    saveData();
    
    // 刷新商城
    openCozyShop();
    renderCozyFurniture();
    
    if (category === 'weather') {
        updateWeather();
    }
    
    showToast('已切换至 ' + getOptionName(category, id));
}

// ==================== 导入到全局 ====================

window.openCozyShop = openCozyShop;
window.switchCozyShopCategory = switchCozyShopCategory;
window.buyFromShop = buyFromShop;
window.switchFromShop = switchFromShop;

console.log('暖屋家具商城已加载');
