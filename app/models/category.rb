class Category < ApplicationRecord
  has_many :products

  validates_presence_of :name, :multiplier
  validates :multiplier, numericality: { greater_than_or_equal_to: 0 }
end