const fs = require('fs');

// Read current file
let content = fs.readFileSync('src/app-multilang-fixed.js', 'utf8');

// Replace language detection function
const newDetection = `function detectLanguage(message) {
  const lower = message.toLowerCase();
  console.log(\`🕵️ Analyzing message: "\${message}"\`);
  
  let scores = { pl: 0, de: 0, en: 0 };
  
  // POLISH CHARACTERS (strongest indicator)
  if (lower.match(/[ąćęłńóśźż]/)) scores.pl += 5;
  
  // POLISH KEYWORDS (high priority)
  const polishWords = ['cześć', 'hej', 'jestem', 'chcę', 'chciałbym', 'trening', 'dieta', 'siłownia', 'ćwiczenia', 'zdrowie', 'dzięki', 'witaminy', 'przyjmować', 'jaką', 'mogę', 'hashimoto', 'się'];
  polishWords.forEach(word => {
    if (lower.includes(word)) scores.pl += 3;
  });
  
  // GERMAN KEYWORDS
  const germanWords = ['hallo', 'ich', 'bin', 'möchte', 'training', 'ernährung', 'danke', 'bitte', 'gut', 'wie', 'was', 'fitnessstudio'];
  germanWords.forEach(word => {
    if (lower.includes(word)) scores.de += 2;
  });
  
  // ENGLISH KEYWORDS (lower priority to avoid false positives)
  const englishWords = ['hello', 'want', 'would', 'workout', 'nutrition', 'fitness', 'gym', 'exercise', 'health', 'thanks'];
  englishWords.forEach(word => {
    if (lower.includes(word)) scores.en += 2;
  });
  
  console.log(\`📊 Language scores:\`, scores);
  
  // Find highest score
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'pl'; // Default Polish
  
  const detectedLang = Object.keys(scores).find(lang => scores[lang] === maxScore);
  console.log(\`🎯 Detected language: \${detectedLang}\`);
  
  return detectedLang;
}`;

// Replace old function
content = content.replace(/function detectLanguage\(message\) \{[\s\S]*?\n\}/m, newDetection);

// Write back
fs.writeFileSync('src/app-multilang-fixed.js', content);

console.log('✅ Language detection fixed!');
