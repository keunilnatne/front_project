type TranslationResult = { responseData?: { translatedText?: string } }
type SpellResult = { matches?: Array<{ message?: string; replacements?: Array<{ value?: string }> }> }

export async function translateAndSpellCheck(text: string, targetLanguage: string) {
  const language = targetLanguage.toLowerCase().startsWith('ko') ? 'ko' : targetLanguage.toLowerCase().startsWith('ja') ? 'ja' : targetLanguage.toLowerCase().startsWith('zh') ? 'zh-CN' : targetLanguage.toLowerCase().startsWith('es') ? 'es' : targetLanguage.toLowerCase().startsWith('de') ? 'de' : 'en'
  const [translation, spelling] = await Promise.allSettled([
    fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ko|${encodeURIComponent(language)}`).then(async (r) => r.ok ? (await r.json() as TranslationResult).responseData?.translatedText : undefined),
    fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ text, language: 'auto' }),
    }).then(async (r) => r.ok ? (await r.json() as SpellResult) : undefined),
  ])
  const spellingData = spelling.status === 'fulfilled' ? spelling.value : undefined
  return {
    translatedText: translation.status === 'fulfilled' && translation.value ? translation.value : text,
    corrections: spellingData?.matches?.slice(0, 5).map((match) => ({
      message: match.message || '',
      replacement: match.replacements?.[0]?.value || '',
    })) || [],
  }
}
