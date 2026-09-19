const rasters = new Map<string, HTMLCanvasElement>();
const pending = new Map<string, Promise<HTMLCanvasElement>>();
export const cachedImage = (src: string) => rasters.get(src);
export function loadCanvasImage(src: string): Promise<HTMLCanvasElement> {
  const cached = rasters.get(src);
  if (cached) return Promise.resolve(cached);
  const active = pending.get(src);
  if (active) return active;
  const request = new Promise<HTMLCanvasElement>((resolve, reject) => {
    const image = new Image();
    const timeout = setTimeout(
      () => reject(new Error("Image loading timed out")),
      20000,
    );
    image.src = src;
    image
      .decode()
      .then(() => {
        const raster = document.createElement("canvas");
        raster.width = image.naturalWidth || 256;
        raster.height = image.naturalHeight || 256;
        const context = raster.getContext("2d");
        if (!context) throw new Error("Canvas unavailable");
        context.drawImage(image, 0, 0, raster.width, raster.height);
        rasters.set(src, raster);
        resolve(raster);
      })
      .catch(reject)
      .finally(() => clearTimeout(timeout));
  });
  pending.set(src, request);
  request.then(
    () => pending.delete(src),
    () => pending.delete(src),
  );
  return request;
}
