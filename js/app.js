const state = {
  allData: [],
  activeSystems: new Set(['hiragana', 'katakana']),
  selectedSubgroups: new Set(),
  kanjiCategory: 'jlpt',
  deck: [],
  currentIndex: 0,
  score: { correct: 0, incorrect: 0 },
  modalContext: null
};

// Vistas
const views = {
  setup: document.getElementById('setup-view'),
  quiz: document.getElementById('quiz-view')
};

// Referencias del DOM
const dom = {
  groupsContainer: document.getElementById('groups-container'),
  kanjiCategoryWrapper: document.getElementById('kanji-category-wrapper'),
  kanjiCategorySelect: document.getElementById('kanji-category-select'),
  startBtn: document.getElementById('start-btn'),
  cardPrompt: document.getElementById('card-prompt'),
  cardMeaning: document.getElementById('card-meaning'),
  cardBadge: document.getElementById('card-badge'),
  answerInput: document.getElementById('answer-input'),
  quizForm: document.getElementById('quiz-form'),
  feedback: document.getElementById('feedback-msg'),
  scoreCorrect: document.getElementById('score-correct'),
  scoreIncorrect: document.getElementById('score-incorrect'),
  toggleMeaning: document.getElementById('toggle-meaning'),
  
  // Modal DOM
  modal: document.getElementById('subgroup-modal'),
  modalTitle: document.getElementById('modal-title'),
  modalBreadcrumbs: document.getElementById('modal-breadcrumbs'),
  modalGrid: document.getElementById('modal-subgroups-grid'),
  closeModalBtn: document.getElementById('close-modal-btn'),
  saveModalBtn: document.getElementById('save-modal-btn'),
  selectAllModal: document.getElementById('select-all-modal'),
  deselectAllModal: document.getElementById('deselect-all-modal')
};

// Inicialización de la aplicación
async function init() {
  try {
    const response = await fetch('data/study_data.json');
    state.allData = await response.json();
    setupEventListeners();
    renderSystemToggles();
    renderGroups();
  } catch (err) {
    console.error("Error al cargar la data:", err);
  }
}

// Renderiza los botones superiores de cambio de Sistema
function renderSystemToggles() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const sys = btn.dataset.system;
    btn.classList.toggle('active', state.activeSystems.has(sys));

    btn.onclick = () => {
      if (state.activeSystems.has(sys)) {
        if (state.activeSystems.size > 1) state.activeSystems.delete(sys);
      } else {
        state.activeSystems.add(sys);
      }
      renderSystemToggles();
      renderGroups();
    };
  });
}

// Renderizado principal del Setup View
function renderGroups() {
  dom.groupsContainer.innerHTML = '';
  
  const hasKanji = state.activeSystems.has('kanji');
  if (dom.kanjiCategoryWrapper) {
    dom.kanjiCategoryWrapper.style.display = hasKanji ? 'flex' : 'none';
  }

  if (state.activeSystems.size === 0) {
    updateStartButton();
    return;
  }

  // Filtrado robusto para Kanji por categoría (JLPT, Frequency, Kanken, Grade)
  const activeItems = state.allData.filter(item => {
    if (!state.activeSystems.has(item.system)) return false;
    if (item.system === 'kanji') {
      const itemDeck = (item.deck || '').toLowerCase();
      const selectedCategory = state.kanjiCategory.toLowerCase();
      
      if (selectedCategory === 'grade') {
        return itemDeck.includes('grade') || itemDeck.includes('number');
      }
      return itemDeck.includes(selectedCategory);
    }
    return true;
  });

  // Agrupamiento: Sistema + Nivel -> Grupos/Bloques -> Subgrupos
  const hierarchy = new Map();

  activeItems.forEach(item => {
    const sysKey = item.system.toUpperCase();
    const deckKey = item.deck.toUpperCase();
    const levelKey = item.level ? item.level.toUpperCase() : `GRUPO ${item.group}`;
    
    // Identificador único para cada tarjeta (Ej: KANJI - JLPT - N5)
    const cardId = `${sysKey}_${deckKey}_${levelKey}`;
    const cleanTitle = `${sysKey} - ${deckKey} - ${levelKey}`;

    if (!hierarchy.has(cardId)) {
      hierarchy.set(cardId, {
        id: cardId,
        title: cleanTitle,
        groups: new Map()
      });
    }

    const cardRef = hierarchy.get(cardId);
    const groupName = item.group_name || `Bloque ${item.group}`;
    const subId = getSubgroupId(item);

    if (!cardRef.groups.has(groupName)) {
      cardRef.groups.set(groupName, []);
    }
    
    const subList = cardRef.groups.get(groupName);
    if (!subList.some(s => s.id === subId)) {
      const subLabel = item.subgroup && item.subgroup !== '1'
        ? `Parte ${item.subgroup.replace('subgroup_', '')}`
        : 'Parte 1';
      subList.push({ id: subId, label: subLabel });
    }
  });

  // Generación de tarjetas con bloques interactivos
  hierarchy.forEach((cardData) => {
    const card = document.createElement('div');
    card.className = 'group-card';

    let totalSelectedInCard = 0;
    cardData.groups.forEach(subList => {
      subList.forEach(sub => {
        if (state.selectedSubgroups.has(sub.id)) totalSelectedInCard++;
      });
    });

    const header = document.createElement('div');
    header.className = 'group-header';
    header.innerHTML = `
      <div class="group-title-container">
        <strong class="group-title-text">${cardData.title}</strong>
        <span class="group-selected-count">${totalSelectedInCard} seleccionados</span>
      </div>
    `;
    card.appendChild(header);

    // Contenedor de botones para los grupos/bloques
    const groupsContainer = document.createElement('div');
    groupsContainer.className = 'groups-buttons-container';
    

    cardData.groups.forEach((subList, groupName) => {
      const selectedInGroup = subList.filter(s => state.selectedSubgroups.has(s.id)).length;
      const groupBtn = document.createElement('button');
      groupBtn.className = `btn-secondary btn-sm ${selectedInGroup > 0 ? 'has-selection' : ''}`;
      groupBtn.innerHTML = `${groupName} <small>(${selectedInGroup}/${subList.length})</small>`;

      groupBtn.onclick = () => {
        openSubgroupsModal(cardData.title, groupName, subList);
      };

      groupsContainer.appendChild(groupBtn);
    });

    card.appendChild(groupsContainer);
    dom.groupsContainer.appendChild(card);
  });

  updateStartButton();
}

function getSubgroupId(item) {
  const sg = item.subgroup || item.part || '1';
  const level = item.level ? item.level.toLowerCase() : '';
  return `${item.system}_${item.deck}_${level}_g${item.group}_sg${sg}`;
}

// Modal: Selección de Subgrupos/Partes individuales
function openSubgroupsModal(mainTitle, groupName, subList) {
  state.modalContext = { mainTitle, groupName, subList };
  dom.modalTitle.textContent = `${mainTitle} · ${groupName}`;
  if (dom.modalBreadcrumbs) dom.modalBreadcrumbs.textContent = 'Selecciona subgrupos para práctica:';

  // Función interna para re-renderizar los chips sin cerrar el modal
  const renderChips = () => {
    dom.modalGrid.innerHTML = '';

    subList.forEach(sub => {
      const isSelected = state.selectedSubgroups.has(sub.id);
      
      const chip = document.createElement('div');
      // Asegura las clases visuales de selección
      chip.className = `chip-checkbox ${isSelected ? 'selected' : ''}`;
      chip.textContent = sub.label;

      chip.onclick = (e) => {
        e.stopPropagation();
        
        // Toggle individual en el Set de seleccionados
        if (state.selectedSubgroups.has(sub.id)) {
          state.selectedSubgroups.delete(sub.id);
        } else {
          state.selectedSubgroups.add(sub.id);
        }
        
        // Actualizamos estado global y re-renderizamos los chips del modal
        updateStartButton();
        renderChips();
      };

      dom.modalGrid.appendChild(chip);
    });
  };

  renderChips();
  dom.modal.classList.add('active');
}

function closeModal() {
  dom.modal.classList.remove('active');
  state.modalContext = null;
  renderGroups();
}

function updateStartButton() {
  dom.startBtn.disabled = state.selectedSubgroups.size === 0;
}

// Configuración de Eventos
function setupEventListeners() {
  if (dom.kanjiCategorySelect) {
    dom.kanjiCategorySelect.addEventListener('change', (e) => {
      state.kanjiCategory = e.target.value;
      renderGroups();
    });
  }

  dom.startBtn.addEventListener('click', startQuiz);
  document.getElementById('exit-btn').addEventListener('click', () => switchView('setup'));
  
  dom.quizForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleAnswer();
  });

  // Modal Events
  dom.closeModalBtn.onclick = closeModal;
  dom.saveModalBtn.onclick = closeModal;
  
  dom.selectAllModal.onclick = () => {
    if (state.modalContext) {
      state.modalContext.subList.forEach(s => state.selectedSubgroups.add(s.id));
      openSubgroupsModal(
        state.modalContext.mainTitle,
        state.modalContext.groupName,
        state.modalContext.subList
      );
    }
  };

  dom.deselectAllModal.onclick = () => {
    if (state.modalContext) {
      state.modalContext.subList.forEach(s => state.selectedSubgroups.delete(s.id));
      openSubgroupsModal(
        state.modalContext.mainTitle,
        state.modalContext.groupName,
        state.modalContext.subList
      );
    }
  };

  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const isDark = document.body.getAttribute('data-theme') === 'dark';
      document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
      themeBtn.textContent = isDark ? '🌙' : '☀️';
    });
  }
}

function switchView(viewName) {
  Object.keys(views).forEach(v => views[v].classList.remove('active'));
  views[viewName].classList.add('active');
}

// Lógica de Juego (Quiz)
function startQuiz() {
  state.deck = state.allData.filter(item => state.selectedSubgroups.has(getSubgroupId(item)));
  shuffle(state.deck);
  state.currentIndex = 0;
  state.score = { correct: 0, incorrect: 0 };
  updateScoreUI();
  switchView('quiz');
  showCard();
}

// Algoritmo Fisher-Yates (opcional si buscas aleatoriedad perfecta)
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function showCard() {
  dom.feedback.textContent = '';
  dom.feedback.className = 'feedback';
  dom.answerInput.value = '';
  dom.answerInput.focus();

  const current = state.deck[state.currentIndex];
  dom.cardPrompt.textContent = current.prompt;
  dom.cardBadge.textContent = `${current.system.toUpperCase()} · ${current.deck}`;

  if (dom.toggleMeaning.checked && current.meaning) {
    dom.cardMeaning.innerHTML = `<a href="${current.meaning}" target="_blank" rel="noopener noreferrer">🔍 Ver en Jisho</a>`;
    dom.cardMeaning.style.display = 'block';
  } else {
    dom.cardMeaning.style.display = 'none';
  }
}

let quizTimeoutId = null;

function handleAnswer() {
  // Previene múltiples envíos simultáneos
  if (quizTimeoutId !== null) {
    advanceToNextCard();
    return;
  }

  const current = state.deck[state.currentIndex];
  const input = dom.answerInput.value.trim().toLowerCase();
  
  const targetReading = current.reading.trim().toLowerCase();
  const targetRomaji = (current.romaji || '').trim().toLowerCase();

  const isCorrect = input === targetReading || (targetRomaji && input === targetRomaji);

  if (isCorrect) {
    state.score.correct++;
    dom.feedback.textContent = '¡Correcto! ' + current.reading + (current.romaji ? ` (${current.romaji})` : '');
    dom.feedback.className = 'feedback correct';
  } else {
    state.score.incorrect++;
    dom.feedback.textContent = `Incorrecto. Respuesta: ${current.reading}` + (current.romaji ? ` (${current.romaji})` : '');
    dom.feedback.className = 'feedback incorrect';
  }

  updateScoreUI();

  // Transición automática tras 1200ms
  quizTimeoutId = setTimeout(() => {
    advanceToNextCard();
  }, 1200);
}

// Avanza a la siguiente tarjeta y limpia timeouts 
function advanceToNextCard() {
  if (quizTimeoutId !== null) {
    clearTimeout(quizTimeoutId);
    quizTimeoutId = null;
  }
  state.currentIndex = (state.currentIndex + 1) % state.deck.length;
  showCard();
}


// Event Listeners Globales para Atajos de Teclado
document.addEventListener('keydown', (e) => {
  // Tecla 'Escape' para cerrar el modal de subgrupos si está abierto
  if (e.key === 'Escape' && dom.modal && dom.modal.classList.contains('active')) {
    closeModal();
    return;
  }

  // Teclado durante la vista de Quiz
  if (views.quiz.classList.contains('active')) {
    // Si la retroalimentación está visible y el usuario presiona Enter o Espacio, avanza de inmediato
    if (quizTimeoutId !== null && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      advanceToNextCard();
    }
  }
});

function updateScoreUI() {
  dom.scoreCorrect.textContent = `✓ ${state.score.correct}`;
  dom.scoreIncorrect.textContent = `✗ ${state.score.incorrect}`;
}

// Conversor Romaji -> Kana
function convertRomajiToKana(input, targetSystem = 'hiragana') {
  const isKatakana = targetSystem === 'katakana';

  const map = {
    // Dipthongs & Combination Sounds
    kya: isKatakana ? 'キャ' : 'きゃ', kyu: isKatakana ? 'キュ' : 'きゅ', kyo: isKatakana ? 'キョ' : 'きょ',
    sha: isKatakana ? 'シャ' : 'しゃ', shu: isKatakana ? 'シュ' : 'しゅ', sho: isKatakana ? 'ショ' : 'しょ',
    sya: isKatakana ? 'シャ' : 'しゃ', syu: isKatakana ? 'シュ' : 'しゅ', syo: isKatakana ? 'ショ' : 'しょ',
    cha: isKatakana ? 'チャ' : 'ちゃ', chu: isKatakana ? 'チュ' : 'ちゅ', cho: isKatakana ? 'チョ' : 'ちょ',
    tya: isKatakana ? 'チャ' : 'ちゃ', tyu: isKatakana ? 'チュ' : 'ちゅ', tyo: isKatakana ? 'チョ' : 'ちょ',
    nya: isKatakana ? 'ニャ' : 'にゃ', nyu: isKatakana ? 'ニュ' : 'にゅ', nyo: isKatakana ? 'ニョ' : 'にょ',
    hya: isKatakana ? 'ヒャ' : 'ひゃ', hyu: isKatakana ? 'ヒュ' : 'ひゅ', hyo: isKatakana ? 'ヒョ' : 'ひょ',
    mya: isKatakana ? 'ミャ' : 'みゃ', myu: isKatakana ? 'ミュ' : 'みゅ', myo: isKatakana ? 'ミョ' : 'みょ',
    rya: isKatakana ? 'リャ' : 'りゃ', ryu: isKatakana ? 'リュ' : 'りゅ', ryo: isKatakana ? 'リョ' : 'りょ',
    gya: isKatakana ? 'ギャ' : 'ぎゃ', gyu: isKatakana ? 'ギュ' : 'ぎゅ', gyo: isKatakana ? 'ギョ' : 'ぎょ',
    ja: isKatakana ? 'ジャ' : 'じゃ', ju: isKatakana ? 'ジュ' : 'じゅ', jo: isKatakana ? 'ジョ' : 'じょ',
    jya: isKatakana ? 'ジャ' : 'じゃ', jyu: isKatakana ? 'ジュ' : 'じゅ', jyo: isKatakana ? 'ジョ' : 'じょ',
    zya: isKatakana ? 'ジャ' : 'じゃ', zyu: isKatakana ? 'ジュ' : 'じゅ', zyo: isKatakana ? 'ジョ' : 'じょ',
    bya: isKatakana ? 'ビャ' : 'びゃ', byu: isKatakana ? 'ビュ' : 'びゅ', byo: isKatakana ? 'ビョ' : 'びょ',
    pya: isKatakana ? 'ピャ' : 'ぴゃ', pyu: isKatakana ? 'ピュ' : 'ぴゅ', pyo: isKatakana ? 'ピョ' : 'ぴょ',

    // Kana Básicos y variaciones (si/shi, tu/tsu, hu/fu, zi/ji)
    a: isKatakana ? 'ア' : 'あ', i: isKatakana ? 'イ' : 'い', u: isKatakana ? 'ウ' : 'う', e: isKatakana ? 'エ' : 'え', o: isKatakana ? 'オ' : 'お',
    ka: isKatakana ? 'カ' : 'か', ki: isKatakana ? 'キ' : 'き', ku: isKatakana ? 'ク' : 'く', ke: isKatakana ? 'ケ' : 'け', ko: isKatakana ? 'コ' : 'こ',
    sa: isKatakana ? 'サ' : 'さ', shi: isKatakana ? 'シ' : 'し', si: isKatakana ? 'シ' : 'し', su: isKatakana ? 'ス' : 'す', se: isKatakana ? 'セ' : 'せ', so: isKatakana ? 'ソ' : 'そ',
    ta: isKatakana ? 'タ' : 'た', chi: isKatakana ? 'チ' : 'ち', ti: isKatakana ? 'チ' : 'ち', tsu: isKatakana ? 'ツ' : 'つ', tu: isKatakana ? 'ツ' : 'つ', te: isKatakana ? 'テ' : 'て', to: isKatakana ? 'ト' : 'と',
    na: isKatakana ? 'ナ' : 'な', ni: isKatakana ? 'ニ' : 'に', nu: isKatakana ? 'ヌ' : 'ぬ', ne: isKatakana ? 'ネ' : 'ね', no: isKatakana ? 'ノ' : 'の',
    ha: isKatakana ? 'ハ' : 'は', hi: isKatakana ? 'ヒ' : 'ひ', fu: isKatakana ? 'フ' : 'ふ', hu: isKatakana ? 'フ' : 'ふ', he: isKatakana ? 'ヘ' : 'へ', ho: isKatakana ? 'ホ' : 'ほ',
    ma: isKatakana ? 'マ' : 'ま', mi: isKatakana ? 'ミ' : 'み', mu: isKatakana ? 'ム' : 'む', me: isKatakana ? 'メ' : 'め', mo: isKatakana ? 'モ' : 'も',
    ya: isKatakana ? 'ヤ' : 'や', yu: isKatakana ? 'ユ' : 'ゆ', yo: isKatakana ? 'ヨ' : 'よ',
    ra: isKatakana ? 'ラ' : 'ら', ri: isKatakana ? 'リ' : 'り', ru: isKatakana ? 'ル' : 'る', re: isKatakana ? 'レ' : 'れ', ro: isKatakana ? 'ロ' : 'ろ',
    wa: isKatakana ? 'ワ' : 'わ', wo: isKatakana ? 'ヲ' : 'を',
    
    ga: isKatakana ? 'ガ' : 'が', gi: isKatakana ? 'ギ' : 'ぎ', gu: isKatakana ? 'グ' : 'ぐ', ge: isKatakana ? 'ゲ' : 'げ', go: isKatakana ? 'ゴ' : 'ご',
    za: isKatakana ? 'ザ' : 'ざ', ji: isKatakana ? 'ジ' : 'じ', zi: isKatakana ? 'ジ' : 'じ', zu: isKatakana ? 'ズ' : 'ず', ze: isKatakana ? 'ゼ' : 'ぜ', zo: isKatakana ? 'ゾ' : 'ぞ',
    da: isKatakana ? 'ダ' : 'だ', dzi: isKatakana ? 'ヂ' : 'ぢ', di: isKatakana ? 'ヂ' : 'ぢ', dzu: isKatakana ? 'ヅ' : 'づ', du: isKatakana ? 'ヅ' : 'づ', de: isKatakana ? 'デ' : 'で', do: isKatakana ? 'ド' : 'ど',
    ba: isKatakana ? 'バ' : 'ば', bi: isKatakana ? 'ビ' : 'び', bu: isKatakana ? 'ブ' : 'ぶ', be: isKatakana ? 'ベ' : 'べ', bo: isKatakana ? 'ボ' : 'ぼ',
    pa: isKatakana ? 'パ' : 'ぱ', pi: isKatakana ? 'ピ' : 'ぴ', pu: isKatakana ? 'プ' : 'ぷ', pe: isKatakana ? 'ペ' : 'ぺ', po: isKatakana ? 'ポ' : 'ぽ',
    '-': 'ー'
  };

  let str = input.toLowerCase();
  const sokuon = isKatakana ? 'ッ' : 'っ';
  const singleN = isKatakana ? 'ン' : 'ん';
  
  // 1. Consonantes dobles -> Sokuon (っ / ッ)
  str = str.replace(/([bcdfghjklmpqrstvwxyz])\1/g, sokuon + '$1');

  // 2. Doble 'nn' o 'n'' -> ん / ン explícito
  str = str.replace(/nn/g, singleN).replace(/n'/g, singleN);

  // 3. Mapeo de combinaciones y sílabas Kana
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  keys.forEach(k => {
    str = str.replaceAll(k, map[k]);
  });

  // 4. Convierte 'n' seguida de consonante que NO sea 'y' (ej. nk -> んk)
  str = str.replace(/n(?=[bcdfghjklmnpqrstvwxz])/g, singleN);

  return str;
}

dom.answerInput.addEventListener('input', (e) => {
  const currentCard = state.deck[state.currentIndex];
  const system = currentCard ? currentCard.system : 'hiragana';
  const targetSystem = system === 'katakana' ? 'katakana' : 'hiragana';
  e.target.value = convertRomajiToKana(e.target.value, targetSystem);
});

document.addEventListener('DOMContentLoaded', init);