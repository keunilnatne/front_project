const STYLE_LABELS: Record<string, string> = {
  concise: '간결하게',
  detailed: '자세하게',
  conclusion: '결론부터',
  context: '맥락부터',
  polite: '정중하게',
  casual: '편하게',
  direct: '직접적으로',
  formal: '격식 있게',
  structured: '구조적으로',
  friendly: '친근하게',
  professional: '전문적으로',
  clear: '명확하게',
}

export function formatCommunicationStyleLabel(style: string) {
  const normalized = String(style || '').trim()
  return STYLE_LABELS[normalized.toLowerCase()] || normalized
}
