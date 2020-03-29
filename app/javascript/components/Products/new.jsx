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
      categories: this.props.categories,
      barcodeModal: {
        barcode: '',
        name: '',
        quantity: 1,
        category_id: this.props.categories[0].id,
        buy_price: '',
        sell_price: ''
      },
      productModal: {
        barcode: '',
        name: '',
        quantity: 1,
        category_id: this.props.categories[0].id,
        buy_price: '',
        sell_price: ''
      },
      manualModal: {
        barcode: '',
        name: '',
        quantity: 1,
        category_id: this.props.categories[0].id,
        buy_price: '',
        sell_price: ''
      },
      openedModal: '',
      createCategory: false,
      category: {
        name: '',
        multiplier: 1
      }
    };
  }

  handleReceivedBarcode = (response) => {
    if (Object.values(this.state.products).some(item => response.message === item.barcode)) {
      NotificationManager.error('Редагування доступне у верхній таблиці', 'Баркод вже відскановано');
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

  handleModal = (modal) => {
    this.setState({
      ...this.state,
      openedModal: modal
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
      openedModal: 'barcodeModal',
      barcodeModal: {
        ...this.state.barcodeModal,
        barcode: barcode,
        name: this.state.barcodes[barcode].name,
        quantity: 1,
        category_id: this.state.barcodes[barcode].category ? this.state.barcodes[barcode].category.id : this.state.categories[0].id,
        buy_price: this.state.barcodes[barcode].buy_price,
        sell_price: this.state.barcodes[barcode].sell_price
      }
    })
  }

  editProduct = (id) => {
    this.setState({
      ...this.state,
      openedModal: 'productModal',
      productModal: {
        ...this.state.productModal,
        id: this.state.products[id].id,
        barcode: this.state.products[id].barcode,
        name: this.state.products[id].name,
        quantity: this.state.products[id].quantity,
        category_id: this.state.products[id].category.id,
        buy_price: this.state.products[id].buy_price,
        sell_price: this.state.products[id].sell_price
      }
    })
  }

  submitCategory = () => {
    $.ajax({
      url: '/categories.json',
      type: 'POST',
      data: {
        category: {
          name: this.state.category.name,
          multiplier: this.state.category.multiplier
        }
      },
      success: (resp) => {
        if (resp.success) {
          this.setState({
            ...this.state,
            createCategory: false,
            categories: [...this.state.categories, resp.category],
            category: {
              name: '',
              multiplier: 1
            }
          })
          NotificationManager.success("Тепер її можна вибрати в списку категорій", 'Категорію створено');
        } else {
          NotificationManager.error(resp.error, "Неможливо зробити дію");
        }
      }
    });
  }

  submitProduct = (modal) => {
    $.ajax({
      url: modal === 'productModal' ? `/products/${this.state.productModal.id}.json` : `/products.json`,
      type: modal === 'productModal' ? 'PATCH' : 'POST',
      data: {
        product: {
          id: modal === 'barcodeModal' ? this.state.barcodes[this.state.barcodeModal.barcode].id : '',
          barcode: this.state[this.state.openedModal].barcode,
          name: this.state[this.state.openedModal].name,
          quantity: this.state[this.state.openedModal].quantity,
          category_id: this.state[this.state.openedModal].category_id,
          buy_price: this.state[this.state.openedModal].buy_price,
          sell_price: this.state[this.state.openedModal].sell_price
        }
      }
    }).then((resp) => {
      if (resp.success) {
        let barcodes = this.state.barcodes;
        if (modal === 'barcodeModal') {
          delete barcodes[this.state.barcodeModal.barcode]
        }
        this.setState({
          ...this.state,
          openedModal: '',
          barcodes: barcodes,
          [modal]: {
            barcode: '',
            name: '',
            quantity: 1,
            category_id: this.state.categories[0].id,
            buy_price: '',
            sell_price: ''
          },
          products: {
            ...this.state.products,
            [resp.product.id]: resp.product
          }
        })
        if (modal === 'productModal') {
          NotificationManager.success('Продукт змінено');
        } else {
          NotificationManager.success('Продукт прийнято на касу');
        }
      } else {
        NotificationManager.error(resp.error, 'Неможливо зробити дію');
      }
    });
  }

  render() {
    return (
      <ActionCableProvider url='ws://192.168.0.104:3000/cable'>
        <NotificationContainer/>
        <ActionCable
          channel='BarcodesChannel'
          onReceived={(data) => this.handleReceivedBarcode(data)}
        />
        <div className='container' style={{marginTop: 100+'px', color: 'black'}}>
          <h1>Прийняті продукти</h1>
          <br/>
          <ButtonToggle color="primary" onClick={() => this.handleModal('manualModal')}>Додати продукт</ButtonToggle>
          <table className='dark' style={{marginTop: 20 + 'px'}}>
            <thead>
            <tr>
              <th><h1>Баркод</h1></th>
              <th><h1>Назва</h1></th>
              <th><h1>Категорія</h1></th>
              <th><h1>Купівля</h1></th>
              <th><h1>Продаж</h1></th>
              <th><h1>Кількість</h1></th>
              <th><h1>Дії</h1></th>
            </tr>
            </thead>
            <tbody>
            { Object.values(this.state.products).map((product, i) => {
              return (
                <tr key={i}>
                  <td>{product.barcode}</td>
                  <td>{product.name}</td>
                  <td>{product.category && product.category.name}</td>
                  <td>{product.buy_price}</td>
                  <td>{product.sell_price}</td>
                  <td>{product.quantity}</td>
                  <td>
                    <ButtonToggle color="warning" size="sm" onClick={() => this.editProduct(product.id)}>Редагувати</ButtonToggle>
                  </td>
                </tr>
              )
            })}
            </tbody>
          </table>
          <br/>
          <h1>Відскановані баркоди</h1>
          <table className='dark' style={{marginTop: 20 + 'px'}}>
            <thead>
            <tr>
              <th><h1>Баркод</h1></th>
              <th><h1>Назва</h1></th>
              <th><h1>Категорія</h1></th>
              <th><h1>Купівля</h1></th>
              <th><h1>Продаж</h1></th>
              <th><h1>Кількість</h1></th>
              <th><h1>Дії</h1></th>
            </tr>
            </thead>
            <tbody>
              { Object.keys(this.state.barcodes).map((barcode, i) => {
                return (
                  <tr key={i}>
                    <td>{barcode}</td>
                    <td>{this.state.barcodes[barcode].name}</td>
                    <td>{this.state.barcodes[barcode].category && this.state.barcodes[barcode].category.name}</td>
                    <td>{this.state.barcodes[barcode].buy_price}</td>
                    <td>{this.state.barcodes[barcode].sell_price}</td>
                    <td>{this.state.barcodes[barcode].quantity}</td>
                    <td>
                      <ButtonToggle color="danger" size="sm" onClick={() => this.cancelBarcode(barcode)}>Видалити</ButtonToggle>
                      <ButtonToggle color="success" size="sm" onClick={() => this.editBarcode(barcode)}>Додати</ButtonToggle>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          { (this.state.openedModal.length > 0) &&
            <Modal isOpen={this.state.openedModal.length > 0} toggle={() => this.handleModal('')} size="lg">
              <div className='container'>
                <ModalHeader>{this.state.openedModal === 'manualModal' ? 'Додати' : 'Редагувати'} {this.state.openedModal === 'barcodeModal' ? 'баркод' : 'продукт'}</ModalHeader>
                <div className='row'>
                  <div className='col-12'>
                    <FormGroup>
                      <Label for={`category_${this.state.openedModal}`}>Категорія</Label>
                      <Input type="select" name="category" id={`category_${this.state.openedModal}`}
                             defaultValue={this.state[this.state.openedModal].category_id}
                             onChange={(e) => this.handleInputChange(this.state.openedModal,'category_id', e.target.value)}>
                        { Object.values(this.state.categories).map((category) => {
                          return <option key={category.id} value={category.id}>{category.name}</option>
                        })}
                      </Input>
                      <i onClick={() => this.setState({createCategory: true})} className="fa fa-plus"> Додати категорію</i>
                    </FormGroup>
                    { this.state.createCategory &&
                      <div className='category-create'>
                        <h5>Створити нову категорію</h5>
                        <div className='row'>
                          <div className='col-6'>
                            <FormGroup>
                              <Label for='categoryName'>Назва</Label>
                              <Input type='text' id='categoryName' value={this.state.category.name}
                                     onChange={(e) => this.handleInputChange('category','name', e.target.value)}/>
                            </FormGroup>
                          </div>
                          <div className='col-6'>
                            <FormGroup>
                            <Label for='categoryMultiplier'>Множник</Label>
                              <Input type='number' id='categoryMultiplier' min={0} value={this.state.category.multiplier}
                                     onChange={(e) => this.handleInputChange('category','multiplier', e.target.value)}/>
                            </FormGroup>
                          </div>
                        </div>
                        <FormGroup>
                          <ButtonToggle color="secondary" onClick={() => this.setState({createCategory: false})}>Відміна</ButtonToggle>
                          <ButtonToggle color="success" onClick={this.submitCategory}>Створити</ButtonToggle>
                        </FormGroup>
                      </div>}
                    <FormGroup>
                      <Label for={`barcode_${this.state.openedModal}`}>Баркод</Label>
                      <Input type='text' id={`barcode_${this.state.openedModal}`}
                             value={this.state[this.state.openedModal].barcode}
                             disabled={this.state.openedModal === 'barcodeModal'}
                             onChange={(e) => this.handleInputChange(this.state.openedModal,'barcode', e.target.value)}/>
                    </FormGroup>
                  </div>
                  <div className='col-12'>
                    <FormGroup>
                      <Label for={`name_${this.state.openedModal}`}>Назва</Label>
                      <Input type='text' id={`name_${this.state.openedModal}`} value={this.state[this.state.openedModal].name}
                             onChange={(e) => this.handleInputChange(this.state.openedModal,'name', e.target.value)}/>
                    </FormGroup>
                  </div>
                  <div className='col-4'>
                    <FormGroup>
                      <Label for={`buy_price_${this.state.openedModal}`}>Покупка</Label>
                      <Input type='number' id={`buy_price_${this.state.openedModal}`} value={this.state[this.state.openedModal].buy_price}
                             onChange={(e) => this.handleInputChange(this.state.openedModal,'buy_price', e.target.value)}/>
                    </FormGroup>
                  </div>
                  <div className='col-4'>
                    <FormGroup>
                      <Label for={`sell_price_${this.state.openedModal}`}>Продаж</Label>
                      <Input type='number' id={`sell_price_${this.state.openedModal}`}
                             value={this.state[this.state.openedModal].sell_price}
                             onChange={(e) => this.handleInputChange(this.state.openedModal,'sell_price', e.target.value)}/>
                    </FormGroup>
                  </div>
                  <div className='col-4'>
                    <FormGroup>
                      <Label for={`quantity_${this.state.openedModal}`}>Кількість</Label>
                      <Input type='number' id={`quantity_${this.state.openedModal}`}
                             value={this.state[this.state.openedModal].quantity}
                             onChange={(e) => this.handleInputChange(this.state.openedModal,'quantity', e.target.value)}
                             min={0}/>
                    </FormGroup>
                  </div>
                </div>
                <FormGroup>
                  <ButtonToggle color="secondary" onClick={() => this.handleModal('')}>Відміна</ButtonToggle>
                  <ButtonToggle color="success" disabled={this.state.createCategory}
                                onClick={() => this.submitProduct(this.state.openedModal)}>Зберегти</ButtonToggle>
                </FormGroup>
              </div>
            </Modal>}
        </div>
      </ActionCableProvider>
    );
  }
}
