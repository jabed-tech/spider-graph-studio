const cache = new Map<string, string>()

/**
 * A blob: URL for a data: URL, cached. The live preview references images this way so
 * multi-hundred-KB strings stay out of the DOM; exports swap the data URL back in
 * (see inlineImages) so downloaded files stay self-contained.
 */
export function previewUrl(dataUrl: string): string {
  if (!dataUrl.startsWith('data:')) return dataUrl
  const hit = cache.get(dataUrl)
  if (hit) return hit
  const [head, body] = dataUrl.split(',', 2)
  const mime = head.slice(5).split(';')[0] || 'application/octet-stream'
  const bin = head.includes(';base64') ? atob(body) : decodeURIComponent(body)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }))
  if (cache.size >= 8) {
    const [oldKey, oldUrl] = cache.entries().next().value as [string, string]
    URL.revokeObjectURL(oldUrl)
    cache.delete(oldKey)
  }
  cache.set(dataUrl, url)
  return url
}

/** On an exported clone, point every <image> back at its embedded data URL. */
export function inlineImages(root: Element) {
  root.querySelectorAll('image[data-src]').forEach((img) => {
    img.setAttribute('href', img.getAttribute('data-src')!)
    img.removeAttribute('data-src')
  })
}
