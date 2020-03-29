class ProductsController < ApplicationController
  before_action :set_paper_trail_whodunnit, only: [:create, :update]

  def index
    @products = Product.all
  end

  def new
    redirect_to root_path unless current_user&.admin?
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
      buy_price = product_params[:buy_price].to_d
      product = if p = Product.find_by_id(product_params[:id])
        p.quantity += product_params[:quantity].to_d
        p.buy_price = buy_price
        p.sell_price = product_params[:sell_price].to_d
        p.name = product_params[:name]
        p.category_id = product_params[:category_id].to_i
        p
      else
        Product.new(product_params.merge(buy_price: buy_price))
      end
      unless product_params[:sell_price].present?
        category_multiplier = Category.find_by_id(product_params[:category_id]).multiplier
        sell_price = buy_price * category_multiplier
        product.sell_price = sell_price
      end
      if product.save
        render json: {success: true, product: {
          id: product.id,
          name: product.name,
          barcode: product.barcode,
          buy_price: product.buy_price,
          sell_price: product.sell_price,
          quantity: product.versions.last.changeset['quantity'].last - (product.versions.last.changeset['quantity'].first || 0),
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
      product.versions.last.destroy if product.versions.last.event != 'create'
      last_version = product.paper_trail.previous_version
      if last_version && product.versions.last.event != 'create'
        p_params = product_params.merge(quantity: last_version.versions.last.changeset['quantity'].last + product_params[:quantity].to_i)
        product = last_version
      else
        p_params = product_params
      end
      if product.update(p_params)
        render json: {success: true, product: {
          id: product.id,
          name: product.name,
          barcode: product.barcode,
          quantity: product_params[:quantity],
          buy_price: product.buy_price,
          sell_price: product.sell_price,
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

  def destroy
    product = Product.find_by_id(params[:id])
    last_version = product.paper_trail.previous_version
    product.versions.last.destroy if product.versions.last.event != 'create'
    if product.update(quantity: last_version.quantity)
      render json: {success: true}
    else
      render json: {success: false}
    end
  end

  private

  def product_params
    params.require(:product).permit(:barcode, :name, :quantity, :buy_price, :sell_price, :category_id)
  end
end