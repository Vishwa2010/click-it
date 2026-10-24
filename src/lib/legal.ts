import { Linking } from 'react-native'

// Hosted on GitHub Pages alongside the support and password-reset pages
const BASE = 'https://vishwa2010.github.io/click-it'
export const PRIVACY_URL = `${BASE}/privacy.html`
export const TERMS_URL = `${BASE}/terms.html`

export function openLegal(url: string): void {
  Linking.openURL(url).catch(() => {})
}
