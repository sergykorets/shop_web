class ProductsController < ApplicationController
  before_action :set_paper_trail_whodunnit, only: [:create, :update]

  def index
    products = Product.all
    @count = products.count
    @products = products.order('created_at DESC').page(params[:page] || 1).per(PER).map do |product|
      { id: product.id,
        name: product.name,
        quantity: product.get_quantity,
        barcode: product.barcode,
        buy_price: product.buy_price,
        sell_price: product.sell_price,
        due_date: product.due_date&.strftime("%d.%m.%Y"),
        category: product.category && {
          id: product.category.id,
          name: product.category.name,
          multiplier: product.category.multiplier
        }
      }
    end
    @categories = Category.all.map do |category|
      {  id: category.id,
         name: category.name,
         multiplier: category.multiplier}
    end
  end

  def new
    @products = Product.joins(:product_actions).where(product_actions: {action_type: :incoming}).where("product_actions.created_at >= ?", Date.today.beginning_of_day).each_with_object({}) { |product, hash|
      hash[product.id] = {
        id: product.id,
        product_action_id: product.product_actions.incoming.last.id,
        name: product.name,
        product_quantity: product.get_quantity,
        quantity: product.product_actions.incoming.last.quantity,
        barcode: product.barcode,
        buy_price: product.buy_price,
        sell_price: product.sell_price,
        due_date: product.due_date&.strftime("%d.%m.%Y"),
        category: {
          id: product.category.id,
          name: product.category.name,
          multiplier: product.category.multiplier
        }
      }
    }
    @categories = Category.all.map do |category|
      {  id: category.id,
         name: category.name,
         multiplier: category.multiplier}
    end
  end

  def create
    if product_params[:quantity].to_d <= 0
      render json: {success: false, error: 'Кількість має бути більшою за 0'}
    else
      p = Product.find_by_barcode(params[:product][:barcode])
      if p && p.product_actions.where(product_actions: {action_type: :incoming}).where("product_actions.created_at >= ?", Date.today.beginning_of_day).any?
        render json: {success: false, error: 'Редагування приходу продукту доступне у верхній таблиці'}
        return
      end
      buy_price = product_params[:buy_price].to_d
      product = if p
        p.buy_price = buy_price
        p.sell_price = product_params[:sell_price].to_d
        p.name = product_params[:name].present? ? product_params[:name] : p.name
        p.category_id = product_params[:category_id].present? ? product_params[:category_id] : p.category_id
        p.due_date = product_params[:due_date]
        p
      else
        Product.new(product_params.merge(buy_price: buy_price, quantity: 0))
      end
      unless product_params[:sell_price].present?
        category_multiplier = Category.find_by_id(product_params[:category_id])&.multiplier || product.category&.multiplier || 1
        sell_price = buy_price * category_multiplier
        product.sell_price = sell_price
      end
      if product.save
        product_action = ProductAction.create(product_id: product.id, action_type: :incoming, quantity: product_params[:quantity],
                             buy_price: product.buy_price, sell_price: product.sell_price)
        render json: {success: true, product: {
          id: product.id,
          product_action_id: product_action.id,
          name: product.name,
          barcode: product.barcode,
          buy_price: product.buy_price,
          sell_price: product.sell_price,
          due_date: product.due_date&.strftime("%d.%m.%Y"),
          product_quantity: product.get_quantity,
          quantity: product_action.quantity,
          category: {
              id: product.category.id,
              name: product.category.name,
              multiplier: product.category.multiplier}
          }
        }
      else
        render json: {success: false, error: product.errors.full_messages.to_sentence}
      end
    end
  end

  def update
    if product_params[:quantity].to_d < 0
      render json: {success: false, error: 'Кількість має бути більшою або бути 0'}
    else
      product = Product.find_by_id(params[:id])
      if product.update(product_params)
        render json: {success: true, product: {
          id: product.id,
          name: product.name,
          barcode: product.barcode,
          quantity: product.get_quantity,
          buy_price: product.buy_price,
          sell_price: product.sell_price,
          due_date: product.due_date&.strftime("%d.%m.%Y"),
          category: {
              id: product.category.id,
              name: product.category.name,
              multiplier: product.category.multiplier}
          }
        }
      else
        render json: {success: false, error: product.errors.full_messages.to_sentence}
      end
    end
  end

  def expense
    @products = Product.joins(:product_actions).where(product_actions: {action_type: :expense}).where("product_actions.created_at >= ?", Date.today.beginning_of_day).each_with_object({}) { |product, hash|
      hash[product.product_actions.expense.last.id] = {
          id: product.id,
          product_action_id: product.product_actions.expense.last.id,
          name: product.name,
          quantity: product.get_quantity,
          quantity_expense: product.product_actions.expense.last.quantity,
          barcode: product.barcode,
          sell_price: product.sell_price,
          category: product.category.name
      }
    }
    @categories = Category.all.map do |category|
      {  id: category.id,
         name: category.name,
         multiplier: category.multiplier}
    end
  end

  def search
    products = Product.by_barcode(params[:barcode]).by_name(params[:name]).by_category(params[:category_id])
                 .order(params[:sort].present? && params[:sort] != 'quantity' ? "#{params[:sort]} #{ActiveModel::Type::Boolean.new.cast(params[:descending]) ? 'DESC' : 'ASC'}" : 'created_at DESC')
    count = products.count
    if params[:sort] == 'quantity'
      products = products.sort { |a,b|
        ActiveModel::Type::Boolean.new.cast(params[:descending]) ? a.get_quantity <=> b.get_quantity : b.get_quantity <=> a.get_quantity}
    end
    products = if params[:index].present?
      Kaminari.paginate_array(products.to_a).page(params[:page] || 1).per(PER).map do |product|
        { id: product.id,
          name: product.name,
          quantity: product.get_quantity,
          barcode: product.barcode,
          buy_price: product.buy_price,
          sell_price: product.sell_price,
          due_date: product.due_date&.strftime("%d.%m.%Y"),
          category: {
            id: product.category.id,
            name: product.category.name,
            multiplier: product.category.multiplier
          }
        }
      end
    else
      products.first(10).each_with_object({}) { |product, hash|
        hash[product.id] =
          { id: product.id,
            name: product.name,
            quantity: product.get_quantity,
            barcode: product.barcode,
            buy_price: product.buy_price,
            sell_price: product.sell_price,
            due_date: product.due_date&.strftime("%d.%m.%Y"),
            category: {
              id: product.category.id,
              name: product.category.name,
              multiplier: product.category.multiplier
            }
          }
      }
    end
    if products.size > 0
      render json: {success: true, products: products, count: count, per: PER}
    else
      render json: {success: false, error: 'Продукти не знайдено'}
    end
  end

  private

  def product_params
    params.require(:product).permit(:barcode, :name, :quantity, :buy_price, :sell_price, :category_id, :due_date)
  end
end