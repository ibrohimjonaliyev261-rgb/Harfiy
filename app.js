/**
 * Uzbek Wordle (So'ztop) - Asosiy O'yin Dasturi (Engine)
 * NYT Wordle xususiyatlari, animatsiyalari va qoidalariga to'liq asoslangan
 */

(function () {
  'use strict';

  // 1. O'yin sozlamalari va o'zgarmaslar
  const WORD_LENGTH = 5;
  const MAX_GUESSES = 6;
  const EPOCH_DATE = new Date(2024, 0, 1); // 2024-yil 1-yanvar boshlang'ich sana

  // DOM Elementlari
  const boardEl = document.getElementById('board');
  const keyboardEl = document.getElementById('keyboard');
  const toastContainer = document.getElementById('toast-container');
  const modeIndicator = document.getElementById('mode-indicator');

  // Modallar
  const helpModal = document.getElementById('help-modal');
  const statsModal = document.getElementById('stats-modal');
  const settingsModal = document.getElementById('settings-modal');

  // Tugmalar
  const helpBtn = document.getElementById('help-btn');
  const statsBtn = document.getElementById('stats-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const modeToggleBtn = document.getElementById('mode-toggle-btn');
  const shareBtn = document.getElementById('share-btn');
  const playAgainBtn = document.getElementById('play-again-btn');

  // Sozlamalar inputlari
  const hardModeToggle = document.getElementById('hard-mode-toggle');
  const darkThemeToggle = document.getElementById('dark-theme-toggle');
  const highContrastToggle = document.getElementById('high-contrast-toggle');
  const soundToggle = document.getElementById('sound-toggle');

  // Statistika elementlari
  const statPlayedEl = document.getElementById('stat-played');
  const statWinPctEl = document.getElementById('stat-win-pct');
  const statCurStreakEl = document.getElementById('stat-cur-streak');
  const statMaxStreakEl = document.getElementById('stat-max-streak');
  const guessDistEl = document.getElementById('guess-distribution');
  const countdownEl = document.getElementById('countdown-timer');

  // Tovush uchun Web Audio API
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
  }

  function playTone(freq, type = 'sine', duration = 0.08, gainVal = 0.06) {
    if (!settings.sound) return;
    try {
      initAudio();
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio xatoliklarini e'tiborsiz qoldirish
    }
  }

  function playKeySound() {
    playTone(280, 'sine', 0.04, 0.03);
  }

  function playFlipSound(step) {
    const freqs = [350, 420, 500, 580, 680];
    playTone(freqs[step % freqs.length], 'triangle', 0.09, 0.07);
  }

  function playErrorSound() {
    playTone(160, 'sawtooth', 0.18, 0.08);
  }

  function playWinSound() {
    if (!settings.sound) return;
    const melody = [523.25, 659.25, 783.99, 1046.50];
    melody.forEach((freq, idx) => {
      setTimeout(() => {
        playTone(freq, 'sine', 0.25, 0.08);
      }, idx * 100);
    });
  }

  // 2. Foydalanuvchi sozlamalari va statistikasi
  const DEFAULT_SETTINGS = {
    hardMode: false,
    darkTheme: true,
    highContrast: false,
    sound: true
  };

  const DEFAULT_STATS = {
    played: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0,
    guesses: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    lastCompletedDate: null
  };

  let settings = loadFromStorage('wordle_uz_settings', DEFAULT_SETTINGS);
  let stats = loadFromStorage('wordle_uz_stats', DEFAULT_STATS);

  // 3. O'yin holati (Game State)
  let gameMode = 'DAILY'; // 'DAILY' yoki 'FREE'
  let secretWord = '';
  let dayNumber = 1;
  let currentGuess = '';
  let guesses = []; // Avval kiritilgan so'zlar ro'yxati
  let isGameOver = false;
  let isAnimating = false;

  // Lug'atlarni tekshirish va xavfsiz yuklash
  const targetWordsList = (typeof WORDS_TARGET !== 'undefined' && WORDS_TARGET.length > 0)
    ? WORDS_TARGET
    : ["kitob", "salom", "bahor", "dunyo", "vatan", "hayot", "inson", "bilim", "yurak", "qalam"];

  const validWordsSet = new Set(
    (typeof WORDS_VALID !== 'undefined' && WORDS_VALID.length > 0)
      ? WORDS_VALID
      : targetWordsList
  );

  // 4. Boshlash va sozlash funksiyalari
  function initGame() {
    applySettingsToUI();
    createBoard();
    createKeyboard();
    setupEventListeners();
    startCountdown();

    // Birinchi kirgan foydalanuvchiga yordam oynasini ko'rsatish
    const hasVisited = localStorage.getItem('wordle_uz_visited');
    if (!hasVisited) {
      openModal(helpModal);
      localStorage.setItem('wordle_uz_visited', 'true');
    }

    startMode('DAILY');
  }

  function startMode(mode) {
    gameMode = mode;
    currentGuess = '';
    guesses = [];
    isGameOver = false;
    isAnimating = false;

    // Board va Keyboardni tozalash
    resetBoard();
    resetKeyboard();

    if (gameMode === 'DAILY') {
      modeIndicator.textContent = 'Kunlik o‘yin';
      modeToggleBtn.title = 'Erkin rejimga o‘tish';
      playAgainBtn.classList.add('hidden');

      const today = new Date();
      const diffTime = Math.abs(today - EPOCH_DATE);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      dayNumber = diffDays + 1;

      const wordIdx = diffDays % targetWordsList.length;
      secretWord = targetWordsList[wordIdx];

      // Saqlangan kunlik o'yin holatini yuklash
      const savedDaily = loadFromStorage('wordle_uz_daily_state', null);
      const todayDateStr = getTodayDateString();

      if (savedDaily && savedDaily.date === todayDateStr) {
        restoreGameState(savedDaily);
      }
    } else {
      modeIndicator.textContent = 'Erkin mashq';
      modeToggleBtn.title = 'Kunlik o‘yinga qaytish';
      playAgainBtn.classList.remove('hidden');

      // Tasodifiy yangi so'z tanlash
      const randomIdx = Math.floor(Math.random() * targetWordsList.length);
      secretWord = targetWordsList[randomIdx];
    }
  }

  function restoreGameState(saved) {
    guesses = saved.guesses || [];
    isGameOver = saved.isGameOver || false;

    // O'tgan urinishlarni vizual tiklash
    guesses.forEach((guess, rowIndex) => {
      const evaluation = evaluateGuess(guess, secretWord);
      for (let i = 0; i < WORD_LENGTH; i++) {
        const tile = getTileEl(rowIndex, i);
        tile.textContent = guess[i].toUpperCase();
        tile.setAttribute('data-state', evaluation[i]);
        updateKeyboardKey(guess[i], evaluation[i]);
      }
    });

    if (isGameOver) {
      setTimeout(() => {
        openModal(statsModal);
      }, 500);
    }
  }

  function saveDailyState() {
    if (gameMode !== 'DAILY') return;
    const state = {
      date: getTodayDateString(),
      guesses: guesses,
      isGameOver: isGameOver,
      hasWon: guesses.includes(secretWord)
    };
    saveToStorage('wordle_uz_daily_state', state);
  }

  // 5. Board (Kataklar) yaratish
  function createBoard() {
    boardEl.innerHTML = '';
    for (let r = 0; r < MAX_GUESSES; r++) {
      const row = document.createElement('div');
      row.className = 'row';
      row.id = `row-${r}`;
      for (let c = 0; c < WORD_LENGTH; c++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.id = `tile-${r}-${c}`;
        tile.setAttribute('aria-label', `Bo‘sh katak`);
        row.appendChild(tile);
      }
      boardEl.appendChild(row);
    }
  }

  function resetBoard() {
    for (let r = 0; r < MAX_GUESSES; r++) {
      const row = document.getElementById(`row-${r}`);
      if (row) row.classList.remove('shake');
      for (let c = 0; c < WORD_LENGTH; c++) {
        const tile = getTileEl(r, c);
        if (tile) {
          tile.textContent = '';
          tile.removeAttribute('data-state');
          tile.className = 'tile';
        }
      }
    }
  }

  // 6. Virtual Klaviatura yaratish
  const KEYBOARD_LAYOUT = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace']
  ];

  function createKeyboard() {
    keyboardEl.innerHTML = '';
    KEYBOARD_LAYOUT.forEach(rowKeys => {
      const row = document.createElement('div');
      row.className = 'keyboard-row';

      rowKeys.forEach(k => {
        const btn = document.createElement('button');
        btn.className = 'key';
        btn.setAttribute('data-key', k);

        if (k === 'enter') {
          btn.classList.add('wide');
          btn.textContent = 'ENTER';
          btn.setAttribute('aria-label', 'Kiritish (Enter)');
        } else if (k === 'backspace') {
          btn.classList.add('wide');
          btn.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22">
            <path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H7.07L2.4 12l4.66-7H22v14zm-11.59-2L14 13.41 17.59 17 19 15.59 15.41 12 19 8.41 17.59 7 14 10.59 10.41 7 9 8.41 12.59 12 9 15.59z" fill="currentColor"/>
          </svg>`;
          btn.setAttribute('aria-label', 'O‘chirish (Backspace)');
        } else {
          btn.textContent = k;
          btn.setAttribute('aria-label', `${k.toUpperCase()} harfi`);
        }

        btn.addEventListener('click', (e) => {
          e.preventDefault();
          handleKeyPress(k);
        });

        row.appendChild(btn);
      });

      keyboardEl.appendChild(row);
    });
  }

  function resetKeyboard() {
    const keys = keyboardEl.querySelectorAll('.key');
    keys.forEach(k => k.removeAttribute('data-state'));
  }

  function updateKeyboardKey(letter, state) {
    const keyBtn = keyboardEl.querySelector(`.key[data-key="${letter}"]`);
    if (!keyBtn) return;

    const currentState = keyBtn.getAttribute('data-state');
    // Prioritet: correct (yashil) > present (sariq) > absent (kulrang)
    if (currentState === 'correct') return;
    if (currentState === 'present' && state === 'absent') return;

    keyBtn.setAttribute('data-state', state);
  }

  // 7. Harf kiritish va o'yin mantiqi
  function handleKeyPress(key) {
    if (isGameOver || isAnimating) return;

    if (key === 'backspace') {
      deleteLetter();
    } else if (key === 'enter') {
      submitGuess();
    } else if (/^[a-z]$/i.test(key)) {
      addLetter(key.toLowerCase());
    }
  }

  function addLetter(letter) {
    if (currentGuess.length < WORD_LENGTH) {
      currentGuess += letter;
      const rowIdx = guesses.length;
      const colIdx = currentGuess.length - 1;
      const tile = getTileEl(rowIdx, colIdx);
      if (tile) {
        tile.textContent = letter.toUpperCase();
        tile.setAttribute('data-state', 'active');
        playKeySound();
      }
    }
  }

  function deleteLetter() {
    if (currentGuess.length > 0) {
      const rowIdx = guesses.length;
      const colIdx = currentGuess.length - 1;
      const tile = getTileEl(rowIdx, colIdx);
      if (tile) {
        tile.textContent = '';
        tile.removeAttribute('data-state');
      }
      currentGuess = currentGuess.slice(0, -1);
      playKeySound();
    }
  }

  function submitGuess() {
    const rowIdx = guesses.length;
    const rowEl = document.getElementById(`row-${rowIdx}`);

    // Harflar soni 5 ta bo'lishi kerak
    if (currentGuess.length !== WORD_LENGTH) {
      showToast('Harflar yetarli emas!');
      shakeRow(rowEl);
      playErrorSound();
      return;
    }

    // Lug'atda mavjudligini tekshirish
    if (!validWordsSet.has(currentGuess)) {
      showToast('Lug‘atda mavjud emas!');
      shakeRow(rowEl);
      playErrorSound();
      return;
    }

    // Qiyin rejim (Hard Mode) qoidalarini tekshirish
    if (settings.hardMode && guesses.length > 0) {
      const hardModeViolated = checkHardMode(currentGuess);
      if (hardModeViolated) {
        showToast(hardModeViolated);
        shakeRow(rowEl);
        playErrorSound();
        return;
      }
    }

    // Taxminni baholash va animatsiya bilan ochish
    isAnimating = true;
    const evaluation = evaluateGuess(currentGuess, secretWord);
    guesses.push(currentGuess);
    const guessToReveal = currentGuess;
    currentGuess = '';

    revealRow(rowIdx, guessToReveal, evaluation, () => {
      isAnimating = false;

      // G'alaba holati
      if (guessToReveal === secretWord) {
        isGameOver = true;
        bounceRow(rowEl);
        playWinSound();

        const compliments = ['Daho! 🧠', 'Qoyilmaqom! ⚡', 'Ajoyib! 🌟', 'Juda yaxshi! 👏', 'Yaxshi! 👍', 'Zo‘rg‘a topdingiz! 😅'];
        const winMsg = compliments[rowIdx] || 'Tabriklaymiz!';
        setTimeout(() => {
          showToast(winMsg, 2500);
        }, 500);

        if (gameMode === 'DAILY') {
          recordStats(true, rowIdx + 1);
        }
        saveDailyState();

        setTimeout(() => {
          openModal(statsModal);
        }, 1800);
        return;
      }

      // Mag'lubiyat holati (6 ta urinish tugadi)
      if (guesses.length === MAX_GUESSES) {
        isGameOver = true;
        showToast(`Yashirin so‘z: ${secretWord.toUpperCase()}`, 4000);

        if (gameMode === 'DAILY') {
          recordStats(false, 0);
        }
        saveDailyState();

        setTimeout(() => {
          openModal(statsModal);
        }, 2200);
        return;
      }

      saveDailyState();
    });
  }

  // 8. Wordle takroriy harflarni to'g'ri hisoblash algoritmi
  function evaluateGuess(guess, target) {
    const result = Array(WORD_LENGTH).fill('absent');
    const targetLetterCounts = {};

    // 1-qadam: Nishon so'zdagi harflar sonini hisoblash
    for (let char of target) {
      targetLetterCounts[char] = (targetLetterCounts[char] || 0) + 1;
    }

    // 2-qadam: To'g'ri o'rindagi (Green / Correct) harflarni topish
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guess[i] === target[i]) {
        result[i] = 'correct';
        targetLetterCounts[guess[i]]--;
      }
    }

    // 3-qadam: O'rni noto'g'ri, lekin so'zda bor (Yellow / Present) harflarni topish
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (result[i] !== 'correct') {
        const char = guess[i];
        if (targetLetterCounts[char] && targetLetterCounts[char] > 0) {
          result[i] = 'present';
          targetLetterCounts[char]--;
        }
      }
    }

    return result;
  }

  // Qiyin rejim (Hard Mode) tekshiruvi
  function checkHardMode(guess) {
    const lastGuess = guesses[guesses.length - 1];
    const lastEvaluation = evaluateGuess(lastGuess, secretWord);

    // 1. Avval topilgan yashil harflar aynan shu pozitsiyada bo'lishi shart
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (lastEvaluation[i] === 'correct' && guess[i] !== lastGuess[i]) {
        return `${i + 1}-harf "${lastGuess[i].toUpperCase()}" bo‘lishi shart!`;
      }
    }

    // 2. Avval topilgan sariq harflar so'zda mavjud bo'lishi shart
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (lastEvaluation[i] === 'present' && !guess.includes(lastGuess[i])) {
        return `"${lastGuess[i].toUpperCase()}" harfi ishlatilishi shart!`;
      }
    }

    return null;
  }

  // 9. Animatsiyalar
  function revealRow(rowIdx, guess, evaluation, onComplete) {
    for (let i = 0; i < WORD_LENGTH; i++) {
      const tile = getTileEl(rowIdx, i);
      const letter = guess[i];
      const state = evaluation[i];

      setTimeout(() => {
        tile.classList.add('flip');
        playFlipSound(i);

        // Flip animatsiyasi yarmiga yetganda (90 gradusda) rangini o'zgartirish
        setTimeout(() => {
          tile.setAttribute('data-state', state);
          updateKeyboardKey(letter, state);
        }, 250);

        if (i === WORD_LENGTH - 1) {
          setTimeout(onComplete, 550);
        }
      }, i * 280);
    }
  }

  function shakeRow(rowEl) {
    if (!rowEl) return;
    rowEl.classList.remove('shake');
    void rowEl.offsetWidth; // Reflow
    rowEl.classList.add('shake');
    setTimeout(() => {
      rowEl.classList.remove('shake');
    }, 600);
  }

  function bounceRow(rowEl) {
    if (!rowEl) return;
    const tiles = rowEl.querySelectorAll('.tile');
    tiles.forEach((tile, idx) => {
      setTimeout(() => {
        tile.classList.add('bounce');
      }, idx * 100);
    });
  }

  // 10. Statistika va saqlash
  function recordStats(hasWon, guessCount) {
    stats.played++;
    const todayStr = getTodayDateString();

    if (hasWon) {
      stats.wins++;
      // Ketma-ketlikni hisoblash
      if (stats.lastCompletedDate) {
        const lastDate = new Date(stats.lastCompletedDate);
        const currentDate = new Date(todayStr);
        const dayDiff = Math.round((currentDate - lastDate) / (1000 * 60 * 60 * 24));
        if (dayDiff === 1) {
          stats.currentStreak++;
        } else if (dayDiff > 1) {
          stats.currentStreak = 1;
        }
      } else {
        stats.currentStreak = 1;
      }

      if (stats.currentStreak > stats.maxStreak) {
        stats.maxStreak = stats.currentStreak;
      }

      if (guessCount >= 1 && guessCount <= 6) {
        stats.guesses[guessCount] = (stats.guesses[guessCount] || 0) + 1;
      }
    } else {
      stats.currentStreak = 0;
    }

    stats.lastCompletedDate = todayStr;
    saveToStorage('wordle_uz_stats', stats);
  }

  function renderStatsUI() {
    statPlayedEl.textContent = stats.played;
    const winRate = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0;
    statWinPctEl.textContent = `${winRate}%`;
    statCurStreakEl.textContent = stats.currentStreak;
    statMaxStreakEl.textContent = stats.maxStreak;

    // Gistogrammani to'ldirish
    guessDistEl.innerHTML = '';
    const maxVal = Math.max(...Object.values(stats.guesses), 1);

    for (let i = 1; i <= MAX_GUESSES; i++) {
      const count = stats.guesses[i] || 0;
      const pct = Math.max(7, Math.round((count / maxVal) * 100));

      const row = document.createElement('div');
      row.className = 'dist-row';

      const num = document.createElement('div');
      num.className = 'dist-num';
      num.textContent = i;

      const wrap = document.createElement('div');
      wrap.className = 'dist-bar-wrap';

      const bar = document.createElement('div');
      bar.className = 'dist-bar';
      bar.style.width = `${pct}%`;
      bar.textContent = count;

      // Agar hozirgi o'yin g'alaba bilan tugagan bo'lsa, uni belgilash
      if (isGameOver && guesses.includes(secretWord) && guesses.length === i) {
        bar.classList.add('highlight');
      }

      wrap.appendChild(bar);
      row.appendChild(num);
      row.appendChild(wrap);
      guessDistEl.appendChild(row);
    }
  }

  // 11. Natijani ulashish (Share)
  function shareResult() {
    if (!isGameOver) {
      showToast('Avval o‘yinni yakunlang!');
      return;
    }

    const hasWon = guesses.includes(secretWord);
    const scoreStr = hasWon ? `${guesses.length}/6` : 'X/6';
    const modeName = gameMode === 'DAILY' ? `#${dayNumber}` : '(Erkin)';
    let shareText = `Wordle O‘zbekcha ${modeName} ${scoreStr}\n\n`;

    guesses.forEach(guess => {
      const evaluation = evaluateGuess(guess, secretWord);
      const emojiRow = evaluation.map(state => {
        if (state === 'correct') {
          return settings.highContrast ? '🟧' : '🟩';
        } else if (state === 'present') {
          return settings.highContrast ? '🟦' : '🟨';
        } else {
          return settings.darkTheme ? '⬛' : '⬜';
        }
      }).join('');
      shareText += emojiRow + '\n';
    });

    shareText += '\nO‘ynash: https://github.com';

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText)
        .then(() => showToast('Natija xotiraga nusxalandi!'))
        .catch(() => fallbackShare(shareText));
    } else {
      fallbackShare(shareText);
    }
  }

  function fallbackShare(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast('Natija xotiraga nusxalandi!');
    } catch (err) {
      showToast('Nusxalash imkoni bo‘lmadi');
    }
    document.body.removeChild(textArea);
  }

  // 12. Keyingi so'zgacha qolgan vaqtni sanash (Countdown)
  function startCountdown() {
    function updateTimer() {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diffMs = tomorrow - now;

      const hrs = String(Math.floor((diffMs / (1000 * 60 * 60)) % 24)).padStart(2, '0');
      const mins = String(Math.floor((diffMs / (1000 * 60)) % 60)).padStart(2, '0');
      const secs = String(Math.floor((diffMs / 1000) % 60)).padStart(2, '0');

      if (countdownEl) {
        countdownEl.textContent = `${hrs}:${mins}:${secs}`;
      }
    }
    updateTimer();
    setInterval(updateTimer, 1000);
  }

  // 13. Toast Xabarnomalar
  function showToast(message, duration = 1800) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  // 14. Sozlamalar va Hodisalar (Events)
  function setupEventListeners() {
    // Jismoniy klaviatura hodisalari
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'Escape') {
        closeAllModals();
        return;
      }

      if (e.key === 'Enter') {
        handleKeyPress('enter');
      } else if (e.key === 'Backspace') {
        handleKeyPress('backspace');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key.toLowerCase());
      }
    });

    // Modallarni ochish tugmalari
    helpBtn.addEventListener('click', () => openModal(helpModal));
    statsBtn.addEventListener('click', () => {
      renderStatsUI();
      openModal(statsModal);
    });
    settingsBtn.addEventListener('click', () => openModal(settingsModal));

    // Rejimni almashtirish tugmasi
    modeToggleBtn.addEventListener('click', () => {
      if (gameMode === 'DAILY') {
        startMode('FREE');
        showToast('Erkin mashq rejimi faollashdi!');
      } else {
        startMode('DAILY');
        showToast('Kunlik o‘yin rejimiga qaytildi!');
      }
    });

    // Share va Yangi o'yin
    shareBtn.addEventListener('click', shareResult);
    playAgainBtn.addEventListener('click', () => {
      closeAllModals();
      startMode('FREE');
      showToast('Yangi tasodifiy so‘z tanlandi!');
    });

    // Modallarni yopish tugmalari
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close');
        const modal = document.getElementById(modalId);
        if (modal) closeModal(modal);
      });
    });

    // Modal orqa foniga bosganda yopish
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal(modal);
        }
      });
    });

    // Sozlamalar hodisalari
    hardModeToggle.addEventListener('change', (e) => {
      if (guesses.length > 0 && !isGameOver) {
        e.preventDefault();
        hardModeToggle.checked = settings.hardMode;
        showToast('Qiyin rejim faqat o‘yin boshida o‘zgartirilishi mumkin!');
        return;
      }
      settings.hardMode = hardModeToggle.checked;
      saveToStorage('wordle_uz_settings', settings);
    });

    darkThemeToggle.addEventListener('change', () => {
      settings.darkTheme = darkThemeToggle.checked;
      applyTheme();
      saveToStorage('wordle_uz_settings', settings);
    });

    highContrastToggle.addEventListener('change', () => {
      settings.highContrast = highContrastToggle.checked;
      applyTheme();
      saveToStorage('wordle_uz_settings', settings);
    });

    soundToggle.addEventListener('change', () => {
      settings.sound = soundToggle.checked;
      saveToStorage('wordle_uz_settings', settings);
      if (settings.sound) {
        initAudio();
        playKeySound();
      }
    });
  }

  function applySettingsToUI() {
    hardModeToggle.checked = settings.hardMode;
    darkThemeToggle.checked = settings.darkTheme;
    highContrastToggle.checked = settings.highContrast;
    soundToggle.checked = settings.sound;
    applyTheme();
  }

  function applyTheme() {
    if (settings.darkTheme) {
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
    }

    if (settings.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }

  function openModal(modal) {
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  function closeModal(modal) {
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  function closeAllModals() {
    [helpModal, statsModal, settingsModal].forEach(m => closeModal(m));
  }

  // 15. Yordamchi (Helper) funksiyalar
  function getTileEl(row, col) {
    return document.getElementById(`tile-${row}-${col}`);
  }

  function getTodayDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function loadFromStorage(key, defaultVal) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  }

  function saveToStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // Storage xatoliklarini e'tiborsiz qoldirish
    }
  }

  // Dasturni ishga tushirish
  document.addEventListener('DOMContentLoaded', initGame);

})();
