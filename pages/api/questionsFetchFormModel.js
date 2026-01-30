/**
 * API endpoint for generating academic questions using OpenAI's GPT-4 model
 * Questions are generated in Marathi based on the provided academic parameters
 */

export const config = {
  runtime: 'nodejs',
  maxDuration: 300,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { level, subject, role, board } = req.body;

  if ((!level) && (!role || !subject || !board)) {
    return res.status(400).json({ error: 'Role, Subject, board and level are required.' });
  }

  try {
    const questions = await generateQuestionsWithOpenAI(level, role, board, subject);

    if (questions) {
      return res.status(200).json({
        message: 'Questions generated successfully.',
        questions,
      });
    } else {
      return res.status(500).json({ error: 'Failed to generate questions.' });
    }
  } catch (error) {
    console.error('Error during processing:', error);
    return res.status(500).json({
      error: 'Error during question generation.',
      details: error.message
    });
  }
}

async function generateQuestionsWithOpenAI(level, role, board, subject) {
  const openaiUrl = 'https://api.openai.com/v1/chat/completions';

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
  };

  const systemPrompt = `
You are a senior technical interviewer and industrial specialist for entry-level engineering and manufacturing jobs.
Your goal is to generate high-depth, practical, and non-repetitive interview questions.
You strictly generate role-specific interview questions using a mix of formal Marathi and English technical terms in Roman script.
You MUST keep all technical, theoretical, and management-related terms (e.g., "SOP", "SMT", "Quality Check", "Circuit", "Gerber", "Torque", "Reflow", "DRC") in English script (A-Z) exactly as they are.
Do NOT transliterate these terms into Marathi script.
Translate only the general language into proper, formal, and grammatically correct Marathi.
You NEVER generate school, mathematics, or general academic syllabus questions.
Questions must feel like they are being asked in a real factory or design house interview.
`;

  const userPrompt = `
Generate 10 UNIQUE and high-depth job-role-specific interview questions in Marathi based on the details below.

Role: ${role}
Subject: ${subject}
Difficulty Level: ${level}

STRICT VARIETY RULES:
- Each of the 10 questions MUST cover a different sub-topic or technical area within the role.
- Avoid repeating the same theme (e.g., don't ask 3 questions about soldering).
- Questions should range from basic definitions to practical troubleshooting (e.g., "What will you do if...").

ROLE-SPECIFIC TECHNICAL CONTEXT:

If Role/Subject relates to PCB (Printed Circuit Board):
- Focus on specialized sub-topics:
  - Design & Data: Gerber files, DRC (Design Rule Check), Schematics vs. Layout.
  - Fabrication: Multilayer stack-up, Etching process, Prepreg, Soldermask.
  - Assembly (SMT & Through-hole): Pick-and-place machine, Reflow vs Wave soldering, Soldering defects (Bridging, Cold joints).
  - Testing & Quality: AOI (Automated Optical Inspection), X-Ray, Flying probe test, ICT.
  - Components: Passive vs Active components, Package types (BGA, QFP, 0603).

If Role/Subject relates to AAO (Automotive Assembly Operator):
- Focus on specialized sub-topics:
  - Assembly Process: Torque management, SOP (Standard Operating Procedure), Assembly sequence.
  - Tools & Equipment: Pneumatic tools, Jigs and Fixtures, Conveyor belt operations.
  - Quality Control: Poka-yoke (Error-proofing), Visual inspection, Reject handling.
  - Safety & Environment: PPE, LOTO (Lock-Out Tag-Out), 5S Principles, Forklift safety.
  - Teamwork & Production: FIFO (First-In, First-Out), Cycle time, Production targets.

FORMATTING RULES:
- Use formal Marathi for the general instructions.
- KEEP ALL technical terms in English (Roman script).
- Use Marathi numerals (१, २, ३, …).
- Each question must be 2-3 detailed sentences.
- Use variety in wording: “विस्ताराने सांगा”, “प्रात्यक्षिक स्वरूपात स्पष्ट करा”, “काय बदल कराल”, “तुमची भूमिका काय असेल”.
- Output ONLY a clean numbered list of questions. No extra text.
`;

  const requestBody = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.4, // Lower temperature for more focused and technical output
    max_tokens: 1500
  };

  try {
    const response = await fetch(openaiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}