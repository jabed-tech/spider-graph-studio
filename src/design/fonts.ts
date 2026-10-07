export interface FontDef {
  id: string
  label: string
  /** Unique family name used inside the SVG, so the raster and PDF exporters resolve the exact face. */
  family: string
  file: string
  kind: 'display' | 'manga' | 'text'
}

const def = (id: string, label: string, file: string, kind: FontDef['kind']): FontDef => ({
  id, label, file, kind, family: `sgs-${id}`,
})

export const FONTS: FontDef[] = [
  def('bangers', 'Bangers', 'Bangers-400.ttf', 'display'),
  def('anton', 'Anton', 'Anton-400.ttf', 'display'),
  def('archivo-black', 'Archivo Black', 'ArchivoBlack-400.ttf', 'display'),
  def('bebas', 'Bebas Neue', 'BebasNeue-400.ttf', 'display'),
  def('playfair', 'Playfair Display', 'PlayfairDisplay-700.ttf', 'display'),
  def('marker', 'Permanent Marker', 'PermanentMarker-400.ttf', 'display'),
  def('luckiest', 'Luckiest Guy', 'LuckiestGuy-400.ttf', 'display'),
  def('bowlby', 'Bowlby One', 'BowlbyOne-400.ttf', 'display'),
  def('rubik-mono', 'Rubik Mono One', 'RubikMonoOne-400.ttf', 'display'),
  def('black-ops', 'Black Ops One', 'BlackOpsOne-400.ttf', 'display'),
  def('righteous', 'Righteous', 'Righteous-400.ttf', 'display'),
  def('abril', 'Abril Fatface', 'AbrilFatface-400.ttf', 'display'),
  def('lobster', 'Lobster', 'Lobster-400.ttf', 'display'),
  def('pacifico', 'Pacifico', 'Pacifico-400.ttf', 'display'),
  def('creepster', 'Creepster', 'Creepster-400.ttf', 'display'),
  def('press-start', 'Press Start 2P', 'PressStart2P-400.ttf', 'display'),
  // Manga faces are subset to Latin, kana and common symbols (see README) to keep exports small.
  def('dela-gothic', 'Dela Gothic One', 'DelaGothicOne-400.ttf', 'manga'),
  def('rampart', 'Rampart One', 'RampartOne-400.ttf', 'manga'),
  def('reggae', 'Reggae One', 'ReggaeOne-400.ttf', 'manga'),
  def('potta', 'Potta One', 'PottaOne-400.ttf', 'manga'),
  def('mochiy-pop', 'Mochiy Pop One', 'MochiyPopOne-400.ttf', 'manga'),
  def('hachi-maru', 'Hachi Maru Pop', 'HachiMaruPop-400.ttf', 'manga'),
  def('inter', 'Inter', 'Inter-400.ttf', 'text'),
  def('inter-bold', 'Inter Bold', 'Inter-700.ttf', 'text'),
  def('space-grotesk', 'Space Grotesk', 'SpaceGrotesk-500.ttf', 'text'),
  def('comic-neue', 'Comic Neue Bold', 'ComicNeue-700.ttf', 'text'),
  def('special-elite', 'Special Elite', 'SpecialElite-400.ttf', 'text'),
]

export const fontById = (id: string): FontDef => FONTS.find((f) => f.id === id) ?? FONTS[0]

export const fontUrl = (f: FontDef) => `${import.meta.env.BASE_URL}fonts/${f.file}`

/** Register every design font with the page so the live preview renders them. */
export function installPreviewFonts() {
  if (document.getElementById('sgs-fonts')) return
  const style = document.createElement('style')
  style.id = 'sgs-fonts'
  style.textContent = FONTS.map(
    (f) => `@font-face{font-family:'${f.family}';src:url('${fontUrl(f)}') format('truetype');font-display:block}`,
  ).join('\n')
  document.head.appendChild(style)
}

/** Resolves once the given fonts are loaded, so text measurements and exports are accurate. */
export function loadFonts(ids: string[]): Promise<unknown> {
  return Promise.all([...new Set(ids)].map((id) => document.fonts.load(`40px '${fontById(id).family}'`)))
}
