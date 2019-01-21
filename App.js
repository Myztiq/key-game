import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native';
import QRScanner from './components/QRScanner'
import DeckScanner from './components/DeckScanner'
import searchForDeckByName from './lib/searchForDeckByName'

export default class App extends React.Component {
  constructor () {
    super();
    this.state = {
      scanning: false,
      yourDeck: false,
      opponentsDeck: false,
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

    const deckSearchResults = await searchForDeckByName(data.deckName)

    if (deckSearchResults && deckSearchResults.id) {
      console.log('Deck was found!', deckSearchResults)
      const deckId = `${deckSearchResults.name}#${deckSearchResults.id}`
      if (this.state.scanning === 'mine') {
        newState.yourDeck = deckId;
      } else {
        newState.opponentsDeck = deckId;
      }
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
    if (this.state.scanning) {
      return <DeckScanner
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
