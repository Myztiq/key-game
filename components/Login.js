import React from 'react'
import { Button, View } from 'react-native'
export default props => {
  return (
    <View>
      <Button title="Sign in with Google" onPress={() => props.signIn()} />
    </View>
  )
}