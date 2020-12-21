import React, {Fragment} from 'react';
import {ActionCable, ActionCableProvider} from 'react-actioncable-provider';
import { Modal, ModalHeader, FormGroup, Label, Input, ButtonToggle, Tooltip } from 'reactstrap';
import Pagination from "react-js-pagination";
import ReactLoading from 'react-loading';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import AirBnbPicker from '../common/AirBnbPicker';
import FileDrop from '../common/FileDrop';
import Table from '../common/table';

export default class Products extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      products: this.props.products,
      categories: this.props.categories,
      openedModal: '',
      activePage: 1,
      count: this.props.count,
      per: this.props.per,
      createCategory: false,
      tooltips: {},
      category: {
        name: '',
        multiplier: 1
      },
      sort: {
        field: '',
        descending: true
      },
      productModal: {
        id: '',
        index: '',
        barcode: '',
        name: '',
        quantity: '',
        category_id: '',
        buy_price: '',
        sell_price: '',
        due_date: null,
        picture: '',
      },
      productSearch: {
        barcode: '',
        name: '',
        category_id: ''
      },
      photoLoading: false,
    };
  }

  handleModal = (modal) => {
    this.setState({
      ...this.state,
      openedModal: modal
    })
  };

  handleReceivedBarcode = (response) => {
    if (response.product) {
      this.setState({
        ...this.state,
        openedModal: 'productModal',
        productModal: Object.assign(response.product, {category_id: response.product.category.id})
      });
    } else {
      NotificationManager.error('Товар не знайдено');
    }
  };

  handleInputChange = (type, field, value) => {
    this.setState({
      ...this.state,
      [type]: {
        ...this.state[type],
        [field]: value
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

  handleDateChange = ({date}) => {
    this.setState({
      ...this.state,
      [this.state.openedModal]: {
        ...this.state[this.state.openedModal],
        due_date: date ? date.format('DD.MM.YYYY') : null
      }
    })
  };

  onSort = (field) => {
    const descending = this.state.sort.field === field ? !this.state.sort.descending : this.state.sort.descending
    $.ajax({
      url: '/products/search.json',
      type: 'POST',
      data: {
        barcode: this.state.productSearch.barcode,
        name: this.state.productSearch.name,
        category_id: this.state.productSearch.category_id,
        index: true,
        sort: field,
        descending: descending,
        page: this.state.activePage
      },
      success: (resp) => {
        if (resp.success) {
          this.setState({
            ...this.state,
            products: resp.products,
            sort: {
              field: field,
              descending: descending
            }
          });
        } else {
          NotificationManager.error(resp.error, "Неможливо зробити дію");
        }
      }
    });
  };

  handlePageChange = (page) => {
    $.ajax({
      url: '/products/search.json',
      type: 'POST',
      data: {
        barcode: this.state.productSearch.barcode,
        name: this.state.productSearch.name,
        category_id: this.state.productSearch.category_id,
        index: true,
        sort: this.state.sort.field,
        descending: this.state.sort.descending,
        page: page
      },
      success: (resp) => {
        this.setState({
          ...this.state,
          products: resp.products,
          activePage: page,
          count: resp.count
        });
      }
    });
  };

  editProduct = (product, index) => {
    this.setState({
      ...this.state,
      openedModal: 'productModal',
      productModal: Object.assign(product, {index: index, category_id: product.category.id})
    })
  };

  onDrop = (name, file) => {
    if (file.length > 0) {
      this.setState({photoLoading: true});
      const formData = new FormData();
      formData.append('product[picture]', file[0], file[0].name);
      $.ajax({
        url: `/products/${this.state.productModal.id}.json`,
        type: 'PATCH',
        data: formData,
        dataType: 'json',
        cache: false,
        processData: false,
        contentType: false,
        success: (resp) => {
          if (resp.success) {
            let products = this.state.products;
            products[this.state.productModal.index] = resp.product;
            this.setState({
              ...this.state,
              photoLoading: false,
              products: products,
              productModal: {
                ...this.state.productModal,
                picture: resp.product.picture
              }
            });
            NotificationManager.success('Фото збережене');
          } else {
            NotificationManager.error(resp.error, "Неможливо зробити дію");
          }
        }
      })
    }
  };

  deletePicture = () => {
    $.ajax({
      url: `/products/${this.state.productModal.id}/destroy_picture.json`,
      type: 'DELETE',
      success: (resp) => {
        if (resp.success) {
          this.setState({
            ...this.state,
            productModal: {
              ...this.state.productModal,
              picture: ''
            }
          });
          NotificationManager.success('Фото видалено');
        } else {
          NotificationManager.error(resp.error, "Неможливо зробити дію");
        }
      }
    })
  };

  handleProductSearch = (field, v) => {
    if (v.length > 0 || this.state.productSearch.name.length > 0 || this.state.productSearch.barcode.length > 0 || this.state.productSearch.category_id.length > 0) {
      let parameters = {index: true, sort: this.state.sort.field, descending: this.state.sort.descending};
      if (field === 'barcode') {
        parameters[field] = v;
        parameters['name'] = this.state.productSearch.name;
        parameters['category_id'] = this.state.productSearch.category_id;
      } else if (field === 'category_id') {
        parameters[field] = v;
        parameters['name'] = this.state.productSearch.name;
        parameters['barcode'] = this.state.productSearch.barcode;
      } else {
        parameters[field] = v;
        parameters['barcode'] = this.state.productSearch.barcode;
        parameters['category_id'] = this.state.productSearch.category_id;
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
              count: resp.count,
              productSearch: {
                ...this.state.productSearch,
                [field]: v
              }
            });
          } else {
            this.setState({
              ...this.state,
              products: [],
              count: 0,
              productSearch: {
                ...this.state.productSearch,
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
        productSearch: {
          ...this.state.productSearch,
          count: 0,
          [field]: v
        },
      });
    }
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

  submitProduct = (modal) => {
    $.ajax({
      url: `/products/${this.state.productModal.id}.json`,
      type: 'PATCH',
      data: {
        product: {
          id: this.state[this.state.openedModal].id,
          barcode: this.state[this.state.openedModal].barcode,
          name: this.state[this.state.openedModal].name,
          category_id: this.state[this.state.openedModal].category_id,
          sell_price: this.state[this.state.openedModal].sell_price,
          due_date: this.state[this.state.openedModal].due_date
        }
      }
    }).then((resp) => {
      if (resp.success) {
        let products = this.state.products;
        products[this.state.productModal.index] = resp.product;
        this.setState({
          ...this.state,
          openedModal: '',
          products: products,
          [modal]: {
            id: '',
            index: '',
            barcode: '',
            name: '',
            quantity: 1,
            category_id: this.state.categories[0].id,
            buy_price: '',
            sell_price: '',
            due_date: null
          }
        });
        NotificationManager.success('Товар змінено');
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
      <ActionCableProvider url={`wss://${location.host}/cable`}>
        <ActionCable
          channel='BarcodesChannel'
          onReceived={(data) => this.shouldScanResponse(data) ? this.handleReceivedBarcode(data) : ''}
        />
        <NotificationContainer/>
        <div className='container page-content' style={{color: 'black'}}>
          <div className='row'>
            <div className='col-4'>
              <FormGroup>
                <Label for='barcode'>Баркод</Label>
                <Input type='search' id='barcode' value={this.state.productSearch.barcode}
                       onChange={(e) => this.handleProductSearch('barcode', e.target.value)}/>
              </FormGroup>
            </div>
            <div className='col-4'>
              <FormGroup>
                <Label for='name'>Назва товару</Label>
                <Input type='search' id='name' value={this.state.productSearch.name}
                       onChange={(e) => this.handleProductSearch('name', e.target.value)}/>
              </FormGroup>
            </div>
            <div className='col-4'>
              <FormGroup>
                <Label for='category'>Група</Label>
                <Input type="select" name="category" id='category'
                       defaultValue={this.state.productSearch.category_id}
                       onChange={(e) => this.handleProductSearch('category_id', e.target.value)}>
                  <option key={0} value=' '>Всі товари</option>
                  { this.state.categories.map((category) => {
                    return <option key={category.id} value={category.id}>{category.name}</option>
                  })}
                </Input>
              </FormGroup>
            </div>
          </div>
          <Table properties={
            [ {barcode: 'Баркод'},
              {name: 'Назва'},
              {category: 'Група'},
              {buy_price: 'Закупівля', sort: true, icon: '₴'},
              {sell_price: 'Ціна', sort: true, icon: '₴'},
              {quantity: 'Залишок', sort: true},
              {due_date: 'Придатність', sort: true}]}
            items={this.state.products}
            onSort={this.onSort}
            toggleToolptip={this.toggleToolptip}
            tooltips={this.state.tooltips}
            actions={[{action: this.editProduct, name: 'Редагувати', color: 'warning'}]}
          />
          { this.state.count > this.state.per ?
            <Fragment>
              <br/>
              <div className='paginator'>
                <Pagination
                  activePage={this.state.activePage}
                  itemsCountPerPage={this.state.per}
                  totalItemsCount={this.state.count}
                  pageRangeDisplayed={9}
                  onChange={this.handlePageChange}
                />
                <span className='ml-auto'>Всього: {this.state.count}</span>
              </div>
            </Fragment>
            :
            <Fragment>
              <br/>
              <span className='ml-auto'>Всього: {this.state.count}</span>
            </Fragment>
          }
          <br/>
          { (this.state.openedModal.length > 0) &&
          <Modal isOpen={this.state.openedModal.length > 0} toggle={() => this.handleModal('')} size="lg">
            <div className='container'>
              <ModalHeader>Редагувати товар</ModalHeader>
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
                <div className='col-4'>
                  <FormGroup>
                    <Label for={`name_${this.state.openedModal}`}>Назва товару</Label>
                    <Input type='text' id={`name_${this.state.openedModal}`} value={this.state[this.state.openedModal].name}
                           onChange={(e) => this.handleInputChange(this.state.openedModal,'name', e.target.value)}/>
                  </FormGroup>
                </div>
                <div className='col-4'>
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
                    <Label for={`sell_price_${this.state.openedModal}`}>Ціна</Label>
                    <Input type='number' id={`sell_price_${this.state.openedModal}`}
                           value={this.state[this.state.openedModal].sell_price}
                           onChange={(e) => this.handleInputChange(this.state.openedModal,'sell_price', e.target.value)}/>
                  </FormGroup>
                </div>
                <div className='col-12'>
                  <FormGroup>
                    <FileDrop
                      onDrop={this.onDrop}
                      acceptedFiles='image/*'
                      file={this.state.productModal.picture}
                      name='file'
                      placeholder={this.state.productModal.picture && 'Змінити фото'}
                    />
                  </FormGroup>
                  <FormGroup>
                    { this.state.photoLoading ?
                      <div className='loader-wrap'>
                        <ReactLoading type='spin' color='green' height={200} width={200} />
                      </div>
                      :
                      <Fragment>
                        { this.state.productModal.picture &&
                          <div className="card">
                            <div className="card-img">
                              <img src={this.state.productModal.picture} alt={this.state.productModal.name}/>
                            </div>
                            <div className="card-body">
                              <div className='custom-checkbox'>
                              </div>
                              <ButtonToggle color="danger" size="sm" onClick={this.deletePicture}>Видалити фото</ButtonToggle>
                            </div>
                          </div>}
                      </Fragment>}
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
