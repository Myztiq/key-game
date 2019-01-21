export default class ApiClient {
  constructor ({ userEmail, googleAccessToken }) {
    this.userEmail = userEmail
    this.googleAccessToken = googleAccessToken

  }

  get = (url) => {
    console.log('fetching', this.userEmail, this.googleAccessToken)
    return fetch(url, {
      method: 'get',
      headers: {
        'X-USER-EMAIL': this.userEmail,
        'X-GOOGLE-ACCESS-TOKEN': this.googleAccessToken,
        'Content-Type': 'application/json'
      }
    })
  }
}