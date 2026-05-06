// ==================== 游戏模块 ====================
// 数独、五子棋、剧本杀

// ==================== 全局游戏状态 ====================
var currentGame = null; // 'sudoku' | 'gomoku' | 'murder' | null
var gameInProgress = false;

// ========== 输入框模式切换 ==========
function setInputMode(mode, gameType) {
    var inputRow = document.querySelector('.input-row');
    var msgInput = document.getElementById('msgInput');
    var sendBtn = document.querySelector('.send-btn');
    var photoBtn = document.querySelector('.text-btn');
    var plusBtn = document.querySelector('.plus-btn');
    
    if (mode === 'game') {
        // 隐藏普通输入，显示游戏选项
        msgInput.style.display = 'none';
        sendBtn.style.display = 'none';
        photoBtn.textContent = gameType === 'murder' ? '线索' : '操作';
        photoBtn.classList.add('active-game');
        photoBtn.onclick = function() {
            if (gameType === 'murder') openClueNotebook();
            else if (gameType === 'sudoku') openSudoku();
            else if (gameType === 'gomoku') openGomoku();
        };
        currentGame = gameType;
        gameInProgress = true;
    } else {
        // 恢复普通输入
        msgInput.style.display = '';
        sendBtn.style.display = '';
        photoBtn.textContent = '照片';
        photoBtn.classList.remove('active-game');
        photoBtn.onclick = openPhotoMenu;
        currentGame = null;
        gameInProgress = false;
    }
}

// ==================== 数独 ====================
var sudokuBoard = [];
var sudokuSolution = [];
var sudokuSelected = null;
var sudokuDifficulty = 'medium';
var sudokuStartTime = null;

function openSudoku() {
    if (currentGame && currentGame !== 'sudoku') {
        if (!confirm('当前有进行中的游戏，确定要切换吗？')) return;
    }
    closeModal('subOverlay');
    var html = '<h4>数独</h4>';
    html += '<div class="sudoku-container">';
    html += '<div class="btn-row" style="justify-content:center;">';
    html += '<button class="btn-sm ' + (sudokuDifficulty === 'easy' ? '' : 'outline') + '" onclick="setSudokuDifficulty(\'easy\')">简单</button>';
    html += '<button class="btn-sm ' + (sudokuDifficulty === 'medium' ? '' : 'outline') + '" onclick="setSudokuDifficulty(\'medium\')">中等</button>';
    html += '<button class="btn-sm ' + (sudokuDifficulty === 'hard' ? '' : 'outline') + '" onclick="setSudokuDifficulty(\'hard\')">困难</button>';
    html += '</div>';
    html += '<div class="sudoku-board" id="sudokuBoard"></div>';
    html += '<div class="sudoku-numpad" id="sudokuNumpad"></div>';
    html += '<div class="btn-row" style="justify-content:center;margin-top:8px;">';
    html += '<button class="btn-sm outline" onclick="newSudokuGame()">新游戏</button>';
    html += '<button class="btn-sm outline" onclick="giveSudokuHint()">提示</button>';
    html += '</div>';
    html += '<div class="gomoku-info" id="sudokuInfo">选择单元格，点击数字填充</div>';
    html += '</div>';
    html += '<button class="btn-close" onclick="exitSudoku()" style="margin-top:10px;">退出数独</button>';
    openSubModal(html);
    
    setInputMode('game', 'sudoku');
    newSudokuGame();
}

function setSudokuDifficulty(level) {
    sudokuDifficulty = level;
    newSudokuGame();
}

function generateSudoku(difficulty) {
    // 生成完整解
    var solution = [];
    var board = Array(9).fill(null).map(function() { return Array(9).fill(0); });
    
    function isValid(board, row, col, num) {
        for (var x = 0; x < 9; x++) {
            if (board[row][x] === num || board[x][col] === num) return false;
        }
        var startRow = Math.floor(row / 3) * 3;
        var startCol = Math.floor(col / 3) * 3;
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                if (board[startRow + i][startCol + j] === num) return false;
            }
        }
        return true;
    }
    
    function fillBoard(board) {
        for (var i = 0; i < 9; i++) {
            for (var j = 0; j < 9; j++) {
                if (board[i][j] === 0) {
                    var nums = [1,2,3,4,5,6,7,8,9].sort(function() { return Math.random() - 0.5; });
                    for (var k = 0; k < nums.length; k++) {
                        if (isValid(board, i, j, nums[k])) {
                            board[i][j] = nums[k];
                            if (fillBoard(board)) return true;
                            board[i][j] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }
    
    fillBoard(board);
    solution = board.map(function(row) { return row.slice(); });
    
    // 挖洞
    var puzzle = board.map(function(row) { return row.slice(); });
    var cellsToRemove = difficulty === 'easy' ? 30 : (difficulty === 'hard' ? 50 : 40);
    var removed = 0;
    while (removed < cellsToRemove) {
        var row = Math.floor(Math.random() * 9);
        var col = Math.floor(Math.random() * 9);
        if (puzzle[row][col] !== 0) {
            puzzle[row][col] = 0;
            removed++;
        }
    }
    
    return { puzzle: puzzle, solution: solution };
}

function newSudokuGame() {
    var generated = generateSudoku(sudokuDifficulty);
    sudokuSolution = generated.solution;
    sudokuBoard = generated.puzzle.map(function(row) { return row.slice(); });
    sudokuSelected = null;
    sudokuStartTime = Date.now();
    renderSudokuBoard();
    document.getElementById('sudokuInfo').textContent = '新游戏开始！选择单元格填入数字';
}

function renderSudokuBoard() {
    var boardEl = document.getElementById('sudokuBoard');
    if (!boardEl) return;
    boardEl.innerHTML = '';
    for (var i = 0; i < 9; i++) {
        for (var j = 0; j < 9; j++) {
            var cell = document.createElement('div');
            cell.className = 'sudoku-cell';
            if (sudokuBoard[i][j] !== 0) {
                cell.textContent = sudokuBoard[i][j];
                if (sudokuSolution[i][j] !== 0 && sudokuBoard[i][j] === sudokuSolution[i][j]) {
                    // initial given or correct input
                }
            }
            // 标记初始给定
            if (sudokuSolution[i][j] !== 0 && sudokuBoard[i][j] === sudokuSolution[i][j] && sudokuBoard[i][j] !== 0) {
                // 通过检查是否为初始给定？无法区分，简化：所有非0且等于solution的都标given
            }
            // 为了简单，我们通过额外的数组 trackGiven 但这里直接用 solution 复制时记录
            // 在 newSudokuGame 中应该标记 given，但这里简化：我们通过判断 sudokuBoard[i][j] !== 0 且在生成时就固定
            // 重新设计：使用 sudokuGiven 数组
            if (window._sudokuGiven && window._sudokuGiven[i][j]) {
                cell.classList.add('given');
            }
            if (sudokuSelected && sudokuSelected.row === i && sudokuSelected.col === j) {
                cell.classList.add('selected');
            }
            // 错误数字检测
            if (sudokuBoard[i][j] !== 0 && sudokuBoard[i][j] !== sudokuSolution[i][j]) {
                cell.classList.add('error');
            }
            (function(row, col) {
                cell.onclick = function() {
                    selectSudokuCell(row, col);
                };
            })(i, j);
            boardEl.appendChild(cell);
        }
    }
    
    // 渲染数字键盘
    var numpad = document.getElementById('sudokuNumpad');
    if (!numpad) return;
    numpad.innerHTML = '';
    for (var n = 1; n <= 9; n++) {
        var btn = document.createElement('div');
        btn.className = 'sudoku-num-btn';
        btn.textContent = n;
        (function(num) {
            btn.onclick = function() {
                if (sudokuSelected) {
                    fillSudokuNumber(num);
                }
            };
        })(n);
        numpad.appendChild(btn);
    }
    var eraseBtn = document.createElement('div');
    eraseBtn.className = 'sudoku-num-btn erase';
    eraseBtn.textContent = '清除';
    eraseBtn.onclick = function() {
        if (sudokuSelected) {
            fillSudokuNumber(0);
        }
    };
    numpad.appendChild(eraseBtn);
}

function selectSudokuCell(row, col) {
    sudokuSelected = { row: row, col: col };
    renderSudokuBoard();
}

function fillSudokuNumber(num) {
    if (!sudokuSelected) return;
    var r = sudokuSelected.row, c = sudokuSelected.col;
    // 如果是初始给定，不允许修改
    if (window._sudokuGiven && window._sudokuGiven[r][c]) return;
    sudokuBoard[r][c] = num;
    renderSudokuBoard();
    checkSudokuCompletion();
}

function giveSudokuHint() {
    // 找一个空单元格，填入正确答案
    for (var i = 0; i < 9; i++) {
        for (var j = 0; j < 9; j++) {
            if (sudokuBoard[i][j] === 0) {
                sudokuBoard[i][j] = sudokuSolution[i][j];
                if (!window._sudokuHintGiven) window._sudokuHintGiven = [];
                window._sudokuHintGiven.push([i, j]);
                renderSudokuBoard();
                document.getElementById('sudokuInfo').textContent = '提示：(' + (i+1) + ',' + (j+1) + ') 已填入 ' + sudokuSolution[i][j];
                checkSudokuCompletion();
                return;
            }
        }
    }
    document.getElementById('sudokuInfo').textContent = '没有可提示的空格了';
}

function checkSudokuCompletion() {
    for (var i = 0; i < 9; i++) {
        for (var j = 0; j < 9; j++) {
            if (sudokuBoard[i][j] !== sudokuSolution[i][j]) return;
        }
    }
    var elapsed = Math.floor((Date.now() - sudokuStartTime) / 1000);
    var mins = Math.floor(elapsed / 60);
    var secs = elapsed % 60;
    var timeStr = mins > 0 ? mins + '分' + secs + '秒' : secs + '秒';
    document.getElementById('sudokuInfo').textContent = '恭喜！完成数独，用时 ' + timeStr;
    showToast('数独完成！用时 ' + timeStr);
    // 发送到聊天
    addSystemMsg('我完成了一局' + (sudokuDifficulty === 'easy' ? '简单' : (sudokuDifficulty === 'hard' ? '困难' : '中等')) + '数独，用时 ' + timeStr + '。');
}

function exitSudoku() {
    closeModal('subOverlay');
    setInputMode('normal');
}

// ==================== 五子棋 ====================
var gomokuBoard = [];
var gomokuSize = 15;
var gomokuCurrentPlayer = 'black'; // 玩家执黑
var gomokuGameOver = false;

function openGomoku() {
    if (currentGame && currentGame !== 'gomoku') {
        if (!confirm('当前有进行中的游戏，确定要切换吗？')) return;
    }
    closeModal('subOverlay');
    var html = '<h4>五子棋</h4>';
    html += '<div class="gomoku-container">';
    html += '<div class="gomoku-board-wrap"><canvas class="gomoku-board" id="gomokuCanvas" width="340" height="340"></canvas></div>';
    html += '<div class="gomoku-info" id="gomokuInfo">你执黑先行，点击棋盘落子</div>';
    html += '<div class="btn-row" style="justify-content:center;margin-top:6px;">';
    html += '<button class="btn-sm outline" onclick="newGomokuGame()">新游戏</button>';
    html += '<button class="btn-sm outline" onclick="undoGomoku()">悔棋</button>';
    html += '</div>';
    html += '</div>';
    html += '<button class="btn-close" onclick="exitGomoku()" style="margin-top:10px;">退出五子棋</button>';
    openSubModal(html);
    
    setInputMode('game', 'gomoku');
    newGomokuGame();
}

function newGomokuGame() {
    gomokuBoard = Array(gomokuSize).fill(null).map(function() { return Array(gomokuSize).fill(null); });
    gomokuCurrentPlayer = 'black';
    gomokuGameOver = false;
    renderGomokuBoard();
    document.getElementById('gomokuInfo').textContent = '你执黑先行，点击棋盘落子';
    
    var canvas = document.getElementById('gomokuCanvas');
    if (canvas) {
        canvas.onclick = function(e) {
            if (gomokuGameOver || gomokuCurrentPlayer !== 'black') return;
            var rect = canvas.getBoundingClientRect();
            var scaleX = canvas.width / rect.width;
            var scaleY = canvas.height / rect.height;
            var x = Math.floor((e.clientX - rect.left) * scaleX);
            var y = Math.floor((e.clientY - rect.top) * scaleY);
            var cellSize = canvas.width / (gomokuSize + 1);
            var col = Math.round(x / cellSize - 0.5);
            var row = Math.round(y / cellSize - 0.5);
            if (row >= 0 && row < gomokuSize && col >= 0 && col < gomokuSize && !gomokuBoard[row][col]) {
                placeGomokuPiece(row, col, 'black');
            }
        };
    }
}

function placeGomokuPiece(row, col, player) {
    gomokuBoard[row][col] = player;
    renderGomokuBoard();
    if (checkGomokuWin(row, col, player)) {
        gomokuGameOver = true;
        if (player === 'black') {
            document.getElementById('gomokuInfo').textContent = '你赢了！';
            showToast('五子棋：你赢了！');
            addSystemMsg('我在五子棋中获胜了！');
        } else {
            document.getElementById('gomokuInfo').textContent = '对手赢了！';
            showToast('五子棋：对手赢了');
            addSystemMsg('我在五子棋中输给了对方...');
        }
        return;
    }
    // 和棋检查
    var hasSpace = false;
    for (var i = 0; i < gomokuSize; i++) {
        for (var j = 0; j < gomokuSize; j++) {
            if (!gomokuBoard[i][j]) { hasSpace = true; break; }
        }
    }
    if (!hasSpace) {
        gomokuGameOver = true;
        document.getElementById('gomokuInfo').textContent = '平局！';
        showToast('五子棋：平局');
        return;
    }
    // 切换玩家
    if (player === 'black') {
        gomokuCurrentPlayer = 'white';
        document.getElementById('gomokuInfo').textContent = '对手思考中...';
        setTimeout(function() {
            aiGomokuMove();
        }, 300);
    } else {
        gomokuCurrentPlayer = 'black';
        document.getElementById('gomokuInfo').textContent = '轮到你了，点击棋盘落子';
    }
}

function aiGomokuMove() {
    if (gomokuGameOver) return;
    // 简单贪心：评估每个空位分数
    var bestScore = -1;
    var bestMove = null;
    for (var i = 0; i < gomokuSize; i++) {
        for (var j = 0; j < gomokuSize; j++) {
            if (!gomokuBoard[i][j]) {
                var score = evaluateGomokuPosition(i, j, 'white') + evaluateGomokuPosition(i, j, 'black') * 0.8;
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = { row: i, col: j };
                }
            }
        }
    }
    if (bestMove) {
        placeGomokuPiece(bestMove.row, bestMove.col, 'white');
    }
}

function evaluateGomokuPosition(row, col, player) {
    var directions = [[1,0],[0,1],[1,1],[1,-1]];
    var totalScore = 0;
    var board = gomokuBoard;
    for (var d = 0; d < directions.length; d++) {
        var count = 1;
        var openLeft = false, openRight = false;
        var dr = directions[d][0], dc = directions[d][1];
        // 正方向
        var r = row + dr, c = col + dc;
        while (r >= 0 && r < gomokuSize && c >= 0 && c < gomokuSize && board[r][c] === player) {
            count++; r += dr; c += dc;
        }
        if (r >= 0 && r < gomokuSize && c >= 0 && c < gomokuSize && !board[r][c]) openRight = true;
        // 反方向
        r = row - dr; c = col - dc;
        while (r >= 0 && r < gomokuSize && c >= 0 && c < gomokuSize && board[r][c] === player) {
            count++; r -= dr; c -= dc;
        }
        if (r >= 0 && r < gomokuSize && c >= 0 && c < gomokuSize && !board[r][c]) openLeft = true;
        // 评分
        if (count >= 5) totalScore += 100000;
        else if (count === 4) {
            if (openLeft || openRight) totalScore += 10000;
            else totalScore += 100;
        } else if (count === 3) {
            if (openLeft && openRight) totalScore += 5000;
            else if (openLeft || openRight) totalScore += 500;
            else totalScore += 50;
        } else if (count === 2) {
            if (openLeft && openRight) totalScore += 200;
            else if (openLeft || openRight) totalScore += 20;
        }
    }
    return totalScore;
}

function checkGomokuWin(row, col, player) {
    var directions = [[1,0],[0,1],[1,1],[1,-1]];
    for (var d = 0; d < directions.length; d++) {
        var count = 1;
        var dr = directions[d][0], dc = directions[d][1];
        var r = row + dr, c = col + dc;
        while (r >= 0 && r < gomokuSize && c >= 0 && c < gomokuSize && gomokuBoard[r][c] === player) {
            count++; r += dr; c += dc;
        }
        r = row - dr; c = col - dc;
        while (r >= 0 && r < gomokuSize && c >= 0 && c < gomokuSize && gomokuBoard[r][c] === player) {
            count++; r -= dr; c -= dc;
        }
        if (count >= 5) return true;
    }
    return false;
}

function undoGomoku() {
    // 简易悔棋：移除最近两个棋子（玩家+AI）
    if (gomokuGameOver) return;
    var moves = [];
    for (var i = 0; i < gomokuSize; i++) {
        for (var j = 0; j < gomokuSize; j++) {
            if (gomokuBoard[i][j]) moves.push({ row: i, col: j, player: gomokuBoard[i][j] });
        }
    }
    if (moves.length < 2) return;
    var last = moves.pop();
    gomokuBoard[last.row][last.col] = null;
    if (moves.length > 0) {
        var prev = moves.pop();
        gomokuBoard[prev.row][prev.col] = null;
    }
    gomokuCurrentPlayer = 'black';
    gomokuGameOver = false;
    renderGomokuBoard();
    document.getElementById('gomokuInfo').textContent = '已悔棋，轮到你了';
}

function renderGomokuBoard() {
    var canvas = document.getElementById('gomokuCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var size = canvas.width;
    var cellSize = size / (gomokuSize + 1);
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--item-bg').trim() || '#faf7f4';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--border').trim() || '#e8d5c4';
    ctx.lineWidth = 1;
    for (var i = 0; i < gomokuSize; i++) {
        ctx.beginPath();
        ctx.moveTo(cellSize, cellSize * (i + 1));
        ctx.lineTo(cellSize * gomokuSize, cellSize * (i + 1));
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cellSize * (i + 1), cellSize);
        ctx.lineTo(cellSize * (i + 1), cellSize * gomokuSize);
        ctx.stroke();
    }
    // 画棋子
    for (var r = 0; r < gomokuSize; r++) {
        for (var c = 0; c < gomokuSize; c++) {
            if (gomokuBoard[r][c]) {
                var cx = cellSize * (c + 1);
                var cy = cellSize * (r + 1);
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.4, 0, Math.PI * 2);
                ctx.fillStyle = gomokuBoard[r][c] === 'black' ? '#2c2420' : '#f5f0eb';
                ctx.fill();
                ctx.strokeStyle = '#4a3728';
                ctx.stroke();
            }
        }
    }
}

function exitGomoku() {
    closeModal('subOverlay');
    setInputMode('normal');
}

// ==================== 剧本杀 ====================
var murderGameState = null;

function openMurderMystery() {
    if (currentGame && currentGame !== 'murder') {
        if (!confirm('当前有进行中的游戏，确定要切换吗？')) return;
    }
    closeModal('subOverlay');
    var html = '<h4>剧本杀</h4>';
    html += '<div class="subtitle">选择剧本开始推理</div>';
    html += '<div class="btn-row"><button class="btn-sm" onclick="uploadMurderScript()">上传 JSON 剧本</button></div>';
    html += '<div style="max-height:300px;overflow-y:auto;margin-top:10px;" id="murderScriptList">';
    html += '<div style="text-align:center;color:var(--text-system);padding:10px;">点击按钮上传剧本文件</div>';
    html += '</div>';
    html += '<button class="btn-close" onclick="closeModal(\'subOverlay\')">关闭</button>';
    openSubModal(html);
    renderMurderScriptList();
}

function renderMurderScriptList() {
    var list = document.getElementById('murderScriptList');
    if (!list) return;
    // 剧本列表从 IndexedDB 加载
    openDB().then(function(db) {
        var tx = db.transaction('scripts', 'readonly');
        var store = tx.objectStore('scripts');
        var request = store.getAll();
        request.onsuccess = function() {
            var scripts = request.result || [];
            if (scripts.length === 0) {
                list.innerHTML = '<div style="text-align:center;color:var(--text-system);padding:10px;">暂无剧本，请上传 JSON 文件</div>';
            } else {
                list.innerHTML = '';
                scripts.forEach(function(script) {
                    var div = document.createElement('div');
                    div.className = 'book-list-item';
                    div.textContent = script.title + ' (' + script.chapters.length + '章)';
                    div.onclick = function() {
                        startMurderGame(script);
                    };
                    list.appendChild(div);
                });
            }
        };
    });
}

function uploadMurderScript() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function() {
        var file = input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var scriptData = JSON.parse(e.target.result);
                if (!scriptData.title || !scriptData.chapters || !Array.isArray(scriptData.chapters)) {
                    throw new Error('剧本格式错误');
                }
                scriptData.id = 'script_' + Date.now();
                // 存入 IndexedDB
                openDB().then(function(db) {
                    var tx = db.transaction('scripts', 'readwrite');
                    var store = tx.objectStore('scripts');
                    store.put(scriptData);
                    tx.oncomplete = function() {
                        showToast('剧本已上传');
                        renderMurderScriptList();
                    };
                });
            } catch(err) {
                showToast('剧本文件格式不正确');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function startMurderGame(script) {
    closeModal('subOverlay');
    setInputMode('game', 'murder');
    
    murderGameState = {
        script: script,
        currentChapter: 0,
        currentScene: 0,
        collectedClues: [],
        markedClues: [], // 已分析的线索
        playerRole: '侦探', // 默认
        progress: {}
    };
    
    addSystemMsg('【剧本杀】' + script.title + ' - 游戏开始！');
    addSystemMsg('你是一名侦探，正在调查一桩案件。输入框已变为选项模式，请根据线索推理。');
    proceedMurderScene();
}

function proceedMurderScene() {
    if (!murderGameState) return;
    var script = murderGameState.script;
    var ch = murderGameState.currentChapter;
    var sc = murderGameState.currentScene;
    if (ch >= script.chapters.length) {
        endMurderGame();
        return;
    }
    var chapter = script.chapters[ch];
    if (sc >= chapter.scenes.length) {
        // 章节结束，进入下一章
        murderGameState.currentChapter++;
        murderGameState.currentScene = 0;
        if (murderGameState.currentChapter < script.chapters.length) {
            addSystemMsg('--- 第' + (murderGameState.currentChapter + 1) + '章：' + script.chapters[murderGameState.currentChapter].title + ' ---');
            proceedMurderScene();
        } else {
            endMurderGame();
        }
        return;
    }
    var scene = chapter.scenes[sc];
    
    // 显示旁白
    if (scene.narration) {
        addSystemMsg(scene.narration);
    }
    
    // 显示角色台词
    if (scene.dialogues) {
        scene.dialogues.forEach(function(line) {
            var role = line.role || '???';
            var cls = line.roleClass || 'role-a';
            addMessageWithRole(line.text, role, cls);
        });
    }
    
    // 收集线索
    if (scene.clues) {
        scene.clues.forEach(function(clue) {
            if (murderGameState.collectedClues.indexOf(clue.id) === -1) {
                murderGameState.collectedClues.push(clue.id);
            }
        });
        var clueText = scene.clues.map(function(c) { return c.description; }).join('  ');
        addSystemMsg('[线索] ' + clueText);
    }
    
    // 显示选项
    if (scene.choices && scene.choices.length > 0) {
        showMurderChoices(scene.choices);
    } else if (scene.nextSceneId) {
        // 自动推进
        var next = findSceneById(script, scene.nextSceneId);
        if (next) {
            murderGameState.currentScene = next.sceneIndex;
            proceedMurderScene();
        }
    } else {
        // 没有选项也没有 next，章节结束
        murderGameState.currentScene++;
        proceedMurderScene();
    }
}

function findSceneById(script, sceneId) {
    for (var c = 0; c < script.chapters.length; c++) {
        var scenes = script.chapters[c].scenes;
        for (var s = 0; s < scenes.length; s++) {
            if (scenes[s].id === sceneId) {
                return { chapter: c, sceneIndex: s, scene: scenes[s] };
            }
        }
    }
    return null;
}

function showMurderChoices(choices) {
    var chat = document.getElementById('chat');
    var div = document.createElement('div');
    div.className = 'msg other';
    div.innerHTML = '<div class="bubble"><div class="script-choices" id="murderChoices">' +
        choices.map(function(choice, idx) {
            return '<button class="script-choice-btn" onclick="selectMurderChoice(\'' + choice.nextSceneId + '\')">' + (idx+1) + '. ' + choice.text + '</button>';
        }).join('') +
        '</div></div>';
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function selectMurderChoice(nextSceneId) {
    var btns = document.querySelectorAll('#murderChoices .script-choice-btn');
    btns.forEach(function(b) { b.disabled = true; });
    var next = findSceneById(murderGameState.script, nextSceneId);
    if (next) {
        murderGameState.currentChapter = next.chapter;
        murderGameState.currentScene = next.sceneIndex;
        proceedMurderScene();
    } else {
        addSystemMsg('剧情分支出现错误，游戏终止。');
        endMurderGame();
    }
}

function endMurderGame() {
    setInputMode('normal');
    addSystemMsg('【剧本杀】游戏结束。回顾你收集的线索，看看真相是否如你所想。');
    if (murderGameState.script.truth) {
        addSystemMsg('真相：' + murderGameState.script.truth);
    }
    murderGameState = null;
    gameInProgress = false;
}

// 线索笔记本
function openClueNotebook() {
    if (!murderGameState) {
        showToast('当前没有进行中的剧本');
        return;
    }
    var overlay = document.getElementById('clueNotebookOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'clueNotebookOverlay';
        overlay.className = 'clue-notebook-overlay';
        document.body.appendChild(overlay);
    }
    var html = '<div class="clue-notebook">';
    html += '<h4>线索笔记本</h4>';
    html += '<div class="subtitle">点击线索标记分析 (已分析: ' + murderGameState.markedClues.length + '/' + murderGameState.collectedClues.length + ')</div>';
    var script = murderGameState.script;
    var allClues = [];
    script.chapters.forEach(function(ch) {
        ch.scenes.forEach(function(sc) {
            if (sc.clues) {
                sc.clues.forEach(function(c) { allClues.push(c); });
            }
        });
    });
    murderGameState.collectedClues.forEach(function(clueId) {
        var clue = allClues.find(function(c) { return c.id === clueId; });
        if (clue) {
            var marked = murderGameState.markedClues.indexOf(clueId) !== -1;
            html += '<div class="clue-item' + (marked ? ' marked' : '') + '" onclick="toggleClueMark(\'' + clueId + '\')">';
            html += '<span class="clue-check">' + (marked ? '[X]' : '[ ]') + '</span>';
            html += '<span>' + escapeHTML(clue.description) + '</span>';
            html += '</div>';
        }
    });
    html += '</div>';
    overlay.innerHTML = html;
    overlay.classList.add('show');
}

function toggleClueMark(clueId) {
    var idx = murderGameState.markedClues.indexOf(clueId);
    if (idx === -1) {
        murderGameState.markedClues.push(clueId);
    } else {
        murderGameState.markedClues.splice(idx, 1);
    }
    openClueNotebook();
}

function closeClueNotebook() {
    var overlay = document.getElementById('clueNotebookOverlay');
    if (overlay) overlay.classList.remove('show');
}

// ==================== 初始化“+”面板游戏入口 ====================
// 在 core.js 的 toggleMorePanel 之后，需要加入游戏入口。我们通过重写渲染方式？
document.addEventListener('DOMContentLoaded', function() {
    // 等待页面加载完成后，在 more-panel-grid-top 中动态添加游戏入口
    setTimeout(function() {
        var grid = document.querySelector('.more-panel-grid-top');
        if (grid) {
            // 避免重复添加
            if (!grid.querySelector('.game-sudoku')) {
                var sudokuBtn = document.createElement('div');
                sudokuBtn.className = 'more-item-text game-sudoku';
                sudokuBtn.textContent = '数独';
                sudokuBtn.onclick = function() { toggleMorePanel(); openSudoku(); };
                grid.appendChild(sudokuBtn);
                
                var gomokuBtn = document.createElement('div');
                gomokuBtn.className = 'more-item-text game-gomoku';
                gomokuBtn.textContent = '五子棋';
                gomokuBtn.onclick = function() { toggleMorePanel(); openGomoku(); };
                grid.appendChild(gomokuBtn);
                
                var murderBtn = document.createElement('div');
                murderBtn.className = 'more-item-text game-murder';
                murderBtn.textContent = '剧本杀';
                murderBtn.onclick = function() { toggleMorePanel(); openMurderMystery(); };
                grid.appendChild(murderBtn);
            }
        }
    }, 500);
});
