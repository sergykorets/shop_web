class RegistrationsController < Devise::RegistrationsController

  protected

  def update_resource(resource, params)
    resource.update_without_password(params.except("current_password"))
  end

  private

  def sign_up_params
    params.require(:user).permit(:name, :email, :password, :password_confirmation, :remote_avatar_url, :avatar)
  end

  def account_update_params
    params.require(:user).permit(:name, :email, :avatar, :password, :password_confirmation, :remote_avatar_url)
  end
end