import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024
const MAX_EDGE = 2048
const QUALITY_STEPS = [0.85, 0.7, 0.55, 0.4, 0.3]

export interface PreparedPhoto {
  uri: string
  width: number
  height: number
  bytes: number
}

async function fileSize(uri: string): Promise<number> {
  const blob = await (await fetch(uri)).blob()
  return blob.size
}

// Resizes to at most 2048px on the long edge and re-encodes as JPEG until it is ≤ 2MB.
// Re-encoding also drops all EXIF metadata from the uploaded file.
export async function preparePhotoForUpload(uri: string, width: number, height: number): Promise<PreparedPhoto> {
  const longEdge = Math.max(width, height)
  const scale = longEdge > MAX_EDGE ? MAX_EDGE / longEdge : 1
  const size = width >= height ? { width: Math.round(width * scale) } : { height: Math.round(height * scale) }

  const context = ImageManipulator.manipulate(uri)
  if (scale < 1) context.resize(size)
  const image = await context.renderAsync()

  for (const compress of QUALITY_STEPS) {
    const result = await image.saveAsync({ compress, format: SaveFormat.JPEG })
    const bytes = await fileSize(result.uri)
    if (bytes <= MAX_UPLOAD_BYTES) {
      return { uri: result.uri, width: result.width, height: result.height, bytes }
    }
  }
  throw new Error('This photo is too large to upload, even after compression.')
}
