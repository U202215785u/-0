const PREFIX = '家宴点菜:'

export function encodeSelection(ids: string[]): string {
  return `${PREFIX} ${JSON.stringify({ recipeIds: ids })}`
}

export function decodeSelection(text: string): { recipeIds: string[] } {
  if (!text.startsWith(PREFIX)) throw new Error('无法识别点菜码')

  try {
    const payload: unknown = JSON.parse(text.slice(PREFIX.length).trim())
    if (!isSelectionPayload(payload)) throw new Error()
    return { recipeIds: payload.recipeIds }
  } catch {
    throw new Error('无法识别点菜码')
  }
}

function isSelectionPayload(value: unknown): value is { recipeIds: string[] } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  return Object.keys(record).length === 1
    && Array.isArray(record.recipeIds)
    && record.recipeIds.every((id) => typeof id === 'string' && id.length > 0)
}
