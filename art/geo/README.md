# M1 projection comparison

Recommend Miller at Greenwich, with a preserved full-world view and 1.4× Europe opening view. Miller has the lowest mean and 90th-percentile displacement for the 184 representative anchors. Its Europe anchor bounding box has 52.1% of the old map's area at full-world scale. At 1.4× the linear scale, that implies 102.1% before viewport clipping. Verify that opening camera and province readability in M2/M3. All three full-world fits have smaller Europe footprints than the existing stylised map. The Pacific metric measures the two outer 25° longitude bands from 55°S to 70°N as a share of the canvas. It is a footprint proxy that includes land and omits Pacific water outside those bands.

The CSV joins game provinces to representative Natural Earth populated places. Some are modern proxies for broad game regions. The model uses their coordinates to compare projections. It does not use them to relocate a province, infer historical borders or change game adjacency. Latitude vertices are clamped to the comparison extent for this preview.

Reproduce with Node and GDAL:
 
    node art/geo/spike.mjs /path/to/ne_50m_land.geojson art/geo/anchors.csv src/world.js out

Use Natural Earth commit ca96624a56bd078437bca8184e78163e5039ad19 for land and populated places. Land GeoJSON SHA-256 is e874b27a51d146452be360cafb3cc50c86001074a67d534113e6534682f9826b. The report was produced against the 184-province checkpoint map. The script checks that every input province has an anchor.

## Short agent handoff

Read this file and projection-preview.json before opening the contact sheet or raw map inputs. Use a smaller model for bounded table preparation and evidence extraction. Review its output using a deterministic check for duplicate IDs, missing provinces and numeric coordinates. Keep projection choice, map topology and visual acceptance with the implementing agent. Keep generated geometry, raw inputs and long logs out of routine prompts.

## M2a Natural Earth crosswalk

Use the pinned Natural Earth 10m admin-1 GeoJSON to identify modern subdivisions at the M1 representative points.

```bash
node art/geo/crosswalk.mjs data/raw/geo/ne_10m_admin_1_states_provinces.geojson \
  art/geo/anchors.csv > /tmp/long-century-crosswalk.json
```

The report covers every anchor so the same command can be reused for M2b. For M2a, review the Europe and Middle East rows first. A `candidate` is a single polygon containing the point. Review `boundary`, `ambiguous`, and `unmatched` rows manually. The `sharedUnits` object flags modern subdivisions that match multiple game anchors. One point cannot identify all the modern subdivisions in a game province. Use 1836 evidence to confirm the parts and cuts before recording them in the final crosswalk.
