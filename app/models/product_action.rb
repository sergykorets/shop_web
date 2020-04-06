class ProductAction < ApplicationRecord
  belongs_to :product, optional: true
  belongs_to :action, optional: true

  enum action_type: [:sell, :incoming, :expense]

  before_create :update_product_quantity, if: -> { incoming? && product.versions.last.created_at < Time.now.beginning_of_day }
  before_destroy :check_quantity, if: -> { incoming? }
  before_update :check_product_quantity, if: -> { incoming? && quantity_changed? && (quantity_was > quantity) }

  #has_paper_trail only: :quantity, on: [:create, :update], versions: { class_name: 'Version' }

  scope :after_time, ->(time) { where('created_at >= ?', time) }

  validates_presence_of :buy_price, :sell_price, if: :incoming?
  validates :buy_price, numericality: { greater_than_or_equal_to: 0 }, if: :incoming?
  validates :sell_price, numericality: { greater_than_or_equal_to: :buy_price }, if: :incoming?
  validates :quantity, numericality: { greater_than: 0 }

  validate :check_quantity, if: -> { sell? || expense? }

  private

  def check_product_quantity
    if product.get_quantity + quantity < quantity_was
      self.errors.add(:base, "Залишок продукту не може бути від'ємним")
      throw :abort
    end
  end

  def check_quantity
    if product.get_quantity < quantity
      self.errors.add(:base, "Залишок продукту не може бути від'ємним")
      throw :abort
    end
  end

  def update_product_quantity
    product.update(quantity: product.get_quantity)
  end
end