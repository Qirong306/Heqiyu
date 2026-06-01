// ==================== 随机画图模块 ====================
const RandomDrawing = {
    // 图形库（规则图形）
    shapes: ['circle', 'square', 'triangle', 'star', 'heart'],
    // 生成随机画布图片（宽200，高200）
    generateCanvas: (type) => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f9f3e6';
        ctx.fillRect(0, 0, 200, 200);
        
        // 随机颜色
        const colors = ['#FFB6C1', '#87CEEB', '#FFD700', '#98FB98', '#DDA0DD'];
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        
        if (type === 'circle') {
            ctx.beginPath();
            ctx.arc(100, 100, 60, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        } else if (type === 'square') {
            ctx.fillRect(50, 50, 100, 100);
            ctx.strokeRect(50, 50, 100, 100);
        } else if (type === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(100, 30);
            ctx.lineTo(170, 150);
            ctx.lineTo(30, 150);
            ctx.fill();
            ctx.stroke();
        } else if (type === 'star') {
            this.drawStar(ctx, 100, 100, 5, 50, 25);
            ctx.fill();
            ctx.stroke();
        } else if (type === 'heart') {
            this.drawHeart(ctx, 100, 100, 50);
            ctx.fill();
            ctx.stroke();
        } else if (type === 'randomLines') {
            // 随机线条（涂鸦风格）
            for(let i = 0; i < 30; i++) {
                ctx.beginPath();
                ctx.moveTo(Math.random() * 200, Math.random() * 200);
                ctx.lineTo(Math.random() * 200, Math.random() * 200);
                ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)];
                ctx.stroke();
            }
        }
        return canvas.toDataURL(); // 返回 base64 图片
    },
    
    // 绘制星形（辅助）
    drawStar: (ctx, cx, cy, spikes, outerR, innerR) => {
        let rot = Math.PI / 2 * 3;
        let step = Math.PI / spikes;
        ctx.beginPath();
        for(let i = 0; i < spikes; i++) {
            let x = cx + Math.cos(rot) * outerR;
            let y = cy + Math.sin(rot) * outerR;
            ctx.lineTo(x, y);
            rot += step;
            x = cx + Math.cos(rot) * innerR;
            y = cy + Math.sin(rot) * innerR;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.closePath();
    },
    
    // 绘制心形（辅助）
    drawHeart: (ctx, x, y, size) => {
        ctx.beginPath();
        let topCurveHeight = size * 0.3;
        ctx.moveTo(x, y + topCurveHeight);
        ctx.bezierCurveTo(x, y, x - size/2, y, x - size/2, y + topCurveHeight);
        ctx.bezierCurveTo(x - size/2, y + (size + topCurveHeight)/2, x, y + (size + topCurveHeight)/1.5, x, y + size);
        ctx.bezierCurveTo(x, y + (size + topCurveHeight)/1.5, x + size/2, y + (size + topCurveHeight)/2, x + size/2, y + topCurveHeight);
        ctx.bezierCurveTo(x + size/2, y, x, y, x, y + topCurveHeight);
        ctx.closePath();
    },
    
    // 随机选择类型（70%规则图形，30%随机线条）
    getRandomDrawing: () => {
        let type;
        if (Math.random() < 0.7) {
            const shapes = RandomDrawing.shapes;
            type = shapes[Math.floor(Math.random() * shapes.length)];
        } else {
            type = 'randomLines';
        }
        return RandomDrawing.generateCanvas(type);
    }
};

// ==================== 绑定到聊天发送 ====================
// 等待页面加载完成后绑定按钮
document.addEventListener('DOMContentLoaded', () => {
    const drawBtn = document.getElementById('randomDrawBtn');
    if (drawBtn) {
        drawBtn.addEventListener('click', () => {
            const imgData = RandomDrawing.getRandomDrawing();
            // 调用 core.js 中的添加消息函数（请根据实际函数名修改）
            if (typeof addChatMessage === 'function') {
                addChatMessage('system', `<img src="${imgData}" style="max-width:200px; border-radius:8px;">`);
            } else if (typeof appendMessage === 'function') {
                appendMessage('draw', `<img src="${imgData}" style="max-width:200px;">`);
            } else {
                // 降级：在聊天区域直接追加（临时方案）
                const chatArea = document.getElementById('chatMessages');
                if(chatArea) {
                    const msgDiv = document.createElement('div');
                    msgDiv.innerHTML = `<img src="${imgData}" style="max-width:200px;">`;
                    chatArea.appendChild(msgDiv);
                }
            }
        });
    }
});
