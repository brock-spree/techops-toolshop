// Message types for Toolshop ↔ Spark communication via CustomEvent

export interface ToolshopMessage {
  type: 'theme-change' | 'auth-token' | 'navigate' | 'resize'
  payload: unknown
}

export interface SparkMessage {
  type: 'open-full' | 'state-update' | 'request-resize' | 'entity-resolved'
  payload: unknown
}

/** Send a message from the Toolshop to a Spark component */
export function sendToSpark(message: ToolshopMessage) {
  window.dispatchEvent(
    new CustomEvent('toolshop-message', { detail: message }),
  )
}

/** Listen for messages from a Spark component */
export function onSparkMessage(
  handler: (message: SparkMessage) => void,
): () => void {
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<SparkMessage>).detail
    handler(detail)
  }

  window.addEventListener('spark-message', listener)
  return () => window.removeEventListener('spark-message', listener)
}
