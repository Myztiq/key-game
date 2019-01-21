import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {Google} from 'expo';
import { Button } from 'react-native';
import QRScanner from './components/QRScanner'
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
      googleAccessToken: null
  }

  signInWithGoogleAsync = async () => {
    try {
      const result = await Google.logInAsync({
        androidClientId: secrets.androidClientId,
        iosClientId: secrets.iosClientId,
        scopes: ['profile', 'email'],
      });

      if (result.type === 'success') {
        const loginState = {user: result.user, googleAccessToken: result.accessToken}
        console.log('Setting Login State', loginState)
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
    const newState = {
      scanning: false
    }
    let deckId = null
    if (data.deckUUID) {
      deckId = `${data.deckName}#${data.deckUUID}`
    } else {
      const deckSearchResults = await searchForDeckByName(data.deckName)
      if (deckSearchResults && deckSearchResults.id) {
        console.log('Deck was found!', deckSearchResults)
        deckId = `${deckSearchResults.name}#${deckSearchResults.id}`
      }
    }

    if (deckId) {
      if (this.state.scanning === 'mine') {
        newState.yourDeck = deckId;
      } else {
        newState.opponentsDeck = deckId;
      }
      this.setState(newState)
    } else {
      // TODO: Handle case where we couldn't find deck by name or QR code.
    }
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
      color="#841584"
    />
  }

  renderOpponentsDeck = () => {
    if (this.state.opponentsDeck) {
      return <Text>Opponents Deck: {this.state.opponentsDeck}</Text>
    }
    return <Button
      onPress={this.scanOpponentsDeck}
      title="Scan Opponents Deck"
      color="#841584"
    />
  }

  render() {
    if (!this.state.user || !this.state.googleAccessToken) {
      return (
        <View style={styles.container}>
          <Login signIn={this.signInWithGoogleAsync} />
        </View>
      )
    }

    if (this.state.scanning) {
      return <DeckScanner
        apiClient={new ApiClient({userEmail: this.state.user.email, googleAccessToken: this.state.googleAccessToken})}
        onRead={this.scanComplete}
      />
    }

    return (
      <View style={styles.container}>
        {this.renderYourDeck()}
        {this.renderOpponentsDeck()}
        {this.state.opponentsDeck && this.state.yourDeck &&
          <View>
            <Button
              onPress={this.pickWinner('me')}
              title="I Won"
              color="#841584"
            />
            <Button
              onPress={this.pickWinner('them')}
              title="I Lost"
              color="#841584"
            />
          </View>
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
