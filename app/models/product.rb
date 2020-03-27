class Product < ApplicationRecord
  validates_uniqueness_of :barcode
  has_paper_trail only: :quantity, on: [:create, :update], versions: { class_name: 'Version' }
end