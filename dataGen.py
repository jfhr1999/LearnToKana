import json
import urllib.parse
from playwright.sync_api import sync_playwright


""" No funciona, saca datos de forma arbitraria y no obtiene los valores de forma acertada"""
# Lista de URLs de RealKana o páginas con estructura similar
URLS = [
    #hiragana
    {"url": "https://realkana.com/hiragana/single", "system": "hiragana", "deck": "single", "level":"1","group":"1"},
    {"url": "https://realkana.com/hiragana/double", "system": "hiragana", "deck": "double", "level":"1","group":"1"},

    {"url": "https://realkana.com/hiragana/words", "system": "hiragana", "deck": "words1", "level":"1","group":"1"},
    {"url": "https://realkana.com/hiragana/words/2", "system": "hiragana", "deck": "words2", "level":"2","group":"1"},
    {"url": "https://realkana.com/hiragana/words/3", "system": "hiragana", "deck": "words3", "level":"3","group":"1"},
    {"url": "https://realkana.com/hiragana/words/4", "system": "hiragana", "deck": "words4", "level":"4","group":"1"},
    {"url": "https://realkana.com/hiragana/words/5", "system": "hiragana", "deck": "words5", "level":"5","group":"1"},

    #katakana
    {"url": "https://realkana.com/katakana/single", "system": "katakana", "deck": "single", "level":"1","group":"1"},
    {"url": "https://realkana.com/katakana/double", "system": "katakana", "deck": "double", "level":"1","group":"1"},
    {"url": "https://realkana.com/katakana/extended", "system": "katakana", "deck": "extended", "level":"1","group":"1"},

    {"url": "https://realkana.com/katakana/words", "system": "katakana", "deck": "words1", "level":"1","group":"1"},
    {"url": "https://realkana.com/katakana/words/2", "system": "katakana", "deck": "words2", "level":"2","group":"1"},
    {"url": "https://realkana.com/katakana/words/3", "system": "katakana", "deck": "words3", "level":"3","group":"1"},
    {"url": "https://realkana.com/katakana/words/4", "system": "katakana", "deck": "words4", "level":"4","group":"1"},
    {"url": "https://realkana.com/katakana/words/5", "system": "katakana", "deck": "words5", "level":"5","group":"1"},

    #kanji - Frecuency
    {"url": "https://realkana.com/kanji/frequency/words", "system": "kanji", "deck": "frecuency", "level":"1", "group":"1"},
    {"url": "https://realkana.com/kanji/frequency/words/1/2", "system": "kanji", "deck": "frecuency", "level":"1", "group":"2"},
    {"url": "https://realkana.com/kanji/frequency/words/1/3", "system": "kanji", "deck": "frecuency", "level":"1", "group":"3"},
    {"url": "https://realkana.com/kanji/frequency/words/1/4", "system": "kanji", "deck": "frecuency", "level":"1", "group":"4"},

    {"url": "https://realkana.com/kanji/frequency/words/2", "system": "kanji", "deck": "frecuency", "level":"2", "group":"1"},
    {"url": "https://realkana.com/kanji/frequency/words/2/2", "system": "kanji", "deck": "frecuency", "level":"2", "group":"2"},
    {"url": "https://realkana.com/kanji/frequency/words/2/3", "system": "kanji", "deck": "frecuency", "level":"2", "group":"3"},
    {"url": "https://realkana.com/kanji/frequency/words/2/4", "system": "kanji", "deck": "frecuency", "level":"2", "group":"4"},

    {"url": "https://realkana.com/kanji/frequency/words/3", "system": "kanji", "deck": "frecuency", "level":"3", "group":"1"},
    {"url": "https://realkana.com/kanji/frequency/words/3/2", "system": "kanji", "deck": "frecuency", "level":"3", "group":"2"},
    {"url": "https://realkana.com/kanji/frequency/words/3/3", "system": "kanji", "deck": "frecuency", "level":"3", "group":"3"},
    {"url": "https://realkana.com/kanji/frequency/words/3/4", "system": "kanji", "deck": "frecuency", "level":"3", "group":"4"},

    {"url": "https://realkana.com/kanji/frequency/words/4", "system": "kanji", "deck": "frecuency", "level":"4", "group":"1"},
    {"url": "https://realkana.com/kanji/frequency/words/4/2", "system": "kanji", "deck": "frecuency", "level":"4", "group":"2"},
    {"url": "https://realkana.com/kanji/frequency/words/4/3", "system": "kanji", "deck": "frecuency", "level":"4", "group":"3"},
    {"url": "https://realkana.com/kanji/frequency/words/4/4", "system": "kanji", "deck": "frecuency", "level":"4", "group":"4"},

    {"url": "https://realkana.com/kanji/frequency/words/5", "system": "kanji", "deck": "frecuency", "level":"5", "group":"1"},
    {"url": "https://realkana.com/kanji/frequency/words/5/2", "system": "kanji", "deck": "frecuency", "level":"5", "group":"2"},
    {"url": "https://realkana.com/kanji/frequency/words/5/3", "system": "kanji", "deck": "frecuency", "level":"5", "group":"3"},
    {"url": "https://realkana.com/kanji/frequency/words/5/4", "system": "kanji", "deck": "frecuency", "level":"5", "group":"4"},

    {"url": "https://realkana.com/kanji/frequency/words/6", "system": "kanji", "deck": "frecuency", "level":"6", "group":"1"},
    {"url": "https://realkana.com/kanji/frequency/words/6/2", "system": "kanji", "deck": "frecuency", "level":"6", "group":"2"},
    {"url": "https://realkana.com/kanji/frequency/words/6/3", "system": "kanji", "deck": "frecuency", "level":"6", "group":"3"},
    {"url": "https://realkana.com/kanji/frequency/words/6/4", "system": "kanji", "deck": "frecuency", "level":"6", "group":"4"},

    {"url": "https://realkana.com/kanji/frequency/words/7", "system": "kanji", "deck": "frecuency", "level":"7", "group":"1"},
    {"url": "https://realkana.com/kanji/frequency/words/7/2", "system": "kanji", "deck": "frecuency", "level":"7", "group":"2"},
    {"url": "https://realkana.com/kanji/frequency/words/7/3", "system": "kanji", "deck": "frecuency", "level":"7", "group":"3"},
    {"url": "https://realkana.com/kanji/frequency/words/7/4", "system": "kanji", "deck": "frecuency", "level":"7", "group":"4"},

    {"url": "https://realkana.com/kanji/frequency/words/8", "system": "kanji", "deck": "frecuency", "level":"8", "group":"1"},
    {"url": "https://realkana.com/kanji/frequency/words/8/2", "system": "kanji", "deck": "frecuency", "level":"8", "group":"2"},
    {"url": "https://realkana.com/kanji/frequency/words/8/3", "system": "kanji", "deck": "frecuency", "level":"8", "group":"3"},
    {"url": "https://realkana.com/kanji/frequency/words/8/4", "system": "kanji", "deck": "frecuency", "level":"8", "group":"4"},

    {"url": "https://realkana.com/kanji/frequency/words/9", "system": "kanji", "deck": "frecuency", "level":"9", "group":"1"},
    {"url": "https://realkana.com/kanji/frequency/words/9/2", "system": "kanji", "deck": "frecuency", "level":"9", "group":"2"},
    {"url": "https://realkana.com/kanji/frequency/words/9/3", "system": "kanji", "deck": "frecuency", "level":"9", "group":"3"},
    {"url": "https://realkana.com/kanji/frequency/words/9/4", "system": "kanji", "deck": "frecuency", "level":"9", "group":"4"},

    {"url": "https://realkana.com/kanji/frequency/words/10", "system": "kanji", "deck": "frecuency", "level":"10", "group":"1"},
    {"url": "https://realkana.com/kanji/frequency/words/10/2", "system": "kanji", "deck": "frecuency", "level":"10", "group":"2"},
    {"url": "https://realkana.com/kanji/frequency/words/10/3", "system": "kanji", "deck": "frecuency", "level":"10", "group":"3"},
    {"url": "https://realkana.com/kanji/frequency/words/10/4", "system": "kanji", "deck": "frecuency", "level":"10", "group":"4"},

    #kanji - JLPT
    {"url": "https://realkana.com/kanji/jlpt/words", "system": "kanji", "deck": "jlpt", "level":"N5", "group":"1"},
    {"url": "https://realkana.com/kanji/jlpt/words/1/2", "system": "kanji", "deck": "jlpt", "level":"N5", "group":"2"},
    {"url": "https://realkana.com/kanji/jlpt/words/1/3", "system": "kanji", "deck": "jlpt", "level":"N5", "group":"3"},

    {"url": "https://realkana.com/kanji/jlpt/words/2", "system": "kanji", "deck": "jlpt", "level":"N4", "group":"1"},
    {"url": "https://realkana.com/kanji/jlpt/words/2/2", "system": "kanji", "deck": "jlpt", "level":"N4", "group":"2"},
    {"url": "https://realkana.com/kanji/jlpt/words/2/3", "system": "kanji", "deck": "jlpt", "level":"N4", "group":"3"},
    {"url": "https://realkana.com/kanji/jlpt/words/2/3", "system": "kanji", "deck": "jlpt", "level":"N4", "group":"4"},

    {"url": "https://realkana.com/kanji/jlpt/words/3", "system": "kanji", "deck": "jlpt", "level":"N3", "group":"1"},
    {"url": "https://realkana.com/kanji/jlpt/words/3/2", "system": "kanji", "deck": "jlpt", "level":"N3", "group":"2"},
    {"url": "https://realkana.com/kanji/jlpt/words/3/3", "system": "kanji", "deck": "jlpt", "level":"N3", "group":"3"},
    {"url": "https://realkana.com/kanji/jlpt/words/3/3", "system": "kanji", "deck": "jlpt", "level":"N3", "group":"4"},
    {"url": "https://realkana.com/kanji/jlpt/words/3/4", "system": "kanji", "deck": "jlpt", "level":"N3", "group":"5"},
    {"url": "https://realkana.com/kanji/jlpt/words/3/5", "system": "kanji", "deck": "jlpt", "level":"N3", "group":"6"},
    {"url": "https://realkana.com/kanji/jlpt/words/3/6", "system": "kanji", "deck": "jlpt", "level":"N3", "group":"7"},
    {"url": "https://realkana.com/kanji/jlpt/words/3/7", "system": "kanji", "deck": "jlpt", "level":"N3", "group":"8"},        
    {"url": "https://realkana.com/kanji/jlpt/words/3/8", "system": "kanji", "deck": "jlpt", "level":"N3", "group":"9"},
    {"url": "https://realkana.com/kanji/jlpt/words/3/9", "system": "kanji", "deck": "jlpt", "level":"N3", "group":"10"},
    {"url": "https://realkana.com/kanji/jlpt/words/3/10", "system": "kanji", "deck": "jlpt", "level":"N3", "group":"11"},
    {"url": "https://realkana.com/kanji/jlpt/words/3/11", "system": "kanji", "deck": "jlpt", "level":"N3", "group":"12"},
    {"url": "https://realkana.com/kanji/jlpt/words/3/12", "system": "kanji", "deck": "jlpt", "level":"N3", "group":"13"},

    {"url": "https://realkana.com/kanji/jlpt/words/4", "system": "kanji", "deck": "jlpt", "level":"N2", "group":"1"},
    {"url": "https://realkana.com/kanji/jlpt/words/4/2", "system": "kanji", "deck": "jlpt", "level":"N2", "group":"2"},
    {"url": "https://realkana.com/kanji/jlpt/words/4/3", "system": "kanji", "deck": "jlpt", "level":"N2", "group":"3"},
    {"url": "https://realkana.com/kanji/jlpt/words/4/3", "system": "kanji", "deck": "jlpt", "level":"N2", "group":"4"},
    {"url": "https://realkana.com/kanji/jlpt/words/4/4", "system": "kanji", "deck": "jlpt", "level":"N2", "group":"5"},
    {"url": "https://realkana.com/kanji/jlpt/words/4/5", "system": "kanji", "deck": "jlpt", "level":"N2", "group":"6"},
    {"url": "https://realkana.com/kanji/jlpt/words/4/6", "system": "kanji", "deck": "jlpt", "level":"N2", "group":"7"},

    {"url": "https://realkana.com/kanji/jlpt/words/5", "system": "kanji", "deck": "jlpt", "level":"N1", "group":"1"},
    {"url": "https://realkana.com/kanji/jlpt/words/5/2", "system": "kanji", "deck": "jlpt", "level":"N1", "group":"2"},
    {"url": "https://realkana.com/kanji/jlpt/words/5/3", "system": "kanji", "deck": "jlpt", "level":"N1", "group":"3"},
    {"url": "https://realkana.com/kanji/jlpt/words/5/3", "system": "kanji", "deck": "jlpt", "level":"N1", "group":"4"},
    {"url": "https://realkana.com/kanji/jlpt/words/5/4", "system": "kanji", "deck": "jlpt", "level":"N1", "group":"5"},
    {"url": "https://realkana.com/kanji/jlpt/words/5/5", "system": "kanji", "deck": "jlpt", "level":"N1", "group":"6"},
    {"url": "https://realkana.com/kanji/jlpt/words/5/6", "system": "kanji", "deck": "jlpt", "level":"N1", "group":"7"},
    {"url": "https://realkana.com/kanji/jlpt/words/5/7", "system": "kanji", "deck": "jlpt", "level":"N1", "group":"8"},        
    {"url": "https://realkana.com/kanji/jlpt/words/5/8", "system": "kanji", "deck": "jlpt", "level":"N1", "group":"9"},
    {"url": "https://realkana.com/kanji/jlpt/words/5/9", "system": "kanji", "deck": "jlpt", "level":"N1", "group":"10"},
    {"url": "https://realkana.com/kanji/jlpt/words/5/10", "system": "kanji", "deck": "jlpt", "level":"N1", "group":"11"},
    {"url": "https://realkana.com/kanji/jlpt/words/5/11", "system": "kanji", "deck": "jlpt", "level":"N1", "group":"12"},

    #kanji - kanken
    {"url": "https://realkana.com/kanji/kanken/words", "system": "kanji", "deck": "kanken", "level":"10-8", "group":"1"},
    {"url": "https://realkana.com/kanji/kanken/words/1/2", "system": "kanji", "deck": "kanken", "level":"10-8", "group":"2"},
    {"url": "https://realkana.com/kanji/kanken/words/1/3", "system": "kanji", "deck": "kanken", "level":"10-8", "group":"3"},
    {"url": "https://realkana.com/kanji/kanken/words/1/3", "system": "kanji", "deck": "kanken", "level":"10-8", "group":"4"},
    {"url": "https://realkana.com/kanji/kanken/words/1/4", "system": "kanji", "deck": "kanken", "level":"10-8", "group":"5"},
    {"url": "https://realkana.com/kanji/kanken/words/1/5", "system": "kanji", "deck": "kanken", "level":"10-8", "group":"6"},
    {"url": "https://realkana.com/kanji/kanken/words/1/6", "system": "kanji", "deck": "kanken", "level":"10-8", "group":"7"},

    {"url": "https://realkana.com/kanji/kanken/words/2", "system": "kanji", "deck": "kanken", "level":"7-5", "group":"1"},
    {"url": "https://realkana.com/kanji/kanken/words/2/2", "system": "kanji", "deck": "kanken", "level":"7-5", "group":"2"},
    {"url": "https://realkana.com/kanji/kanken/words/2/3", "system": "kanji", "deck": "kanken", "level":"7-5", "group":"3"},
    {"url": "https://realkana.com/kanji/kanken/words/2/3", "system": "kanji", "deck": "kanken", "level":"7-5", "group":"4"},
    {"url": "https://realkana.com/kanji/kanken/words/2/4", "system": "kanji", "deck": "kanken", "level":"7-5", "group":"5"},
    {"url": "https://realkana.com/kanji/kanken/words/2/5", "system": "kanji", "deck": "kanken", "level":"7-5", "group":"6"},
    {"url": "https://realkana.com/kanji/kanken/words/2/6", "system": "kanji", "deck": "kanken", "level":"7-5", "group":"7"},
    {"url": "https://realkana.com/kanji/kanken/words/2/7", "system": "kanji", "deck": "kanken", "level":"7-5", "group":"8"},

    {"url": "https://realkana.com/kanji/kanken/words/3", "system": "kanji", "deck": "kanken", "level":"4", "group":"1"},
    {"url": "https://realkana.com/kanji/kanken/words/3/2", "system": "kanji", "deck": "kanken", "level":"4", "group":"2"},
    {"url": "https://realkana.com/kanji/kanken/words/3/3", "system": "kanji", "deck": "kanken", "level":"4", "group":"3"},
    {"url": "https://realkana.com/kanji/kanken/words/3/3", "system": "kanji", "deck": "kanken", "level":"4", "group":"4"},
    {"url": "https://realkana.com/kanji/kanken/words/3/4", "system": "kanji", "deck": "kanken", "level":"4", "group":"5"},

    {"url": "https://realkana.com/kanji/kanken/words/4", "system": "kanji", "deck": "kanken", "level":"3", "group":"1"},
    {"url": "https://realkana.com/kanji/kanken/words/4/2", "system": "kanji", "deck": "kanken", "level":"3", "group":"2"},
    {"url": "https://realkana.com/kanji/kanken/words/4/3", "system": "kanji", "deck": "kanken", "level":"3", "group":"3"},
    {"url": "https://realkana.com/kanji/kanken/words/4/3", "system": "kanji", "deck": "kanken", "level":"3", "group":"4"},

    {"url": "https://realkana.com/kanji/kanken/words/5", "system": "kanji", "deck": "kanken", "level":"pre-2", "group":"1"},
    {"url": "https://realkana.com/kanji/kanken/words/5/2", "system": "kanji", "deck": "kanken", "level":"pre-2", "group":"2"},
    {"url": "https://realkana.com/kanji/kanken/words/5/3", "system": "kanji", "deck": "kanken", "level":"pre-2", "group":"3"},
    {"url": "https://realkana.com/kanji/kanken/words/5/3", "system": "kanji", "deck": "kanken", "level":"pre-2", "group":"4"},

    {"url": "https://realkana.com/kanji/kanken/words/6", "system": "kanji", "deck": "kanken", "level":"2", "group":"1"},
    {"url": "https://realkana.com/kanji/kanken/words/6/2", "system": "kanji", "deck": "kanken", "level":"2", "group":"2"},

    {"url": "https://realkana.com/kanji/kanken/words/7", "system": "kanji", "deck": "kanken", "level":"extra", "group":"1"},
    {"url": "https://realkana.com/kanji/kanken/words/7/2", "system": "kanji", "deck": "kanken", "level":"extra", "group":"2"},
    {"url": "https://realkana.com/kanji/kanken/words/7/3", "system": "kanji", "deck": "kanken", "level":"extra", "group":"3"},
    {"url": "https://realkana.com/kanji/kanken/words/7/3", "system": "kanji", "deck": "kanken", "level":"extra", "group":"4"},
    {"url": "https://realkana.com/kanji/kanken/words/7/4", "system": "kanji", "deck": "kanken", "level":"extra", "group":"5"},
    {"url": "https://realkana.com/kanji/kanken/words/7/5", "system": "kanji", "deck": "kanken", "level":"extra", "group":"6"},

    #kanji - numbers
    {"url": "https://realkana.com/kanji/numbers/words", "system": "kanji", "deck": "numbers", "level":"1", "group":"1"},
    {"url": "https://realkana.com/kanji/numbers/words/2", "system": "kanji", "deck": "numbers", "level":"1", "group":"2"},
    {"url": "https://realkana.com/kanji/numbers/words/3", "system": "kanji", "deck": "numbers", "level":"1", "group":"3"},
    {"url": "https://realkana.com/kanji/numbers/words/4", "system": "kanji", "deck": "numbers", "level":"1", "group":"4"},
    {"url": "https://realkana.com/kanji/numbers/words/5", "system": "kanji", "deck": "numbers", "level":"1", "group":"5"},
    {"url": "https://realkana.com/kanji/numbers/words/6", "system": "kanji", "deck": "numbers", "level":"1", "group":"6"},
    {"url": "https://realkana.com/kanji/numbers/words/7", "system": "kanji", "deck": "numbers", "level":"1", "group":"7"},
    {"url": "https://realkana.com/kanji/numbers/words/8", "system": "kanji", "deck": "numbers", "level":"1", "group":"8"},        
    {"url": "https://realkana.com/kanji/numbers/words/9", "system": "kanji", "deck": "numbers", "level":"1", "group":"9"},
    {"url": "https://realkana.com/kanji/numbers/words/10", "system": "kanji", "deck": "numbers", "level":"1", "group":"10"},
    {"url": "https://realkana.com/kanji/numbers/words/11", "system": "kanji", "deck": "numbers", "level":"1", "group":"11"},
    {"url": "https://realkana.com/kanji/numbers/words/12", "system": "kanji", "deck": "numbers", "level":"1", "group":"12"},
    {"url": "https://realkana.com/kanji/numbers/words/13", "system": "kanji", "deck": "numbers", "level":"1", "group":"13"},
    {"url": "https://realkana.com/kanji/numbers/words/14", "system": "kanji", "deck": "numbers", "level":"1", "group":"14"},
    {"url": "https://realkana.com/kanji/numbers/words/15", "system": "kanji", "deck": "numbers", "level":"1", "group":"15"},
]

def scrape_realkana(sources):
    dataset = []
    item_id = 1

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        for source in sources:
            try:
                page.goto(source["url"], wait_until="networkidle", timeout=15000)

                is_words_or_kanji = source["deck"].startswith("words") or source["system"] == "kanji"

                if is_words_or_kanji:
                    # Obtenemos todos los contenedores de las lupas
                    magnifier_locators = page.locator('td:has(svg)')
                    total_magnifiers = magnifier_locators.count()
                    print(f"🔎 Encontradas {total_magnifiers} lupas en {source['url']}")

                    count_url = 0

                    for idx in range(total_magnifiers):
                        try:
                            # Hacer clic forzado en la lupa actual
                            magnifier_locators.nth(idx).click(force=True, timeout=3000)

                            # Esperar a que los datos se carguen dentro del modal
                            page.wait_for_selector('a[target="dictionary-lookup"]', timeout=3000)

                            # Extraer items del modal actual
                            items_data = page.evaluate('''() => {
                                const results = [];
                                const dictionaryLinks = document.querySelectorAll('a[target="dictionary-lookup"]');
                                
                                dictionaryLinks.forEach(link => {
                                    const row = link.closest('tr');
                                    const prompt = link.textContent.trim();
                                    let romaji = '';
                                    if (row) {
                                        const readingCell = row.querySelector('td:nth-child(2)');
                                        if (readingCell) {
                                            romaji = readingCell.textContent.trim();
                                        }
                                    }
                                    if (prompt) {
                                        results.push({ prompt, reading: prompt, romaji });
                                    }
                                });
                                return results;
                            }''')

                            subgroup_id = f"subgroup_{idx + 1}"

                            for item in items_data:
                                prompt = item.get("prompt", "").strip()
                                romaji = item.get("romaji", "").strip()
                                reading = item.get("reading", prompt).strip()

                                if not prompt:
                                    continue

                                dataset.append({
                                    "id": f"{source['system']}_{item_id}",
                                    "prompt": prompt,
                                    "reading": reading,
                                    "romaji": romaji,
                                    "meaning": f"https://jisho.org/search/{urllib.parse.quote(prompt)}",
                                    "system": source["system"],
                                    "deck": source["deck"],
                                    "level": source["level"],
                                    "group": source["group"],
                                    "subgroup": subgroup_id
                                })
                                item_id += 1
                                count_url += 1

                            # Cerrar el modal para dejar la pantalla lista para la siguiente lupa
                            page.keyboard.press("Escape")
                            # Esperar brevemente a que el modal desaparezca por completo
                            page.wait_for_timeout(300)

                        except Exception as err:
                            print(f"⚠️ Error procesando lupa #{idx + 1} en {source['url']}: {err}")
                            # Si falló, intentar cerrar el modal por si se quedó atascado
                            page.keyboard.press("Escape")

                    print(f"✓ Procesado: {source['url']} -> {count_url} ítems ({total_magnifiers} subgrupos)")

                else:
                    # CASO ESTÁNDAR: Single / Double / Extended (Sin modal ni subgrupos)
                    items_data = page.evaluate('''() => {
                        const results = [];
                        const cells = document.querySelectorAll('td.MuiTableCell-root');
                        cells.forEach(cell => {
                            const divs = cell.querySelectorAll('div');
                            if (divs.length >= 2) {
                                const prompt = divs[0].textContent.trim();
                                const romaji = divs[1].textContent.trim();
                                if (prompt) {
                                    results.push({ prompt, reading: prompt, romaji });
                                }
                            }
                        });
                        return results;
                    }''')

                    count_url = 0
                    for item in items_data:
                        prompt = item.get("prompt", "").strip()
                        romaji = item.get("romaji", "").strip()
                        reading = item.get("reading", prompt).strip()

                        if not prompt:
                            continue

                        dataset.append({
                            "id": f"{source['system']}_{item_id}",
                            "prompt": prompt,
                            "reading": reading,
                            "romaji": romaji,
                            "meaning": f"https://jisho.org/search/{urllib.parse.quote(prompt)}",
                            "system": source["system"],
                            "deck": source["deck"],
                            "level": source["level"],
                            "group": source["group"],
                            "subgroup": "1"
                        })
                        item_id += 1
                        count_url += 1

                    print(f"✓ Procesado: {source['url']} -> {count_url} ítems")

            except Exception as e:
                print(f"❌ Error en {source['url']}: {e}")

        browser.close()

    return dataset

# Ejecución
data = scrape_realkana(URLS)

with open('./data/study_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\n✅ Terminado. Se generaron {len(data)} entradas.")