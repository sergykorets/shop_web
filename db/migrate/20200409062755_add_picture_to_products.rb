class AddPictureToProducts < ActiveRecord::Migration[5.1]
  def change
    add_attachment :products, :picture
  end
end
