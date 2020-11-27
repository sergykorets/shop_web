import React, {Fragment} from 'react';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import { FormGroup, ButtonToggle } from 'reactstrap';

export default class SystemButtons extends React.Component {
  constructor(props) {
    super(props);
  }

  sendRequest = (url) => {
    NotificationManager.error("Будь ласка зачекайте декілька секунд", "Операція в процесі");
    $.ajax({
      url: `/${url}.json`,
      type: 'GET',
      success: (resp) => {
        if (resp.success) {
          NotificationManager.success("Не забудьте правильно вилучити флешку", 'Базу скопійовано');
        } else {
          NotificationManager.error(resp.error, "Неможливо зробити дію");
        }
      }
    });
  };

  render() {
    return (
      <div className='system-buttons'>
        <NotificationContainer/>
        <FormGroup>
          <ButtonToggle color="warning" onClick={() => this.sendRequest('copy_db')}>Записати дані на флешку</ButtonToggle>
          <ButtonToggle color="success" onClick={() => this.sendRequest('update_db')}>
            Скопіювати дані з флешки
          </ButtonToggle>
        </FormGroup>
      </div>
    )
  }
}