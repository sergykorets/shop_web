Rails.application.routes.draw do
  root 'products#index'

  mount RailsAdmin::Engine => '/admin', as: 'rails_admin'
  mount ActionCable.server => '/cable'

  devise_for :users, :controllers => { registrations: 'registrations' }
  resources :products

  post '/barcode', to: 'api#barcode'
end