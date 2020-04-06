import React, {Fragment} from 'react';
import {ActionCable, ActionCableProvider} from 'react-actioncable-provider';
import { Modal, ModalHeader, FormGroup, Label, Input, ButtonToggle } from 'reactstrap';
import {NotificationContainer, NotificationManager} from 'react-notifications';

export default class SellPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      barcodes: {},
      products: {},
      showSuccess: false,
      categories: this.props.categories,
      productSearchModal: {
        barcode: '',
        name: '',
        quantity: 1,
        category_id: this.props.categories[0].id,
        sell_price: ''
      },
      openedModal: '',
      income_amount: '',
      change: '',
      transactionAmount: ''
    };
  }

  handleReceivedBarcode = (response) => {
    if (response.product) {
      this.setState({
        ...this.state,
        barcodes: {
          ...this.state.barcodes,
          [response.product.id]: Object.assign(response.product, {quantity_sell: 1})
        }
      });
    } else {
      NotificationManager.error('Продукт не знайдено', 'Баркод невідомий');
    }
  };

  handleModal = (modal) => {
    this.setState({
      ...this.state,
      openedModal: modal
    })
  };

  handleInputChange = (type, field, value) => {
    this.setState({
      ...this.state,
      barcodes: {
        ...this.state.barcodes,
        [field]: {
          ...this.state.barcodes[field],
          [type]: value
        }
      }
    })
  };

  handleFieldChange = (field, value) => {
    this.setState({ ...this.state, [field]: value })
  };

  cancelBarcode = (barcode) => {
    let barcodes = this.state.barcodes;
    delete barcodes[barcode];
    this.setState({
      ...this.state,
      barcodes: barcodes
    })
  };

  floorFloat = (value) => {
    return (Math.floor(value * 100) / 100);
  };

  summary = () => {
    let sumArray = [];
    Object.values(this.state.barcodes).map((product, index) => {
      return sumArray.push(parseFloat(product.sell_price) * parseFloat(product.quantity_sell))
    });
    return this.floorFloat(sumArray.reduce((a, b) => a + b, 0))
  };

  productSum = (product_id) => {
    const product = this.state.barcodes[product_id];
    return this.floorFloat(parseFloat(product.sell_price) * parseFloat(product.quantity_sell))
  };

  handleProductSearch = (field, v) => {
    if (v.length > 0 || this.state.productSearchModal.name.length > 0 || this.state.productSearchModal.barcode.length > 0) {
      let parameters = {};
      if (field === 'barcode') {
        parameters[field] = v;
        parameters['name'] = this.state.productSearchModal.name
      } else {
        parameters[field] = v;
        parameters['barcode'] = this.state.productSearchModal.barcode
      }
      $.ajax({
        url: '/products/search.json',
        type: 'POST',
        data: parameters,
        success: (resp) => {
          if (resp.success) {
            this.setState({
              ...this.state,
              products: resp.products,
              productSearchModal: {
                ...this.state.productSearchModal,
                [field]: v
              }
            });
          } else {
            this.setState({
              ...this.state,
              products: {},
              productSearchModal: {
                ...this.state.productSearchModal,
                [field]: v
              }
            });
            NotificationManager.error(resp.error, "Неможливо зробити дію");
          }
        }
      });
    } else {
      this.setState({
        ...this.state,
        productSearchModal: {
          ...this.state.productSearchModal,
          [field]: v
        },
      });
    }
  };

  addProduct = (id) => {
    this.setState({
      ...this.state,
      barcodes: {
        ...this.state.barcodes,
        [id]: Object.assign(this.state.products[id], {quantity_sell: 1})
      }
    })
  };

  restrictAdding = (id) => {
    return Object.keys(this.state.barcodes).some(item => id.toString() === item)
  };

  submitSell = () => {
    let products = [];
    Object.values(this.state.barcodes).map((product, index) => {
      return (products.push({ id: product.id, quantity: product.quantity_sell }))
    });
    $.ajax({
      url: '/actions.json',
      type: 'POST',
      data: {
        transaction: {
          products: products
        }
      },
      success: (resp) => {
        if (resp.success) {
          this.setState({
            ...this.state,
            showSuccess: true,
            barcodes: {},
            transactionAmount: resp.amount
          });
          NotificationManager.success('Транзакція успішна');
        } else {
          NotificationManager.error(resp.error, "Неможливо зробити дію");
        }
      }
    });
  };

  render() {
    console.log(this.state)
    return (
      <ActionCableProvider url={`ws://${location.host}/cable`}>
        <NotificationContainer/>
        <ActionCable
          channel='BarcodesChannel'
          onReceived={(data) => this.handleReceivedBarcode(data)}
        />
        { this.state.showSuccess ?
          <div className='container text-center' style={{marginTop: 6+'rem'}}>
            <h1>Транзакція успішна</h1>
            <h2>Сума продажу: {this.state.transactionAmount} грн</h2>
            <ButtonToggle style={{marginBottom: 6+'rem'}} size='lg' color="primary" onClick={() => location.reload()}>Зробити нову продажу</ButtonToggle>
          </div>
          :
          <div className='container' style={{marginTop: 100+'px', color: 'black'}}>
            <h1>Відскановані баркоди</h1>
            <br/>
            <ButtonToggle color="primary" onClick={() => this.handleModal('productSearchModal')}>Шукати продукт</ButtonToggle>
            <table className='dark' style={{marginTop: 20 + 'px'}}>
              <thead>
              <tr>
                <th><h1>Баркод</h1></th>
                <th><h1>Назва</h1></th>
                <th><h1>Група</h1></th>
                <th><h1>Залишок</h1></th>
                <th><h1>Ціна</h1></th>
                <th><h1>Кількість</h1></th>
                <th><h1>Сума</h1></th>
                <th><h1>Дії</h1></th>
              </tr>
              </thead>
              <tbody>
              { Object.keys(this.state.barcodes).map((barcode, i) => {
                return (
                  <tr key={i}>
                    <td>{this.state.barcodes[barcode].barcode}</td>
                    <td>{this.state.barcodes[barcode].name}</td>
                    <td>{this.state.barcodes[barcode].category && this.state.barcodes[barcode].category.name}</td>
                    <td>{this.state.barcodes[barcode].quantity}</td>
                    <td>{this.state.barcodes[barcode].sell_price} грн</td>
                    <td>
                      <Input type='number' id={`quantity_${i}`}
                             value={this.state.barcodes[barcode].quantity_sell}
                             onChange={(e) => this.handleInputChange('quantity_sell', barcode, e.target.value)}
                             className='quantity-sell'
                             min={0}
                             max={this.state.barcodes[barcode].quantity}
                      />
                    </td>
                    <td>{this.productSum(barcode)} грн</td>
                    <td>
                      <ButtonToggle color="danger" size="sm" onClick={() => this.cancelBarcode(barcode)}>Видалити</ButtonToggle>
                    </td>
                  </tr>
                )
              })}
              </tbody>
            </table>
            <hr/>
            { Object.keys(this.state.barcodes).length > 0 &&
              <Fragment>
                <h1>Всього: {this.summary()} грн</h1>
                <FormGroup>
                  <Label for='income_amount'>Готівка</Label>
                  <Input type='text' id='income_amount' value={this.state.income_amount}
                         onChange={(e) => this.handleFieldChange('income_amount', e.target.value)}/>
                </FormGroup>
                { this.state.income_amount > this.summary() &&
                  <h1>Решта: {this.floorFloat(this.state.income_amount - this.summary())} грн</h1>}
              </Fragment>}
            <hr/>
            <ButtonToggle size='lg' color="success" disabled={Object.keys(this.state.barcodes).length < 1} onClick={() => this.submitSell()}>Продати</ButtonToggle>
            <hr/>
            { (this.state.openedModal === 'productSearchModal') &&
              <Modal isOpen={this.state.openedModal === 'productSearchModal'} toggle={() => this.handleModal('')} size="lg">
                <div className='container'>
                  <ModalHeader>Пошук продукту</ModalHeader>
                  <div className='row'>
                    <div className='col-6'>
                      <FormGroup>
                        <Label for='barcode'>Баркод</Label>
                        <Input type='search' id='barcode' value={this.state[this.state.openedModal].barcode}
                               onChange={(e) => this.handleProductSearch('barcode', e.target.value)}/>
                        <ButtonToggle size='sm' color="primary" style={{marginTop: 20+'px'}}
                                      onClick={() => this.handleProductSearch('barcode', '482')}>
                          Україна
                        </ButtonToggle>
                      </FormGroup>
                    </div>
                    <div className='col-6'>
                      <FormGroup>
                        <Label for='name'>Назва продукту</Label>
                        <Input type='search' id='name' value={this.state[this.state.openedModal].name}
                               onChange={(e) => this.handleProductSearch('name', e.target.value)}/>
                      </FormGroup>
                    </div>
                    <div className='col-12'>
                      <div className='found-products'>
                        {Object.values(this.state.products).map((product, index) => {
                          return (
                            <div className='found-product' key={index}>
                              <div className='found-product-info'>
                                <span>{product.barcode}</span>
                                <span>{product.category.name}</span>
                                <span>{product.name}</span>
                              </div>
                              <ButtonToggle size='sm' color="success" disabled={this.restrictAdding(product.id)} onClick={() => this.addProduct(product.id)}>Додати</ButtonToggle>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  <FormGroup>
                    <ButtonToggle color="secondary" onClick={() => this.handleModal('')}>Закрити</ButtonToggle>
                  </FormGroup>
                </div>
              </Modal>}
          </div>}
      </ActionCableProvider>
    );
  }
}
