/** Apply square/rect crop params. Unsplash uses native params; other hosts go through wsrv.nl. */
export function applyImageCrop(
  rawUrl: string,
  width: number,
  height: number,
): string {
  const trimmed = rawUrl.trim()
  if (!trimmed) {
    throw new Error('Chưa có URL ảnh')
  }

  const w = Math.max(1, Math.round(width) || 400)
  const h = Math.max(1, Math.round(height) || 400)

  let source = trimmed
  try {
    const parsed = new URL(trimmed)
    if (
      parsed.hostname === 'wsrv.nl' ||
      parsed.hostname.endsWith('weserv.nl')
    ) {
      const inner = parsed.searchParams.get('url')
      if (inner) {
        source = /^https?:\/\//i.test(inner) ? inner : `https://${inner}`
      }
    }
  } catch {
    throw new Error('URL ảnh không hợp lệ')
  }

  let sourceUrl: URL
  try {
    sourceUrl = new URL(source)
  } catch {
    throw new Error('URL ảnh không hợp lệ')
  }

  if (sourceUrl.hostname.includes('unsplash.com')) {
    sourceUrl.searchParams.set('auto', 'format')
    sourceUrl.searchParams.set('fit', 'crop')
    sourceUrl.searchParams.set('w', String(w))
    sourceUrl.searchParams.set('h', String(h))
    return sourceUrl.toString()
  }

  const proxied = new URL('https://wsrv.nl/')
  proxied.searchParams.set(
    'url',
    sourceUrl.toString().replace(/^https?:\/\//i, ''),
  )
  proxied.searchParams.set('w', String(w))
  proxied.searchParams.set('h', String(h))
  proxied.searchParams.set('fit', 'cover')
  return proxied.toString()
}

export function readCropSizeFromUrl(rawUrl: string): { width: number; height: number } | null {
  const trimmed = rawUrl.trim()
  if (!trimmed) return null
  try {
    const parsed = new URL(trimmed)
    const w = Number(parsed.searchParams.get('w'))
    const h = Number(parsed.searchParams.get('h'))
    if (w > 0 && h > 0) return { width: w, height: h }
  } catch {
    return null
  }
  return null
}
