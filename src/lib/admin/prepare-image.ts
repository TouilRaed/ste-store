/**
 * Shrinks an oversized photo in the browser before it is uploaded.
 *
 * The route caps an upload at 4 MB, and the platform in front of it refuses a
 * request body over roughly 4.5 MB before any of our code runs — a phone photo
 * clears both without trying. Resizing here means the person picks a photo and
 * it just works, rather than reading a size error and being sent off to find an
 * image editor.
 */

/** Longest edge kept. A product photo is never shown larger than this. */
const MAX_EDGE = 2000;

/** Anything under this uploads untouched: re-encoding it would only lose detail. */
const PASS_THROUGH_BYTES = 3 * 1024 * 1024;

const SUPPORTED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function prepareImage(file: File): Promise<File> {
  if (SUPPORTED.has(file.type) && file.size <= PASS_THROUGH_BYTES) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // A format the browser cannot decode (HEIC, say). Let the upload run and
    // the server answer with what it does accept.
    return file;
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return file;
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85),
  );
  if (!blob) return file;

  const name = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
}
