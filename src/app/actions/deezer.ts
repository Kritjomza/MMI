'use server';

import type { DeezerTrack, EmotionLabel } from '@/lib/types';

// Map emotions to Deezer search keywords/genres
const EMOTION_DEEZER_MAP: Record<EmotionLabel, Record<string, string[]>> = {
  happy: {
    Thai: ['เพลงสนุก', 'Thai pop upbeat', 'เพลงเต้น ไทย'],
    English: ['happy pop', 'feel good', 'upbeat hits'],
    Korean: ['K-pop happy', 'K-pop dance'],
    Japanese: ['J-pop happy', 'genki songs'],
    Chinese: ['C-pop happy', 'mandopop upbeat'],
  },
  sad: {
    Thai: ['เพลงเศร้า', 'Thai sad song', 'เพลงอกหัก'],
    English: ['sad acoustic', 'heartbreak songs', 'melancholy'],
    Korean: ['Korean ballad sad', 'K-drama OST'],
    Japanese: ['J-pop sad ballad'],
    Chinese: ['C-pop sad ballad'],
  },
  angry: {
    Thai: ['Thai rock', 'เพลงร็อค ไทย'],
    English: ['rock angry', 'punk', 'hard rock'],
    Korean: ['K-rock'],
    Japanese: ['Japanese rock', 'J-rock'],
    Chinese: ['Chinese rock'],
  },
  surprised: {
    Thai: ['Thai indie', 'เพลงอินดี้'],
    English: ['electronic pop', 'indie dance'],
    Korean: ['K-pop'],
    Japanese: ['J-pop anime'],
    Chinese: ['C-pop'],
  },
  fearful: {
    Thai: ['Thai ambient', 'เพลงบรรเลง'],
    English: ['ambient', 'dark soundtrack'],
    Korean: ['Korean ambient'],
    Japanese: ['Japanese ambient'],
    Chinese: ['Chinese ambient'],
  },
  disgusted: {
    Thai: ['Thai alternative', 'อัลเทอร์เนทีฟ ไทย'],
    English: ['alternative rock', 'grunge'],
    Korean: ['K-indie'],
    Japanese: ['J-rock alternative'],
    Chinese: ['Chinese indie rock'],
  },
  neutral: {
    Thai: ['เพลงชิล', 'Thai lofi', 'เพลงฟังสบาย'],
    English: ['lofi beats', 'chillhop', 'jazz vibes'],
    Korean: ['Korean lofi'],
    Japanese: ['Japanese lofi', 'city pop'],
    Chinese: ['Chinese lofi'],
  },
  calm: {
    Thai: ['เพลงผ่อนคลาย', 'Thai acoustic', 'เพลงกล่อมนอน'],
    English: ['ambient chill', 'classical piano', 'meditation music'],
    Korean: ['Korean acoustic'],
    Japanese: ['Japanese piano', 'ghibli music'],
    Chinese: ['Chinese classical'],
  },
  excited: {
    Thai: ['Thai EDM', 'เพลงปาร์ตี้ ไทย', 'Thai dance'],
    English: ['EDM party', 'high energy dance', 'club hits'],
    Korean: ['K-pop dance', 'K-pop party'],
    Japanese: ['J-pop party', 'anime opening'],
    Chinese: ['C-pop dance'],
  },
};

/**
 * Generic Thai mood keywords that should be REPLACED with language-appropriate ones
 * when the user has selected a non-Thai language.
 */
const THAI_GENERIC_KEYWORDS = new Set([
  'เพลงเศร้า', 'เพลงสนุก', 'เพลงชิล', 'เพลงร็อค', 'เพลงปลอบใจ',
  'เพลงเต้น', 'เพลงผ่อนคลาย', 'เพลงบรรเลง', 'เพลงอกหัก', 'เพลงฟังสบาย',
  'เพลงกล่อมนอน', 'เพลงอินดี้', 'เพลงปาร์ตี้',
]);

/** Map generic mood concepts to each language for search */
const MOOD_LANG_KEYWORDS: Record<string, Record<string, string>> = {
  sad:     { Thai: 'เพลงเศร้า',      English: 'sad songs',        Korean: '슬픈 노래',         Japanese: '悲しい曲',         Chinese: '悲伤的歌' },
  happy:   { Thai: 'เพลงสนุก',       English: 'happy songs',      Korean: '신나는 노래',       Japanese: '楽しい曲',         Chinese: '开心的歌' },
  chill:   { Thai: 'เพลงชิล',        English: 'chill music',      Korean: '편안한 음악',       Japanese: 'チルミュージック', Chinese: '放松音乐' },
  rock:    { Thai: 'เพลงร็อค',       English: 'rock music',       Korean: '록 음악',           Japanese: 'ロック',           Chinese: '摇滚音乐' },
  comfort: { Thai: 'เพลงปลอบใจ',     English: 'comfort songs',    Korean: '위로 노래',         Japanese: '癒しの曲',         Chinese: '治愈音乐' },
};

/**
 * Check if a keyword is a Thai generic mood keyword, and if so
 * return the equivalent in the target language.
 */
function translateMoodKeyword(keyword: string, targetLang: string): string {
  if (!THAI_GENERIC_KEYWORDS.has(keyword)) return keyword;

  // Find the mood concept
  if (keyword.includes('เศร้า') || keyword.includes('อกหัก')) return MOOD_LANG_KEYWORDS.sad[targetLang] || MOOD_LANG_KEYWORDS.sad.English;
  if (keyword.includes('สนุก') || keyword.includes('เต้น') || keyword.includes('ปาร์ตี้')) return MOOD_LANG_KEYWORDS.happy[targetLang] || MOOD_LANG_KEYWORDS.happy.English;
  if (keyword.includes('ร็อค')) return MOOD_LANG_KEYWORDS.rock[targetLang] || MOOD_LANG_KEYWORDS.rock.English;
  if (keyword.includes('ปลอบใจ')) return MOOD_LANG_KEYWORDS.comfort[targetLang] || MOOD_LANG_KEYWORDS.comfort.English;
  return MOOD_LANG_KEYWORDS.chill[targetLang] || MOOD_LANG_KEYWORDS.chill.English;
}

/**
 * Check if a keyword looks like a specific entity (artist/song name)
 * rather than a generic mood description.
 */
function isEntityKeyword(keyword: string): boolean {
  // If it's in the generic Thai set, it's NOT an entity
  if (THAI_GENERIC_KEYWORDS.has(keyword)) return false;
  // Generic patterns like "Thai calm music" are not entities
  if (/^(Thai|English|Korean|Japanese|Chinese)\s/i.test(keyword)) return false;
  // Short English/Thai words that look like mood descriptors
  if (/^(sad|happy|calm|chill|angry|excited|เพลง)/i.test(keyword)) return false;
  return true;
}

export async function getRecommendations(
  emotion: EmotionLabel, 
  languages: string[] = ['Thai', 'English'],
  customKeywords?: string[]
): Promise<DeezerTrack[]> {
  try {
    const queries: string[] = [];
    const primaryLang = languages[0] || 'Thai';

    // Step 1: Extract entity keywords (artist names) — keep as-is
    if (customKeywords && customKeywords.length > 0) {
      for (const kw of customKeywords) {
        if (isEntityKeyword(kw)) {
          queries.push(kw); // Artist name — search directly
        }
      }
    }

    // Step 2: Language-specific emotion keywords from our curated map (TOP PRIORITY)
    const langMap = EMOTION_DEEZER_MAP[emotion] || EMOTION_DEEZER_MAP.neutral;
    for (const lang of languages) {
      const langKeywords = langMap[lang] || [];
      if (langKeywords.length > 0) {
        // Pick 1-2 random keywords from this language
        const shuffled = [...langKeywords].sort(() => Math.random() - 0.5);
        queries.push(...shuffled.slice(0, 2));
      }
    }

    // Step 3: Translate any remaining Thai mood keywords to the selected language
    if (customKeywords && customKeywords.length > 0) {
      for (const kw of customKeywords) {
        if (!isEntityKeyword(kw)) {
          const translated = translateMoodKeyword(kw, primaryLang);
          if (!queries.includes(translated)) {
            queries.push(translated);
          }
        }
      }
    }

    // Fallback if no queries built
    if (queries.length === 0) {
      queries.push('chill music');
    }

    console.log(`Deezer search queries (lang=${primaryLang}, emotion=${emotion}):`, queries);

    // Fetch from multiple queries and merge results
    const allTracks: DeezerTrack[] = [];
    const seenIds = new Set<string>();

    for (const query of queries.slice(0, 5)) { // Max 5 API calls
      try {
        const params = new URLSearchParams({ q: query, limit: '12' });
        const response = await fetch(`https://api.deezer.com/search?${params.toString()}`);

        if (!response.ok) continue;

        const data = await response.json();
        if (!data.data || data.data.length === 0) continue;

        for (const track of data.data) {
          if (seenIds.has(track.id.toString())) continue;
          if (!track.preview || track.preview === '') continue;

          seenIds.add(track.id.toString());
          allTracks.push({
            id: track.id.toString(),
            name: track.title,
            artist: track.artist?.name || 'Unknown',
            albumName: track.album?.title || '',
            albumImage: track.album?.cover_xl || track.album?.cover_large || track.album?.cover_medium || '',
            previewUrl: track.preview,
            deezerUrl: track.link,
          });
        }
      } catch {
        // Skip failed individual queries
      }
    }

    // Shuffle and take top 12
    const shuffled = allTracks.sort(() => Math.random() - 0.5).slice(0, 12);

    if (shuffled.length === 0) {
      return getFallbackTracks();
    }

    return shuffled;
  } catch (error) {
    console.error('Deezer recommendation error:', error);
    return getFallbackTracks();
  }
}

function getFallbackTracks(): DeezerTrack[] {
  const placeholders = [
    { name: 'Sunflower', artist: 'Post Malone, Swae Lee', album: 'Spider-Man: Into the Spider-Verse' },
    { name: 'Happy', artist: 'Pharrell Williams', album: 'Despicable Me 2' },
    { name: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours' },
    { name: 'Levitating', artist: 'Dua Lipa', album: 'Future Nostalgia' },
    { name: 'Watermelon Sugar', artist: 'Harry Styles', album: 'Fine Line' },
    { name: 'Good 4 U', artist: 'Olivia Rodrigo', album: 'SOUR' },
  ];

  return placeholders.map((p, i) => ({
    id: `fallback-${i}`,
    name: p.name,
    artist: p.artist,
    albumName: p.album,
    albumImage: `https://placehold.co/300x300/A7D8FF/white?text=${encodeURIComponent(p.name.charAt(0))}`,
    previewUrl: null,
    deezerUrl: `https://www.deezer.com/search/${encodeURIComponent(p.name + ' ' + p.artist)}`,
  }));
}
