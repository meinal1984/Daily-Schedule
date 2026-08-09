import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "10mb" }));

// Initialize GoogleGenAI SDK with server-side API Key
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Ensure data directory exists for persistent storage
const DATA_FILE = process.env.DATA_FILE || path.join(process.cwd(), "data", "schedules.json");
const DATA_DIR = path.dirname(DATA_FILE);

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial sample data if file does not exist
if (!fs.existsSync(DATA_FILE)) {
  const defaultSchedules = [
    {
      id: "doc-1",
      title: "দৈনন্দিন কর্মসূচি - ১ আগস্ট ২০২৬",
      date: "২০২৬-০৮-০১",
      letterhead: {
        govtTitle: "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার",
        officeName: "জেলা প্রশাসকের কার্যালয়, ঢাকা",
        branchName: "সাধারণ শাখা",
        memoNo: "০৫.৪১.২৬০০.০১১.২৪.০০২.২৬.১৫০",
        issueDate: "১৬ শ্রাবণ ১৪৩৩ / ১ আগস্ট ২০২৬",
        subject: "মান্যবর জেলা প্রশাসকের দৈনন্দিন কর্মসূচি ও নির্ধারিত সভার নোটিশ",
        signatoryName: "মো: রফিকুল ইসলাম",
        signatoryDesignation: "সহকারী কমিশনার (সাধারণ শাখা)",
        signatoryPhone: "০২-৯৫৫১২২১",
        signatoryEmail: "dc.dhaka@mopa.gov.bd",
        showEmblem: true,
        emblemPreset: "bd_crest"
      },
      items: [
        {
          id: "item-1",
          serialNo: "১",
          dateTime: "সকাল ০৯:৩০ মিনিট",
          description: "জেলা ডিজিটাল উদ্ভাবনী মেলা ২০২৬ আয়োজনের প্রস্তুতিমূলক পর্যালোচনা সভা",
          venue: "সম্মেলন কক্ষ (২য় তলা), জেলা প্রশাসকের কার্যালয়",
          chairperson: "জেলা প্রশাসক ও জেলা ম্যাজিস্ট্রেট, ঢাকা",
          remarks: "সকল অতিরিক্ত জেলা প্রশাসক ও উপজেলা নির্বাহী অফিসারগণ উপস্থিত থাকবেন।"
        },
        {
          id: "item-2",
          serialNo: "২",
          dateTime: "সকাল ১১:০০ টা",
          description: "আইন-শৃঙ্খলা সংক্রান্ত জেলা কমিটির মাসিক সভা",
          venue: "শহীদ আলতাফ মিলনায়তন, ঢাকা",
          chairperson: "জেলা প্রশাসক, ঢাকা",
          remarks: "পুলিশ সুপার, ঢাকা এবং সংশ্লিষ্ট দপ্তর প্রধানগণ অংশ নেবেন।"
        },
        {
          id: "item-3",
          serialNo: "৩",
          dateTime: "দুপুর ০২:৩০ মিনিট",
          description: "উপজেলা পর্যায়ে উন্নয়ন প্রকল্পসমূহের বাস্তবায়ন অগ্রগতি তদারকি বৈঠক",
          venue: "অনলাইন (জুম প্ল্যাটফর্ম)",
          chairperson: "অতিরিক্ত জেলা প্রশাসক (সার্বিক)",
          remarks: "যাবতীয় বাস্তবায়ন প্রতিবেদন উপস্থাপনের নির্দেশ দেয়া হলো।"
        },
        {
          id: "item-4",
          serialNo: "৪",
          dateTime: "বিকাল ০৪:০০ টা",
          description: "সাধারণ জনগণের গণশুনানি ও স্মারকলিপি গ্রহণ",
          venue: "জেলা প্রশাসকের অফিস কক্ষ",
          chairperson: "জেলা প্রশাসক, ঢাকা",
          remarks: "জনসাধারনের অভিযোগ নিস্পত্তি শাখা বাস্তবায়ন করবে।"
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  fs.writeFileSync(DATA_FILE, JSON.stringify(defaultSchedules, null, 2), "utf-8");
}

// Helper to read database
function readDatabase() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading database:", err);
    return [];
  }
}

// Helper to write database
function writeDatabase(data: any) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database:", err);
  }
}

// API Routes
app.get("/api/schedules", (req, res) => {
  const data = readDatabase();
  res.json(data);
});

app.post("/api/schedules", (req, res) => {
  const newDoc = req.body;
  if (!newDoc.id) {
    newDoc.id = "doc-" + Date.now();
  }
  newDoc.createdAt = newDoc.createdAt || new Date().toISOString();
  newDoc.updatedAt = new Date().toISOString();

  const data = readDatabase();
  data.unshift(newDoc);
  writeDatabase(data);
  res.status(201).json(newDoc);
});

app.put("/api/schedules/:id", (req, res) => {
  const { id } = req.params;
  const updatedDoc = req.body;
  updatedDoc.updatedAt = new Date().toISOString();

  let data = readDatabase();
  const index = data.findIndex((item: any) => item.id === id);
  if (index !== -1) {
    data[index] = { ...data[index], ...updatedDoc };
    writeDatabase(data);
    res.json(data[index]);
  } else {
    data.unshift(updatedDoc);
    writeDatabase(data);
    res.status(200).json(updatedDoc);
  }
});

app.delete("/api/schedules/:id", (req, res) => {
  const { id } = req.params;
  let data = readDatabase();
  data = data.filter((item: any) => item.id !== id);
  writeDatabase(data);
  res.json({ success: true, id });
});

// Gemini AI Endpoints
app.get("/api/gemini/status", (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  res.json({
    available: !!apiKey,
    models: {
      complex: "gemini-3.1-pro-preview",
      general: "gemini-3.5-flash",
      fast: "gemini-3.1-flash-lite",
    },
  });
});

app.post("/api/gemini/parse-schedule", async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(400).json({
        error: "GEMINI_API_KEY is not configured on the server. Please add your API key in Settings > Secrets.",
      });
    }

    const { text, defaultDate, model = "gemini-3.5-flash" } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required for schedule parsing." });
    }

    const todayISO = defaultDate || new Date().toISOString().split("T")[0];

    const systemInstruction = `You are an expert executive secretary and government administrative officer in Bangladesh specializing in official daily schedules (দৈনন্দিন কর্মসূচি), meeting agendas (সভার কার্যসূচি), and government notices (সরকারি পরিপত্র ও নোটিশ).
Your task is to parse any unstructured text, rough notes, circulars, or emails in Bengali or English into a structured JSON daily schedule with official Bangladeshi government terminology, formatting, and Bengali numerals.

Return ONLY valid JSON matching this structure:
{
  "title": "আনুষ্ঠানিক শিরোনাম (যেমন: জেলা প্রশাসক মহোদয়ের দৈনন্দিন কর্মসূচি)",
  "date": "YYYY-MM-DD (e.g. ${todayISO})",
  "subject": "আনুষ্ঠানিক বিষয় (যেমন: জেলা প্রশাসকের দৈনন্দিন কর্মসূচি ও নির্ধারিত সভার নোটিশ)",
  "docHeading": "প্রকল্প পরিচালক / জেলা প্রশাসক মহোদয়ের দৈনন্দিন কর্মসূচি",
  "officeName": "দপ্তরের নাম (যদি টেক্সটে থাকে)",
  "branchName": "শাখার নাম (যেমন: সাধারণ শাখা)",
  "items": [
    {
      "serialNo": "১",
      "dateAndDay": "১৮.০৬.২০২৬ বুধবার (বাংলা ফরম্যাট)",
      "timeOnly": "সকাল ০৯:৩০ টা / দুপুর ০২:৩০ মিনিট / বিকাল ০৪:০০ টা",
      "venue": "সভার স্থান (যেমন: সম্মেলন কক্ষ, জেলা প্রশাসকের কার্যালয় / অনলাইন জুম)",
      "description": "সভার পূর্ণাঙ্গ প্রমিত বিষয় / কর্মসূচি",
      "chairperson": "সভাপতি (যেমন: জেলা প্রশাসক, ঢাকা / সচিব মহোদয়)",
      "remarks": "প্রয়োজনীয় নির্দেশনা বা কারা উপস্থিত থাকবেন",
      "priority": "high" | "medium" | "low"
    }
  ]
}

Rules:
1. All dates and times must be translated/formatted in proper Bengali numerals (১, ২, ৩...) and standard Bangladesh time expressions (সকাল, দুপুর, বিকাল, সন্ধ্যা, রাত).
2. Ensure descriptions and venues use respectful, formal Bangladesh government administrative tone.
3. Automatically determine chronological order and appropriate serial numbers (১, ২, ৩...).
4. If no specific priority is mentioned, use "high" for high-level meetings/cabinet/inaugurations, "medium" for internal coordination, and "low" for routine work.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: `Parse this schedule text into structured JSON:\n\n${text}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const outputText = response.text || "{}";
    try {
      const parsedData = JSON.parse(outputText);
      return res.json({ success: true, data: parsedData, rawText: outputText });
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr, outputText);
      return res.json({ success: true, data: null, rawText: outputText });
    }
  } catch (err: any) {
    console.error("Error in parse-schedule Gemini endpoint:", err);
    res.status(500).json({ error: err.message || "Failed to parse schedule with Gemini AI." });
  }
});

app.post("/api/gemini/formalize-schedule", async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(400).json({
        error: "GEMINI_API_KEY is not configured on the server. Please add your API key in Settings > Secrets.",
      });
    }

    const { items, letterhead, model = "gemini-3.5-flash" } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Items array is required." });
    }

    const systemInstruction = `You are a Chief Editor of Official Government Documents in Bangladesh (বাংলাদেশ সচিবালয় ও জেলা প্রশাসন প্রমিত নথি সম্পাদক).
Your task is to refine and formalize a list of schedule items into impeccable, elegant, formal Bangladesh government administrative Bengali (প্রমিত সরকারি ভাষা ও প্রটোকল শৈলী).

Tasks:
1. Fix all grammatical, spelling, and typography errors.
2. Standardize honorifics (e.g., 'মান্যবর', 'মহোদয়', 'সভাপতিত্বে', 'উপসচিব', 'জেলা প্রশাসক ও জেলা ম্যাজিস্ট্রেট').
3. Enhance vague descriptions into crisp, official meeting agendas.
4. Professionalize remarks into actionable administrative notes (e.g. 'সকল কর্মকর্তাগণকে যথাসময়ে উপস্থিত থাকার জন্য নির্দেশক্রমে অনুরোধ করা হলো').
5. Convert any English words/acronyms into standard Bengali equivalents (e.g. Zoom -> অনলাইন (জুম প্ল্যাটফর্ম), MoU -> সমঝোতা স্মারক, Review -> পর্যালোচনা সভা).

Return ONLY valid JSON with this format:
{
  "formalizedItems": [
    {
      "id": "original item id",
      "serialNo": "১",
      "dateAndDay": "...",
      "timeOnly": "...",
      "venue": "...",
      "description": "...",
      "chairperson": "...",
      "remarks": "...",
      "priority": "high" | "medium" | "low"
    }
  ],
  "improvementsList": [
    "কাজের সংক্ষেপ ও প্রমিতকরণের বিবরণ..."
  ],
  "executiveSummary": "সারসংক্ষেপ"
}`;

    const prompt = JSON.stringify({ items, letterhead });
    const response = await ai.models.generateContent({
      model: model,
      contents: `Formalize and refine these government schedule items:\n\n${prompt}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const outputText = response.text || "{}";
    try {
      const parsedData = JSON.parse(outputText);
      return res.json({ success: true, data: parsedData });
    } catch (parseErr) {
      return res.json({ success: true, rawText: outputText });
    }
  } catch (err: any) {
    console.error("Error in formalize-schedule Gemini endpoint:", err);
    res.status(500).json({ error: err.message || "Failed to formalize schedule with Gemini AI." });
  }
});

app.post("/api/gemini/smart-sort", async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(400).json({
        error: "GEMINI_API_KEY is not configured on the server. Please add your API key in Settings > Secrets.",
      });
    }

    const { items, model = "gemini-3.1-flash-lite" } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Items array is required." });
    }

    const systemInstruction = `You are a Smart Chronological Scheduler and Protocol Coordinator for government officers in Bangladesh.
Your task is to analyze the daily schedule items, sort them chronologically by actual date and time (morning 09:00 AM to night 09:00 PM), identify any potential time conflicts or overlap between meetings, and suggest ideal buffer times.

Return ONLY valid JSON with this format:
{
  "sortedItems": [
    {
      "id": "original item id",
      "serialNo": "১",
      "dateAndDay": "...",
      "timeOnly": "...",
      "venue": "...",
      "description": "...",
      "chairperson": "...",
      "remarks": "...",
      "priority": "high" | "medium" | "low"
    }
  ],
  "hasConflicts": true/false,
  "conflicts": [
    {
      "itemIds": ["id1", "id2"],
      "message": "সকাল ১০:৩০ এবং সকাল ১১:০০ টার দুটি সভার মধ্যে যাতায়াত বা সময়ের সংঘাত রয়েছে।"
    }
  ],
  "suggestions": [
    "পরামর্শ যেমন: দুপুর ০১:৩০ থেকে ০২:৩০ পর্যন্ত যোহর নামাজ ও মধ্যাহ্নভোজ বিরতি রাখা যেতে পারে।"
  ]
}`;

    const response = await ai.models.generateContent({
      model: model,
      contents: `Chronologically sort, re-index serial numbers, and detect scheduling conflicts for these items:\n\n${JSON.stringify(items)}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const outputText = response.text || "{}";
    try {
      const parsedData = JSON.parse(outputText);
      return res.json({ success: true, data: parsedData });
    } catch (parseErr) {
      return res.json({ success: true, rawText: outputText });
    }
  } catch (err: any) {
    console.error("Error in smart-sort Gemini endpoint:", err);
    res.status(500).json({ error: err.message || "Failed to sort schedule with Gemini AI." });
  }
});

app.post("/api/gemini/generate-briefing", async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(400).json({
        error: "GEMINI_API_KEY is not configured on the server. Please add your API key in Settings > Secrets.",
      });
    }

    const { items, letterhead, formatType = "meeting_notice", model = "gemini-3.5-flash" } = req.body;

    const formatTypeDescriptions: { [key: string]: string } = {
      meeting_notice: "সরকারি সভার আনুষ্ঠানিক নোটিশ / কার্যবিবরণী আহ্বানপত্র (স্মারক নম্বর, তারিখ, সভার সময়সূচি ও অনুলিপিসহ)",
      executive_summary: "মান্যবর সচিব / মহাপরিচালক / জেলা প্রশাসক মহোদয়ের জন্য নির্বাহী সারসংক্ষেপ ও ব্রিফিং নোট",
      chairperson_speech: "সভাপতির প্রারম্ভিক দিকনির্দেশনামূলক বক্তব্য ও সভার আলোচ্যসূচির সারসংক্ষেপ",
      press_release: "দৈনন্দিন কর্মসূচি সম্পর্কিত আনুষ্ঠানিক প্রেস বিজ্ঞপ্তি ও মিডিয়া ব্রিফ",
    };

    const systemInstruction = `You are an expert Government Protocol Secretary in Bangladesh (গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের প্রটোকল কর্মকর্তা ও কার্যবিবরণী রচয়িতা).
Your task is to generate a comprehensive, highly polished, formal document based on the schedule items and letterhead config.
Format Type requested: ${formatTypeDescriptions[formatType] || formatType}.

Format requirements:
1. Use standard Bangladesh government memo structure (গণপ্রজাতন্ত্রী বাংলাদেশ সরকার, দপ্তরের নাম, স্মারক নং, তারিখ, বিষয়, সভার স্থান ও সময়, আলোচ্যসূচি, সভাপতির নির্দেশনা, স্বাক্ষরকারী, অনুলিপি সদয় অবগতি ও প্রয়োজনীয় ব্যবস্থা গ্রহণের জন্য)।
2. Use authentic, prestigious administrative Bengali terms (স্মারক নং, সদয় অবগতি, কার্যবিবরণী, সভাপতিত্ব, নির্দেশক্রমে)।
3. Include structured agenda points and bullet points based on the schedule items.
4. Output Markdown with clean headings, tables, or numbered lists.`;

    const prompt = JSON.stringify({
      formatType,
      letterhead,
      items,
    });

    const response = await ai.models.generateContent({
      model: model,
      contents: `Generate an official government ${formatType} based on this schedule:\n\n${prompt}`,
      config: {
        systemInstruction,
      },
    });

    return res.json({
      success: true,
      document: response.text,
      formatType,
    });
  } catch (err: any) {
    console.error("Error in generate-briefing Gemini endpoint:", err);
    res.status(500).json({ error: err.message || "Failed to generate briefing with Gemini AI." });
  }
});

app.post("/api/gemini/refine-item", async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(400).json({
        error: "GEMINI_API_KEY is not configured on the server. Please add your API key in Settings > Secrets.",
      });
    }

    const { item, action = "formalize", model = "gemini-3.1-flash-lite" } = req.body;
    if (!item) {
      return res.status(400).json({ error: "Item is required." });
    }

    const systemInstruction = `You are a fast executive secretary in Bangladesh.
Action requested: ${action} (e.g. formalize = make official and crisp, expand = add relevant agenda points & venue details, remarks = generate professional participant guidance).
Return ONLY valid JSON for the single updated item:
{
  "description": "উন্নত ও প্রমিত বিবরণ",
  "venue": "প্রমিত স্থান",
  "chairperson": "প্রমিত সভাপতি",
  "remarks": "কার্যকর প্রশাসনিক মন্তব্য",
  "priority": "high" | "medium" | "low"
}`;

    const response = await ai.models.generateContent({
      model: model,
      contents: `Refine this schedule item:\n\n${JSON.stringify(item)}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const outputText = response.text || "{}";
    try {
      const parsedData = JSON.parse(outputText);
      return res.json({ success: true, data: parsedData });
    } catch (parseErr) {
      return res.json({ success: true, rawText: outputText });
    }
  } catch (err: any) {
    console.error("Error in refine-item Gemini endpoint:", err);
    res.status(500).json({ error: err.message || "Failed to refine item with Gemini AI." });
  }
});

app.post("/api/gemini/chat", async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(400).json({
        error: "GEMINI_API_KEY is not configured on the server. Please add your API key in Settings > Secrets.",
      });
    }

    const { message, context, history = [], model = "gemini-3.5-flash" } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const systemInstruction = `You are "Gemini সূচি সহকারী" (Gemini Schedule Assistant), an intelligent, polite, and highly skilled AI assistant for Bangladesh government and institutional schedule management.
You have full awareness of the user's active schedule document, letterhead configuration, and schedule items.
Answer the user's questions in clear, polite Bengali.
You can:
- Answer questions about who chairs which meeting, when meetings are held, venue details, and free slots.
- Suggest additions or improvements to the schedule.
- Draft talking points or emails to send to attendees.
- Identify time overlaps or logistical issues.
- Provide official governmental drafting guidance.

Active Schedule Context:
${JSON.stringify(context || {})}`;

    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction,
      },
    });

    // Send the user query
    const response = await chat.sendMessage({
      message: message,
    });

    return res.json({
      success: true,
      reply: response.text,
    });
  } catch (err: any) {
    console.error("Error in chat Gemini endpoint:", err);
    res.status(500).json({ error: err.message || "Failed to process chat with Gemini AI." });
  }
});

// Auto Notification Sending API endpoint
app.post("/api/send-notification", (req, res) => {
  const { type, recipients, subject, message, documentId } = req.body;
  
  console.log(`[NOTIFICATION DISPATCH] Type: ${type} | Recipient count: ${recipients?.length || 0}`);
  
  // Return simulated successful dispatch response for email & WhatsApp
  res.status(200).json({
    success: true,
    type,
    recipientCount: recipients?.length || 0,
    timestamp: new Date().toISOString(),
    message: "নোটিফিকেশন সফলভাবে তৈরি ও সেন্ড কিউতে প্রসেস করা হয়েছে!",
  });
});

async function startServer() {
  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
