import secrets from '../.secrets'

const apiBaseUrl = secrets.apiBaseUrl

export default class ApiClient {
  login = async ({ userEmail, googleIdToken }) => {
    this.userEmail = userEmail
    this.googleIdToken = googleIdToken

    const resp = await this.post('login', {
      email: userEmail,
      googleIdToken: googleIdToken,
    })

    this.authToken = await resp.json().token
  }

  logout = () => this.post('logout', {
    email: this.userEmail
  })

  get = (route) => {
    return fetch(`${apiBaseUrl}/${route}`, {
      method: 'get',
      headers: {
        'X-AUTH-TOKEN': this.authToken,
        'Content-Type': 'application/json'
      }
    })
  }

  post = (route, body) => {
    return fetch(`${apiBaseUrl}/${route}`, {
      method: 'post',
      body: JSON.stringify(body),
      headers: {
        'X-AUTH-TOKEN': this.authToken,
        'Content-Type': 'application/json'
      }
    })
  }
}
