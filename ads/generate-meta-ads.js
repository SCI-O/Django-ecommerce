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
    scene: 'laptop-glow',
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
    scene: 'city-lights',
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
    scene: 'desk-chaos',
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
    scene: 'executive',
    extraElements: 'books',
  },
];

const sizes = [
  { name: '1080x1080', w: 1080, h: 1080, label: 'Feed Square' },
  { name: '1080x1920', w: 1080, h: 1920, label: 'Stories/Reels' },
  { name: '1200x628',  w: 1200, h: 628,  label: 'Feed Landscape' },
];

function canvasBackgroundScript(scene, w, h) {
  return `
  <canvas id="bgCanvas" width="${w}" height="${h}" style="position:absolute;inset:0;z-index:0;"></canvas>
  <script>
  (function() {
    const c = document.getElementById('bgCanvas');
    const ctx = c.getContext('2d');
    const W = ${w}, H = ${h};

    // Base fill
    ctx.fillStyle = '#080604';
    ctx.fillRect(0, 0, W, H);

    // Perlin-like noise via random dots
    function addNoise(opacity, count) {
      const id = ctx.createImageData(W, H);
      const d = id.data;
      for (let i = 0; i < count; i++) {
        const x = Math.floor(Math.random() * W);
        const y = Math.floor(Math.random() * H);
        const idx = (y * W + x) * 4;
        const v = Math.floor(Math.random() * 40);
        d[idx] = v; d[idx+1] = v; d[idx+2] = v;
        d[idx+3] = Math.floor(opacity * 255);
      }
      ctx.putImageData(id, 0, 0);
    }

    // Soft radial light
    function softLight(cx, cy, r, color, alpha) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, color.replace(')', ',' + alpha + ')').replace('rgb', 'rgba'));
      g.addColorStop(0.5, color.replace(')', ',' + (alpha * 0.4) + ')').replace('rgb', 'rgba'));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // Bokeh circle
    function bokeh(cx, cy, r, color, alpha) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, color.replace(')', ',' + (alpha * 0.7) + ')').replace('rgb', 'rgba'));
      g.addColorStop(0.7, color.replace(')', ',' + (alpha * 0.2) + ')').replace('rgb', 'rgba'));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Vignette
    function vignette(strength) {
      const g = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.25, W/2, H/2, Math.max(W,H)*0.75);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,' + strength + ')');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // Horizontal light streaks
    function lightStreak(y, height, color, alpha) {
      const g = ctx.createLinearGradient(0, y, 0, y + height);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.5, color.replace(')', ',' + alpha + ')').replace('rgb', 'rgba'));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, y, W, height);
    }

    const scene = '${scene}';

    if (scene === 'laptop-glow') {
      // Warm amber base wash
      softLight(W * 0.4, H * 0.5, Math.max(W, H) * 0.7, 'rgb(30, 22, 12)', 0.8);
      // Screen glow - blue/cool on the right
      softLight(W * 0.65, H * 0.45, Math.min(W, H) * 0.5, 'rgb(20, 35, 60)', 0.6);
      // Warm face-light from left
      softLight(W * 0.25, H * 0.35, Math.min(W, H) * 0.4, 'rgb(50, 38, 18)', 0.5);
      // Subtle green chart glow
      softLight(W * 0.7, H * 0.5, Math.min(W, H) * 0.2, 'rgb(15, 40, 20)', 0.3);
      // Red accent
      softLight(W * 0.75, H * 0.55, Math.min(W, H) * 0.12, 'rgb(40, 15, 10)', 0.25);
      // Top edge ambient
      lightStreak(0, H * 0.15, 'rgb(25, 20, 15)', 0.3);
      vignette(0.75);
      addNoise(0.12, W * H * 0.15);
    }

    else if (scene === 'city-lights') {
      // Warm base
      softLight(W * 0.5, H * 0.4, Math.max(W, H) * 0.8, 'rgb(25, 18, 10)', 0.6);
      // City glow on upper right
      softLight(W * 0.8, H * 0.2, Math.min(W, H) * 0.6, 'rgb(45, 35, 18)', 0.5);
      // Screen glow center
      softLight(W * 0.45, H * 0.55, Math.min(W, H) * 0.35, 'rgb(18, 30, 50)', 0.4);
      // Bokeh circles - city lights
      const seed = 42;
      const rng = (function(s){return function(){s=(s*16807+0)%2147483647;return s/2147483647;};})(seed);
      for (let i = 0; i < 18; i++) {
        const bx = W * (0.4 + rng() * 0.55);
        const by = H * (0.05 + rng() * 0.45);
        const br = 8 + rng() * 35;
        const colors = ['rgb(212,168,67)', 'rgb(180,140,60)', 'rgb(255,200,100)', 'rgb(200,180,140)', 'rgb(120,160,200)'];
        bokeh(bx, by, br, colors[Math.floor(rng() * colors.length)], 0.08 + rng() * 0.15);
      }
      // Warm desk lamp spill
      softLight(W * 0.2, H * 0.7, Math.min(W, H) * 0.3, 'rgb(60, 45, 20)', 0.4);
      vignette(0.7);
      addNoise(0.1, W * H * 0.12);
    }

    else if (scene === 'desk-chaos') {
      // Overhead warm light
      softLight(W * 0.45, H * 0.3, Math.max(W, H) * 0.5, 'rgb(40, 32, 18)', 0.7);
      // Secondary warm from right
      softLight(W * 0.75, H * 0.4, Math.min(W, H) * 0.4, 'rgb(35, 25, 12)', 0.4);
      // Edge highlight left
      softLight(W * 0.1, H * 0.6, Math.min(W, H) * 0.3, 'rgb(25, 20, 12)', 0.3);
      // Subtle phone screen glow
      softLight(W * 0.55, H * 0.55, Math.min(W, H) * 0.15, 'rgb(15, 25, 45)', 0.25);
      softLight(W * 0.6, H * 0.5, Math.min(W, H) * 0.1, 'rgb(20, 40, 25)', 0.2);
      // Paper texture suggestion - subtle light patches
      for (let i = 0; i < 6; i++) {
        const px = W * (0.15 + Math.random() * 0.7);
        const py = H * (0.35 + Math.random() * 0.4);
        softLight(px, py, 40 + Math.random() * 60, 'rgb(30, 25, 18)', 0.08 + Math.random() * 0.08);
      }
      vignette(0.8);
      addNoise(0.14, W * H * 0.18);
    }

    else if (scene === 'executive') {
      // Rich warm base
      softLight(W * 0.5, H * 0.45, Math.max(W, H) * 0.7, 'rgb(28, 20, 10)', 0.7);
      // Key light from left
      softLight(W * 0.2, H * 0.35, Math.min(W, H) * 0.5, 'rgb(50, 40, 22)', 0.5);
      // Rim light right
      softLight(W * 0.85, H * 0.4, Math.min(W, H) * 0.3, 'rgb(45, 35, 18)', 0.35);
      // Desk surface reflection
      softLight(W * 0.5, H * 0.75, Math.min(W, H) * 0.35, 'rgb(22, 18, 10)', 0.3);
      // Warm ambient above
      lightStreak(0, H * 0.2, 'rgb(35, 28, 15)', 0.2);
      // Subtle bookshelf shadow patterns
      for (let i = 0; i < 4; i++) {
        const sx = W * (0.6 + i * 0.1);
        softLight(sx, H * 0.5, 30, 'rgb(20, 15, 8)', 0.1);
      }
      vignette(0.72);
      addNoise(0.11, W * H * 0.13);
    }

    // Final color grade - warm overlay
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(30, 22, 10, 0.08)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';

    // Subtle film grain pass
    ctx.globalAlpha = 0.04;
    for (let y = 0; y < H; y += 3) {
      for (let x = 0; x < W; x += 3) {
        const v = Math.floor(Math.random() * 60);
        ctx.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
        ctx.fillRect(x, y, 3, 3);
      }
    }
    ctx.globalAlpha = 1.0;
  })();
  </script>`;
}

function extraElementsHTML(type, size) {
  const isLandscape = size.w === 1200;
  const isStories = size.h === 1920;

  if (type === 'portfolio') {
    const fs = isLandscape ? '13px' : isStories ? '16px' : '15px';
    const top = isStories ? '48%' : isLandscape ? '30%' : '40%';
    const right = isLandscape ? '6%' : '8%';
    return `
      <div style="position:absolute; top:${top}; right:${right}; z-index:2;
        background:rgba(8,6,4,0.82); border:1px solid rgba(212,168,67,0.25);
        border-radius:14px; padding:${isLandscape ? '14px 18px' : '18px 24px'};
        font-family:'Inter',sans-serif; font-size:${fs}; min-width:${isLandscape ? '190px' : '230px'};
        backdrop-filter:blur(8px); box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
        <div style="color:${GOLD}; font-size:${isLandscape ? '14px' : '17px'}; font-weight:600; margin-bottom:6px; letter-spacing:0.5px;">
          Total Value</div>
        <div style="color:${WHITE}; font-size:${isLandscape ? '24px' : '30px'}; font-weight:700; margin-bottom:14px;">
          $142,830.21</div>
        ${[
          { t: 'BTC', c: '#4ade80', v: '+2.4%' },
          { t: 'ETH', c: '#4ade80', v: '+1.8%' },
          { t: 'SOL', c: '#f87171', v: '-0.7%' },
          { t: 'ARB', c: '#4ade80', v: '+3.1%' },
          { t: 'OP', c: '#f87171', v: '-1.2%' },
        ].map(r => `<div style="display:flex; justify-content:space-between; padding:4px 0;
          border-bottom:1px solid rgba(255,255,255,0.06);">
          <span style="color:rgba(255,255,255,0.6); display:flex; align-items:center; gap:6px;">
            <span style="width:8px;height:8px;border-radius:50%;background:${r.c};display:inline-block;"></span>${r.t}</span>
          <span style="color:${r.c}; font-weight:600;">${r.v}</span></div>`).join('')}
      </div>`;
  }

  if (type === 'crypto-prices') {
    const fs = isLandscape ? '13px' : isStories ? '16px' : '15px';
    const top = isStories ? '40%' : isLandscape ? '25%' : '36%';
    const right = isLandscape ? '4%' : '6%';
    return `
      <div style="position:absolute; top:${top}; right:${right}; z-index:2;
        background:rgba(8,6,4,0.75); border:1px solid rgba(212,168,67,0.15);
        border-radius:12px; padding:${isLandscape ? '12px 16px' : '16px 22px'};
        font-family:'Inter',sans-serif; font-size:${fs};
        backdrop-filter:blur(6px); box-shadow: 0 6px 24px rgba(0,0,0,0.4);
        min-width:${isLandscape ? '200px' : '240px'};">
        ${[
          { n: 'Bitcoin', c: '#f7931a', v: '+2.6%', up: true },
          { n: 'Ethereum', c: '#627eea', v: '+4.1%', up: true },
          { n: 'Solana', c: '#9945ff', v: '+0.0%', up: null },
          { n: 'Arbitrum', c: '#28a0f0', v: '+2.8%', up: true },
          { n: 'Polygon', c: '#8247e5', v: '-1.1%', up: false },
          { n: 'Avalanche', c: '#e84142', v: '+3.5%', up: true },
        ].map(r => `<div style="display:flex; justify-content:space-between; align-items:center; gap:${isLandscape ? '24px' : '32px'};
          padding:${isLandscape ? '5px 0' : '7px 0'}; border-bottom:1px solid rgba(255,255,255,0.06);">
          <span style="color:rgba(255,255,255,0.8); display:flex; align-items:center; gap:8px;">
            <span style="width:10px;height:10px;border-radius:50%;background:${r.c};display:inline-block;"></span>${r.n}</span>
          <span style="color:${r.up === true ? '#4ade80' : r.up === false ? '#f87171' : 'rgba(255,255,255,0.4)'}; font-weight:600;">${r.v}</span></div>`).join('')}
      </div>
      <div style="position:absolute; top:${isStories ? '66%' : isLandscape ? '58%' : '64%'};
        left:${isLandscape ? '4%' : '6%'}; z-index:2;
        display:flex; gap:10px; flex-wrap:wrap;">
        ${['TAX PLANNING', 'DIGITAL ASSETS', 'BLOCKCHAIN'].map(label =>
          `<span style="font-family:'Inter',sans-serif; font-size:${isLandscape ? '10px' : '12px'};
            color:${GOLD}; border:1px solid rgba(212,168,67,0.3); padding:${isLandscape ? '5px 12px' : '7px 16px'};
            border-radius:4px; letter-spacing:1.5px; text-transform:uppercase;
            background:rgba(8,6,4,0.7); backdrop-filter:blur(4px);">${label}</span>`
        ).join('')}
      </div>`;
  }

  if (type === 'checklist') {
    const top = isStories ? '38%' : isLandscape ? '22%' : '36%';
    const fs = isLandscape ? '14px' : isStories ? '18px' : '16px';
    return `
      <div style="position:absolute; top:${top}; right:${isLandscape ? '4%' : '6%'}; z-index:2;
        font-family:'Inter',sans-serif; font-size:${fs};
        background:rgba(8,6,4,0.78); border:1px solid rgba(212,168,67,0.2);
        border-radius:12px; padding:${isLandscape ? '14px 20px' : '20px 28px'};
        backdrop-filter:blur(6px); box-shadow: 0 6px 24px rgba(0,0,0,0.4);">
        ${['Exchanges', 'DeFi', 'Staking', 'NFTs', 'Cost basis?', 'Tax report?'].map(item =>
          `<div style="display:flex; align-items:center; gap:10px; padding:${isLandscape ? '4px 0' : '6px 0'};
            color:rgba(255,255,255,0.85);">
            <span style="color:${GOLD}; font-size:${isLandscape ? '16px' : '18px'};">&#9745;</span>
            <span>${item}</span></div>`
        ).join('')}
      </div>
      <div style="position:absolute; top:${isStories ? '58%' : isLandscape ? '26%' : '48%'};
        left:${isLandscape ? '38%' : '6%'}; z-index:2;
        font-family:'Inter',sans-serif; font-size:${isLandscape ? '12px' : '14px'};
        background:rgba(8,6,4,0.78); border:1px solid rgba(212,168,67,0.15);
        border-radius:10px; padding:${isLandscape ? '12px 16px' : '16px 22px'};
        backdrop-filter:blur(6px); box-shadow: 0 6px 24px rgba(0,0,0,0.4);">
        ${[
          { coin: 'Bitcoin', val: '$12,430', c: '#f7931a' },
          { coin: 'Ethereum', val: '$8,245', c: '#627eea' },
          { coin: 'Solana', val: '$3,820', c: '#9945ff' },
          { coin: 'USDC', val: '$2,140', c: '#2775ca' },
          { coin: 'Arbitrum', val: '$1,925', c: '#28a0f0' },
          { coin: 'Polygon', val: '$1,240', c: '#8247e5' },
        ].map(({ coin, val, c }) =>
          `<div style="display:flex; justify-content:space-between; gap:${isLandscape ? '20px' : '28px'};
            padding:3px 0; color:rgba(255,255,255,0.7);">
            <span style="display:flex;align-items:center;gap:6px;">
              <span style="width:8px;height:8px;border-radius:50%;background:${c};display:inline-block;"></span>${coin}</span>
            <span style="color:${WHITE}; font-weight:600;">${val}</span></div>`
        ).join('')}
      </div>`;
  }

  if (type === 'books') {
    const bottom = isStories ? '35%' : isLandscape ? '32%' : '30%';
    const right = isLandscape ? '4%' : '6%';
    const bw = isLandscape ? '75px' : isStories ? '100px' : '90px';
    const bh = isLandscape ? '100px' : isStories ? '135px' : '120px';
    const fs = isLandscape ? '10px' : '12px';
    return `
      <div style="position:absolute; bottom:${bottom}; right:${right}; z-index:2;
        display:flex; gap:${isLandscape ? '8px' : '10px'};">
        ${[
          { t: 'CRYPTO<br>TAXES', bg: 'linear-gradient(180deg, #1a1510 0%, #12100a 100%)' },
          { t: 'TAX<br>PLANNING', bg: 'linear-gradient(180deg, #181412 0%, #100e0a 100%)' },
          { t: 'DIGITAL<br>ASSETS', bg: 'linear-gradient(180deg, #16120e 0%, #0e0c08 100%)' },
        ].map(book =>
          `<div style="width:${bw}; height:${bh};
            background:${book.bg}; border:1px solid rgba(212,168,67,0.25);
            border-radius:4px; display:flex; align-items:center; justify-content:center;
            text-align:center; padding:10px;
            font-family:'Oswald',sans-serif; font-size:${fs};
            color:${GOLD}; letter-spacing:1.2px; line-height:1.4;
            box-shadow: 4px 0 12px rgba(0,0,0,0.5), inset 0 0 20px rgba(212,168,67,0.03);">
            ${book.t}</div>`
        ).join('')}
      </div>`;
  }

  return '';
}

function generateHTML(ad, size) {
  const { w, h } = size;
  const isLandscape = w === 1200;
  const isStories = h === 1920;

  const headlineSize = isLandscape ? '52px' : isStories ? '76px' : '68px';
  const sublineSize = isLandscape ? '20px' : isStories ? '28px' : '24px';
  const brandSize = isLandscape ? '22px' : isStories ? '30px' : '26px';
  const badgeFontSize = isLandscape ? '12px' : '14px';
  const ctaFontSize = isLandscape ? '15px' : '17px';
  const padX = isLandscape ? '50px' : isStories ? '65px' : '60px';
  const padTop = isStories ? '130px' : isLandscape ? '55px' : '65px';

  const headlineHTML = ad.headlines.map(line =>
    `<div style="color:${line.gold ? GOLD : WHITE}; font-style:${line.gold ? 'italic' : 'normal'};">${line.text}</div>`
  ).join('');

  const ctaBottom = isStories ? '85px' : isLandscape ? '40px' : '55px';
  const badgeBottom = isStories ? '170px' : isLandscape ? '105px' : '138px';

  const headlineBlock = `
    <div style="position:absolute; top:${padTop}; left:${padX}; z-index:2;
      ${isLandscape ? 'max-width:52%;' : 'max-width:72%;'}">
      <div style="font-family:'Oswald',sans-serif; font-weight:700; font-size:${headlineSize};
        line-height:1.02; letter-spacing:-0.5px; text-transform:uppercase;
        text-shadow: 0 2px 20px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.3);">
        ${headlineHTML}
      </div>
      ${ad.hasSubline ? `
        <div style="font-family:'Georgia','Times New Roman',serif; font-style:italic;
          font-size:${sublineSize}; color:rgba(255,255,255,0.75); margin-top:${isLandscape ? '10px' : '16px'};
          text-shadow: 0 1px 8px rgba(0,0,0,0.5);">
          ${ad.subline}
        </div>` : ''}
      <div style="margin-top:${isLandscape ? '16px' : '24px'};">
        <div style="width:40px; height:2px; background:${GOLD}; margin-bottom:12px;
          box-shadow: 0 0 8px rgba(212,168,67,0.4);"></div>
        <div style="font-family:'Oswald',sans-serif; font-weight:400; font-size:${brandSize};
          letter-spacing:3.5px; color:${WHITE};
          text-shadow: 0 1px 8px rgba(0,0,0,0.5);">
          CAMUSO <span style="color:${GOLD};">CPA</span>
        </div>
      </div>
    </div>`;

  const badge = `
    <div style="position:absolute; bottom:${badgeBottom}; z-index:2;
      ${isLandscape ? 'right:50px;' : 'left:50%; transform:translateX(-50%);'}
      background:rgba(6,5,3,0.85); border:1.5px solid rgba(212,168,67,0.5); border-radius:10px;
      padding:${isLandscape ? '10px 20px' : '14px 26px'}; display:flex; align-items:center; gap:14px;
      white-space:nowrap; backdrop-filter:blur(10px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,168,67,0.1);">
      <div style="width:${isLandscape ? '28px' : '34px'}; height:${isLandscape ? '28px' : '34px'};
        border:1.5px solid ${GOLD}; border-radius:7px; display:flex; align-items:center;
        justify-content:center; font-size:${isLandscape ? '14px' : '17px'}; color:${GOLD};">&#9745;</div>
      <div style="font-family:'Oswald',sans-serif; font-size:${badgeFontSize}; font-weight:600;
        letter-spacing:1.5px; color:${WHITE}; text-transform:uppercase; line-height:1.4;">
        FREE CRYPTO TAX<br>CONSULTATION
      </div>
    </div>`;

  const cta = `
    <div style="position:absolute; bottom:${ctaBottom}; z-index:2;
      ${isLandscape ? 'right:50px;' : 'left:50%; transform:translateX(-50%);'}">
      <div style="background: linear-gradient(180deg, #dbb44e 0%, #c49a38 100%);
        color:#0a0808; font-family:'Oswald',sans-serif;
        font-weight:700; font-size:${ctaFontSize}; letter-spacing:2px; text-transform:uppercase;
        padding:${isLandscape ? '15px 40px' : '17px 48px'}; border-radius:5px; text-align:center;
        box-shadow: 0 4px 24px rgba(212,168,67,0.35), 0 1px 0 rgba(255,255,255,0.15) inset;
        border: 1px solid rgba(255,255,255,0.1);">
        GET FREE CONSULTATION &nbsp;&rarr;
      </div>
    </div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Oswald:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${w}px; height: ${h}px;
      overflow: hidden; background: ${DARK}; color: ${WHITE};
      position: relative;
    }
    .canvas-wrap {
      width: 100%; height: 100%;
      position: relative;
    }
  </style>
</head>
<body>
  <div class="canvas-wrap">
    ${canvasBackgroundScript(ad.scene, w, h)}
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
      await page.waitForTimeout(2000);

      const filename = `${ad.id}-${size.name}.png`;
      await page.screenshot({ path: path.join(outDir, filename), type: 'png' });
      await page.close();

      count++;
      console.log(`[${count}/${total}] ${filename}`);
    }
  }

  await browser.close();
  console.log(`\nDone! ${total} ads generated in ads/meta/`);
})();
