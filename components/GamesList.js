import React from 'react'
import { ListView, View, Text } from 'react-native'

export default (props) => <View>{props.games.map(game => <GameView key={game.id} game={game}/>)}</View>

const GameView = ({game}) => {
  return (
    <View style={{marginBottom: 20}}>
      <Text style={{ color: game.win ? 'red' : 'green' }}>{game.win ? 'WIN' : 'LOSS'}</Text>
      <Text>Your Deck {game.deck_uuid}</Text>
      <Text>Their Deck {game.opponent_deck_uuid}</Text>
    </View>
  )
}