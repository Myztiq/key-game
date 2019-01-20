import React from 'react';
import { TouchableOpacity, Text, View, Image, Vibration } from 'react-native';

import { Camera, Permissions, FileSystem, ImageManipulator } from 'expo'
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


        const newPhoto = await ImageManipulator.manipulateAsync(photo.uri, [{resize: {width: 500}}], {
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
        console.log(data)

        if (data.ParsedResults.length) {
          this.props.onRead({
            deckName: data.ParsedResults[0].ParsedText.trim()
          })
        } else {
          // Reset couldn't read!
          this.setState({
            hasTakenPhoto: false,
            photo: null
          })
        }

        Vibration.vibrate(0.5);
      } catch (e) {
        console.log('ERR', e)
      }
    }
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
      return <Image source={{uri: this.state.photo}}  style={{width: 200, height: 300}} />
    }

    return (
      <View style={{ flex: 1 }}>
        <Camera onClick={this.takePicture} ref={ref => { this.camera = ref; }} style={{ flex: 1 }} type={Camera.Constants.Type.back}>
          <TouchableOpacity
            style={{
              flex: 0.1,
              alignItems: 'center',
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              opacity: 0.3
            }}
            onPress={this.takePicture}>
            <Text style={{ fontSize: 18, marginBottom: 10, color: 'white' }}>
              Touch to take picture
            </Text>
          </TouchableOpacity>
        </Camera>
      </View>
    );
  }
}
