import { buildAssetManifest, resolveProvinceSceneMeta } from "./assetCatalog.js";

/**
 * Data-driven media, sprite, building, and audio asset registry.
 * Pictures are registered here by URL once a licensed file exists in public/assets/pictures/
 * and has a line in docs/ASSETS.md. Until then each picture shows its gradient only.
 */
export const ASSET_MANIFEST = buildAssetManifest({});

export function getProvinceSceneMeta(prov, ownerNation) {
  return resolveProvinceSceneMeta(ASSET_MANIFEST, prov, ownerNation);
}
