import React, {Fragment} from 'react';
import {ActionCable, ActionCableProvider} from 'react-actioncable-provider';
import { Modal, ModalHeader, FormGroup, Label, Input, ButtonToggle, Tooltip } from 'reactstrap';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import Table from "../common/table";

export default class EditAction extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      action: this.props.action,
      products: {},
      showSuccess: false,
      categories: this.props.categories,
      tooltips: {},
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
      if (Object.values(this.state.action.products).some(item => ((response.product.id.toString() === item.id.toString()) && item.destroy))) {
        this.setState({
          ...this.state,
          action: {
            ...this.state.action,
            products: {
              ...this.state.action.products,
              [response.product.id]: {
                ...this.state.action.products[response.product.id],
                destroy: false
              }
            }
          }
        })
      } else if (Object.values(this.state.action.products).some(item => response.product.id.toString() === item.id.toString())) {
        NotificationManager.error('Редагуйте кількість даного товару в таблиці', 'Товар є в чеку');
      } else {
        this.setState({
          ...this.state,
          action: {
            ...this.state.action,
            products: {
              ...this.state.action.products,
              [response.product.id]: Object.assign(response.product, {
                quantity_sell: 1,
                category: response.product.category.name
              })
            }
          }
        });
      }
    } else {
      NotificationManager.error('Товар не знайдено', 'Баркод невідомий');
    }
  };

  toggleToolptip = (index) => {
    this.setState({
      ...this.state,
      tooltips: {
        ...this.state.tooltips,
        [index]: !this.state.tooltips[index]
      }
    });
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

  cancelProduct = (product, i) => {
    if (product.product_action_id) {
      this.setState({
        ...this.state,
        action: {
          ...this.state.action,
          products: {
            ...this.state.action.products,
            [product.id]: {
              ...this.state.action.products[product.id],
              destroy: true
            }
          }
        }
      })
    } else {
      let products = this.state.action.products;
      delete products[product.id];
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
    Object.values(this.state.action.products).filter(item => !item.destroy).map(product => {
      return sumArray.push(parseFloat(product.sell_price) * parseFloat(product.quantity_sell))
    });
    return sumArray.reduce((a, b) => a + b, 0).toFixed(2)
  };

  editSummary = () => {
    return Math.abs(this.summary() - parseFloat(this.state.action.amount)).toFixed(2)
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
    if (Object.values(this.state.action.products).some(item => id.toString() === item.id.toString())) {
      this.setState({
        ...this.state,
        action: {
          ...this.state.action,
          products: {
            ...this.state.action.products,
            [id]: {
              ...this.state.action.products[id],
              destroy: false
            }
          }
        }
      })
    } else {
      this.setState({
        ...this.state,
        action: {
          ...this.state.action,
          products: {
            ...this.state.action.products,
            [id]: Object.assign(this.state.products[id], {quantity_sell: 1})
          }
        }
      })
    }
  };

  restrictAdding = (id) => {
    return Object.values(this.state.action.products).some(item => ((id.toString() === item.id.toString()) && !item.destroy))
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
            showSuccess: true,
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

  shouldScanResponse = (data) => {
    return (data.device === this.props.workingPhone && this.props.user.role === 'cashier') || (data.device !== this.props.workingPhone && this.props.user.role === 'admin')
  };

  render() {
    return (
      <ActionCableProvider url={`wss://${location.host}/cable`}>
        <NotificationContainer/>
        <ActionCable
          channel='BarcodesChannel'
          onReceived={(data) => this.shouldScanResponse(data) ? this.handleReceivedBarcode(data) : ''}
        />
        { this.state.showSuccess ?
          <div className='container text-center page-content'>
            <h1>Транзакцію змінено</h1>
            <h2>Сума продажу: {this.state.action.amount}<span className='uah'>₴</span></h2>
            <ButtonToggle style={{marginBottom: 6+'rem'}} size='lg' color="primary" onClick={() => location.href = '/sell'}>Зробити нову продажу</ButtonToggle>
            <ButtonToggle style={{marginBottom: 6+'rem'}} size='lg' color="warning" onClick={() => location.reload()}>Редагувати продаж</ButtonToggle>
          </div>
          :
          <div className='container page-content' style={{color: 'black'}}>
            <h1>Редагувати продаж</h1>
            <br/>
            <ButtonToggle color="primary" onClick={() => this.handleModal('productSearchModal')}>Шукати товар</ButtonToggle>
            <Table properties={
              [ {barcode: 'Баркод'},
                {name: 'Назва'},
                {category: 'Група'},
                {quantity: 'Залишок'},
                {sell_price: 'Ціна', icon: '₴'},
                {quantity_sell: 'Кількість', input: true},
                {product_sum: 'Сума', action: 'productSum', icon: '₴'}
              ]}
               items={Object.values(this.state.action.products).filter(item => !item.destroy)}
               toggleToolptip={this.toggleToolptip}
               tooltips={this.state.tooltips}
               handleInputChange={this.handleInputChange}
               productSum={this.productSum}
               actions={[{action: this.cancelProduct, name: 'Скасувати', color: 'danger'}]}
            />
            <hr/>
            { Object.keys(this.state.action.products).length > 0 &&
              <Fragment>
                <h1>Сума до сплати: {this.summary()}<span className='uah'>₴</span></h1>
                { parseFloat(this.state.action.amount).toFixed(2) !== this.summary() &&
                  <Fragment>
                    <h1>{this.summary() > parseFloat(this.state.action.amount) ? 'Доплата:' : 'Повернення:'} {this.editSummary()}<span className='uah'>₴</span></h1>
                    { this.summary() > parseFloat(this.state.action.amount) &&
                      <Fragment>
                        <FormGroup className='cash'>
                          <Label for='income_amount'>Готівка</Label>
                          <Input type='number' id='income_amount' value={this.state.income_amount}
                                 onChange={(e) => this.handleFieldChange('income_amount', e.target.value)}/>
                        </FormGroup>
                        { parseFloat(this.state.income_amount) > this.editSummary() &&
                          <h1>Решта: {(parseFloat(this.state.income_amount) - this.editSummary()).toFixed(2)}<span className='uah'>₴</span></h1>}
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
          </div>}
      </ActionCableProvider>
    );
  }
}
