import React, {Fragment} from 'react';
import {ActionCable, ActionCableProvider} from 'react-actioncable-provider';
import { Modal, ModalHeader, FormGroup, Label, Input, ButtonToggle } from 'reactstrap';
import {NotificationContainer, NotificationManager} from 'react-notifications';

export default class EditAction extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      action: this.props.action,
      products: {},
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
    };
  }

  handleReceivedBarcode = (response) => {
    if (response.product) {
      this.setState({
        ...this.state,
        barcodes: {
          ...this.state.action.products,
          [response.product.id]: Object.assign(response.product, {quantity_sell: 1, category: this.state.products[id].category.name})
        }
      });
    } else {
      NotificationManager.error('товар не знайдено', 'Баркод невідомий');
    }
  };

  handleModal = (modal) => {
    this.setState({
      ...this.state,
      openedModal: modal
    })
  };

  handleInputChange = (field, id, v) => {
    this.setState({
      ...this.state,
      action: {
        ...this.state.action,
        products: {
          ...this.state.action.products,
          [id]: {
            ...this.state.action.products[id],
            [field]: v
          }
        }
      }
    })
  };

  handleFieldChange = (field, value) => {
    this.setState({ ...this.state, [field]: value })
  };

  cancelProduct = (product) => {
    if (this.state.action.products[product].product_action_id) {
      this.setState({
        ...this.state,
        action: {
          ...this.state.action,
          products: {
            ...this.state.action.products,
            [product]: {
              ...this.state.action.products[product],
              destroy: true
            }
          }
        }
      })
    } else {
      let products = this.state.action.products;
      delete products[product];
      this.setState({
        ...this.state,
        action: {
          ...this.state.action,
          products: products
        }
      })
    }
  };

  summary = () => {
    let sumArray = [];
    Object.values(this.state.action.products).filter(item => !item.destroy).map((product, index) => {
      return sumArray.push(parseFloat(product.sell_price) * parseFloat(product.quantity_sell))
    });
    return sumArray.reduce((a, b) => a + b, 0).toFixed(2)
  };

  editSummary = () => {
    return Math.abs(this.summary() - parseFloat(this.state.action.previous_amount).toFixed(2)).toFixed(2)
  };

  productSum = (product_id) => {
    const product = this.state.action.products[product_id];
    return (parseFloat(product.sell_price) * parseFloat(product.quantity_sell)).toFixed(2)
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
      action: {
        ...this.state.action,
        products: {
          ...this.state.action.products,
          [id]: Object.assign(this.state.products[id], {quantity_sell: 1, category: this.state.products[id].category.name})
        }
      }
    })
  };

  restrictAdding = (id) => {
    return Object.keys(this.state.action.products).some(item => id.toString() === item.toString())
  };

  submitSell = () => {
    const attributes = Object.values(this.state.action.products).map((product, index) => {
      return (
        { id: product.product_action_id,
          product_id: product.id,
          quantity: product.quantity_sell,
          _destroy: product.destroy ? '1' : ''
        }
      )
    });
    $.ajax({
      url: `/actions/${this.state.action.id}.json`,
      type: 'PATCH',
      data: {
        transaction: {
          product_actions_attributes: attributes
        }
      },
      success: (resp) => {
        if (resp.success) {
          this.setState({
            ...this.state,
            action: resp.action,
            income_amount: '',
            change: '',
          });
          NotificationManager.success('Транзакцію змінено');
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
        <div className='container' style={{marginTop: 100+'px', color: 'black'}}>
          <h1>Редагувати продаж</h1>
          <br/>
          <ButtonToggle color="primary" onClick={() => this.handleModal('productSearchModal')}>Шукати товар</ButtonToggle>
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
            { Object.values(this.state.action.products).filter(item => !item.destroy).map((product, i) => {
              return (
                <tr key={i}>
                  <td>{product.barcode}</td>
                  <td>{product.name}</td>
                  <td>{product.category.name}</td>
                  <td>{product.quantity}</td>
                  <td>{product.sell_price} грн</td>
                  <td>
                    <Input type='number' id={`quantity_${i}`}
                           value={this.state.action.products[product.id].quantity_sell}
                           onChange={(e) => this.handleInputChange('quantity_sell', product.id, e.target.value)}
                           className='quantity-sell'
                           min={0}
                           max={product.product_action_id ? parseFloat(this.state.action.products[product.id].quantity_previous || this.props.action.products[product.id].quantity_sell) + parseFloat(product.quantity) : product.quantity}
                    />
                  </td>
                  <td>{this.productSum(product.id)} грн</td>
                  <td>
                    <ButtonToggle color="danger" size="sm" onClick={() => this.cancelProduct(product.id)}>Видалити</ButtonToggle>
                  </td>
                </tr>
              )
            })}
            </tbody>
          </table>
          <hr/>
          { Object.keys(this.state.action.products).length > 0 &&
            <Fragment>
              <h1>Сума до сплати: {this.summary()} грн</h1>
              { parseFloat(this.state.action.previous_amount).toFixed(2) !== this.summary() &&
                <Fragment>
                  <h1>{this.summary() > parseFloat(this.state.action.previous_amount).toFixed(2) ? 'Доплата:' : 'Повернення:'} {this.editSummary()} грн</h1>
                  { this.summary() > parseFloat(this.state.action.previous_amount).toFixed(2) &&
                    <Fragment>
                      <FormGroup>
                        <Label for='income_amount'>Готівка</Label>
                        <Input type='number' id='income_amount' value={this.state.income_amount}
                               onChange={(e) => this.handleFieldChange('income_amount', e.target.value)}/>
                      </FormGroup>
                      { parseFloat(this.state.income_amount) > this.editSummary() &&
                        <h1>Решта: {(parseFloat(this.state.income_amount) - this.editSummary()).toFixed(2)} грн</h1>}
                    </Fragment>}
                </Fragment>}
            </Fragment>}
          <hr/>
          <ButtonToggle size='lg' color="warning" disabled={Object.keys(this.state.action.products).length < 1} onClick={() => this.submitSell()}>Змінити продаж</ButtonToggle>
          <hr/>
          { (this.state.openedModal === 'productSearchModal') &&
            <Modal isOpen={this.state.openedModal === 'productSearchModal'} toggle={() => this.handleModal('')} size="lg">
              <div className='container'>
                <ModalHeader>Пошук товару</ModalHeader>
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
                      <Label for='name'>Назва товару</Label>
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
        </div>
      </ActionCableProvider>
    );
  }
}
