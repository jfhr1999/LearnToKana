const state = {
  allData: [],
  activeSystem: 'hiragana',
  selectedGroups: new Set(),
  deck: [],
  currentIndex: 0,
  score: { correct: 0, incorrect: 0 }
};

// Elementos del DOM
const views = {
  setup: document.getElementById('setup-view'),
  quiz: document.getElementById('quiz-view')
};

const dom = {
  groupsContainer: document.getElementById('groups-container'),
  startBtn: document.getElementById('start-btn'),
  cardPrompt: document.getElementById('card-prompt'),
  cardMeaning: document.getElementById('card-meaning'),
  cardBadge: document.getElementById('card-badge'),
  answerInput: document.getElementById('answer-input'),
  quizForm: document.getElementById('quiz-form'),
  feedback: document.getElementById('feedback-msg'),
  scoreCorrect: document.getElementById('score-correct'),
  scoreIncorrect: document.getElementById('score-incorrect'),
  toggleMeaning: document.getElementById('toggle-meaning')
};

// Inicialización
async function init() {
  try {
    const response = await fetch('data/study_data.json');
    state.allData = await response.json();
    setupEventListeners();
    renderGroups();
  } catch (err) {
    console.error("Error al cargar study_data.json:", err);
  }
}

// Renderizar checkboxes según el sistema activo (Hiragana/Katakana/Kanji)
function renderGroups() {
  dom.groupsContainer.innerHTML = '';
  state.selectedGroups.clear();
  updateStartButton();

  // Filtrar ítems para el sistema activo (hiragana / katakana / kanji)
  const systemItems = state.allData.filter(item => item.system === state.activeSystem);
  const groupsMap = new Map();

  systemItems.forEach(item => {
    if (!groupsMap.has(item.group)) {
      groupsMap.set(item.group, { name: item.group, count: 0 });
    }
    groupsMap.get(item.group).count++;
  });

  groupsMap.forEach(group => {
    const label = document.createElement('label');
    label.className = 'group-item';
    label.innerHTML = `
      <input type="checkbox" value="${group.name}" />
      <span>${group.name} (${group.count})</span>
    `;

    const checkbox = label.querySelector('input');
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        state.selectedGroups.add(group.name);
      } else {
        state.selectedGroups.delete(group.name);
      }
      updateStartButton();
    });

    dom.groupsContainer.appendChild(label);
  });
}

function updateStartButton() {
  dom.startBtn.disabled = state.selectedGroups.size === 0;
}

// Configurar Eventos
function setupEventListeners() {
  // Tabs de sistema
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.activeSystem = e.target.dataset.system;
      renderGroups();
    });
  });

  // Iniciar práctica
  dom.startBtn.addEventListener('click', startQuiz);

  // Volver al menú
  document.getElementById('exit-btn').addEventListener('click', () => {
    switchView('setup');
  });

  // Procesar respuesta
  dom.quizForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleAnswer();
  });
}

function switchView(viewName) {
  Object.keys(views).forEach(v => views[v].classList.remove('active'));
  views[viewName].classList.add('active');
}

// Lógica de Juego
function startQuiz() {
  // Filtrar deck según los grupos seleccionados
  state.deck = state.allData.filter(item => state.selectedGroups.has(item.group));
  // Mezclar orden
  state.deck.sort(() => Math.random() - 0.5);
  
  state.currentIndex = 0;
  state.score = { correct: 0, incorrect: 0 };
  updateScoreUI();
  
  switchView('quiz');
  showCard();
}

function showCard() {
  dom.feedback.textContent = '';
  dom.feedback.className = 'feedback';
  dom.answerInput.value = '';
  dom.answerInput.focus();

  const current = state.deck[state.currentIndex];
  dom.cardPrompt.textContent = current.prompt;
  dom.cardBadge.textContent = `${current.system.toUpperCase()} · ${current.group}`;

  if (dom.toggleMeaning.checked && current.meaning) {
    dom.cardMeaning.textContent = current.meaning;
    dom.cardMeaning.style.display = 'block';
  } else {
    dom.cardMeaning.style.display = 'none';
  }
}

function handleAnswer() {
  const current = state.deck[state.currentIndex];
  const input = dom.answerInput.value.trim().toLowerCase();
  
  const targetReading = current.reading.trim().toLowerCase();
  const targetRomaji = (current.romaji || '').trim().toLowerCase();

  // Valida tanto la lectura Kana como el Romaji equivalente
  const isCorrect = input === targetReading || (targetRomaji && input === targetRomaji);

  if (isCorrect) {
    state.score.correct++;
    dom.feedback.textContent = '¡Correcto! ' + current.reading;
    dom.feedback.className = 'feedback correct';
  } else {
    state.score.incorrect++;
    dom.feedback.textContent = `Incorrecto. Respuesta: ${current.reading} (${current.romaji || ''})`;
    dom.feedback.className = 'feedback incorrect';
  }

  updateScoreUI();

  // Avanzar a la siguiente tarjeta
  setTimeout(() => {
    state.currentIndex = (state.currentIndex + 1) % state.deck.length;
    showCard();
  }, 1200);
}

function updateScoreUI() {
  dom.scoreCorrect.textContent = `✓ ${state.score.correct}`;
  dom.scoreIncorrect.textContent = `✗ ${state.score.incorrect}`;
}

const themeBtn = document.getElementById('theme-toggle');
themeBtn.addEventListener('click', () => {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
  themeBtn.textContent = isDark ? '🌙' : '☀️';
});

// Conversor ligero Romaji -> Hiragana
function convertRomajiToKana(input, targetSystem = 'hiragana') {
  const isKatakana = targetSystem === 'katakana';

  const map = {
    // Monogramas
    a: isKatakana ? 'ア' : 'あ', i: isKatakana ? 'イ' : 'い', u: isKatakana ? 'ウ' : 'う', e: isKatakana ? 'エ' : 'え', o: isKatakana ? 'オ' : 'お',
    ka: isKatakana ? 'カ' : 'か', ki: isKatakana ? 'キ' : 'き', ku: isKatakana ? 'ク' : 'く', ke: isKatakana ? 'ケ' : 'け', ko: isKatakana ? 'コ' : 'こ',
    sa: isKatakana ? 'サ' : 'さ', shi: isKatakana ? 'シ' : 'し', su: isKatakana ? 'ス' : 'す', se: isKatakana ? 'セ' : 'せ', so: isKatakana ? 'ソ' : 'そ',
    ta: isKatakana ? 'タ' : 'た', chi: isKatakana ? 'チ' : 'ち', tsu: isKatakana ? 'ツ' : 'つ', te: isKatakana ? 'テ' : 'て', to: isKatakana ? 'ト' : 'と',
    na: isKatakana ? 'ナ' : 'な', ni: isKatakana ? 'ニ' : 'に', nu: isKatakana ? 'ヌ' : 'ぬ', ne: isKatakana ? 'ネ' : 'ね', no: isKatakana ? 'ノ' : 'の',
    ha: isKatakana ? 'ハ' : 'は', hi: isKatakana ? 'ヒ' : 'ひ', fu: isKatakana ? 'フ' : 'ふ', he: isKatakana ? 'ヘ' : 'へ', ho: isKatakana ? 'ホ' : 'ほ',
    ma: isKatakana ? 'マ' : 'ま', mi: isKatakana ? 'ミ' : 'み', mu: isKatakana ? 'ム' : 'む', me: isKatakana ? 'メ' : 'め', mo: isKatakana ? 'モ' : 'も',
    ya: isKatakana ? 'ヤ' : 'や', yu: isKatakana ? 'ユ' : 'ゆ', yo: isKatakana ? 'ヨ' : 'よ',
    ra: isKatakana ? 'ラ' : 'ら', ri: isKatakana ? 'リ' : 'り', ru: isKatakana ? 'ル' : 'る', re: isKatakana ? 'レ' : 'れ', ro: isKatakana ? 'ロ' : 'ろ',
    wa: isKatakana ? 'ワ' : 'わ', wo: isKatakana ? 'ヲ' : 'を', n: isKatakana ? 'ン' : 'ん',
    '-': 'ー'
  };

  let str = input.toLowerCase();
  
  // 1. Convertir consonantes dobles en Sokuon (ej. "kko" -> "っko", "tte" -> "っte")
  const sokuon = isKatakana ? 'ッ' : 'っ';
  str = str.replace(/([bcdfghjklmnpqrstvwxyz])\1/g, sokuon + '$1');

  // 2. Reemplazar combinaciones más largas primero
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  keys.forEach(k => {
    str = str.replaceAll(k, map[k]);
  });

  return str;
}

// Event listener integrado
dom.answerInput.addEventListener('input', (e) => {
  const currentCard = state.deck[state.currentIndex];
  // Determina si convertir a katakana o hiragana según la tarjeta
  const system = currentCard ? currentCard.system : state.activeSystem;
  e.target.value = convertRomajiToKana(e.target.value, system);
});
// Iniciar app al cargar la página
document.addEventListener('DOMContentLoaded', init);