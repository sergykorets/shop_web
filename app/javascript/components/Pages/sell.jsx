import React, {Fragment} from 'react';
import {ActionCable, ActionCableProvider} from 'react-actioncable-provider';
import { Modal, ModalHeader, FormGroup, Label, Input, ButtonToggle, Tooltip } from 'reactstrap';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import Table from '../common/table';

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
      action: {},
      tooltips: {}
    };
  }

  handleReceivedBarcode = (response) => {
    if (response.product) {
      if (Object.values(this.state.barcodes).some(item => response.product.id.toString() === item.id.toString())) {
        NotificationManager.error('Редагуйте кількість даного товару в таблиці', 'Товар є в чеку');
      } else {
        this.setState({
          ...this.state,
          barcodes: {
            ...this.state.barcodes,
            [response.product.id]: Object.assign(response.product, {quantity_sell: 1})
          }
        });
      }
    } else {
      NotificationManager.error('Товар не знайдено', 'Баркод невідомий');
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

  toggleToolptip = (index) => {
    this.setState({
      ...this.state,
      tooltips: {
        ...this.state.tooltips,
        [index]: !this.state.tooltips[index]
      }
    });
  };

  handleFieldChange = (field, value) => {
    this.setState({ ...this.state, [field]: value })
  };

  cancelBarcode = (barcode, i) => {
    let barcodes = this.state.barcodes;
    delete barcodes[barcode.id];
    this.setState({
      ...this.state,
      barcodes: barcodes
    })
  };

  summary = () => {
    let sumArray = [];
    Object.values(this.state.barcodes).map((product, index) => {
      return sumArray.push(parseFloat(product.sell_price) * parseFloat(product.quantity_sell))
    });
    return (sumArray.reduce((a, b) => a + b, 0)).toFixed(2)
  };

  productSum = (product_id) => {
    const product = this.state.barcodes[product_id];
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
            action: resp.action
          });
          NotificationManager.success('Транзакція успішна');
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
    console.log(this.state, this.props)
    return (
      <ActionCableProvider url={`wss://${location.host}/cable`}>
        <NotificationContainer/>
        <ActionCable
          channel='BarcodesChannel'
          onReceived={(data) => this.shouldScanResponse(data) ? this.handleReceivedBarcode(data) : ''}
        />
        { this.state.showSuccess ?
          <div className='container text-center page-content'>
            <h1>Транзакція успішна</h1>
            <h2>Сума продажу: {this.state.action.amount}<span className='uah'>₴</span></h2>
            <ButtonToggle style={{marginBottom: 6+'rem'}} size='lg' color="primary" onClick={() => location.reload()}>Зробити нову продажу</ButtonToggle>
            <ButtonToggle style={{marginBottom: 6+'rem'}} size='lg' color="warning" onClick={() => location.href = `/actions/${this.state.action.id}/edit`}>Редагувати продаж</ButtonToggle>
          </div>
          :
          <div className='container page-content' style={{color: 'black'}}>
            <h1>Продаж товарів</h1>
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
              items={Object.values(this.state.barcodes)}
              toggleToolptip={this.toggleToolptip}
              tooltips={this.state.tooltips}
              handleInputChange={this.handleInputChange}
              productSum={this.productSum}
              actions={[{action: this.cancelBarcode, name: 'Скасувати', color: 'danger'}]}
            />
            <hr/>
            { Object.keys(this.state.barcodes).length > 0 &&
              <Fragment>
                <h1>Сума до сплати: {this.summary()}<span className='uah'>₴</span></h1>
                <FormGroup className='cash'>
                  <Label for='income_amount'>Готівка</Label>
                  <Input type='number' id='income_amount' value={this.state.income_amount}
                         onChange={(e) => this.handleFieldChange('income_amount', e.target.value)}/>
                </FormGroup>
                { parseFloat(this.state.income_amount) > this.summary() &&
                  <h1>Решта: {(parseFloat(this.state.income_amount) - this.summary()).toFixed(2)}<span className='uah'>₴</span></h1>}
              </Fragment>}
            <hr/>
            <ButtonToggle size='lg' color="success" disabled={Object.keys(this.state.barcodes).length < 1} onClick={() => this.submitSell()}>Продати</ButtonToggle>
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
