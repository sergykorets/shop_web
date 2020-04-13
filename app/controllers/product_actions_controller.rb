class ProductActionsController < ApplicationController
  before_action :set_paper_trail_whodunnit, only: [:update, :create]

  def index
    @products = ProductAction.joins(:product).where(product_actions: {action_type: params[:action_type]}).where("product_actions.created_at >= ? AND product_actions.created_at <= ?", params[:date].to_datetime.beginning_of_day, params[:date].to_datetime.end_of_day).each_with_object({}) { |product_action, hash|
      if params[:action_type] == 'incoming'
        hash[product_action.product.id] = {
            id: product_action.product.id,
            product_action_id: product_action.id,
            name: product_action.product.name,
            product_quantity: product_action.product.get_quantity,
            quantity: product_action.quantity,
            barcode: product_action.product.barcode,
            buy_price: product_action.buy_price,
            sell_price: product_action.sell_price,
            due_date: product_action.product.due_date&.strftime("%d.%m.%Y"),
            category: {
                id: product_action.product.category.id,
                name: product_action.product.category.name,
                multiplier: product_action.product.category.multiplier
            }
        }
      else
        hash[product_action.product.id] = {
            id: product_action.product.id,
            product_action_id: product_action.id,
            name: product_action.product.name,
            quantity: product_action.product.get_quantity,
            quantity_expense: product_action.quantity,
            barcode: product_action.product.barcode,
            sell_price: product_action.sell_price,
            category: product_action.product.category.name
        }
      end
    }
    render json: {success: true, products: @products}
  end

  def create
    if product_action_params[:quantity].to_d <= 0
      render json: {success: false, error: 'Кількість списання має бути більшою за 0'}
    else
      product = Product.find_by_id(params[:product][:id])
      product_action = ProductAction.new(
          product_action_params.merge(action_type: :expense, product_id: params[:product][:id],
                                      buy_price: product.buy_price, sell_price: product.sell_price))
      if product_action.save
        render json: {success: true, product: {
            id: product.id,
            product_action_id: product_action.id,
            barcode: product.barcode,
            name: product.name,
            category: product.category.name,
            sell_price: product.sell_price,
            quantity: product.get_quantity,
            quantity_expense: product_action.quantity
        }}
      else
        render json: {success: false, error: product_action.errors.full_messages.to_sentence}
      end
    end
  end

  def update
    if product_action_params[:quantity].to_d < 0
      render json: {success: false, error: 'Кількість має бути більшою або бути 0'}
    else
      product_action = ProductAction.find_by_id(params[:id])
      product = product_action.product
      sell_price = product_action_params[:sell_price]
      unless sell_price.present?
        category_multiplier = Category.find_by_id(product_action_params[:category_id]).multiplier
        sell_price = product_action_params[:buy_price].to_d * category_multiplier
      end
      if product_action.update(buy_price: product_action_params[:buy_price], sell_price: sell_price,
                               quantity: product_action_params[:quantity_expense] || product_action_params[:quantity])
        if product.update(product_action_params.merge(sell_price: sell_price).except(:quantity, :quantity_expense))
          render json: {success: true, product: {
            id: product.id,
            product_action_id: product_action.id,
            name: product.name,
            barcode: product.barcode,
            quantity: product_action.quantity,
            quantity_expense: product_action.quantity,
            product_quantity: product.get_quantity,
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
      else
        render json: {success: false, error: product_action.errors.full_messages.to_sentence}
      end
    end
  end

  def destroy
    product_action = ProductAction.find_by_id(params[:id])
    if product_action.destroy
      render json: {success: true}
    else
      render json: {success: false, error: product_action.errors.full_messages.to_sentence}
    end
  end

  private

  def product_action_params
    params.require(:product).permit(:barcode, :name, :quantity, :quantity_expense, :buy_price, :sell_price, :category_id, :due_date)
  end
end