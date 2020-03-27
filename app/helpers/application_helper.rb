module ApplicationHelper
  def user_avatar(user)
    if !user.avatar_file_name.nil?
      if controller.action_name = 'edit'
        return current_user.avatar.url(:medium)
      else
        return current_user.avatar.url(:thumb)
      end
    else
      if !current_user.remote_avatar_url.nil?
        return current_user.remote_avatar_url
      else
        return current_user.avatar.url(:thumb)
      end
    end
  end

  def user_review(review)
    User.find_by_id(review.user_id)
  end
end
