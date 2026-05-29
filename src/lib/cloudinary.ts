import Constants from 'expo-constants'

const cloudName = Constants.expoConfig?.extra?.cloudinaryCloudName as string
const uploadPreset = Constants.expoConfig?.extra?.cloudinaryUploadPreset as string

export async function uploadPhoto(uri: string): Promise<string> {
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
