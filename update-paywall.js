const fs = require('fs');

let content = fs.readFileSync('src/app-paywall.js', 'utf8');

// Add paywall variables after userConversations
const paywall = `
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
      trialStart: \`🎉 Witaj w AI Personal Trainer! 

🆓 DARMOWY TEST (\${TRIAL_DAYS} dni):
- \${TRIAL_MESSAGE_LIMIT} wiadomości
- Wszystkie funkcje dostępne
- Personalizowane plany treningowe

💪 Zostało Ci: \${Math.ceil(status.remainingDays)} dni, \${status.remainingMessages} wiadomości

Upgrade do Premium za €\${PREMIUM_PRICE}/miesiąc!\`,

      trialExpired: \`⏰ Twój trial wygasł!

💎 PREMIUM za €\${PREMIUM_PRICE}/miesiąc:
✅ Unlimited wiadomości  
✅ Wszystkie funkcje AI
✅ Personalizowane plany 24/7

🔗 Kontakt: zbieracz444@gmail.com\`,

      limitReached: \`📱 Wykorzystałeś \${TRIAL_MESSAGE_LIMIT} darmowych wiadomości!

💎 Upgrade do PREMIUM za €\${PREMIUM_PRICE}/miesiąc
🔗 Kontakt: zbieracz444@gmail.com\`
    },
    
    de: {
      trialStart: \`🎉 Willkommen bei AI Personal Trainer!

🆓 KOSTENLOSER TEST (\${TRIAL_DAYS} Tage):
- \${TRIAL_MESSAGE_LIMIT} Nachrichten  
- Alle Funktionen verfügbar

💪 Übrig: \${Math.ceil(status.remainingDays)} Tage, \${status.remainingMessages} Nachrichten\`,

      trialExpired: \`⏰ Dein Trial ist abgelaufen!

💎 PREMIUM für €\${PREMIUM_PRICE}/Monat:
✅ Unlimited Nachrichten
✅ Alle AI Funktionen  

🔗 Kontakt: zbieracz444@gmail.com\`,

      limitReached: \`📱 Du hast \${TRIAL_MESSAGE_LIMIT} kostenlose Nachrichten verbraucht!

💎 Upgrade zu PREMIUM für €\${PREMIUM_PRICE}/Monat
🔗 Kontakt: zbieracz444@gmail.com\`
    },
    
    en: {
      trialStart: \`🎉 Welcome to AI Personal Trainer!

🆓 FREE TRIAL (\${TRIAL_DAYS} days):
- \${TRIAL_MESSAGE_LIMIT} messages
- All features available

💪 Remaining: \${Math.ceil(status.remainingDays)} days, \${status.remainingMessages} messages\`,

      trialExpired: \`⏰ Your trial has expired!

💎 PREMIUM for €\${PREMIUM_PRICE}/month:
✅ Unlimited messages
✅ All AI features

🔗 Contact: zbieracz444@gmail.com\`,

      limitReached: \`📱 You've used \${TRIAL_MESSAGE_LIMIT} free messages!

💎 Upgrade to PREMIUM for €\${PREMIUM_PRICE}/month
🔗 Contact: zbieracz444@gmail.com\`
    }
  };
  
  return messages[lang];
}
`;

// Add after userConversations declaration
content = content.replace('const userConversations = new Map();', 'const userConversations = new Map();' + paywall);

// Replace webhook handler
const newWebhook = `app.post("/webhook", async (req, res) => {
  const entry = req.body.entry && req.body.entry[0];
  const changes = entry && entry.changes && entry.changes[0];
  const message = changes && changes.value && changes.value.messages && changes.value.messages[0];
  
  if (message) {
    const from = message.from;
    const text = message.text && message.text.body;
    
    if (text) {
      console.log(\`📨 From \${from}: \${text}\`);
      
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
            const warningMsg = \`⚠️ Trial ending soon! \${accessStatus.remainingMessages} messages, \${Math.ceil(accessStatus.remainingDays)} days left. Upgrade: zbieracz444@gmail.com\`;
            sendWhatsAppMessage(from, warningMsg);
          }, 3000);
        }
      }
    }
  }
  
  res.status(200).send("OK");
});`;

content = content.replace(/app\.post\("\/webhook"[\s\S]*?res\.status\(200\)\.send\("OK"\);\s*\}\);/, newWebhook);

fs.writeFileSync('src/app-paywall.js', content);
console.log('✅ Paywall system added!');
