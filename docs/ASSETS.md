# Assets

Every shipped asset: file, source, licence, author.

- data/raw/geo/ne_{10m,50m}_{coastline,land,lakes,rivers_lake_centerlines,admin_0_countries,admin_1_states_provinces}.geojson, data/raw/geo/ne_10m_populated_places.geojson | Natural Earth vector, github.com/nvkelso/natural-earth-vector at commit ca96624a56bd078437bca8184e78163e5039ad19 (fetched by the geodata workflow, clipped to lat -60..80) | public domain | Natural Earth contributors
- data/raw/geo/ohm_admin_{1836-01-01,1866-01-01,1900-01-01,1914-01-01}.geojson | OpenHistoricalMap Overpass API, admin_level 2 and 4 boundaries, features with a non-CC0 license tag dropped (see data/raw/geo/SOURCES.md) | CC0 | OpenHistoricalMap contributors
