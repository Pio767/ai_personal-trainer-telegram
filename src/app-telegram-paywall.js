const express = require("express");
const https = require("https");
const app = express();
const PORT = process.env.PORT || 3000;

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8109063268:AAFPnzG4EWFhzQhygPlkuhbOtAK8hjnCiL8";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-placeholder';

app.use(express.json());

const userTrials = new Map();
const userConversations = new Map();

const TRIAL_DAYS = 3;
const TRIAL_MESSAGE_LIMIT = 20;
const PREMIUM_PRICE = 9.99;

function getWelcomeMessage() {
  return `🏋️‍♂️ AI PERSONAL TRAINER 🏋️‍♀️

🌍 Choose your language / Wybierz język / Sprache wählen:

🇵🇱 /polish - Polski
🇩🇪 /german - Deutsch  
🇺🇸 /english - English

━━━━━━━━━━━━━━━━━━━━━━
🎯 Quick Start:
- "Cześć" - Polish
- "Hallo" - German  
- "Hello" - English

💪 I help with: fitness, nutrition, wellness, training plans!`;
}

function getLanguageWelcome(lang) {
  const welcomes = {
    pl: `🇵🇱 Witaj! Jestem Twoim AI Personal Trainer!

🎯 Jak mogę Ci pomóc?
💪 Plan treningowy - napisz "plan"
🍽️ Dieta - napisz "dieta"
😴 Regeneracja - napisz "sen"  
💊 Suplementy - napisz "suplementy"
🧘 Mindfulness - napisz "stres"

🆓 Masz 3-dniowy darmowy okres próbny!
💬 Po prostu napisz czego potrzebujesz...`,

    de: `🇩🇪 Hallo! Ich bin dein AI Personal Trainer!

🎯 Wie kann ich dir helfen?
💪 Trainingsplan - schreib "plan"
🍽️ Ernährung - schreib "ernährung"
😴 Regeneration - schreib "schlaf"
💊 Supplements - schreib "supplements"
🧘 Mindfulness - schreib "stress"

🆓 Du hast eine 3-tägige kostenlose Testversion!
💬 Schreib einfach was du brauchst...`,

    en: `🇺🇸 Hello! I'm your AI Personal Trainer!

🎯 How can I help you?
💪 Training plan - type "plan"
🍽️ Nutrition - type "nutrition"
😴 Recovery - type "sleep"
💊 Supplements - type "supplements"
🧘 Mindfulness - type "stress"

🆓 You have a 3-day free trial!
💬 Just type what you need...`
  };
  
  return welcomes[lang];
}

function handleLanguageCommand(command) {
  switch(command) {
    case '/polish':
    case '/pl':
      return { lang: 'pl', message: getLanguageWelcome('pl') };
    case '/german':
    case '/de':
    case '/deutsch':
      return { lang: 'de', message: getLanguageWelcome('de') };
    case '/english':
    case '/en':
      return { lang: 'en', message: getLanguageWelcome('en') };
    case '/start':
      return { lang: null, message: getWelcomeMessage() };
    default:
      return null;
  }
}

function detectLanguage(message) {
  const lower = message.toLowerCase();
  console.log(`🕵️ Analyzing message: "${message}"`);
  
  let scores = { pl: 0, de: 0, en: 0 };
  
  if (lower.match(/[ąćęłńóśźż]/)) scores.pl += 5;
  
  const polishWords = ['cześć', 'hej', 'jestem', 'chcę', 'chciałbym', 'trening', 'dieta', 'siłownia', 'ćwiczenia', 'zdrowie'];
  polishWords.forEach(word => {
    if (lower.includes(word)) scores.pl += 3;
  });
  
  const germanWords = ['hallo', 'ich', 'bin', 'möchte', 'training', 'ernährung', 'danke', 'bitte', 'fitnessstudio'];
  germanWords.forEach(word => {
    if (lower.includes(word)) scores.de += 2;
  });
  
  const englishWords = ['hello', 'want', 'would', 'workout', 'nutrition', 'fitness', 'gym', 'exercise', 'health'];
  englishWords.forEach(word => {
    if (lower.includes(word)) scores.en += 2;
  });
  
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'pl';
  
  const detectedLang = Object.keys(scores).find(lang => scores[lang] === maxScore);
  console.log(`🎯 Detected language: ${detectedLang}`);
  
  return detectedLang;
}

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
      trialStart: `🎉 Rozpoczynasz trial!

🆓 DARMOWY TEST (${TRIAL_DAYS} dni):
- ${TRIAL_MESSAGE_LIMIT} wiadomości
- Wszystkie funkcje dostępne

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
      trialStart: `🎉 Du startest deinen Trial!

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
      trialStart: `🎉 Starting your trial!

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

function callChatGPT(messages, callback) {
  const postData = JSON.stringify({
    model: "gpt-4o-mini",
    messages: messages,
    max_tokens: 400,
    temperature: 0.7
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

async function generateAIResponse(userId, message) {
  const lang = detectLanguage(message);
  
  if (!userConversations.has(userId)) {
    userConversations.set(userId, { messages: [], language: lang });
  }
  
  const userState = userConversations.get(userId);
  userState.messages.push({ role: 'user', content: message });
  
  const systemPrompt = `Jesteś Coach AI - ekspertem od holistycznego zdrowia.

LUSTRZANA OSOBOWOŚĆ:
- Dopasowuj TON do użytkownika (casualowy = casualowy, poważny = profesjonalny)
- Używaj podobnego języka: "siema dziku" → "Cześć dziku!", "potrzebuję pomocy" → "Pomogę Ci"
- Odbijaj energię: wysoka energia = entuzjazm, spokojna = opanowanie

JĘZYK: Odpowiadaj ZAWSZE w języku ${lang === 'pl' ? 'POLSKIM' : lang === 'de' ? 'NIEMIECKIM' : 'ANGIELSKIM'}.

SPECJALIZACJA: fitness/zdrowie/trening/dieta/sen/stres/mindfulness/suplementy/motywacja

STYL:
- Empatyczny, wspierający, praktyczny
- Emotikony 💪⚡🔥💚
- Max 250 słów

FILOZOFIA ELASTYCZNA:
- Dostosowuj rady do poziomu użytkownika (początkujący vs zaawansowany)
- Trening: od 2x20min dla początku do 6x60min dla zaawansowanych
- Dieta: od prostych zamian do szczegółowych makro
- Uwzględniaj ograniczenia: czas, sprzęt, budżet, zdrowie
- Zawsze pytaj o cel: odchudzanie, masa, siła, zdrowie, sport
- Personalizuj wszystko: wiek, płeć, doświadczenie, preferencje`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...userState.messages.slice(-6)
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

app.post("/webhook", async (req, res) => {
  console.log("📨 Telegram webhook:", JSON.stringify(req.body, null, 2));
  
  const message = req.body.message;
  
  if (message && message.text) {
    const chatId = message.chat.id;
    const text = message.text.trim();
    const userId = message.from.id.toString();
    
    console.log(`📨 From ${userId} (${chatId}): ${text}`);
    
    const commandResult = handleLanguageCommand(text.toLowerCase());
    if (commandResult) {
      if (commandResult.lang) {
        if (!userConversations.has(userId)) {
          userConversations.set(userId, { messages: [], language: commandResult.lang });
        } else {
          userConversations.get(userId).language = commandResult.lang;
        }
        // DODAJ UŻYTKOWNIKA DO TRIALS
        if (!userTrials.has(userId)) {
          userTrials.set(userId, {
            startDate: new Date(),
            messageCount: 0,
            isPremium: false,
            trialExpired: false
          });
        }
      }
      
      sendTelegramMessage(chatId, commandResult.message);
      res.status(200).send("OK");
      return;
    }
    
    // Inicjalizuj użytkownika jeśli nie istnieje
    if (!userTrials.has(userId)) {
      userTrials.set(userId, {
        startDate: new Date(),
        messageCount: 0,
        isPremium: false,
        trialExpired: false
      });
      sendTelegramMessage(chatId, getWelcomeMessage());
      res.status(200).send("OK");
      return;
    }
    
    const accessStatus = checkUserAccess(userId);
    const lang = detectLanguage(text);
    
    if (!accessStatus.canUse) {
      const upgradeMsg = getUpgradeMessage(lang, accessStatus);
      const message = accessStatus.isTrialExpired ? 
        upgradeMsg.trialExpired : upgradeMsg.limitReached;
      
      sendTelegramMessage(chatId, message);
      res.status(200).send("OK");
      return;
    }
    
    const user = userTrials.get(userId);
    user.messageCount++;
    
    if (user.messageCount === 1 && !user.isPremium) {
      const welcomeMsg = getUpgradeMessage(lang, accessStatus);
      sendTelegramMessage(chatId, welcomeMsg.trialStart);
      
      setTimeout(async () => {
        const response = await generateAIResponse(userId, text);
        sendTelegramMessage(chatId, response);
      }, 2000);
    } else {
      const response = await generateAIResponse(userId, text);
      sendTelegramMessage(chatId, response);
      
      if (!user.isPremium && (accessStatus.remainingMessages <= 3 || accessStatus.remainingDays <= 1)) {
        setTimeout(() => {
          const warningMsg = `⚠️ Trial ending soon! ${accessStatus.remainingMessages} messages, ${Math.ceil(accessStatus.remainingDays)} days left. Upgrade: zbieracz444@gmail.com`;
          sendTelegramMessage(chatId, warningMsg);
        }, 3000);
      }
    }
  }
  
  res.status(200).send("OK");
});
