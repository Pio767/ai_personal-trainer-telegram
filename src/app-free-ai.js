const express = require("express");
const https = require("https");
const app = express();
const PORT = 3000;

const ACCESS_TOKEN = "EAAKB3HOYzB4BPEcqjZCqy1mcZAXVJvp3uvRTKelgdNvWKneZAfDHVkNlaFZBkqrwePkr2gBPRTkJ2iPmuRjKA20zgGKwn9m2lQoWYJvCImTiOGdsSkbXxiFFkCCxpZCzZAOdPDFBC9ZAR9WU0YWK3opQr0DbXcw9jC2HBaad3j2sUQdvlchoZB0FrBZBhNhwk7yyeNlRuGGpNZBhv8MgJi9gzaayoY5NWCZAxhVlLPUabwgqgZDZD";
const PHONE_NUMBER_ID = "726591527199931";

app.use(express.json());

const userConversations = new Map();

// Detect language
function detectLanguage(message) {
  const lower = message.toLowerCase();
  if (lower.includes('cześć') || lower.includes('hej') || lower.includes('trening')) return 'pl';
  if (lower.includes('hallo') || lower.includes('training') || lower.includes('ernährung')) return 'de';
  if (lower.includes('hello') || lower.includes('workout') || lower.includes('nutrition')) return 'en';
  return 'pl';
}

// Smart AI responses based on your training knowledge
function generateSmartResponse(userId, message) {
  const lang = detectLanguage(message);
  const lower = message.toLowerCase();
  
  // Get user state
  if (!userConversations.has(userId)) {
    userConversations.set(userId, { messages: [], language: lang, context: {} });
  }
  
  const userState = userConversations.get(userId);
  userState.messages.push(message);
  userState.language = lang;

  // Responses by language
  const responses = {
    pl: {
      greeting: "Cześć! 👋 Jestem Twoim AI Personal Trainer! 🧬\n\nOpieram się na holistycznej filozofii: wolne ciężary, perfekcyjna technika i szacunek dla Twojego ciała.\n\nO czym chcesz pogadać?\n💪 Plan treningowy\n🍽️ Dieta i odżywianie\n😴 Regeneracja\n💊 Suplementy\n\nPisz czego potrzebujesz! ⚡",
      
      beginner_plan: "🔰 PLAN DLA POCZĄTKUJĄCYCH (3x tydzień)\n\n💪 FULL BODY WORKOUT:\n1. Przysiad (goblet): 3 serie x 12 powtórzeń\n2. Wyciskanie na ławce: 3 serie x 10-12\n3. Wiosłowanie hantlem: 3 serie x 12 każda strona\n4. Pompki (na kolanach OK): 3 serie x 10-15\n5. Plank: 3 serie x 30-45 sekund\n\n⚡ ODPOCZYNEK: 60-90s między seriami\n🎯 PROGRES: Co 2-3 tygodnie zwiększ ciężar\n\nSkup się na technice, nie na ciężarze! 💪",
      
      intermediate_plan: "💪 PLAN ŚREDNIOZAAWANSOWANY (4x tydzień)\n\n📅 PUSH-PULL SPLIT:\n\n🔥 PUSH (Pn/Pt):\n- Wyciskanie sztangi: 4x8-10\n- Wyciskanie hantli nad głowę: 3x10-12\n- Dipy: 3x12-15\n- Triceps: 3x12-15\n\n💪 PULL (Wt/Sb):\n- Martwy ciąg: 4x6-8\n- Podciąganie: 3x8-12\n- Wiosłowanie sztangą: 3x10-12\n- Biceps: 3x12-15\n\n⚡ Ciężar 70-80% maksymalnego!",
      
      diet: "🍽️ MOJE PODEJŚCIE DO ODŻYWIANIA\n\n🥬 FUNDAMENT:\n• Warzywa: minimum 400g dziennie\n• Białko: 1.6-2.2g na kg masy ciała\n• Pełnoziarniste produkty (kasza, ryż, owsianka)\n• Zdrowe tłuszcze (awokado, orzechy, oliwa)\n\n💡 ZASADA 80/20:\n80% - zdrowe, pełnowartościowe jedzenie\n20% - przyjemności (czekolada, pizza itp.)\n\n📝 PRZYKŁAD POSIŁKU:\nŚniadanie: Owsianka z bananem, orzechami i skyrem\nObiad: Kurczak z kaszą pęczak i brokułami\n\n🚫 UNIKAJ: cukier, tłuszcze trans, przetworzony fast food",
      
      supplements: "💊 SUPLEMENTY - TYLKO TE KTÓRE DZIAŁAJĄ!\n\n🔥 PODSTAWA:\n• Kreatyna monohydrat: 5g dziennie\n• Białko serwatkowe: 20-30g po treningu\n• Witamina D: 2000-4000 IU (ważne w Polsce!)\n• Magnez: 300-400mg przy skurczach\n\n⚡ OMEGA-3: 1-2g EPA/DHA dla serca i stawów\n\n💡 WAŻNE: Polecam badania krwi przed suplementacją!\nSprawdź poziomy: witamina D, B12, magnez, żelazo\n\nSuplementy mają wspierać dietę, nie ją zastępować! 🧬",
      
      recovery: "😴 REGENERACJA - FUNDAMENT POSTĘPU!\n\n🌙 SEN: 7-9 godzin na dobę\n• Brak snu = słabe wyniki + ryzyko kontuzji\n• Ustaw stałe godziny snu\n• Ciemność + cisza w sypialni\n\n🫁 TECHNIKA ODDYCHANIA 4-7-8:\n• 4 sekundy wdech\n• 7 sekund wstrzymanie\n• 8 sekund wydech\n→ Uspokaja układ nerwowy!\n\n⚡ ODPOCZYNEK MIĘDZY TRENINGAMI:\n48-72 godziny dla tej samej grupy mięśni\n\n💡 Jeśli czujesz zmęczenie - daj ciału więcej czasu! Zdrowie > ego 💪",
      
      motivation: "💪 ROZUMIEM, ŻE CZASEM MOTYWACJA SIADA!\n\nTo absolutnie normalne - każdy przez to przechodzi. Ważne to nie być perfekcyjnym, tylko konsekwentnym! 🎯\n\n🚶‍♂️ ZACZNIJ OD MAŁEGO:\n• 15-minutowy spacer\n• Jedna seria przysiadów\n• 5 pompek\n\nMałe działania budują wielkie nawyki! 🔥\n\nPamiętaj: trening to maraton, nie sprint. Każdy krok się liczy, nawet ten najmniejszy.\n\nCo powiesz na ustalenie małego celu na ten tydzień? 💫",
      
      default: "🧬 Jestem tu żeby Ci pomóc! Mogę doradzić w:\n\n💪 Planach treningowych (początkujący/średnio/zaawansowany)\n🍽️ Diecie i odżywianiu\n😴 Regeneracji i śnie\n💊 Suplementacji\n🧠 Motywacji i nawykach\n\nNapisz o czym chcesz pogadać! Jestem ekspertem od fitness i zdrowego stylu życia 🚀"
    },
    
    de: {
      greeting: "Hallo! 👋 Ich bin dein AI Personal Trainer! 🧬\n\nMein Ansatz basiert auf ganzheitlicher Philosophie: freie Gewichte, perfekte Technik und Respekt für deinen Körper.\n\nWorüber möchtest du sprechen?\n💪 Trainingsplan\n🍽️ Ernährung\n😴 Regeneration\n💊 Supplements\n\nSchreib was du brauchst! ⚡",
      
      beginner_plan: "🔰 ANFÄNGER PLAN (3x pro Woche)\n\n💪 GANZKÖRPER WORKOUT:\n1. Goblet Squats: 3 Sätze x 12 Wdh\n2. Bankdrücken: 3 Sätze x 10-12\n3. Rudern mit Hanteln: 3 Sätze x 12 je Seite\n4. Liegestütze: 3 Sätze x 10-15\n5. Plank: 3 Sätze x 30-45 Sekunden\n\n⚡ PAUSE: 60-90s zwischen Sätzen\n🎯 Fokus auf Technik, nicht auf Gewicht! 💪",
      
      diet: "🍽️ MEIN ERNÄHRUNGSANSATZ\n\n🥬 GRUNDLAGE:\n• Gemüse: mindestens 400g täglich\n• Protein: 1.6-2.2g pro kg Körpergewicht\n• Vollkornprodukte\n• Gesunde Fette\n\n💡 80/20 REGEL:\n80% gesunde Vollwertkost\n20% Genuss\n\n📝 BEISPIEL:\nFrühstück: Haferflocken mit Banane und Quark",
      
      default: "🧬 Ich kann dir helfen mit:\n💪 Trainingsplänen\n🍽️ Ernährung\n😴 Regeneration\n💊 Supplements\n\nWorüber möchtest du sprechen? 🚀"
    },
    
    en: {
      greeting: "Hello! 👋 I'm your AI Personal Trainer! 🧬\n\nMy approach is based on holistic philosophy: free weights, perfect technique and respect for your body.\n\nWhat would you like to discuss?\n💪 Training plan\n🍽️ Nutrition\n😴 Recovery\n💊 Supplements\n\nTell me what you need! ⚡",
      
      beginner_plan: "🔰 BEGINNER PLAN (3x per week)\n\n💪 FULL BODY WORKOUT:\n1. Goblet Squats: 3 sets x 12 reps\n2. Bench Press: 3 sets x 10-12\n3. Dumbbell Rows: 3 sets x 12 each side\n4. Push-ups: 3 sets x 10-15\n5. Plank: 3 sets x 30-45 seconds\n\n⚡ REST: 60-90s between sets\n🎯 Focus on technique, not weight! 💪",
      
      diet: "🍽️ MY NUTRITION APPROACH\n\n🥬 FOUNDATION:\n• Vegetables: minimum 400g daily\n• Protein: 1.6-2.2g per kg body weight\n• Whole grain products\n• Healthy fats\n\n💡 80/20 RULE:\n80% healthy whole foods\n20% pleasure\n\n📝 EXAMPLE:\nBreakfast: Oatmeal with banana and Greek yogurt",
      
      default: "🧬 I can help you with:\n💪 Training plans\n🍽️ Nutrition\n😴 Recovery\n💊 Supplements\n\nWhat would you like to talk about? 🚀"
    }
  };

  const langResponses = responses[lang];

  // Intent recognition
  if (lower.includes('cześć') || lower.includes('hej') || lower.includes('hallo') || lower.includes('hello') || lower.includes('witam')) {
    return langResponses.greeting;
  }
  
  if (lower.includes('początkuj') || lower.includes('beginner') || lower.includes('anfänger') || lower.includes('newbie')) {
    return langResponses.beginner_plan;
  }
  
  if (lower.includes('średnio') || lower.includes('intermediate') || lower.includes('fortgeschritten')) {
    return responses.pl.intermediate_plan; // Only in Polish for now
  }
  
  if (lower.includes('dieta') || lower.includes('odżywianie') || lower.includes('ernährung') || lower.includes('nutrition') || lower.includes('jedzenie')) {
    return langResponses.diet;
  }
  
  if (lower.includes('suplementy') || lower.includes('supplements') || lower.includes('kreatyna') || lower.includes('białko') || lower.includes('protein')) {
    return responses.pl.supplements; // Only in Polish for now
  }
  
  if (lower.includes('regeneracja') || lower.includes('sen') || lower.includes('recovery') || lower.includes('sleep') || lower.includes('müde')) {
    return responses.pl.recovery; // Only in Polish for now
  }
  
  if (lower.includes('motywacja') || lower.includes('motivation') || lower.includes('nie mam siły') || lower.includes('zmęczony')) {
    return responses.pl.motivation; // Only in Polish for now
  }
  
  return langResponses.default;
}

function sendWhatsAppMessage(to, message) {
  console.log(`🚀 Attempting to send message to ${to}`);
  
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
      try {
        const result = JSON.parse(data);
        console.log('✅ WhatsApp API Response:', result);
        if (res.statusCode === 200) {
          console.log('🎉 MESSAGE SENT SUCCESSFULLY!');
        }
      } catch (error) {
        console.error('💥 Error parsing response:', error);
      }
    });
  });

  req.on('error', (error) => {
    console.error('💥 Error sending message:', error);
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
  console.log("WhatsApp:", JSON.stringify(req.body, null, 2));
  
  const entry = req.body.entry && req.body.entry[0];
  const changes = entry && entry.changes && entry.changes[0];
  const message = changes && changes.value && changes.value.messages && changes.value.messages[0];
  
  if (message) {
    const from = message.from;
    const text = message.text && message.text.body;
    
    if (text) {
      console.log(`Message from ${from}: ${text}`);
      
      const aiResponse = generateSmartResponse(from, text);
      console.log(`🤖 Smart AI Response: ${aiResponse}`);
      
      sendWhatsAppMessage(from, aiResponse);
    }
  }
  
  res.status(200).send("OK");
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "🤖 Smart AI Personal Trainer ready!" });
});

app.listen(PORT, () => {
  console.log("🚀 Smart AI Personal Trainer running on port " + PORT);
  console.log("🧠 Ready with advanced fitness intelligence!");
});
