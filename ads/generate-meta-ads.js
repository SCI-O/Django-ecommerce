const { chromium } = require('playwright');
const path = require('path');

const GOLD = '#d4a843';
const DARK = '#0a0808';
const WHITE = '#ffffff';

const ads = [
  {
    id: '01-mistakes',
    headlines: [
      { text: 'CRYPTO TAX', gold: false },
      { text: 'MISTAKES', gold: false },
      { text: 'ADD UP.', gold: true },
    ],
    subline: 'Know where you stand.',
    hasSubline: true,
    bgGradient: `
      radial-gradient(ellipse at 65% 45%, rgba(30, 45, 60, 0.5) 0%, transparent 55%),
      radial-gradient(ellipse at 40% 60%, rgba(45, 35, 20, 0.4) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(20, 18, 15, 1) 0%, #0a0808 100%)
    `,
    extraElements: 'portfolio',
  },
  {
    id: '02-understand',
    headlines: [
      { text: 'YOUR CPA SHOULD', gold: false },
      { text: 'UNDERSTAND CRYPTO.', gold: true },
    ],
    subline: 'Crypto-focused since 2016.',
    hasSubline: true,
    bgGradient: `
      radial-gradient(ellipse at 70% 35%, rgba(50, 40, 20, 0.5) 0%, transparent 50%),
      radial-gradient(ellipse at 30% 70%, rgba(25, 30, 45, 0.4) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(18, 15, 12, 1) 0%, #0a0808 100%)
    `,
    extraElements: 'crypto-prices',
  },
  {
    id: '03-wallets',
    headlines: [
      { text: '5 WALLETS.', gold: false },
      { text: '3 EXCHANGES.', gold: false },
      { text: 'ONE TAX HEADACHE.', gold: true },
    ],
    subline: '',
    hasSubline: false,
    bgGradient: `
      radial-gradient(ellipse at 55% 55%, rgba(40, 35, 25, 0.5) 0%, transparent 50%),
      radial-gradient(ellipse at 30% 40%, rgba(30, 25, 15, 0.4) 0%, transparent 45%),
      radial-gradient(ellipse at 50% 50%, rgba(18, 15, 10, 1) 0%, #0a0808 100%)
    `,
    extraElements: 'checklist',
  },
  {
    id: '04-specialist',
    headlines: [
      { text: 'CRYPTO TAXES?', gold: false },
      { text: 'TALK TO A SPECIALIST.', gold: true },
    ],
    subline: '',
    hasSubline: false,
    bgGradient: `
      radial-gradient(ellipse at 60% 50%, rgba(35, 30, 25, 0.5) 0%, transparent 50%),
      radial-gradient(ellipse at 40% 40%, rgba(25, 20, 18, 0.4) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(15, 13, 10, 1) 0%, #0a0808 100%)
    `,
    extraElements: 'books',
  },
];

const sizes = [
  { name: '1080x1080', w: 1080, h: 1080, label: 'Feed Square' },
  { name: '1080x1920', w: 1080, h: 1920, label: 'Stories/Reels' },
  { name: '1200x628',  w: 1200, h: 628,  label: 'Feed Landscape' },
];

function extraElementsHTML(type, size) {
  const isLandscape = size.w === 1200;
  const isStories = size.h === 1920;

  if (type === 'portfolio') {
    const fontSize = isLandscape ? '13px' : '15px';
    const top = isStories ? '52%' : isLandscape ? '35%' : '42%';
    const right = isLandscape ? '8%' : '10%';
    return `
      <div style="position:absolute; top:${top}; right:${right};
        background:rgba(15,15,20,0.85); border:1px solid rgba(200,168,78,0.3);
        border-radius:12px; padding:${isLandscape ? '12px 16px' : '16px 20px'};
        font-family:'Inter',sans-serif; font-size:${fontSize}; min-width:${isLandscape ? '180px' : '220px'};">
        <div style="color:${GOLD}; font-size:${isLandscape ? '16px' : '20px'}; font-weight:700; margin-bottom:8px;">
          Total Value</div>
        <div style="color:${WHITE}; font-size:${isLandscape ? '22px' : '28px'}; font-weight:700; margin-bottom:12px;">
          $142,830.21</div>
        <div style="display:flex; justify-content:space-between; margin:4px 0;">
          <span style="color:rgba(255,255,255,0.7);">BTC</span>
          <span style="color:#4ade80;">+2.4%</span></div>
        <div style="display:flex; justify-content:space-between; margin:4px 0;">
          <span style="color:rgba(255,255,255,0.7);">ETH</span>
          <span style="color:#4ade80;">+1.8%</span></div>
        <div style="display:flex; justify-content:space-between; margin:4px 0;">
          <span style="color:rgba(255,255,255,0.7);">SOL</span>
          <span style="color:#f87171;">-0.7%</span></div>
        <div style="display:flex; justify-content:space-between; margin:4px 0;">
          <span style="color:rgba(255,255,255,0.7);">ARB</span>
          <span style="color:#4ade80;">+3.1%</span></div>
      </div>`;
  }

  if (type === 'crypto-prices') {
    const fontSize = isLandscape ? '13px' : '15px';
    const top = isStories ? '42%' : isLandscape ? '28%' : '38%';
    const right = isLandscape ? '5%' : '8%';
    return `
      <div style="position:absolute; top:${top}; right:${right};
        font-family:'Inter',sans-serif; font-size:${fontSize};">
        ${['Bitcoin +2.6%', 'Ethereum +4.1%', 'Solana +0.0%', 'Arbitrum +2.8%', 'Polygon -1.1%', 'Avalanche +3.5%'].map((item, i) => {
          const [name, pct] = item.split(' ');
          const color = pct.startsWith('+') && pct !== '+0.0%' ? '#4ade80' : pct === '+0.0%' ? 'rgba(255,255,255,0.5)' : '#f87171';
          return `<div style="display:flex; justify-content:space-between; gap:${isLandscape ? '30px' : '40px'};
            padding:${isLandscape ? '4px 0' : '6px 0'}; border-bottom:1px solid rgba(255,255,255,0.08);">
            <span style="color:rgba(255,255,255,0.8);">${name}</span>
            <span style="color:${color}; font-weight:600;">${pct}</span></div>`;
        }).join('')}
      </div>
      <div style="position:absolute; top:${isStories ? '68%' : isLandscape ? '60%' : '65%'};
        left:${isLandscape ? '5%' : '8%'};
        display:flex; gap:12px; flex-wrap:wrap;">
        ${['TAX PLANNING', 'DIGITAL ASSETS', 'BLOCKCHAIN'].map(label =>
          `<span style="font-family:'Inter',sans-serif; font-size:${isLandscape ? '11px' : '13px'};
            color:${GOLD}; border:1px solid rgba(212,168,67,0.4); padding:6px 14px;
            border-radius:4px; letter-spacing:1.5px; text-transform:uppercase;">${label}</span>`
        ).join('')}
      </div>`;
  }

  if (type === 'checklist') {
    const top = isStories ? '40%' : isLandscape ? '25%' : '38%';
    const fontSize = isLandscape ? '14px' : '17px';
    return `
      <div style="position:absolute; top:${top}; right:${isLandscape ? '5%' : '8%'};
        font-family:'Inter',sans-serif; font-size:${fontSize};
        background:rgba(15,15,20,0.7); border:1px solid rgba(200,168,78,0.2);
        border-radius:10px; padding:${isLandscape ? '12px 18px' : '18px 24px'};">
        ${['Exchanges', 'DeFi', 'Staking', 'NFTs', 'Cost basis?', 'Tax report?'].map(item =>
          `<div style="display:flex; align-items:center; gap:10px; padding:${isLandscape ? '3px 0' : '5px 0'};
            color:rgba(255,255,255,0.85);">
            <span style="color:${GOLD}; font-size:${isLandscape ? '16px' : '18px'};">&#9745;</span>
            <span>${item}</span></div>`
        ).join('')}
      </div>
      <div style="position:absolute; top:${isStories ? '60%' : isLandscape ? '30%' : '50%'};
        left:${isLandscape ? '40%' : '8%'};
        font-family:'Inter',sans-serif; font-size:${isLandscape ? '12px' : '14px'};
        background:rgba(15,15,20,0.7); border:1px solid rgba(200,168,78,0.15);
        border-radius:8px; padding:${isLandscape ? '10px 14px' : '14px 18px'};">
        ${[
          { coin: 'Bitcoin', val: '$12,430' },
          { coin: 'Ethereum', val: '$8,245' },
          { coin: 'Solana', val: '$3,820' },
          { coin: 'USDC', val: '$2,140' },
          { coin: 'Arbitrum', val: '$1,925' },
          { coin: 'Polygon', val: '$1,240' },
        ].map(({ coin, val }) =>
          `<div style="display:flex; justify-content:space-between; gap:${isLandscape ? '20px' : '30px'};
            padding:3px 0; color:rgba(255,255,255,0.75);">
            <span>${coin}</span><span style="color:${WHITE}; font-weight:600;">${val}</span></div>`
        ).join('')}
      </div>`;
  }

  if (type === 'books') {
    const bottom = isStories ? '38%' : isLandscape ? '35%' : '32%';
    const right = isLandscape ? '5%' : '8%';
    const fontSize = isLandscape ? '11px' : '13px';
    return `
      <div style="position:absolute; bottom:${bottom}; right:${right};
        display:flex; gap:${isLandscape ? '6px' : '8px'};">
        ${['CRYPTO TAXES', 'TAX PLANNING', 'DIGITAL ASSETS'].map(title =>
          `<div style="width:${isLandscape ? '70px' : '90px'}; height:${isLandscape ? '90px' : '120px'};
            background: linear-gradient(180deg, rgba(30,25,18,0.9) 0%, rgba(20,15,10,0.95) 100%);
            border:1px solid rgba(200,168,78,0.3); border-radius:3px;
            display:flex; align-items:center; justify-content:center; text-align:center;
            padding:8px; font-family:'Oswald',sans-serif; font-size:${fontSize};
            color:${GOLD}; letter-spacing:1px; line-height:1.3;">${title}</div>`
        ).join('')}
      </div>`;
  }

  return '';
}

function generateHTML(ad, size) {
  const { w, h } = size;
  const isLandscape = w === 1200;
  const isStories = h === 1920;
  const isSquare = w === h;

  // Font sizes
  const headlineSize = isLandscape ? '48px' : isStories ? '72px' : '64px';
  const sublineSize = isLandscape ? '20px' : isStories ? '28px' : '24px';
  const brandSize = isLandscape ? '22px' : isStories ? '30px' : '26px';
  const badgeFontSize = isLandscape ? '13px' : '15px';
  const ctaFontSize = isLandscape ? '16px' : '18px';

  // Padding
  const padX = isLandscape ? '50px' : '60px';
  const padTop = isStories ? '120px' : isLandscape ? '50px' : '60px';

  // Headline block
  const headlineHTML = ad.headlines.map(line =>
    `<div style="color:${line.gold ? GOLD : WHITE}; font-style:${line.gold ? 'italic' : 'normal'};">${line.text}</div>`
  ).join('');

  // CTA bottom position
  const ctaBottom = isStories ? '80px' : isLandscape ? '40px' : '50px';
  const badgeBottom = isStories ? '160px' : isLandscape ? '100px' : '130px';

  // Layout: landscape uses side-by-side
  const headlineBlock = `
    <div style="position:absolute; top:${padTop}; left:${padX};
      ${isLandscape ? 'max-width:55%;' : 'max-width:70%;'}">
      <div style="font-family:'Oswald',sans-serif; font-weight:700; font-size:${headlineSize};
        line-height:1.05; letter-spacing:-0.5px; text-transform:uppercase;">
        ${headlineHTML}
      </div>
      ${ad.hasSubline ? `
        <div style="font-family:'Georgia','Times New Roman',serif; font-style:italic;
          font-size:${sublineSize}; color:rgba(255,255,255,0.8); margin-top:${isLandscape ? '10px' : '16px'};">
          ${ad.subline}
        </div>` : ''}
      <div style="margin-top:${isLandscape ? '16px' : '24px'};">
        <div style="width:40px; height:2px; background:${GOLD}; margin-bottom:12px;"></div>
        <div style="font-family:'Oswald',sans-serif; font-weight:400; font-size:${brandSize};
          letter-spacing:3px; color:${WHITE};">
          CAMUSO <span style="color:${GOLD};">CPA</span>
        </div>
      </div>
    </div>`;

  const badge = `
    <div style="position:absolute; bottom:${badgeBottom}; left:50%; transform:translateX(-50%);
      ${isLandscape ? 'left:auto; right:50px; transform:none;' : ''}
      background:rgba(10,10,10,0.88); border:1.5px solid ${GOLD}; border-radius:8px;
      padding:${isLandscape ? '10px 20px' : '14px 24px'}; display:flex; align-items:center; gap:12px;
      white-space:nowrap;">
      <div style="width:${isLandscape ? '28px' : '32px'}; height:${isLandscape ? '28px' : '32px'};
        border:1.5px solid ${GOLD}; border-radius:6px; display:flex; align-items:center;
        justify-content:center; font-size:${isLandscape ? '14px' : '16px'}; color:${GOLD};">&#9745;</div>
      <div style="font-family:'Oswald',sans-serif; font-size:${badgeFontSize}; font-weight:600;
        letter-spacing:1.5px; color:${WHITE}; text-transform:uppercase;">
        FREE CRYPTO TAX<br>CONSULTATION
      </div>
    </div>`;

  const cta = `
    <div style="position:absolute; bottom:${ctaBottom}; left:50%; transform:translateX(-50%);
      ${isLandscape ? 'left:auto; right:50px; transform:none;' : ''}">
      <div style="background:${GOLD}; color:#0d0d0d; font-family:'Oswald',sans-serif;
        font-weight:700; font-size:${ctaFontSize}; letter-spacing:2px; text-transform:uppercase;
        padding:${isLandscape ? '14px 36px' : '16px 44px'}; border-radius:4px; text-align:center;
        box-shadow: 0 4px 20px rgba(212,168,67,0.3);">
        GET FREE CONSULTATION &nbsp;&rarr;
      </div>
    </div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${w}px;
      height: ${h}px;
      overflow: hidden;
      background: ${DARK};
      color: ${WHITE};
      position: relative;
    }
    .canvas {
      width: 100%;
      height: 100%;
      position: relative;
      background: ${ad.bgGradient};
    }
    /* subtle texture overlay */
    .canvas::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(255,255,255,0.008) 2px,
          rgba(255,255,255,0.008) 4px
        );
      pointer-events: none;
    }
    /* vignette */
    .canvas::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%);
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div class="canvas">
    ${headlineBlock}
    ${extraElementsHTML(ad.extraElements, size)}
    ${badge}
    ${cta}
  </div>
</body>
</html>`;
}

(async () => {
  const outDir = path.join(__dirname, 'meta');

  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  });

  let count = 0;
  const total = ads.length * sizes.length;

  for (const ad of ads) {
    for (const size of sizes) {
      const page = await browser.newPage();
      await page.setViewportSize({ width: size.w, height: size.h });

      const html = generateHTML(ad, size);
      await page.setContent(html, { waitUntil: 'networkidle' });

      // Wait for fonts
      await page.waitForTimeout(1500);

      const filename = `${ad.id}-${size.name}.png`;
      await page.screenshot({
        path: path.join(outDir, filename),
        type: 'png',
      });
      await page.close();

      count++;
      console.log(`[${count}/${total}] ${filename}`);
    }
  }

  await browser.close();
  console.log(`\nDone! ${total} ads generated in ads/meta/`);
})();
