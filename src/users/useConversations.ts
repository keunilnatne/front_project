import { useCallback, useEffect, useState } from 'react'
import { deleteConversation, fetchConversations, type Conversation } from './conversationArchive'

export function useConversations(isEnabled: boolean) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!isEnabled) return

    const controller = new AbortController()
    setIsLoading(true)
    setErrorMessage('')

    void fetchConversations(controller.signal)
      .then(setConversations)
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('대화 목록을 불러오지 못했습니다.', error)
          setErrorMessage('대화 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
        }
      })
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [isEnabled])

  const removeConversation = useCallback(async (conversationId: string) => {
    await deleteConversation(conversationId)
    setConversations((current) => current.filter(({ id }) => id !== conversationId))
  }, [])

  return { conversations, isLoading, errorMessage, removeConversation }
}
