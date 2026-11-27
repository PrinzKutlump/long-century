import titleBackdropUrl from "../assets/images/title_backdrop_1795699348039.jpg";
import capitalCitySceneUrl from "../assets/images/capital_city_scene_1795699348996.jpg";
import navalFleetSceneUrl from "../assets/images/naval_fleet_scene_1795699347210.jpg";
import appEmblemIconUrl from "../assets/images/app_emblem_icon_1795699347925.jpg";
import { buildAssetManifest, resolveProvinceSceneMeta } from "./assetCatalog.js";

/**
 * Data-driven media, sprite, building, and audio asset registry.
 * Future campaigns, eras, unit models, paintings, and MP3 tracks can be registered
 * purely through data entries here without rewriting engine or UI logic.
 */
export const ASSET_MANIFEST = buildAssetManifest({
  titleBackdrop: titleBackdropUrl,
  capitalScene: capitalCitySceneUrl,
  navalFleet: navalFleetSceneUrl,
  emblem: appEmblemIconUrl
});

export function getProvinceSceneMeta(prov, ownerNation) {
  return resolveProvinceSceneMeta(ASSET_MANIFEST, prov, ownerNation);
}
