class ApiController < ActionController::Base

  def barcode
    product = Product.find_by_barcode(params[:barcode])
    ActionCable.server.broadcast 'barcodes_channel', {message: params[:barcode], product: product && {
        id: product.id,
        name: product.name,
        quantity: product.quantity,
        barcode: product.barcode,
        buy_price: product.buy_price,
        sell_price: product.sell_price,
        category: product.category && {
            id: product.category.id,
            name: product.category.name,
            multiplier: product.category.multiplier
        }
    }}
    render json: {success: true}
  end
end