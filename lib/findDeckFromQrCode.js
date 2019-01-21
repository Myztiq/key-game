const apiBaseUrl = 'http://[your machines ip]:3000'

export default async (qrCode) => {
  const response = await fetch(`${apiBaseUrl}/decks/${qrCode}`)
  if (response.status !== 404) {
    return await response.json()
  }
}
