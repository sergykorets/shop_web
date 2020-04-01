class PagesController < ApplicationController

  def sell
    @categories = Category.all.map do |category|
      {  id: category.id,
         name: category.name,
         multiplier: category.multiplier}
    end
  end

  private

  def category_params
    params.require(:category).permit(:id, :name, :multiplier)
  end
end