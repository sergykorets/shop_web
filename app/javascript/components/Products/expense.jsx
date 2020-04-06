import React, {Fragment} from 'react';
import {ActionCable, ActionCableProvider} from 'react-actioncable-provider';
import { Modal, ModalHeader, FormGroup, Label, Input, ButtonToggle } from 'reactstrap';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import AirBnbPicker from '../common/AirBnbPicker';

export default class Expense extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      barcodes: {},
      products: this.props.products,
      foundProducts: {},
      openedModal: '',
      productSearchModal: {
        barcode: '',
        name: '',
      },
      productModal: {
        product_action_id: '',
        quantity_expense: ''
      }
    };
  }

  handleReceivedBarcode = (response) => {
    if (Object.values(this.state.products).some(item => response.message === item.barcode)) {
      NotificationManager.error('Списаний продукт знаходить у верхній таблиці', 'Баркод вже відскановано');
    } else {
      if (response.product) {
        this.setState({
          ...this.state,
          barcodes: {
            ...this.state.barcodes,
            [response.product.id]: Object.assign(response.product, {quantity_expense: 1})
          }
        });
      } else {
        NotificationManager.error('Продукт не знайдено');
      }
    }
  };

  handleModal = (modal) => {
    this.setState({
      ...this.state,
      openedModal: modal
    })
  };

  cancelBarcode = (barcode) => {
    let barcodes = this.state.barcodes;
    delete barcodes[barcode];
    this.setState({
      ...this.state,
      barcodes: barcodes
    })
  };

  handleInputChange = (field, id, value) => {
    this.setState({
      ...this.state,
      barcodes: {
        ...this.state.barcodes,
        [id]: {
          ...this.state.barcodes[id],
          [field]: value
        }
      }
    })
  };

  floorFloat = (value) => {
    return (Math.floor(value * 100) / 100);
  };

  summary = () => {
    let sumArray = [];
    Object.values(this.state.products).map((product, index) => {
      return sumArray.push(parseFloat(product.sell_price) * parseFloat(product.quantity_expense))
    });
    return this.floorFloat(sumArray.reduce((a, b) => a + b, 0))
  };

  productSum = (product_id) => {
    const product = this.state.products[product_id];
    return this.floorFloat(parseFloat(product.sell_price) * parseFloat(product.quantity_expense))
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
              foundProducts: resp.products,
              productSearchModal: {
                ...this.state.productSearchModal,
                [field]: v
              }
            });
          } else {
            this.setState({
              ...this.state,
              foundProducts: {},
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
        [id]: Object.assign(this.state.foundProducts[id], {quantity_expense: 1})
      }
    })
  };

  restrictAdding = (id) => {
    return Object.keys(this.state.barcodes).some(item => id.toString() === item) ||
      Object.values(this.state.products).some(item => id.toString() === item.id.toString())
  };

  editExpense = (product_action_id) => {
    this.setState({
      ...this.state,
      openedModal: 'productModal',
      productModal: this.state.products[product_action_id]
    })
  };

  handleQuantityExpenseChange = (value) => {
    this.setState({
      ...this.state,
      productModal: {
        ...this.state.productModal,
        quantity_expense: value
      }
    })
  };

  cancelExpense = (id) => {
    $.ajax({
      url: `/product_actions/${id}.json`,
      type: 'DELETE'
    }).then((resp) => {
      if (resp.success) {
        let products = this.state.products;
        delete products[id];
        this.setState({
          ...this.state,
          products: products
        });
        NotificationManager.success('Списання продукту скасовано');
      } else {
        NotificationManager.error(resp.error, 'Неможливо зробити дію');
      }
    });
  };

  submitExpense = (product_id) => {
    let params = {};
    if (this.state.openedModal === 'productModal') {
      params = { product: this.state.productModal }
    } else {
      params = {
        product: {
          id: product_id,
          quantity: this.state.barcodes[product_id].quantity_expense
        }
      }
    };
    $.ajax({
      url: this.state.openedModal === 'productModal' ? `/product_actions/${this.state.productModal.product_action_id}.json` : '/product_actions.json',
      type: this.state.openedModal === 'productModal' ? 'PATCH' : 'POST',
      data: params
    }).then((resp) => {
      if (resp.success) {
        if (this.state.openedModal === 'productModal') {
          this.setState({
            ...this.state,
            openedModal: '',
            products: {
              ...this.state.products,
              [resp.product.product_action_id]: resp.product
            }
          });
          NotificationManager.success('Клькість списання змінено');
        } else {
          let barcodes = this.state.barcodes;
          delete barcodes[product_id];
          this.setState({
            ...this.state,
            openedModal: '',
            barcodes: barcodes,
            products: {
              ...this.state.products,
              [resp.product.product_action_id]: resp.product
            }
          });
          NotificationManager.success('Продукт списано');
        }
      } else {
        NotificationManager.error(resp.error, 'Неможливо зробити дію');
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
        <div className='container' style={{marginTop: 100+'px', color: 'black'}}>
          <h1>Продукти на списанні</h1>
          <br/>
          <ButtonToggle color="primary" onClick={() => this.handleModal('productSearchModal')}>Шукати продукт</ButtonToggle>
          <table className='dark' style={{marginTop: 20 + 'px'}}>
            <thead>
            <tr>
              <th><h1>Баркод</h1></th>
              <th><h1>Назва</h1></th>
              <th><h1>Група</h1></th>
              <th><h1>Ціна</h1></th>
              <th><h1>Списання</h1></th>
              <th><h1>Сума</h1></th>
              <th><h1>Залишок</h1></th>
              <th><h1>Дії</h1></th>
            </tr>
            </thead>
            <tbody>
            { Object.values(this.state.products).map((product, i) => {
              return (
                <tr key={i}>
                  <td>{product.barcode}</td>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{product.sell_price} грн</td>
                  <td>{product.quantity_expense}</td>
                  <td>{this.productSum(product.product_action_id)} грн</td>
                  <td>{product.quantity}</td>
                  <td>
                    {/*<ButtonToggle color="warning" size="sm" onClick={() => this.editExpense(product.product_action_id)}>Редагувати</ButtonToggle>*/}
                    <ButtonToggle color="danger" size="sm" onClick={() => this.cancelExpense(product.product_action_id)}>Скасувати</ButtonToggle>
                  </td>
                </tr>
              )
            })}
            </tbody>
          </table>
          { Object.keys(this.state.products).length > 0 && <h1>Всього: {this.summary()} грн</h1>}
          <hr/>
          <h1>Відскановані баркоди</h1>
          <table className='dark' style={{marginTop: 20 + 'px'}}>
            <thead>
            <tr>
              <th><h1>Баркод</h1></th>
              <th><h1>Назва</h1></th>
              <th><h1>Група</h1></th>
              <th><h1>Ціна</h1></th>
              <th><h1>Залишок</h1></th>
              <th><h1>Списання</h1></th>
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
                  <td>{this.state.barcodes[barcode].sell_price} грн</td>
                  <td>{this.state.barcodes[barcode].quantity}</td>
                  <td>
                    <Input type='number' id={`quantity_${i}`}
                           value={this.state.barcodes[barcode].quantity_expense}
                           onChange={(e) => this.handleInputChange('quantity_expense', barcode, e.target.value)}
                           className='quantity-expense'
                           min={0}
                           max={this.state.barcodes[barcode].quantity}
                    />
                  </td>
                  <td>
                    <ButtonToggle color="warning" size="sm" onClick={() => this.cancelBarcode(barcode)}>Відмінити</ButtonToggle>
                    <ButtonToggle color="success" size="sm" onClick={() => this.submitExpense(barcode)}>Списати</ButtonToggle>
                  </td>
                </tr>
              )
            })}
            </tbody>
          </table>

          { (this.state.openedModal.length > 0 && this.state.openedModal !== 'productSearchModal') &&
            <Modal isOpen={this.state.openedModal.length > 0} toggle={() => this.handleModal('')} size="sm">
              <div className='container'>
                <ModalHeader>Редагувати кількість списання продукту</ModalHeader>
                <div className='row'>
                  <div className='col-12'>
                    <FormGroup>
                      <Label for={`quantity_${this.state.openedModal}`}>Кількість</Label>
                      <Input type='number' id={`quantity_${this.state.openedModal}`}
                             value={this.state[this.state.openedModal].quantity_expense}
                             onChange={(e) => this.handleQuantityExpenseChange(e.target.value)}
                             min={1}/>
                    </FormGroup>
                  </div>
                </div>
                <FormGroup>
                  <ButtonToggle color="secondary" onClick={() => this.handleModal('')}>Відміна</ButtonToggle>
                  <ButtonToggle color="success" onClick={() => this.submitExpense(this.state[this.state.openedModal].id)}>Зберегти</ButtonToggle>
                </FormGroup>
              </div>
            </Modal>}

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
                      {Object.values(this.state.foundProducts).map((product, index) => {
                        return (
                          <div className='found-product' key={index}>
                            <div className='found-product-info'>
                              <span>{product.barcode}</span>
                              <span>{product.category.name}</span>
                              <span>{product.name}</span>
                            </div>
                            <ButtonToggle size='sm' color="danger" disabled={this.restrictAdding(product.id)} onClick={() => this.addProduct(product.id)}>Списати</ButtonToggle>
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
        </div>
      </ActionCableProvider>
    );
  }
}
