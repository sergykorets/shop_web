class ProductAction < ApplicationRecord
  belongs_to :product
  belongs_to :action, optional: true

  enum action_type: [:sell, :incoming, :expense]

  before_create :update_product_quantity, if: -> { incoming? && product.versions.last.created_at < Time.now.beginning_of_day }
  before_destroy :check_quantity, if: -> { incoming? }
  before_update :check_product_quantity, if: -> { incoming? && quantity_changed? && (quantity_was > quantity) }

  scope :after_time, ->(time) { where('created_at >= ?', time) }

  validates_presence_of :buy_price, :sell_price, if: :incoming?
  validates :buy_price, numericality: { greater_than_or_equal_to: 0 }, if: :incoming?
  validates :sell_price, numericality: { greater_than_or_equal_to: :buy_price }, if: :incoming?
  validates :quantity, numericality: { greater_than: 0 }
  validates_uniqueness_of :product_id, scope: :action_type, conditions: -> { where("DATE(created_at) = ?", Date.today) }, if: -> { incoming? || expense? }

  validate :check_quantity, on: :create, if: -> { sell? || expense? }
  validate :check_product_quantity_on_transaction_update, on: :update, if: -> { action }

  private

  def check_product_quantity
    if product.get_quantity + quantity < quantity_was
      self.errors.add(:base, "Залишок товару не може бути від'ємним")
      throw :abort
    end
  end

  def check_quantity
    if product.get_quantity < quantity
      self.errors.add(:base, "Залишок товару не може бути від'ємним")
      throw :abort
    end
  end

  def check_product_quantity_on_transaction_update
    if product.get_quantity < quantity - quantity_was
      self.errors.add(:base, "Залишок товару не може бути від'ємним")
      throw :abort
    end
  end

  def update_product_quantity
    product.update(quantity: product.get_quantity)
  end
end