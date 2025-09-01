export function extractStringFromMessageContent(message) {
  return typeof message.content === 'string'
    ? message.content
    : Array.isArray(message.content)
    ? message.content
        .filter((c) => c.type === 'text' || typeof c === 'string')
        .map((c) => (typeof c === 'string' ? c : c.text || ''))
        .join('')
    : '';
}
