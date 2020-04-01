class ProductAction < ApplicationRecord
  belongs_to :product, optional: true
  belongs_to :action, optional: true

  enum action_type: [:sell, :incoming, :expense]

  has_paper_trail only: :quantity, on: [:create, :update], versions: { class_name: 'Version' }

  validates_presence_of :buy_price, :sell_price, if: :incoming?
  validates :buy_price, numericality: { greater_than_or_equal_to: 0 }, if: :incoming?
  validates :sell_price, numericality: { greater_than_or_equal_to: :buy_price }, if: :incoming?
  validates :quantity, numericality: { greater_than_or_equal_to: 0 }, if: :incoming?
end