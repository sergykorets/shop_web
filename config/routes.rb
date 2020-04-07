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
  resources :actions, only: [:index, :create, :edit, :update]
  get '/sell', to: 'pages#sell'
  get '/copy_db', to: 'application#copy_db'
  get '/update_db', to: 'application#update_db'

  post '/barcode', to: 'api#barcode'
end