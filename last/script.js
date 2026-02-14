// 音效系統
const AudioSystem = {
    context: null,

    init() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
    },

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

class LotteryBox {
    constructor() {
        this.numbers = [];
        this.drawnNumbers = [];
        this.isDrawing = false;

        this.bgMusic = document.getElementById('bgMusic');
        this.musicControl = document.getElementById('musicControl');
        this.isMusicPlaying = false;

        this.currentDrawnNumber = null;
        this.isViewingHistoryPrize = false;

        // ✅ 參賽者（自行改名單）
        this.participants = [
            '大哥', 
            '大嫂', 
            '二哥', 
            '二嫂',
            '三哥',
            '三嫂',
            '四哥',
            '四嫂',
            '五哥',
            '五嫂',
            '大姊',
            '姊夫',
            '生惠'
        ];
        this.remainingParticipants = [];
        this.currentParticipant = null;

        // ✅ 記錄：號碼 -> 得獎者
        this.winners = {};

        // ✅ 獎項池（你改這裡，導覽第二頁會自動統計）
        this.prizePool = [
            '🏆 2000刮刮樂',
            '🥈 1000刮刮樂',
            '🥈 1000刮刮樂',
            '🥉 500刮刮樂',
            '🥉 500刮刮樂',
            '🥉 500刮刮樂',
            '🎖️ 300刮刮樂',
            '🎁 200刮刮樂',
            '🎁 200刮刮樂',
            '🎁 200刮刮樂',
            '🎁 200刮刮樂',
            '🎁 200刮刮樂',
            '🎁 200刮刮樂'
        ];
        this.prizes = {};

        // 吉祥話
        this.blessings = [
            '馬到成功\n鴻圖大展',
            '駿馬奔騰\n財運亨通',
            '馬躍青雲\n步步高升',
            '龍馬精神\n萬事順心',
            '馬氣沖天\n好運連連',
            '萬馬齊發\n前程似錦',
            '馬上得利\n富貴滿堂',
            '策馬揚鞭\n志業高飛',
            '駿馬呈祥\n福星高照',
            '躍馬迎春\n喜氣盈門',
            '天馬騰空\n創新無限',
            '金馬賀歲\n吉祥如意',
            '馬年行運\n事事如意'
        ];
        this.availableBlessings = [...this.blessings];

        this.init();                 // 只初始化 UI，不開始抽
        this.setupEventListeners();
        this.createCoins();
        this.autoPlayMusic();

        // ✅ 先鎖抽獎按鈕：等「活動開始」才開放
        const btn = document.getElementById('drawButton');
        if (btn) btn.disabled = true;
    }

    autoPlayMusic() {
        this.bgMusic.play().then(() => {
            this.isMusicPlaying = true;
            this.musicControl.classList.remove('muted');
        }).catch(() => {
            this.musicControl.classList.add('muted');
            document.addEventListener('click', () => {
                if (!this.isMusicPlaying) {
                    this.bgMusic.play().then(() => {
                        this.isMusicPlaying = true;
                        this.musicControl.classList.remove('muted');
                    }).catch(() => { });
                }
            }, { once: true });
        });
    }

    init() {
        this.numbers = Array.from({ length: 13 }, (_, i) => i + 1);
        this.drawnNumbers = [];
        this.currentDrawnNumber = null;
        this.winners = {};
        this.availableBlessings = [...this.blessings];

        this.shufflePrizes();
        this.updateDisplay();

        this.resetParticipants();
        this.updateTurnUI(); // ✅ 不自動開始
    }

    // ✅ 按「活動開始」才會呼叫：正式開始遊戲並抽第一位
    startGameFromIntro() {
        // 保證乾淨狀態（你也可以不重置，但活動開始通常要乾淨）
        this.init();

        // 抽第一位並跳 turnModal
        this.pickNextParticipant(true);
    }

    shufflePrizes() {
        const shuffledPrizes = [...this.prizePool];
        for (let i = shuffledPrizes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledPrizes[i], shuffledPrizes[j]] = [shuffledPrizes[j], shuffledPrizes[i]];
        }

        this.prizes = {};
        for (let i = 1; i <= 13; i++) {
            this.prizes[i] = shuffledPrizes[i - 1];
        }
    }

    setupEventListeners() {
        document.getElementById('drawButton').addEventListener('click', () => this.draw());
        document.getElementById('resetButton').addEventListener('click', () => this.reset());

        this.musicControl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMusic();
        });

        // 吉祥話
        document.getElementById('closeModal').addEventListener('click', () => this.closeBlessing());
        document.getElementById('redEnvelopeOverlay').addEventListener('click', () => this.closeBlessing());

        // 獎項
        document.getElementById('closePrizeModal').addEventListener('click', () => this.closePrize());
        document.getElementById('prizeOverlay').addEventListener('click', () => this.closePrize());

        // 輪到誰抽
        document.getElementById('closeTurnModal').addEventListener('click', () => this.closeTurnModal());
        document.getElementById('turnOverlay').addEventListener('click', () => this.closeTurnModal());

        // 完成彈窗
        document.getElementById('completeButton')?.addEventListener('click', () => this.closeComplete());
    }

    toggleMusic() {
        if (this.isMusicPlaying) {
            this.bgMusic.pause();
            this.musicControl.classList.add('muted');
            this.isMusicPlaying = false;
        } else {
            this.bgMusic.play().catch(() => { });
            this.musicControl.classList.remove('muted');
            this.isMusicPlaying = true;
        }
    }

    createCoins() {
        for (let i = 0; i < 8; i++) {
            const coin = document.createElement('div');
            coin.className = 'coin decoration';
            coin.style.left = Math.random() * 100 + '%';
            coin.style.animationDelay = Math.random() * 4 + 's';
            document.body.appendChild(coin);
        }
    }

    // ===== 參賽者 =====
    resetParticipants() {
        this.remainingParticipants = [...this.participants];
        this.currentParticipant = null;
        this.updateTurnUI();
    }

    pickNextParticipant(isFirst = false) {
        if (this.remainingParticipants.length === 0) {
            this.currentParticipant = null;
            this.updateTurnUI();
            const btn = document.getElementById('drawButton');
            btn.disabled = true;
            btn.textContent = '👥 參賽者抽完了';
            return;
        }

        const idx = Math.floor(Math.random() * this.remainingParticipants.length);
        this.currentParticipant = this.remainingParticipants.splice(idx, 1)[0];
        this.updateTurnUI();
        this.showTurnModal(isFirst);
    }

    updateTurnUI() {
        const btn = document.getElementById('drawButton');
        if (!btn) return;

        if (!this.currentParticipant) {
            btn.textContent = '🎊 開始抽獎 🎊';
            return;
        }
        btn.textContent = `🎊 ${this.currentParticipant} 開始抽獎 🎊`;
    }

    showTurnModal() {
        if (!this.currentParticipant) return;

        const modal = document.getElementById('turnModal');
        const nameEl = document.getElementById('turnName');
        nameEl.textContent = this.currentParticipant;

        modal.classList.add('show');

        // ✅ 還沒按確定前，不給抽
        const btn = document.getElementById('drawButton');
        btn.disabled = true;
    }

    closeTurnModal() {
        document.getElementById('turnModal').classList.remove('show');

        // ✅ 關掉後才可抽
        const btn = document.getElementById('drawButton');
        if (this.numbers.length > 0) btn.disabled = false;
    }

    // 顯示活動完成彈窗
    showComplete() {
        const modal = document.getElementById('completeModal');
        if (modal) {
            modal.classList.add('show');
        }

        const button = document.getElementById('drawButton');
        button.textContent = '🎊 全部抽完！🎊';
        button.disabled = true;
    }

    // 關閉完成彈窗
    closeComplete() {
        const modal = document.getElementById('completeModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    // ===== 抽獎 =====
    async draw() {
        if (this.isDrawing || this.numbers.length === 0) return;
        if (!this.currentParticipant) return;

        this.isDrawing = true;

        const button = document.getElementById('drawButton');
        const resultNumber = document.getElementById('resultNumber');

        button.disabled = true;
        resultNumber.style.display = 'block';
        resultNumber.classList.add('rolling');

        // 滾動動畫
        const rollDuration = 2000;
        const rollInterval = 100;
        const rollTimes = rollDuration / rollInterval;

        for (let i = 0; i < rollTimes; i++) {
            AudioSystem.playDrum();
            resultNumber.textContent = Math.floor(Math.random() * 13) + 1;
            await this.sleep(rollInterval);
        }

        // 抽號碼
        const randomIndex = Math.floor(Math.random() * this.numbers.length);
        const drawnNumber = this.numbers.splice(randomIndex, 1)[0];
        this.drawnNumbers.push(drawnNumber);
        this.currentDrawnNumber = drawnNumber;

        // ✅ 記錄誰中
        this.winners[drawnNumber] = this.currentParticipant;

        resultNumber.classList.remove('rolling');
        resultNumber.textContent = drawnNumber;
        resultNumber.classList.add('pop');

        AudioSystem.playWin();
        this.createParticles();

        setTimeout(() => resultNumber.classList.remove('pop'), 500);

        this.updateDisplay();
        this.isDrawing = false;

        // 顯示吉祥話
        setTimeout(() => this.showBlessing(), 300);
    }

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

    showBlessing() {
        const modal = document.getElementById('redEnvelopeModal');
        const blessingText = document.getElementById('blessingText');

        if (this.availableBlessings.length === 0) {
            this.availableBlessings = [...this.blessings];
        }

        const randomIndex = Math.floor(Math.random() * this.availableBlessings.length);
        const blessing = this.availableBlessings.splice(randomIndex, 1)[0];

        blessingText.innerHTML = blessing.replace(/\n/g, '<br>');
        modal.classList.add('show');
    }

    closeBlessing() {
        document.getElementById('redEnvelopeModal').classList.remove('show');
        setTimeout(() => this.showPrize(), 200);
    }

    showPrize() {
        const modal = document.getElementById('prizeModal');

        document.getElementById('prizeNumber').textContent = this.currentDrawnNumber;
        document.getElementById('prizeAward').textContent = this.prizes[this.currentDrawnNumber];

        const winnerEl = document.getElementById('prizeWinner');
        if (winnerEl) winnerEl.textContent = this.winners[this.currentDrawnNumber] || '（未知）';

        this.isViewingHistoryPrize = false;
        modal.classList.add('show');
    }

    showPrizeByNumber(number) {
        const modal = document.getElementById('prizeModal');

        document.getElementById('prizeNumber').textContent = number;
        document.getElementById('prizeAward').textContent = this.prizes[number];

        const winnerEl = document.getElementById('prizeWinner');
        if (winnerEl) winnerEl.textContent = this.winners[number] || '（未知）';

        this.isViewingHistoryPrize = true;
        modal.classList.add('show');
    }

    closePrize() {
        document.getElementById('prizeModal').classList.remove('show');

        // 點歷史獎項：不要換下一位
        if (this.isViewingHistoryPrize) return;

        // 全抽完：顯示完成彈窗
        if (this.numbers.length === 0) {
            setTimeout(() => this.showComplete(), 300);
            return;
        }

        // ✅ 換下一位（並跳 turnModal）
        setTimeout(() => this.pickNextParticipant(false), 150);
    }

    updateDisplay() {
        document.getElementById('remaining').textContent = this.numbers.length;
        document.getElementById('drawnCount').textContent = this.drawnNumbers.length;

        const drawnContainer = document.getElementById('drawnNumbers');
        drawnContainer.innerHTML = '';

        this.drawnNumbers.forEach(num => {
            const el = document.createElement('div');
            el.className = 'drawn-number';
            el.textContent = num;
            el.style.cursor = 'pointer';
            el.title = '點擊查看：誰中 + 獎項';
            el.addEventListener('click', () => this.showPrizeByNumber(num));
            drawnContainer.appendChild(el);
        });
    }

    reset() {
        if (!confirm('確定要重新開始嗎？')) return;

        AudioSystem.playReset();

        // 關閉所有彈窗
        document.getElementById('redEnvelopeModal').classList.remove('show');
        document.getElementById('prizeModal').classList.remove('show');
        document.getElementById('turnModal').classList.remove('show');

        // 重新初始化（但不直接開始）
        this.init();

        // 回到導覽
        document.getElementById('introModal').classList.add('show');

        // 抽獎按鈕鎖住
        const btn = document.getElementById('drawButton');
        btn.disabled = true;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ===== 導覽：獎項清單自動統計（依 prizePool 產生）=====
function buildPrizeListHTML(prizePool) {
    const counts = new Map();
    prizePool.forEach(p => counts.set(p, (counts.get(p) || 0) + 1));

    const items = Array.from(counts.entries())
        .map(([name, qty]) => `<li>${name} × ${qty}</li>`)
        .join('');

    return `<ul class="scroll-list">${items}</ul>`;
}

// 啟動（設為全域，導覽要用）
window.lottery = new LotteryBox();

// ===== 開場捲軸導覽（3頁）=====
const introPages = [
    {
        title: '第一屆 吳家馬年摸彩節目',
        sub: '今年總獎金高達 <span class="gold">7000</span> 元！',
        type: 'intro'
    },
    {
        title: '本次獎項清單',
        sub: '本次獎項如下',
        type: 'prizes'
    },
    {
        title: '遊戲規則',
        sub: '準備開始開抽囉！',
        type: 'rules'
    }
];

(function setupIntro() {
  const modal = document.getElementById('introModal');
  if (!modal) return;

  const openBtn = document.getElementById('introOpen');

  const titleEl = document.getElementById('introTitle');
  const subEl = document.getElementById('introSub');
  const bodyEl = document.getElementById('introBody');

  const prevBtn = document.getElementById('introPrev');
  const nextBtn = document.getElementById('introNext');
  const startBtn = document.getElementById('introStart');
  const dotsEl = document.getElementById('introDots');

  let idx = 0;

  const renderDots = () => {
    dotsEl.innerHTML = '';
    introPages.forEach((_, i) => {
      const d = document.createElement('div');
      d.className = 'scroll-dot' + (i === idx ? ' active' : '');
      dotsEl.appendChild(d);
    });
  };

  const render = () => {
    const p = introPages[idx];
    titleEl.textContent = p.title;
    subEl.innerHTML = p.sub;

    if (p.type === 'intro') {
      bodyEl.innerHTML = `
        <ul class="scroll-list">
          <li>第一屆 吳家摸彩節目開跑！</li>
          <li>本次抽號碼：1～13</li>
          <li>每輪會提示「本輪抽獎者」</li>
          <li>抽到會顯示吉祥話 + 獎項</li>
        </ul>
      `;
    } else if (p.type === 'prizes') {
      bodyEl.innerHTML = buildPrizeListHTML(window.lottery.prizePool);
    } else {
      bodyEl.innerHTML = `
        <ul class="scroll-list">
          <li>點「活動開始」後，先抽出第一位抽獎者</li>
          <li>每抽完一個號碼 → 自動換下一位</li>
          <li>右側「已抽出號碼」可點查看：誰中 + 中什麼獎</li>
        </ul>
      `;
    }

    prevBtn.disabled = idx === 0;
    const isLast = idx === introPages.length - 1;
    nextBtn.style.display = isLast ? 'none' : '';
    startBtn.style.display = isLast ? '' : 'none';

    renderDots();
  };

  prevBtn.addEventListener('click', () => { idx = Math.max(0, idx - 1); render(); });
  nextBtn.addEventListener('click', () => { idx = Math.min(introPages.length - 1, idx + 1); render(); });

  // ✅ 先按「開始」才觸發捲軸左右打開 + 內容淡入
  openBtn.addEventListener('click', () => {
    modal.classList.remove('intro-closed');
    modal.classList.add('intro-open');
    render();
  });

  // ✅ 最後頁的「活動開始」
  startBtn.addEventListener('click', () => {
    modal.classList.remove('show');
    modal.classList.remove('intro-open');
    modal.classList.add('intro-closed'); // 下次 reset 還能再用卷起來

    window.lottery.startGameFromIntro(); // 跳本輪誰抽
  });

  // 初始狀態：卷起來，不先 render（避免內容先閃一下）
  modal.classList.add('intro-closed');
})();