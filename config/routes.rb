Rails.application.routes.draw do
  root 'pages#sell'

  mount RailsAdmin::Engine => '/admin', as: 'rails_admin'
  mount ActionCable.server => '/cable'

  devise_for :users, :controllers => { registrations: 'registrations' }
  resources :products
  resources :categories, only: :create
  get '/sell', to: 'pages#sell'

  post '/barcode', to: 'api#barcode'
end