// A hidden canvas only finds letter coordinates.
// The visible garden is HTML.

const garden = document.getElementById('garden');
const layer = document.getElementById('particles');
const effects = document.getElementById('effects');
const reset = document.getElementById('reset');
const start = document.getElementById('start');

const reducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

let started = false;
let seeds = [];
let width;
let height;
let flowerCount = 0;

function makeGarden() {
  started = false;
  start.hidden = false;

  width = garden.clientWidth;
  height = garden.clientHeight;

  layer.replaceChildren();
  effects.replaceChildren();

  flowerCount = 0;
  seeds = [];

  const canvas = document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');

  let size = Math.min(width * 0.30, height * 0.43);

  ctx.font = `italic bold ${size}px Georgia`;

  // Fit the word on both phone and desktop screens.
  size *= (width * 0.85) / ctx.measureText('bloom').width;
  size = Math.min(size, height * 0.43);

  ctx.font = `italic bold ${size}px Georgia`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillText('bloom', width / 2, height * 0.5);

  const pixels = ctx.getImageData(
    0,
    0,
    width,
    height
  ).data;

  const spacing = width < 600 ? 5 : 6;
  const fragment = document.createDocumentFragment();

  for (let y = 0; y < height; y += spacing) {
    for (let x = 0; x < width; x += spacing) {
      if (pixels[(y * width + x) * 4 + 3] > 120) {
        const dot = document.createElement('span');

        dot.className = 'seed';
        dot.textContent = Math.random() > 0.72 ? '×' : '·';

        const startX = Math.random() * width;
        const startY = Math.random() * height;

        seeds.push({
          element: dot,
          x: startX,
          y: startY,
          targetX: x,
          targetY: y,
          grown: false,
          phase: Math.random() * Math.PI * 2
        });

        fragment.appendChild(dot);
      }
    }
  }

  layer.appendChild(fragment);
}

// Capture mouse coordinates, create elements,
// and append them at the click position.

garden.addEventListener('click', function (event) {
  if (!started) {
    if (!event.target.closest('#start')) {
      return;
    }

    started = true;
    start.hidden = true;
  }

  const bounds = garden.getBoundingClientRect();

  const x = event.detail === 0
    ? width / 2
    : event.clientX - bounds.left;

  const y = event.detail === 0
    ? height / 2
    : event.clientY - bounds.top;

  // Create water drops.
  for (let i = 0; i < 12; i++) {
    const drop = document.createElement('span');

    drop.className = 'drop';
    drop.style.left = `${x}px`;
    drop.style.top = `${y}px`;

    drop.style.setProperty(
      '--dx',
      `${(Math.random() - 0.5) * 65}px`
    );

    effects.appendChild(drop);

    setTimeout(() => {
      drop.remove();
    }, 800);
  }

  // Each watering gathers the closest remaining seeds.
  // Every click helps, even outside the letter shape.
  const remaining = seeds.filter(seed => !seed.grown);

  remaining.sort((a, b) => {
    const distanceA = Math.hypot(a.x - x, a.y - y);
    const distanceB = Math.hypot(b.x - x, b.y - y);

    return distanceA - distanceB;
  });

  remaining
    .slice(0, Math.ceil(seeds.length / 14))
    .forEach(seed => {
      seed.grown = true;
      seed.element.classList.add('grown');
    });

  if (!remaining.length) {
    plantFlower(x, y);
  }
});

function plantFlower(x, y) {
  const flower = document.createElement('span');

  flower.className = 'flower';
  flower.textContent = ['✳', '✿', '❋', '⁕'][flowerCount % 4];

  flower.style.left = `${x - 15}px`;
  flower.style.top = `${y - 25}px`;

  effects.appendChild(flower);

  flowerCount++;

  // Keep the garden light after lots of clicks.
  const flowers = effects.querySelectorAll('.flower');

  if (flowers.length > 70) {
    flowers[0].remove();
  }
}

let previousTime = 0;

function animate(time) {
  const delta = Math.min(
    (time - previousTime) / 16.67 || 1,
    3
  );

  previousTime = time;

  seeds.forEach(seed => {
    if (seed.grown) {
      const ease = reducedMotion
        ? 1
        : 1 - Math.pow(0.92, delta);

      seed.x += (seed.targetX - seed.x) * ease;
      seed.y += (seed.targetY - seed.y) * ease;
    }

    const drift = seed.grown || reducedMotion
      ? 0
      : Math.sin(time * 0.0007 + seed.phase) * 4;

    seed.element.style.transform =
      `translate(${seed.x}px, ${seed.y + drift}px)`;

    seed.element.style.opacity = 1;
  });

  requestAnimationFrame(animate);
}

reset.addEventListener('click', makeGarden);

let resizeTimer;

window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(makeGarden, 200);
});

makeGarden();
requestAnimationFrame(animate);