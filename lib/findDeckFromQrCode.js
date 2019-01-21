export default async (apiClient, qrCode) => {
  const response = await apiClient.get(`decks/${qrCode}`)
  if (response.status !== 404) {
    return await response.json()
  }
}
