import React from 'react'
import { TouchableOpacity, Text, View, Image, Vibration, ActivityIndicator } from 'react-native'

import { Camera, Permissions, FileSystem, ImageManipulator } from 'expo'
import CameraOverlay from './CameraOverlay'

const apiKey = 'a0a0ed9cba88957'

export default class DeckScanner extends React.Component {
  state = {
    hasCameraPermission: null,
    hasTakenPhoto: false,
    photo: null
  }

  async componentDidMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === 'granted' });
  }

  takePicture = async () => {
    if (this.camera) {
      if (this.state.hasTakenPhoto) { return }
      this.setState({ hasTakenPhoto: true })

      try {
        let photo = await this.camera.takePictureAsync({
          base64: true,
          quality: 0.1,
        });
        console.log(photo.height, photo.width, photo.uri)

        const newPhoto = await ImageManipulator.manipulateAsync(photo.uri, [
          {crop: {originX: 0, originY: 200, height: 500, width: photo.width}},
          {resize: {width: 400}},
        ], {
          format: 'png',
          base64: true
        })

        this.setState({
          photo: newPhoto.uri
        })

        const formData = new FormData();
        formData.append('file', {
          uri: newPhoto.uri,
          type: 'png',
          name: 'hello.png'
        })
        formData.append('filetype', 'png')
        formData.append('scale', 'true')
        const response = await fetch('https://api.ocr.space/parse/image', {
          method: 'post',
          headers: {
            apikey: apiKey
          },
          body: formData
        })
        const data = await response.json()
        console.log('Got Response')
        console.log('data', data)

        let deckName = data.ParsedResults.length && data.ParsedResults[0].ParsedText.split(/\n/)[0].trim()
        console.log('deckname', deckName)

        if (deckName) {
          this.setState({deckName})
          this.props.onRead({deckName})
        } else {
          this.reset()
        }

        Vibration.vibrate(0.5);
      } catch (e) {
        console.log('ERR', e)
      }
    }
  }

  reset = () => {
    // Reset couldn't read!
    this.setState({
      hasTakenPhoto: false,
      photo: null
    })
  }

  render() {
    const { hasCameraPermission } = this.state;

    if (hasCameraPermission === null) {
      return <Text>Requesting for camera permission</Text>;
    }

    if (hasCameraPermission === false) {
      return <Text>No access to camera</Text>;
    }

    if (this.state.photo) {
      return (
        <View style={{flex: 1, justifyContent: 'center'}}>
          <ActivityIndicator size="large" color="#0000ff"/>
          <Text style={{margin: '10%', fontSize: 30, textAlign: 'center'}}>
            {this.state.deckName ? `Attempting to locate "${this.state.deckName}" within the Master Vault...` : `Attempting to read deck name...`}
          </Text>

          <View style={{margin: '10%', textAlign: 'center'}}>
            <Text>Deck Title:</Text>

            <Image source={{uri: this.state.photo}} style={{width: '100%', height: 100}} />
            <Text>{this.state.deckName}</Text>
          </View>
        </View>
      )
    }

    return (
      <View style={{flex: 1}}>
        <Camera ref={ref => { this.camera = ref }} style={{flex: 1}} type={Camera.Constants.Type.back}>
          <TouchableOpacity
            style={{flex: 1}}
            onPress={this.takePicture}>
            <View style={{flex: 3}}>
              <CameraOverlay/>
            </View>
            <Text style={{fontSize: 30, color: 'white', textAlign: 'center', flex: 1}}>
              Tap to take picture
            </Text>
          </TouchableOpacity>
        </Camera>
      </View>
    );
  }
}
