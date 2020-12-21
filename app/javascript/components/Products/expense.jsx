import React, {Fragment} from 'react';
import moment from 'moment'
import {ActionCable, ActionCableProvider} from 'react-actioncable-provider';
import {Modal, ModalHeader, FormGroup, Label, Input, ButtonToggle, Tooltip} from 'reactstrap';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import AirBnbPicker from '../common/AirBnbPicker';
import Table from "../common/table";

export default class Expense extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      barcodes: {},
      products: this.props.products,
      foundProducts: {},
      openedModal: '',
      tooltips: {},
      date: moment().format('DD.MM.YYYY'),
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
      NotificationManager.error('Списаний товар знаходить у верхній таблиці', 'Баркод вже відскановано');
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
        NotificationManager.error('Товар не знайдено');
      }
    }
  };

  handleModal = (modal) => {
    this.setState({
      ...this.state,
      openedModal: modal
    })
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

  isToday = () => {
    return moment().isSame(moment(this.state.date, 'DD.MM.YYYY'), 'day')
  };

  handleDateChange = ({date}) => {
    $.ajax({
      url: '/product_actions.json',
      type: 'GET',
      data: {
        action_type: 'expense',
        date: date.format('DD.MM.YYYY')
      },
      success: (resp) => {
        if (resp.success) {
          this.setState({
            ...this.state,
            products: resp.products,
            date: date ? date.format('DD.MM.YYYY') : null
          });
        } else {
          NotificationManager.error(resp.error, "Неможливо зробити дію");
        }
      }
    });
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

  summary = () => {
    let sumArray = [];
    Object.values(this.state.products).map((product, index) => {
      return sumArray.push(parseFloat(product.sell_price) * parseFloat(product.quantity_expense))
    });
    return (sumArray.reduce((a, b) => a + b, 0)).toFixed(2)
  };

  productSum = (products, product_id) => {
    const product = this.state[products][product_id];
    if (product.sell_price && product.quantity) {
      return (parseFloat(product.sell_price) * parseFloat(product.quantity_expense)).toFixed(2)
    }
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

  // editExpense = (product_action_id) => {
  //   this.setState({
  //     ...this.state,
  //     openedModal: 'productModal',
  //     productModal: this.state.products[product_action_id]
  //   })
  // };

  handleQuantityExpenseChange = (value) => {
    this.setState({
      ...this.state,
      productModal: {
        ...this.state.productModal,
        quantity_expense: value
      }
    })
  };

  cancelExpense = (product) => {
    if (window.confirm("Відмінити списання товару?")) {
      $.ajax({
        url: `/product_actions/${product.product_action_id}.json`,
        type: 'DELETE'
      }).then((resp) => {
        if (resp.success) {
          let products = this.state.products;
          delete products[product.id];
          this.setState({
            ...this.state,
            products: products
          });
          NotificationManager.success('Списання товару скасовано');
        } else {
          NotificationManager.error(resp.error, 'Неможливо зробити дію');
        }
      });
    }
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
              [resp.product.id]: resp.product
            }
          });
          NotificationManager.success('Кількість списання змінено');
        } else {
          let barcodes = this.state.barcodes;
          delete barcodes[product_id];
          this.setState({
            ...this.state,
            openedModal: '',
            barcodes: barcodes,
            products: {
              ...this.state.products,
              [resp.product.id]: resp.product
            }
          });
          NotificationManager.success('Товар списано');
        }
      } else {
        NotificationManager.error(resp.error, 'Неможливо зробити дію');
      }
    });
  };

  shouldScanResponse = (data) => {
    return (data.device === this.props.workingPhone && this.props.user.role === 'cashier') || (data.device !== this.props.workingPhone && this.props.user.role === 'admin')
  };

  render() {
    return (
      <div className='container page-content' style={{color: 'black'}}>
        <div className='date-header'>
          <h1>Списані товари</h1>
          <AirBnbPicker
            single={true}
            pastDates={true}
            onPickerApply={this.handleDateChange}
            date={this.state.date}
          />
        </div>
        <br/>
        { this.isToday() &&
          <ButtonToggle color="primary" onClick={() => this.handleModal('productSearchModal')}>Шукати товар</ButtonToggle>}
        <Table properties={
          this.isToday() ?
            [ {barcode: 'Баркод'},
              {name: 'Назва'},
              {category: 'Група'},
              {sell_price: 'Ціна', icon: '₴'},
              {quantity_expense: 'Списання'},
              {product_sum: 'Сума', action: 'productSum', icon: '₴'},
              {quantity: 'Залишок'}
            ]
            :
            [ {barcode: 'Баркод'},
              {name: 'Назва'},
              {category: 'Група'},
              {sell_price: 'Ціна', icon: '₴'},
              {quantity_expense: 'Списання'},
              {product_sum: 'Сума', action: 'productSum', icon: '₴'}
            ]
        }
         items={Object.values(this.state.products)}
         toggleToolptip={this.toggleToolptip}
         tooltips={this.state.tooltips}
         productSum={this.productSum}
         itemType={'products'}
         actions={this.isToday() && [{action: this.cancelExpense, name: 'Скасувати', color: 'danger'}]}
        />
        { Object.keys(this.state.products).length > 0 &&
          <Fragment>
            <hr/>
            <h1>Всього: {this.summary()}<span className='uah'>₴</span></h1>
          </Fragment>}
        { this.isToday() &&
          <ActionCableProvider url={`wss://${location.host}/cable`}>
            <NotificationContainer/>
            <ActionCable
              channel='BarcodesChannel'
              onReceived={(data) => this.shouldScanResponse(data) ? this.handleReceivedBarcode(data) : ''}
            />
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
                    <td>{this.state.barcodes[barcode].sell_price}<span className='uah'>₴</span></td>
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
          </ActionCableProvider>}

        { (this.state.openedModal.length > 0 && this.state.openedModal !== 'productSearchModal') &&
          <Modal isOpen={this.state.openedModal.length > 0} toggle={() => this.handleModal('')} size="sm">
            <div className='container'>
              <ModalHeader>Редагувати кількість списання товару</ModalHeader>
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
    );
  }
}
