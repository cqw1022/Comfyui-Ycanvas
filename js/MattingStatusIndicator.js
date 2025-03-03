// 修改状态指示器类，确保单例模式
export class MattingStatusIndicator {
    static instance = null;
    
    static getInstance(container) {
        if (!MattingStatusIndicator.instance) {
            MattingStatusIndicator.instance = new MattingStatusIndicator(container);
        }
        return MattingStatusIndicator.instance;
    }
    
    constructor(container) {
        this.indicator = document.createElement('div');
        this.indicator.style.cssText = `
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: #808080;
            margin-left: 10px;
            display: inline-block;
            transition: background-color 0.3s;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .processing {
                background-color: #2196F3;
                animation: blink 1s infinite;
            }
            .completed {
                background-color: #4CAF50;
            }
            .error {
                background-color: #f44336;
            }
            @keyframes blink {
                0% { opacity: 1; }
                50% { opacity: 0.4; }
                100% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        container.appendChild(this.indicator);
    }
    
    setStatus(status) {
        this.indicator.className = ''; // 清除所有状态
        if (status) {
            this.indicator.classList.add(status);
        }
        if (status === 'completed') {
            setTimeout(() => {
                this.indicator.classList.remove('completed');
            }, 2000);
        }
    }
}