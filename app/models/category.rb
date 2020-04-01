class Category < ApplicationRecord
  has_many :products

  validates_presence_of :name, :multiplier
  validates :multiplier, numericality: { greater_than_or_equal_to: 0 }

  before_save :capitalize_name

  private

  def capitalize_name
    self.name = self.name.capitalize
  end
end