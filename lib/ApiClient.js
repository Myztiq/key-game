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
}