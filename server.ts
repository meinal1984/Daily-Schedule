import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "10mb" }));

// ============================================================
// Gemini AI
// ============================================================

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// ============================================================
// Persistent data
// ============================================================

const DATA_FILE =
  process.env.DATA_FILE ||
  path.join(process.cwd(), "data", "schedules.json");

const DATA_DIR = path.dirname(DATA_FILE);

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial sample data
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
        subject:
          "মান্যবর জেলা প্রশাসকের দৈনন্দিন কর্মসূচি ও নির্ধারিত সভার নোটিশ",
        signatoryName: "মো: রফিকুল ইসলাম",
        signatoryDesignation:
          "সহকারী কমিশনার (সাধারণ শাখা)",
        signatoryPhone: "০২-৯৫৫১২২১",
        signatoryEmail: "dc.dhaka@mopa.gov.bd",
        showEmblem: true,
        emblemPreset: "bd_crest",
      },

      items: [
        {
          id: "item-1",
          serialNo: "১",
          dateTime: "সকাল ০৯:৩০ মিনিট",
          description:
            "জেলা ডিজিটাল উদ্ভাবনী মেলা ২০২৬ আয়োজনের প্রস্তুতিমূলক পর্যালোচনা সভা",
          venue:
            "সম্মেলন কক্ষ (২য় তলা), জেলা প্রশাসকের কার্যালয়",
          chairperson:
            "জেলা প্রশাসক ও জেলা ম্যাজিস্ট্রেট, ঢাকা",
          remarks:
            "সকল অতিরিক্ত জেলা প্রশাসক ও উপজেলা নির্বাহী অফিসারগণ উপস্থিত থাকবেন।",
        },
        {
          id: "item-2",
          serialNo: "২",
          dateTime: "সকাল ১১:০০ টা",
          description:
            "আইন-শৃঙ্খলা সংক্রান্ত জেলা কমিটির মাসিক সভা",
          venue: "শহীদ আলতাফ মিলনায়তন, ঢাকা",
          chairperson: "জেলা প্রশাসক, ঢাকা",
          remarks:
            "পুলিশ সুপার, ঢাকা এবং সংশ্লিষ্ট দপ্তর প্রধানগণ অংশ নেবেন।",
        },
        {
          id: "item-3",
          serialNo: "৩",
          dateTime: "দুপুর ০২:৩০ মিনিট",
          description:
            "উপজেলা পর্যায়ে উন্নয়ন প্রকল্পসমূহের বাস্তবায়ন অগ্রগতি তদারকি বৈঠক",
          venue: "অনলাইন (জুম প্ল্যাটফর্ম)",
          chairperson: "অতিরিক্ত জেলা প্রশাসক (সার্বিক)",
          remarks:
            "যাবতীয় বাস্তবায়ন প্রতিবেদন উপস্থাপনের নির্দেশ দেয়া হলো।",
        },
        {
          id: "item-4",
          serialNo: "৪",
          dateTime: "বিকাল ০৪:০০ টা",
          description:
            "সাধারণ জনগণের গণশুনানি ও স্মারকলিপি গ্রহণ",
          venue: "জেলা প্রশাসকের অফিস কক্ষ",
          chairperson: "জেলা প্রশাসক, ঢাকা",
          remarks:
            "জনসাধারনের অভিযোগ নিস্পত্তি শাখা বাস্তবায়ন করবে।",
        },
      ],

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(defaultSchedules, null, 2),
    "utf-8"
  );
}

// ============================================================
// Database helpers
// ============================================================

function readDatabase(): any[] {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading database:", err);
    return [];
  }
}

function writeDatabase(data: any[]): void {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(data, null, 2),
      "utf-8"
    );
  } catch (err) {
    console.error("Error writing database:", err);
  }
}

// ============================================================
// Schedule API
// ============================================================

app.get("/api/schedules", (_req, res) => {
  res.json(readDatabase());
});

app.post("/api/schedules", (req, res) => {
  const newDoc = req.body;

  if (!newDoc.id) {
    newDoc.id = "doc-" + Date.now();
  }

  newDoc.createdAt =
    newDoc.createdAt || new Date().toISOString();

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

  const data = readDatabase();

  const index = data.findIndex(
    (item: any) => item.id === id
  );

  if (index !== -1) {
    data[index] = {
      ...data[index],
      ...updatedDoc,
    };

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

  data = data.filter(
    (item: any) => item.id !== id
  );

  writeDatabase(data);

  res.json({
    success: true,
    id,
  });
});

// ============================================================
// Gemini status
// ============================================================

app.get("/api/gemini/status", (_req, res) => {
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

// ============================================================
// Gemini: Parse schedule
// ============================================================

app.post("/api/gemini/parse-schedule", async (req, res) => {
  try {
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(400).json({
        error:
          "GEMINI_API_KEY is not configured on the server. Please add your API key in Settings > Secrets.",
      });
    }

    const {
      text,
      defaultDate,
      model = "gemini-3.5-flash",
    } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({
        error:
          "Text is required for schedule parsing.",
      });
    }

    const todayISO =
      defaultDate ||
      new Date().toISOString().split("T")[0];

    const systemInstruction = `
You are an expert executive secretary and government administrative officer in Bangladesh specializing in official daily schedules.

Your task is to parse unstructured text into a structured JSON daily schedule.

Return ONLY valid JSON.

Required structure:

{
  "title": "আনুষ্ঠানিক শিরোনাম",
  "date": "YYYY-MM-DD",
  "subject": "আনুষ্ঠানিক বিষয়",
  "docHeading": "দৈনন্দিন কর্মসূচি",
  "officeName": "দপ্তরের নাম",
  "branchName": "শাখার নাম",
  "items": [
    {
      "serialNo": "১",
      "dateAndDay": "...",
      "timeOnly": "...",
      "venue": "...",
      "description": "...",
      "chairperson": "...",
      "remarks": "...",
      "priority": "high"
    }
  ]
}

Today's date is ${todayISO}.

Rules:
1. Use Bengali numerals where appropriate.
2. Use formal Bangladesh government terminology.
3. Sort items chronologically.
4. Use high, medium or low priority.
`;

    const response =
      await ai.models.generateContent({
        model,
        contents:
          `Parse this schedule text into structured JSON:\n\n${text}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      });

    const outputText = response.text || "{}";

    try {
      const parsedData = JSON.parse(outputText);

      return res.json({
        success: true,
        data: parsedData,
        rawText: outputText,
      });
    } catch (parseErr) {
      console.error(
        "JSON parse error:",
        parseErr
      );

      return res.json({
        success: true,
        data: null,
        rawText: outputText,
      });
    }
  } catch (err: any) {
    console.error(
      "Error in parse-schedule Gemini endpoint:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Failed to parse schedule with Gemini AI.",
    });
  }
});

// ============================================================
// Gemini: Formalize schedule
// ============================================================

app.post(
  "/api/gemini/formalize-schedule",
  async (req, res) => {
    try {
      const ai = getGeminiClient();

      if (!ai) {
        return res.status(400).json({
          error:
            "GEMINI_API_KEY is not configured on the server.",
        });
      }

      const {
        items,
        letterhead,
        model = "gemini-3.5-flash",
      } = req.body;

      if (!items || !Array.isArray(items)) {
        return res.status(400).json({
          error: "Items array is required.",
        });
      }

      const systemInstruction = `
You are a Chief Editor of Official Government Documents in Bangladesh.

Refine and formalize government schedule items into polished administrative Bengali.

Return ONLY valid JSON:

{
  "formalizedItems": [],
  "improvementsList": [],
  "executiveSummary": ""
}
`;

      const prompt = JSON.stringify({
        items,
        letterhead,
      });

      const response =
        await ai.models.generateContent({
          model,
          contents:
            `Formalize these government schedule items:\n\n${prompt}`,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
          },
        });

      const outputText = response.text || "{}";

      try {
        const parsedData = JSON.parse(outputText);

        return res.json({
          success: true,
          data: parsedData,
        });
      } catch {
        return res.json({
          success: true,
          rawText: outputText,
        });
      }
    } catch (err: any) {
      console.error(
        "Error in formalize-schedule:",
        err
      );

      return res.status(500).json({
        error:
          err.message ||
          "Failed to formalize schedule.",
      });
    }
  }
);

// ============================================================
// Gemini: Smart sort
// ============================================================

app.post(
  "/api/gemini/smart-sort",
  async (req, res) => {
    try {
      const ai = getGeminiClient();

      if (!ai) {
        return res.status(400).json({
          error:
            "GEMINI_API_KEY is not configured on the server.",
        });
      }

      const {
        items,
        model = "gemini-3.1-flash-lite",
      } = req.body;

      if (!items || !Array.isArray(items)) {
        return res.status(400).json({
          error: "Items array is required.",
        });
      }

      const systemInstruction = `
You are a Smart Chronological Scheduler for government officers in Bangladesh.

Sort schedule items chronologically and identify conflicts.

Return ONLY valid JSON:

{
  "sortedItems": [],
  "hasConflicts": false,
  "conflicts": [],
  "suggestions": []
}
`;

      const response =
        await ai.models.generateContent({
          model,
          contents:
            `Sort these schedule items:\n\n${JSON.stringify(
              items
            )}`,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
          },
        });

      const outputText = response.text || "{}";

      try {
        const parsedData = JSON.parse(outputText);

        return res.json({
          success: true,
          data: parsedData,
        });
      } catch {
        return res.json({
          success: true,
          rawText: outputText,
        });
      }
    } catch (err: any) {
      console.error(
        "Error in smart-sort:",
        err
      );

      return res.status(500).json({
        error:
          err.message ||
          "Failed to sort schedule.",
      });
    }
  }
);

// ============================================================
// Gemini: Generate briefing
// ============================================================

app.post(
  "/api/gemini/generate-briefing",
  async (req, res) => {
    try {
      const ai = getGeminiClient();

      if (!ai) {
        return res.status(400).json({
          error:
            "GEMINI_API_KEY is not configured on the server.",
        });
      }

      const {
        items,
        letterhead,
        formatType = "meeting_notice",
        model = "gemini-3.5-flash",
      } = req.body;

      const descriptions: Record<
        string,
        string
      > = {
        meeting_notice:
          "সরকারি সভার আনুষ্ঠানিক নোটিশ",
        executive_summary:
          "নির্বাহী সারসংক্ষেপ ও ব্রিফিং নোট",
        chairperson_speech:
          "সভাপতির বক্তব্য",
        press_release:
          "আনুষ্ঠানিক প্রেস বিজ্ঞপ্তি",
      };

      const systemInstruction = `
You are an expert Government Protocol Secretary in Bangladesh.

Generate a polished official government document.

Format:
${descriptions[formatType] || formatType}

Use standard Bangladesh government memo structure and formal Bengali.

Return clean Markdown.
`;

      const prompt = JSON.stringify({
        formatType,
        letterhead,
        items,
      });

      const response =
        await ai.models.generateContent({
          model,
          contents:
            `Generate an official document:\n\n${prompt}`,
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
      console.error(
        "Error in generate-briefing:",
        err
      );

      return res.status(500).json({
        error:
          err.message ||
          "Failed to generate briefing.",
      });
    }
  }
);

// ============================================================
// Gemini: Refine item
// ============================================================

app.post(
  "/api/gemini/refine-item",
  async (req, res) => {
    try {
      const ai = getGeminiClient();

      if (!ai) {
        return res.status(400).json({
          error:
            "GEMINI_API_KEY is not configured on the server.",
        });
      }

      const {
        item,
        action = "formalize",
        model = "gemini-3.1-flash-lite",
      } = req.body;

      if (!item) {
        return res.status(400).json({
          error: "Item is required.",
        });
      }

      const systemInstruction = `
You are a fast executive secretary in Bangladesh.

Action:
${action}

Return ONLY valid JSON:

{
  "description": "",
  "venue": "",
  "chairperson": "",
  "remarks": "",
  "priority": "medium"
}
`;

      const response =
        await ai.models.generateContent({
          model,
          contents:
            `Refine this schedule item:\n\n${JSON.stringify(
              item
            )}`,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
          },
        });

      const outputText = response.text || "{}";

      try {
        const parsedData = JSON.parse(outputText);

        return res.json({
          success: true,
          data: parsedData,
        });
      } catch {
        return res.json({
          success: true,
          rawText: outputText,
        });
      }
    } catch (err: any) {
      console.error(
        "Error in refine-item:",
        err
      );

      return res.status(500).json({
        error:
          err.message ||
          "Failed to refine item.",
      });
    }
  }
);

// ============================================================
// Gemini: Chat
// ============================================================

app.post(
  "/api/gemini/chat",
  async (req, res) => {
    try {
      const ai = getGeminiClient();

      if (!ai) {
        return res.status(400).json({
          error:
            "GEMINI_API_KEY is not configured on the server.",
        });
      }

      const {
        message,
        context,
        model = "gemini-3.5-flash",
      } = req.body;

      if (!message) {
        return res.status(400).json({
          error: "Message is required.",
        });
      }

      const systemInstruction = `
You are "Gemini সূচি সহকারী", an intelligent assistant for Bangladesh government schedule management.

Answer in clear, polite Bengali.

You can:
- Answer questions about meetings.
- Identify free slots.
- Suggest schedule improvements.
- Identify conflicts.
- Draft official administrative text.

Active schedule context:

${JSON.stringify(context || {})}
`;

      const chat = ai.chats.create({
        model,
        config: {
          systemInstruction,
        },
      });

      const response =
        await chat.sendMessage({
          message,
        });

      return res.json({
        success: true,
        reply: response.text,
      });
    } catch (err: any) {
      console.error(
        "Error in Gemini chat:",
        err
      );

      return res.status(500).json({
        error:
          err.message ||
          "Failed to process chat.",
      });
    }
  }
);

// ============================================================
// Notification API
// ============================================================

app.post(
  "/api/send-notification",
  (req, res) => {
    const {
      type,
      recipients,
      subject,
      message,
      documentId,
    } = req.body;

    console.log(
      `[NOTIFICATION DISPATCH] Type: ${type} | Recipient count: ${
        recipients?.length || 0
      }`
    );

    return res.status(200).json({
      success: true,
      type,
      recipientCount:
        recipients?.length || 0,
      timestamp: new Date().toISOString(),
      message:
        "নোটিফিকেশন সফলভাবে তৈরি ও সেন্ড কিউতে প্রসেস করা হয়েছে!",
    });
  }
);

// ============================================================
// Start server
// ============================================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    const appRoot =
      process.env.APP_ROOT ||
      process.cwd();

    const distPath = path.join(
      appRoot,
      "dist"
    );

    if (!fs.existsSync(distPath)) {
      console.error(
        `Production dist directory not found: ${distPath}`
      );
    }

    app.use(express.static(distPath));

    app.get("*", (_req, res) => {
      res.sendFile(
        path.join(
          distPath,
          "index.html"
        )
      );
    });
  }

  app.listen(
    PORT,
    "127.0.0.1",
    () => {
      console.log(
        `Server listening on http://127.0.0.1:${PORT}`
      );
    }
  );
}

startServer().catch((error) => {
  console.error(
    "Failed to start server:",
    error
  );

  process.exit(1);
});
