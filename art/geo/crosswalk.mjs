import { readFileSync } from 'node:fs';

const [boundaryFile, anchorFile] = process.argv.slice(2);
if (!boundaryFile || !anchorFile) {
  console.error('Usage: node art/geo/crosswalk.mjs <Natural Earth admin-1 GeoJSON> <anchors.csv>');
  process.exit(1);
}

const boundaries = JSON.parse(readFileSync(boundaryFile, 'utf8'));
if (boundaries.type !== 'FeatureCollection' || !Array.isArray(boundaries.features) || !boundaries.features.length) {
  throw new Error('Expected a nonempty Natural Earth admin-1 FeatureCollection');
}
const codes = new Set();
const regions = boundaries.features.map(({ properties, geometry }) => {
  const code = properties?.adm1_code;
  if (!code || codes.has(code)) throw new Error(`Missing or repeated Natural Earth adm1_code: ${code}`);
  codes.add(code);
  if (!['Polygon', 'MultiPolygon'].includes(geometry?.type)) {
    throw new Error(`Expected polygon geometry for ${code}`);
  }
  return {
    code,
    name: properties.name,
    country: properties.admin,
    polygons: geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates,
  };
});

function locateInRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, ay] = ring[j];
    const [bx, by] = ring[i];
    const cross = (x - ax) * (by - ay) - (y - ay) * (bx - ax);
    if (Math.abs(cross) <= 1e-10 &&
        x >= Math.min(ax, bx) && x <= Math.max(ax, bx) &&
        y >= Math.min(ay, by) && y <= Math.max(ay, by)) return 'edge';
    if ((ay > y) !== (by > y) && x < ax + (y - ay) * (bx - ax) / (by - ay)) inside = !inside;
  }
  return inside ? 'inside' : 'outside';
}

function locateInPolygon(point, [outer, ...holes]) {
  const exterior = locateInRing(point, outer);
  if (exterior !== 'inside') return exterior;
  for (const hole of holes) {
    const interior = locateInRing(point, hole);
    if (interior === 'edge') return 'edge';
    if (interior === 'inside') return 'outside';
  }
  return 'inside';
}

const [header, ...rows] = readFileSync(anchorFile, 'utf8').trim().split(/\r?\n/);
if (header !== 'id,longitude,latitude,place' || !rows.length) throw new Error('Expected the M1 anchors.csv format');
const seen = new Set();
const results = rows.map((row) => {
  const [id, longitude, latitude] = row.split(',', 3);
  const point = [Number(longitude), Number(latitude)];
  if (!id || seen.has(id) || !longitude?.trim() || !latitude?.trim() ||
      !point.every(Number.isFinite) || Math.abs(point[0]) > 180 || Math.abs(point[1]) > 90) {
    throw new Error(`Invalid or repeated anchor: ${row}`);
  }
  seen.add(id);
  const candidates = [];
  for (const { code, name, country, polygons } of regions) {
    const positions = polygons.map((polygon) => locateInPolygon(point, polygon));
    if (positions.includes('inside')) candidates.push({ code, name, country, position: 'inside' });
    else if (positions.includes('edge')) candidates.push({ code, name, country, position: 'edge' });
  }
  candidates.sort((a, b) => a.code.localeCompare(b.code, 'en'));
  let status = 'unmatched';
  if (candidates.length > 1) status = 'ambiguous';
  if (candidates.length === 1) status = candidates[0].position === 'inside' ? 'candidate' : 'boundary';
  return { id, longitude: point[0], latitude: point[1], status, candidates };
});

const uses = new Map();
for (const { id, candidates } of results) {
  for (const { code } of candidates) {
    if (!uses.has(code)) uses.set(code, []);
    uses.get(code).push(id);
  }
}
const sharedUnits = Object.fromEntries([...uses].filter(([, ids]) => ids.length > 1).sort());
console.log(JSON.stringify({ anchors: results, sharedUnits }, null, 2));
