class AddDueDateToProducts < ActiveRecord::Migration[5.1]
  def change
    add_column :products, :due_date, :date
  end
end
