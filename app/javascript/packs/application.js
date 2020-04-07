import ReactOnRails from 'react-on-rails';
import Products from '../components/Products';
import NewProduct from '../components/Products/new';
import SellPage from '../components/Pages/sell';
import Expense from '../components/Products/expense';
import SystemButtons from '../components/SystemButtons';
import Actions from '../components/Actions';
import EditAction from '../components/Actions/edit';

// This is how react_on_rails can see the HelloWorld in the browser.
ReactOnRails.register({
  Products,
  NewProduct,
  SellPage,
  Expense,
  SystemButtons,
  Actions,
  EditAction
});
