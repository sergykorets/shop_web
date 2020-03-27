namespace :db do
  task :sitemap => [ :environment ] do
    sudo bundle exec 'config/sitemap.rb'
  end
end
