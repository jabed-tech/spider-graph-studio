const MAX_SIDE = 2000

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(new Error("That file couldn't be read. Try a different image."))
    r.readAsDataURL(blob)
  })
}

/** Downscale to at most MAX_SIDE px so projects stay small, and return a data URL. */
async function normalize(blob: Blob): Promise<string> {
  if (!blob.type.startsWith('image/')) throw new Error("That isn't an image. Use a PNG, JPG, WebP or GIF.")
  const src = await readAsDataUrl(blob)
  const img = new Image()
  img.src = src
  try {
    await img.decode()
  } catch {
    throw new Error("That image couldn't be opened. Try saving it as PNG or JPG first.")
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
  if (scale === 1 && blob.type === 'image/jpeg' && blob.size < 1_500_000) return src
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.naturalWidth * scale)
  canvas.height = Math.round(img.naturalHeight * scale)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  // PNG only when the picture really uses transparency (cut-out character art); JPEG keeps
  // everything else small, which keeps projects, autosave and exports light.
  return hasTransparency(ctx, canvas.width, canvas.height) ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.9)
}

function hasTransparency(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  const data = ctx.getImageData(0, 0, w, h).data
  for (let i = 3; i < data.length; i += 16) if (data[i] < 250) return true
  return false
}

export const imageFromFile = (file: File) => normalize(file)

export async function imageFromUrl(url: string): Promise<string> {
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    throw new Error('That doesn’t look like a web address. Paste a link that starts with https://')
  }
  let res: Response
  try {
    res = await fetch(parsed.href, { mode: 'cors' })
  } catch {
    throw new Error("That site doesn't allow its images to be used elsewhere. Save the image to your device and upload it instead.")
  }
  if (!res.ok) throw new Error(`That link returned an error (${res.status}). Check the address or upload the image instead.`)
  return normalize(await res.blob())
}
