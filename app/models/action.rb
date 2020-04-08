class Action < ApplicationRecord
  has_many :product_actions, dependent: :destroy
  has_many :products, through: :product_actions
  belongs_to :user, optional: true

  accepts_nested_attributes_for :product_actions, allow_destroy: true

  before_update :set_transaction

  def set_transaction
    amount = 0
    product_actions.each do |product_action|
      sell_price = product_action.product.sell_price
      amount += sell_price * product_action.quantity
      product_action.action_type = :sell
      product_action.buy_price = product_action.product.buy_price
      product_action.sell_price = sell_price
    end
    self.amount = amount
  end
end