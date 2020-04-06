class Action < ApplicationRecord
  has_many :product_actions
  has_many :products, through: :product_actions
  belongs_to :user, optional: true

  #before_save :set_product_actions

  def set_product_actions
    binding.pry
    product_actions.where(action_type: nil).destroy_all
  end
end