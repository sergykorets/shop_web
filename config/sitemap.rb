SitemapGenerator::Sitemap.default_host = "http://www.dragobrat.net"
SitemapGenerator::Sitemap.public_path = 'tmp/'
SitemapGenerator::Sitemap.adapter = SitemapGenerator::S3Adapter.new
SitemapGenerator::Sitemap.sitemaps_host = "http://#{ENV['S3_BUCKET_NAME']}.s3.amazonaws.com/"
SitemapGenerator::Sitemap.sitemaps_path = 'sitemaps/'
SitemapGenerator::Sitemap.adapter = SitemapGenerator::S3Adapter.new(
  fog_provider: 'AWS',
  aws_access_key_id: ENV['AWS_ACCESS_KEY_ID'],
  aws_secret_access_key: ENV['AWS_SECRET_ACCESS_KEY'],
  fog_directory: ENV['S3_BUCKET_NAME'],
  fog_region: ENV['AWS_REGION'])
hotels = Hotel.all
SitemapGenerator::Sitemap.create do
  add '/', :changefreq => 'weekly', :priority => 0.9
  hotels.find_each do |hotel|
    add hotel_path(hotel.slug), changefreq: 'daily', priority: 0.8, lastmod: hotel.updated_at
  end
end