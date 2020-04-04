class ApplicationController < ActionController::Base
  include ApplicationHelper
  protect_from_forgery with: :exception
  skip_before_action :verify_authenticity_token
  before_action :authenticate_user!
  before_action :configure_permitted_parameters, if: :devise_controller?

  def update_db
  end

  def copy_db
    usbs = Dir.entries('/media/vandal').select {|entry| File.directory? File.join('/media/vandal',entry) and !(entry =='.' || entry == '..') }
    if usbs.count > 0
      system("pg_dump shop_web_development > /home/vandal/Projects/backup.bak")
      if File.exist?("/home/vandal/Projects/backup.bak") && File.ctime("/home/vandal/Projects/backup.bak").today?
        system("cp /home/vandal/Projects/backup.bak /media/vandal/#{usbs.first}")
        if File.exist?("/media/vandal/#{usbs.first}/backup.bak")
          render json: {success: true}
        else
          render json: {success: false, error: 'Файл незаписаний на флешку, спробуйте записати файл вручну'}
        end
      else
        render json: {success: false, error: 'Дамп не зроблено'}
      end  
    else
      render json: {success: false, error: 'Флешку не вставлено'}
    end
  end

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name, :email, :password, :password_confirmation, :remember_me])
    devise_parameter_sanitizer.permit(:sign_in, keys: [:name, :email, :password, :password_confirmation, :remember_me])
    devise_parameter_sanitizer.permit(:account_update, keys: [:name, :email, :password, :password_confirmation, :remember_me])
  end
end
