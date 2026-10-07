export type RasterType = 'image/png' | 'image/jpeg'

/** Rasterise a standalone SVG string at `scale` × its intrinsic size. */
export async function rasterize(svgText: string, w: number, h: number, scale: number, type: RasterType): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }))
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    // Safari can report decode() before embedded fonts are applied; a little slack avoids fallback glyphs.
    // A timer rather than requestAnimationFrame, which never fires while the tab is in the background.
    await new Promise((r) => setTimeout(r, 60))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(w * scale)
    canvas.height = Math.round(h * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Your browser blocked drawing the image. Try another browser.')
    if (type === 'image/jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('The image was too large to export. Try a smaller scale.'))), type, 0.92),
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}
