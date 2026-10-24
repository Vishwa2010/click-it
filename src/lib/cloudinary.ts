import Constants from 'expo-constants'

const cloudName = (Constants.expoConfig?.extra?.cloudinaryCloudName as string | undefined) || ''
const uploadPreset = (Constants.expoConfig?.extra?.cloudinaryUploadPreset as string | undefined) || ''

export const isCloudinaryConfigured = Boolean(cloudName && uploadPreset)

// Uploads a local JPEG (already compressed and EXIF-free — see lib/photo.ts) via an unsigned preset
export async function uploadPhoto(uri: string): Promise<string> {
  if (!isCloudinaryConfigured) {
    throw new Error('Photo uploads are not set up yet (missing Cloudinary keys).')
  }

  const formData = new FormData()
  formData.append('file', { uri, type: 'image/jpeg', name: 'photo.jpg' } as unknown as Blob)
  formData.append('upload_preset', uploadPreset)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!response.ok) {
    throw new Error('Failed to upload photo to Cloudinary')
  }

  const data = (await response.json()) as { secure_url: string }
  return data.secure_url
}
