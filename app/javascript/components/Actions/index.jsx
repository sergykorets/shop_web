import React, {Fragment} from 'react';
import { Modal, ModalHeader, FormGroup, Label, Input, ButtonToggle } from 'reactstrap';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import AirBnbPicker from '../common/AirBnbPicker';
import moment from "moment";

export default class Products extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      actions: this.props.actions,
      openedModal: '',
      selectedAction: '',
      date: moment().format('DD.MM.YYYY'),
      sort: {
        field: '',
        descending: true
      },
      actionModal: {
        id: '',
        amount: '',
        products: []
      },
      productSearch: {
        barcode: '',
        name: '',
        category_id: ''
      }
    };
  }

  handleModal = (modal, index) => {
    this.setState({
      ...this.state,
      openedModal: modal,
      selectedAction: index
    })
  };

  cancelAction = (id) => {
    if (window.confirm("Відмінити транзацію?")) {
      $.ajax({
        url: `/actions/${id}.json`,
        type: 'DELETE'
      }).then((resp) => {
        if (resp.success) {
          this.setState({
            ...this.state,
            actions: resp.actions
          });
          NotificationManager.success('Транзакцію скасовано');
        } else {
          NotificationManager.error(resp.error, 'Неможливо зробити дію');
        }
      });
    }
  };

  isToday = () => {
    return moment().isSame(moment(this.state.date, 'DD.MM.YYYY'), 'day')
  };

  handleDateChange = ({date}) => {
    $.ajax({
      url: '/actions.json',
      type: 'GET',
      data: {
        date: date.format('DD.MM.YYYY')
      },
      success: (resp) => {
        this.setState({
          ...this.state,
          actions: resp.actions,
          date: date ? date.format('DD.MM.YYYY') : null
        });
      }
    });
  };

  summary = () => {
    let sumArray = [];
    this.state.actions.map((action, index) => {
      return sumArray.push(parseFloat(action.amount))
    });
    return (sumArray.reduce((a, b) => a + b, 0)).toFixed(2)
  };

  productSum = (index) => {
    const product = this.state.actions[this.state.selectedAction].products[index];
    return (parseFloat(product.sell_price) * parseFloat(product.quantity)).toFixed(2)
  };

  render() {
    console.log(this.state)
    return (
      <div className='container page-content' style={{color: 'black'}}>
        <NotificationContainer/>
        <div className='date-header'>
          <h1>Транзакції</h1>
          <AirBnbPicker
            single={true}
            pastDates={true}
            onPickerApply={this.handleDateChange}
            date={this.state.date}
          />
        </div>
        <table className='dark' style={{marginTop: 20 + 'px'}}>
          <thead>
          <tr>
            <th><h1>Номер</h1></th>
            <th style={{cursor: 'pointer'}} onClick={() => this.onSort('buy_price')}><h1>Сума</h1></th>
            <th><h1>Дата</h1></th>
            <th><h1>Дії</h1></th>
          </tr>
          </thead>
          <tbody>
          { this.state.actions.map((action, i) => {
            return (
              <tr key={i}>
                <td>{this.state.actions.length - i}</td>
                <td>{action.amount}<span className='uah'>₴</span></td>
                <td>{action.created_at}</td>
                <td>
                  <ButtonToggle color="primary" size="sm" onClick={() => this.handleModal('actionModal', i)}>Деталі</ButtonToggle>
                  { this.isToday() &&
                    <Fragment>
                      <ButtonToggle color="warning" size="sm"
                                    onClick={() => location.href = `/actions/${action.id}/edit`}>Змінити</ButtonToggle>
                      <ButtonToggle color="danger" size="sm" onClick={() => this.cancelAction(action.id)}>Скасувати</ButtonToggle>
                    </Fragment>}
                </td>
              </tr>
            )
          })}
          </tbody>
        </table>
        <h1>Всього: {this.summary()}<span className='uah'>₴</span></h1>
        <br/>

        { (this.state.openedModal === 'actionModal') &&
          <Modal isOpen={this.state.openedModal === 'actionModal'} toggle={() => this.handleModal('')} size="lg" className='show-action-details'>
            <div className='container'>
              <ModalHeader>Деталі продажу</ModalHeader>
              <table className='dark' style={{marginTop: 20 + 'px'}}>
                <thead>
                <tr>
                  <th><h1>Баркод</h1></th>
                  <th><h1>Назва</h1></th>
                  <th><h1>Група</h1></th>
                  <th><h1>Ціна</h1></th>
                  <th><h1>Кількість</h1></th>
                  <th><h1>Сума</h1></th>
                </tr>
                </thead>
                <tbody>
                { this.state.actions[this.state.selectedAction].products.map((product, i) => {
                  return (
                    <tr key={i}>
                      <td>{product.barcode}</td>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                      <td>{product.sell_price}<span className='uah'>₴</span></td>
                      <td>{product.quantity}</td>
                      <td>{this.productSum(i)}<span className='uah'>₴</span></td>
                    </tr>
                  )
                })}
                </tbody>
              </table>
              <h1>Всього: {this.state.actions[this.state.selectedAction].amount}<span className='uah'>₴</span></h1>
              <FormGroup>
                <ButtonToggle color="secondary" onClick={() => this.handleModal('')}>Закрити</ButtonToggle>
              </FormGroup>
            </div>
          </Modal>}
      </div>
    );
  }
}
