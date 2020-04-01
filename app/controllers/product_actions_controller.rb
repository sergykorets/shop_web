class ProductActionsController < ApplicationController
  before_action :set_paper_trail_whodunnit, only: [:update, :create]

  def create
    if product_action_params[:quantity].to_d <= 0
      render json: {success: false, error: 'Кількість списання має бути більшою за 0'}
    else
      product_action = ProductAction.new(product_action_params.merge(action_type: :expense, product_id: params[:product][:id]))
      if product_action.save
        product = Product.find_by_id(params[:product][:id])
        product.quantity -= product_action.quantity
        if product.save
          render json: {success: true, product: {
              id: product_action.id,
              product_action_id: product.product_actions.expense.last.id,
              barcode: product.barcode,
              name: product.name,
              category: product.category.name,
              sell_price: product.sell_price,
              quantity: product.quantity,
              quantity_expense: product_action.quantity
          }}
        else
          render json: {success: false, error: product.errors.full_messages.to_sentence}
        end
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
      product_action.versions.last.destroy if product_action.versions.last.event != 'create'
      last_version = product_action.paper_trail.previous_version
      quantity = if last_version && product_action.versions.last.event != 'create'
        (last_version.versions.last.changeset['quantity'].last || 0) + product_action_params[:quantity].to_i
      else
        if product.product_actions.where(product_actions: {action_type: :incoming}).where("product_actions.created_at <= ?", Date.today.beginning_of_day).any?
          product.paper_trail.previous_version.versions.where("versions.created_at <= ?", Date.today.beginning_of_day).last.changeset['quantity'].first + product_action_params[:quantity].to_i
        else
          product_action_params[:quantity].to_i
        end
      end
      sell_price = product_action_params[:sell_price]
      unless sell_price.present?
        category_multiplier = Category.find_by_id(product_action_params[:category_id]).multiplier
        sell_price = product_action_params[:buy_price].to_d * category_multiplier
      end
      if product_action.update(buy_price: product_action_params[:buy_price], sell_price: sell_price,
                               quantity: product_action_params[:quantity])
        if product.update(product_action_params.merge(quantity: quantity, sell_price: sell_price))
          render json: {success: true, product: {
            id: product.id,
            product_action_id: product_action.id,
            name: product.name,
            barcode: product.barcode,
            quantity: product_action_params[:quantity],
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
      product = product_action.product
      product.quantity += product_action.quantity
      if product.save
        render json: {success: true}
      else
        render json: {success: false, error: product.errors.full_messages.to_sentence}
      end
    else
      render json: {success: false, error: product_action.errors.full_messages.to_sentence}
    end
  end

  private

  def product_action_params
    params.require(:product).permit(:barcode, :name, :quantity, :buy_price, :sell_price, :category_id, :due_date)
  end
end