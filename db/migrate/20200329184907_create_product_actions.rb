class CreateProductActions < ActiveRecord::Migration[5.1]
  def change
    create_table :product_actions do |t|
      t.integer :action_id, index: true
      t.integer :product_id, index: true
      t.integer :action_type
      t.decimal :quantity
      t.decimal :buy_price
      t.decimal :sell_price
      t.timestamps
    end
  end
end
