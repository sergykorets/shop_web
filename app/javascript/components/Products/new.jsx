import React, {Fragment} from 'react';
import {ActionCable, ActionCableProvider} from 'react-actioncable-provider';
import { Modal, ModalHeader, FormGroup, Label, Input, ButtonToggle } from 'reactstrap';
import {NotificationContainer, NotificationManager} from 'react-notifications';

export default class Products extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      barcodes: {},
      products: {},
      selectedBarcode: {
        barcode: '',
        name: '',
        quantity: 1
      },
      selectedProduct: {
        barcode: '',
        name: '',
        quantity: 1
      },
      barcodeModal: false,
      productModal: false,
    };
  }

  handleReceivedBarcode = (response) => {
    if (Object.values(this.state.products).some(item => response.message === item.barcode)) {
      NotificationManager.error('Редагування доступне у верхній таблиці' ,'Баркод вже відскановано');
    } else {
      this.setState({
        ...this.state,
        barcodes: {
          ...this.state.barcodes,
          [response.message]: response.product || {barcode: response.message}
        }
      });
    }
  };

  cancelBarcode = (barcode) => {
    let barcodes = this.state.barcodes;
    delete barcodes[barcode]
    this.setState({
      ...this.state,
      barcodes: barcodes
    })
  };

  deleteProduct = (product_id) => {
    if (window.confirm("Видалити продукт?")) {
      $.ajax({
        url: `/products/${product_id}.json`,
        type: 'DELETE',
        success: (resp) => {
          if (resp.success) {
            NotificationManager.success('Продукт видалено');
          } else {
            NotificationManager.error('Можна відміняти лише сьогоднішні транзакції', 'Транзакцію не відмінено');
          }
        }
      });
    }
  }

  handleModal = (modal) => {
    this.setState({
      ...this.state,
      [modal]: !this.state[modal]
    })
  }

  handleInputChange = (type, field, value) => {
    this.setState({
      ...this.state,
      [type]: {
        ...this.state[type],
        [field]: value
      }
    })
  }

  editBarcode = (barcode) => {
    this.setState({
      ...this.state,
      barcodeModal: true,
      selectedBarcode: {
        ...this.state.selectedBarcode,
        barcode: barcode,
        name: this.state.barcodes[barcode].name
      }
    })
  }

  editProduct = (id) => {
    this.setState({
      ...this.state,
      productModal: true,
      selectedProduct: this.state.products[id]
    })
  }

  submitProduct = () => {
    $.ajax({
      url: `/products/${this.state.selectedProduct.id}.json`,
      type: 'PATCH',
      data: {
        product: {
          barcode: this.state.selectedProduct.barcode,
          name: this.state.selectedProduct.name,
          quantity: this.state.selectedProduct.quantity
        }
      }
    }).then((resp) => {
      if (resp.success) {
        this.setState({
          ...this.state,
          productModal: false,
          selectedProduct: {
            barcode: '',
            name: '',
            quantity: ''
          },
          products: {
            ...this.state.products,
            [resp.product.id]: resp.product
          }
        })
        if (resp.action_type == 'replenishment') {
          NotificationManager.success('Касу поповнено');
        } else {
          NotificationManager.success('Касу проінкасовано');
        }
      } else {
        NotificationManager.error(resp.error, 'Неможливо зробити дію');
      }
    });
  }

  submitBarcode = () => {
    $.ajax({
      url: `/products.json`,
      type: 'POST',
      data: {
        product: {
          id: this.state.barcodes[this.state.selectedBarcode.barcode].id,
          barcode: this.state.selectedBarcode.barcode,
          name: this.state.selectedBarcode.name,
          quantity: this.state.selectedBarcode.quantity
        }
      }
    }).then((resp) => {
      let barcodes = this.state.barcodes;
      delete barcodes[this.state.selectedBarcode.barcode]
      if (resp.success) {
        this.setState({
          ...this.state,
          barcodeModal: false,
          barcodes: barcodes,
          selectedBarcode: {
            barcode: '',
            name: '',
            quantity: ''
          },
          products: {
            ...this.state.products,
            [resp.product.id]: resp.product
          }
        })
        NotificationManager.success('Продукт прийнято на касу');
      } else {
        NotificationManager.error(resp.error, 'Неможливо зробити дію');
      }
    });
  }

  render() {
    console.log(this.state)
    return (
      <ActionCableProvider url='ws://192.168.0.104:3000/cable'>
        <NotificationContainer/>
        <ActionCable
          channel='BarcodesChannel'
          onReceived={(data) => this.handleReceivedBarcode(data)}
        />
        <div className='container' style={{marginTop: 100+'px', color: 'black'}}>
          <h1>Прийняті продукти</h1>
          <table className='dark' style={{marginTop: 20 + 'px'}}>
            <thead>
            <tr>
              <th><h1>Баркод</h1></th>
              <th><h1>Назва</h1></th>
              <th><h1>К-ть</h1></th>
              <th><h1>Дії</h1></th>
            </tr>
            </thead>
            <tbody>
            { Object.values(this.state.products).map((product, i) => {
              return (
                <tr key={i}>
                  <td>{product.barcode}</td>
                  <td>{product.name}</td>
                  <td>{product.quantity}</td>
                  <td>
                    {/*<i onClick={() => this.deleteProduct(product.id)} className="fa fa-ban"></i>*/}
                    <i onClick={() => this.editProduct(product.id)} className="fa fa-pencil"></i>
                  </td>
                </tr>
              )
            })}
            </tbody>
          </table>
          <h1>Відскановані баркоди</h1>
          <table className='dark' style={{marginTop: 20 + 'px'}}>
            <thead>
            <tr>
              <th><h1>Баркод</h1></th>
              <th><h1>Назва</h1></th>
              <th><h1>К-ть</h1></th>
              <th><h1>Дії</h1></th>
            </tr>
            </thead>
            <tbody>
              { Object.keys(this.state.barcodes).map((barcode, i) => {
                return (
                  <tr key={i}>
                    <td>{barcode}</td>
                    <td>{this.state.barcodes[barcode].name}</td>
                    <td>{this.state.barcodes[barcode].quantity}</td>
                    <td>
                      <i onClick={() => this.cancelBarcode(barcode)} className="fa fa-ban"></i>
                      <i onClick={() => this.editBarcode(barcode)} className="fa fa-plus"></i>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <Modal isOpen={this.state.barcodeModal} toggle={() => this.handleModal('barcodeModal')} size="lg">
            <div className='container'>
              <ModalHeader>Редагувати баркод</ModalHeader>
              <div className='row'>
                <div className='col-4'>
                  <FormGroup>
                    <Label for="barcode">Barcode</Label>
                    <Input type='text' id='barcode' value={this.state.selectedBarcode.barcode} disabled={true}/>
                  </FormGroup>
                </div>
                <div className='col-4'>
                  <FormGroup>
                    <Label for="name">Назва</Label>
                    <Input type='text' id='name' value={this.state.selectedBarcode.name} onChange={(e) => this.handleInputChange('selectedBarcode','name', e.target.value)}/>
                  </FormGroup>
                </div>
                <div className='col-4'>
                  <FormGroup>
                    <Label for="quantity">Кількість</Label>
                    <Input type='number' id='quantity' value={this.state.selectedBarcode.quantity} onChange={(e) => this.handleInputChange('selectedBarcode','quantity', e.target.value)}/>
                  </FormGroup>
                </div>
              </div>
              <FormGroup>
                <ButtonToggle color="secondary" onClick={() => this.handleModal('barcodeModal')}>Відміна</ButtonToggle>
                <ButtonToggle color="success" onClick={this.submitBarcode}>Зберегти</ButtonToggle>
              </FormGroup>
            </div>
          </Modal>

          <Modal isOpen={this.state.productModal} toggle={() => this.handleModal('productModal')} size="lg">
            <div className='container'>
              <ModalHeader>Редагувати продукт</ModalHeader>
              <div className='row'>
                <div className='col-4'>
                  <FormGroup>
                    <Label for="barcode_product">Barcode</Label>
                    <Input type='text' id='barcode_product' value={this.state.selectedProduct.barcode} onChange={(e) => this.handleInputChange('selectedProduct','barcode', e.target.value)}/>
                  </FormGroup>
                </div>
                <div className='col-4'>
                  <FormGroup>
                    <Label for="name_product">Назва</Label>
                    <Input type='text' id='name_product' value={this.state.selectedProduct.name} onChange={(e) => this.handleInputChange('selectedProduct','name', e.target.value)}/>
                  </FormGroup>
                </div>
                <div className='col-4'>
                  <FormGroup>
                    <Label for="quantity_product">Кількість</Label>
                    <Input type='number' id='quantity_product' value={this.state.selectedProduct.quantity} onChange={(e) => this.handleInputChange('selectedProduct','quantity', e.target.value)}/>
                  </FormGroup>
                </div>
              </div>
              <FormGroup>
                <ButtonToggle color="secondary" onClick={() => this.handleModal('productModal')}>Відміна</ButtonToggle>
                <ButtonToggle color="success" onClick={this.submitProduct}>Зберегти</ButtonToggle>
              </FormGroup>
            </div>
          </Modal>
        </div>
      </ActionCableProvider>
    );
  }
}
