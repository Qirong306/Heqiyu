// ==================== 暖屋数据初始化 ====================

// 只保留墙、窗、地面的配置
const COZY_FURNITURE_CONFIG = {
    wall: {
        label: '墙面',
        options: [
            { id: 'warm', name: '暖杏色', price: 0 },
            { id: 'mint', name: '薄荷绿', price: 8 },
            { id: 'lavender', name: '薰衣草', price: 8 },
            { id: 'peach', name: '蜜桃粉', price: 8 },
            { id: 'sky', name: '天空蓝', price: 8 },
            { id: 'cream', name: '奶油白', price: 6 },
            { id: 'sage', name: '鼠尾草', price: 10 },
            { id: 'dusty', name: '玫瑰灰', price: 10 }
        ]
    },
    window: {
        label: '窗户',
        options: [
            { id: 'arch', name: '拱形窗', price: 0 },
            { id: 'grid', name: '方格窗', price: 6 },
            { id: 'french', name: '法式窗', price: 10 },
            { id: 'bay', name: '飘窗', price: 14 },
            { id: 'round', name: '圆窗', price: 12 },
            { id: 'gothic', name: '哥特窗', price: 16 }
        ]
    },
    floor: {
        label: '地面',
        options: [
            { id: 'wood', name: '木地板', price: 0 },
            { id: 'carpet', name: '地毯', price: 6 },
            { id: 'tile', name: '瓷砖', price: 8 },
            { id: 'tatami', name: '榻榻米', price: 10 },
            { id: 'marble', name: '大理石', price: 14 },
            { id: 'brick', name: '砖地', price: 8 }
        ]
    }
};

// 默认已拥有的（免费初始）
const DEFAULT_OWNED = {
    wall: ['warm'],
    window: ['arch'],
    floor: ['wood']
};

// 默认奖励池
const DEFAULT_REWARD_POOL = [
    '温暖值 +5',
    '温暖值 +10',
    '温暖值 +15',
    '家具折扣券',
    '小星星',
    '一杯虚拟咖啡',
    '今日好心情',
    '阳光明媚'
];

// ==================== 初始化暖屋数据 ====================
function initCozyData() {
    if (appData.cozyRoom) return;
    
    appData.cozyRoom = {
        wall: 'warm',
        window: 'arch',
        floor: 'wood',
        warmth: 100,
        purchased: JSON.parse(JSON.stringify(DEFAULT_OWNED)),
        messages: [],
        daily: {
            lastDate: '',
            claimed: false,
            pool: [...DEFAULT_REWARD_POOL],
            todayReward: ''
        },
        focus: {
            danmaku: []
        },
        otherPurchases: []
    };
    
    saveData();
}

// ==================== 工具函数 ====================

function getCozyOptions(category) {
    return COZY_FURNITURE_CONFIG[category]?.options || [];
}

function getCozyCurrent(category) {
    return appData.cozyRoom[category] || '';
}

function isCozyOwned(category, id) {
    return appData.cozyRoom.purchased[category]?.includes(id) || false;
}

function getCozyPrice(category, id) {
    var opt = COZY_FURNITURE_CONFIG[category]?.options.find(function(o) { return o.id === id; });
    return opt?.price || 0;
}

function getCozyLabel(category) {
    return COZY_FURNITURE_CONFIG[category]?.label || category;
}

// ==================== 购买逻辑 ====================

function buyCozyItem(category, id) {
    var price = getCozyPrice(category, id);
    if (price === 0) {
        showToast('这是初始免费款，已拥有');
        return false;
    }
    
    if (appData.cozyRoom.warmth < price) {
        showToast('温暖值不足，需要 ' + price + ' 点');
        return false;
    }
    
    if (isCozyOwned(category, id)) {
        showToast('已拥有');
        return false;
    }
    
    appData.cozyRoom.warmth -= price;
    
    if (!appData.cozyRoom.purchased[category]) {
        appData.cozyRoom.purchased[category] = [];
    }
    appData.cozyRoom.purchased[category].push(id);
    appData.cozyRoom[category] = id;
    
    saveData();
    showToast('已更换为 ' + getOptionName(category, id));
    addSystemMsg('我更换了' + getCozyLabel(category) + '：' + getOptionName(category, id));
    
    return true;
}

function switchCozyStyle(category, id) {
    if (!isCozyOwned(category, id)) {
        showToast('尚未购买');
        return false;
    }
    appData.cozyRoom[category] = id;
    saveData();
    return true;
}

function getOptionName(category, id) {
    var opt = COZY_FURNITURE_CONFIG[category]?.options.find(function(o) { return o.id === id; });
    return opt?.name || id;
}

// ==================== 对方随机购买 ====================

function cozyOtherRandomBuy() {
    var available = [];
    for (var cat in COZY_FURNITURE_CONFIG) {
        var options = COZY_FURNITURE_CONFIG[cat].options;
        for (var i = 0; i < options.length; i++) {
            var opt = options[i];
            if (opt.price > 0 && !isCozyOwned(cat, opt.id)) {
                available.push({ category: cat, id: opt.id, name: opt.name });
            }
        }
    }
    
    if (available.length === 0) return;
    
    var pick = available[Math.floor(Math.random() * available.length)];
    
    if (!appData.cozyRoom.purchased[pick.category]) {
        appData.cozyRoom.purchased[pick.category] = [];
    }
    appData.cozyRoom.purchased[pick.category].push(pick.id);
    appData.cozyRoom[pick.category] = pick.id;
    
    appData.cozyRoom.otherPurchases.push({
        category: pick.category,
        id: pick.id,
        name: pick.name,
        time: Date.now(),
        isNew: true
    });
    
    saveData();
}

// ==================== 每日奖励 ====================

function getTodayReward() {
    var today = new Date().toDateString();
    var daily = appData.cozyRoom.daily;
    
    if (daily.lastDate !== today) {
        daily.lastDate = today;
        daily.claimed = false;
        var pool = daily.pool || DEFAULT_REWARD_POOL;
        daily.todayReward = pool[Math.floor(Math.random() * pool.length)];
        saveData();
    }
    
    return daily;
}

function claimDailyReward() {
    var daily = getTodayReward();
    
    if (daily.claimed) {
        showToast('今日已领取');
        return false;
    }
    
    var reward = daily.todayReward;
    var value = parseInt(reward.match(/\d+/)?.[0] || 0);
    
    if (value > 0) {
        appData.cozyRoom.warmth += value;
    }
    
    daily.claimed = true;
    saveData();
    
    showToast('领取成功！' + reward);
    addSystemMsg('我在暖屋领取了每日奖励：' + reward);
    
    return true;
}

// ==================== 留言板 ====================

function addCozyMessage(content, from) {
    if (!content.trim()) return;
    appData.cozyRoom.messages.push({
        from: from || 'me',
        content: content.trim(),
        time: Date.now()
    });
    saveData();
}

// ==================== 专注弹幕 ====================

function addCozyDanmaku(text, from) {
    if (!text.trim()) return;
    appData.cozyRoom.focus.danmaku.push({
        text: text.trim(),
        from: from || 'me',
        time: Date.now()
    });
    if (appData.cozyRoom.focus.danmaku.length > 50) {
        appData.cozyRoom.focus.danmaku.shift();
    }
    saveData();
}

// ==================== 导出 ====================
window.COZY_FURNITURE_CONFIG = COZY_FURNITURE_CONFIG;
window.initCozyData = initCozyData;
window.buyCozyItem = buyCozyItem;
window.switchCozyStyle = switchCozyStyle;
window.getCozyOptions = getCozyOptions;
window.getCozyCurrent = getCozyCurrent;
window.isCozyOwned = isCozyOwned;
window.getCozyPrice = getCozyPrice;
window.getCozyLabel = getCozyLabel;
window.getOptionName = getOptionName;
window.cozyOtherRandomBuy = cozyOtherRandomBuy;
window.getTodayReward = getTodayReward;
window.claimDailyReward = claimDailyReward;
window.addCozyMessage = addCozyMessage;
window.addCozyDanmaku = addCozyDanmaku;

console.log('暖屋数据模块已加载（墙/窗/地面版）');
