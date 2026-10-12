import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

// Direct image URLs verified against NASA's source pages; downloaded only by this script.
const assets = [
  ['moon-color', 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_2k.jpg', 2048],
  ['moon-height', 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_3_8bit.jpg', 1024],
  ['jupiter', 'https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia07/pia07782/PIA07782.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1801&w=3601', 2048],
  ['earth-clouds', 'https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg', 2048],
];
await mkdir('public/textures/cinematic', { recursive: true });
for (const [name, url, width] of assets) {
  const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  const source = Buffer.from(await response.arrayBuffer());
  const image = await sharp(source).resize({ width, withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
  await writeFile(`public/textures/cinematic/${name}.webp`, image);
  console.log(`${name}: ${image.length} bytes`);
}
