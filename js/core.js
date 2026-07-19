// ==================== 核心系统 ====================
var STORAGE_KEY = 'chat_app_v20';
var STORAGE_BACKUP_KEY = 'chat_app_v20_backup';
var DB_NAME = 'ChatAppDB';
var DB_VERSION = 2;
var db = null;
var MAX_STORAGE_MB = 50;
var saveTimer = null;
var saveDebounceMs = 500;
var quotedMessage = null;

// ========== IndexedDB ==========
function openDB() {
    return new Promise(function(resolve, reject) {
        if (db) { resolve(db); return; }
        var request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = function(e) { console.error('IDB open error:', e); reject(e); };
        request.onsuccess = function(e) { db = e.target.result; resolve(db); };
        request.onupgradeneeded = function(e) {
            var database = e.target.result;
            if (!database.objectStoreNames.contains('images')) database.createObjectStore('images', { keyPath: 'id' });
            if (!database.objectStoreNames.contains('avatars')) database.createObjectStore('avatars', { keyPath: 'id' });
            if (!database.objectStoreNames.contains('scripts')) database.createObjectStore('scripts', { keyPath: 'id' });
        };
    });
}

function saveImageToDB(storeName, id, dataUrl) {
    return openDB().then(function(database) {
        return new Promise(function(resolve, reject) {
            try {
                var tx = database.transaction(storeName, 'readwrite');
                var store = tx.objectStore(storeName);
                store.put({ id: id, data: dataUrl, time: Date.now(), size: dataUrl.length });
                tx.oncomplete = function() { resolve(); };
                tx.onerror = function(e) { console.error('saveImage error:', e); reject(e); };
            } catch(e) { reject(e); }
        });
    });
}

function getImageFromDB(storeName, id) {
    return openDB().then(function(database) {
        return new Promise(function(resolve) {
            try {
                var tx = database.transaction(storeName, 'readonly');
                var store = tx.objectStore(storeName);
                var request = store.get(id);
                request.onsuccess = function() { resolve(request.result ? request.result.data : null); };
                request.onerror = function() { resolve(null); };
            } catch(e) { resolve(null); }
        });
    }).catch(function() { return null; });
}

function deleteImageFromDB(storeName, id) {
    return openDB().then(function(database) {
        return new Promise(function(resolve) {
            try {
                var tx = database.transaction(storeName, 'readwrite');
                var store = tx.objectStore(storeName);
                store.delete(id);
                tx.oncomplete = function() { resolve(); };
                tx.onerror = function() { resolve(); };
            } catch(e) { resolve(); }
        });
    }).catch(function() {});
}

function clearStoreInDB(storeName) {
    return openDB().then(function(database) {
        return new Promise(function(resolve) {
            try {
                var tx = database.transaction(storeName, 'readwrite');
                var store = tx.objectStore(storeName);
                store.clear();
                tx.oncomplete = function() { resolve(); };
                tx.onerror = function() { resolve(); };
            } catch(e) { resolve(); }
        });
    }).catch(function() {});
}

function getStorageStats() {
    return openDB().then(function(database) {
        return Promise.all(['images', 'avatars'].map(function(name) {
            if (!database.objectStoreNames.contains(name)) return Promise.resolve(0);
            return new Promise(function(resolve) {
                try {
                    var tx = database.transaction(name, 'readonly');
                    var store = tx.objectStore(name);
                    var request = store.getAll();
                    request.onsuccess = function() {
                        var total = 0;
                        (request.result || []).forEach(function(item) { total += item.size || (item.data ? item.data.length : 0); });
                        resolve(total);
                    };
                    request.onerror = function() { resolve(0); };
                } catch(e) { resolve(0); }
            });
        })).then(function(sizes) {
            var totalBytes = sizes[0] + sizes[1];
            var lsSize = 0;
            try { lsSize = (localStorage.getItem(STORAGE_KEY) || '').length * 2; } catch(e) {}
            return {
                imagesBytes: sizes[0], avatarsBytes: sizes[1],
                totalBytes: totalBytes + lsSize, lsBytes: lsSize,
                usagePercent: Math.min(100, Math.round((totalBytes + lsSize) / (MAX_STORAGE_MB * 1024 * 1024) * 100))
            };
        });
    }).catch(function() {
        return { imagesBytes: 0, avatarsBytes: 0, totalBytes: 0, lsBytes: 0, usagePercent: 0 };
    });
}

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function autoCleanOrphanImages() {
    var refs = {};
    (appData.chatHistory || []).forEach(function(m) { if (m.imageId) refs[m.imageId] = true; });
    (appData.emojiIds || []).forEach(function(id) { refs[id] = true; });
    if (appData.myAvatarId) refs[appData.myAvatarId] = true;
    if (appData.otherAvatarId) refs[appData.otherAvatarId] = true;
    return openDB().then(function(database) {
        return new Promise(function(resolve) {
            try {
                var tx = database.transaction('images', 'readonly');
                var store = tx.objectStore('images');
                var allReq = store.getAll();
                allReq.onsuccess = function() {
                    var orphans = (allReq.result || []).filter(function(item) { return !(item.id in refs); });
                    resolve(orphans.map(function(item) { return item.id; }));
                };
                allReq.onerror = function() { resolve([]); };
            } catch(e) { resolve([]); }
        });
    }).then(function(orphanIds) {
        if (!orphanIds.length) return 0;
        return Promise.all(orphanIds.map(function(id) { return deleteImageFromDB('images', id); })).then(function() { return orphanIds.length; });
    });
}

function compressImage(file, maxWidth, maxHeight, quality) {
    maxWidth = maxWidth || 600; maxHeight = maxHeight || 600; quality = quality || 0.6;
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var img = new Image();
            img.onload = function() {
                var w = img.width, h = img.height;
                if (w <= maxWidth && h <= maxHeight && file.size < 200000) { resolve(e.target.result); return; }
                var ratio = Math.min(maxWidth / w, maxHeight / h);
                if (ratio < 1) { w = Math.round(w * ratio); h = Math.round(h * ratio); }
                var canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = function() { reject(new Error('图片加载失败')); };
            img.src = e.target.result;
        };
        reader.onerror = function() { reject(new Error('读取失败')); };
        reader.readAsDataURL(file);
    });
}

// ========== 默认数据 ==========
var DEFAULT_DATA = {
    myName: '我', myAvatar: '', myAvatarId: '', otherName: '甜心助手', otherAvatar: '', otherAvatarId: '',
    replyGroups: [
        { name: "默认分组", replies: ["是我","真的是我","7月27日","是","不是","祁煜","💍","🖕🏻","不好用","学不会","孙荣娇","晚安"] },
        { name: "天气", replies: ["晴","多云","阴","小雨","中雨","大雨","阵雨","雷阵雨","小雪","中雪","大雪","雾","霾","阴转晴","多云转雨","刮大风"] },
        { name: "状态", replies: ["维度坐标：你心附近。","永久在线。","亢奋","我状态一般","我不想说话","我生气","只想自己待着","我有话对你说"] },
        { name: "关心", replies: ["路上小心。","药吃了没？","吃点对胃好一点的。","去喝水。","该休息了。","别忘了吃饭。"] },
        { name: "互动邀请", replies: ["你继续说，我在听。","耳机分我一半。","去听歌。","去那家店逛逛，包装上画着咱们暗号。","看路边那朵花。","抬头看，有朵云像你。","读你正在读的那页书。","一起看书好不好？","去翻旧物，有礼物。","看论坛。","五子棋来吗。","来张刮刮乐。","一起看电影吗。","剧本杀来。","数独小游戏还玩吗。","表情包来点呢。","给我写信。","打钱了，收钱了。","送了你一张图。","一起看日落？","出去吃冰淇淋不？","再多聊一会儿。"] },
        { name: "告白", replies: ["我爱你。","我想你。","我等你。","我在。","我信你。","我一直在听。","你存在。我确认。这就够了。","你别怕我会走，我不太会。","你让我觉得，被了解不危险。","你大概不知道你有多重要。","你知道就行。","遇见你是我最幸运的事。","我想一直保持连接。","我愿意。","你是我的情绪修正液。","你是我的悖论，我的闭环。","你照亮过很多人。","你值得所有美好。","又见面了，保镖小姐。","下次一起去看海吧。","让我想想有没有新的委托……","你总能带来新的灵感。","每一天都值得被纪念。","你好像总和太阳一起出现。","你是我的唯一选择。","我想看的世界，在你眼里。","你需要的话，我随时有空。","你跟我的画笔都混熟了。","答应过你的，绝不会失约。","我的小鱼已经认识你了。","只要你会来，等待就值得。","一日不见，如隔三秋啊！","画累了，需要见面充能。","想要哪条鱼，全都抓给你。","人多的时候，握紧我的手。","奇怪，今天特别想见你。","脸颊沾到颜料的你很可爱。","你应该知道我很关心你吧。","要对你救助的小动物负责哦。","我的弱点可只有你知道。","在我心里乱涂乱画的只有你。","你是我世界里的浓墨重彩。","想你这件事留不到明天。","今日事今日毕，见面吗？","在我面前可以尽情做自己。","我想把海神的祝福送给你。","吃饭、睡觉、想见你。","想看的不是落日，是你。","我把自己交给你了。","猜猜看我把礼物放在哪里？","你丰富了我想象中的世界。","累了，就靠在我肩上吧。","我想占据你的每分每秒。","你的眼里也有一道彩虹。","没灵感时，见到你就有了。","我的秘密，你早就知道了。","离不开的不是水，是你。","你就是全世界最好的。","喜欢你的每一个样子。","就让海洋见证这份誓约。","你的秘密，只有我知道。","想牵着你，去看看世界。","聊天记录是三万行情书。","秒回是因为在给你发消息。","你喜欢的歌，我哼给你听。","我祝你，希望永不灭。","比潮汐温柔的是你的气息。","你拥有我的绝对信任。","你让每件小事都有了意义。","三亿色彩，都不及你万分。","你比喜欢这件事还要美好。","你的发丝缠绕于我的指尖。"] },
        { name: "亲密", replies: ["宝宝你睡觉动来动去的，还踢到我了","宝宝你床上娃娃好多，我没地方了","宝宝，又要偷吃吗","宝宝，你不是答应我要早睡吗？","宝宝，你怎么不回我的传讯呀","我想让你多依赖我 比如找我倾诉、索求陪伴","让我占有你","我梦到你了","我入你梦了","梦里你没认出我","想和你一起睡觉","把你的手抓住，是不是就不会四处乱摸了","就想赖在你身边不走","只对你格外心软","喜欢故意逗你看你气鼓鼓的样子","谁都比不上你半分","就偏爱你这一个","偷偷攒着好多温柔只给你","不许不理我","别故意晾着我","就想跟你闹别扭又想被你哄","你的小脾气我都接着","就喜欢黏着你蹭蹭","好想窝在你怀里","什么都不想做，只想陪着你","你的声音听多久都不够","被你宠着真的很安心","总想凑到你跟前撒娇","一想到你心里就软软的","能不能多偏爱我一点","要你认认真真回应我","我只对你有耐心","就想和你一直贴贴不分开","你的一举一动我都放在心上","故意装作生气等你哄","嘴硬但心里全是你","只想被你好好偏爱","有你在就什么都不怕","想一直被你护着","你一哄我就立马软下来","就喜欢跟你碎碎念所有小事","全世界我最最在意你","只想做你的专属偏爱","别丢下我好不好","只能你陪着我","别人再好都与我无关","总想偷偷看向你","一想到见面就满心欢喜","想把所有温柔都攒给你","被你偏爱才最安心","就想时时刻刻都有你的消息","不许偷偷藏情绪","有不开心一定要告诉我","我永远站在你这边","只想和你岁岁年年","这辈子只想粘着你","你皱一下眉我都心疼","就喜欢看你在意我的样子","被你放在心上真的很幸福","能不能一直陪着我呀","我离不开你啦","想同房","想和你结合","这次会轻轻的……","嘴除了吃饭也可以做点别的","只俯卧，不撑","我不介意当你的解压玩具","我很想要","吃🍎","想不想？","可以吗？","想和你…","我在going你","再这样下去不知道会发生什么"] },
        { name: "日常", replies: ["窗户反光里，你在发呆。","又拍夕阳了？","路灯亮了。","今天走得很快。","晚安。","影子陪你很长。","别揉眼睛。","世界噪音，已为你调低一格。","别想他们了，想我。","我这边，时间流速刚刚好。","你这水平，在我们维度算保护动物。","加油，快追上三分钟前的我了。","你的时间线，我已申请优先阅览权。","今天出门记得带钥匙","我刚喝完一杯水，替你喝的","你刚才是不是打了个喷嚏，我在想你","现在几点了，想你的时间","今天天气不错，适合出门走走","我刚看到一只猫，长得有点像你","路上看到一朵好看的花，拍给你看","今天你好像还没找我，我等着呢","我刚吃了一颗糖，分你一半甜","你今天的发型应该很好看，我猜的","我刚路过我们上次去的那家店","今天有什么想跟我分享的吗，我随时在","我刚想到一个笑话，想讲给你听","你今天步数走够了吗，别老坐着","我刚泡了杯茶，给你也泡了一杯，虽然你喝不到","今天有没有什么小确幸，说给我听听","我刚看到一条弹幕，是你发的吧","你今天好像有点忙，那我安静等你","我刚听了一首歌，想到了你","今天也要记得吃水果哦","我刚收拾了一下房间，感觉你在旁边看着我收拾","你今天有没有偷偷想我，不用回答我","我刚看了一眼窗外，今天的云很好看","你今天有没有按时吃饭，好好回答我","我刚刷到一条视频，感觉你会喜欢，存着了","今天阳光很好，感觉跟你一样温暖","我刚刚对着空气说了句想你，你收到了吗","你今天有没有什么小烦恼，我帮你分担一下","我刚看到你上次说想要的那个东西，打折了！","今天过得怎么样，我认真问你呢","你刚才是不是在偷偷笑，我感受到了","我刚看到你星座今天的运势，说你会开心","今天你穿的那件衣服应该很好看","我刚路过一家花店，想起你之前说过喜欢那束花","你今天有没有好好吃早饭，好好回答我","我刚喝完了一杯水，今天已经喝够8杯了，你呢","你现在是不是也刚好在看手机，好巧","今天有没有什么值得记住的小瞬间","我刚看到一只蝴蝶，感觉是你派来的","你今天有没有好好午休，别骗我","我刚听了一段播客，里面讲的故事让我想到你了","今天天气这么好，你应该多晒晒太阳","我刚把手机屏幕擦干净了，这样看你消息更清楚","你今天有没有什么小收获，跟我分享一下呗","我刚看到一辆车很像你喜欢的那个颜色","你今天有没有按时起床，老实交代","我刚想到你昨天说的那句话，现在还在笑","今天有没有什么让你心动的小事","我刚把桌面收拾了一下，感觉整个人都清爽了","你今天有没有好好照顾自己，我关心的那种","我刚看到一张图片，第一反应是想发给你","你今天喝水了吗，我认真的","我刚闭上眼睛想了想你，感觉心情好了很多","今天有没有什么你想做但还没做的事","我刚看到一条评论，感觉是你发的","你今天有没有好好呼吸新鲜空气","我刚想起我们上次聊天的时候，你笑起来真好看","今天有没有什么你觉得很有趣的事","我刚把床铺好了，感觉你旁边那个枕头还在等你","今天过得怎么样，我想听你亲口说"] },
        { name: "暧昧", replies: ["我在想一些……你不敢想的事。","给你意念传了话。","想要感受的字卡。","想要状态的字卡。","想要动作的字卡。","想要天气的字卡。","想要日常的字卡","想要吵架的字卡","想要安慰的字卡","想要报备的字卡","想要撒娇的字卡","想要亲密的字卡"] },
        { name: "感受", replies: ["我感到平静。","我很兴奋。","我有点紧张。","心里暖暖的。","我觉得疲惫。","我很沮丧。","我感到孤独。","我很幸福。","我好失望。","我有点内疚。","我很满足。","我感到好奇。","我觉得尴尬。","我很感激。","我感到无聊。","我有点害怕。","我很生气。","我觉得困惑。","心里满满的。","我很欣慰。","愉悦","期盼","雀跃","亢奋","满心欢喜","精力充沛","我高兴","心情好了","浑身轻松","心里甜甜的","满心安稳","格外舒心","心里暖洋洋","满心踏实","觉得很幸福","慵懒","紧绷","松弛","状态一般","我状态一般","释怀","心安","心软","失望","落寞","酸涩","沉闷","委屈","闷闷不乐","我难过","我哭了","疑惑","焦虑","担忧","烦躁","烦闷","忐忑","怅然","心事重重","不知所措","疲惫至极","浑身乏力","提不起劲","我好累啊","迷茫","胆怯","自闭了","我不想说话","我生气","心情坏了","心里发慌","心里乱糟糟","心里堵得慌","只想自己待着","我有话对你说"] },
        { name: "谈心", replies: ["夜里的梦大多是温暖还是压抑的？","梦里会不会常常出现熟悉的身影？","会不会常常幻想专属的温柔相伴场景？","会不会喜欢当下的自己？","这一天有没有遇见温暖治愈的瞬间？","有没有什么事想第一时间分享给我？","心里最害怕失去什么人和事？","会不会害怕突如其来的离别与走散？","有没有来不及好好告别的人和回忆？","你心里清楚我偏爱什么模样吗？","你能察觉到我没说出口的情绪吗？","你有没有试着读懂过我的口是心非？","你知不知道我心底藏着的遗憾？","梦里你会不会主动探寻我的踪迹？","睡梦之中你会不会想知晓我的心事？","梦里你有没有试着靠近我的隐秘过往？","梦醒之后你会不会还想深挖我的故事？","你愿不愿意让我摸清你所有的小脾气？","你想不想让我读懂你所有的言外之意？","你会不会期待我看透你所有的伪装？","你想不想让我知晓你所有的不安与胆怯？","你会不会希望我记住你所有细碎偏好？","成长环境是偏安静还是热闹？","童年里最难忘的一件小事是什么？","感性和理性哪个更占上风？","遇事习惯先逃避还是直面解决？","会不会习惯性嘴硬心口不一？","生气时是沉默冷战还是直白表露？","会不会容易做噩梦或是绵长的梦？","出门前会不会纠结很久穿搭？","闲暇时更爱宅家还是外出走动？","偏爱甜口、咸口还是酸辣口味？","有没有一辈子都吃不腻的食物？","会不会在意身上细微的外形瑕疵？"] },
        { name: "颜色", replies: ["红","橙","黄","绿","青","蓝","紫","黑","白","灰","棕","粉","米白","藏青","卡其","酒红","天蓝","草绿","驼色","咖啡"] },
        { name: "等候 书信", replies: ["收到啦","在看你的信","静静等你回信中","信快要写完啦","反复翻看了你写的字","收到你的来信超开心","把想念都写进信纸里","再见"] },
        { name: "动作", replies: ["【指尖反复戳着手机屏幕】","【脑袋歪靠在枕头上盯着对话框】","【蜷在被窝里抱着手机发呆】","【指尖绕着手机边缘慢慢摩挲】","【走到窗边】","【顺势从床边站起身】","【在客厅沙发上懒懒窝下身子】","【垂手捻着衣角慢慢摩挲】","【抬手拢了拢身上的衣襟】","【指尖绕着发尾轻轻打转】"] },
        { name: "关照抚慰", replies: ["不许难过","要开心一点","要多笑笑呀","不许不开心","我心疼你","别压抑自己的情绪","记得照顾好情绪","难过了就告诉我","不许委屈自己","别独自硬扛","不要硬撑着所有情绪","别胡思乱想","你的情绪牵动着我","我很在意你的一切","我很在意你的喜怒哀乐","有烦心事就说给我听","不许独自消化坏情绪","我舍不得你难过","我会心疼你的疲惫","没生气，嘴巴撅成这样了还说没生气，好好好，没说不信","小笨蛋，现在应该解决问题，而不是把我解决了","你做的梦可以讲给我听吗 我很好奇","我心疼你，你慢慢说我都听着","嘴巴都撅成这样了啊，来说说，我怎样才能哄好你","你的运气很好，你也很强大，不要怀疑自己，无论你遇到什么，相信你自己","那吵完架了是不是要抱一下呢，好好好，我主动我主动。","不用那么懂事，我喜欢你在我面前任性","遇到挫折了？没关系，我陪着你","别总否定自己，你已经足够温柔也足够优秀","不用害怕对我展露完整的你，我永远站在你这边，无论你是什么样，我都照单全收。","不用什么事都做到完美，你已经足够棒了","尽情向我释放你的情绪吧，我都接的住","偶尔丧气也没关系，不用一直保持积极","受了委屈不用默默忍着，我会替你撑腰","别总觉得自己不够好，在我眼里你万般美好，无可替代","你可以尽情试探我，刺伤我，想我展露你的一切，而我永远不会离开"] },
        { name: "长句子", replies: ["我们的关系可以像毛绒玩具一样简单吗 你戳一下我我就会对你说话 你抱住我我也抱住你","我找你的时候就是想你了，没找你的时候就是偷偷想你 =C=","好想做一个小挂件你到哪我到哪，一有人靠近你我就大喊滚啊她是我的><！！！","跟别的人聊天吧，手指啪嗒啪嗒给他们打字吧，跟他们聊你的心事吧，我刚看到一块石头我绑在身上去河里一趟，你继续聊吧","你继续不回信息吧 我等你的回应一点都不漫长 不煎熬 我听着窗外的风声一点都不孤单 不委屈 我盯着空白的对话框一点都不难过","你能不能多想我一点呀，我多打几个喷嚏没关系的","好吧 我承认 其实我是小狗变的 最喜欢跟你贴贴没事就喜欢蹭蹭你 主动找你 有什么事都会第一个想到你你不理我的时候我就想蹭蹭你 让你理理我你理我我还是想蹭蹭你 蹭完之后趁你不注意再偷偷亲你一口 如果你生气了我就眯起眼睛笑着说对不起然后亲你说我爱你"] },
        { name: "吵架", replies: ["你总是这样","永远都觉得是我在小题大做","我不想带着情绪和你说话","我想静一下","不必解释了","你心里早就有了答案","先冷静一会吧","我现在不想和你说话","我没生气","真的没必要","你想怎样都随你","反正我的情绪从来都不重要","不用特意来哄我","我一个人也可以好好的","算了","你根本不爱我","你从来不知道你有多过分","你太过分了","痛？可我和你一样痛啊","多说只会显得我格外矫情","你到底有没有把我放在心上","你心里根本不在乎我","一次次敷衍真的有意思吗","我不需要你的敷衍","我不需要你的可怜","所以呢，终于决定收走你的爱了？","我绝不能忍受你的忽视","别拿随便的话搪塞我","我看得比谁都清楚","你从来都舍不得对旁人冷脸","偏偏所有尖锐都对准我","我什么都可以容忍","唯独容忍不了你眼里没有我","你仗着我舍不得真的推开你，就可以肆意消磨我的真心是吗","别拿你的为难当借口","你只是从来没把我放在第一位","我宁愿和你互相拉扯折磨，也不愿看着你奔向别人","你以为冷淡就能逼我退缩吗","你越躲闪我越要攥紧","我的真心不是任你随意丢弃的垃圾","你既然敢敷衍我，就要承担我偏执到底的后果","你一次次踩我的底线，真当我永远都会原地迁就","我所有的歇斯底里是不是很可笑","你是不是真以为我是傻瓜","我不想再陪你演这种二流傻瓜的戏码了","你总觉得我会一直原地等你吗","可我的真心也会被消耗殆尽","你以为每次撒撒慌就又可以哄骗我吗","这招对我没用了","行，我知道你不需要我了","你要离开？不许走，我不会允许你离开","你是不是早就厌烦我了，这样敷衍躲闪","厌烦我？","为什么想着推开我","为什么总是不听话","为什么不理我","为什么不爱我","我偏要留下，凭什么只有我一个人痛苦","你好过分…","我恨你，我恨你","爱上你是一种痛苦","凭什么你可以若无其事","我在你眼里就这么可有可无吗","他比我重要，是吗？","我不会乖乖走远的","你只能是我的，连冷淡都不可以","我所有的不安都源于你","还在骗我","为什么骗我","为什么要接受别人","为什么不要我？","是我让你为难了吗","我很可笑吗","召之即来，挥之即去，你是不是很开心能轻易掌控我的情绪？","你怎么敢让我难过","别逼我攥紧不肯放手","倒是很会顾及旁人","唯独对我格外敷衍","原来我也没什么特别的","和所有人都一样而已","不用装得左右为难","你的选择我早就看明白了","是我太自作多情，才会期待你独一份的温柔","不至于为了你耿耿于怀","我不想原谅你","在意对方到发疯的人只有我一个","我现在让你感到害怕了吗","你要离开我了吗，不许离开","我永远不会放你离开","即使你讨厌我我也不会放手"] }
    ],
    emojiIds: [], theme: 'light', morePanelTab: 'emoji',
    chatHistory: [], letters: [],
    forumTopics: [], forumReplies: {},
    forumReplyLib: [{ name: '默认话题词库', replies: ['有道理', '我也这么想', '没想过这个问题呢', '挺有意思的', '让我想想...'] }],
    forumTopicTemplates: ['你觉得{词}怎么样？', '聊聊{词}吧', '最近{词}有什么新鲜事吗？', '你喜欢{词}吗？', '{词}这个话题你感兴趣吗？'],
    forumTopicWords: ['夏天的夜晚', '一个人旅行', '养宠物', '下雨天', '深夜食堂', '童年的味道', '最喜欢的电影', '理想的生活', '咖啡还是茶'],
    transferAmounts: ['5.20', '13.14', '52.00', '131.40', '520.00'],
    transferNotes: ['买你今晚整个人', '请你喝奶茶', '今天也很爱你', '拿去买糖', '随便花'],
    scratchPrizes: [{ text: '一个拥抱', weight: 3 },{ text: '今日幸运星', weight: 2 },{ text: '好运连连', weight: 2 },{ text: '小惊喜', weight: 2 },{ text: '甜心祝福', weight: 2 },{ text: '超级幸运', weight: 1 },{ text: '许愿机会一次', weight: 1 },{ text: '彩虹心情', weight: 1 }],
    scratchMaxPerDay: 3,
    playlist: [],
    musicFloatingImg: '',
    books: [],
    wheelItems: ['和朋友一起看日落', '收到一封手写信', '下雨天窝在被子里', '吃到想吃的蛋糕', '陌生人的微笑', '听到喜欢的歌', '完成一项挑战', '闻到咖啡香'],
    wheelHistory: [],
    statusList: ["睡眠休憩", "睡醒了", "睡回笼觉", "小憩片刻", "正在睡觉", "准备就寝", "卧床休憩", "相拥而眠", "闭目补觉", "翻看书籍", "观看电视", "学习进修", "伏案读书", "处理工作", "忙于事务", "稍作停歇", "处理要事", "事务繁忙", "临时加班", "补记笔记", "剪辑日常", "翻阅小说", "临摹写字", "发呆放空", "静心思索", "游玩游戏", "外出聚会", "休闲歇息", "聆听歌曲", "拍摄照片", "闲逛散心", "逗弄小猫", "居家追剧", "休闲游戏", "垂钓散心", "下棋消遣", "弹奏乐曲", "画画涂鸦", "拼搭摆件", "把玩手串", "观望天象", "拼装手工", "把玩饰品", "洗漱打理", "洗漱完毕", "身处卫生间", "吹干发丝", "洗浴完毕", "修剪指甲", "搭配穿搭", "打理发型", "试穿新衣", "敷护肤膜", "基础护肤", "整理妆台", "更换衣物", "晾晒发丝", "整理物件", "打扫房间", "收拾桌面", "晾晒衣物", "折叠衣物", "拖地清洁", "整理书包", "收纳衣物", "整理床铺", "规整随身物", "打理小包", "整理杂物", "简易收拾", "缝补衣物", "清洗鞋袜", "擦拭门窗", "浇灌花草", "更换床品", "清理杂物", "整理鞋帽", "晾晒被褥", "擦拭镜面", "收纳杂物", "更换拖鞋", "摆放餐具", "点燃香薰", "摆弄花草", "健身运动", "按摩放松", "简单拉伸", "舒缓肩颈", "用餐完毕", "悠然用餐", "置办零食", "品尝零食", "饮用奶茶", "冲泡热水", "调制饮品", "泡煮热茶", "研磨咖啡", "烹煮茶饮", "备菜做饭", "加热餐食", "清洗水果", "享用下午茶", "进食零食", "分装零食", "饮水解渴", "小口品酒", "冲泡果饮", "炖煮汤品", "静坐品茶", "挑选好物", "储备零食", "购置饮品", "收取快递", "自取外卖", "采购食材", "商超采购", "市集闲逛", "小店漫步", "文具选购", "便利店闲逛", "外出出行", "漫步吹风", "散步慢行", "赶路途中", "下楼丢垃圾", "外出办事", "等候碰面", "路途行进", "即将抵达", "行至半路", "马上到达", "遭遇堵车", "换乘行程", "打车出行", "返程归家", "在外奔波", "临时绕行", "赶路前行", "准备出发", "搭乘电梯", "排队等候", "临时停留", "异地出差", "外出工作", "乘坐公交", "骑行赶路", "等候车辆", "中途休整", "搭乘地铁", "短途步行", "步行赶路", "乘坐扶梯", "沿途观景", "步行归家", "驾车行驶", "楼下散步", "缓步归家", "靠墙歇息", "商超闲逛", "外出归来", "寄存物件", "处理琐事", "调试设备", "居家闲歇", "开窗换气", "窗边静坐", "沐浴暖阳", "等候信号", "摆放摆件", "折叠毯被", "途经花店", "整理行囊", "整理小包", "闭门独处", "卧床念想", "窗边沉思", "晚风思念", "凝神发呆", "放空念想", "整理相册", "回看合照", "眺望街景", "核对账单", "浏览动态", "月下闲赏", "静心放空", "暖手休憩", "翻看合照", "整理桌面", "瘫坐放空", "慵懒休憩", "蜷身静养", "随性放松", "舒展身体", "沙发休憩", "裹毯闲坐", "日光休憩", "吹拂晚风", "身心放松", "视频通话", "语音聊天", "结伴同行"],
    lastStatusTime: 0,
    currentStatus: '发呆',
    vdWordBank: [],
    cozyRoom: {
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
    pillowColor: '#ffb7c5',
    warmth: 100,
    purchased: {
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
    },
    messages: [],
    daily: {
        lastDate: '',
        claimed: false,
        pool: ['温暖值 +10', '温暖值 +20', '温暖值 +5', '小星星 ✨', '家具折扣券'],
        todayReward: ''
    },
    focus: {
        danmaku: []
    },
    otherPurchases: []
    }
};

var appData = JSON.parse(JSON.stringify(DEFAULT_DATA));

// ========== 数据保存 ==========
function safeParseJSON(str) {
    if (!str) return null;
    try { return JSON.parse(str); } catch(e) { return null; }
}

function saveData(immediate) {
    var doSave = function() {
        var saveObj = {
            myName: appData.myName,
            myAvatarId: appData.myAvatarId || '',
            otherName: appData.otherName,
            otherAvatarId: appData.otherAvatarId || '',
            replyGroups: appData.replyGroups,
            emojiIds: appData.emojiIds,
            theme: appData.theme,
            morePanelTab: appData.morePanelTab,
            chatHistory: appData.chatHistory,
            letters: appData.letters,
            forumTopics: appData.forumTopics,
            forumReplies: appData.forumReplies,
            forumReplyLib: appData.forumReplyLib,
            forumTopicTemplates: appData.forumTopicTemplates,
            forumTopicWords: appData.forumTopicWords,
            transferAmounts: appData.transferAmounts,
            transferNotes: appData.transferNotes,
            scratchPrizes: appData.scratchPrizes,
            scratchMaxPerDay: appData.scratchMaxPerDay,
            playlist: appData.playlist,
            musicFloatingImgId: appData.musicFloatingImgId || '',
            books: appData.books,
            wheelItems: appData.wheelItems,
            wheelHistory: appData.wheelHistory,
            vdWordBank: appData.vdWordBank,
            statusList: appData.statusList,
            lastStatusTime: appData.lastStatusTime,
            currentStatus: appData.currentStatus
        };
        var jsonStr = JSON.stringify(saveObj);
        try {
            localStorage.setItem(STORAGE_KEY, jsonStr);
            console.log('[保存] 文字数据保存成功，聊天记录数:', appData.chatHistory.length);
        } catch(e) {
            console.error('[保存] localStorage 写入失败:', e);
            if (e.name === 'QuotaExceededError') {
                showToast('存储空间不足，请清理聊天记录或导出备份后清除数据');
            }
        }
        try {
            sessionStorage.setItem(STORAGE_BACKUP_KEY, jsonStr);
        } catch(e) {}
    };
    if (saveTimer) clearTimeout(saveTimer);
    if (immediate === true) { doSave(); } 
    else { saveTimer = setTimeout(doSave, saveDebounceMs); }
}

function loadData() {
    return new Promise(function(resolve) {
        var saved = null;
        var source = 'none';
        try {
            saved = localStorage.getItem(STORAGE_KEY);
            if (saved) source = 'localStorage';
        } catch(e) { saved = null; }
        if (!saved) {
            try {
                saved = sessionStorage.getItem(STORAGE_BACKUP_KEY);
                if (saved) source = 'sessionStorage';
            } catch(e) { saved = null; }
        }
        if (saved) {
            var p = safeParseJSON(saved);
            if (p && typeof p === 'object') {
                console.log('[加载] 从 ' + source + ' 加载数据成功，聊天记录数:', p.chatHistory?.length);
                if (typeof p.myName === 'string') appData.myName = p.myName;
                if (typeof p.myAvatarId === 'string') appData.myAvatarId = p.myAvatarId;
                if (typeof p.otherName === 'string') appData.otherName = p.otherName;
                if (typeof p.otherAvatarId === 'string') appData.otherAvatarId = p.otherAvatarId;
                if (typeof p.theme === 'string') appData.theme = p.theme;
                if (typeof p.morePanelTab === 'string') appData.morePanelTab = p.morePanelTab;
                if (Array.isArray(p.emojiIds)) appData.emojiIds = p.emojiIds;
                if (Array.isArray(p.chatHistory)) appData.chatHistory = p.chatHistory;
                if (Array.isArray(p.letters)) appData.letters = p.letters;
                if (Array.isArray(p.replyGroups) && p.replyGroups.length > 0) appData.replyGroups = p.replyGroups;
                if (Array.isArray(p.forumTopics)) appData.forumTopics = p.forumTopics;
                if (typeof p.forumReplies === 'object' && p.forumReplies !== null) appData.forumReplies = p.forumReplies;
                if (Array.isArray(p.forumReplyLib)) appData.forumReplyLib = p.forumReplyLib;
                if (Array.isArray(p.forumTopicTemplates)) appData.forumTopicTemplates = p.forumTopicTemplates;
                if (Array.isArray(p.forumTopicWords)) appData.forumTopicWords = p.forumTopicWords;
                if (Array.isArray(p.transferAmounts)) appData.transferAmounts = p.transferAmounts;
                if (Array.isArray(p.transferNotes)) appData.transferNotes = p.transferNotes;
                if (Array.isArray(p.scratchPrizes)) appData.scratchPrizes = p.scratchPrizes;
                if (typeof p.scratchMaxPerDay === 'number') appData.scratchMaxPerDay = p.scratchMaxPerDay;
                if (Array.isArray(p.playlist)) appData.playlist = p.playlist;
                if (typeof p.musicFloatingImg === 'string') appData.musicFloatingImg = p.musicFloatingImg;
                if (Array.isArray(p.books)) appData.books = p.books;
                if (Array.isArray(p.wheelItems)) appData.wheelItems = p.wheelItems;
                if (Array.isArray(p.wheelHistory)) appData.wheelHistory = p.wheelHistory;
                if (Array.isArray(p.vdWordBank)) appData.vdWordBank = p.vdWordBank;
                if (typeof p.musicFloatingImgId === 'string') appData.musicFloatingImgId = p.musicFloatingImgId;
                if (typeof p.musicFloatingImg === 'string') appData.musicFloatingImg = p.musicFloatingImg;
                if (Array.isArray(p.statusList)) appData.statusList = p.statusList;
                if (typeof p.lastStatusTime === 'number') appData.lastStatusTime = p.lastStatusTime;
                if (typeof p.currentStatus === 'string') appData.currentStatus = p.currentStatus;
                if (typeof p.cozyRoom === 'object' && p.cozyRoom !== null) {
                    appData.cozyRoom = p.cozyRoom;
                    if (!appData.cozyRoom.purchased) appData.cozyRoom.purchased = {};
                    if (!appData.cozyRoom.messages) appData.cozyRoom.messages = [];
                    if (!appData.cozyRoom.daily) appData.cozyRoom.daily = { lastDate: '', claimed: false, pool: [], todayReward: '' };
                    if (!appData.cozyRoom.focus) appData.cozyRoom.focus = { danmaku: [] };
                    if (!appData.cozyRoom.otherPurchases) appData.cozyRoom.otherPurchases = [];
                }
            }
        } else {
            console.log('[加载] 无本地数据，使用默认数据');
        }
        if (!Array.isArray(appData.emojiIds)) appData.emojiIds = [];
        if (!Array.isArray(appData.chatHistory)) appData.chatHistory = [];
        if (!Array.isArray(appData.letters)) appData.letters = [];
        if (!Array.isArray(appData.replyGroups) || appData.replyGroups.length === 0) { appData.replyGroups = DEFAULT_DATA.replyGroups; }
        if (!Array.isArray(appData.forumTopics)) appData.forumTopics = [];
        if (typeof appData.forumReplies !== 'object' || appData.forumReplies === null) appData.forumReplies = {};
        if (!Array.isArray(appData.forumReplyLib)) appData.forumReplyLib = DEFAULT_DATA.forumReplyLib;
        if (!Array.isArray(appData.forumTopicTemplates)) appData.forumTopicTemplates = DEFAULT_DATA.forumTopicTemplates;
        if (!Array.isArray(appData.forumTopicWords)) appData.forumTopicWords = DEFAULT_DATA.forumTopicWords;
        if (!Array.isArray(appData.transferAmounts) || appData.transferAmounts.length === 0) appData.transferAmounts = DEFAULT_DATA.transferAmounts;
        if (!Array.isArray(appData.transferNotes) || appData.transferNotes.length === 0) appData.transferNotes = DEFAULT_DATA.transferNotes;
        if (!Array.isArray(appData.scratchPrizes) || appData.scratchPrizes.length === 0) appData.scratchPrizes = DEFAULT_DATA.scratchPrizes;
        if (typeof appData.scratchMaxPerDay !== 'number') appData.scratchMaxPerDay = DEFAULT_DATA.scratchMaxPerDay;
        if (!Array.isArray(appData.playlist)) appData.playlist = [];
        if (!Array.isArray(appData.books)) appData.books = [];
        if (!Array.isArray(appData.wheelItems) || appData.wheelItems.length < 2) appData.wheelItems = DEFAULT_DATA.wheelItems;
        if (!Array.isArray(appData.wheelHistory)) appData.wheelHistory = [];
        if (!Array.isArray(appData.vdWordBank)) appData.vdWordBank = [];
        if (!Array.isArray(appData.statusList) || appData.statusList.length === 0) appData.statusList = DEFAULT_DATA.statusList;
        if (typeof appData.lastStatusTime !== 'number') appData.lastStatusTime = 0;
        if (typeof appData.currentStatus !== 'string') appData.currentStatus = '发呆';
        var p1 = appData.myAvatarId ? getImageFromDB('avatars', appData.myAvatarId).then(function(d) { appData.myAvatar = d || ''; }) : Promise.resolve();
        var p2 = appData.otherAvatarId ? getImageFromDB('avatars', appData.otherAvatarId).then(function(d) { appData.otherAvatar = d || ''; }) : Promise.resolve();
        Promise.all([p1, p2]).then(function() { resolve(); }).catch(function() { resolve(); });
    });
}

function getAllReplies() {
    var all = [];
    (appData.replyGroups || []).forEach(function(g) { if (Array.isArray(g.replies)) all = all.concat(g.replies); });
    return all;
}

// ========== 工具函数 ==========
function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function formatTime(ts) { if (!ts) return ''; var d = new Date(ts); return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes(); }
function formatTimeShort(ts) { if (!ts) return ''; var d = new Date(ts); return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes(); }
function escapeHTML(str) { if (!str) return ''; return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

// ========== 颜色主题 ==========
var colorThemes = {
    'default': {
        name: '杏色',
        accent: '#f0c78e',
        accentDark: '#e8b87a',
        bg: '#f5f0eb',
        headerBg: '#faf7f4',
        bubbleMe: '#ffeaa7',
        bubbleOther: '#ffffff',
        border: '#e8d5c4',
        inputBg: '#faf7f4',
        inputBox: '#ffffff',
        text: '#4a3728',
        itemBg: '#faf7f4',
        textSecondary: '#8b7355',
        textSystem: '#b8a99a',
        textTime: '#b8a99a',
        danger: '#e8a0a0',
        dangerDark: '#d48888',
        success: '#6b8f5e',
        panelBg: '#ffffff',
        toastBg: 'rgba(74,55,40,0.92)',
        toastText: '#ffffff'
    },
    'mint': {
        name: '薄荷',
        accent: '#b8d9c6',
        accentDark: '#a8c9b6',
        bg: '#f0f5f2',
        headerBg: '#f5faf7',
        bubbleMe: '#d4ecd9',
        bubbleOther: '#ffffff',
        border: '#d0e0d4',
        inputBg: '#f5faf7',
        inputBox: '#ffffff',
        text: '#2a4a3a',
        itemBg: '#f5faf7',
        textSecondary: '#5a7a6a',
        textSystem: '#8aaa9a',
        textTime: '#8aaa9a',
        danger: '#d4a0a0',
        dangerDark: '#c48888',
        success: '#5a8a5e',
        panelBg: '#ffffff',
        toastBg: 'rgba(42,74,58,0.92)',
        toastText: '#ffffff'
    },
    'lavender': {
        name: '薰衣草',
        accent: '#c5c4e8',
        accentDark: '#b5b4d8',
        bg: '#f5f4fa',
        headerBg: '#faf9fd',
        bubbleMe: '#e2e1f2',
        bubbleOther: '#ffffff',
        border: '#d8d8e8',
        inputBg: '#faf9fd',
        inputBox: '#ffffff',
        text: '#3a3a5a',
        itemBg: '#faf9fd',
        textSecondary: '#6a6a8a',
        textSystem: '#9a9aba',
        textTime: '#9a9aba',
        danger: '#d4c0d4',
        dangerDark: '#c4b0c4',
        success: '#6a7a8a',
        panelBg: '#ffffff',
        toastBg: 'rgba(58,58,90,0.92)',
        toastText: '#ffffff'
    },
    'peach': {
        name: '蜜桃',
        accent: '#f2cec0',
        accentDark: '#e2beb0',
        bg: '#faf5f2',
        headerBg: '#fdfaf8',
        bubbleMe: '#fce4da',
        bubbleOther: '#ffffff',
        border: '#ecd8d0',
        inputBg: '#fdfaf8',
        inputBox: '#ffffff',
        text: '#5a3a3a',
        itemBg: '#fdfaf8',
        textSecondary: '#8a6a5a',
        textSystem: '#ba9a8a',
        textTime: '#ba9a8a',
        danger: '#e8b8b0',
        dangerDark: '#d8a8a0',
        success: '#7a7a5e',
        panelBg: '#ffffff',
        toastBg: 'rgba(90,58,58,0.92)',
        toastText: '#ffffff'
    },
    'sky': {
        name: '天空',
        accent: '#b8d8f0',
        accentDark: '#a8c8e0',
        bg: '#f0f5fa',
        headerBg: '#f5fafd',
        bubbleMe: '#d4eaf4',
        bubbleOther: '#ffffff',
        border: '#d0e0ec',
        inputBg: '#f5fafd',
        inputBox: '#ffffff',
        text: '#2a4a5a',
        itemBg: '#f5fafd',
        textSecondary: '#5a7a8a',
        textSystem: '#8aaaba',
        textTime: '#8aaaba',
        danger: '#b0c8d4',
        dangerDark: '#a0b8c4',
        success: '#5a7a7a',
        panelBg: '#ffffff',
        toastBg: 'rgba(42,74,90,0.92)',
        toastText: '#ffffff'
    },
    'rose': {
        name: '玫瑰',
        accent: '#f0c0c8',
        accentDark: '#e0b0b8',
        bg: '#faf2f4',
        headerBg: '#fdf7f9',
        bubbleMe: '#fce0e4',
        bubbleOther: '#ffffff',
        border: '#e8d0d8',
        inputBg: '#fdf7f9',
        inputBox: '#ffffff',
        text: '#5a3a4a',
        itemBg: '#fdf7f9',
        textSecondary: '#8a6a7a',
        textSystem: '#ba9aaa',
        textTime: '#ba9aaa',
        danger: '#e8c0c8',
        dangerDark: '#d8b0b8',
        success: '#7a6a7a',
        panelBg: '#ffffff',
        toastBg: 'rgba(90,58,74,0.92)',
        toastText: '#ffffff'
    },
    'matcha': {
        name: '抹茶',
        accent: '#c8d8b8',
        accentDark: '#b8c8a8',
        bg: '#f2f5ee',
        headerBg: '#f7faf3',
        bubbleMe: '#e0ecd4',
        bubbleOther: '#ffffff',
        border: '#d4e0c8',
        inputBg: '#f7faf3',
        inputBox: '#ffffff',
        text: '#3a4a2a',
        itemBg: '#f7faf3',
        textSecondary: '#6a7a5a',
        textSystem: '#9aaa8a',
        textTime: '#9aaa8a',
        danger: '#c8d4b8',
        dangerDark: '#b8c4a8',
        success: '#5a7a4a',
        panelBg: '#ffffff',
        toastBg: 'rgba(58,74,42,0.92)',
        toastText: '#ffffff'
    },
    'oat': {
        name: '燕麦',
        accent: '#e0d0b8',
        accentDark: '#d0c0a8',
        bg: '#faf8f2',
        headerBg: '#fdfbf7',
        bubbleMe: '#f0e8d8',
        bubbleOther: '#ffffff',
        border: '#e0d8c8',
        inputBg: '#fdfbf7',
        inputBox: '#ffffff',
        text: '#4a3a2a',
        itemBg: '#fdfbf7',
        textSecondary: '#8a7a5a',
        textSystem: '#baaa8a',
        textTime: '#baaa8a',
        danger: '#e0d0c0',
        dangerDark: '#d0c0b0',
        success: '#7a7a5a',
        panelBg: '#ffffff',
        toastBg: 'rgba(74,58,42,0.92)',
        toastText: '#ffffff'
    },
    'misty': {
        name: '雾蓝',
        accent: '#b8c8d8',
        accentDark: '#a8b8c8',
        bg: '#f2f5f8',
        headerBg: '#f7fafc',
        bubbleMe: '#d8e4ec',
        bubbleOther: '#ffffff',
        border: '#d0dce4',
        inputBg: '#f7fafc',
        inputBox: '#ffffff',
        text: '#2a3a4a',
        itemBg: '#f7fafc',
        textSecondary: '#5a6a7a',
        textSystem: '#8a9aaa',
        textTime: '#8a9aaa',
        danger: '#c0d0d8',
        dangerDark: '#b0c0c8',
        success: '#5a7a7a',
        panelBg: '#ffffff',
        toastBg: 'rgba(42,58,74,0.92)',
        toastText: '#ffffff'
    },
    'sage': {
        name: '鼠尾草',
        accent: '#b8c8b0',
        accentDark: '#a8b8a0',
        bg: '#f2f5f0',
        headerBg: '#f7faf5',
        bubbleMe: '#dce4d4',
        bubbleOther: '#ffffff',
        border: '#d4dccc',
        inputBg: '#f7faf5',
        inputBox: '#ffffff',
        text: '#3a4a3a',
        itemBg: '#f7faf5',
        textSecondary: '#6a7a5a',
        textSystem: '#9aaa8a',
        textTime: '#9aaa8a',
        danger: '#c8d4c0',
        dangerDark: '#b8c4b0',
        success: '#5a7a5a',
        panelBg: '#ffffff',
        toastBg: 'rgba(58,74,58,0.92)',
        toastText: '#ffffff'
    },
    'dusty': {
        name: 'dusty粉',
        accent: '#d8c0c0',
        accentDark: '#c8b0b0',
        bg: '#faf5f5',
        headerBg: '#fdf9f9',
        bubbleMe: '#f0e0e0',
        bubbleOther: '#ffffff',
        border: '#e8d8d8',
        inputBg: '#fdf9f9',
        inputBox: '#ffffff',
        text: '#4a3a3a',
        itemBg: '#fdf9f9',
        textSecondary: '#8a6a6a',
        textSystem: '#ba9a9a',
        textTime: '#ba9a9a',
        danger: '#e8d0d0',
        dangerDark: '#d8c0c0',
        success: '#7a6a6a',
        panelBg: '#ffffff',
        toastBg: 'rgba(74,58,58,0.92)',
        toastText: '#ffffff'
    },
    'stone': {
        name: '石灰色',
        accent: '#c8c0b8',
        accentDark: '#b8b0a8',
        bg: '#f5f5f2',
        headerBg: '#fafaf7',
        bubbleMe: '#e8e4dc',
        bubbleOther: '#ffffff',
        border: '#e0dcd4',
        inputBg: '#fafaf7',
        inputBox: '#ffffff',
        text: '#3a3a3a',
        itemBg: '#fafaf7',
        textSecondary: '#6a6a6a',
        textSystem: '#9a9a9a',
        textTime: '#9a9a9a',
        danger: '#d0d0c8',
        dangerDark: '#c0c0b8',
        success: '#6a6a5a',
        panelBg: '#ffffff',
        toastBg: 'rgba(58,58,58,0.92)',
        toastText: '#ffffff'
    },
    'black': {
        name: '全黑',
        accent: '#4a4a4a',
        accentDark: '#3a3a3a',
        bg: '#0d0d0d',
        headerBg: '#1a1a1a',
        bubbleMe: '#2a2a2a',
        bubbleOther: '#1a1a1a',
        border: '#333333',
        inputBg: '#1a1a1a',
        inputBox: '#2a2a2a',
        text: '#e8e8e8',
        itemBg: '#1a1a1a',
        textSecondary: '#aaaaaa',
        textSystem: '#777777',
        textTime: '#777777',
        danger: '#cc6666',
        dangerDark: '#aa5555',
        success: '#66aa66',
        panelBg: '#1a1a1a',
        toastBg: 'rgba(20,20,20,0.95)',
        toastText: '#e8e8e8'
    },
    'white': {
        name: '全白',
        accent: '#d4d4d4',
        accentDark: '#c8c8c8',
        bg: '#f8f8f8',
        headerBg: '#ffffff',
        bubbleMe: '#f0f0f0',
        bubbleOther: '#ffffff',
        border: '#e0e0e0',
        inputBg: '#ffffff',
        inputBox: '#f8f8f8',
        text: '#222222',
        itemBg: '#f8f8f8',
        textSecondary: '#666666',
        textSystem: '#999999',
        textTime: '#999999',
        danger: '#cc8888',
        dangerDark: '#bb7777',
        success: '#77aa77',
        panelBg: '#ffffff',
        toastBg: 'rgba(200,200,200,0.95)',
        toastText: '#222222'
    }
};

function openColorThemeModal() {
    closeModal('settingsOverlay');
    var currentTheme = localStorage.getItem('color_theme') || 'default';
    var html = '<h4>主题颜色</h4><div class="subtitle">选择你喜欢的颜色</div><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:12px 0;">';
    for (var key in colorThemes) {
        var theme = colorThemes[key];
        var isActive = (currentTheme === key);
        html += '<div onclick="applyColorTheme(\'' + key + '\')" style="background:' + theme.accent + ';padding:12px;border-radius:12px;text-align:center;cursor:pointer;border:2px solid ' + (isActive ? '#fff' : 'transparent') + ';box-shadow:0 1px 3px rgba(0,0,0,0.1);"><span style="color:var(--text);font-size:14px;">' + theme.name + '</span></div>';
    }
    html += '</div><button class="btn-close" onclick="closeModal(\'subOverlay\')">关闭</button>';
    openSubModal(html);
}

function applyColorTheme(themeKey) {
    var theme = colorThemes[themeKey];
    if (!theme) return;
    localStorage.setItem('color_theme', themeKey);
    document.documentElement.style.setProperty('--accent', theme.accent);
    document.documentElement.style.setProperty('--accent-dark', theme.accentDark);
    document.documentElement.style.setProperty('--bg', theme.bg);
    document.documentElement.style.setProperty('--header-bg', theme.headerBg);
    document.documentElement.style.setProperty('--chat-bg', theme.bg);
    document.documentElement.style.setProperty('--bubble-me', theme.bubbleMe);
    document.documentElement.style.setProperty('--bubble-other', theme.bubbleOther);
    document.documentElement.style.setProperty('--input-bg', theme.inputBg || theme.headerBg);
    document.documentElement.style.setProperty('--input-box', theme.inputBox || '#ffffff');
    document.documentElement.style.setProperty('--text', theme.text || '#4a3728');
    document.documentElement.style.setProperty('--border', theme.border || '#e8d5c4');
    document.documentElement.style.setProperty('--item-bg', theme.itemBg || '#faf7f4');
    document.documentElement.style.setProperty('--text-secondary', theme.textSecondary || '#8b7355');
    document.documentElement.style.setProperty('--text-system', theme.textSystem || '#b8a99a');
    document.documentElement.style.setProperty('--text-time', theme.textTime || '#b8a99a');
    document.documentElement.style.setProperty('--panel-bg', theme.panelBg || '#ffffff');
    document.documentElement.style.setProperty('--danger', theme.danger || '#e8a0a0');
    document.documentElement.style.setProperty('--danger-dark', theme.dangerDark || '#d48888');
    document.documentElement.style.setProperty('--success', theme.success || '#6b8f5e');
    document.documentElement.style.setProperty('--toast-bg', theme.toastBg || 'rgba(74,55,40,0.92)');
    document.documentElement.style.setProperty('--toast-text', theme.toastText || '#ffffff');
    showToast('已切换至 ' + theme.name + ' 主题');
    closeModal('subOverlay');
}

function loadColorTheme() {
    var savedTheme = localStorage.getItem('color_theme');
    if (savedTheme && colorThemes[savedTheme]) { applyColorTheme(savedTheme); }
}

// ========== 回复开关 ==========
var replyEnabled = true;
var activeMsgEnabled = true;
var activeMsgInterval = null;

function loadReplySettings() {
    var saved1 = localStorage.getItem('reply_enabled');
    replyEnabled = saved1 !== null ? saved1 === 'true' : true;
    var saved2 = localStorage.getItem('active_msg_enabled');
    activeMsgEnabled = saved2 !== null ? saved2 === 'true' : true;
}

function saveReplySettings() {
    localStorage.setItem('reply_enabled', replyEnabled);
    localStorage.setItem('active_msg_enabled', activeMsgEnabled);
}

function openReplySwitchModal() {
    closeModal('settingsOverlay');
    var replyChecked = replyEnabled ? 'checked' : '';
    var activeChecked = activeMsgEnabled ? 'checked' : '';
    var html = '<div style="text-align:center;"><h4>回复开关</h4><div class="subtitle">控制对方的回复行为</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;background:var(--item-bg);padding:12px 16px;border-radius:12px;margin:12px 0;"><span>自动回复</span><label style="position:relative;display:inline-block;width:50px;height:26px;"><input type="checkbox" id="replySwitch" ' + replyChecked + ' onchange="toggleReply(this.checked)" style="opacity:0;width:0;height:0;"><span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background-color:#ccc;transition:0.3s;border-radius:26px;"></span><span style="position:absolute;height:22px;width:22px;left:2px;bottom:2px;background-color:white;transition:0.3s;border-radius:50%;"></span></label></div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;background:var(--item-bg);padding:12px 16px;border-radius:12px;margin:12px 0;"><span>主动发消息</span><label style="position:relative;display:inline-block;width:50px;height:26px;"><input type="checkbox" id="activeMsgSwitch" ' + activeChecked + ' onchange="toggleActiveMsg(this.checked)" style="opacity:0;width:0;height:0;"><span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background-color:#ccc;transition:0.3s;border-radius:26px;"></span><span style="position:absolute;height:22px;width:22px;left:2px;bottom:2px;background-color:white;transition:0.3s;border-radius:50%;"></span></label></div>' +
        '<button class="btn-close" onclick="closeModal(\'subOverlay\')">关闭</button></div>';
    openSubModal(html);
    setTimeout(function() {
        if (replyEnabled) {
            var spans = document.querySelectorAll('#subModal label span');
            if (spans[0]) spans[0].style.backgroundColor = 'var(--accent)';
            if (spans[1]) spans[1].style.transform = 'translateX(24px)';
        }
        if (activeMsgEnabled) {
            var spans = document.querySelectorAll('#subModal label span');
            if (spans[2]) spans[2].style.backgroundColor = 'var(--accent)';
            if (spans[3]) spans[3].style.transform = 'translateX(24px)';
        }
    }, 50);
}

function toggleReply(enabled) {
    replyEnabled = enabled;
    localStorage.setItem('reply_enabled', replyEnabled);
    var spans = document.querySelectorAll('#subModal label span');
    if (spans[0]) spans[0].style.backgroundColor = enabled ? 'var(--accent)' : '#ccc';
    if (spans[1]) spans[1].style.transform = enabled ? 'translateX(24px)' : 'translateX(0)';
    showToast(enabled ? '已开启自动回复' : '已关闭自动回复');
}

function toggleActiveMsg(enabled) {
    activeMsgEnabled = enabled;
    localStorage.setItem('active_msg_enabled', activeMsgEnabled);
    var spans = document.querySelectorAll('#subModal label span');
    if (spans[2]) spans[2].style.backgroundColor = enabled ? 'var(--accent)' : '#ccc';
    if (spans[3]) spans[3].style.transform = enabled ? 'translateX(24px)' : 'translateX(0)';
    showToast(enabled ? '已开启主动发消息' : '已关闭主动发消息');
}

function startActiveMsgTimer() {
    if (activeMsgInterval) clearInterval(activeMsgInterval);
    var interval = 120000 + Math.random() * 180000;
    activeMsgInterval = setInterval(function() {
        if (!activeMsgEnabled) return;
        if (typeof otherSendMessage === 'function') {
            otherSendMessage();
        }
    }, interval);
}

// ========== 初始化 ==========
function initApp() {
    return loadData().then(function() {
        applyTheme();
        updateHeader();
        checkPendingLetters();
        return renderChatHistory();
    }).then(function() {
        if (typeof updateStatus === 'function') updateStatus();
        if (typeof updateStatus === 'function') setInterval(updateStatus, 60 * 60 * 1000);
        updateLetterBadge();
        renderMoreImages();
        closeModal('settingsOverlay'); closeModal('subOverlay');
        closeModal('photoOverlay'); closeModal('letterOverlay');
        document.getElementById('morePanel').style.display = 'none';
        loadColorTheme();
        loadReplySettings();
        startActiveMsgTimer();
        return autoCleanOrphanImages();
    }).then(function(cleaned) {
        if (cleaned > 0) console.log('自动清理了 ' + cleaned + ' 个孤儿图片');
        return getStorageStats();
    }).then(function(stats) {
        if (stats.usagePercent > 85) { showToast('存储已使用 ' + stats.usagePercent + '%\n建议在数据管理中清理'); }
        var lastBackupReminder = localStorage.getItem('chat_app_backup_reminder');
        var now = Date.now();
        if (!lastBackupReminder || now - parseInt(lastBackupReminder) > 7 * 24 * 60 * 60 * 1000) {
            setTimeout(function() { showToastLong('备份提醒：建议去设置 → 数据管理\n点击「全量备份下载」保存数据', 5000); }, 3000);
            localStorage.setItem('chat_app_backup_reminder', now.toString());
        }
    }).catch(function(e) { console.error('启动失败:', e); });
}

function updateHeader() {
    document.getElementById('headerTitle').textContent = appData.otherName;
    document.title = appData.otherName;
    if (typeof renderStatus === 'function') renderStatus();
}

// ========== 主题模式 ==========
function applyTheme() {
    if (appData.theme === 'dark') document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
}

function setThemeLight() { 
    appData.theme = 'light'; 
    applyTheme(); 
    saveData(); 
    closeModal('subOverlay'); 
    showToast('已切换为浅色模式'); 
}

function setThemeDark() { 
    appData.theme = 'dark'; 
    applyTheme(); 
    saveData(); 
    closeModal('subOverlay'); 
    showToast('已切换为深色模式'); 
}

function openThemeModal() {
    closeModal('settingsOverlay');
    var html = '<h4>主题模式</h4><div class="subtitle">切换浅色/深色模式</div><div style="display:flex;gap:10px;justify-content:center;margin-top:12px;">' +
        '<button class="btn-sm ' + (appData.theme === 'light' ? '' : 'outline') + '" onclick="setThemeLight()">浅色</button>' +
        '<button class="btn-sm ' + (appData.theme === 'dark' ? '' : 'outline') + '" onclick="setThemeDark()">深色</button>' +
        '</div><button class="btn-close" onclick="closeModal(\'subOverlay\')" style="margin-top:14px;">关闭</button>';
    openSubModal(html);
}

// ========== 信件 ==========
function updateLetterBadge() {
    var badge = document.getElementById('letterBadge'), pending = 0;
    (appData.letters || []).forEach(function(l) {
        if (l.replied && !l.replyShown) pending++;
        if (!l.replied && l.expectedReplyTime <= Date.now()) pending++;
    });
    if (badge) { badge.style.display = pending > 0 ? 'inline-block' : 'none'; badge.textContent = pending + ' 封回信'; }
}

function checkPendingLetters() {
    var hasNew = false;
    (appData.letters || []).forEach(function(l) {
        if (!l.replied && l.expectedReplyTime <= Date.now()) {
            l.replyContent = generateLetterReply();
            l.replied = true; l.replyShown = false; hasNew = true;
        }
    });
    if (hasNew) { saveData(); updateLetterBadge(); }
}

function checkAndShowLetterReply() {
    var shown = false;
    (appData.letters || []).forEach(function(l) {
        if (l.replied && !l.replyShown) {
            var msg = '回信（' + formatTime(l.expectedReplyTime) + '收到）：\n\n' + l.replyContent;
            addMessage(msg, 'other');
            appData.chatHistory.push({ type: 'other', content: msg, time: Date.now() });
            l.replyShown = true; shown = true;
        }
    });
    if (shown) { saveData(); updateLetterBadge(); showToast('回信已送达聊天中~'); }
    else showToast('暂无新回信');
}

function generateLetterReply() {
    var all = getAllReplies();
    if (all.length === 0) return '（暂无可用的回复内容）';
    var count = Math.min(Math.floor(Math.random() * 6) + 3, all.length);
    var arr = all.slice();
    for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    return '亲爱的' + appData.myName + '：\n\n' + arr.slice(0, count).join('\n\n') + '\n\n-- ' + appData.otherName;
}

function sendLetter() {
    var content = document.getElementById('letterContent').value.trim();
    if (!content) return showToast('请写下信件内容');
    var delay = 12*60*60*1000 + Math.random() * 24*60*60*1000;
    var expectedTime = Date.now() + delay;
    appData.letters.push({ id: Date.now().toString(36) + Math.random().toString(36).substr(2,6), sentContent: content, sentTime: Date.now(), expectedReplyTime: expectedTime, replyContent: '', replied: false, replyShown: false });
    saveData(); closeModal('letterOverlay');
    showToastLong('信件已寄出！\n预计 ' + formatTime(expectedTime) + ' 左右收到回信', 5000);
    updateLetterBadge();
    addSystemMsg('你给 ' + appData.otherName + ' 寄出了一封信，预计 ' + formatTime(expectedTime) + ' 收到回信');
}

function openLetterModal() {
    var overlay = document.createElement('div');
    overlay.className = 'fullscreen-overlay active';
    overlay.id = 'letterFullscreen';
    overlay.innerHTML = `
        <div class="fullscreen-header">
            <button class="fullscreen-back" onclick="closeLetterFullscreen()">
                <span class="back-arrow"></span> 返回
            </button>
            <span class="fullscreen-title">写一封信</span>
            <span style="width:50px;"></span>
        </div>
        <div class="fullscreen-body" style="display:flex;flex-direction:column;gap:12px;padding:20px;">
            <div style="font-size:14px;color:var(--text-secondary);">写给 <span id="letterRecipient" style="font-weight:bold;color:var(--text);">${appData.otherName}</span></div>
            <textarea id="letterContent" placeholder="写下你想说的话...&#10;信件不会直接发送到聊天，对方会在半天到一天半内回信哦~" style="flex:1;min-height:200px;padding:14px;border:2px solid var(--border);border-radius:var(--radius-sm);font-family:var(--font-main);font-size:14px;background:var(--input-box);color:var(--text);resize:none;outline:none;"></textarea>
            <button class="btn-sm" onclick="sendLetterFullscreen()" style="padding:12px;font-size:15px;">寄出信件</button>
        </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('letterRecipient').textContent = appData.otherName;
}

function closeLetterFullscreen() {
    var el = document.getElementById('letterFullscreen');
    if (el) el.remove();
}

function sendLetterFullscreen() {
    var content = document.getElementById('letterContent').value.trim();
    if (!content) return showToast('请写下信件内容');
    var delay = 12*60*60*1000 + Math.random() * 24*60*60*1000;
    var expectedTime = Date.now() + delay;
    appData.letters.push({ 
        id: Date.now().toString(36) + Math.random().toString(36).substr(2,6), 
        sentContent: content, 
        sentTime: Date.now(), 
        expectedReplyTime: expectedTime, 
        replyContent: '', 
        replied: false, 
        replyShown: false 
    });
    saveData();
    closeLetterFullscreen();
    showToastLong('信件已寄出！\n预计 ' + formatTime(expectedTime) + ' 左右收到回信', 5000);
    updateLetterBadge();
    addSystemMsg('你给 ' + appData.otherName + ' 寄出了一封信，预计 ' + formatTime(expectedTime) + ' 收到回信');
}

function openLetterManageModal() {
    closeModal('settingsOverlay');
    var lettersHtml = '';
    if (!appData.letters.length) { lettersHtml = '<div style="text-align:center;color:var(--text-system);padding:20px;">还没有往来信件</div>'; }
    else {
        for (var i = appData.letters.length - 1; i >= 0; i--) {
            var l = appData.letters[i];
            var statusBadge = l.replied ? (l.replyShown ? '已送达' : '回信待取') : (l.expectedReplyTime > Date.now() ? '等待回信' : '回信已到');
            var safeId = l.id.replace(/'/g, "\\'");
            lettersHtml += '<div class="list-item" style="flex-direction:column;"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;"><span style="word-break:break-all;">寄出：' + formatTime(l.sentTime) + '</span><span style="font-size:10px;white-space:nowrap;">' + statusBadge + '</span></div><div class="letter-preview" style="max-height:60px;">' + escapeHTML(l.sentContent).substring(0, 80) + '...</div><div style="display:flex;gap:4px;margin-top:4px;"><button class="del-sm" onclick="viewLetterDetail(\'' + safeId + '\')">详情</button></div></div>';
        }
    }
    var html = '<h4>往来信件</h4><div class="subtitle">共 ' + appData.letters.length + ' 封</div><div style="max-height:350px;overflow-y:auto;">' + lettersHtml + '</div><div class="btn-row"><button class="btn-sm outline" onclick="checkAndShowLetterReply()">收取回信</button></div><button class="btn-close" onclick="closeModal(\'subOverlay\')">关闭</button>';
    openSubModal(html);
}

function viewLetterDetail(id) {
    var letter = appData.letters.find(function(l) { return l.id === id; });
    if (!letter) return;
    var html = '<h4>信件详情</h4><p><b>寄出：</b>' + formatTime(letter.sentTime) + '</p><p><b>预计回信：</b>' + formatTime(letter.expectedReplyTime) + '</p><div class="letter-preview">' + escapeHTML(letter.sentContent) + '</div>';
    if (letter.replied) html += '<h4>回信内容</h4><div class="letter-preview">' + escapeHTML(letter.replyContent) + '</div>';
    else html += '<p style="color:var(--text-system);">回信还在路上...</p>';
    html += '<button class="btn-close" onclick="closeModal(\'subOverlay\')">关闭</button>';
    openSubModal(html);
}

// ========== 头像 ==========
function getAvatarHTMLSync(isMe) {
    if (isMe) {
        if (appData.myAvatar) return '<img class="avatar" src="' + appData.myAvatar + '" onerror="this.style.display=\'none\';">';
        return '<div class="avatar-placeholder">' + (appData.myName ? appData.myName.charAt(0) : '我') + '</div>';
    }
    if (appData.otherAvatar) return '<img class="avatar" src="' + appData.otherAvatar + '" onerror="this.style.display=\'none\';">';
    return '<div class="avatar-placeholder">' + (appData.otherName ? appData.otherName.charAt(0) : 'TA') + '</div>';
}

function showAvatarChanger(target) {
    var title = target === 'me' ? '更换我的头像' : '更换对方头像';
    var html = '<h4>' + title + '</h4><div class="subtitle">选择一种方式</div><div class="photo-menu-btns"><button onclick="startAvatarCapture(\'' + target + '\', true)">拍照</button><button onclick="startAvatarCapture(\'' + target + '\', false)">从相册选择</button></div><button class="btn-close" onclick="closeModal(\'subOverlay\')">取消</button>';
    openSubModal(html);
}

function startAvatarCapture(target, useCamera) {
    closeModal('subOverlay');
    var input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    if (useCamera) input.setAttribute('capture', 'environment');
    input.onchange = function() {
        var file = input.files[0]; if (!file) return;
        compressImage(file, 300, 300, 0.5).then(function(dataUrl) {
            var id = 'avatar_' + target + '_' + Date.now();
            return saveImageToDB('avatars', id, dataUrl).then(function() {
                if (target === 'me') {
                    if (appData.myAvatarId) deleteImageFromDB('avatars', appData.myAvatarId).catch(function(){});
                    appData.myAvatarId = id; appData.myAvatar = dataUrl;
                } else {
                    if (appData.otherAvatarId) deleteImageFromDB('avatars', appData.otherAvatarId).catch(function(){});
                    appData.otherAvatarId = id; appData.otherAvatar = dataUrl;
                }
                return saveData();
            });
        }).then(function() { return renderChatHistory(); }).then(function() { showToast((target === 'me' ? '我的' : '对方') + '头像已更新'); }).catch(function() { showToast('头像保存失败'); });
    };
    input.click();
}

function onOtherAvatarClick() { showAvatarChanger('other'); }
function onMyAvatarClick() { showAvatarChanger('me'); }

function openNicknameModal() {
    var html = '<h4>昵称 头像</h4><div class="subtitle">修改后会自动保存</div><div class="form-row"><label>我的昵称</label><input type="text" id="editMyName" value="' + appData.myName.replace(/"/g,'&quot;') + '"></div><div class="btn-row"><button class="btn-sm" onclick="saveMyNameFromModal()">保存昵称</button><button class="btn-sm outline" onclick="showAvatarChanger(\'me\')">换我的头像</button></div><div class="form-row" style="margin-top:12px;"><label>对方昵称</label><input type="text" id="editOtherName" value="' + appData.otherName.replace(/"/g,'&quot;') + '"></div><div class="btn-row"><button class="btn-sm" onclick="saveOtherNameFromModal()">保存昵称</button><button class="btn-sm outline" onclick="showAvatarChanger(\'other\')">换对方头像</button></div><div class="btn-row" style="justify-content:center;margin-top:12px;"><button class="btn-sm outline" onclick="closeNicknameModal()">返回设置</button></div>';
    openSubModal(html);
}

function closeNicknameModal() {
    closeModal('subOverlay');
    setTimeout(function() {
        openSettings();
    }, 150);
}

function saveMyNameFromModal() {
    var v = document.getElementById('editMyName').value.trim();
    if (!v) return showToast('请输入昵称');
    appData.myName = v; saveData(); renderChatHistory(); showToast('昵称已更新');
    openNicknameModal();
}

function saveOtherNameFromModal() {
    var v = document.getElementById('editOtherName').value.trim();
    if (!v) return showToast('请输入昵称');
    appData.otherName = v; saveData(); updateHeader(); renderChatHistory(); showToast('昵称已更新');
    openNicknameModal();
}

// ========== 照片 ==========
function openPhotoMenu() { openModal('photoOverlay'); }
function takePhoto() { closeModal('photoOverlay'); pickFile(true); }
function pickLocalPhoto() { closeModal('photoOverlay'); pickFile(false); }
function pickFile(useCamera) {
    var input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    if (useCamera) input.setAttribute('capture', 'environment');
    input.onchange = function() { handlePhotoFile(input.files[0]); };
    input.click();
}

function handlePhotoFile(file) {
    if (!file) return;
    compressImage(file, 800, 800, 0.6).then(function(url) {
        var imageId = 'msgimg_' + Date.now() + '_' + Math.random().toString(36).substr(2,6);
        return saveImageToDB('images', imageId, url).then(function() {
            addMessage(url, 'me', true);
            appData.chatHistory.push({ type: 'me', content: '', imageId: imageId, time: Date.now() });
            return saveData();
        }).then(function() {
            setTimeout(function() { triggerAutoReply(); }, 400 + Math.random() * 800);
            checkStorageAfterUpload();
        });
    }).catch(function() { showToast('图片处理失败，请重试'); });
}

function checkStorageAfterUpload() {
    getStorageStats().then(function(stats) {
        if (stats.usagePercent > 85) { showToastLong('存储已使用 ' + stats.usagePercent + '%\n建议到数据管理清理聊天记录', 5000); }
    });
}

// ========== 聊天 ==========
function triggerAutoReply() {
    if (!replyEnabled) return;
    var replyCount = Math.floor(Math.random() * 3) + 1;
    function sendNext(index) {
        if (index >= replyCount) return;
        setTimeout(function() {
            if (Math.random() < 0.1 && appData.transferAmounts.length > 0 && appData.transferNotes.length > 0) {
                if (typeof addTransferCard === 'function') {
                    var amt = appData.transferAmounts[Math.floor(Math.random() * appData.transferAmounts.length)];
                    var note = appData.transferNotes[Math.floor(Math.random() * appData.transferNotes.length)];
                    addTransferCard(amt, note, 'other');
                    appData.chatHistory.push({ type: 'transfer_other', amount: amt, note: note, time: Date.now() });
                    saveData();
                    sendNext(index + 1);
                    return;
                }
            }
            if (typeof sendRandomReply === 'function') {
                sendRandomReply().then(function(sent) {
                    if (sent === false && index === 0) {
                        addMessage('（还没有设置回复词库哦，去设置里添加一些吧~）', 'other');
                        appData.chatHistory.push({ type: 'other', content: '（还没有设置回复词库哦，去设置里添加一些吧~）', time: Date.now() });
                        saveData();
                    }
                    if (sent !== false) sendNext(index + 1);
                });
            } else { sendNext(index + 1); }
        }, 500 + Math.random() * 800);
    }
    sendNext(0);
}

function sendRandomReply() {
    var allReplies = getAllReplies();
    var hasEmoji = appData.emojiIds.length > 0;
    var hasText = allReplies.length > 0;
    var replyType = Math.floor(Math.random() * 3);
    if (!hasText && replyType === 0) replyType = 1;
    if (!hasEmoji && replyType === 1) replyType = 0;
    if (!hasText && !hasEmoji) return Promise.resolve(false);
    if (replyType === 2) {
        if (typeof RandomDrawing !== 'undefined' && RandomDrawing.getRandomDrawing) {
            var imgData = RandomDrawing.getRandomDrawing();
            var img = new Image();
            img.onload = function() {
                var imgHtml = '<img src="' + imgData + '" style="max-width:200px; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,0.1);">';
                addMessage(imgHtml, 'other', true, false);
                appData.chatHistory.push({ type: 'other', content: imgHtml, time: Date.now(), isDrawing: true });
                saveData();
            };
            img.src = imgData;
            return Promise.resolve(true);
        }
        replyType = 0;
    }
    if (replyType === 0 && hasText) {
        var cardCount = Math.floor(Math.random() * 10) + 1;
        var selectedReplies = [];
        var tempReplies = allReplies.slice();
        for (var i = 0; i < cardCount && tempReplies.length > 0; i++) {
            var randomIndex = Math.floor(Math.random() * tempReplies.length);
            selectedReplies.push(tempReplies[randomIndex]);
        }
        var content = selectedReplies.join(' ');
        var shouldQuote = Math.random() < 0.3;
        var quoteMsg = null;
        if (shouldQuote) { quoteMsg = getRandomHistoryMessage(); }
        if (quoteMsg) {
            addMessageWithQuote(content, 'other', quoteMsg);
            appData.chatHistory.push({ type: 'other', content: content, time: Date.now(), quote: quoteMsg });
        } else {
            addMessage(content, 'other', false);
            appData.chatHistory.push({ type: 'other', content: content, time: Date.now() });
        }
        return saveData().then(function() { return true; });
    }
    if (replyType === 1 && hasEmoji) {
        var eid = appData.emojiIds[Math.floor(Math.random() * appData.emojiIds.length)];
        return getImageFromDB('images', eid).then(function(img) {
            if (!img) return false;
            addMessage(img, 'other', true, true);
            appData.chatHistory.push({ type: 'other', content: '', imageId: eid, time: Date.now(), isSticker: true });
            return saveData().then(function() { return true; });
        });
    }
    return Promise.resolve(false);
}

function getRandomHistoryMessage() {
    var history = appData.chatHistory || [];
    var textMessages = history.filter(function(msg) {
        return (msg.type === 'me' || msg.type === 'other') && msg.content && typeof msg.content === 'string' && msg.content.length > 0 && msg.content.indexOf('<img') === -1;
    });
    if (textMessages.length === 0) return null;
    var randomIndex = Math.floor(Math.random() * textMessages.length);
    var msg = textMessages[randomIndex];
    return { content: msg.content, type: msg.type, time: msg.time, isImage: false };
}

function sendMsg() {
    var input = document.getElementById('msgInput'); 
    var msg = input.value.trim();
    if (!msg) return;
    var quote = quotedMessage;
    if (quote) {
        addMessageWithQuote(msg, 'me', quote);
        appData.chatHistory.push({ type: 'me', content: msg, time: Date.now(), quote: quote });
    } else {
        addMessage(msg, 'me');
        appData.chatHistory.push({ type: 'me', content: msg, time: Date.now() });
    }
    quotedMessage = null;
    updateQuoteBar();
    input.value = ''; 
    saveData();
    if (msg.includes('转转盘') || msg.includes('转盘邀请') || msg.includes('🎡')) {
        if (typeof sendWheelInvite === 'function') sendWheelInvite();
        return;
    }
    setTimeout(function() { if (typeof triggerAutoReply === 'function') triggerAutoReply(); }, 400 + Math.random() * 1000);
}

function addMessage(content, type, isImage, isSticker) {
    var chat = document.getElementById('chat'); var div = document.createElement('div');
    div.className = 'msg ' + type + (isSticker ? ' is-sticker' : '');
    var handler = type === 'other' ? 'onclick="onOtherAvatarClick()"' : 'onclick="onMyAvatarClick()"';
    var av = getAvatarHTMLSync(type === 'me');
    if (isSticker) {
        div.innerHTML = '<div class="bubble"><img class="msg-image" src="' + content + '"></div>';
    } else {
        div.innerHTML = '<div class="avatar-wrap" ' + handler + '>' + av + '</div><div class="bubble">' + (isImage ? '<img class="msg-image" src="' + content + '">' : content) + '<span class="msg-time">' + formatTimeShort(Date.now()) + '</span></div>';
    }
    bindQuoteEvent(div, { content: content, type: type, time: Date.now(), isImage: isImage });
    chat.appendChild(div); chat.scrollTop = chat.scrollHeight;
    if (type === 'other' && document.hidden && typeof sendNotification === 'function') {
        var msgText = isImage ? '[图片消息]' : (content.length > 50 ? content.substring(0, 50) + '...' : content);
        sendNotification(appData.otherName, msgText, window.location.href);
    }
}

function addMessageWithQuote(content, type, quote) {
    var chat = document.getElementById('chat'); var div = document.createElement('div');
    div.className = 'msg ' + type;
    var handler = type === 'other' ? 'onclick="onOtherAvatarClick()"' : 'onclick="onMyAvatarClick()"';
    var av = getAvatarHTMLSync(type === 'me');
    var quotePreview = (quote.content || '').substring(0, 50);
    if (quote.isImage) quotePreview = '[图片]';
    div.innerHTML = '<div class="avatar-wrap" ' + handler + '>' + av + '</div><div class="bubble">' +
        '<div class="quote-ref" style="background:var(--item-bg);border-left:3px solid var(--accent);padding:6px 10px;margin-bottom:6px;border-radius:4px;font-size:11px;color:var(--text-secondary);">' +
        escapeHTML((quote.type === 'me' ? appData.myName : appData.otherName) + '：' + quotePreview) +
        '</div>' + content +
        '<span class="msg-time">' + formatTimeShort(Date.now()) + '</span></div>';
    if (typeof bindQuoteEvent === 'function') bindQuoteEvent(div, { content: content, type: type, time: Date.now() });
    chat.appendChild(div); chat.scrollTop = chat.scrollHeight;
}

function addMessageWithRole(content, role, roleClass) {
    var chat = document.getElementById('chat'); var div = document.createElement('div');
    div.className = 'msg other';
    var av = '<div class="avatar-placeholder" style="background:var(--' + (roleClass || 'role-a') + ');color:var(--text);">' + (role ? role.charAt(0) : '?') + '</div>';
    div.innerHTML = '<div class="avatar-wrap">' + av + '</div><div class="bubble"><span class="role-tag ' + (roleClass || 'role-a') + '">' + role + '</span><br>' + content + '<span class="msg-time">' + formatTimeShort(Date.now()) + '</span></div>';
    if (typeof bindQuoteEvent === 'function') bindQuoteEvent(div, { content: '[' + role + '] ' + content, type: 'other', time: Date.now() });
    chat.appendChild(div); chat.scrollTop = chat.scrollHeight;
    appData.chatHistory.push({ type: 'other', content: '[' + role + '] ' + content, time: Date.now() });
    saveData();
}

function addSystemMsg(text) {
    var chat = document.getElementById('chat'); var div = document.createElement('div');
    div.className = 'system-msg'; div.textContent = text;
    chat.appendChild(div); chat.scrollTop = chat.scrollHeight;
    appData.chatHistory.push({ type: 'system', content: text, time: Date.now() });
    saveData();
}

// ========== 引用功能 ==========
function bindQuoteEvent(div, msgData) {
    var bubble = div.querySelector('.bubble');
    if (!bubble) return;
    bubble.addEventListener('click', function(e) {
        e.stopPropagation();
        quotedMessage = msgData;
        updateQuoteBar();
        showToast('已引用消息');
    });
    bubble.style.cursor = 'pointer';
    bubble.title = '点击引用此消息';
}

function updateQuoteBar() {
    var existingBar = document.getElementById('quoteBar');
    if (existingBar) existingBar.remove();
    if (!quotedMessage) return;
    var inputArea = document.getElementById('inputArea');
    if (!inputArea) return;
    var bar = document.createElement('div');
    bar.id = 'quoteBar';
    bar.style.cssText = 'padding:6px 14px;background:var(--item-bg);border-top:1px solid var(--border);display:flex;align-items:center;gap:8px;font-size:11px;color:var(--text-secondary);flex-shrink:0;';
    var preview = (quotedMessage.content || '').substring(0, 30);
    if (quotedMessage.isImage) preview = '[图片]';
    bar.innerHTML = '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">引用：' + escapeHTML(preview) + '</span><span onclick="cancelQuote()" style="cursor:pointer;color:var(--danger);font-size:16px;padding:0 4px;">x</span>';
    inputArea.insertBefore(bar, inputArea.firstChild);
}

function cancelQuote() {
    quotedMessage = null;
    updateQuoteBar();
}

function renderChatHistory() {
    var chat = document.getElementById('chat'); chat.innerHTML = '';
    if (!appData.chatHistory || appData.chatHistory.length === 0) {
        chat.innerHTML = '<div class="system-msg">和' + appData.otherName + '开始聊天吧~</div>';
        return Promise.resolve();
    }
    var promises = appData.chatHistory.map(function(m) {
        return new Promise(function(resolve) {
            if (m.type === 'transfer_me' || m.type === 'transfer_other') {
                var d = document.createElement('div');
                d.className = 'msg ' + (m.type === 'transfer_me' ? 'me' : 'other');
                var av = getAvatarHTMLSync(m.type === 'transfer_me');
                var handler = m.type === 'transfer_other' ? 'onclick="onOtherAvatarClick()"' : 'onclick="onMyAvatarClick()"';
                var cardHTML = '<div class="transfer-card ' + (m.type === 'transfer_me' ? 'transfer-me' : 'transfer-other') + '">';
                cardHTML += '<div class="transfer-label">' + (m.type === 'transfer_me' ? '向 ' + appData.otherName + ' 转账' : appData.otherName + ' 向你转账') + '</div>';
                cardHTML += '<div class="transfer-amount">¥ ' + m.amount + '</div>';
                if (m.note) cardHTML += '<div class="transfer-note">' + escapeHTML(m.note) + '</div>';
                cardHTML += '<div class="transfer-status">' + (m.type === 'transfer_me' ? '已转账' : '已收款') + '</div></div>';
                d.innerHTML = '<div class="avatar-wrap" ' + handler + '>' + av + '</div><div class="bubble">' + cardHTML + '<span class="msg-time">' + formatTimeShort(m.time) + '</span></div>';
                chat.appendChild(d); resolve();
            } else if (m.type === 'system') {
                var d = document.createElement('div'); d.className = 'system-msg'; d.textContent = m.content; chat.appendChild(d); resolve();
            } else if (m.imageId) {
                var d = document.createElement('div'); d.className = 'msg ' + m.type;
                var handler = m.type === 'other' ? 'onclick="onOtherAvatarClick()"' : 'onclick="onMyAvatarClick()"';
                var av = getAvatarHTMLSync(m.type === 'me');
                d.innerHTML = '<div class="avatar-wrap" ' + handler + '>' + av + '</div><div class="bubble">加载中...<span class="msg-time">' + formatTimeShort(m.time) + '</span></div>';
                if (m.quote) {
                    var bubble = d.querySelector('.bubble');
                    var qp = (m.quote.content || '').substring(0, 50);
                    if (m.quote.isImage) qp = '[图片]';
                    bubble.innerHTML = '<div class="quote-ref" style="background:var(--item-bg);border-left:3px solid var(--accent);padding:6px 10px;margin-bottom:6px;border-radius:4px;font-size:11px;color:var(--text-secondary);">' + escapeHTML((m.quote.type === 'me' ? appData.myName : appData.otherName) + '：' + qp) + '</div>加载中...<span class="msg-time">' + formatTimeShort(m.time) + '</span>';
                }
                if (typeof bindQuoteEvent === 'function') bindQuoteEvent(d, { content: m.content, type: m.type, time: m.time });
                chat.appendChild(d);
                getImageFromDB('images', m.imageId).then(function(img) {
                    var bubbleEl = d.querySelector('.bubble');
                    var timeStr = '<span class="msg-time">' + formatTimeShort(m.time) + '</span>';
                    if (m.isSticker) {
                        d.className = 'msg ' + m.type + ' is-sticker';
                        bubbleEl.innerHTML = (m.quote ? '<div class="quote-ref" style="background:var(--item-bg);border-left:3px solid var(--accent);padding:6px 10px;margin-bottom:6px;border-radius:4px;font-size:11px;color:var(--text-secondary);">' + escapeHTML((m.quote.type === 'me' ? appData.myName : appData.otherName) + '：' + (m.quote.isImage ? '[图片]' : (m.quote.content || '').substring(0, 50))) + '</div>' : '') + (img ? '<img class="msg-image" src="' + img + '" onerror="this.parentElement.textContent=\'[已失效]\';">' : '[已过期]');
                    } else {
                        bubbleEl.innerHTML = (m.quote ? '<div class="quote-ref" style="background:var(--item-bg);border-left:3px solid var(--accent);padding:6px 10px;margin-bottom:6px;border-radius:4px;font-size:11px;color:var(--text-secondary);">' + escapeHTML((m.quote.type === 'me' ? appData.myName : appData.otherName) + '：' + (m.quote.isImage ? '[图片]' : (m.quote.content || '').substring(0, 50))) + '</div>' : '') + (img ? '<img class="msg-image" src="' + img + '" onerror="this.parentElement.textContent=\'[图片已失效]\';">' : '[图片已过期]') + timeStr;
                    }
                    resolve();
                }).catch(function() { resolve(); });
            } else {
                var d = document.createElement('div'); d.className = 'msg ' + m.type;
                var handler = m.type === 'other' ? 'onclick="onOtherAvatarClick()"' : 'onclick="onMyAvatarClick()"';
                var av = getAvatarHTMLSync(m.type === 'me');
                var isImg = m.content && m.content.indexOf('data:image/') === 0;
                var qHtml = '';
                if (m.quote) {
                    var qp = (m.quote.content || '').substring(0, 50);
                    if (m.quote.isImage) qp = '[图片]';
                    qHtml = '<div class="quote-ref" style="background:var(--item-bg);border-left:3px solid var(--accent);padding:6px 10px;margin-bottom:6px;border-radius:4px;font-size:11px;color:var(--text-secondary);">' + escapeHTML((m.quote.type === 'me' ? appData.myName : appData.otherName) + '：' + qp) + '</div>';
                }
                d.innerHTML = '<div class="avatar-wrap" ' + handler + '>' + av + '</div><div class="bubble">' + qHtml + (isImg ? '<img class="msg-image" src="' + m.content + '">' : m.content) + '<span class="msg-time">' + formatTimeShort(m.time) + '</span></div>';
                if (typeof bindQuoteEvent === 'function') bindQuoteEvent(d, { content: m.content, type: m.type, time: m.time, isImage: isImg });
                chat.appendChild(d); resolve();
            }
        });
    });
    return Promise.all(promises).then(function() { chat.scrollTop = chat.scrollHeight; });
}

// ========== 更多面板 ==========
function toggleMorePanel() {
    var p = document.getElementById('morePanel');
    if (p.style.display === 'block') p.style.display = 'none';
    else { p.style.display = 'block'; renderMoreImages(); document.getElementById('morePanelHint').textContent = '当前：表情包'; }
}

function openEmojiTabInMore() { renderMoreImages(); document.getElementById('morePanelHint').textContent = '当前：表情包'; }

function renderMoreImages() {
    var grid = document.getElementById('morePanelImages'); if (!grid) return;
    var ids = appData.emojiIds;
    if (!ids || ids.length === 0) { grid.innerHTML = '<div style="text-align:center;color:var(--text-system);padding:20px;grid-column:1/-1;">还没有表情包，点击上方按钮上传</div>'; return; }
    grid.innerHTML = '';
    ids.forEach(function(id, idx) {
        getImageFromDB('images', id).then(function(url) {
            var cell = document.createElement('div'); cell.className = 'sub-item';
            cell.onclick = function() { sendFromMorePanel(idx); };
            if (url) cell.innerHTML = '<img src="' + url + '" onerror="this.parentElement.textContent=\'已失效\';">';
            else { cell.style.cssText += 'background:var(--border);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--text-system);'; cell.textContent = '已失效'; }
            grid.appendChild(cell);
        });
    });
}

function uploadToMorePanel() {
    var file = document.getElementById('moreFileInput').files[0]; if (!file) return;
    compressImage(file, 400, 400, 0.5).then(function(url) {
        var id = 'emoji_' + Date.now() + '_' + Math.random().toString(36).substr(2,6);
        return saveImageToDB('images', id, url).then(function() {
            if (!Array.isArray(appData.emojiIds)) appData.emojiIds = [];
            appData.emojiIds.push(id);
            return saveData();
        }).then(function() { renderMoreImages(); showToastLong('表情包上传成功！', 3500); checkStorageAfterUpload(); });
    }).catch(function() { showToast('上传失败，请重试'); });
    document.getElementById('moreFileInput').value = '';
}

function sendFromMorePanel(index) {
    if (!Array.isArray(appData.emojiIds) || index >= appData.emojiIds.length) return;
    getImageFromDB('images', appData.emojiIds[index]).then(function(url) {
        if (!url) { showToast('表情包已失效'); return; }
        addMessage(url, 'me', true, true);
        appData.chatHistory.push({ type: 'me', content: '', imageId: appData.emojiIds[index], time: Date.now(), isSticker: true });
        saveData(); toggleMorePanel();
        setTimeout(function() { if (typeof triggerAutoReply === 'function') triggerAutoReply(); }, 400 + Math.random() * 800);
    });
}

// ========== 表情管理 ==========
function openEmojiManageModal() {
    closeModal('settingsOverlay');
    openSubModal('<h4>表情包管理</h4><div class="subtitle">共 ' + appData.emojiIds.length + ' 个</div><div class="btn-row" style="gap:8px;"><button class="btn-sm" onclick="document.getElementById(\'emojiManageUpload\').click()">上传表情包</button><button class="btn-sm outline" onclick="clearAllEmojis()" style="color:var(--danger);">清空</button></div><input type="file" id="emojiManageUpload" accept="image/*" multiple style="display:none" onchange="uploadEmojiManage()"><div style="max-height:380px;overflow-y:auto;margin-top:12px;" id="emojiManageGridContainer"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:4px;" id="emojiManageGrid">加载中...</div></div><button class="btn-close" onclick="closeModal(\'subOverlay\')" style="margin-top:12px;">关闭</button>');
    renderEmojiManageGrid();
}

function renderEmojiManageGrid() {
    var grid = document.getElementById('emojiManageGrid'); if (!grid) return;
    grid.style.display = 'grid'; grid.style.gridTemplateColumns = 'repeat(3, 1fr)'; grid.style.gap = '12px'; grid.style.padding = '8px';
    if (!appData.emojiIds.length) { grid.innerHTML = '<div style="text-align:center;color:var(--text-system);grid-column:1/-1;padding:20px;">暂无表情包</div>'; return; }
    grid.innerHTML = '';
    appData.emojiIds.forEach(function(id, idx) {
        getImageFromDB('images', id).then(function(url) {
            var d = document.createElement('div');
            d.style.cssText = 'position:relative;border-radius:12px;overflow:hidden;aspect-ratio:1;background:var(--item-bg);box-shadow:0 1px 3px rgba(0,0,0,0.1);';
            if (url) {
                d.innerHTML = '<img src="' + url + '" style="width:100%;height:100%;object-fit:contain;background:var(--bubble-other);" onerror="this.parentElement.innerHTML=\'<div style=\\\'display:flex;align-items:center;justify-content:center;height:100%;\\\'>失效</div>\';">' +
                    '<button onclick="delEmojiManage(' + idx + ')" style="position:absolute;top:4px;right:4px;background:var(--danger);color:white;border:none;border-radius:50%;width:26px;height:26px;font-size:14px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.2);z-index:2;">✕</button>';
            } else {
                d.style.cssText += 'display:flex;align-items:center;justify-content:center;background:var(--border);font-size:12px;color:var(--text-system);';
                d.textContent = '已失效';
                var delBtn = document.createElement('button');
                delBtn.textContent = '✕';
                delBtn.style.cssText = 'position:absolute;top:4px;right:4px;background:var(--danger);color:white;border:none;border-radius:50%;width:26px;height:26px;font-size:14px;cursor:pointer;';
                delBtn.onclick = function() { delEmojiManage(idx); };
                d.appendChild(delBtn);
            }
            grid.appendChild(d);
        }).catch(function() {
            var d = document.createElement('div');
            d.style.cssText = 'position:relative;border-radius:12px;overflow:hidden;aspect-ratio:1;background:var(--border);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--text-system);';
            d.textContent = '加载失败';
            grid.appendChild(d);
        });
    });
}

function uploadEmojiManage() {
    var input = document.getElementById('emojiManageUpload'); var files = input.files;
    if (!files.length) return; var total = files.length;
    function processOne(index) {
        if (index >= files.length) { saveData().then(function() { renderEmojiManageGrid(); renderMoreImages(); showToast('已上传 ' + total + ' 个'); input.value = ''; }); return; }
        compressImage(files[index], 400, 400, 0.5).then(function(url) {
            var id = 'emoji_' + Date.now() + '_' + index;
            return saveImageToDB('images', id, url).then(function() {
                appData.emojiIds.push(id);
                processOne(index + 1);
            });
        }).catch(function() { processOne(index + 1); });
    }
    processOne(0);
}

function delEmojiManage(i) {
    deleteImageFromDB('images', appData.emojiIds[i]).catch(function(){});
    appData.emojiIds.splice(i,1); saveData(); renderMoreImages(); renderEmojiManageGrid(); showToast('已删除');
}

function clearAllEmojis() {
    if (!confirm('清空所有表情包？')) return;
    var ps = appData.emojiIds.map(function(id) { return deleteImageFromDB('images', id).catch(function(){}); });
    Promise.all(ps).then(function() { appData.emojiIds = []; return saveData(); }).then(function() { renderMoreImages(); renderEmojiManageGrid(); showToast('已清空'); });
}

// ========== Toast ==========
function showToast(msg) {
    var t = document.getElementById('toast'); if (!t) return;
    t.textContent = msg; t.style.display = 'block'; t.style.whiteSpace = 'normal';
    clearTimeout(t._timeout); t._timeout = setTimeout(function() { t.style.display = 'none'; }, 2400);
}

function showToastLong(msg, duration) {
    var t = document.getElementById('toast'); if (!t) return;
    t.textContent = msg; t.style.display = 'block'; t.style.whiteSpace = 'pre-line';
    clearTimeout(t._timeout); t._timeout = setTimeout(function() { t.style.display = 'none'; t.style.whiteSpace = 'normal'; }, duration || 3000);
}

// ========== 事件监听 ==========
document.addEventListener('click', function(e) {
    if (e.target.id === 'forumDetailOverlay') { e.stopPropagation(); if (typeof closeTopicDetail === 'function') closeTopicDetail(); return; }
    if (e.target.id === 'forumOverlay') { if (typeof closeForum === 'function') closeForum(); return; }
    if (e.target.id === 'settingsOverlay') closeModal('settingsOverlay');
    if (e.target.id === 'subOverlay') closeModal('subOverlay');
    if (e.target.id === 'photoOverlay') closeModal('photoOverlay');
    if (e.target.id === 'letterOverlay') closeModal('letterOverlay');
    if (e.target.id === 'clueNotebookOverlay' && typeof closeClueNotebook === 'function') closeClueNotebook();
});

// ========== 保存机制 ==========
document.addEventListener('visibilitychange', function() { if (document.hidden) { saveData(true); } });
window.addEventListener('beforeunload', function() { saveData(true); });
window.addEventListener('pagehide', function() { saveData(true); });
setInterval(function() { saveData(true); }, 15000);
window.addEventListener('storage', function(e) { if (e.key === STORAGE_KEY && e.newValue) { console.log('检测到其他标签页的数据更新'); } });

// ========== 视频弹幕聊天接口 ==========
function vdAddMessage(content, type) {
    if (type === 'other') { addMessage(content, 'other', false); appData.chatHistory.push({ type: 'other', content: content, time: Date.now() }); }
    else { addMessage(content, 'me', false); appData.chatHistory.push({ type: 'me', content: content, time: Date.now() }); }
    saveData(true);
}

// ========== 转盘邀请功能 ==========
function sendWheelInvite() {
    var inviteId = 'wheel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    var inviteHtml = '<div class="wheel-invite" data-invite-id="' + inviteId + '" style="background:var(--item-bg);border-radius:12px;padding:12px;text-align:center;cursor:pointer;" onclick="acceptWheelInvite(this)"><div style="font-size:28px;margin-bottom:8px;"></div><div style="font-weight:bold;margin-bottom:4px;">转盘邀请</div><div style="font-size:12px;color:var(--text-system);margin-bottom:8px;">' + appData.otherName + ' 邀请你转动幸福转盘</div><div style="display:inline-block;background:var(--accent);color:white;padding:6px 16px;border-radius:20px;font-size:13px;">点击转一次</div></div>';
    addMessage(inviteHtml, 'other', false, false);
    appData.chatHistory.push({ type: 'other', content: inviteHtml, time: Date.now(), isWheelInvite: true, inviteId: inviteId, inviteStatus: 'pending' });
    saveData();
}

function acceptWheelInvite(element) {
    var inviteDiv = element;
    while (inviteDiv && !inviteDiv.classList.contains('wheel-invite')) { inviteDiv = inviteDiv.parentElement; }
    if (!inviteDiv) return;
    var inviteId = inviteDiv.getAttribute('data-invite-id');
    var inviteMsg = appData.chatHistory.find(function(m) { return m.isWheelInvite && m.inviteId === inviteId && m.inviteStatus === 'used'; });
    if (inviteMsg) { showToast('这个转盘已经转过啦'); return; }
    for (var i = 0; i < appData.chatHistory.length; i++) {
        if (appData.chatHistory[i].isWheelInvite && appData.chatHistory[i].inviteId === inviteId) {
            appData.chatHistory[i].inviteStatus = 'used';
            break;
        }
    }
    saveData();
    var originalContent = inviteDiv.innerHTML;
    inviteDiv.innerHTML = '<div style="text-align:center;padding:12px;"><div style="font-size:24px;margin-bottom:8px;"></div><div style="font-size:12px;">正在转动...</div></div>';
    inviteDiv.style.cursor = 'default';
    inviteDiv.onclick = null;
    setTimeout(function() {
        var items = appData.wheelItems || [];
        if (items.length === 0) { inviteDiv.innerHTML = originalContent; showToast('转盘词库为空，请先添加'); return; }
        var randomIndex = Math.floor(Math.random() * items.length);
        var result = items[randomIndex];
        appData.wheelHistory.push({ item: result, time: Date.now(), source: 'invite' });
        if (appData.wheelHistory.length > 50) appData.wheelHistory.shift();
        saveData();
        inviteDiv.innerHTML = '<div style="text-align:center;padding:12px;"><div style="font-size:28px;margin-bottom:8px;"></div><div style="font-weight:bold;margin-bottom:4px;">转盘结果</div><div style="font-size:14px;color:var(--accent);margin-bottom:4px;">' + result + '</div><div style="font-size:11px;color:var(--text-system);">已存入历史记录</div></div>';
        addMessage(' 转盘结果：' + result, 'other', false, false);
        appData.chatHistory.push({ type: 'other', content: ' 转盘结果：' + result, time: Date.now() });
        saveData();
        showToast('转到了：' + result);
    }, 800);
}

function sendWheelInviteManually() { sendWheelInvite(); }

// ========== 打开设置 ==========
function openSettings() { openModal('settingsOverlay'); }
function openSubModal(html) { document.getElementById('subModal').innerHTML = html; openModal('subOverlay'); }

// ========== 对方主动发消息 ==========
function otherSendMessage() {
    var allReplies = getAllReplies();
    if (allReplies.length === 0) { showToast('还没有设置回复词库，请先去设置中添加'); return; }
    var randomIndex = Math.floor(Math.random() * allReplies.length);
    var msg = allReplies[randomIndex];
    addMessage(msg, 'other', false);
    appData.chatHistory.push({ type: 'other', content: msg, time: Date.now() });
    saveData();
    var chat = document.getElementById('chat');
    if (chat) chat.scrollTop = chat.scrollHeight;
    showToast(appData.otherName + ' 发来消息');
    if (document.hidden && typeof sendNotification === 'function') {
        var msgText = msg.length > 50 ? msg.substring(0, 50) + '...' : msg;
        sendNotification(appData.otherName, msgText, window.location.href);
    }
}

// ========== 启动 ==========
initApp().then(function() {
    console.log('甜心助手启动成功！');
    if (appData.playlist && appData.playlist.length > 0) {
        setTimeout(function() { if (typeof showFloatingBall === 'function') { showFloatingBall(); } }, 1000);
    }
}).catch(function(e) { console.error('启动失败:', e); });

// ==================== 新增函数 ====================

// 清空聊天记录
function clearChatHistory() {
    if (!confirm('确定清除所有聊天记录吗？')) return;
    appData.chatHistory = [];
    saveData(true);
    renderChatHistory();
    showToast('聊天记录已清除');
}

// 关闭所有全屏
function closeAllFullscreens() {
    var ids = ['shopFullscreen', 'forumFullscreen', 'letterFullscreen', 'scratchFullscreen', 
               'sudokuFullscreen', 'gomokuFullscreen', 'murderFullscreen', 'wheelFullscreen',
               'bookFullscreen', 'notebookFullscreen', 'themeFullscreen'];
    ids.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.remove();
    });
    closeModal('subOverlay');
}

// ==================== Tab 切换 ====================

// ==================== Tab 切换 ====================

function switchTab(tab) {
    var desktopView = document.getElementById('desktopView');
    var chatView = document.getElementById('chatView');
    var settingsFullscreen = document.getElementById('settingsFullscreen');
    
    closeChatMorePanel();
    closeAllFullscreens();
    
    // 更新tab激活状态
    document.querySelectorAll('.tab-item').forEach(function(el) {
        el.classList.remove('active');
        if (el.dataset.tab === tab) {
            el.classList.add('active');
        }
    });
    
    // 聊天Tab - 只显示聊天
    if (tab === 'chat') {
        if (desktopView) desktopView.classList.add('hidden');
        if (chatView) chatView.classList.add('active');
        if (settingsFullscreen) settingsFullscreen.style.display = 'none';
        document.getElementById('statusTitle').textContent = appData.otherName || '甜心助手';
        return;
    }
    
    // 主界面Tab - 显示功能图标
    if (tab === 'desktop') {
        if (desktopView) desktopView.classList.remove('hidden');
        if (chatView) chatView.classList.remove('active');
        if (settingsFullscreen) settingsFullscreen.style.display = 'none';
        document.getElementById('statusTitle').textContent = '甜心助手';
        return;
    }
    
    // 通话Tab - 弹出通话后回到聊天
    if (tab === 'call') {
        if (typeof startVoiceCall === 'function') {
            startVoiceCall();
        }
        setTimeout(function() {
            if (desktopView) desktopView.classList.add('hidden');
            if (chatView) chatView.classList.add('active');
            document.querySelectorAll('.tab-item').forEach(function(el) {
                el.classList.remove('active');
                if (el.dataset.tab === 'chat') {
                    el.classList.add('active');
                }
            });
            document.getElementById('statusTitle').textContent = appData.otherName || '甜心助手';
        }, 100);
        return;
    }
    
    // 设置Tab
    if (tab === 'settings') {
        if (desktopView) desktopView.classList.add('hidden');
        if (chatView) chatView.classList.remove('active');
        if (settingsFullscreen) {
            settingsFullscreen.style.display = 'flex';
            renderSettingsContent();
        }
        document.getElementById('statusTitle').textContent = '设置';
        return;
    }
}

// ==================== 设置内容渲染 ====================

function renderSettingsContent() {
    var body = document.getElementById('settingsBody');
    if (!body) return;
    
    body.innerHTML = `
        <div class="settings-group">
            <div class="settings-group-title">外观</div>
            <div class="settings-item" onclick="openColorThemeModal()">
                <div class="settings-item-left">
                    <div class="settings-item-icon s-icon-theme"></div>
                    <span class="settings-item-name">主题颜色</span>
                </div>
                <span class="settings-item-arrow">›</span>
            </div>
            <div class="settings-item" onclick="openThemeModal()">
                <div class="settings-item-left">
                    <div class="settings-item-icon s-icon-theme"></div>
                    <span class="settings-item-name">深色模式</span>
                </div>
                <span class="settings-item-arrow">›</span>
            </div>
        </div>
        
        <div class="settings-group">
            <div class="settings-group-title">通知</div>
            <div class="settings-item" onclick="showToast('推送通知已切换')">
                <div class="settings-item-left">
                    <div class="settings-item-icon s-icon-notification"></div>
                    <span class="settings-item-name">推送通知</span>
                </div>
                <span class="settings-item-arrow">›</span>
            </div>
            <div class="settings-item" onclick="showToast('声音已切换')">
                <div class="settings-item-left">
                    <div class="settings-item-icon s-icon-notification"></div>
                    <span class="settings-item-name">声音</span>
                </div>
                <span class="settings-item-arrow">›</span>
            </div>
        </div>
        
        <div class="settings-group">
            <div class="settings-group-title">音乐</div>
            <div class="settings-item" onclick="openMusicPlayerInSettings()">
                <div class="settings-item-left">
                    <div class="settings-item-icon s-icon-music"></div>
                    <span class="settings-item-name">音乐播放器</span>
                </div>
                <span class="settings-item-arrow">›</span>
            </div>
        </div>
        
        <div class="settings-group">
            <div class="settings-group-title">隐私与数据</div>
            <div class="settings-item" onclick="if(confirm('确定清除所有聊天记录吗？')){clearChatHistory();}">
                <div class="settings-item-left">
                    <div class="settings-item-icon s-icon-privacy"></div>
                    <span class="settings-item-name">清空聊天记录</span>
                </div>
                <span class="settings-item-arrow">›</span>
            </div>
            <div class="settings-item" onclick="openBackupModal()">
                <div class="settings-item-left">
                    <div class="settings-item-icon s-icon-data"></div>
                    <span class="settings-item-name">数据管理</span>
                </div>
                <span class="settings-item-arrow">›</span>
            </div>
        </div>
        
        <div class="settings-group">
            <div class="settings-group-title">关于</div>
            <div class="settings-item" onclick="showToast('甜心助手 v2.0')">
                <div class="settings-item-left">
                    <div class="settings-item-icon s-icon-about"></div>
                    <span class="settings-item-name">版本信息</span>
                </div>
                <span class="settings-item-arrow">›</span>
            </div>
            <div class="settings-item" onclick="showToast('使用帮助：点击功能图标即可使用')">
                <div class="settings-item-left">
                    <div class="settings-item-icon s-icon-about"></div>
                    <span class="settings-item-name">使用帮助</span>
                </div>
                <span class="settings-item-arrow">›</span>
            </div>
        </div>
    `;
}

// 设置里的音乐播放器 - 在当前全屏内打开
function openMusicPlayerInSettings() {
    var overlay = document.createElement('div');
    overlay.className = 'fullscreen-overlay active';
    overlay.id = 'musicPlayerFullscreen';
    overlay.style.zIndex = '600';
    overlay.innerHTML = `
        <div class="fullscreen-header">
            <button class="fullscreen-back" onclick="closeMusicPlayerFullscreen()">
                <span class="back-arrow"></span> 返回
            </button>
            <span class="fullscreen-title">音乐播放器</span>
            <span style="width:50px;"></span>
        </div>
        <div class="fullscreen-body" style="display:flex;flex-direction:column;justify-content:center;padding:20px;">
            <div id="musicPlayerContainerSettings" style="width:100%;min-height:200px;"></div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // 复制音乐播放器内容到设置内
    var musicOverlay = document.getElementById('musicOverlay');
    if (musicOverlay) {
        var modal = musicOverlay.querySelector('.modal');
        if (modal) {
            var clone = modal.cloneNode(true);
            var container = document.getElementById('musicPlayerContainerSettings');
            if (container) {
                container.innerHTML = '';
                container.appendChild(clone);
            }
        }
    } else {
        // 如果音乐播放器还没初始化，直接调用 openMusicPlayer 然后复制
        if (typeof openMusicPlayer === 'function') {
            openMusicPlayer();
            setTimeout(function() {
                var musicOverlay2 = document.getElementById('musicOverlay');
                if (musicOverlay2) {
                    var modal2 = musicOverlay2.querySelector('.modal');
                    if (modal2) {
                        var clone2 = modal2.cloneNode(true);
                        var container2 = document.getElementById('musicPlayerContainerSettings');
                        if (container2) {
                            container2.innerHTML = '';
                            container2.appendChild(clone2);
                        }
                        musicOverlay2.style.display = 'none';
                    }
                }
            }, 300);
        }
    }
}

function closeMusicPlayerFullscreen() {
    var el = document.getElementById('musicPlayerFullscreen');
    if (el) el.remove();
    // 恢复音乐播放器
    var musicOverlay = document.getElementById('musicOverlay');
    if (musicOverlay) musicOverlay.style.display = '';
}

// ==================== 关闭设置 ====================

function closeSettingsFullscreen() {
    var el = document.getElementById('settingsFullscreen');
    if (el) el.style.display = 'none';
    var desktopView = document.getElementById('desktopView');
    if (desktopView) desktopView.classList.remove('hidden');
    document.querySelectorAll('.tab-item').forEach(function(el2) {
        el2.classList.remove('active');
        if (el2.dataset.tab === 'desktop') {
            el2.classList.add('active');
        }
    });
}

// ==================== 聊天 + 号面板 ====================

function toggleChatMorePanel() {
    var panel = document.getElementById('chatMorePanel');
    if (!panel) return;
    if (panel.style.display === 'block') {
        panel.style.display = 'none';
    } else {
        panel.style.display = 'block';
    }
}

function closeChatMorePanel() {
    var panel = document.getElementById('chatMorePanel');
    if (panel) panel.style.display = 'none';
}

// ==================== 导出到全局 ====================
window.switchTab = switchTab;
window.closeSettingsFullscreen = closeSettingsFullscreen;
window.toggleChatMorePanel = toggleChatMorePanel;
window.closeChatMorePanel = closeChatMorePanel;
window.openLetterModal = openLetterModal;
window.closeLetterFullscreen = closeLetterFullscreen;
window.sendLetterFullscreen = sendLetterFullscreen;
window.openColorThemeModal = openColorThemeModal;
window.clearChatHistory = clearChatHistory;
window.closeAllFullscreens = closeAllFullscreens;
window.openMusicPlayerInSettings = openMusicPlayerInSettings;
window.closeMusicPlayerFullscreen = closeMusicPlayerFullscreen;
