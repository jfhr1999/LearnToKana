let activeQueue = [];
let reviewQueue = [];
let currentItem = null;
let showingAnswer = false;

function initConfig() {
  const groups = [...new Set(DATASET.map(i => i.group))];
  const container = document.getElementById('groups-list');
  container.innerHTML = groups.map(g => `
    <label style="display:block; margin-bottom: 5px;">
      <input type="checkbox" value="${g}" checked> ${g}
    </label>
  `).join('');
}

function filterCategory(type) {
  const checkboxes = document.querySelectorAll('#groups-list input[type="checkbox"]');
  checkboxes.forEach(cb => {
    if (cb.value.includes(type)) {
      cb.checked = true;
    }
  });
}

function clearAllFilters() {
  const checkboxes = document.querySelectorAll('#groups-list input[type="checkbox"]');
  checkboxes.forEach(cb => cb.checked = false);
}

function startGame() {
  const selectedGroups = Array.from(document.querySelectorAll('#groups-list input:checked')).map(cb => cb.value);
  if (selectedGroups.length === 0) return alert('Selecciona al menos un grupo.');

  const filtered = DATASET.filter(item => selectedGroups.includes(item.group));
  activeQueue = [...filtered].sort(() => Math.random() - 0.5);
  reviewQueue = [];

  document.getElementById('config-view').style.display = 'none';
  document.getElementById('game-view').style.display = 'block';
  nextCard();
}

function nextCard() {
  showingAnswer = false;
  document.getElementById('furigana-text').innerText = '';
  const input = document.getElementById('user-input');
  input.value = '';
  input.focus();

  if (activeQueue.length === 0) {
    if (reviewQueue.length > 0) {
      activeQueue = [...reviewQueue].sort(() => Math.random() - 0.5);
      reviewQueue = [];
    } else {
      alert('¡Excelente! Has completado todos los ítems seleccionados.');
      document.getElementById('config-view').style.display = 'block';
      document.getElementById('game-view').style.display = 'none';
      return;
    }
  }

  currentItem = activeQueue.pop();
  const kanaEl = document.getElementById('kana-display');
  kanaEl.innerText = currentItem.kana;
  kanaEl.href = `https://jisho.org/search/${encodeURIComponent(currentItem.kana)}`;
  
  updateStats();
}

function updateStats() {
  document.getElementById('stats-display').innerText = 
    `Restantes: ${activeQueue.length + 1} | En revisión: ${reviewQueue.length}`;
}

document.getElementById('user-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    const val = this.value.trim().toLowerCase();
    
    if (val === currentItem.romaji.toLowerCase()) {
      nextCard();
    } else {
      if (!showingAnswer) {
        document.getElementById('furigana-text').innerText = `${currentItem.furigana} (${currentItem.romaji})`;
        reviewQueue.push(currentItem);
        showingAnswer = true;
        updateStats();
      } else {
        nextCard();
      }
    }
  }
});

document.addEventListener('DOMContentLoaded', initConfig);