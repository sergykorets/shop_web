class CreateProducts < ActiveRecord::Migration[5.1]
  def change
    create_table :products do |t|
      t.string :name
      t.text :description
      t.string :barcode
      t.decimal :quantity
      t.decimal :buy_price
      t.decimal :sell_price
      t.integer :category
      t.timestamps
    end
  end
end