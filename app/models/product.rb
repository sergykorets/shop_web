class Product < ApplicationRecord
  belongs_to :category
  has_many :product_actions
  has_many :actions, through: :product_actions

  validates_uniqueness_of :barcode
  validates_presence_of :name, :buy_price, :sell_price, :barcode, :category
  validates :buy_price, numericality: { greater_than_or_equal_to: 0 }
  validates :sell_price, numericality: { greater_than_or_equal_to: :buy_price }
  validates :quantity, numericality: { greater_than_or_equal_to: 0 }

  has_paper_trail only: :quantity, on: [:create, :update], versions: { class_name: 'Version' }

  scope :by_barcode, ->(barcode) { where("barcode LIKE ?", "#{barcode}%") if barcode.present? }
  scope :by_name, ->(name) { where("name ILIKE ?", "#{name}%") if name.present? }
  scope :by_category, ->(category_id) { where(category_id: category_id) if category_id.present? }

  before_save :capitalize_name

  private

  def capitalize_name
    self.name = self.name.capitalize
  end
end