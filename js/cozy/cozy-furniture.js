// ==================== 暖屋商城（墙/窗/地面） ====================

function openCozyShop() {
    var html = '<h3>暖屋商城</h3>';
    html += '<div class="sub">更换墙面、窗户、地面的样式</div>';
    
    html += '<div style="text-align:center;padding:8px 0;margin-bottom:12px;background:#f5ede4;border-radius:12px;border:2px solid #4a3728;font-size:14px;">' +
        '温暖值：<span style="font-weight:bold;color:#e8a87c;">' + appData.cozyRoom.warmth + '</span>' +
        '</div>';
    
    var categories = ['wall', 'window', 'floor'];
    var labels = ['墙面', '窗户', '地面'];
    
    for (var c = 0; c < categories.length; c++) {
        var cat = categories[c];
        var label = labels[c];
        var options = getCozyOptions(cat);
        var current = appData.cozyRoom[cat] || '';
        
        html += '<div style="margin-bottom:14px;border-top:1.5px solid #e8d5c4;padding-top:10px;">';
        html += '<div style="font-weight:bold;font-size:14px;color:#4a3728;margin-bottom:6px;">' + label + '</div>';
        
        for (var i = 0; i < options.length; i++) {
            var opt = options[i];
            var owned = isCozyOwned(cat, opt.id);
            var active = (current === opt.id);
            var priceText = opt.price === 0 ? '初始' : opt.price + '温暖值';
            
            var bgColor = '';
            if (cat === 'wall') {
                var wallColors = {
                    'warm': '#f5ede4',
                    'mint': '#d4e8d8',
                    'lavender': '#e0dce8',
                    'peach': '#f5e0d8',
                    'sky': '#d4e4f0',
                    'cream': '#f5f0e8',
                    'sage': '#dce4d0',
                    'dusty': '#e8dcd8'
                };
                bgColor = wallColors[opt.id] || '#f5ede4';
            } else if (cat === 'floor') {
                var floorColors = {
                    'wood': '#d4c0b0',
                    'carpet': '#d8ccc4',
                    'tile': '#e0dcd4',
                    'tatami': '#d4c8b4',
                    'marble': '#e8e4dc',
                    'brick': '#d0c0b0'
                };
                bgColor = floorColors[opt.id] || '#d4c0b0';
            } else {
                bgColor = '#f5ede4';
            }
            
            var activeBorder = active ? 'border-color:#4a3728;border-width:2.5px;' : '';
            var ownedBadge = owned ? '' : ' <span style="font-size:10px;color:#e8a87c;">🔒</span>';
            
            html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;margin-bottom:4px;background:' + bgColor + ';border-radius:10px;border:2px solid #e8d5c4;' + activeBorder + '">' +
                '<span>' + opt.name + (active ? ' ✓' : '') + ownedBadge + ' <span style="font-size:11px;color:#8b7355;">' + priceText + '</span></span>' +
                (owned ? 
                    '<button onclick="switchFromShop(\'' + cat + '\',\'' + opt.id + '\')" style="padding:3px 12px;border-radius:10px;border:2px solid #4a3728;background:#f5ede4;color:#4a3728;font-family:inherit;font-size:11px;cursor:pointer;">' + (active ? '使用中' : '切换') + '</button>' :
                    (opt.price === 0 ? 
                        '<button onclick="switchFromShop(\'' + cat + '\',\'' + opt.id + '\')" style="padding:3px 12px;border-radius:10px;border:2px solid #4a3728;background:#f5ede4;color:#4a3728;font-family:inherit;font-size:11px;cursor:pointer;">使用</button>' :
                        '<button onclick="buyFromShop(\'' + cat + '\',\'' + opt.id + '\')" style="padding:3px 12px;border-radius:10px;border:2px solid #4a3728;background:#e8a87c;color:white;font-family:inherit;font-size:11px;cursor:pointer;">购买</button>'
                    )
                ) +
                '</div>';
        }
        html += '</div>';
    }
    
    html += '<button onclick="closeCozyModal()" style="margin-top:8px;padding:8px 24px;border-radius:20px;border:2px solid #4a3728;background:transparent;font-family:inherit;font-size:13px;cursor:pointer;color:#4a3728;">关闭</button>';
    
    openCozyModal(html);
}

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
    
    appData.cozyRoom.warmth -= price;
    
    if (!appData.cozyRoom.purchased[category]) {
        appData.cozyRoom.purchased[category] = [];
    }
    appData.cozyRoom.purchased[category].push(id);
    appData.cozyRoom[category] = id;
    
    saveData();
    
    openCozyShop();
    renderCozyRoom();
    updateWarmthDisplay();
    
    showToast('已更换 ' + getOptionName(category, id));
    addSystemMsg('我更换了' + getCozyLabel(category) + '：' + getOptionName(category, id));
}

function switchFromShop(category, id) {
    if (!isCozyOwned(category, id)) {
        showToast('尚未购买');
        return;
    }
    
    appData.cozyRoom[category] = id;
    saveData();
    
    openCozyShop();
    renderCozyRoom();
    
    showToast('已切换至 ' + getOptionName(category, id));
}

// 导入到全局
window.openCozyShop = openCozyShop;
window.buyFromShop = buyFromShop;
window.switchFromShop = switchFromShop;

console.log('暖屋商城已加载（墙/窗/地面版）');
