import React, {Fragment} from 'react';
import { Input, ButtonToggle, Tooltip } from 'reactstrap';

export default class Table extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      style: { transform: 'translateY(0px)' }
    };
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  handleScroll = () => {
    const $navbar = $('.navbar');
    let tableOffset = '';
    if (this.props.itemType) {
      tableOffset = $(`#${this.props.itemType}`).offset().top
    } else {
      tableOffset = $('.dark').offset().top;
    }
    let navOffset = $navbar.offset().top, distance = (tableOffset - navOffset);
    let itemTranslate = navOffset - tableOffset + $navbar.height();
    if (distance < $navbar.height()) {
      this.setState({...this.state,
        style: { transform: `translateY(${itemTranslate}px)` }
      });
    } else {
      this.setState({...this.state,
        style: { transform: `translateY(0px)` }
      });
    }
  };

  isObject = (a) => {
    return (!!a) && (a.constructor === Object);
  };

  tableCell = (property, itemIndex) => {
    if (property['input']) {
      return <Input type='number' id={`quantity_${itemIndex}`}
        value={this.props.items[itemIndex].quantity_sell}
        onChange={(e) => this.props.handleInputChange('quantity_sell', this.props.items[itemIndex].id, e.target.value)}
        className='quantity-sell'
        min={0}
        max={this.maxInput(itemIndex)}
      />
    } else if (property['action']) {
      if (this.props.itemType) {
        if (this.props.itemType == 'barcodes') {
          return this.props[property['action']](this.props.itemType, this.props.items[itemIndex].barcode);
        } else {
          return this.props[property['action']](this.props.itemType, this.props.items[itemIndex].id);
        }
      } else {
        return this.props[property['action']](this.props.items[itemIndex].id);
      }
    } else if (this.isObject(this.props.items[itemIndex][Object.keys(property)[0]])) {
      return this.props.items[itemIndex][Object.keys(property)[0]].name;
    } else {
      return this.props.items[itemIndex][Object.keys(property)[0]];
    }
  };

  maxInput = (itemIndex) => {
    if (this.props.items[itemIndex].product_action_id) {
      return parseFloat(this.props.items[itemIndex].quantity_previous) + parseFloat(this.props.items[itemIndex].quantity);
    } else {
      return this.props.items[itemIndex].quantity;
    }
  };

  render() {
    return (
      <table id={this.props.itemType} className='dark' style={{marginTop: 20 + 'px'}}>
        <thead style={this.state.style}>
        <tr>
          { this.props.properties.map((property, i) => {
            return (
              <Fragment key={i}>
                { property['sort'] ?
                  <th style={{cursor: 'pointer'}} onClick={() => this.props.onSort(Object.keys(property)[0])}><h1>{Object.values(property)[0]}</h1></th>
                  :
                  <th><h1>{Object.values(property)[0]}</h1></th>}
              </Fragment>
            )
          })}
          {this.props.actions && <th><h1>Дії</h1></th>}
        </tr>
        </thead>
        <tbody>
        { this.props.items.map((item, i) => {
          return (
            <Fragment key={i}>
              <tr>
                {this.props.properties.map((property, index) => {
                  return (
                    <td key={index} id={this.props.tooltips && Object.keys(property)[0] === 'barcode' ? `TooltipExample${i}` : i}>
                      {this.tableCell(property, i)}{this.tableCell(property, i) && property['icon'] ? <span className='uah'>{property['icon']}</span> : ''}
                    </td>
                  )
                })}
                { this.props.actions &&
                  <td>
                    {this.props.actions.map((action, iterator) => {
                      return (
                        <ButtonToggle key={iterator} color={action.color} size="sm" onClick={() => this.props[action.action(item, i)]}>{action.name}</ButtonToggle>
                      )
                    })}
                  </td>}
              </tr>
              {this.props.tooltips &&
                <Tooltip placement="bottom" isOpen={this.props.tooltips[i]} target={`TooltipExample${i}`}
                         toggle={() => this.props.toggleToolptip(i)}>
                  <img style={{width: 300 + 'px'}} src={item.picture}/>
                </Tooltip>}
            </Fragment>
          )
        })}
        </tbody>
      </table>
    );
  }
}
