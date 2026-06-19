export function toSnakeCase(obj: unknown, _visited?: Set<unknown>): unknown {

  if (Array.isArray(obj)) {
    
    return obj.map(v => toSnakeCase(v, _visited))
    
  } else if (obj !== null && typeof obj === 'object') {

    const visited = _visited ?? new Set()

    if (visited.has(obj)) return '[Circular]'
    
    visited.add(obj)
    
    if (typeof (obj as Record<string, unknown>).toJSON === 'function') {
      return (obj as { toJSON: () => unknown }).toJSON()
    }
    
    return Object.keys(obj).reduce((result, key) => {

      const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase()

      result[snakeKey] = toSnakeCase((obj as Record<string, unknown>)[key], visited)
      
      return result
    }, {} as Record<string, unknown>)
  }
  return obj
}

export function toCamelCase(obj: unknown, _visited?: Set<unknown>): unknown {

  if (Array.isArray(obj)) {
    
    return obj.map(v => toCamelCase(v, _visited))

  } else if (obj !== null && typeof obj === 'object') {

    const visited = _visited ?? new Set()
    
    if (visited.has(obj)) return '[Circular]'
    
    visited.add(obj)
    
    return Object.keys(obj).reduce((result, key) => {
      
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      
      result[camelKey] = toCamelCase((obj as Record<string, unknown>)[key], visited)
      
      return result
    }, {} as Record<string, unknown>)
  }
  return obj
}