type TranslationResult = { responseData?: { translatedText?: string } }
type SpellResult = { matches?: Array<{ message?: string; replacements?: Array<{ value?: string }> }> }

export type DetectedLanguage = 'ko' | 'en' | 'ja' | 'zh-CN' | 'es' | 'de'

export function detectMessageLanguage(text: string): DetectedLanguage {
  if (/[가-힣]/.test(text)) return 'ko'
  if (/[\u3040-\u30ff]/.test(text)) return 'ja'
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh-CN'
  if (/[A-Za-z]/.test(text)) return 'en'
  return 'en'
}

function normalizeLanguage(language: string): DetectedLanguage {
  const value = language.toLowerCase()
  if (value.startsWith('ko') || value.includes('korean')) return 'ko'
  if (value.startsWith('ja') || value.includes('japanese')) return 'ja'
  if (value.startsWith('zh') || value.includes('chinese')) return 'zh-CN'
  if (value.startsWith('es') || value.includes('spanish')) return 'es'
  if (value.startsWith('de') || value.includes('german')) return 'de'
  return 'en'
}

export async function translateAndSpellCheck(text: string, targetLanguage: string, sourceLanguage?: string) {
  const source = sourceLanguage ? normalizeLanguage(sourceLanguage) : detectMessageLanguage(text)
  const target = normalizeLanguage(targetLanguage)

  // 같은 언어끼리 MyMemory에 번역 요청하면 "PLEASE SELECT TWO DISTINCT LANGUAGES"가 반환된다.
  const translationPromise = source === target
    ? Promise.resolve(text)
    : fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(source)}|${encodeURIComponent(target)}`)
      .then(async (response) => response.ok ? (await response.json() as TranslationResult).responseData?.translatedText : undefined)

  const [translation, spelling] = await Promise.allSettled([
    translationPromise,
    fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ text, language: source === 'zh-CN' ? 'zh' : source }),
    }).then(async (response) => response.ok ? (await response.json() as SpellResult) : undefined),
  ])

  const spellingData = spelling.status === 'fulfilled' ? spelling.value : undefined
  return {
    sourceLanguage: source,
    targetLanguage: target,
    translatedText: translation.status === 'fulfilled' && translation.value ? translation.value : text,
    corrections: spellingData?.matches?.slice(0, 5).map((match) => ({
      message: match.message || '',
      replacement: match.replacements?.[0]?.value || '',
    })) || [],
  }
}
