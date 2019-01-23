import React from 'react'
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native'

import { Camera, ImageManipulator, Permissions, BarCodeScanner } from 'expo'
import CameraOverlay from './CameraOverlay'
import findDeckFromQrCode from '../lib/findDeckFromQrCode'
import secrets from '../.secrets'
import searchForDeckByName from '../lib/searchForDeckByName'

const BYPASS_OCR = true;

export default class DeckScanner extends React.Component {
  state = {
    hasCameraPermission: null,
    hasTakenPhoto: false,
    photo: null,
    qrCode: null,
    checkingQr: false
  }

  async componentDidMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === 'granted' });
    this.timeout = setTimeout(() => {
      if (!this.state.qrCode) {
        console.log('Unable to scan QR code in 10 seconds.')
        this.props.onRead()
      }
    }, 10000)
  }

  componentWillUnmount() {
    clearTimeout(this.timeout)
  }

  scannedBarcode = async (barcodeObject) => {
    if (this.state.qrCode) { return }

    const qrCode = barcodeObject.data.split('/').pop()

    this.setState({
      qrCode,
      checkingQr: true
    }, async () => {

      // Check if deck by ID already exists
      const deck = await findDeckFromQrCode(this.props.apiClient, qrCode)

      if (deck) {
        this.props.onRead(
          await this.buildCompleteDeckObject({
            method: 'BARCODE', deck: { name: deck.name, uuid: deck.uuid, qrCode: qrCode }
          })
        )
      } else {
        this.setState({
          checkingQr: false
        })
      }
    })
  }

  takePicture = async () => {
    if (!this.camera || !this.state.qrCode) {
      return
    }

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

      let name = 'King of Westworth'
      if (!BYPASS_OCR) {
        const formData = new FormData();
        formData.append('file', {
          uri: newPhoto.uri,
          type: 'png',
          name: 'hello.png'
        })
        formData.append('filetype', 'png')
        formData.append('scale', 'true')
        console.log('Calling OCR parse on image.')
        const response = await fetch('https://api.ocr.space/parse/image', {
          method: 'post',
          headers: {
            apikey: secrets.ocrApiKey
          },
          body: formData
        })
        const data = await response.json()

        name = data.ParsedResults.length && data.ParsedResults[0].ParsedText.split(/\n/)[0].trim()
      }

      if (name) {
        this.setState({name})
        this.props.onRead(
          await this.buildCompleteDeckObject({
            method: 'OCR',
            deck: {
              name,
              qrCode: this.state.qrCode,
            }
          })
        )
      } else {
        this.reset()
      }
    } catch (e) {
      console.log('ERR', e)
    }
  }

  buildCompleteDeckObject = async ({ method, deck }) => {
    switch (method) {
      case 'OCR':
        const deckSearchResults = await searchForDeckByName(deck.name)
        const completedDeck = deckSearchResults && deckSearchResults.id ? { qr_code: deck.qrCode, uuid: deckSearchResults.id, name: deckSearchResults.name } : null
        if (completedDeck) {
          this.props.apiClient.post('decks', completedDeck)
        }
        return completedDeck

      case 'BARCODE':
        return deck

      default:
        return null
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
            {this.state.name ? `Attempting to locate "${this.state.name}" within the Master Vault...` : `Attempting to read deck name...`}
          </Text>

          <View style={{margin: '10%', textAlign: 'center'}}>
            <Text>Deck Title:</Text>

            <Image source={{uri: this.state.photo}} style={{width: '100%', height: 100}} />
            <Text>{this.state.name}</Text>
          </View>
        </View>
      )
    }

    if (!this.state.qrCode || this.state.checkingQr) {
      return <BarCodeScanner
        onBarCodeScanned={this.scannedBarcode}
        style={{flex: 1}}
      >
        <TouchableOpacity
          style={{flex: 1}}
          onPress={this.takePicture}>
          <View style={{flex: 3}}>
            <CameraOverlay/>
          </View>
          {this.state.checkingQr &&
            <Text style={{ fontSize: 30, color: 'white', textAlign: 'center', flex: 1 }}>
              Checking QR Code
            </Text>
          }
          {!this.state.checkingQr &&
            <Text style={{ fontSize: 30, color: 'white', textAlign: 'center', flex: 1 }}>
              Scanning for QR Code
            </Text>
          }
        </TouchableOpacity>
      </BarCodeScanner>
    }

    return (
      <View style={{flex: 1}}>
        <Camera
          ref={ref => { this.camera = ref }}
          style={{flex: 1}}
          type={Camera.Constants.Type.back}
        >
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
