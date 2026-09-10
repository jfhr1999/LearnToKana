const fs = require('fs');

// 1. Aquí pegas tu lista de palabras crudas
const vocabularioCrudo = [
  { prompt: "日", reading: "ひ", romaji: "hi", meaning: "Día / Sol", level: "N5" },
  { prompt: "月", reading: "つき", romaji: "tsuki", meaning: "Luna / Mes", level: "N5" },
  { prompt: "木", reading: "き", romaji: "ki", meaning: "Árbol", level: "N5" },
  { prompt: "山", reading: "やま", romaji: "yama", meaning: "Montaña", level: "N5" },
  { prompt: "川", reading: "かわ", romaji: "kawa", meaning: "Río", level: "N5" },
  { prompt: "田", reading: "た", romaji: "ta", meaning: "Campo de arroz", level: "N5" },
  { prompt: "人", reading: "ひと", romaji: "hito", meaning: "Persona", level: "N5" },
  { prompt: "口", reading: "くち", romaji: "kuchi", meaning: "Boca", level: "N5" },
  { prompt: "車", reading: "くるま", romaji: "kuruma", meaning: "Coche", level: "N5" },
  { prompt: "門", reading: "もん", romaji: "mon", meaning: "Puerta principal", level: "N5" },
  { prompt: "火", reading: "ひ", romaji: "hi", meaning: "Fuego", level: "N5" }
];

// 2. Función que transforma tus datos al formato de la App
function procesarDatos(lista) {
  const TAMANO_BLOQUE = 10; // Agrupa de 10 en 10
  
  return lista.map((item, index) => {
    // Calcula si es Bloque 01, Bloque 02, etc.
    const numeroBloque = String(Math.floor(index / TAMANO_BLOQUE) + 1).padStart(2, '0');
    
    return {
      id: `kj_${item.level.toLowerCase()}_b${numeroBloque}_${index + 1}`,
      prompt: item.prompt,
      reading: item.reading,
      romaji: item.romaji,
      meaning: item.meaning,
      system: "kanji",
      deck: "jlpt",
      group: `JLPT ${item.level} - Bloque ${numeroBloque}`
    };
  });
}

// 3. Transformar y guardar en la carpeta /data
const resultado = procesarDatos(vocabularioCrudo);

fs.writeFileSync('./data/study_data.json', JSON.stringify(resultado, null, 2));
console.log(`✅ ¡Éxito! Se guardaron ${resultado.length} ítems en ./data/study_data.json`);