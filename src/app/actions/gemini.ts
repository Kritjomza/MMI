'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AnalysisResult, EmotionScores, EmotionLabel } from '@/lib/types';

export async function analyzeTextEmotion(text: string, languages: string[] = []): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Please add it to your .env.local file.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json'
    }
  });

  const prompt = `You are an expert psychological AI emotion analyst and a highly empathetic music curator. Your task is to deeply analyze the user's input, uncover their emotional state, and generate optimized search keywords for the Deezer API.

Target Music Languages: ${languages.length > 0 ? languages.join(', ') : 'Any language'}

Return ONLY a valid JSON object matching this exact structure:
{
  "reasoning": "Your detailed internal chain-of-thought analysis of the user's text. Explain what emotions you detect, why you chose the dominant emotion, and any cultural/linguistic nuance you picked up. This helps the user understand how you analyzed them. Write this in Thai if the input is Thai, English if English.",
  "dominantEmotion": "one of: happy, sad, angry, surprised, fearful, disgusted, neutral, calm, excited",
  "emotionScores": {
    "happy": 0.0, "sad": 0.0, "angry": 0.0, "surprised": 0.0, "fearful": 0.0, "disgusted": 0.0, "neutral": 0.0
  },
  "valence": 0.0, 
  "arousal": 0.0,
  "aiInterpretation": "A warm, highly empathetic 2-3 sentence response in the USER'S LANGUAGE. Must include a short encouraging message.",
  "searchKeywords": ["keyword1", "keyword2", "keyword3"]
}

VITAL RULES & GUIDELINES:
1. HANDLING SHORT INPUTS & EMPATHY (CRITICAL): 
   - Even if the input is just 1-2 words (e.g., "เหนื่อย", "sad", "เบื่อ", "เหงา"), DO NOT default to neutral. 
   - Decode the physical/mental state: "เหนื่อย" = tired/exhausted → Arousal very low (0.1-0.2), Valence slightly negative (-0.3 to -0.5). Dominant = 'sad' or 'calm'.
   - "เบื่อ" = bored → low arousal (0.1-0.3), neutral-to-negative valence. Dominant = 'neutral' ONLY if truly ambiguous. Otherwise lean toward the actual state.
   - "ดีใจ" = glad/happy → high valence (0.6-0.8), moderate arousal. Dominant = 'happy'.
   - The "aiInterpretation" MUST sound like a supportive, caring friend. Use emoji sparingly (1-2 max). 
2. DEEP EMOTION ANALYSIS: 
   - emotionScores values MUST sum to approximately 1.0. Be decisive — don't spread scores evenly. The dominant emotion should have at least 0.35-0.60 score.
   - Valence ranges from -1.0 (very negative) to 1.0 (very positive).
   - Arousal ranges from 0.0 (very calm/low energy) to 1.0 (high energy/excitement).
   - NEVER give neutral > 0.3 unless the text is truly emotionless factual text (like "the sky is blue").
3. ARTIST & ENTITY EXTRACTION: If the user explicitly names an artist (e.g., "lazyloxy", "the toys"), song, or genre, IT MUST BE THE VERY FIRST ITEM in "searchKeywords". DO NOT translate or alter artist names.
4. LANGUAGE-SPECIFIC MUSIC CURATION: 
   - Requested language constraint: "${languages.length > 0 ? languages.join(', ') : 'any'}".
   - Tailor the keywords to match the mood AND the requested language. Examples for Thai: "เพลงเศร้า ฮีลใจ", "Thai indie", "เพลงรัก acoustic". For Korean: "K-pop sad", "Korean ballad". For Japanese: "J-pop chill".

User's input text:
"${text}"`;

  // Try up to 2 times
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      console.log(`Gemini raw response (attempt ${attempt + 1}):`, response.substring(0, 300));

      // Parse JSON from response
      let jsonStr = response;
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonStr);

      // Validate required fields exist
      if (!parsed.dominantEmotion || !parsed.emotionScores) {
        throw new Error('Invalid response structure: missing dominantEmotion or emotionScores');
      }

      console.log(`Gemini parsed OK: ${parsed.dominantEmotion}, keywords: ${JSON.stringify(parsed.searchKeywords)}`);

      return {
        dominantEmotion: parsed.dominantEmotion as EmotionLabel,
        emotionScores: parsed.emotionScores as EmotionScores,
        valence: parsed.valence ?? 0,
        arousal: parsed.arousal ?? 0.3,
        aiInterpretation: parsed.aiInterpretation || 'AI วิเคราะห์อารมณ์ของคุณเรียบร้อยแล้ว',
        reasoning: parsed.reasoning || '',
        searchKeywords: parsed.searchKeywords || [],
        source: 'text',
      };
    } catch (error: any) {
      console.error(`Gemini analysis error (attempt ${attempt + 1}):`, error?.message || error);
      if (attempt === 1) {
        return createSmartFallback(text, languages);
      }
      // Small delay before retry
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return createSmartFallback(text, languages);
}

/**
 * Extract entity names (artists, songs, genres) from user text.
 * Catches patterns like "เพลงของ X", "ฟัง X", "lazyloxy", quoted text, etc.
 */
function extractEntities(text: string): string[] {
  const entities: string[] = [];

  // Pattern 1: "เพลงของ X", "เพลง X", "ฟังเพลง X", "อยากฟัง X"
  const thaiPatterns = [
    /(?:เพลงของ|เพลง|ฟังเพลง|อยากฟัง|ฟัง)\s*([a-zA-Z\u0E00-\u0E7F][\w\u0E00-\u0E7F\s]{1,30}?)(?:\s*(?:จัง|หน่อย|บ้าง|ค่ะ|ครับ|นะ|เลย|มาก|สักหน่อย|ด้วย|$))/gi,
  ];

  for (const pattern of thaiPatterns) {
    const matches = text.matchAll(pattern);
    for (const m of matches) {
      const name = m[1].trim();
      if (name.length >= 2) entities.push(name);
    }
  }

  // Pattern 2: Quoted text — "artist name" or 'song name'
  const quotedMatches = text.matchAll(/["'""'']([^"'""'']{2,30})["'""'']/g);
  for (const m of quotedMatches) {
    entities.push(m[1].trim());
  }

  // Pattern 3: English words that look like proper nouns / artist names (2+ chars, not common words)
  const commonWords = new Set(['the', 'and', 'for', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'had', 'has', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'way', 'who', 'did', 'get', 'let', 'say', 'she', 'too', 'use', 'sad', 'happy', 'angry', 'calm', 'chill', 'want', 'feel', 'like', 'love', 'hate', 'listen', 'music', 'song', 'play']);
  const englishWords = text.match(/[a-zA-Z]{2,}/g) || [];
  for (const word of englishWords) {
    if (!commonWords.has(word.toLowerCase()) && word.length >= 3) {
      // Check if it looks like a name (not a generic adjective)
      entities.push(word);
    }
  }

  // Deduplicate
  return [...new Set(entities)];
}

/** Smart fallback with keyword matching AND entity extraction */
function createSmartFallback(text: string, languages: string[]): AnalysisResult {
  const lower = text.toLowerCase();
  
  // Extract entities (artist names, etc.) FIRST
  const entities = extractEntities(text);
  
  // Thai keyword matching for emotions
  const sadWords = ['เศร้า', 'เสียใจ', 'ร้องไห้', 'อกหัก', 'เหงา', 'เหนื่อย', 'หมดแรง', 'ท้อ', 'ผิดหวัง'];
  const happyWords = ['สุข', 'ดีใจ', 'สนุก', 'ยิ้ม', 'หัวเราะ', 'ชอบ', 'รัก', 'ดีมาก', 'เยี่ยม'];
  const angryWords = ['โกรธ', 'หงุดหงิด', 'เซ็ง', 'โมโห', 'angry', 'frustrated'];
  const calmWords = ['สงบ', 'ชิล', 'ผ่อนคลาย', 'สบาย', 'calm', 'relax', 'chill'];
  const excitedWords = ['ตื่นเต้น', 'ว้าว', 'excited', 'amazing', 'awesome'];
  const fearfulWords = ['เครียด', 'กังวล', 'กลัว', 'ระแวง', 'panic', 'stress', 'anxious', 'fear', 'scared'];
  const wantListenWords = ['อยากฟัง', 'ฟังเพลง', 'เปิดเพลง', 'listen', 'play'];
  
  let dominant: EmotionLabel = 'neutral';
  let scores: EmotionScores = { happy: 0.1, sad: 0.1, angry: 0.05, surprised: 0.05, fearful: 0.05, disgusted: 0.02, neutral: 0.63 };
  let valence = 0.0;
  let interpretation = 'เราพร้อมรับฟังคุณเสมอ ลองฟังเพลงที่เราเลือกมาให้ดูนะคะ';
  
  if (fearfulWords.some(w => lower.includes(w))) {
    dominant = 'fearful'; scores = { happy: 0.02, sad: 0.1, angry: 0.1, surprised: 0.15, fearful: 0.55, disgusted: 0.03, neutral: 0.05 };
    valence = -0.4; interpretation = 'ช่วงนี้คุณอาจจะรู้สึกเครียดหรือกังวลนะคะ หายใจลึกๆ แล้วลองฟังเพลงที่ช่วยปลอบโยนใจดูนะคะ 🤍';
  } else if (sadWords.some(w => lower.includes(w)) || ['sad', 'tired', 'lonely'].some(w => lower.includes(w))) {
    dominant = 'sad'; scores = { happy: 0.05, sad: 0.55, angry: 0.05, surprised: 0.02, fearful: 0.08, disgusted: 0.02, neutral: 0.08 }; 
    valence = -0.6; interpretation = 'วันนี้คงเจอเรื่องหนักๆ มา พักใจสักครู่แล้วฟังเพลงที่เราเลือกให้นะคะ 💛';
  } else if (happyWords.some(w => lower.includes(w)) || ['happy', 'glad', 'joy'].some(w => lower.includes(w))) {
    dominant = 'happy'; scores = { happy: 0.6, sad: 0.03, angry: 0.02, surprised: 0.1, fearful: 0.02, disgusted: 0.01, neutral: 0.07 };
    valence = 0.7; interpretation = 'ดีใจที่คุณมีความสุขนะคะ! เราเลือกเพลงสนุกๆ มาเพิ่มพลังให้คุณอีก 🎉';
  } else if (angryWords.some(w => lower.includes(w))) {
    dominant = 'angry'; scores = { happy: 0.02, sad: 0.1, angry: 0.55, surprised: 0.05, fearful: 0.08, disgusted: 0.1, neutral: 0.05 };
    valence = -0.5; interpretation = 'หายใจลึกๆ นะคะ บางทีเพลงก็ช่วยระบายความรู้สึกได้ดี ลองฟังดูนะ';
  } else if (calmWords.some(w => lower.includes(w))) {
    dominant = 'calm'; scores = { happy: 0.15, sad: 0.05, angry: 0.02, surprised: 0.02, fearful: 0.02, disgusted: 0.01, neutral: 0.18 };
    valence = 0.3; interpretation = 'ช่วงเวลาสงบๆ แบบนี้ดีนะคะ เราเลือกเพลงชิลๆ มาเติมบรรยากาศให้คุณ 🍃';
  } else if (excitedWords.some(w => lower.includes(w))) {
    dominant = 'excited'; scores = { happy: 0.3, sad: 0.02, angry: 0.02, surprised: 0.2, fearful: 0.02, disgusted: 0.01, neutral: 0.03 };
    valence = 0.8; interpretation = 'พลังงานดีมาก! เราเลือกเพลงสุดมันมาเสริมอารมณ์ให้คุณเลย ⚡';
  } else if (wantListenWords.some(w => lower.includes(w))) {
    // User wants to listen to music — positive/eager mood
    dominant = 'happy'; scores = { happy: 0.4, sad: 0.02, angry: 0.02, surprised: 0.1, fearful: 0.02, disgusted: 0.01, neutral: 0.08 };
    valence = 0.5; interpretation = entities.length > 0
      ? `เราหาเพลงของ ${entities[0]} มาให้คุณแล้วนะคะ ลองฟังดูเลย 🎶`
      : 'เราเลือกเพลงที่ดีๆ มาให้คุณแล้วนะคะ ลองฟังดูเลย 🎶';
  }

  // Build searchKeywords: entities FIRST, then generic mood keywords
  const keywords: string[] = [];
  
  // Add extracted entities as top priority keywords
  for (const entity of entities) {
    keywords.push(entity);
  }
  
  // Add mood-based generic keywords
  const langStr = languages.length > 0 ? languages[0] : 'Thai';
  const moodKeyword = dominant === 'sad' ? 'เพลงเศร้า' : dominant === 'happy' ? 'เพลงสนุก' : dominant === 'angry' ? 'เพลงร็อค' : dominant === 'fearful' ? 'เพลงปลอบใจ' : 'เพลงชิล';
  
  // Only add generic keywords if we don't have specific entities
  if (keywords.length === 0) {
    keywords.push(`${langStr} ${dominant} music`);
  }
  keywords.push(moodKeyword);

  return {
    dominantEmotion: dominant,
    emotionScores: scores,
    valence,
    arousal: dominant === 'excited' ? 0.8 : (dominant === 'happy' || dominant === 'fearful') ? 0.5 : 0.2,
    aiInterpretation: interpretation,
    reasoning: `[Fallback] ระบบตรวจจับ${entities.length > 0 ? ` entity: "${entities.join(', ')}" และ` : ''}อารมณ์จากข้อความ "${text}" → "${dominant}"`,
    searchKeywords: keywords,
    source: 'text',
  };
}

export async function fuseEmotions(
  faceResult: AnalysisResult | null,
  textResult: AnalysisResult | null
): Promise<AnalysisResult> {
  if (!faceResult && !textResult) {
    return {
      dominantEmotion: 'neutral',
      emotionScores: { happy: 0, sad: 0, angry: 0, surprised: 0, fearful: 0, disgusted: 0, neutral: 1 },
      valence: 0,
      arousal: 0.3,
      aiInterpretation: 'บอกความรู้สึกของคุณให้เราฟังหน่อยนะคะ — ลองเปิดกล้องหรือเขียนอะไรสักหน่อยเพื่อเริ่มต้น',
      searchKeywords: ['chill vibes'],
      source: 'text',
    };
  }

  if (!faceResult) return textResult!;
  if (!textResult) {
    return {
      ...faceResult,
      aiInterpretation: faceResult.aiInterpretation || `เราตรวจจับอารมณ์จากใบหน้าของคุณว่ารู้สึก "${faceResult.dominantEmotion}" — เราเลือกเพลงที่เหมาะกับอารมณ์นี้ให้คุณแล้ว`,
    };
  }

  // Weighted fusion: text 60%, face 40%
  const faceWeight = 0.4;
  const textWeight = 0.6;

  const fusedScores: EmotionScores = {
    happy: faceResult.emotionScores.happy * faceWeight + textResult.emotionScores.happy * textWeight,
    sad: faceResult.emotionScores.sad * faceWeight + textResult.emotionScores.sad * textWeight,
    angry: faceResult.emotionScores.angry * faceWeight + textResult.emotionScores.angry * textWeight,
    surprised: faceResult.emotionScores.surprised * faceWeight + textResult.emotionScores.surprised * textWeight,
    fearful: faceResult.emotionScores.fearful * faceWeight + textResult.emotionScores.fearful * textWeight,
    disgusted: faceResult.emotionScores.disgusted * faceWeight + textResult.emotionScores.disgusted * textWeight,
    neutral: faceResult.emotionScores.neutral * faceWeight + textResult.emotionScores.neutral * textWeight,
  };

  const dominantEmotion = (Object.entries(fusedScores) as [EmotionLabel, number][])
    .sort((a, b) => b[1] - a[1])[0][0];

  const fusedValence = faceResult.valence * faceWeight + textResult.valence * textWeight;
  const fusedArousal = faceResult.arousal * faceWeight + textResult.arousal * textWeight;

  return {
    dominantEmotion,
    emotionScores: fusedScores,
    valence: fusedValence,
    arousal: fusedArousal,
    aiInterpretation: textResult.aiInterpretation,
    reasoning: textResult.reasoning,
    searchKeywords: textResult.searchKeywords,
    source: 'both',
  };
}
