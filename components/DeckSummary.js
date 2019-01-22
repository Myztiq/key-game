import React from 'react'
import { Text, View } from 'react-native'

export default ({title, deck: {name, uuid, qrCode}}) =>
  <View>
    <Text style={{fontSize: 18}}>{title}</Text>
    <Text style={{fontSize: 14}}>{name}</Text>
    <Text style={{fontSize: 14}}>{uuid}</Text>
    <Text style={{fontSize: 14}}>{qrCode}</Text>
  </View>