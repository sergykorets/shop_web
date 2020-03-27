class ProductsController < ApplicationController
  before_action :set_paper_trail_whodunnit, only: [:create, :update]

  def index
    @products = Product.all
  end

  def create
    product = if p = Product.find_by_id(product_params[:id])
      p.quantity += product_params[:quantity].to_i
      p
    else
      Product.new(product_params)
    end
    if product.save
      render json: {success: true, product: {
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        quantity: product.versions.last.changeset['quantity'].last - (product.versions.last.changeset['quantity'].first || 0)}
      }
    else
      render json: {success: false}
    end
  end

  def update
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
          quantity: product_params[:quantity]}
      }
    else
      render json: {success: false}
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
    params.require(:product).permit(:id, :barcode, :name, :quantity)
  end
end