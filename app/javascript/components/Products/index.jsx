import React, {Fragment} from 'react';
import {ActionCable, ActionCableProvider} from 'react-actioncable-provider';

export default class Products extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      barcodes: []
    };
  }

  handleReceivedConversation = (response) => {
    this.setState(prevState => ({
      barcodes: [...prevState.barcodes, response.message]
    }));
  };

  render() {
    console.log(React.version);
    return (
      <ActionCableProvider url='ws://192.168.0.104:3000/cable'>
        <ActionCable
          channel='BarcodesChannel'
          onReceived={(data) => this.handleReceivedConversation(data)}
        />
        <div className='container' style={{marginTop: 100+'px', color: 'black'}}>
          { this.state.barcodes.map((barcode, i) => {
            return (<h1 key={i}>{barcode}</h1>
            )
          })}
        </div>
      </ActionCableProvider>
    );
  }
}
