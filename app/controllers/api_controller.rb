class ApiController < ActionController::Base

  def barcode
    product = Product.find_by_barcode(params[:barcode])
    ActionCable.server.broadcast 'barcodes_channel', {message: params[:barcode], device: params[:device],
      product: product && {
        id: product.id,
        name: product.name,
        quantity: product.get_quantity,
        barcode: product.barcode,
        buy_price: product.buy_price,
        sell_price: product.sell_price,
        due_date: product.due_date&.strftime("%d.%m.%Y"),
        picture: product.picture.present? ? product.picture : '',
        category: product.category && {
          id: product.category.id,
          name: product.category.name,
          multiplier: product.category.multiplier
        }
      }
    }
    render json: {success: true}
  end
end