import sharp from 'sharp'

const TILE_SIZE = 256
const ZOOM = 15
const GRID = 3 // 3x3 tiles stitched into one image
const USER_AGENT = 'YumAndChillLeaseManagement/1.0 (internal tool; static map for PDF export)'
const FETCH_TIMEOUT_MS = 4000

function lonToTileX(lon: number, zoom: number): number {
  return ((lon + 180) / 360) * 2 ** zoom
}

function latToTileY(lat: number, zoom: number): number {
  const latRad = (lat * Math.PI) / 180
  return ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * 2 ** zoom
}

async function fetchTile(z: number, x: number, y: number): Promise<Buffer | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT },
    })
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

const PIN_SVG = (color: string) => `
<svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">
  <path d="M13 0C5.8 0 0 5.8 0 13c0 9.5 13 21 13 21s13-11.5 13-21C26 5.8 20.2 0 13 0z" fill="${color}"/>
  <circle cx="13" cy="13" r="5.5" fill="#ffffff"/>
</svg>`

// Composites a 3x3 grid of real OpenStreetMap tiles into one colored map image with a pin
// marker at the exact property location. Returns null (never throws) if tiles can't be fetched,
// so PDF generation always succeeds with a graceful placeholder instead.
export async function buildStaticMapImage(
  lat: number | null,
  lng: number | null,
  pinColor: string
): Promise<Buffer | null> {
  if (lat == null || lng == null) return null

  const xFloat = lonToTileX(lng, ZOOM)
  const yFloat = latToTileY(lat, ZOOM)
  const centerX = Math.floor(xFloat)
  const centerY = Math.floor(yFloat)
  const offset = Math.floor(GRID / 2)

  const tileCoords: { dx: number; dy: number }[] = []
  for (let dy = -offset; dy <= offset; dy++) {
    for (let dx = -offset; dx <= offset; dx++) {
      tileCoords.push({ dx, dy })
    }
  }

  const tiles = await Promise.all(
    tileCoords.map(({ dx, dy }) => fetchTile(ZOOM, centerX + dx, centerY + dy))
  )
  if (tiles.some(t => t == null)) return null

  const canvasSize = TILE_SIZE * GRID
  const composites = tileCoords.map(({ dx, dy }, i) => ({
    input: tiles[i] as Buffer,
    left: (dx + offset) * TILE_SIZE,
    top: (dy + offset) * TILE_SIZE,
  }))

  const pinX = Math.round((xFloat - (centerX - offset)) * TILE_SIZE)
  const pinY = Math.round((yFloat - (centerY - offset)) * TILE_SIZE)
  const pinWidth = 26
  const pinHeight = 34

  try {
    const base = sharp({
      create: { width: canvasSize, height: canvasSize, channels: 3, background: '#f5f3f9' },
    }).composite([
      ...composites,
      {
        input: Buffer.from(PIN_SVG(pinColor)),
        left: Math.round(pinX - pinWidth / 2),
        top: Math.round(pinY - pinHeight),
      },
    ])

    return await base.png().toBuffer()
  } catch {
    return null
  }
}
