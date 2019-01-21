export default class ApiClient {
  constructor ({ userEmail, googleIdToken }) {
    this.userEmail = userEmail
    this.googleIdToken = googleIdToken

  }

  get = (url) => {
    console.log('fetching', this.userEmail, this.googleIdToken)
    return fetch(url, {
      method: 'get',
      headers: {
        'X-USER-EMAIL': this.userEmail,
        'X-GOOGLE-ID-TOKEN': this.googleIdToken,
        'Content-Type': 'application/json'
      }
    })
  }

  post = (url, body) => {
    console.log('sending data', url, body)
    return fetch(url, {
      method: 'post',
      body: JSON.stringify(body),
      headers: {
        'X-USER-EMAIL': this.userEmail,
        'X-GOOGLE-ACCESS-TOKEN': this.googleAccessToken,
        'Content-Type': 'application/json'
      }
    })
  }
}
