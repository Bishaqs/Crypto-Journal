import { createClient } from "./supabase/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function uploadJournalImage(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Image must be under 5MB");
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Unsupported image type. Use JPEG, PNG, GIF, or WebP.");
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // In demo mode, fall back to base64
    return fileToDataUrl(file);
  }

  const ext = file.name.split(".").pop() ?? "png";
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("journal-images")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    // Storage bucket might not exist yet — fall back to base64
    console.warn("Storage upload failed, falling back to base64:", error.message);
    return fileToDataUrl(file);
  }

  const { data: urlData } = await supabase.storage
    .from("journal-images")
    .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year

  if (!urlData?.signedUrl) {
    return fileToDataUrl(file);
  }

  return urlData.signedUrl;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
