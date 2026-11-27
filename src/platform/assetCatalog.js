export function buildAssetManifest(imageUrls = {}) {
  return {
    version: 2,
    pictures: {
      titleBackdrop: {
        src: imageUrls.titleBackdrop || "",
        alt: "European admiralty map room overlooking an industrial harbor",
        fallbackGradient: "linear-gradient(135deg, #172130 0%, #27374b 52%, #4a3520 100%)"
      },
      capitalScene: {
        src: imageUrls.capitalScene || "",
        alt: "Nineteenth-century industrial capital with railway viaducts and ministry dome",
        fallbackGradient: "linear-gradient(135deg, #3c2c1c 0%, #7d532d 55%, #b68445 100%)"
      },
      navalFleet: {
        src: imageUrls.navalFleet || "",
        alt: "Armored steam warships cruising in formation across open seas",
        fallbackGradient: "linear-gradient(135deg, #142233 0%, #2b445e 60%, #4e6378 100%)"
      },
      emblem: {
        src: imageUrls.emblem || "",
        alt: "The Long Century heraldic compass emblem",
        fallbackGradient: "radial-gradient(circle, #7e1928 0%, #141b26 75%)"
      }
    },
    units: {
      inf: { label: "Line Infantry", shape: "column", scale: 1.0, badgeColor: "#8b241d" },
      cav: { label: "Cavalry Squadron", shape: "diamond", scale: 0.95, badgeColor: "#a67521" },
      art: { label: "Field Artillery", shape: "cannon", scale: 0.95, badgeColor: "#465568" },
      grd: { label: "Guard Corps", shape: "shield", scale: 1.1, badgeColor: "#7e1928" },
      tnk: { label: "Armoured Division", shape: "chevron", scale: 1.15, badgeColor: "#33414c" },
      frig: { label: "Steam Frigate", shape: "sailhull", scale: 1.0, badgeColor: "#264e73" },
      iron: { label: "Ironclad", shape: "ironhull", scale: 1.08, badgeColor: "#2c3c4f" },
      dread: { label: "Dreadnought", shape: "dreadhull", scale: 1.2, badgeColor: "#1a2533" }
    },
    buildings: {
      rail: { label: "Railway", tierMax: 5, glyph: "rail" },
      fort: { label: "Fortress", tierMax: 4, glyph: "fort" },
      port: { label: "Naval Base", tierMax: 4, glyph: "port" },
      factory: { label: "Manufactory", tierMax: 20, glyph: "factory" }
    },
    audio: {
      ambientTracks: [],
      sfxCues: ["click", "seal", "coin", "rail", "warhorn", "peace", "month"]
    }
  };
}

export function resolveProvinceSceneMeta(manifest, prov, ownerNation) {
  if (!prov) {
    return manifest.pictures.capitalScene;
  }
  const hasPort = !!prov.sea && (prov.port > 0 || !prov.factories?.length);
  const isNavalHeavy = hasPort && (!ownerNation || prov.id !== ownerNation.cap);
  if (isNavalHeavy && (prov.port > 0 || prov.t === "p" || prov.t === "h")) {
    return {
      ...manifest.pictures.navalFleet,
      caption: `${prov.n} · Maritime & Trade Approaches`
    };
  }
  return {
    ...manifest.pictures.capitalScene,
    caption: ownerNation && prov.id === ownerNation.cap
      ? `${prov.n} · Seat of ${ownerNation.n}`
      : `${prov.n} · Provincial Panorama`
  };
}
