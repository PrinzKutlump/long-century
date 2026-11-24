// Run with Node and GDAL: node art/geo/spike.mjs LAND.geojson art/geo/anchors.csv src/world.js OUTPUT_DIR
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';

const [landFile, anchorsFile, worldFile, output] = process.argv.slice(2);
if (!output) throw Error('Supply land, anchors, world.js and output paths');
const json = (path) => JSON.parse(readFileSync(path, 'utf8'));
const provinces = JSON.parse(readFileSync(worldFile, 'utf8').match(/const WORLD\s*=\s*(\{.*\});/)[1]).provs;
const rings = json(landFile).features.flatMap(({geometry}) =>
  (geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates).flat());
const anchors = new Map(readFileSync(anchorsFile, 'utf8').trim().split('\n').slice(1).map(row => {
  const [id, longitude, latitude] = row.split(',');
  return [id, [Number(longitude), Number(latitude)]];
}));
if (anchors.size !== provinces.length || provinces.some(p => !anchors.get(p.id)?.every(Number.isFinite))) {
  throw Error('Every province needs one valid anchor');
}
const europe = ([lon, lat]) => lon >= -12 && lon <= 45 && lat >= 35 && lat <= 72;
const europeIndices = provinces.flatMap((p,i) => europe(anchors.get(p.id)) ? [i] : []);
function extent(points) {
  const xs = points.map(p=>p[0]), ys = points.map(p=>p[1]);
  return (Math.max(...xs)-Math.min(...xs)) * (Math.max(...ys)-Math.min(...ys));
}
const europeBaseline = extent(europeIndices.map(i => [provinces[i].x,provinces[i].y]));
const pacific = [[-180,-155],[155,180]].map(([west,east]) =>
  Array.from({length:45}, (_,i) => -55+i*3).flatMap(lat => [[west,lat],[east,lat]]));
function stripArea(points) {
  const ring = [...points.filter((_,i)=>i%2===0), ...points.filter((_,i)=>i%2===1).reverse()];
  return Math.abs(ring.reduce((area,[x,y],i) => {
    const [nx,ny] = ring[(i+1)%ring.length];
    return area+x*ny-y*nx;
  },0))/2;
}
const bounds = [];
for (let lon = -180; lon <= 180; lon += 5) {
  for (let lat = -60; lat <= 80; lat += 5) bounds.push([lon, lat]);
}

mkdirSync(output, {recursive:true});
const results = [];
const panels = [];
for (const [name, projection] of [['Robinson','robin'], ['Winkel Tripel','wintri'], ['Miller','mill']]) {
  const points = [...bounds, ...rings.flat(), ...provinces.map(p => anchors.get(p.id)), ...pacific.flat()];
  const result = spawnSync('gdaltransform', ['-s_srs','OGC:CRS84','-t_srs',
    '+proj=' + projection + ' +lon_0=0 +datum=WGS84'], {
    input: points.map(([x,y]) => x + ' ' + Math.max(-60,Math.min(80,y))).join('\n') + '\n',
    encoding:'utf8', maxBuffer:16 * 1024 * 1024
  });
  if (result.status !== 0) throw Error(result.stderr || String(result.error));
  const projected = result.stdout.trim().split('\n').map(line => line.trim().split(/\s+/).slice(0,2).map(Number));
  if (projected.length !== points.length || projected.some(point => point.some(value => !Number.isFinite(value)))) {
    throw Error('Invalid projection output for ' + name);
  }
  const edge = projected.slice(0,bounds.length);
  const minX = Math.min(...edge.map(p=>p[0])), maxX = Math.max(...edge.map(p=>p[0]));
  const minY = Math.min(...edge.map(p=>p[1])), maxY = Math.max(...edge.map(p=>p[1]));
  const scale = Math.min(3000/(maxX-minX),1549/(maxY-minY));
  const pixel = ([x,y]) => [1500+(x-(minX+maxX)/2)*scale, 774.5-(y-(minY+maxY)/2)*scale];
  let cursor = bounds.length;
  const path = rings.map(ring => {
    const coordinates = projected.slice(cursor,cursor+ring.length).map(p=>pixel(p).map(Math.round).join(','));
    cursor += ring.length;
    return 'M'+coordinates.join('L')+'Z';
  }).join('');
  const locations = projected.slice(cursor,cursor+provinces.length).map(pixel);
  const distances = provinces.map((province, i) => {
    const [x,y] = locations[i];
    return {id:province.id, distance:Math.round(Math.hypot(x-province.x,y-province.y))};
  }).sort((a,b)=>b.distance-a.distance);
  let regionStart = cursor + provinces.length;
  const pacificArea = pacific.reduce((area,band) => {
    const slice = projected.slice(regionStart,regionStart+band.length).map(pixel);
    regionStart += band.length;
    return area + stripArea(slice);
  },0);
  results.push({
    name, projection, centralMeridian:0, latitudeRange:[-60,80],
    meanDistance:Math.round(distances.reduce((sum,row)=>sum+row.distance,0)/distances.length),
    p90Distance:distances[Math.floor(distances.length*.1)].distance,
    worstMatch:distances[0],
    europeAreaVsCurrent: +(extent(europeIndices.map(i=>locations[i]))/europeBaseline).toFixed(3),
    pacificEdgeBandShare: +(pacificArea/(3000*1549)).toFixed(3)
  });

  panels.push('<text x="15" y="42" font-size="36" fill="#fff">'+name+'</text><svg x="0" y="55" width="1000" height="516.3" viewBox="0 0 3000 1549"><path fill="#cab788" fill-rule="evenodd" d="'+path+'"/>'+provinces.map(p=>'<circle cx="'+p.x+'" cy="'+p.y+'" r="7" fill="#be4032"/>').join('')+'</svg>');
}
writeFileSync(join(output,'contact-sheet.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1740" style="background:#20344a">'+panels.map((panel,i)=>'<g transform="translate(0 '+(i*580)+')">'+panel+'</g>').join('')+'</svg>');
writeFileSync(join(output,'projection-preview.json'),JSON.stringify({anchors:provinces.length,europeAnchors:europeIndices.length,results},null,2)+'\n');
