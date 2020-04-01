Rails.application.routes.draw do
  root 'pages#sell'

  mount RailsAdmin::Engine => '/admin', as: 'rails_admin'
  mount ActionCable.server => '/cable'

  devise_for :users, :controllers => { registrations: 'registrations' }
  resources :products do
    collection do
      post :search
      get :expense
    end
  end
  resources :product_actions, only: [:update, :create, :destroy]
  resources :categories, only: :create
  resources :actions, only: :create
  get '/sell', to: 'pages#sell'

  post '/barcode', to: 'api#barcode'
end