class ActionsController < ApplicationController

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
      render json: {success: true, amount: action.amount}
    else
      render json: {success: false, error: action.errors.full_messages.to_sentence}
    end
  end

  private

  def action_params
    params.require(:transaction).permit(products: [:id, :quantity])
  end
end