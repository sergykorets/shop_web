import React, {Fragment} from 'react';
import { ActionCable } from 'react-actioncable-provider';

export default class Barcode extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      barcode: '11111'
    };
  }


  render() {
    return (
      <div className='container'>
        <ActionCable
          channel='BarcodesChannel'
          onReceived={this.props.handleReceivedConversation}
        />
      </div>
    )
  }
}