export function match(value: string): string {
    return value.match(/reverted[:|A-z|\s|0-9]+/)?.toString() as string
  }
  
export{}