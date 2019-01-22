import React from 'react';
import { StyleSheet, Text, View, Vibration } from 'react-native';
import {Google, SecureStore} from 'expo';
import { Button } from 'react-native';
import DeckScanner from './components/DeckScanner'
import searchForDeckByName from './lib/searchForDeckByName'
import Login from './components/Login'

import secrets from './.secrets'
import ApiClient from './lib/ApiClient'

export default class App extends React.Component {
  state = {
      scanning: false,
      yourDeck: false,
      opponentsDeck: false,

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

  scanYourDeck = () => {
    this.setState({
      scanning: 'mine',
    })
  }

  scanOpponentsDeck = () => {
    this.setState({
      scanning: 'opponent',
    })
  }

  scanComplete = async (deck) => {
    Vibration.vibrate(0.5)

    const newState = { scanning: false }

    if (deck) {
      const deckOwner = this.state.scanning === 'mine' ? 'yourDeck' : 'opponentsDeck'
      newState[deckOwner] = deck
    }

    this.setState(newState)
  }

  registerGame = (isWin) => {
    const body = {
      game: {
        deck_uuid: this.state.yourDeck.uuid,
        opponent_deck_uuid: this.state.opponentsDeck.uuid,
        win: isWin
      }
    }
    console.log('payload', body, this.state)
    this.apiClient.post('games', body)

    this.clearDeckStates()
  }

  clearDeckStates = () => {
    this.setState({
      scanning: false,
      yourDeck: false,
      opponentsDeck: false,
    })
  }

  renderYourDeck = () => {
    if (this.state.yourDeck) {
      return (
        <View>
          <Text style={{fontSize: 18}}>Your Deck:</Text>
          <Text style={{fontSize: 14}}>{this.state.yourDeck.name}</Text>
          <Text style={{fontSize: 14}}>{this.state.yourDeck.uuid}</Text>
          <Text style={{fontSize: 14}}>{this.state.yourDeck.qrCode}</Text>
        </View>
      )
    }
    return <Button
      onPress={this.scanYourDeck}
      title="Scan Your Deck"
      style={styles.selection}
    />
  }

  renderOpponentsDeck = () => {
    if (this.state.opponentsDeck) {
      return (
        <View>
          <Text style={{fontSize: 18}}>Opponents Deck:</Text>
          <Text style={{fontSize: 14}}>{this.state.opponentsDeck.name}</Text>
          <Text style={{fontSize: 14}}>{this.state.opponentsDeck.uuid}</Text>
          <Text style={{fontSize: 14}}>{this.state.opponentsDeck.qrCode}</Text>
        </View>
      )
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

    if (this.state.scanning) {
      return <DeckScanner
        apiClient={this.apiClient}
        onRead={this.scanComplete}
      />
    }

    return (
      <View style={styles.container}>
        <View style={styles.panel}>
          {this.renderYourDeck()}
          {this.renderOpponentsDeck()}
        </View>
        {this.state.opponentsDeck && this.state.yourDeck &&
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
        <Button
          // style={{flex: 1}}
          onPress={this.logout}
          title="LOG OUT"
          color="red"
        />
      </View>
    );
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
