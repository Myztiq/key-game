import React from 'react'
import { View, Text } from 'react-native'

export default (props) => <View>{props.games.map(game => <GameView key={game.id} game={game} decks={props.decks}/>)}</View>

const findDeck = (decks, uuid) => decks.find(deck => deck.uuid === uuid)

const GameView = ({game, decks}) => {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: game.win ? 'red' : 'green' }}>{game.win ? 'WIN' : 'LOSS'}</Text>
      <Text>Your Deck {findDeck(decks, game.deck_uuid).name}</Text>
      <Text>Their Deck {findDeck(decks, game.opponent_deck_uuid).name}</Text>
    </View>
  )
}