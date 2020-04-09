import React, { Component, Fragment } from 'react';
import Dropzone from 'react-dropzone'

import add_file from './add_file.svg';

export default class FileDrop extends Component {
  constructor(...args) {
    super(...args);
    this.state = {
      file: []
    }
  }

  render() {
    return (
      <Dropzone
        onDrop={(file) => {
          this.props.onDrop(this.props.name, file);
        }}
        className='dropzone'
        activeClassName='active'
        accept={this.props.acceptedFiles}
        rejectClassName='rejected'
        maxSize={this.props.maxSize}
        onDropAccepted={this.props.onDropAccepted}
        disabled={this.props.newFile && !this.props.uploadFinished}>
        <div className='file-drop'>
          <img src={add_file}/>
          <span className='filename'>{this.props.placeholder || 'Додати фото'}</span>
        </div>
      </Dropzone>
    );
  }
}