class Product < ApplicationRecord
  belongs_to :category
  has_many :product_actions
  has_many :actions, through: :product_actions

  has_attached_file :picture, styles: { medium: '300x300>', large: '600x600>' }
  validates_attachment_content_type :picture, content_type: /\Aimage\/.*\z/

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

  def get_quantity
    last_version = versions.last
    incoming_actions = product_actions.incoming.after_time(last_version.created_at - 1.second).sum(:quantity)
    expense_actions = product_actions.expense.after_time(last_version.created_at).sum(:quantity)
    sell_actions = product_actions.sell.after_time(last_version.created_at).sum(:quantity)
    self.quantity + incoming_actions - expense_actions - sell_actions
  end

  private

  def capitalize_name
    self.name = self.name.capitalize
  end
end