// 音效系統
const AudioSystem = {
    context: null,
    
    init() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
    },
    
    // 鼓聲效果
    playDrum() {
        if (!this.context) this.init();
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.frequency.value = 100;
        gain.gain.setValueAtTime(0.3, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
        
        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + 0.1);
    },
    
    // 中獎音效
    playWin() {
        if (!this.context) this.init();
        const notes = [523.25, 587.33, 659.25, 783.99];
        
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const osc = this.context.createOscillator();
                const gain = this.context.createGain();
                
                osc.connect(gain);
                gain.connect(this.context.destination);
                
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.2, this.context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);
                
                osc.start(this.context.currentTime);
                osc.stop(this.context.currentTime + 0.3);
            }, i * 100);
        });
    },
    
    // 重置音效
    playReset() {
        if (!this.context) this.init();
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.frequency.setValueAtTime(800, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this.context.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
        
        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + 0.2);
    }
};

// 摸彩箱系統
class LotteryBox {
    constructor() {
        this.numbers = [];
        this.drawnNumbers = [];
        this.isDrawing = false;
        this.bgMusic = document.getElementById('bgMusic');
        this.musicControl = document.getElementById('musicControl');
        this.isMusicPlaying = false;
        this.init();
        this.setupEventListeners();
        this.createCoins();
        this.autoPlayMusic();
    }

    // 自動播放音樂
    autoPlayMusic() {
        // 嘗試自動播放
        this.bgMusic.play().then(() => {
            this.isMusicPlaying = true;
            this.musicControl.classList.remove('muted');
        }).catch(e => {
            // 如果瀏覽器阻止自動播放，等待用戶第一次互動
            console.log('需要用戶互動才能播放音樂');
            this.musicControl.classList.add('muted');
            // 添加全局點擊監聽，第一次點擊時播放
            document.addEventListener('click', () => {
                if (!this.isMusicPlaying) {
                    this.bgMusic.play().then(() => {
                        this.isMusicPlaying = true;
                        this.musicControl.classList.remove('muted');
                    }).catch(() => {});
                }
            }, { once: true });
        });
    }

    init() {
        this.numbers = Array.from({length: 30}, (_, i) => i + 1);
        this.drawnNumbers = [];
        this.updateDisplay();
    }

    setupEventListeners() {
        document.getElementById('drawButton').addEventListener('click', () => this.draw());
        document.getElementById('resetButton').addEventListener('click', () => this.reset());
        
        // 燈籠音樂控制
        this.musicControl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMusic();
        });
    }

    // 音樂開關
    toggleMusic() {
        if (this.isMusicPlaying) {
            this.bgMusic.pause();
            this.musicControl.classList.add('muted');
            this.isMusicPlaying = false;
        } else {
            this.bgMusic.play().catch(e => {
                console.log('音樂播放需要用戶互動');
            });
            this.musicControl.classList.remove('muted');
            this.isMusicPlaying = true;
        }
    }

    // 創建金幣特效
    createCoins() {
        for (let i = 0; i < 8; i++) {
            const coin = document.createElement('div');
            coin.className = 'coin decoration';
            coin.style.left = Math.random() * 100 + '%';
            coin.style.animationDelay = Math.random() * 4 + 's';
            document.body.appendChild(coin);
        }
    }

    // 抽獎
    async draw() {
        if (this.isDrawing || this.numbers.length === 0) return;
        
        this.isDrawing = true;
        const button = document.getElementById('drawButton');
        const resultNumber = document.getElementById('resultNumber');
        
        button.disabled = true;
        resultNumber.style.display = 'block';
        resultNumber.classList.add('rolling');
        
        // 滾動數字動畫
        const rollDuration = 2000;
        const rollInterval = 100;
        const rollTimes = rollDuration / rollInterval;
        
        for (let i = 0; i < rollTimes; i++) {
            AudioSystem.playDrum();
            resultNumber.textContent = Math.floor(Math.random() * 30) + 1;
            await this.sleep(rollInterval);
        }
        
        // 抽出號碼
        const randomIndex = Math.floor(Math.random() * this.numbers.length);
        const drawnNumber = this.numbers.splice(randomIndex, 1)[0];
        this.drawnNumbers.push(drawnNumber);
        
        resultNumber.classList.remove('rolling');
        resultNumber.textContent = drawnNumber;
        resultNumber.classList.add('pop');
        
        // 播放中獎音效
        AudioSystem.playWin();
        
        // 粒子特效
        this.createParticles();
        
        setTimeout(() => {
            resultNumber.classList.remove('pop');
        }, 500);
        
        this.updateDisplay();
        this.isDrawing = false;
        button.disabled = this.numbers.length === 0;
        
        if (this.numbers.length === 0) {
            button.textContent = '🎊 全部抽完！🎊';
        }
    }

    // 創建粒子特效
    createParticles() {
        const particles = ['🎊', '🎉', '✨', '🌟', '💰', '🧧', '🐴'];
        const particleCount = 15;
        
        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.textContent = particles[Math.floor(Math.random() * particles.length)];
                particle.style.left = (Math.random() * 80 + 10) + '%';
                particle.style.top = '50%';
                document.body.appendChild(particle);
                
                setTimeout(() => particle.remove(), 2000);
            }, i * 50);
        }
    }

    // 更新顯示
    updateDisplay() {
        document.getElementById('remaining').textContent = this.numbers.length;
        document.getElementById('drawnCount').textContent = this.drawnNumbers.length;
        
        const drawnContainer = document.getElementById('drawnNumbers');
        drawnContainer.innerHTML = '';
        
        this.drawnNumbers.forEach(num => {
            const numElement = document.createElement('div');
            numElement.className = 'drawn-number';
            numElement.textContent = num;
            drawnContainer.appendChild(numElement);
        });
    }

    // 重置
    reset() {
        if (confirm('確定要重新開始嗎？')) {
            AudioSystem.playReset();
            this.init();
            document.getElementById('resultNumber').style.display = 'none';
            document.getElementById('drawButton').textContent = '🎊 開始抽獎 🎊';
            document.getElementById('drawButton').disabled = false;
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 啟動應用
const lottery = new LotteryBox();
