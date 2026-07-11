// ==================== 暖屋数据初始化 ====================

// 所有家具配置（纯文字，图标用 CSS 绘制）
const COZY_FURNITURE_CONFIG = {
    weather: {
        label: '窗外天气',
        options: [
            { id: 'sunny', name: '晴天', price: 0 },
            { id: 'cloudy', name: '多云', price: 5 },
            { id: 'rainy', name: '下雨', price: 8 },
            { id: 'snowy', name: '下雪', price: 10 },
            { id: 'night', name: '夜晚', price: 12 },
            { id: 'sunset', name: '晚霞', price: 15 }
        ]
    },
    window: {
        label: '窗户',
        options: [
            { id: 'arch', name: '拱形窗', price: 0 },
            { id: 'grid', name: '方格窗', price: 6 },
            { id: 'french', name: '法式窗', price: 10 },
            { id: 'bay', name: '飘窗', price: 14 }
        ]
    },
    floor: {
        label: '地板',
        options: [
            { id: 'wood', name: '木地板', price: 0 },
            { id: 'carpet', name: '地毯', price: 6 },
            { id: 'tile', name: '瓷砖', price: 8 },
            { id: 'tatami', name: '榻榻米', price: 10 }
        ]
    },
    sofa: {
        label: '沙发',
        options: [
            { id: 'fabric', name: '布艺沙发', price: 0 },
            { id: 'leather', name: '皮质沙发', price: 10 },
            { id: 'lounge', name: '懒人沙发', price: 8 }
        ]
    },
    bed: {
        label: '双人床',
        options: [
            { id: 'wooden', name: '木质床', price: 0 },
            { id: 'upholstered', name: '软包床', price: 12 },
            { id: 'iron', name: '铁艺床', price: 10 },
            { id: 'tatami', name: '榻榻米床', price: 14 }
        ]
    },
    bookshelf: {
        label: '书架',
        options: [
            { id: 'tall', name: '落地书架', price: 0 },
            { id: 'wall', name: '壁挂书架', price: 8 },
            { id: 'short', name: '矮柜书架', price: 6 }
        ]
    },
    desk: {
        label: '书桌',
        options: [
            { id: 'simple', name: '简约书桌', price: 0 },
            { id: 'vintage', name: '复古书桌', price: 10 },
            { id: 'modern', name: '现代书桌', price: 8 }
        ]
    },
    flower: {
        label: '花篮',
        options: [
            { id: 'wicker', name: '藤编花篮', price: 0 },
            { id: 'glass', name: '玻璃花瓶', price: 6 },
            { id: 'ceramic', name: '陶瓷花盆', price: 8 }
        ]
    },
    doll: {
        label: '玩偶',
        options: [
            { id: 'bear', name: '小熊', price: 0 },
            { id: 'rabbit', name: '小兔', price: 6 },
            { id: 'cat', name: '小猫', price: 6 },
            { id: 'dog', name: '小狗', price: 6 }
        ]
    },
    pillow: {
        label: '枕头',
        options: [
            { id: 'round', name: '圆形枕', price: 0 },
            { id: 'square', name: '方形枕', price: 4 },
            { id: 'long', name: '长条枕', price: 6 }
        ]
    }
};

// 默认已拥有的（免费初始）
const DEFAULT_OWNED = {
    weather: ['sunny'],
    window: ['arch'],
    floor: ['wood'],
    sofa: ['fabric'],
    bed: ['wooden'],
    bookshelf: ['tall'],
    desk: ['simple'],
    flower: ['wicker'],
    doll: ['bear'],
    pillow: ['round']
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
        // 当前激活的样式
        weather: 'sunny',
        window: 'arch',
        floor: 'wood',
        sofa: 'fabric',
        bed: 'wooden',
        bookshelf: 'tall',
        desk: 'simple',
        flower: 'wicker',
        doll: 'bear',
        pillow: 'round',
        pillowColor: '#d4a8a0',
        
        // 温暖值
        warmth: 100,
        
        // 已购买记录
        purchased: JSON.parse(JSON.stringify(DEFAULT_OWNED)),
        
        // 留言板
        messages: [],
        
        // 每日奖励
        daily: {
            lastDate: '',
            claimed: false,
            pool: [...DEFAULT_REWARD_POOL],
            todayReward: ''
        },
        
        // 专注弹幕
        focus: {
            danmaku: []
        },
        
        // 对方购买记录
        otherPurchases: []
    };
    
    saveData();
}

// ==================== 工具函数 ====================

// 获取某个分类的所有选项
function getCozyOptions(category) {
    return COZY_FURNITURE_CONFIG[category]?.options || [];
}

// 获取某个分类的当前选中
function getCozyCurrent(category) {
    return appData.cozyRoom[category] || '';
}

// 检查是否已购买
function isCozyOwned(category, id) {
    return appData.cozyRoom.purchased[category]?.includes(id) || false;
}

// 获取价格
function getCozyPrice(category, id) {
    const opt = COZY_FURNITURE_CONFIG[category]?.options.find(o => o.id === id);
    return opt?.price || 0;
}

// 获取分类标签
function getCozyLabel(category) {
    return COZY_FURNITURE_CONFIG[category]?.label || category;
}

// ==================== 购买逻辑 ====================

// 购买家具
function buyCozyItem(category, id) {
    const price = getCozyPrice(category, id);
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
    showToast('已购买「' + getCozyLabel(category) + '：' + getOptionName(category, id) + '」');
    
    // 聊天通知
    addSystemMsg('我在暖屋添置了 ' + getOptionName(category, id));
    
    return true;
}

// 切换样式（必须已购买）
function switchCozyStyle(category, id) {
    if (!isCozyOwned(category, id)) {
        showToast('尚未购买');
        return false;
    }
    appData.cozyRoom[category] = id;
    saveData();
    return true;
}

// 获取选项名称
function getOptionName(category, id) {
    const opt = COZY_FURNITURE_CONFIG[category]?.options.find(o => o.id === id);
    return opt?.name || id;
}

// ==================== 对方随机购买 ====================

function cozyOtherRandomBuy() {
    // 收集所有未购买的选项
    const available = [];
    for (const cat in COZY_FURNITURE_CONFIG) {
        const options = COZY_FURNITURE_CONFIG[cat].options;
        for (const opt of options) {
            if (opt.price > 0 && !isCozyOwned(cat, opt.id)) {
                available.push({ category: cat, id: opt.id, name: opt.name, price: opt.price });
            }
        }
    }
    
    if (available.length === 0) return;
    
    // 随机选一个
    const pick = available[Math.floor(Math.random() * available.length)];
    
    // 自动购买（不扣温暖值）
    if (!appData.cozyRoom.purchased[pick.category]) {
        appData.cozyRoom.purchased[pick.category] = [];
    }
    appData.cozyRoom.purchased[pick.category].push(pick.id);
    appData.cozyRoom[pick.category] = pick.id;
    
    // 记录对方购买
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
    const today = new Date().toDateString();
    const daily = appData.cozyRoom.daily;
    
    if (daily.lastDate !== today) {
        daily.lastDate = today;
        daily.claimed = false;
        // 从池子里随机选一个
        const pool = daily.pool || DEFAULT_REWARD_POOL;
        daily.todayReward = pool[Math.floor(Math.random() * pool.length)];
        saveData();
    }
    
    return daily;
}

function claimDailyReward() {
    const daily = getTodayReward();
    
    if (daily.claimed) {
        showToast('今日已领取');
        return false;
    }
    
    const reward = daily.todayReward;
    const value = parseInt(reward.match(/\d+/)?.[0] || 0);
    
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
    // 只保留最近50条
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

console.log('暖屋数据模块已加载（纯文字 + CSS 图标版）');
