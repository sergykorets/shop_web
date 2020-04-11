class ActionsController < ApplicationController
  before_action :set_action, only: [:edit, :update]

  def index
    date = params[:date].try(:to_datetime) || DateTime.now
    @actions = Action.all.where("created_at >= ? AND created_at <= ?", date.beginning_of_day, date.end_of_day).order('created_at DESC').map do |action|
      { id: action.id,
        amount: action.amount,
        created_at: action.created_at.strftime("%d.%m.%Y %H:%M"),
        products: action.product_actions.map do |action_product|
          { name: action_product.product.name,
            barcode: action_product.product.barcode,
            category: action_product.product.category.name,
            quantity: action_product.quantity,
            sell_price: action_product.sell_price
          }
        end
      }
    end
    respond_to do |format|
      format.html { render :index }
      format.json {{success: true, actions: @actions}}
    end
  end

  def create
    action = Action.new(user: current_user)
    action.transaction do
      amount = 0
      product_actions = []
      action_params[:products].values.each do |p|
        product = Product.find_by_id(p[:id])
        if p[:quantity].to_d <= 0
          render json: {success: false, error: "Кількість продажі товару '#{product.name}' має бути більшою за 0"}
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
            sell_price: action_product.sell_price,
            picture: action_product.product.picture.present? ? action_product.product.picture : ''
        }
      }
    }
  end

  def update
    if @action.update(action_params)
      render json: {success: true, action: {
        id: @action.id,
        amount: @action.amount,
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

  def destroy
    action = Action.find_by_id(params[:id])
    if action.destroy
      render json: {success: true, actions: Action.all.where("created_at >= ? AND created_at <= ?", DateTime.now.beginning_of_day, DateTime.now.end_of_day).order('created_at DESC').map do |action|
        { id: action.id,
          amount: action.amount,
          created_at: action.created_at.strftime("%d.%m.%Y %H:%M"),
          products: action.product_actions.map do |action_product|
            { name: action_product.product.name,
              barcode: action_product.product.barcode,
              category: action_product.product.category.name,
              quantity: action_product.quantity,
              sell_price: action_product.sell_price
            }
          end
        }
      end}
    else
      render json: {success: false, error: action.errors.full_messages.to_sentence}
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