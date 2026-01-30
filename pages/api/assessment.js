import mongoose from 'mongoose';
import AssessmentReport from '@/models/assessmentReport'; // Ensure this path matches your file structure

// --- DATABASE CONNECTION ---
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const opts = { bufferCommands: false };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default async function handler(req, res) {
  // Ensure DB is connected for all operations
  try {
    await dbConnect();
  } catch (error) {
    console.error("Database connection failed:", error);
    return res.status(500).json({ error: "Database connection failed" });
  }

  // ==========================================
  //  HANDLE GET REQUEST (Fetch Reports)
  // ==========================================
  if (req.method === 'GET') {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: "Email query parameter required" });
    }

    try {
      // Fetch reports for the specific email, sorted by newest first
      const reports = await AssessmentReport.find({ email: email }).sort({ createdAt: -1 });

      return res.status(200).json({ reports });
    } catch (err) {
      console.error("Fetch Error:", err);
      return res.status(500).json({ error: 'Failed to retrieve reports' });
    }
  }

  // ==========================================
  //  HANDLE POST REQUEST (Generate/Evaluate)
  // ==========================================
  else if (req.method === 'POST') {
    const { type, standard, subject, questions, userAnswers, email, collageName, role } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) return res.status(500).json({ error: "OpenAI API Key not configured" });

    const url = 'https://api.openai.com/v1/chat/completions';

    try {
      // --- SCENARIO 1: GENERATE MCQ QUESTIONS ---
      if (type === 'generate_questions') {

        // Strict system prompt to ensure JSON format and linguistic rules
        const systemPrompt = `You are a senior technical examiner and industrial specialist.
        Your goal is to generate high-depth, practical, and UNIQUE Multiple Choice Questions (MCQs).
        
        LINGUISTIC AND GRAMMAR RULES:
        1. Use proper, formal, and grammatically correct Marathi for the general language structure.
        2. VERY IMPORTANT: Keep all technical, theoretical, and management-related terms (e.g., "Circuit", "PCB", "SOP", "SMT", "Quality Control", "Standard Operating Procedure", "Gerber", "DRC", "LOTO", "FIFO", "Prepreg", "Insulator", "Soldering") in English script (Roman/A-Z) exactly as they are. 
        3. Do NOT transliterate these terms into Marathi script.
        4. Technical terms MUST remain in English script even if they appear in Marathi sentences.
        5. IMPORTANT: All OPTIONS (MCQ choices) must be in English script (Roman/A-Z) to ensure technical accuracy and standard industrial vocabulary. The goal is for the student to understand the technical meaning in English.
        
        You must output strictly valid JSON only. Do not add any markdown formatting.`;

        // User prompt specifically asking for 25 MCQs with technical depth and variety
        const userPrompt = `Create exactly 25 UNIQUE and high-depth MCQ questions for Class ${standard}, Subject ${subject}.
        
        STRICT VARIETY RULES:
        - Questions must cover diverse technical areas: Design, Fabrication, Assembly, Testing, Maintenance, and Quality.
        - Avoid repeating the same theme. If the subject is PCB, ask about Gerber files, soldering defects, board stack-up, AOI testing, etc.
        - Each of the 25 questions MUST be different in context.
        - CRITICAL: All technical meanings and options MUST be in English script. For example, if asking "What is Prepreg?", the options should be "Pre-filled fiber", "Type of insulator", etc., in English.

        TECHNICAL CONTEXT (If applicable):
        - PCB: Gerber files, DRC (Design Rule Check), Schematics, Layout, Multilayer stack-up, Etching, Prepreg, Soldermask, SMT vs Through-hole, Pick-and-place, Reflow/Wave soldering, Bridging, Cold joints, AOI, X-Ray, ICT.
        - AAO: Torque management, SOP, Assembly sequence, Pneumatic tools, Jigs/Fixtures, Poka-yoke, Reject handling, PPE, LOTO, 5S, FIFO, Cycle time.
        
        FORMATTING RULES:
        - Output MUST be a valid JSON object with a key "questions" containing the array of 25 questions.
        - Use Marathi numerals (१, २, ३...) only for indices or identifiers if necessary, but keep JSON keys in English.
        - JSON Structure:
        {
          "questions": [
            {
              "id": 1,
              "question": "Question text in Marathi with technical terms in Roman script",
              "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
              "correctAnswer": "Correct Option Text"
            }
          ]
        }`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
            temperature: 0.4, // Lower temperature for more focused and technical output
            max_tokens: 2500, // Ensure enough tokens for 25 detailed questions
            response_format: { type: "json_object" } // Force JSON response if supported
          })
        });

        const data = await response.json();

        if (data.error) {
          console.error("OpenAI Error:", data.error);
          return res.status(500).json({ error: data.error.message });
        }

        let aiContent = data.choices[0].message.content;

        // Ensure we handle the "json_object" format if it wraps the array in an object
        if (aiContent.trim().startsWith('{')) {
          try {
            const tempObj = JSON.parse(aiContent);
            // If the AI put questions in a key like "questions" or "result"
            const possibleQuestions = tempObj.questions || tempObj.result || tempObj;
            if (Array.isArray(possibleQuestions)) {
              return res.status(200).json({ result: possibleQuestions });
            } else if (typeof possibleQuestions === 'object' && Object.values(possibleQuestions).some(v => Array.isArray(v))) {
              // Find the first array in the object
              const arrayKey = Object.keys(possibleQuestions).find(k => Array.isArray(possibleQuestions[k]));
              return res.status(200).json({ result: possibleQuestions[arrayKey] });
            }
          } catch (e) {
            console.warn("Wrapped JSON parse failed, falling back to regex", e);
          }
        }

        try {
          // Helper to clean common AI JSON mistakes
          const cleanJson = (str) => {
            return str
              .replace(/\]\s*"/g, '], "')     // Missing comma after array
              .replace(/\}\s*\{/g, '}, {')    // Missing comma between objects
              .replace(/"\s*"/g, '", "')      // Missing comma after string value
              .replace(/,\s*\]/g, ']')        // Trailing comma in array
              .replace(/,\s*\}/g, '}');       // Trailing comma in object
          };

          let parsedQuestions = [];

          // Attempt to find JSON array
          const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
          const rawToParse = jsonMatch ? jsonMatch[0] : aiContent;

          try {
            parsedQuestions = JSON.parse(rawToParse);
          } catch (firstPassError) {
            console.warn("First pass JSON parse failed, attempting cleanup...");
            parsedQuestions = JSON.parse(cleanJson(rawToParse));
          }

          return res.status(200).json({ result: parsedQuestions });
        } catch (e) {
          console.error("JSON Parse Error:", e);
          console.error("AI Output:", aiContent);
          return res.status(500).json({ error: "Failed to parse questions. Please try again." });
        }
      }

      // --- SCENARIO 2: EVALUATE & SAVE ---
      else if (type === 'evaluate_answers') {

        if (!email) {
          return res.status(400).json({ error: "User is not logged in. Cannot save report." });
        }

        let calculatedScore = 0;
        const totalQuestions = questions.length;

        questions.forEach((q, index) => {
          if (userAnswers[index] && userAnswers[index] === q.correctAnswer) {
            calculatedScore++;
          }
        });

        const systemPrompt = `You are a helpful teacher speaking Marathi. Analyze the student's performance.`;

        const userPrompt = `The student answered ${calculatedScore} out of ${totalQuestions} questions correctly in Subject: ${subject}.
        
        Provide a Markdown report in Marathi containing:
        1. A motivating summary of their performance.
        2. Key areas they need to study based on this subject.
        3. A plan to improve their score next time.
        
        Do not list every question individually, just a high-level analysis.`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
            temperature: 0.7
          })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        const aiAnalysis = data.choices[0].message.content;

        try {
          const newReport = new AssessmentReport({
            role: role || 'Student',
            subject: subject,
            email: email,
            collageName: collageName || 'Unknown College',
            reportAnalysis: aiAnalysis,
            score: calculatedScore,
            totalQuestions: totalQuestions
          });

          await newReport.save();
          console.log(`Report saved for ${email}`);
        } catch (dbError) {
          console.error("Database Save Error:", dbError);
          return res.status(500).json({ error: "Failed to save report to database", details: dbError.message });
        }

        return res.status(200).json({
          result: aiAnalysis,
          score: calculatedScore,
          total: totalQuestions
        });
      }

    } catch (error) {
      console.error("API Handler Error:", error);
      return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  }

  else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}