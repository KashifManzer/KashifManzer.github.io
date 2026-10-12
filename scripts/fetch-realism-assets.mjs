import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
const root='public/textures/realism'; await mkdir(root,{recursive:true});
const assets=[
 ...['mercury','venus_atmosphere','mars','saturn','uranus','neptune','sun','earth_specular_map'].map(id=>[id,`https://www.solarsystemscope.com/textures/download/2k_${id}.${id === "earth_specular_map" ? "tif" : "jpg"}`]),
 ['saturn_ring', 'https://www.solarsystemscope.com/textures/download/2k_saturn_ring_alpha.png'],
 ...['diff','nor_gl','rough','ao'].map(id=>[`rock-${id}`,`https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rock_boulder_dry/rock_boulder_dry_${id}_1k.jpg`])
];
for(const [name,url] of assets){
 const response=await fetch(url);if(!response.ok)throw new Error(`${url}: ${response.status}`);
 const source=Buffer.from(await response.arrayBuffer());
 let img=sharp(source);if(name==='earth_specular_map')img=img.negate();
 await img.resize({width:name.startsWith('rock')?1024:2048,withoutEnlargement:true}).webp({quality:name.includes('nor_')?95:88}).toFile(`${root}/${name}.webp`);
 console.log(name);
}
// The original Meta SVG embeds its authored raster gradient. Rasterize the original,
// then extend the nearest nontransparent color into negative space for a 3D UV map.
const artworkURL='https://upload.wikimedia.org/wikipedia/commons/archive/2/21/20251228122811%21Instagram_Glyph_Gradient_RGB_logo.svg';
const originalResponse=await fetch(artworkURL);
if(!originalResponse.ok)throw new Error(`Instagram artwork: ${originalResponse.status}`);
const original=Buffer.from(await originalResponse.arrayBuffer());
await writeFile('public/social/instagram-original.svg',original);
const {data,info}=await sharp(original).resize(256,256).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const filled=Buffer.from(data), queue=[];const seen=new Uint8Array(info.width*info.height);
for(let i=0;i<seen.length;i++)if(data[i*4+3]>200){seen[i]=1;queue.push(i);}
for(let k=0;k<queue.length;k++){const i=queue[k],x=i%info.width,y=Math.floor(i/info.width);for(const n of [x>0?i-1:-1,x<info.width-1?i+1:-1,y>0?i-info.width:-1,y<info.height-1?i+info.width:-1])if(n>=0&&!seen[n]){seen[n]=1;filled.set(filled.subarray(i*4,i*4+3),n*4);filled[n*4+3]=255;queue.push(n);}}
await sharp(filled,{raw:info}).webp({lossless:true}).toFile('public/social/instagram-color.webp');
await writeFile(`${root}/SOURCES.json`,JSON.stringify(assets.map(([name,url])=>({name,url})),null,2));
