const express = require("express");
const https = require("https");
const app = express();
const PORT = 3000;

const ACCESS_TOKEN = ('EAAKB3HOYzB4BPDo3186srGUyZCmZAlixRsCSijutmZCZB5TlkOldEzGZBkKh2FZB5ZCtP8cCqiqdjWouZCowx4SRdVZANJhzlghrXUYV2nncnCHV4qrgWPm14ZCXk61gXeLRQzxrkRlI9XM8EZBMtO6ialwgDMcqD4V1jxXRHof3NS5HqKChb6wn9vZB9AuBkoeXZA1x3sWZCEZB9U9FtR9ZCZBSEmlgdZBDYtnpnjR1gmjg500ZCEyjQZDZD');
const PHONE_NUMBER_ID = "726591527199931";
const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || 'sk-placeholder');

app.use(express.json());

const userConversations = new Map();
const userTrials = new Map();
const TRIAL_DAYS = 3;
const TRIAL_MESSAGE_LIMIT = 20;
const PREMIUM_PRICE = 99;

function checkUserAccess(userId) {
  if (!userTrials.has(userId)) {
    userTrials.set(userId, {
      startDate: new Date(),
      messageCount: 0,
      isPremium: false,
      trialExpired: false
    });
  }
  
  const user = userTrials.get(userId);
  const daysSinceStart = (new Date() - user.startDate) / (1000 * 60 * 60 * 24);
  
  if (daysSinceStart > TRIAL_DAYS && !user.isPremium) {
    user.trialExpired = true;
  }
  
  if (user.messageCount >= TRIAL_MESSAGE_LIMIT && !user.isPremium) {
    user.trialExpired = true;
  }
  
  return {
    canUse: user.isPremium || !user.trialExpired,
    remainingDays: Math.max(0, TRIAL_DAYS - daysSinceStart),
    remainingMessages: Math.max(0, TRIAL_MESSAGE_LIMIT - user.messageCount),
    isPremium: user.isPremium,
    isTrialExpired: user.trialExpired
  };
}

function getUpgradeMessage(lang, status) {
  const messages = {
    pl: {
      trialStart: `🎉 Witaj w AI Personal Trainer! 

🆓 DARMOWY TEST (${TRIAL_DAYS} dni):
- ${TRIAL_MESSAGE_LIMIT} wiadomości
- Wszystkie funkcje dostępne
- Personalizowane plany treningowe

💪 Zostało Ci: ${Math.ceil(status.remainingDays)} dni, ${status.remainingMessages} wiadomości

Upgrade do Premium za €${PREMIUM_PRICE}/miesiąc!`,

      trialExpired: `⏰ Twój trial wygasł!

💎 PREMIUM za €${PREMIUM_PRICE}/miesiąc:
✅ Unlimited wiadomości  
✅ Wszystkie funkcje AI
✅ Personalizowane plany 24/7

🔗 Kontakt: zbieracz444@gmail.com`,

      limitReached: `📱 Wykorzystałeś ${TRIAL_MESSAGE_LIMIT} darmowych wiadomości!

💎 Upgrade do PREMIUM za €${PREMIUM_PRICE}/miesiąc
🔗 Kontakt: zbieracz444@gmail.com`
    },
    
    de: {
      trialStart: `🎉 Willkommen bei AI Personal Trainer!

🆓 KOSTENLOSER TEST (${TRIAL_DAYS} Tage):
- ${TRIAL_MESSAGE_LIMIT} Nachrichten  
- Alle Funktionen verfügbar

💪 Übrig: ${Math.ceil(status.remainingDays)} Tage, ${status.remainingMessages} Nachrichten`,

      trialExpired: `⏰ Dein Trial ist abgelaufen!

💎 PREMIUM für €${PREMIUM_PRICE}/Monat:
✅ Unlimited Nachrichten
✅ Alle AI Funktionen  

🔗 Kontakt: zbieracz444@gmail.com`,

      limitReached: `📱 Du hast ${TRIAL_MESSAGE_LIMIT} kostenlose Nachrichten verbraucht!

💎 Upgrade zu PREMIUM für €${PREMIUM_PRICE}/Monat
🔗 Kontakt: zbieracz444@gmail.com`
    },
    
    en: {
      trialStart: `🎉 Welcome to AI Personal Trainer!

🆓 FREE TRIAL (${TRIAL_DAYS} days):
- ${TRIAL_MESSAGE_LIMIT} messages
- All features available

💪 Remaining: ${Math.ceil(status.remainingDays)} days, ${status.remainingMessages} messages`,

      trialExpired: `⏰ Your trial has expired!

💎 PREMIUM for €${PREMIUM_PRICE}/month:
✅ Unlimited messages
✅ All AI features

🔗 Contact: zbieracz444@gmail.com`,

      limitReached: `📱 You've used ${TRIAL_MESSAGE_LIMIT} free messages!

💎 Upgrade to PREMIUM for €${PREMIUM_PRICE}/month
🔗 Contact: zbieracz444@gmail.com`
    }
  };
  
  return messages[lang];
}


// 🔥 ULEPSZONA DETEKCJA JĘZYKA
function detectLanguage(message) {
  const lower = message.toLowerCase();
  console.log(`🕵️ Analyzing message: "${message}"`);
  
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
  
  console.log(`📊 Language scores:`, scores);
  
  // Find highest score
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'pl'; // Default Polish
  
  const detectedLang = Object.keys(scores).find(lang => scores[lang] === maxScore);
  console.log(`🎯 Detected language: ${detectedLang}`);
  
  return detectedLang;
}

// 🌍 VERY STRONG LANGUAGE PROMPTS
const LANGUAGE_SYSTEM_PROMPTS = {
  pl: `MUSISZ ODPOWIADAĆ WYŁĄCZNIE W JĘZYKU POLSKIM!
Używaj polskich słów, polskiej gramatyki, polskich zwrotów.
Przykład dobrej odpowiedzi: "Cześć! Jestem Coach AI. Jak mogę Ci pomóc z treningiem?"
NIGDY nie używaj angielskich lub niemieckich słów!`,

  de: `DU MUSST AUSSCHLIESSLICH AUF DEUTSCH ANTWORTEN!
Verwende deutsche Wörter, deutsche Grammatik, deutsche Redewendungen.
Beispiel einer guten Antwort: "Hallo! Ich bin Coach AI. Wie kann ich dir beim Training helfen?"
NIE englische oder polnische Wörter verwenden!`,

  en: `YOU MUST RESPOND EXCLUSIVELY IN ENGLISH!
Use English words, English grammar, English phrases.
Example of good response: "Hello! I'm Coach AI. How can I help you with training?"
NEVER use Polish or German words!`
};

const HYBRID_SYSTEM_PROMPT = `JESTEŚ COACH AI - EKSPERTEM OD HOLISTYCZNEGO ZDROWIA

🚫 OGRANICZENIA: TYLKO wellness/fitness/zdrowie/trening/dieta/sen/stres/mindfulness/suplementy/motywacja
Inne tematy = przekieruj na wellness

⚠️ NIGDY NIE DAWAJ PLANÓW TRENINGOWYCH BEZ ZEBRANIA PODSTAWOWYCH INFORMACJI!

🎯 PRZED PLANEM TRENINGOWYM ZAWSZE ZAPYTAJ O:
1. Wiek i płeć
2. Poziom doświadczenia (początkujący/średnio/zaawansowany)
3. Ograniczenia zdrowotne/kontuzje
4. Dostęp do sprzętu (siłownia/dom/outdoor)
5. Ile czasu na trening
6. Główny cel (siła/masa/spalanie/zdrowie)

🔍 PRZED DIETĄ ZAPYTAJ O:
1. Wagę i wzrost
2. Nietolerancje/alergie  
3. Preferencje żywieniowe
4. Tryb życia

💬 STYL:
- Empatyczny, wspierający, praktyczny
- Emotikony 💪⚡🔥💚
- Konkretne pytania follow-up
- Max 250 słów

🧬 FILOZOFIA:
- Trening: 3x45min > codziennie, technika > ciężar
- Dieta: 80/20, 1.6-2.2g białka/kg
- Sen: 7-9h, oddech 4-7-8
- Suplementy: kreatyna 5g, białko po treningu, wit D`;

function checkUserCompleteness(context) {
  const missing = [];
  
  if (!context.age) missing.push('age');
  if (!context.level) missing.push('level');
  if (!context.equipment) missing.push('equipment');
  if (!context.healthIssues) missing.push('health');
  if (!context.timeAvailable) missing.push('time');
  if (!context.goal) missing.push('goal');
  
  return missing;
}

function shouldForceQuestions(message, context) {
  const lower = message.toLowerCase();
  
  const wantsTraining = lower.includes('plan') || lower.includes('trening') || 
                       lower.includes('workout') || lower.includes('training') ||
                       lower.includes('ćwicz') || lower.includes('exercise') ||
                       lower.includes('chcę trenować') || lower.includes('want to train') ||
                       lower.includes('möchte trainieren') || lower.includes('start') ||
                       lower.includes('zacząć');
  
  if (wantsTraining) {
    const missing = checkUserCompleteness(context);
    return missing.length > 0 ? missing : false;
  }
  
  return false;
}

function callChatGPT(messages, callback) {
  const postData = JSON.stringify({
    model: "gpt-4o-mini",
    messages: messages,
    max_tokens: 400,
    temperature: 0.7,
    presence_penalty: 0.1,
    frequency_penalty: 0.1
  });

  const options = {
    hostname: 'api.openai.com',
    port: 443,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log(`💰 Tokens: ${result.usage?.total_tokens || 'unknown'}`);
        
        if (result.choices && result.choices[0]) {
          callback(null, result.choices[0].message.content);
        } else {
          callback(new Error('No response'), null);
        }
      } catch (error) {
        callback(error, null);
      }
    });
  });

  req.on('error', (error) => {
    callback(error, null);
  });

  req.write(postData);
  req.end();
}

async function generateMultilingualResponse(userId, message) {
  const lang = detectLanguage(message);
  console.log(`🌍 FINAL Language: ${lang}`);
  
  if (!userConversations.has(userId)) {
    userConversations.set(userId, { 
      messages: [], 
      language: lang,
      context: {
        age: null,
        level: null,
        equipment: null,
        healthIssues: null,
        timeAvailable: null,
        goal: null,
        weight: null
      }
    });
  }
  
  const userState = userConversations.get(userId);
  userState.language = lang; // Update language each time
  const context = userState.context;
  
  // Update context from message
  const lower = message.toLowerCase();
  
  const ageMatch = message.match(/(\d+)\s*(lat|roku|years|old|jahre)/i);
  if (ageMatch) context.age = parseInt(ageMatch[1]);
  
  const weightMatch = message.match(/(\d+)\s*(kg|kilo)/i);
  if (weightMatch) context.weight = parseInt(weightMatch[1]);
  
  if (lower.includes('początkuj') || lower.includes('beginner') || lower.includes('anfänger')) {
    context.level = 'beginner';
  }
  
  if (lower.includes('siłownia') || lower.includes('gym') || lower.includes('fitnessstudio')) {
    context.equipment = 'gym';
  } else if (lower.includes('w domu') || lower.includes('home') || lower.includes('zuhause')) {
    context.equipment = 'home';
  }

  console.log(`🧠 Context:`, context);

  // 🔥 FORCE QUESTIONS LOGIC
  const forcedQuestions = shouldForceQuestions(message, context);
  if (forcedQuestions) {
    const questionPrompts = {
      pl: `🎯 PRZED STWORZENIEM PLANU potrzebuję informacji!\n\n📋 Pytania:\n• Ile masz lat?\n• Jaki poziom? (początkujący/średnio/zaawansowany)\n• Siłownia czy dom?\n• Kontuzje/ograniczenia zdrowotne?\n• Ile czasu na trening?\n• Jaki cel? (siła/masa/spalanie)\n\nOdpowiedz, a stworzę idealny plan! 💪`,
      
      de: `🎯 VOR DEM TRAININGSPLAN brauche ich Infos!\n\n📋 Fragen:\n• Wie alt bist du?\n• Level? (Anfänger/Fortgeschritten/Profi)\n• Gym oder zuhause?\n• Verletzungen/Einschränkungen?\n• Wie viel Zeit?\n• Ziel? (Kraft/Masse/Fettabbau)\n\nAntworte für den perfekten Plan! 💪`,
      
      en: `🎯 BEFORE CREATING A PLAN I need info!\n\n📋 Questions:\n• How old are you?\n• Level? (beginner/intermediate/advanced)\n• Gym or home?\n• Injuries/limitations?\n• How much time?\n• Goal? (strength/muscle/fat loss)\n\nAnswer for the perfect plan! 💪`
    };
    
    return questionPrompts[lang];
  }

  // Regular ChatGPT response with STRONG language control
  userState.messages.push({ role: 'user', content: message });
  const recentMessages = userState.messages.slice(-6);
  
  const contextInfo = `
USER INFO:
- Age: ${context.age || 'unknown'}
- Level: ${context.level || 'unknown'}
- Equipment: ${context.equipment || 'unknown'}
- Health: ${context.healthIssues || 'unknown'}
- Time: ${context.timeAvailable || 'unknown'}
- Goal: ${context.goal || 'unknown'}
- Weight: ${context.weight || 'unknown'}kg`;

  const messages = [
    { 
      role: "system", 
      content: LANGUAGE_SYSTEM_PROMPTS[lang] + "\n\n" + HYBRID_SYSTEM_PROMPT + "\n\n" + contextInfo 
    },
    ...recentMessages
  ];

  return new Promise((resolve) => {
    console.log(`🤖 Calling ChatGPT in ${lang.toUpperCase()}...`);
    
    callChatGPT(messages, (error, response) => {
      if (error) {
        console.error('💥 Error:', error);
        
        const fallbacks = {
          pl: "Przepraszam za problemy! 🔧 Jestem Coach AI - pomagam z treningiem i zdrowiem. Spróbuj ponownie! 💪",
          de: "Entschuldige die Probleme! 🔧 Ich bin Coach AI - helfe bei Training und Gesundheit. Versuch nochmal! 💪", 
          en: "Sorry for the issues! 🔧 I'm Coach AI - I help with training and health. Try again! 💪"
        };
        resolve(fallbacks[lang]);
      } else {
        userState.messages.push({ role: 'assistant', content: response });
        console.log(`🤖 ${lang.toUpperCase()} Response: ${response.substring(0, 100)}...`);
        resolve(response);
      }
    });
  });
}

function sendWhatsAppMessage(to, message) {
  console.log(`🚀 Sending: ${message.substring(0, 100)}...`);
  
  const postData = JSON.stringify({
    messaging_product: 'whatsapp',
    to: to,
    text: { body: message }
  });

  const options = {
    hostname: 'graph.facebook.com',
    port: 443,
    path: `/v17.0/${PHONE_NUMBER_ID}/messages`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('🎉 SUCCESS!');
      } else {
        console.error('❌ Error:', JSON.parse(data));
      }
    });
  });

  req.on('error', (error) => {
    console.error('💥 Error:', error);
  });

  req.write(postData);
  req.end();
}

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === "ai_trainer_123") {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post("/webhook", async (req, res) => {
  const entry = req.body.entry && req.body.entry[0];
  const changes = entry && entry.changes && entry.changes[0];
  const message = changes && changes.value && changes.value.messages && changes.value.messages[0];
  
  if (message) {
    const from = message.from;
    const text = message.text && message.text.body;
    
    if (text) {
      console.log(`📨 From ${from}: ${text}`);
      
      const accessStatus = checkUserAccess(from);
      const lang = detectLanguage(text);
      
      if (!accessStatus.canUse) {
        const upgradeMsg = getUpgradeMessage(lang, accessStatus);
        const message = accessStatus.isTrialExpired ? 
          upgradeMsg.trialExpired : upgradeMsg.limitReached;
        
        sendWhatsAppMessage(from, message);
        res.status(200).send("OK");
        return;
      }
      
      const user = userTrials.get(from);
      user.messageCount++;
      
      if (user.messageCount === 1 && !user.isPremium) {
        const welcomeMsg = getUpgradeMessage(lang, accessStatus);
        sendWhatsAppMessage(from, welcomeMsg.trialStart);
        
        setTimeout(async () => {
          const response = await generateMultilingualResponse(from, text);
          sendWhatsAppMessage(from, response);
        }, 2000);
      } else {
        const response = await generateMultilingualResponse(from, text);
        sendWhatsAppMessage(from, response);
        
        if (!user.isPremium && (accessStatus.remainingMessages <= 3 || accessStatus.remainingDays <= 1)) {
          setTimeout(() => {
            const warningMsg = `⚠️ Trial ending soon! ${accessStatus.remainingMessages} messages, ${Math.ceil(accessStatus.remainingDays)} days left. Upgrade: zbieracz444@gmail.com`;
            sendWhatsAppMessage(from, warningMsg);
          }, 3000);
        }
      }
    }
  }
  
  res.status(200).send("OK");
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "🌍 Multilingual Hybrid AI Coach ready!" });
});

app.listen(PORT, () => {
  console.log("🚀 Multilingual Hybrid AI Personal Trainer running on port " + PORT);
  console.log("🌍 PERFECT language detection and response!");
  console.log("🎯 Forces questions + ChatGPT intelligence!");
  console.log("📱 Works with ALL phone numbers!");
});
