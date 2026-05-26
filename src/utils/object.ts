export function toSnakeCase(obj: unknown): unknown {

  if (Array.isArray(obj)) {
    
    return obj.map(v => toSnakeCase(v))
    
  } else if (obj !== null && typeof obj === 'object') {
    
    if (typeof (obj as Record<string, unknown>).toJSON === 'function') {
      return (obj as { toJSON: () => unknown }).toJSON()
    }
    
    return Object.keys(obj).reduce((result, key) => {

      const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase()

      result[snakeKey] = toSnakeCase((obj as Record<string, unknown>)[key])
      
      return result
    }, {} as Record<string, unknown>)
  }
  return obj
}