import React, {Fragment} from 'react';
import {ActionCable, ActionCableProvider} from 'react-actioncable-provider';
import { Modal, ModalHeader, FormGroup, Label, Input, ButtonToggle } from 'reactstrap';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import AirBnbPicker from '../common/AirBnbPicker';

export default class newProduct extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      barcodes: {},
      products: this.props.products,
      foundProducts: {},
      categories: this.props.categories,
      barcodeModal: {
        barcode: '',
        name: '',
        quantity: 1,
        category_id: '',
        buy_price: '',
        sell_price: '',
        due_date: null
      },
      productModal: {
        barcode: '',
        name: '',
        quantity: 1,
        category_id: '',
        buy_price: '',
        sell_price: '',
        due_date: null
      },
      manualModal: {
        barcode: '',
        name: '',
        quantity: 1,
        category_id: '',
        buy_price: '',
        sell_price: '',
        due_date: null
      },
      productSearchModal: {
        barcode: '',
        name: '',
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
  };

  handleInputChange = (type, field, v) => {
    this.setState({
      ...this.state,
      [type]: {
        ...this.state[type],
        [field]: v
      }
    })
  };

  handleDateChange = ({date}) => {
    this.setState({
      ...this.state,
      [this.state.openedModal]: {
        ...this.state[this.state.openedModal],
        due_date: date ? date.format('DD.MM.YYYY') : null
      }
    })
  };

  floorFloat = (value) => {
    return (Math.floor(value * 100) / 100);
  };

  summary = () => {
    let sumArray = [];
    Object.values(this.state.products).map((product, index) => {
      return sumArray.push(parseFloat(product.sell_price) * parseFloat(product.quantity))
    });
    return this.floorFloat(sumArray.reduce((a, b) => a + b, 0))
  };

  productSum = (products, product_id) => {
    const product = this.state[products][product_id];
    return this.floorFloat(parseFloat(product.sell_price) * parseFloat(product.quantity))
  };

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
  };

  editProduct = (id) => {
    this.setState({
      ...this.state,
      openedModal: 'productModal',
      productModal: {
        ...this.state.productModal,
        id: this.state.products[id].id,
        product_action_id: this.state.products[id].product_action_id,
        barcode: this.state.products[id].barcode,
        name: this.state.products[id].name,
        quantity: this.state.products[id].quantity,
        category_id: this.state.products[id].category.id,
        buy_price: this.state.products[id].buy_price,
        sell_price: this.state.products[id].sell_price,
        due_date: this.state.products[id].due_date
      }
    })
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
        [this.state.foundProducts[id].barcode]: this.state.foundProducts[id]
      }
    })
  };

  restrictAdding = (barcode) => {
    return Object.keys(this.state.barcodes).some(item => barcode === item) ||
      Object.values(this.state.products).some(item => barcode === item.barcode)
  };

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
          });
          NotificationManager.success("Тепер її можна вибрати в списку категорій", 'Категорію створено');
        } else {
          NotificationManager.error(resp.error, "Неможливо зробити дію");
        }
      }
    });
  };

  cancelIncoming = (product) => {
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
        NotificationManager.success('Приход продукту скасовано');
      } else {
        NotificationManager.error(resp.error, 'Неможливо зробити дію');
      }
    });
  };

  submitProduct = (modal) => {
    $.ajax({
      url: modal === 'productModal' ? `/product_actions/${this.state.productModal.product_action_id}.json` : `/products.json`,
      type: modal === 'productModal' ? 'PATCH' : 'POST',
      data: {
        product: {
          id: modal === 'barcodeModal' ? this.state.barcodes[this.state.barcodeModal.barcode].id : '',
          barcode: this.state[this.state.openedModal].barcode,
          name: this.state[this.state.openedModal].name,
          quantity: this.state[this.state.openedModal].quantity,
          category_id: this.state[this.state.openedModal].category_id,
          buy_price: this.state[this.state.openedModal].buy_price,
          sell_price: this.state[this.state.openedModal].sell_price,
          due_date: this.state[this.state.openedModal].due_date
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
            sell_price: '',
            due_date: null
          },
          products: {
            ...this.state.products,
            [resp.product.id]: resp.product
          }
        })
        if (modal === 'productModal') {
          NotificationManager.success('Приход продукту змінено');
        } else {
          NotificationManager.success('Продукт прийнято на приход');
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
          <h1>Прийняті продукти</h1>
          <br/>
          <ButtonToggle color="primary" onClick={() => this.handleModal('manualModal')}>Додати продукт</ButtonToggle>
          <ButtonToggle color="success" onClick={() => this.handleModal('productSearchModal')}>Шукати продукт</ButtonToggle>
          <table className='dark' style={{marginTop: 20 + 'px'}}>
            <thead>
            <tr>
              <th><h1>Баркод</h1></th>
              <th><h1>Назва</h1></th>
              <th><h1>Група</h1></th>
              <th><h1>Закупівля</h1></th>
              <th><h1>Ціна</h1></th>
              <th><h1>Приход</h1></th>
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
                  <td>{product.category && product.category.name}</td>
                  <td>{product.buy_price} грн</td>
                  <td>{product.sell_price} грн</td>
                  <td>{product.quantity}</td>
                  <td>{this.productSum('products' ,product.id)} грн</td>
                  <td>{product.product_quantity}</td>
                  <td>
                    <ButtonToggle color="warning" size="sm" onClick={() => this.editProduct(product.id)}>Редагувати</ButtonToggle>
                    <ButtonToggle color="danger" size="sm" onClick={() => this.cancelIncoming(product)}>Скасувати</ButtonToggle>
                  </td>
                </tr>
              )
            })}
            </tbody>
          </table>
          { Object.keys(this.state.products).length > 0 &&
            <h1>Всього: {this.summary()} грн</h1>}

          <hr/>
          <h1>Відскановані баркоди</h1>
          <table className='dark' style={{marginTop: 20 + 'px'}}>
            <thead>
            <tr>
              <th><h1>Баркод</h1></th>
              <th><h1>Назва</h1></th>
              <th><h1>Група</h1></th>
              <th><h1>Закупівля</h1></th>
              <th><h1>Ціна</h1></th>
              <th><h1>Залишок</h1></th>
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
                    <td>{this.state.barcodes[barcode].buy_price}</td>
                    <td>{this.state.barcodes[barcode].sell_price}</td>
                    <td>{this.state.barcodes[barcode].quantity}</td>
                    <td>{this.productSum('barcodes', barcode)} грн</td>
                    <td>
                      <ButtonToggle color="success" size="sm" onClick={() => this.editBarcode(barcode)}>Додати</ButtonToggle>
                      <ButtonToggle color="danger" size="sm" onClick={() => this.cancelBarcode(barcode)}>Скасувати</ButtonToggle>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          { (this.state.openedModal.length > 0 && this.state.openedModal != 'productSearchModal') &&
            <Modal isOpen={this.state.openedModal.length > 0} toggle={() => this.handleModal('')} size="lg">
              <div className='container'>
                <ModalHeader>{this.state.openedModal === 'productModal' ? 'Редагувати приход продукту' : 'Додати приход продукту'}</ModalHeader>
                <div className='row'>
                  <div className='col-12'>
                    <FormGroup>
                      <Label for={`category_${this.state.openedModal}`}>Група</Label>
                      <Input type="select" name="category" id={`category_${this.state.openedModal}`}
                             defaultValue={this.state[this.state.openedModal].category_id}
                             onChange={(e) => this.handleInputChange(this.state.openedModal,'category_id', e.target.value)}>
                        <option key={0} value=' '>Вибрати групу</option>
                        { Object.values(this.state.categories).map((category) => {
                          return <option key={category.id} value={category.id}>{category.name}</option>
                        })}
                      </Input>
                      <i onClick={() => this.setState({createCategory: true})} className="fa fa-plus"> Додати групу</i>
                    </FormGroup>
                    { this.state.createCategory &&
                      <div className='category-create'>
                        <h5>Створити нову групу</h5>
                        <div className='row'>
                          <div className='col-6'>
                            <FormGroup>
                              <Label for='categoryName'>Назва групи</Label>
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
                          <ButtonToggle color="success" onClick={this.submitCategory}>Створити групу</ButtonToggle>
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
                  <div className='col-6'>
                    <FormGroup>
                      <Label for={`name_${this.state.openedModal}`}>Назва продукту</Label>
                      <Input type='text' id={`name_${this.state.openedModal}`} value={this.state[this.state.openedModal].name}
                             onChange={(e) => this.handleInputChange(this.state.openedModal,'name', e.target.value)}/>
                    </FormGroup>
                  </div>
                  <div className='col-6'>
                    <FormGroup>
                      <Label for={`due_date_${this.state.openedModal}`}>Дата придатності</Label>
                      <AirBnbPicker
                        single={true}
                        onPickerApply={this.handleDateChange}
                        date={this.state[this.state.openedModal].due_date}
                      />
                    </FormGroup>
                  </div>
                  <div className='col-4'>
                    <FormGroup>
                      <Label for={`buy_price_${this.state.openedModal}`}>Закупка</Label>
                      <Input type='number' id={`buy_price_${this.state.openedModal}`} value={this.state[this.state.openedModal].buy_price}
                             onChange={(e) => this.handleInputChange(this.state.openedModal,'buy_price', e.target.value)}/>
                    </FormGroup>
                  </div>
                  <div className='col-4'>
                    <FormGroup>
                      <Label for={`sell_price_${this.state.openedModal}`}>Ціна</Label>
                      <Input type='number' id={`sell_price_${this.state.openedModal}`}
                             value={this.state[this.state.openedModal].sell_price}
                             onChange={(e) => this.handleInputChange(this.state.openedModal,'sell_price', e.target.value)}/>
                    </FormGroup>
                  </div>
                  <div className='col-4'>
                    <FormGroup>
                      <Label for={`quantity_${this.state.openedModal}`}>Приход кількість</Label>
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
                            <ButtonToggle size='sm' color="success" disabled={this.restrictAdding(product.barcode)} onClick={() => this.addProduct(product.id)}>Додати</ButtonToggle>
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
