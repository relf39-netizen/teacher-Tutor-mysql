import { GoogleGenAI, Type } from "@google/genai";

export interface GeneratedQuestion {
  text: string;
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  correct: string;
  explanation: string;
}

export const generateQuestionWithAI = async (
  subjectFullName: string,
  categoryLabel: string,
  topic: string,
  count: number = 5,
  mode: 'search_old' | 'generate' = 'search_old',
  existingQuestions: string[] = []
): Promise<GeneratedQuestion[] | null> => {
  
  // 1. Try server-side API proxy route first (keeps API key secure on server)
  try {
    const res = await fetch('/api/gemini/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: subjectFullName,
        topic: `${categoryLabel} - ${topic}`,
        count,
        mode
      })
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.questions)) {
        return data.questions.map((q: any) => ({
          text: q.text,
          c1: q.choices?.[0]?.text || q.c1 || '',
          c2: q.choices?.[1]?.text || q.c2 || '',
          c3: q.choices?.[2]?.text || q.c3 || '',
          c4: q.choices?.[3]?.text || q.c4 || '',
          correct: String(q.correct_choice_id || q.correct || '1'),
          explanation: q.explanation || ''
        }));
      }
    }
  } catch (e) {
    console.warn("Server API proxy attempt failed, falling back to client-side SDK if available:", e);
  }

  // 2. Client-side fallback if client API Key exists
  let apiKey = "";
  try {
    apiKey = (import.meta as any).env.VITE_CUSTOM_GEMINI_KEY || process.env.GEMINI_API_KEY || "";
  } catch (e) {
    // Ignore
  }

  if (!apiKey) {
    apiKey = localStorage.getItem('MST_CUSTOM_GEMINI_KEY') || "";
  }
  
  if (!apiKey) {
    throw new Error("ระบบ AI ขัดข้อง กรุณาตรวจสอบการตั้งค่า GEMINI_API_KEY บนเซิร์ฟเวอร์");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-2.5-flash';

  const blacklist = existingQuestions.length > 0 
    ? `\n[ห้ามออกซ้ำ] รายการโจทย์ที่มีอยู่แล้วในระบบ:\n${existingQuestions.slice(0, 40).map((q, i) => `${i+1}. ${q}`).join('\n')}`
    : "";

  const systemInstruction = `คุณคือ "Expert KuruMaster AI" ผู้เชี่ยวชาญระดับสูงในการออกข้อสอบบรรจุครูผู้ช่วย (Teacher Recruitment Exam) ของประเทศไทย
  เฉลยต้องเป็นเลข 1-4 เท่านั้น และคำอธิบายต้องชัดเจนเชิงวิชาการ ${blacklist}`;

  const prompt = `
    สร้างข้อสอบบรรจุครูผู้ช่วย:
    วิชา: ${subjectFullName}
    หมวด: ${categoryLabel}
    หัวข้อ: ${topic}
    จำนวน: ${count} ข้อ
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY, 
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              c1: { type: Type.STRING },
              c2: { type: Type.STRING },
              c3: { type: Type.STRING },
              c4: { type: Type.STRING },
              correct: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["text", "c1", "c2", "c3", "c4", "correct", "explanation"],
          }
        },
      },
    });

    if (response.text) return JSON.parse(response.text.trim());
    return null;
  } catch (error: any) {
    console.error("AI Error:", error);
    throw new Error("AI Error: " + (error.message || "การเชื่อมต่อ AI ขัดข้อง"));
  }
};
