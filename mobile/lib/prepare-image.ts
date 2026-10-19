import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

/**
 * Turns a photo straight out of the gallery into something the upload route
 * will take.
 *
 * Two things stood between a phone photo and the shop. A picture taken on an
 * iPhone is HEIC, which the route rejects outright, and a full-resolution
 * photo of either platform regularly runs past the size the upload accepts —
 * so picking a photo failed with no useful explanation. Re-encoding to a JPEG
 * no wider than 1600px settles both, and 1600 is already more than the
 * storefront ever displays.
 */
const MAX_EDGE = 1600;

export type PickedImage = {
  uri: string;
  name: string;
  type: string;
};

export async function prepareImage(asset: {
  uri: string;
  width?: number | null;
  height?: number | null;
  fileName?: string | null;
}): Promise<PickedImage> {
  const name = `${(asset.fileName ?? `photo-${Date.now()}`).replace(/\.[^.]+$/, "")}.jpg`;

  try {
    let context = ImageManipulator.manipulate(asset.uri);

    const width = asset.width ?? 0;
    const height = asset.height ?? 0;
    if (width > 0 && height > 0 && Math.max(width, height) > MAX_EDGE) {
      context =
        width >= height ? context.resize({ width: MAX_EDGE }) : context.resize({ height: MAX_EDGE });
    }

    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
    return { uri: saved.uri, name, type: "image/jpeg" };
  } catch {
    // Nothing to gain from failing here: send what was picked and let the
    // route answer for it.
    return { uri: asset.uri, name, type: "image/jpeg" };
  }
}
