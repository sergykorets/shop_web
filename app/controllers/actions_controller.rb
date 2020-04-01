class ActionsController < ApplicationController

  def create
    transaction = Action.new(user: current_user)
    transaction.transaction do
      amount = 0
      action_params[:products].values.each do |p|
        product = Product.find_by_id(p[:id])
        if p[:quantity].to_d <= 0
          render json: {success: false, error: "Кількість продажі продукту '#{product.name}' має бути більшою за 0"}
          return
        end
        transaction.products << product
        transaction.product_actions << ProductAction.new({
            product: product,
            action_type: :sell,
            quantity: p[:quantity],
            sell_price: product.sell_price
        })
        product.update(quantity: product.quantity - p[:quantity].to_d)
        sell_price = product.sell_price
        amount += sell_price * p[:quantity].to_d
      end
      transaction.amount = amount
    end
    if transaction.save
      render json: {success: true, amount: transaction.amount}
    else
      render json: {success: false, error: transaction.errors.full_messages.to_sentence}
    end
  end

  private

  def action_params
    params.require(:transaction).permit(products: [:id, :quantity])
  end
end