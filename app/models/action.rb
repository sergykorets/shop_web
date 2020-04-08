class Action < ApplicationRecord
  has_many :product_actions, dependent: :destroy
  has_many :products, through: :product_actions
  belongs_to :user, optional: true

  accepts_nested_attributes_for :product_actions, allow_destroy: true

  before_update :set_transaction
  before_destroy :check_today

  validate :check_today, on: :update

  private

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

  def check_today
    if created_at.to_date != Date.today
      self.errors.add(:base, "Неможливо змінити не сьогоднішні транзакції")
      throw :abort
    end
  end
end