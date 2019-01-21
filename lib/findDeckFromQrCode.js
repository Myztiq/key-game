import secrets from '../.secrets'

const apiBaseUrl = secrets.apiBaseUrl

export default async (qrCode) => {
  const response = await fetch(`${apiBaseUrl}/decks/${qrCode}`)
  if (response.status !== 404) {
    return await response.json()
  }
}
