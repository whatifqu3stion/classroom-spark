import { HOMEBASE_PHOTO_DATA_LIMIT } from "@workspace/api-zod";

export async function prepareHomebasePhoto(file: File): Promise<string> {
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("Choose a photo under 20 MB.");
  }
  const source = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = source;
    try {
      await image.decode();
    } catch {
      throw new Error("This photo couldn’t be opened. Try a JPEG, PNG, or WebP copy.");
    }
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser couldn’t prepare the photo.");
    // Re-encode pixels only. This also strips camera metadata and keeps board saves small.
    for (const longestEdge of [1600, 1200, 900, 640, 400]) {
      const scale = Math.min(1, longestEdge / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const photo = canvas.toDataURL("image/jpeg", 0.84);
      if (photo.startsWith("data:image/jpeg;base64,") && photo.length <= HOMEBASE_PHOTO_DATA_LIMIT) return photo;
    }
    throw new Error("This photo couldn’t fit on the board. Try a smaller copy.");
  } finally {
    URL.revokeObjectURL(source);
  }
}
