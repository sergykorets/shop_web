class Product < ApplicationRecord
  belongs_to :category

  validates_uniqueness_of :barcode
  validates_presence_of :name, :buy_price, :sell_price, :barcode, :category
  validates :buy_price, numericality: { greater_than: 0 }
  validates :sell_price, numericality: { greater_than: :buy_price }
  validates :quantity, numericality: { greater_than_or_equal_to: 0 }

  has_paper_trail only: :quantity, on: [:create, :update], versions: { class_name: 'Version' }
end