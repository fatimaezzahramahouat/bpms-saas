// backend/src/lib/groq.ts
import Groq from 'groq-sdk';

// ✅ تهيئة Groq Client بالمفتاح من .env
const apiKey = process.env.GROQ_API_KEY || '';

if (!apiKey || apiKey.length < 10) {
  console.warn('⚠️ GROQ_API_KEY غير موجود أو غير صالح في ملف .env');
}

const groqClient = new Groq({ apiKey });

// ✅ نموذج Groq المدعوم حاليًا (مارس 2026)
const MODEL_NAME = 'llama-3.3-70b-versatile'; // ← هذا هو التحديث المهم

/**
 * دالة لتوليد المحتوى من Groq AI
 */
export async function generateContent(prompt: string): Promise<string> {
  try {
    console.log(`🔄 Calling Groq AI (${MODEL_NAME})...`);
    
    const chatCompletion = await groqClient.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR recruiter and professional CV analyst. Respond in French language only. Output must be valid JSON only, no extra text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: MODEL_NAME,
      temperature: 0.2,
      max_tokens: 4096,
      top_p: 0.95,
      stream: false,
    });
    
    const response = chatCompletion.choices[0]?.message?.content || '';
    
    console.log('✅ Response received from Groq AI');
    return response;
    
  } catch (error: unknown) {
    console.error('❌ Groq API Error:', error);
    
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      
      if (msg.includes('401') || msg.includes('api key') || msg.includes('authentication')) {
        throw new Error('🔑 مفتاح Groq API غير صالح. تحقق من .env');
      }
      
      if (msg.includes('429') || msg.includes('rate limit') || msg.includes('quota')) {
        throw new Error('⏳ تم تجاوز حد الاستخدام. انتظر قليلاً');
      }
      
      if (msg.includes('model_decommissioned') || msg.includes('not supported')) {
        throw new Error('🔄 هذا النموذج لم يعد مدعومًا. حدّث MODEL_NAME في groq.ts');
      }
      
      if (msg.includes('400') || msg.includes('invalid')) {
        throw new Error('⚙️ طلب غير صالح. تحقق من صيغة الـ Prompt');
      }
      
      throw new Error(`Groq AI Error: ${error.message}`);
    }
    
    throw new Error('Groq AI Error: خطأ غير متوقع');
  }
}

export { groqClient, MODEL_NAME };