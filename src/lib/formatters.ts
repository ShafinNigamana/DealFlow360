export function formatDisplayId(id?: string | null): string {
  if (!id) return ''
  if (id.startsWith('demo-')) {
    return id.replace('demo-', '').toUpperCase()
  }
  if (id.length > 20 && id.includes('-')) {
    return id.slice(-6).toUpperCase()
  }
  return id
}
