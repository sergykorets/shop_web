class ActionsController < ApplicationController
  before_action :set_action, only: [:edit, :update]

  def index
    actions = Action.all
    @count = actions.count
    @per = 10
    @actions = actions.page(params[:page] || 1).each_with_object({}) { |action, hash|
      hash[action.id] = {
        id: action.id,
        amount: action.amount,
        products: action.product_actions.map do |action_product|
          { name: action_product.product.name,
            barcode: action_product.product.barcode,
            category: action_product.product.category.name,
            quantity: action_product.quantity,
            sell_price: action_product.sell_price
          }
        end
      }
    }
  end

  def create
    action = Action.new(user: current_user)
    action.transaction do
      amount = 0
      product_actions = []
      action_params[:products].values.each do |p|
        product = Product.find_by_id(p[:id])
        if p[:quantity].to_d <= 0
          render json: {success: false, error: "Кількість продажі продукту '#{product.name}' має бути більшою за 0"}
          return
        end
        product_actions << ProductAction.new({
            product: product,
            action_type: :sell,
            quantity: p[:quantity],
            buy_price: product.buy_price,
            sell_price: product.sell_price
        })
        sell_price = product.sell_price
        amount += sell_price * p[:quantity].to_d
      end
      action.amount = amount
      action.product_actions = product_actions
    end
    if action.save
      render json: {success: true, action: {id: action.id, amount: action.amount}}
    else
      render json: {success: false, error: action.errors.full_messages.to_sentence}
    end
  end

  def edit
    @categories = Category.all.map do |category|
      {  id: category.id,
         name: category.name,
         multiplier: category.multiplier}
    end
    @transaction = {
      id: @action.id,
      amount: @action.amount,
      previous_amount: @action.amount,
      products: @action.product_actions.each_with_object({}) { |action_product, hash|
        hash[action_product.product_id] = {
            product_action_id: action_product.id,
            id: action_product.product_id,
            name: action_product.product.name,
            barcode: action_product.product.barcode,
            category: { name: action_product.product.category.name },
            quantity: action_product.product.get_quantity,
            quantity_sell: action_product.quantity,
            sell_price: action_product.sell_price
        }
      }
    }
  end

  def update
    if @action.update(action_params)
      render json: {success: true, action: {
        id: @action.id,
        amount: @action.amount,
        previous_amount: @action.amount,
        products: @action.product_actions.each_with_object({}) { |action_product, hash|
          hash[action_product.product_id] = {
              product_action_id: action_product.id,
              id: action_product.product_id,
              name: action_product.product.name,
              barcode: action_product.product.barcode,
              category: { name: action_product.product.category.name },
              quantity: action_product.product.get_quantity,
              quantity_sell: action_product.quantity,
              quantity_previous: action_product.quantity,
              sell_price: action_product.sell_price
          }
        }
      }}
    else
      render json: {success: false, error: @action.errors.full_messages.to_sentence}
    end
  end

  private

  def set_action
    @action = Action.find_by_id(params[:id])
  end

  def action_params
    params.require(:transaction).permit(:amount, products: [:id, :quantity], product_actions_attributes: [:id, :product_id, :quantity, :_destroy])
  end
end