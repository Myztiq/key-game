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
        console.log('Setting Login State', result)
        this.setState(loginState)
      } else {
        console.log("sign in cancelled")
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

  scanComplete = async (data) => {
    console.log('Scan complete', data)
    if (!data) {
      this.setState({
        scanning: false
      })
      return
    }
    const {
      deckName,
      deckQRCode,
      deckUUID
    } = data;
    const newState = {
      scanning: false
    }

    let deckId = null
    if (deckUUID) {
      deckId = `${deckName}#${deckUUID}`
    } else {
      const deckSearchResults = await searchForDeckByName(deckName)
      if (deckSearchResults && deckSearchResults.id) {
        console.log('Deck was found!', deckSearchResults)
        deckId = `${deckSearchResults.name}#${deckSearchResults.id}`
        await this.apiClient.post('decks', {
          deck: {
            qr_code: deckQRCode,
            uuid: deckSearchResults.id,
            name: deckSearchResults.name,
          }
        })
      }
    }

    if (deckId) {
      Vibration.vibrate(0.5);
      if (this.state.scanning === 'mine') {
        newState.yourDeck = deckId;
      } else {
        newState.opponentsDeck = deckId;
      }
    } else {
      // TODO: Handle case where we couldn't find deck by name or QR code.
    }

    this.setState(newState)
  }

  pickWinner = (winner) => {
    return () => {
      console.log('WINNER!', winner)
      this.setState({
        yourDeck: false,
        opponentsDeck: false,
      })
    }
  }

  renderYourDeck = () => {
    if (this.state.yourDeck) {
      return <Text>Your Deck: {this.state.yourDeck}</Text>
    }
    return <Button
      onPress={this.scanYourDeck}
      title="Scan Your Deck"
      style={styles.selection}
    />
  }

  renderOpponentsDeck = () => {
    if (this.state.opponentsDeck) {
      return <Text>Opponents Deck: {this.state.opponentsDeck}</Text>
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
        key={Math.random()}
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
              onPress={this.pickWinner('me')}
              title="I Won"
              style={styles.selection}
            />
            <Button
              onPress={this.pickWinner('them')}
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
