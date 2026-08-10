import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "10mb" }));

// ============================================================
// GEMINI AI
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
// DATA STORAGE
// ============================================================

const DATA_FILE =
  process.env.DATA_FILE ||
  path.join(process.cwd(), "data", "schedules.json");

const DATA_DIR = path.dirname(DATA_FILE);

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

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
// DATABASE HELPERS
// ============================================================

function readDatabase(): any[] {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading database:", error);
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
  } catch (error) {
    console.error("Error writing database:", error);
  }
}

// ============================================================
// SCHEDULE API
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
// GEMINI STATUS
// ============================================================

app.get("/api/gemini/status", (_req, res) => {
  res.json({
    available: !!process.env.GEMINI_API_KEY,

    models: {
      complex: "gemini-3.1-pro-preview",
      general: "gemini-3.5-flash",
      fast: "gemini-3.1-flash-lite",
    },
  });
});

// ============================================================
// GEMINI - PARSE SCHEDULE
// ============================================================

app.post(
  "/api/gemini/parse-schedule",
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
        text,
        defaultDate,
        model = "gemini-3.5-flash",
      } = req.body;

      if (!text || typeof text !== "string") {
        return res.status(400).json({
          error: "Text is required for schedule parsing.",
        });
      }

      const todayISO =
        defaultDate ||
        new Date().toISOString().split("T")[0];

      const systemInstruction = `
You are an expert executive secretary and government administrative officer in Bangladesh specializing in official daily schedules.

Parse unstructured Bengali or English text into a structured government daily schedule.

Return ONLY valid JSON.

Structure:

{
  "title": "",
  "date": "YYYY-MM-DD",
  "subject": "",
  "docHeading": "",
  "officeName": "",
  "branchName": "",
  "items": [
    {
      "serialNo": "১",
      "dateAndDay": "",
      "timeOnly": "",
      "venue": "",
      "description": "",
      "chairperson": "",
      "remarks": "",
      "priority": "high"
    }
  ]
}

Today's date is ${todayISO}.

Use formal Bangladesh government terminology.
Use Bengali numerals where appropriate.
Sort items chronologically.
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
      } catch {
        return res.json({
          success: true,
          data: null,
          rawText: outputText,
        });
      }
    } catch (error: any) {
      console.error(
        "parse-schedule error:",
        error
      );

      return res.status(500).json({
        error:
          error.message ||
          "Failed to parse schedule with Gemini AI.",
      });
    }
  }
);

// ============================================================
// GEMINI - FORMALIZE SCHEDULE
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

      if (!Array.isArray(items)) {
        return res.status(400).json({
          error: "Items array is required.",
        });
      }

      const systemInstruction = `
You are a Chief Editor of Official Government Documents in Bangladesh.

Refine government schedule items into polished formal administrative Bengali.

Return ONLY valid JSON:

{
  "formalizedItems": [],
  "improvementsList": [],
  "executiveSummary": ""
}

Use formal government terminology, correct grammar,
standardize honorifics and make remarks actionable.
`;

      const response =
        await ai.models.generateContent({
          model,
          contents:
            `Formalize these government schedule items:\n\n${JSON.stringify(
              { items, letterhead }
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
    } catch (error: any) {
      console.error(
        "formalize-schedule error:",
        error
      );

      return res.status(500).json({
        error:
          error.message ||
          "Failed to formalize schedule.",
      });
    }
  }
);

// ============================================================
// GEMINI - SMART SORT
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

      if (!Array.isArray(items)) {
        return res.status(400).json({
          error: "Items array is required.",
        });
      }

      const systemInstruction = `
You are a Smart Chronological Scheduler for government officers in Bangladesh.

Sort schedule items chronologically.
Detect time conflicts and suggest buffer times.

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
            `Sort and analyze these schedule items:\n\n${JSON.stringify(
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
    } catch (error: any) {
      console.error(
        "smart-sort error:",
        error
      );

      return res.status(500).json({
        error:
          error.message ||
          "Failed to sort schedule.",
      });
    }
  }
);

// ============================================================
// GEMINI - GENERATE BRIEFING
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

Document type:
${descriptions[formatType] || formatType}

Use standard Bangladesh government administrative Bengali.

Include:
- Government office heading
- Memo number
- Date
- Subject
- Meeting details
- Agenda
- Instructions
- Signature information
- Copy distribution where appropriate

Return clean Markdown.
`;

      const response =
        await ai.models.generateContent({
          model,
          contents:
            `Generate the requested official document:\n\n${JSON.stringify(
              {
                formatType,
                letterhead,
                items,
              }
            )}`,
          config: {
            systemInstruction,
          },
        });

      return res.json({
        success: true,
        document: response.text,
        formatType,
      });
    } catch (error: any) {
      console.error(
        "generate-briefing error:",
        error
      );

      return res.status(500).json({
        error:
          error.message ||
          "Failed to generate briefing.",
      });
    }
  }
);

// ============================================================
// GEMINI - REFINE ITEM
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
    } catch (error: any) {
      console.error(
        "refine-item error:",
        error
      );

      return res.status(500).json({
        error:
          error.message ||
          "Failed to refine item.",
      });
    }
  }
);

// ============================================================
// GEMINI - CHAT ASSISTANT
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
You are "Gemini সূচি সহকারী",
an intelligent assistant for Bangladesh government
and institutional schedule management.

Answer in clear and polite Bengali.

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
    } catch (error: any) {
      console.error(
        "chat error:",
        error
      );

      return res.status(500).json({
        error:
          error.message ||
          "Failed to process chat.",
      });
    }
  }
);

// ============================================================
// NOTIFICATION API
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
// START SERVER
// ============================================================

async function startServer() {
  /*
   * IMPORTANT:
   * Vite is loaded ONLY in development mode.
   *
   * This prevents the packaged Electron application
   * from trying to load the Vite module.
   */

  if (process.env.NODE_ENV !== "production") {
    const {
      createServer: createViteServer,
    } = await import("vite");

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    /*
     * Electron sets APP_ROOT to the packaged application root.
     * This is important because process.cwd() is not reliable
     * after installation.
     */

    const appRoot =
      process.env.APP_ROOT ||
      process.cwd();

    const distPath = path.join(
      appRoot,
      "dist"
    );

    console.log(
      "Production application root:",
      appRoot
    );

    console.log(
      "Production dist path:",
      distPath
    );

    if (!fs.existsSync(distPath)) {
      throw new Error(
        `Production dist directory not found: ${distPath}`
      );
    }

    const indexFile = path.join(
      distPath,
      "index.html"
    );

    if (!fs.existsSync(indexFile)) {
      throw new Error(
        `index.html not found: ${indexFile}`
      );
    }

    app.use(express.static(distPath));

    app.get("*", (_req, res) => {
      res.sendFile(indexFile);
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

// ============================================================
// ERROR HANDLING
// ============================================================

startServer().catch((error) => {
  console.error(
    "Failed to start server:",
    error
  );

  process.exit(1);
});
