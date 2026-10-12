import sharp from 'sharp';
// A code-native identity graphic: no external images or unverified claims.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#050a12"/>
<g fill="none" stroke="#294554" stroke-width="1.5" transform="translate(1100 200) rotate(-25)"><ellipse rx="270" ry="160"/><ellipse rx="390" ry="235"/><ellipse rx="510" ry="310"/></g>
<circle cx="1015" cy="278" r="48" fill="#14394a"/><path d="M976 252a48 48 0 0 1 78 47" fill="none" stroke="#92d3e9" stroke-width="3"/>
<circle cx="837" cy="134" r="6" fill="#92d3e9"/>
<g font-family="Helvetica,Arial,sans-serif"><text x="80" y="290" fill="#edf2f5" font-size="82" font-weight="600" letter-spacing="-3">Kashif Manzer</text>
<text x="84" y="354" fill="#bdd7e4" font-size="32">Backend &amp; Infrastructure Engineer</text>
<text x="84" y="407" fill="#aab8c8" font-size="24">Distributed systems · Cloud infrastructure · Go &amp; Python</text>
<text x="84" y="552" fill="#92d3e9" font-size="22">kashifmanzer.github.io</text></g>
<path d="M84 481H1116" stroke="#294554"/></svg>`;
await sharp(Buffer.from(svg)).png().toFile('public/social-card.png');
