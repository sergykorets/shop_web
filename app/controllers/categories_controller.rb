class CategoriesController < ApplicationController

  def create
    category = Category.new(category_params)
    if category.save
      render json: {success: true, category: category}
    else
      render json: {success: false, error: category.errors.full_messages.to_sentence}
    end
  end

  private

  def category_params
    params.require(:category).permit(:id, :name, :multiplier)
  end
end