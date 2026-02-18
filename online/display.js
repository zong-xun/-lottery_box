// 音效系統
// const AudioSystem = {
//     context: null,

//     init() {
//         this.context = new (window.AudioContext || window.webkitAudioContext)();
//     },

//     playDrum() {
//         if (!this.context) this.init();
//         const osc = this.context.createOscillator();
//         const gain = this.context.createGain();

//         osc.connect(gain);
//         gain.connect(this.context.destination);

//         osc.frequency.value = 100;
//         gain.gain.setValueAtTime(0.3*8, this.context.currentTime);
//         gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);

//         osc.start(this.context.currentTime);
//         osc.stop(this.context.currentTime + 0.1);
//     },

//     playWin() {
//         if (!this.context) this.init();
//         const notes = [523.25, 587.33, 659.25, 783.99];

//         notes.forEach((freq, i) => {
//             setTimeout(() => {
//                 const osc = this.context.createOscillator();
//                 const gain = this.context.createGain();

//                 osc.connect(gain);
//                 gain.connect(this.context.destination);

//                 osc.frequency.value = freq;
//                 osc.type = 'sine';
//                 gain.gain.setValueAtTime(0.2, this.context.currentTime);
//                 gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);

//                 osc.start(this.context.currentTime);
//                 osc.stop(this.context.currentTime + 0.3);
//             }, i * 100);
//         });
//     },

//     playReset() {
//         if (!this.context) this.init();
//         const osc = this.context.createOscillator();
//         const gain = this.context.createGain();

//         osc.connect(gain);
//         gain.connect(this.context.destination);

//         osc.frequency.setValueAtTime(800, this.context.currentTime);
//         osc.frequency.exponentialRampToValueAtTime(400, this.context.currentTime + 0.2);
//         gain.gain.setValueAtTime(0.2, this.context.currentTime);
//         gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);

//         osc.start(this.context.currentTime);
//         osc.stop(this.context.currentTime + 0.2);
//     }
// };
// 音效系統（重構後）
const AudioSystem = {
  context: null,
  drumTimer: null,

  init() {
    this.context = new (window.AudioContext || window.webkitAudioContext)();
  },

  // ✅ 單一下「鼓點」（自然、不卡）
  drumHit() {
    if (!this.context) this.init();
    const ctx = this.context;

    // 有些瀏覽器需要 user gesture 後 resume
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.07);

    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.08);
  },

  // ✅ 開始 Drum Roll：用 interval 連打（不會當）
  startDrumRoll() {
    if (this.drumTimer) return; // 已經在打了
    let interval = 90;          // 初始間隔(ms)
    const minInterval = 45;     // 最快間隔(ms)

    // 先敲一下立刻有反應
    this.drumHit();

    this.drumTimer = setInterval(() => {
      this.drumHit();
      // 越來越快（有張力）
      interval = Math.max(minInterval, Math.floor(interval * 0.92));

      // 動態調整 interval：重設 timer
      clearInterval(this.drumTimer);
      this.drumTimer = setInterval(() => this.drumHit(), interval);
    }, interval);
  },

  // ✅ 停止 Drum Roll
  stopDrumRoll() {
    if (this.drumTimer) {
      clearInterval(this.drumTimer);
      this.drumTimer = null;
    }
  },

  // 你原本的 playWin 保留就好（不動）
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
        osc.type = "sine";
        gain.gain.setValueAtTime(0.2, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.28);
        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + 0.28);
      }, i * 90);
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

        this.bgMusic = document.getElementById('bgMusic');        // 遊戲背景音樂
        this.bgMusic1 = document.getElementById('bgMusic1');      // 導覽背景音樂
        this.musicControl = document.getElementById('musicControl');
        this.isMusicPlaying = false;      // 遊戲音樂狀態
        this.isMusicPlaying1 = false;     // 導覽音樂狀態
        this.musicNormalVolume = 0.8;   // 平常音量
        this.musicDrawVolume = 0.25;    // 抽獎時音量
        this.musicFadeMs = 450;         // 淡入淡出時間(ms)

        this.currentDrawnNumber = null;
        this.isViewingHistoryPrize = false;

        // ✅ 參賽者（自行改名單）
        this.participants = [
            '吳老大（阿茂仔）', 
            '伶芝小姐', 
            '吳老二（崁 ㄟ）', 
            '美雲小姐',
            '吳老三（黑鬼仔）',
            '玉婷小姐',
            '吳老？（要叫伍佰）',
            '琇喻小姐',
            '錦芳（阿芳）',
            '靖淳小姐',
            '韻秋（阿秋啊）',
            '清水（阿水啊）',
            '生惠（肉雞）'
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
        this.remainingPrizes = []; // 剩余奖项池

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
                    this.bgMusic.volume = this.musicNormalVolume; // ✅ 新增
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
        this.remainingPrizes = [...this.prizePool]; // 初始化剩余奖项

        this.shufflePrizes();
        this.updateDisplay();
        this.updateWinnerHistory(); // 清空中奖记录显示

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
        this.remainingPrizes = [...this.prizePool]; // 重置剩余奖项
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
            this.bgMusic.play().catch(() => {});
            this.musicControl.classList.remove('muted');
            this.isMusicPlaying = true;
        }
    }
    // ✅ 平滑調整背景音樂音量
    fadeMusicVolume(target, durationMs = 400) {
    if (!this.bgMusic) return;

    const start = this.bgMusic.volume ?? 1;
    const end = Math.max(0, Math.min(1, target));
    const startTime = performance.now();

    const step = (t) => {
        const p = Math.min(1, (t - startTime) / durationMs);
        // easeOut
        const eased = 1 - Math.pow(1 - p, 3);
        this.bgMusic.volume = Math.max(0, Math.min(1, start + (end - start) * eased));

        if (p < 1) requestAnimationFrame(step);
    };

  requestAnimationFrame(step);
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
        AudioSystem.startDrumRoll(); // ✅ 開始鼓點（新的方法）
        // ✅ 抽獎期間音樂調小
        this.fadeMusicVolume(this.musicDrawVolume, this.musicFadeMs);
        const button = document.getElementById('drawButton');
        const resultNumber = document.getElementById('resultNumber');

        button.disabled = true;
        resultNumber.style.display = 'block';
        resultNumber.classList.add('rolling');

        // 滾動動畫 - 方案A：只顯示「抽獎中」
        const rollDuration = 2000;
        const rollInterval = 100;
        const rollTimes = rollDuration / rollInterval;
        const excitingTexts = ['🎊 抽獎中 🎊', '✨ 抽獎中 ✨', '🎉 抽獎中 🎉', '💰 抽獎中 💰', '🧧 抽獎中 🧧'];

        for (let i = 0; i < rollTimes; i++) {
            // AudioSystem.playDrum();
            const dots = '.'.repeat((i % 3) + 1);
            const randomText = excitingTexts[Math.floor(Math.random() * excitingTexts.length)];
            resultNumber.textContent = `${randomText.replace('抽獎中', `抽獎中${dots}`)}`;
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
        AudioSystem.stopDrumRoll(); // ✅ 停止鼓點（新的方式）  
        resultNumber.textContent = `恭喜${this.currentParticipant}中獎`;
        resultNumber.classList.add('pop');


        // ✅ 抽完回復正常音量
        this.fadeMusicVolume(this.musicNormalVolume, this.musicFadeMs);

        AudioSystem.playWin();
        this.createParticles();

        setTimeout(() => resultNumber.classList.remove('pop'), 500);

        this.updateDisplay();
        this.updateWinnerHistory(); // 更新中奖记录
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

        // 方案A：隱藏號碼，只顯示得奬者和獎項
        const prizeNumberEl = document.getElementById('prizeNumber');
        const prizeNumberLabelEl = document.querySelector('.prize-number-label');
        if (prizeNumberEl) prizeNumberEl.style.display = 'none';
        if (prizeNumberLabelEl) prizeNumberLabelEl.style.display = 'none';

        document.getElementById('prizeAward').textContent = this.prizes[this.currentDrawnNumber];

        const winnerEl = document.getElementById('prizeWinner');
        if (winnerEl) winnerEl.textContent = this.winners[this.currentDrawnNumber] || '（未知）';

        this.isViewingHistoryPrize = false;
        modal.classList.add('show');
    }

    showPrizeByNumber(number) {
        const modal = document.getElementById('prizeModal');

        // 方案A：隱藏號碼，只顯示得奬者和獎項
        const prizeNumberEl = document.getElementById('prizeNumber');
        const prizeNumberLabelEl = document.querySelector('.prize-number-label');
        if (prizeNumberEl) prizeNumberEl.style.display = 'none';
        if (prizeNumberLabelEl) prizeNumberLabelEl.style.display = 'none';

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

        // ✅ 现在才从剩余奖项池移除已抽出的奖项
        const drawnPrize = this.prizes[this.currentDrawnNumber];
        const prizeIndex = this.remainingPrizes.indexOf(drawnPrize);
        if (prizeIndex > -1) {
            this.remainingPrizes.splice(prizeIndex, 1);
        }
        
        // 更新剩余奖项显示
        this.updateDisplay();

        // 全抽完：顯示完成彈窗
        if (this.numbers.length === 0) {
            setTimeout(() => this.showComplete(), 300);
            return;
        }

        // ✅ 換下一位（並跳 turnModal）
        setTimeout(() => this.pickNextParticipant(false), 150);
    }

    updateDisplay() {
        // 显示剩余号码数量
        document.getElementById('remaining').textContent = this.numbers.length;

        // 显示剩余奖项列表
        const remainingContainer = document.getElementById('drawnNumbers');
        remainingContainer.innerHTML = '';
        
        // 统计剩余奖项并显示
        const prizeCounts = new Map();
        this.remainingPrizes.forEach(prize => {
            prizeCounts.set(prize, (prizeCounts.get(prize) || 0) + 1);
        });
        
        prizeCounts.forEach((count, prize) => {
            const el = document.createElement('div');
            el.className = 'drawn-number';
            el.textContent = count > 1 ? `${prize} x${count}` : prize;
            remainingContainer.appendChild(el);
        });
    }

    // 新增：更新中奖记录显示
    updateWinnerHistory() {
        const historyContainer = document.getElementById('winnerHistory');
        if (!historyContainer) return;
        
        historyContainer.innerHTML = '';
        
        this.drawnNumbers.forEach(num => {
            const el = document.createElement('div');
            el.className = 'drawn-number';
            const winnerName = this.winners[num] || '（未知）';
            el.textContent = winnerName;
            el.style.cursor = 'pointer';
            el.title = '點擊查看獎項';
            el.addEventListener('click', () => this.showPrizeByNumber(num));
            historyContainer.appendChild(el);
        });
    }

    reset() {
        if (!confirm('確定要重新開始嗎？')) return;

        AudioSystem.playReset();

        // 停止背景音樂
        this.bgMusic.pause();
        this.bgMusic.currentTime = 0;
        this.isMusicPlaying = false;
        this.musicControl.classList.add('muted');

        // 停止並重置導覽音樂
        this.bgMusic1.pause();
        this.bgMusic1.currentTime = 0;
        this.isMusicPlaying1 = false;

        // 關閉所有彈窗
        document.getElementById('redEnvelopeModal').classList.remove('show');
        document.getElementById('prizeModal').classList.remove('show');
        document.getElementById('turnModal').classList.remove('show');

        // 重新初始化（但不直接開始）
        this.init();

        // 重置導覽頁面到第一頁
        if (window.resetIntroPage) window.resetIntroPage();

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
        title: '第一屆 吳家摸彩節目開跑！',
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

  // 暴露重置方法给外部使用
  window.resetIntroPage = () => { idx = 0; };

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
                <div class="intro-art">
                    <div class="intro-title-line">— 龍來你家玩樂爽翻天 —</div>
                    <div class="intro-lines">
                        <p>馬年吉祥福氣來</p>
                        <p>吳家開運旺整年</p>
                        <p>摸彩抽出好彩頭</p>
                        <p>金運財運全都來</p>
                    </div>
                </div>
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

  // 導覽音樂控制
  const playIntroMusic = () => {
    const lottery = window.lottery;
    lottery.bgMusic1.volume = lottery.musicNormalVolume;
    lottery.bgMusic1.play().catch(() => {
      // 瀏覽器不允許自動播放，需要用戶交互
    });
    lottery.isMusicPlaying1 = true;
  };

  const stopIntroMusic = () => {
    const lottery = window.lottery;
    lottery.bgMusic1.pause();
    lottery.isMusicPlaying1 = false;
  };

    
  prevBtn.addEventListener('click', () => { idx = Math.max(0, idx - 1); render(); });
  nextBtn.addEventListener('click', () => { idx = Math.min(introPages.length - 1, idx + 1); render(); });

  // ✅ 先按「開始」才觸發捲軸左右打開 + 內容淡入
  openBtn.addEventListener('click', () => {
    modal.classList.remove('intro-closed');
    modal.classList.add('intro-open');
    playIntroMusic();  // 播放導覽音樂
    render();
  });

  // ✅ 最後頁的「活動開始」
  startBtn.addEventListener('click', () => {
    // 停止導覽音樂
    stopIntroMusic();
    
    // 播放遊戲背景音樂
    const lottery = window.lottery;
    lottery.bgMusic.volume = lottery.musicNormalVolume;
    lottery.bgMusic.play().catch(() => {
      // 瀏覽器不允許自動播放
    });
    lottery.isMusicPlaying = true;
    
    modal.classList.remove('show');
    modal.classList.remove('intro-open');
    modal.classList.add('intro-closed'); // 下次 reset 還能再用卷起來

    lottery.startGameFromIntro(); // 跳本輪誰抽
  });

  // 初始狀態：卷起來，不先 render（避免內容先閃一下）
  modal.classList.add('intro-closed');
})();

// =====================================================
// ✅ Firebase 連線同步（手機端感知目前狀態）
// =====================================================
(function setupFirebase() {
    const firebaseConfig = {
        apiKey: "AIzaSyA8SZpzjbCCaq45MhBej1-I_qkY-_QiS-g",
        authDomain: "lottery-box-70d2f.firebaseapp.com",
        databaseURL: "https://lottery-box-70d2f-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "lottery-box-70d2f",
        storageBucket: "lottery-box-70d2f.firebasestorage.app",
        messagingSenderId: "853905847089",
        appId: "1:853905847089:web:034d76f6e3794dbf84b610"
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();
    const gameRef = db.ref('game');
    const playersRef = db.ref('players');

    // QR Code（手機操作頁網址）
    const MOBILE_URL = 'https://zong-xun.github.io/-lottery_box/online/mobile.html';
    const qrImg = document.getElementById('qrImg');
    if (qrImg) {
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(MOBILE_URL)}&color=8B0000&bgcolor=FFFFFF`;
    }

    // 線上人數
    playersRef.on('value', snap => {
        const count = snap.val() ? Object.keys(snap.val()).length : 0;
        const el = document.getElementById('onlineCount');
        if (el) el.textContent = count;
    });

    // 手機端按下「抽！」→ Firebase phase 變 drawing → 這裡觸發 draw()
    // 手機按「確定」→ Firebase modalConfirm 變化 → 電腦關閉對應彈窗
    let lastPhase = '';
    let lastModalConfirm = null;

    gameRef.on('value', snap => {
        const game = snap.val();
        if (!game) return;
        const { phase, currentPlayer, modalConfirm } = game;

        // 手機說：抽！→ 這台電腦負責執行 draw()
        if (phase === 'drawing' && lastPhase === 'waiting') {
            lastPhase = phase;
            if (window.lottery && window.lottery.currentParticipant === currentPlayer) {
                window.lottery.draw();
            }
        } else {
            lastPhase = phase || '';
        }

        // 手機按確定 → 關閉對應彈窗
        if (modalConfirm && modalConfirm !== lastModalConfirm) {
            lastModalConfirm = modalConfirm;
            gameRef.update({ modalConfirm: null, modal: null });
            if      (modalConfirm === 'turn')     window.lottery && window.lottery.closeTurnModal();
            else if (modalConfirm === 'blessing') window.lottery && window.lottery.closeBlessing();
            else if (modalConfirm === 'prize')    window.lottery && window.lottery.closePrize();
            else if (modalConfirm === 'complete') window.lottery && window.lottery.closeComplete();
        } else if (!modalConfirm) {
            lastModalConfirm = null;
        }
    });

    // 把「目前輪到誰」同步到 Firebase（讓手機端顯示）
    const origPickNext = LotteryBox.prototype.pickNextParticipant;
    LotteryBox.prototype.pickNextParticipant = function(isFirst) {
        origPickNext.call(this, isFirst);
        if (this.currentParticipant) {
            gameRef.update({ phase: 'waiting', currentPlayer: this.currentParticipant, modal: null });
        }
    };

    // 輪到誰彈窗 → 同步 modal 狀態
    const origShowTurnModal = LotteryBox.prototype.showTurnModal;
    LotteryBox.prototype.showTurnModal = function(isFirst) {
        origShowTurnModal.call(this, isFirst);
        gameRef.update({ modal: 'turn' });
    };

    // 吉祥話彈窗 → 同步 modal 狀態
    const origShowBlessing = LotteryBox.prototype.showBlessing;
    LotteryBox.prototype.showBlessing = function() {
        origShowBlessing.call(this);
        gameRef.update({ modal: 'blessing' });
    };

    // 獎項彈窗 → 同步 modal 狀態
    const origShowPrize = LotteryBox.prototype.showPrize;
    LotteryBox.prototype.showPrize = function() {
        origShowPrize.call(this);
        gameRef.update({ modal: 'prize' });
    };

    // draw() 結束後同步結果（prize）
    const origClosePrize = LotteryBox.prototype.closePrize;
    LotteryBox.prototype.closePrize = function() {
        origClosePrize.call(this);
        const results = {};
        this.drawnNumbers.forEach(n => {
            const winner = this.winners[n];
            if (winner) results[winner] = this.prizes[n];
        });
        gameRef.update({ results, phase: 'waiting', modal: null });
    };

    // 遊戲結束後同步
    const origShowComplete = LotteryBox.prototype.showComplete;
    LotteryBox.prototype.showComplete = function() {
        origShowComplete.call(this);
        gameRef.update({ phase: 'done', modal: 'complete' });
    };

    // 重設時清掉 Firebase
    const origReset = LotteryBox.prototype.reset;
    LotteryBox.prototype.reset = function() {
        origReset.call(this);
        gameRef.remove();
        lastPhase = '';
        lastModalConfirm = null;
    };

    // 活動開始 → 寫入初始 phase
    const origStart = LotteryBox.prototype.startGameFromIntro;
    LotteryBox.prototype.startGameFromIntro = function() {
        origStart.call(this);
        gameRef.set({ phase: 'waiting', currentPlayer: this.currentParticipant || '', results: {}, modal: null });
    };
})();