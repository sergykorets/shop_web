class BarcodesChannel < ApplicationCable::Channel
  def subscribed
    stream_from "barcodes_channel"
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end
end
