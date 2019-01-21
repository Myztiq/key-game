import secrets from '../.secrets'

const apiBaseUrl = secrets.apiBaseUrl

export default async (apiClient, qrCode) => {
  const response = await apiClient.get(`${apiBaseUrl}/decks/${qrCode}`)
  if (response.status !== 404) {
    return await response.json()
  }
}
