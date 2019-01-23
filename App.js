import React from 'react'
import { Button, StyleSheet, Vibration, View } from 'react-native'
import { Google, SecureStore } from 'expo'
import DeckScanner from './components/DeckScanner'

import Login from './components/Login'

import secrets from './.secrets'
import ApiClient from './lib/ApiClient'
import DeckSummary from './components/DeckSummary'
import GamesList from './components/GamesList'

const Views = {
  MAIN: 'MAIN',
  DECK_SCANNER: 'DECK_SCANNER',
  REGISTER_GAME: 'REGISTER_GAME',
}

const DeckOwnership = {
  OWN: 'OWN_DECK',
  OPPONENT: 'OPPONENT_DECK',
}

export default class App extends React.Component {
  state = {
    deckBeingScanned: false,
    [DeckOwnership.OPPONENT]: false,
    [DeckOwnership.OWN]: false,

    currentView: Views.MAIN,

    games: null,
    decks: null,

    user: null,
    googleIdToken: null
  }

  apiClient = new ApiClient

  async componentDidUpdate (prevProps, prevState, snapshot) {
    if (this.state.user !== prevState.user && this.state.googleIdToken !== prevState.googleIdToken) {
      if (this.state.user && this.state.googleIdToken) {
        await SecureStore.setItemAsync('googleIdToken', this.state.googleIdToken);
        await SecureStore.setItemAsync('user', JSON.stringify(this.state.user));
        this.apiClient.login({ userEmail: this.state.user.email, googleIdToken: this.state.googleIdToken })
          .then(this.fetchAdditionalUserData)

      } else {
        await SecureStore.deleteItemAsync('googleIdToken');
        await SecureStore.deleteItemAsync('user');
      }
    }
  }

  async componentDidMount () {
    const googleIdToken = await SecureStore.getItemAsync('googleIdToken')
    const user = await SecureStore.getItemAsync('user')
    if (googleIdToken && user) {
      this.setState({
        googleIdToken,
        user: JSON.parse(user)
      })
    }
  }

  signInWithGoogleAsync = async () => {
    try {
      const result = await Google.logInAsync({
        androidClientId: secrets.androidClientId,
        iosClientId: secrets.iosClientId,
        scopes: ['profile', 'email'],
      });


      if (result.type === 'success') {
        const loginState = {user: result.user, googleIdToken: result.idToken}
        this.setState(loginState)
      } else {
        console.error("sign in cancelled")
      }
    } catch(e) {
      console.error('sign in failed', e)
    }
  }

  fetchAdditionalUserData = async () => {
    const resp = await this.apiClient.get('games')
    const body = await resp.json()
    console.log('Additional Data', body)
    this.setState({
      games: body.games,
      decks: body.decks,
    })
  }

  scanYourDeck = () => {
    this.setState({
      deckBeingScanned: DeckOwnership.OWN,
      currentView: Views.DECK_SCANNER
    })
  }

  scanOpponentsDeck = () => {
    this.setState({
      deckBeingScanned: DeckOwnership.OPPONENT,
      currentView: Views.DECK_SCANNER
    })
  }

  scanComplete = async (deck) => {
    Vibration.vibrate(0.5)

    const newState = {
      deckBeingScanned: false,
      currentView: Views.REGISTER_GAME
    }

    if (deck) {
      newState[this.state.deckBeingScanned] = deck
    }

    this.setState(newState)
  }

  registerGame = (isWin) => {
    const body = {
      game: {
        deck_uuid: this.state[DeckOwnership.OWN].uuid,
        opponent_deck_uuid: this.state[DeckOwnership.OPPONENT].uuid,
        win: isWin
      }
    }
    console.log('payload', body, this.state)
    this.apiClient.post('games', body)

    this.clearDeckStates()
  }

  clearDeckStates = () => {
    this.setState({
      currentView: Views.MAIN,
      deckBeingScanned: false,
      [DeckOwnership.OWN]: false,
      [DeckOwnership.OPPONENT]: false,
    })
  }

  renderYourDeck = () => {
    if (this.state[DeckOwnership.OWN]) {
      return <DeckSummary title='Your Deck' deck={this.state[DeckOwnership.OWN]}/>
    }

    return <Button
      onPress={this.scanYourDeck}
      title="Scan Your Deck"
      style={styles.selection}
    />
  }

  renderOpponentsDeck = () => {
    if (this.state[DeckOwnership.OPPONENT]) {
      return <DeckSummary title='Opponents Deck' deck={this.state[DeckOwnership.OPPONENT]}/>
    }
    return <Button
      onPress={this.scanOpponentsDeck}
      title="Scan Opponents Deck"
      style={styles.selection}
    />
  }

  logout = () => {
    this.apiClient.logout()
    this.setState({user: null, googleIdToken: null})
  }

  render() {
    if (!this.state.user || !this.state.googleIdToken) {
      return (
        <View style={styles.container}>
          <Login signIn={this.signInWithGoogleAsync} />
        </View>
      )
    }

    switch (this.state.currentView) {
      case Views.DECK_SCANNER:
        return <DeckScanner
          apiClient={this.apiClient}
          onRead={this.scanComplete}
        />

      case Views.REGISTER_GAME:
        return (
          <View style={styles.container}>
            <View style={styles.panel}>
              {this.renderYourDeck()}
              {this.renderOpponentsDeck()}
            </View>
            {this.state[DeckOwnership.OPPONENT] && this.state[DeckOwnership.OWN] &&
            <View style={styles.panel}>
              <Button
                onPress={() => this.registerGame(true)}
                title="I Won"
                style={styles.selection}
              />
              <Button
                onPress={() => this.registerGame(false)}
                title="I Lost"
                style={styles.selection}
              />
            </View>
            }
            <Button onPress={() => this.setState({currentView: Views.MAIN})} title="< Back" color="red"/>
          </View>
        )

      case Views.MAIN:
      default:
        return (
          <View style={styles.container}>
            <View>
              <Button onPress={() => this.setState({currentView: Views.REGISTER_GAME})} title="Register New Game"/>
              <Button onPress={this.logout} title="LOG OUT" color="red"/>
            </View>

            {this.state.games && this.state.decks ? <GamesList games={this.state.games} decks={this.state.decks}/> : null}
          </View>
        )
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-around',
  },
  panel: {
    flex: 0.5,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  selection: {
    color: '#841584'
  }
});
