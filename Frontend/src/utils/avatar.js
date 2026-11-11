import { API_BASE } from "./api";
// Fallback avatars from reliable CDNs
const FALLBACK_AVATAR =
  "https://ui-avatars.com/api/?background=0D8ABC&color=fff";
const DEFAULT_AVATAR = "/default-avatar.svg";

export const getProfilePicUrl = (profilePic) => {
  if (!profilePic) {
    return DEFAULT_AVATAR;
  }

  if (profilePic.startsWith("/uploads/")) {
    return `${API_BASE}${profilePic}`;
  }

  return profilePic;
};

export const handleAvatarError = (e) => {
  e.target.onerror = null; // Prevent infinite loop
  if (e.target.src === DEFAULT_AVATAR) {
    // If default avatar fails, use the fallback
    e.target.src = FALLBACK_AVATAR;
  } else {
    // If original image fails, try default avatar first
    e.target.src = DEFAULT_AVATAR;
  }
};
