import React, {Fragment} from 'react';
import { Modal, ModalHeader, FormGroup, Label, Input, ButtonToggle } from 'reactstrap';
import Pagination from "react-js-pagination";
import {NotificationContainer, NotificationManager} from 'react-notifications';
import AirBnbPicker from '../common/AirBnbPicker';

export default class Products extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      actions: this.props.actions,
      openedModal: '',
      activePage: 1,
      count: this.props.count,
      per: this.props.per,
      sort: {
        field: '',
        descending: true
      },
      actionModal: {
        id: '',
        amount: '',
        products: []
      },
      productSearch: {
        barcode: '',
        name: '',
        category_id: ''
      }
    };
  }

  render() {
    console.log(this.state)
    return (
      <div className='container' style={{marginTop: 100+'px', color: 'black'}}>
        <NotificationContainer/>
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
        <table className='dark' style={{marginTop: 20 + 'px'}}>
          <thead>
          <tr>
            <th><h1>ID</h1></th>
            <th style={{cursor: 'pointer'}} onClick={() => this.onSort('buy_price')}><h1>Сума</h1></th>
            <th><h1>Товари</h1></th>
            <th><h1>Дії</h1></th>
          </tr>
          </thead>
          <tbody>
          { this.state.actions.map((action, i) => {
            return (
              <tr key={i}>
                <td>{action.id}</td>
                <td>{action.amount}</td>
                <td>{action.products.length}</td>
                <td>
                  <ButtonToggle color="success" size="sm" onClick={() => this.editProduct(action, i)}>Деталі</ButtonToggle>
                  <ButtonToggle color="danger" size="sm" onClick={() => this.editProduct(action, i)}>Скасувати</ButtonToggle>
                </td>
              </tr>
            )
          })}
          </tbody>
        </table>
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
            </div>
            <FormGroup>
              <ButtonToggle color="secondary" onClick={() => this.handleModal('')}>Відміна</ButtonToggle>
              <ButtonToggle color="success" disabled={this.state.createCategory}
                            onClick={() => this.submitProduct(this.state.openedModal)}>Зберегти</ButtonToggle>
            </FormGroup>
          </div>
        </Modal>}
      </div>
    );
  }
}
