/** How many content items (any object with `sourceIds`) cite each source, walking the content JSON. */
export function sourceUsage(content: unknown[]): Record<string, number> {
  const out: Record<string, number> = {};
  const walk = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') {
      const ids = (v as { sourceIds?: unknown }).sourceIds;
      if (Array.isArray(ids)) for (const id of ids) if (typeof id === 'string') out[id] = (out[id] ?? 0) + 1;
      Object.values(v).forEach(walk);
    }
  };
  content.forEach(walk);
  return out;
}
