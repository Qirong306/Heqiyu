// ==================== 数据备份恢复 ====================

function openBackupModal() {
    closeModal('settingsOverlay');
    var html = '<h4>数据管理</h4>';
    html += '<div class="backup-options">';
    html += '<button onclick="exportFullAsFile()">全量备份下载</button>';
    html += '<button onclick="exportFull()">全量备份复制</button>';
    html += '<button onclick="exportChat()">聊天记录备份</button>';
    html += '<button onclick="exportLibs()">词库备份</button>';
    html += '</div>';
    html += '<div style="margin-top:12px;"><button class="btn-sm outline" onclick="document.getElementById(\'importDataFile\').click()">导入JSON备份文件</button><input type="file" id="importDataFile" accept=".json" style="display:none" onchange="importDataFile()"></div>';
    html += '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;"><button class="btn-sm danger-sm" onclick="clearChatHistory()">清除聊天记录</button><button class="btn-sm outline" onclick="cleanOrphanImages()">清理失效图片</button></div>';
    html += '<button class="btn-close" onclick="closeModal(\'subOverlay\')" style="margin-top:14px;">关闭</button>';
    openSubModal(html);
}

function downloadJSONFile(filename, jsonData) {
    var blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 导出备份（完整版：含表情包，不含聊天图片）
function exportFullAsFile() {
    var emojiPromises = (appData.emojiIds || []).map(function(id) {
        return getImageFromDB('images', id).then(function(data) {
            return { id: id, data: data || '' };
        });
    });
    
    Promise.all(emojiPromises).then(function(emojiData) {
        var chatHistoryForBackup = (appData.chatHistory || []).map(function(msg) {
            var newMsg = JSON.parse(JSON.stringify(msg));
            if (newMsg.imageId) {
                newMsg.imageData = undefined;
            }
            return newMsg;
        });
        
        var backupData = {
            myName: appData.myName,
            myAvatarId: appData.myAvatarId,
            myAvatar: '',
            otherName: appData.otherName,
            otherAvatarId: appData.otherAvatarId,
            otherAvatar: '',
            replyGroups: appData.replyGroups,
            emojiIds: appData.emojiIds,
            emojiData: emojiData,
            theme: appData.theme,
            chatHistory: chatHistoryForBackup,
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
            musicFloatingImg: '',
            books: appData.books,
            wheelItems: appData.wheelItems,
            wheelHistory: appData.wheelHistory,
            statusList: appData.statusList,
            lastStatusTime: appData.lastStatusTime,
            currentStatus: appData.currentStatus,
            vdWordBank: appData.vdWordBank
        };
        var timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        downloadJSONFile('chat_app_backup_' + timestamp + '.json', backupData);
        closeModal('subOverlay');
        showToast('备份文件已下载（含表情包，聊天图片仅保存ID）');
    }).catch(function(e) {
        console.error('导出失败:', e);
        showToast('导出失败，请重试');
    });
}

function exportFull() {
    var emojiPromises = (appData.emojiIds || []).map(function(id) {
        return getImageFromDB('images', id).then(function(data) {
            return { id: id, data: data || '' };
        });
    });
    Promise.all(emojiPromises).then(function(emojiData) {
        var chatHistoryForBackup = (appData.chatHistory || []).map(function(msg) {
            var newMsg = JSON.parse(JSON.stringify(msg));
            if (newMsg.imageId) {
                newMsg.imageData = undefined;
            }
            return newMsg;
        });
        var backupData = {
            myName: appData.myName,
            myAvatarId: appData.myAvatarId,
            myAvatar: '',
            otherName: appData.otherName,
            otherAvatarId: appData.otherAvatarId,
            otherAvatar: '',
            replyGroups: appData.replyGroups,
            emojiIds: appData.emojiIds,
            emojiData: emojiData,
            theme: appData.theme,
            chatHistory: chatHistoryForBackup,
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
            musicFloatingImg: '',
            books: appData.books,
            wheelItems: appData.wheelItems,
            wheelHistory: appData.wheelHistory,
            statusList: appData.statusList,
            lastStatusTime: appData.lastStatusTime,
            currentStatus: appData.currentStatus,
            vdWordBank: appData.vdWordBank
        };
        copyToClipboard(JSON.stringify(backupData, null, 2), '全量备份');
        closeModal('subOverlay');
    });
}

function exportChat() {
    var chatBackup = { chatHistory: appData.chatHistory };
    copyToClipboard(JSON.stringify(chatBackup, null, 2), '聊天记录');
    closeModal('subOverlay');
}

function exportLibs() {
    copyToClipboard(JSON.stringify({ replyGroups: appData.replyGroups, emojiIds: appData.emojiIds }, null, 2), '词库');
    closeModal('subOverlay');
}

function copyToClipboard(text, label) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
            showToastLong(label + '已复制到剪贴板\n请打开备忘录粘贴保存为 .json 文件\n以后可通过「导入JSON备份文件」恢复', 5000);
        }).catch(function() { fallbackCopy(text, label); });
    } else {
        fallbackCopy(text, label);
    }
}

function fallbackCopy(text, label) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
        document.execCommand('copy');
        showToastLong(label + '已复制到剪贴板\n请打开备忘录粘贴保存为 .json 文件\n以后可通过「导入JSON备份文件」恢复', 5000);
    } catch(e) {
        showToast('复制失败，请重试');
    }
    document.body.removeChild(ta);
}

// 导入备份
function importDataFile() {
    var file = document.getElementById('importDataFile').files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var data = JSON.parse(e.target.result);
            if (!data || typeof data !== 'object') throw new Error('无效数据');
            
            console.log('[导入] 开始导入，原聊天记录数:', appData.chatHistory?.length || 0);
            
            appData.chatHistory = [];
            appData.letters = [];
            appData.forumTopics = [];
            appData.forumReplies = {};
            appData.playlist = [];
            appData.books = [];
            appData.wheelHistory = [];
            
            if (typeof data.myName === 'string') appData.myName = data.myName;
            if (typeof data.otherName === 'string') appData.otherName = data.otherName;
            if (typeof data.theme === 'string') appData.theme = data.theme;
            if (typeof data.morePanelTab === 'string') appData.morePanelTab = data.morePanelTab;
            if (Array.isArray(data.emojiIds)) appData.emojiIds = data.emojiIds;
            if (Array.isArray(data.chatHistory)) appData.chatHistory = data.chatHistory;
            if (Array.isArray(data.letters)) appData.letters = data.letters;
            if (Array.isArray(data.replyGroups) && data.replyGroups.length > 0) appData.replyGroups = data.replyGroups;
            if (Array.isArray(data.forumTopics)) appData.forumTopics = data.forumTopics;
            if (typeof data.forumReplies === 'object' && data.forumReplies !== null) appData.forumReplies = data.forumReplies;
            if (Array.isArray(data.forumReplyLib)) appData.forumReplyLib = data.forumReplyLib;
            if (Array.isArray(data.forumTopicTemplates)) appData.forumTopicTemplates = data.forumTopicTemplates;
            if (Array.isArray(data.forumTopicWords)) appData.forumTopicWords = data.forumTopicWords;
            if (Array.isArray(data.transferAmounts)) appData.transferAmounts = data.transferAmounts;
            if (Array.isArray(data.transferNotes)) appData.transferNotes = data.transferNotes;
            if (Array.isArray(data.scratchPrizes)) appData.scratchPrizes = data.scratchPrizes;
            if (typeof data.scratchMaxPerDay === 'number') appData.scratchMaxPerDay = data.scratchMaxPerDay;
            if (Array.isArray(data.playlist)) appData.playlist = data.playlist;
            if (typeof data.musicFloatingImg === 'string') appData.musicFloatingImg = data.musicFloatingImg;
            if (Array.isArray(data.books)) appData.books = data.books;
            if (Array.isArray(data.wheelItems)) appData.wheelItems = data.wheelItems;
            if (Array.isArray(data.wheelHistory)) appData.wheelHistory = data.wheelHistory;
            if (Array.isArray(data.vdWordBank)) appData.vdWordBank = data.vdWordBank;
            if (Array.isArray(data.statusList)) appData.statusList = data.statusList;
            if (typeof data.lastStatusTime === 'number') appData.lastStatusTime = data.lastStatusTime;
            if (typeof data.currentStatus === 'string') appData.currentStatus = data.currentStatus;
            
            if (Array.isArray(data.emojiData) && data.emojiData.length > 0) {
                appData.emojiIds = [];
                data.emojiData.forEach(function(item) {
                    if (item.data && item.data.length > 100) {
                        appData.emojiIds.push(item.id);
                        saveImageToDB('images', item.id, item.data).catch(function() {
                            console.warn('表情包恢复失败:', item.id);
                        });
                    }
                });
                console.log('[导入] 表情包恢复完成，数量:', appData.emojiIds.length);
            }
            
            if (data.myAvatar && typeof data.myAvatar === 'string' && data.myAvatar.length > 100) {
                var myId = data.myAvatarId || ('avatar_me_' + Date.now());
                saveImageToDB('avatars', myId, data.myAvatar).then(function() {
                    appData.myAvatarId = myId;
                    appData.myAvatar = data.myAvatar;
                    saveData(true);
                });
            } else {
                appData.myAvatarId = data.myAvatarId || '';
                appData.myAvatar = '';
                if (appData.myAvatarId) {
                    getImageFromDB('avatars', appData.myAvatarId).then(function(img) { appData.myAvatar = img || ''; });
                }
            }
            if (data.otherAvatar && typeof data.otherAvatar === 'string' && data.otherAvatar.length > 100) {
                var otherId = data.otherAvatarId || ('avatar_other_' + Date.now());
                saveImageToDB('avatars', otherId, data.otherAvatar).then(function() {
                    appData.otherAvatarId = otherId;
                    appData.otherAvatar = data.otherAvatar;
                    saveData(true);
                });
            } else {
                appData.otherAvatarId = data.otherAvatarId || '';
                appData.otherAvatar = '';
                if (appData.otherAvatarId) {
                    getImageFromDB('avatars', appData.otherAvatarId).then(function(img) { appData.otherAvatar = img || ''; });
                }
            }
            
            saveData(true);
            
            applyTheme();
            updateHeader();
            renderChatHistory();
            renderMoreImages();
            updateLetterBadge();
            updateStatus();
            renderStatus();
            
            if (typeof musicPlaylist !== 'undefined') {
                musicPlaylist.length = 0;
                appData.playlist.forEach(function(song) {
                    musicPlaylist.push(song);
                });
            }
            if (typeof showFloatingBall === 'function' && appData.playlist && appData.playlist.length > 0) {
                setTimeout(function() {
                    showFloatingBall();
                }, 500);
            }
            
            if (appData.myAvatarId) {
                getImageFromDB('avatars', appData.myAvatarId).then(function(img) {
                    if (img) appData.myAvatar = img;
                    renderChatHistory();
                });
            }
            if (appData.otherAvatarId) {
                getImageFromDB('avatars', appData.otherAvatarId).then(function(img) {
                    if (img) appData.otherAvatar = img;
                    renderChatHistory();
                });
            }
            
            closeModal('subOverlay');
            showToastLong('导入成功！共 ' + (appData.chatHistory?.length || 0) + ' 条聊天记录，' + (appData.emojiIds?.length || 0) + ' 个表情包', 4000);
            
            console.log('[导入] 导入完成，聊天记录数:', appData.chatHistory?.length, '表情包数:', appData.emojiIds?.length);
        } catch(err) {
            console.error('[导入] 错误:', err);
            showToast('导入失败，文件格式错误');
        }
    };
    reader.readAsText(file);
    document.getElementById('importDataFile').value = '';
}

function clearChatHistory() {
    if (!confirm('确定清除所有聊天记录？\n\n注意：表情包不会被删除，只会删除聊天中的图片消息。')) return;
    
    var chatImageIds = [];
    for (var i = 0; i < appData.chatHistory.length; i++) {
        var msg = appData.chatHistory[i];
        if (msg.imageId && !appData.emojiIds.includes(msg.imageId)) {
            chatImageIds.push(msg.imageId);
        }
    }
    
    var promises = chatImageIds.map(function(id) {
        return deleteImageFromDB('images', id).catch(function() {});
    });
    
    Promise.all(promises).then(function() {
        appData.chatHistory = [];
        saveData(true);
        renderChatHistory();
        closeModal('subOverlay');
        showToast('聊天记录已清除，表情包保留');
    });
}

function cleanOrphanImages() {
    autoCleanOrphanImages().then(function(cleaned) {
        showToast(cleaned > 0 ? '清理了 ' + cleaned + ' 张失效图片' : '没有需要清理的图片');
        openBackupModal();
    });
}
// 确保导出到全局（使用 _ 前缀避免冲突）
window._openBackupModal = openBackupModal;
window._exportFullAsFile = exportFullAsFile;
window._exportFull = exportFull;
window._exportChat = exportChat;
window._exportLibs = exportLibs;
window._importDataFile = importDataFile;
window._cleanOrphanImages = cleanOrphanImages;
