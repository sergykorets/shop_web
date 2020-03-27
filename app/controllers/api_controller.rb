class ApiController < ActionController::Base

  def barcode
    product = Product.find_by_barcode(params[:barcode])
    ActionCable.server.broadcast 'barcodes_channel', {message: params[:barcode], product: product}
    render json: {success: true}
  end
end