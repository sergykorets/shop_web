class ApplicationController < ActionController::Base
  include ApplicationHelper
  protect_from_forgery with: :exception
  skip_before_action :verify_authenticity_token
  before_action :authenticate_user!
  before_action :configure_permitted_parameters, if: :devise_controller?
  PER = 10

  def update_db
    username = Etc.getlogin
    if username == 'serhii'
      usbs = Dir.entries("/media/#{username}").select {|entry| File.directory? File.join("/media/#{username}", entry) and !(entry =='.' || entry == '..' || entry == 'BCEC7AA4EC7A591A'  || entry == 'B22841072840CBD3') }
      if usbs.count > 0
        if File.exist?("/media/#{username}/#{usbs.first}/backup.bak")
          ActiveRecord::Base.remove_connection
          system("dropdb shop_web_development")
          system("createdb shop_web_development")
          system("psql shop_web_development < /media/#{username}/#{usbs.first}/backup.bak")
          ActiveRecord::Base.establish_connection
          render json: {success: true}
        else
          render json: {success: false, error: 'Файлу бази даних немає на флешці'}
        end
      else
        render json: {success: false, error: 'Флешку не вставлено'}
      end
    else
      render json: {success: false, error: "На цьому комп'ютері дані не можна скопіювати з флешки"}
    end
  end

  def copy_db
    username = Etc.getlogin
    if username == 'vandal'
      usbs = Dir.entries("/media/#{username}").select {|entry| File.directory? File.join("/media/#{username}",entry) and !(entry =='.' || entry == '..' || entry == 'BCEC7AA4EC7A591A'  || entry == 'B22841072840CBD3') }
      if usbs.count > 0
        system("pg_dump shop_web_development > /home/#{username}/Projects/backup.bak")
        if File.exist?("/home/#{username}/Projects/backup.bak") && File.ctime("/home/#{username}/Projects/backup.bak").today?
          system("cp /home/#{username}/Projects/backup.bak /media/#{username}/#{usbs.first}")
          if File.exist?("/media/#{username}/#{usbs.first}/backup.bak") && File.ctime("/media/#{username}/#{usbs.first}/backup.bak").today?
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
    else
      render json: {success: false, error: "На цьому комп'ютері дані не можна скопіювати на флешку"}
    end
  end

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name, :email, :password, :password_confirmation, :remember_me])
    devise_parameter_sanitizer.permit(:sign_in, keys: [:name, :email, :password, :password_confirmation, :remember_me])
    devise_parameter_sanitizer.permit(:account_update, keys: [:name, :email, :password, :password_confirmation, :remember_me])
  end
end
