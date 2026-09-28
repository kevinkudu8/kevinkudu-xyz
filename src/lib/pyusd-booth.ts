import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { Reflector } from "three/addons/objects/Reflector.js";

/*
 * The PayPal USD x Solana booth (Breakpoint), rebuilt as a small 3D model from
 * the production renders and the photo on site: a 6m square of turf inside
 * black walls, the long "PayPal USD" wall on the left with the TV on its inner
 * face, L-shaped pillars at the other corners, stepped pallet crates outside,
 * and timber and grass cubes as seating. Everything is primitives plus
 * textures drawn on canvases here, so there are no model files to load.
 *
 * It's staged the way the booth looked on the night rather than as a plan: a
 * dark hall with a polished floor, blue and violet beams sweeping in from the
 * truss, each lamp throwing light onto its graphic, and a crowd around it.
 *
 * Plan coordinates, in metres: x runs left to right, z back (-3) to front (3).
 */

const H = 3; // wall height
const T = 0.24; // wall thickness
const FLOOR = 0.03; // turf thickness: everything inside stands on this
const CUBE = 0.45; // seating cubes

type V3 = [number, number, number];

// Seeded, so the grass and the leaves come out the same on every load
function random(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  return c;
}

function texture(c: HTMLCanvasElement, repeat?: [number, number]) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  return t;
}

/* ---------- Brand marks, drawn on canvases ---------- */

const FONT = `-apple-system, "Helvetica Neue", Arial, sans-serif`;
const SOLANA_GRADIENT = ["#19fb9b", "#5a8dff", "#9945ff"];

/*
 * The PYUSD "P", measured off the official mark: an outlined, slanted P with
 * two bars off the stem, its bowl four half-circles around (1082, 420.5).
 * Coordinates are the reference artwork's, where the disc is centred at
 * (999, 523) with a radius of 520. Filled even-odd: the outer outline, the big
 * counter, and the small one inside the bowl.
 */
const P_PATH = `
  M900 210 L1082 210 A211 211 0 0 1 1082 632 L1022 632 L996 796
  C993 817 976 833 955 833 L817 833 C792 833 773 811 777 787 L818 513
  L767 513 A30 30 0 0 1 767 454 L828 454 L837 390 L785 390 A29.5 29.5 0 0 1 785 331
  L846 331 L857 250 C860 227 878 210 900 210 Z
  M915 270 L1082 270 A151 151 0 0 1 1082 569 L1005 569 C986 569 970 582 967 600
  L940 769 L837 769 L877 510 L1082 510 A90 90 0 0 0 1082 331 L906 331 Z
  M896 389 L1082 389 A31 31 0 0 1 1082 451 L887 451 Z
`;
const PYUSD_BLUE = "#0473f4";

/** The P, sized as it sits in a disc of radius r centred at (cx, cy). */
function pMark(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  const s = r / 520;
  ctx.save();
  ctx.translate(cx - 999 * s, cy - 523 * s);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.fill(new Path2D(P_PATH), "evenodd");
  ctx.restore();
}

/** The Solana mark: three slanted bars, the middle one mirrored. */
function solanaBars(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, fill: string | CanvasGradient) {
  const bar = w * 0.2;
  const gap = w * 0.09;
  const slant = w * 0.2;
  ctx.fillStyle = fill;
  for (let i = 0; i < 3; i++) {
    const top = y + i * (bar + gap);
    const flip = i === 1;
    ctx.beginPath();
    ctx.moveTo(x + (flip ? 0 : slant), top);
    ctx.lineTo(x + w - (flip ? slant : 0), top);
    ctx.lineTo(x + w - (flip ? 0 : slant), top + bar);
    ctx.lineTo(x + (flip ? slant : 0), top + bar);
    ctx.closePath();
    ctx.fill();
  }
}

function solanaGradient(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  const g = ctx.createLinearGradient(x + w, y, x, y + w * 0.78);
  SOLANA_GRADIENT.forEach((c, i) => g.addColorStop(i / (SOLANA_GRADIENT.length - 1), c));
  return g;
}

/** White P in a ring, as on the dark walls. */
function pRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = r * 0.075;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.96, 0, Math.PI * 2);
  ctx.stroke();
  pMark(ctx, cx, cy, r * 0.9, color);
}

/** White P on the blue disc. */
function pDisc(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.fillStyle = PYUSD_BLUE;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  pMark(ctx, cx, cy, r, "#ffffff");
}

const WHITE = "#efeee9";

const marks = {
  // "P | S", the monogram on the corners
  monogram: () =>
    canvas(1024, 512, (ctx) => {
      pRing(ctx, 250, 256, 190, WHITE);
      ctx.strokeStyle = WHITE;
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(505, 110);
      ctx.lineTo(475, 400);
      ctx.stroke();
      solanaBars(ctx, 580, 128, 330, WHITE);
    }),
  // The circle and "PayPal USD" along the long wall
  wordmark: () =>
    canvas(2048, 512, (ctx) => {
      pDisc(ctx, 230, 256, 210);
      ctx.fillStyle = WHITE;
      ctx.font = `600 250px ${FONT}`;
      ctx.textBaseline = "middle";
      ctx.fillText("PayPal USD", 520, 270);
    }),
  // "PayPal USD | SOLANA" on the back
  lockup: () =>
    canvas(2048, 256, (ctx) => {
      pRing(ctx, 110, 128, 90, WHITE);
      ctx.fillStyle = WHITE;
      ctx.textBaseline = "middle";
      ctx.font = `600 120px ${FONT}`;
      ctx.fillText("PayPal USD", 230, 134);
      ctx.fillRect(900, 50, 8, 160);
      solanaBars(ctx, 970, 78, 128, WHITE);
      ctx.font = `700 124px ${FONT}`;
      ctx.letterSpacing = "10px";
      ctx.fillText("SOLANA", 1130, 134);
    }),
  disc: () => canvas(512, 512, (ctx) => pDisc(ctx, 256, 256, 250)),
  bars: () => canvas(512, 420, (ctx) => solanaBars(ctx, 6, 10, 500, solanaGradient(ctx, 6, 10, 500))),
  // The TV's slide: PayPal USD on Solana
  screen: () =>
    canvas(1024, 576, (ctx) => {
      const bg = ctx.createLinearGradient(0, 0, 1024, 576);
      bg.addColorStop(0, "#070b24");
      bg.addColorStop(0.55, "#10236e");
      bg.addColorStop(1, "#1a3fb8");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1024, 576);
      for (const [x, y, r, c] of [
        [860, 520, 300, "rgba(153,69,255,0.55)"],
        [980, 380, 200, "rgba(220,40,160,0.35)"],
        [120, 60, 260, "rgba(40,90,255,0.25)"],
      ] as const) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, c);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 1024, 576);
      }
      ctx.fillStyle = "#fff";
      ctx.textBaseline = "middle";
      pRing(ctx, 330, 150, 52, "#fff");
      ctx.font = `600 86px ${FONT}`;
      ctx.fillText("PayPal USD", 400, 156);
      ctx.font = `500 44px ${FONT}`;
      ctx.fillText("on", 492, 262);
      solanaBars(ctx, 300, 330, 100, solanaGradient(ctx, 300, 330, 100));
      ctx.fillStyle = "#fff";
      ctx.font = `700 96px ${FONT}`;
      ctx.letterSpacing = "8px";
      ctx.fillText("SOLANA", 420, 372);
      ctx.letterSpacing = "2px";
      ctx.font = `400 22px ${FONT}`;
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.fillText("Issued by PAXOS", 440, 470);
    }),
  // The lit panel on the back-right pillar
  panel: () =>
    canvas(512, 1024, (ctx) => {
      const bg = ctx.createLinearGradient(0, 0, 512, 1024);
      bg.addColorStop(0, "#08102e");
      bg.addColorStop(0.6, "#0e1f5c");
      bg.addColorStop(1, "#3a1d8a");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 512, 1024);
      pDisc(ctx, 150, 470, 95);
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(275, 380);
      ctx.lineTo(262, 560);
      ctx.stroke();
      solanaBars(ctx, 310, 400, 150, solanaGradient(ctx, 310, 400, 150));
    }),
};

/* ---------- Surfaces ---------- */

function speckle(w: number, base: string, colors: string[], count: number, size: [number, number], seed: number) {
  const rand = random(seed);
  return canvas(w, w, (ctx) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, w);
    for (let i = 0; i < count; i++) {
      ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
      const x = rand() * w;
      const y = rand() * w;
      const s = size[0] + rand() * (size[1] - size[0]);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rand() * Math.PI);
      ctx.fillRect(-s / 2, -s * 0.15, s, s * 0.3);
      ctx.restore();
    }
  });
}

function woodCanvas(seed: number, planks: number) {
  const rand = random(seed);
  return canvas(256, 256, (ctx) => {
    const pw = 256 / planks;
    for (let p = 0; p < planks; p++) {
      const tone = 200 + rand() * 30;
      ctx.fillStyle = `rgb(${tone + 22}, ${tone - 18}, ${tone - 80})`;
      ctx.fillRect(p * pw, 0, pw, 256);
      // Grain along the plank
      for (let g = 0; g < 14; g++) {
        ctx.strokeStyle = `rgba(150, 100, 50, ${0.08 + rand() * 0.16})`;
        ctx.lineWidth = 0.6 + rand() * 1.2;
        const x = p * pw + rand() * pw;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(x + rand() * 6 - 3, 90, x + rand() * 6 - 3, 170, x + rand() * 4 - 2, 256);
        ctx.stroke();
      }
      if (rand() < 0.5) {
        ctx.fillStyle = "rgba(120, 70, 30, 0.45)";
        ctx.beginPath();
        ctx.ellipse(p * pw + pw * (0.3 + rand() * 0.4), rand() * 256, 2.5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(90, 55, 25, 0.55)";
      ctx.fillRect(p * pw, 0, 1.5, 256);
    }
  });
}

/** Soft pool of light below a lamp, laid additively over the wall. */
function glowCanvas() {
  return canvas(128, 256, (ctx) => {
    ctx.scale(1, 2.2);
    const g = ctx.createRadialGradient(64, 0, 0, 64, 0, 70);
    g.addColorStop(0, "rgba(255,244,225,0.9)");
    g.addColorStop(0.35, "rgba(255,240,215,0.35)");
    g.addColorStop(1, "rgba(255,240,215,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  });
}

/**
 * A shaft of light through haze: a cone drawn additively, brightest where it
 * faces the camera and near its source, so it reads as volume, not a solid.
 */
function beamMaterial(color: string, strength: number) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uStrength: { value: strength } },
    vertexShader: `
      varying float vAlong;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vAlong = uv.y;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uStrength;
      varying float vAlong;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float facing = pow(abs(dot(vNormal, vView)), 2.2);
        float a = facing * uStrength * (0.2 + 0.8 * vAlong * vAlong);
        gl_FragColor = vec4(uColor, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

/** A cone with its tip at the origin, opening down -y. */
function coneGeometry(length: number, radius: number) {
  const g = new THREE.CylinderGeometry(0.02, radius, length, 32, 1, true);
  g.translate(0, -length / 2, 0);
  return g;
}

export type Beam = { pivot: THREE.Object3D; light: THREE.SpotLight | null; aim: THREE.Vector3; phase: number };

/* ---------- The model ---------- */

function build(lite: boolean) {
  const root = new THREE.Group();
  const beams: Beam[] = [];

  const mat = {
    wall: new THREE.MeshStandardMaterial({ color: "#151515", roughness: 0.7 }),
    black: new THREE.MeshStandardMaterial({ color: "#0c0c0c", roughness: 0.5, metalness: 0.3 }),
    clay: new THREE.MeshStandardMaterial({ color: "#e8e8e3", roughness: 0.75 }),
    pot: new THREE.MeshStandardMaterial({ color: "#1b1b1b", roughness: 0.6 }),
    stem: new THREE.MeshStandardMaterial({ color: "#3b2f1e", roughness: 0.9 }),
    turf: new THREE.MeshStandardMaterial({
      map: texture(speckle(512, "#2f7d3b", ["#3f9448", "#256a30", "#4aa052", "#1f5a28", "#357f3c"], 26000, [2, 6], 7), [4, 4]),
      roughness: 1,
    }),
    hedge: new THREE.MeshStandardMaterial({
      map: texture(speckle(256, "#2c6a2a", ["#4f9a3c", "#1d4a1c", "#3d8233", "#60ad48", "#244f20"], 9000, [2, 5], 11)),
      roughness: 1,
    }),
    wood: [1, 2, 3].map(
      (seed) => new THREE.MeshStandardMaterial({ map: texture(woodCanvas(seed, 4)), roughness: 0.85 }),
    ),
    slat: [4, 5].map((seed) => new THREE.MeshStandardMaterial({ map: texture(woodCanvas(seed, 1)), roughness: 0.85 })),
    leaf: ["#2d4a1b", "#3c5e22", "#48702a", "#263f17"].map(
      (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, side: THREE.DoubleSide }),
    ),
    shaft: beamMaterial("#ffd9ae", 0.16),
    glow: new THREE.MeshBasicMaterial({
      map: texture(glowCanvas()),
      transparent: true,
      // Softer where the lamps have real lights of their own
      opacity: lite ? 0.22 : 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  };

  const box = (size: V3, pos: V3, material: THREE.Material, parent: THREE.Object3D = root) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    m.position.set(...pos);
    m.castShadow = m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  /** A flat graphic on a wall face. `normal` is the way the face looks. */
  const decal = (
    c: HTMLCanvasElement,
    width: number,
    center: V3,
    normal: "x" | "-x" | "z" | "-z",
    { glow = false }: { glow?: boolean } = {},
  ) => {
    const height = (width * c.height) / c.width;
    const map = texture(c);
    // Lit graphics are pushed past white so the bloom picks them up
    const material = glow
      ? new THREE.MeshBasicMaterial({ map, transparent: true, color: new THREE.Color(1.6, 1.6, 1.6) })
      : new THREE.MeshStandardMaterial({
          map,
          transparent: true,
          roughness: 0.45,
          metalness: 0.15,
          emissive: "#ffffff",
          emissiveMap: map,
          emissiveIntensity: 0.18,
        });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    m.position.set(...center);
    m.rotation.y = { x: Math.PI / 2, "-x": -Math.PI / 2, z: 0, "-z": Math.PI }[normal];
    root.add(m);
    return m;
  };

  // Turf
  const turf = box([6, FLOOR, 6], [0, FLOOR / 2, 0], mat.turf);
  turf.castShadow = false;

  // Walls: the long left wall, the back wall, and the L-shaped pillars
  const walls: [V3, V3][] = [
    [[T, H, 6], [-3 + T / 2, H / 2, 0]], // left
    [[1.3, H, T], [-2.35, H / 2, 3 - T / 2]], // front-left return
    [[3.6, H, T], [-1.2, H / 2, -3 + T / 2]], // back
    [[1.3, H, T], [2.35, H / 2, -3 + T / 2]], // back-right pillar
    [[T, H, 1.3], [3 - T / 2, H / 2, -2.35]],
    [[1.3, H, T], [2.35, H / 2, 3 - T / 2]], // front-right pillar
    [[T, H, 1.3], [3 - T / 2, H / 2, 2.35]],
  ];
  for (const [size, pos] of walls) box(size, pos, mat.wall);

  // Graphics
  const out = 0.012;
  decal(marks.wordmark(), 4.4, [-3 - out, 1.95, 0.1], "-x");
  decal(marks.monogram(), 1.1, [-2.35, 2.05, 3 + out], "z");
  decal(marks.lockup(), 3.1, [-1.2, 2.3, -3 - out], "-z");
  decal(marks.disc(), 1.05, [2.35, 1.75, 3 + out], "z");
  decal(marks.bars(), 0.8, [3 + out, 1.75, 2.35], "x", { glow: true });
  decal(marks.monogram(), 1.1, [2.35, 2.1, -3 - out], "-z");
  decal(marks.panel(), 1.1, [3 + out, 1.5, -2.35], "x", { glow: true }).scale.set(1, 1.1, 1);

  // Lamps on arms over the graphics, each lighting its graphic, with a soft
  // shaft of light and a pool on the wall
  const lamps: [V3, "x" | "-x" | "z" | "-z"][] = [
    [[-3, 0, -1.9], "-x"],
    [[-3, 0, -0.6], "-x"],
    [[-3, 0, 0.7], "-x"],
    [[-3, 0, 2.0], "-x"],
    [[-2.35, 0, 3], "z"],
    [[-2.2, 0, -3], "-z"],
    [[-0.3, 0, -3], "-z"],
    [[2.35, 0, 3], "z"],
    [[3, 0, 2.35], "x"],
    [[2.35, 0, -3], "-z"],
    [[3, 0, -2.35], "x"],
  ];
  const headGeo = new THREE.CylinderGeometry(0.05, 0.075, 0.2, 16);
  for (const [[x, , z], face] of lamps) {
    const n = { x: [1, 0], "-x": [-1, 0], z: [0, 1], "-z": [0, -1] }[face];
    const lamp = new THREE.Group();
    lamp.position.set(x, H, z);
    lamp.rotation.y = Math.atan2(n[0], n[1]);
    // In lamp space the wall face is at local z=0, facing +z
    // No shadows from the lamps: on the wall below they read as more lamps
    box([0.02, 0.02, 0.4], [0, 0.04, 0.18], mat.black, lamp).castShadow = false;
    const head = new THREE.Mesh(headGeo, mat.black);
    // Lens end down and back toward the graphic
    head.position.set(0, 0.02, 0.4);
    head.rotation.x = 0.85;
    lamp.add(head);
    root.add(lamp);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.2), mat.glow);
    glow.position.set(x + n[0] * 0.02, H - 1.05, z + n[1] * 0.02);
    glow.rotation.y = Math.atan2(n[0], n[1]);
    root.add(glow);

    const from = new THREE.Vector3(x + n[0] * 0.4, H + 0.02, z + n[1] * 0.4);
    const to = new THREE.Vector3(x + n[0] * 0.02, H - 1.4, z + n[1] * 0.02);
    const shaft = new THREE.Mesh(coneGeometry(from.distanceTo(to), 0.45), mat.shaft);
    shaft.position.copy(from);
    shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), to.clone().sub(from).normalize());
    root.add(shaft);
    if (!lite) {
      const spot = new THREE.SpotLight("#ffd3a1", 22, 4.5, 0.42, 0.8, 2);
      spot.position.copy(from);
      spot.target.position.copy(to);
      root.add(spot, spot.target);
    }
  }

  // Pallets stood on edge and layered in steps, as in the photo: each layer
  // out from the wall is lower than the one behind it
  const PALLET_H = 0.4;
  const PALLET_D = 0.15;
  const pallet = (along: "x" | "z", from: number, to: number, across: number, level: number, seed: number) => {
    const g = new THREE.Group();
    const len = to - from;
    const m = mat.slat[seed % 2];
    // Built running along x with its deck faces toward ±z, then turned for the side walls
    for (let i = 0; i < 4; i++) {
      for (const face of [-1, 1]) box([len, 0.075, 0.02], [0, 0.04 + i * 0.107, face * (PALLET_D / 2 - 0.01)], m, g);
    }
    for (const at of [-1, 0, 1]) box([0.09, PALLET_H - 0.01, PALLET_D - 0.04], [at * (len / 2 - 0.045), PALLET_H / 2, 0], m, g);
    const mid = (from + to) / 2;
    g.position.set(along === "x" ? mid : across, level * PALLET_H, along === "x" ? across : mid);
    if (along === "z") g.rotation.y = Math.PI / 2;
    root.add(g);
  };
  const stack = (along: "x" | "z", from: number, to: number, across: number, tiers: number, seed: number) => {
    for (let t = 0; t < tiers; t++) pallet(along, from, to, across, t, seed + t);
  };
  // Centre of the nth layer out from a wall face at 3
  const layer = (n: number) => 3.01 + PALLET_D / 2 + n * (PALLET_D + 0.01);

  // Front-left corner: along the front, running across the corner...
  stack("x", -3.02 - 3 * (PALLET_D + 0.01), -1.85, layer(0), 3, 1);
  stack("x", -3.02 - 3 * (PALLET_D + 0.01), -2.15, layer(1), 2, 2);
  stack("x", -3.02 - 3 * (PALLET_D + 0.01), -2.45, layer(2), 1, 3);
  // ...and down the long wall, stepping lower away from the corner
  stack("z", 1.8, 3.0, -layer(0), 3, 4);
  stack("z", 0.6, 1.8, -layer(0), 2, 5);
  stack("z", -0.6, 0.6, -layer(0), 1, 6);
  stack("z", 1.8, 3.0, -layer(1), 2, 7);
  stack("z", 0.6, 1.8, -layer(1), 1, 8);
  stack("z", 1.8, 3.0, -layer(2), 1, 9);
  // Back-right, outside the pillar
  stack("z", -2.95, -1.75, layer(0), 2, 10);
  stack("z", -1.75, -0.95, layer(0), 1, 11);
  stack("z", -2.95, -1.75, layer(1), 1, 12);

  // TV on a rolling stand against the left wall, facing the room
  const tv = new THREE.Group();
  tv.position.set(-2.62, FLOOR, -0.3);
  box([0.07, 1.12, 1.96], [0.12, 1.5, 0], mat.black, tv);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 1.07),
    new THREE.MeshBasicMaterial({ map: texture(marks.screen()), color: new THREE.Color(1.5, 1.5, 1.5) }),
  );
  screen.position.set(0.16, 1.5, 0);
  screen.rotation.y = Math.PI / 2;
  tv.add(screen);
  box([0.05, 1.2, 0.07], [0.05, 0.62, -0.35], mat.black, tv);
  box([0.05, 1.2, 0.07], [0.05, 0.62, 0.35], mat.black, tv);
  box([0.7, 0.04, 1.1], [0.3, 0.07, 0], mat.black, tv);
  root.add(tv);

  // Seating: timber and grass cubes in loose rows facing the TV
  const rand = random(3);
  const seats: V3[] = [];
  [-1.2, -0.25, 0.7, 1.65].forEach((x, col) => {
    [-1.9, -0.95, 0, 0.95, 1.9].forEach((z, row) => {
      if ((col === 0 && row === 4) || (col === 3 && row === 0)) return;
      const px = x + (rand() - 0.5) * 0.25;
      const pz = z + (rand() - 0.5) * 0.25;
      const grass = (col + row) % 2 === 0;
      const cube = box([CUBE, CUBE, CUBE], [px, FLOOR + CUBE / 2, pz], grass ? mat.hedge : mat.wood[(col + row) % 3]);
      cube.rotation.y = (rand() - 0.5) * 0.35;
      seats.push([px, FLOOR + CUBE, pz]);
    });
  });

  // Plants in the inside corners
  const leafGeo = new THREE.SphereGeometry(1, 10, 6);
  const plant = (x: number, z: number, seed: number) => {
    const r = random(seed);
    const g = new THREE.Group();
    g.position.set(x, FLOOR, z);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.4, 20), mat.pot);
    pot.position.y = 0.2;
    pot.castShadow = true;
    g.add(pot);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 1.3, 6), mat.stem);
    stem.position.y = 1.0;
    g.add(stem);
    for (let i = 0; i < 46; i++) {
      const leaf = new THREE.Mesh(leafGeo, mat.leaf[Math.floor(r() * mat.leaf.length)]);
      const y = 0.55 + r() * 1.15;
      const a = r() * Math.PI * 2;
      const reach = 0.08 + r() * 0.26 * (1.25 - (y - 0.55) / 1.4);
      leaf.position.set(Math.cos(a) * reach, y, Math.sin(a) * reach);
      leaf.scale.set(0.12 + r() * 0.05, 0.012, 0.075 + r() * 0.03);
      leaf.rotation.set((r() - 0.5) * 0.8, -a, 0.4 + r() * 0.5);
      leaf.castShadow = true;
      g.add(leaf);
    }
    root.add(g);
  };
  plant(-2.55, -2.55, 21);
  plant(2.6, -2.6, 22);
  plant(2.6, 2.6, 23);
  plant(-2.55, 2.5, 24);

  // White scale figures, like the renders: seated audience and a presenter
  const up = new THREE.Vector3(0, 1, 0);
  /** A rounded limb from joint a to joint b. */
  const limb = (parent: THREE.Object3D, a: V3, b: V3, r: number) => {
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const dir = vb.clone().sub(va);
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.001, dir.length()), 4, 12), mat.clay);
    m.position.copy(va.add(vb).multiplyScalar(0.5));
    m.quaternion.setFromUnitVectors(up, dir.normalize());
    m.castShadow = true;
    parent.add(m);
    return m;
  };
  const head = (parent: THREE.Object3D, pos: V3) => {
    const m = new THREE.Mesh(leafGeo, mat.clay);
    m.position.set(...pos);
    m.scale.set(0.1, 0.12, 0.11);
    m.castShadow = true;
    parent.add(m);
  };
  // Figures are built facing +z, then turned to face the screen (-x)
  const seated = (at: V3, turn: number, pose: number) => {
    const f = new THREE.Group();
    f.position.set(...at);
    f.rotation.y = -Math.PI / 2 + turn;
    const lean = pose === 1 ? 0.1 : 0;
    const torso = limb(f, [0, 0.12, 0], [0, 0.5, lean], 0.14);
    torso.scale.x *= 1.2;
    torso.scale.z *= 0.8;
    head(f, [0, 0.8, lean + 0.03]);
    for (const s of [-1, 1]) {
      limb(f, [s * 0.09, 0.07, 0.02], [s * 0.1, 0.1, 0.42], 0.07);
      limb(f, [s * 0.1, 0.08, 0.44], [s * 0.1 + (pose === 2 ? s * 0.08 : 0), -0.4, 0.5], 0.055);
      limb(f, [s * 0.1 + (pose === 2 ? s * 0.08 : 0), -0.42, 0.5], [s * 0.1, -0.44, 0.62], 0.04);
      limb(f, [s * 0.2, 0.55, lean], [s * 0.2, 0.3, 0.2], 0.045);
      limb(f, [s * 0.2, 0.3, 0.2], [s * 0.11, 0.14, 0.38], 0.04);
    }
    root.add(f);
  };
  type Pose = "present" | "idle" | "drink" | "talk";
  const standing = (at: V3, facing: number, pose: Pose, scale = 1) => {
    const f = new THREE.Group();
    f.position.set(...at);
    f.rotation.y = facing;
    f.scale.setScalar(scale);
    const torso = limb(f, [0, 0.98, 0], [0, 1.4, 0], 0.15);
    torso.scale.x *= 1.2;
    torso.scale.z *= 0.8;
    head(f, [0, 1.66, 0.02]);
    for (const s of [-1, 1]) {
      const step = pose === "present" ? s * 0.12 : 0;
      limb(f, [s * 0.09, 0.92, 0], [s * 0.1, 0.5, step], 0.07);
      limb(f, [s * 0.1, 0.5, step], [s * 0.1, 0.1, step - 0.03], 0.055);
      limb(f, [s * 0.1, 0.06, step - 0.02], [s * 0.1, 0.05, step + 0.12], 0.04);
    }
    // Upper arm and forearm, per side: shoulder -> elbow -> hand
    const arm = (s: number, elbow: V3, hand: V3) => {
      limb(f, [s * 0.21, 1.42, 0], elbow, 0.045);
      limb(f, elbow, hand, 0.04);
    };
    const down = (s: number) => arm(s, [s * 0.25, 1.12, -0.02], [s * 0.22, 0.86, 0.06]);
    if (pose === "present") {
      // One hand to the screen, the other open to the room
      arm(1, [0.45, 1.3, 0.08], [0.68, 1.4, 0.18]);
      arm(-1, [-0.3, 1.12, 0.12], [-0.38, 1.02, 0.36]);
    } else if (pose === "drink") {
      down(-1);
      arm(1, [0.25, 1.15, 0.04], [0.17, 1.3, 0.24]);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.028, 0.11, 12), mat.clay);
      cup.position.set(0.17, 1.36, 0.26);
      f.add(cup);
    } else if (pose === "talk") {
      arm(1, [0.25, 1.15, 0.03], [0.17, 1.2, 0.3]);
      arm(-1, [-0.25, 1.15, 0.03], [-0.15, 1.17, 0.29]);
    } else {
      down(1);
      down(-1);
    }
    root.add(f);
  };
  for (const [i, pose] of [
    [0, 0],
    [2, 1],
    [6, 2],
    [8, 0],
    [11, 1],
    [14, 2],
  ]) {
    seated(seats[i], (rand() - 0.5) * 0.5, pose);
  }
  standing([-2.05, FLOOR, 0.95], Math.PI / 2, "present");
  standing([1.2, FLOOR, 2.5], -2.3, "idle");

  // The crowd outside: small groups at the entrances and along the walls,
  // each turned toward whatever they're looking at [x, z, look at x, z, pose]
  const crowd: [number, number, number, number, Pose][] = [
    [1.9, 4.5, 2.35, 3, "idle"],
    [2.55, 4.85, 1.9, 4.5, "talk"],
    [-0.4, 5.4, 0.2, 3, "drink"],
    [4.4, 1.1, 3, 0.8, "drink"],
    [4.95, 0.3, 4.4, 1.1, "talk"],
    [4.5, 3.9, 3.2, 2.6, "idle"],
    [-4.7, -1.4, -3, -0.5, "idle"],
    [-5.1, -0.6, -4.7, -1.4, "talk"],
    [-1.6, -4.3, -1.4, -3, "drink"],
    [-0.9, -4.6, -1.6, -4.3, "talk"],
    [1.6, -4.1, 1.2, -2.8, "idle"],
  ];
  for (const [x, z, tx, tz, pose] of crowd) standing([x, 0, z], Math.atan2(tx - x, tz - z), pose, 0.94 + rand() * 0.1);

  // Beams from the truss overhead, sweeping slowly across the floor
  const truss: [V3, V3, string][] = [
    [[-7, 11, -3], [-2.5, 0, 1], "#3a55ff"],
    [[6.5, 11.5, -5], [2, 0, -1], "#8e44ff"],
    [[-5, 11, 7], [-1, 0, 3.5], "#8e44ff"],
    [[7, 11, 5], [3.5, 0, 2.5], "#3a55ff"],
    [[0, 12, -9], [0, 0, -4], "#5a4dff"],
  ];
  truss.forEach(([from, aim, color], i) => {
    const pivot = new THREE.Group();
    pivot.position.set(...from);
    const length = new THREE.Vector3(...from).distanceTo(new THREE.Vector3(...aim)) + 1;
    pivot.add(new THREE.Mesh(coneGeometry(length, length * 0.11), beamMaterial(color, 0.13)));
    root.add(pivot);
    let light: THREE.SpotLight | null = null;
    if (!lite) {
      light = new THREE.SpotLight(color, 2600, 30, 0.13, 0.55, 2);
      light.position.set(...from);
      root.add(light, light.target);
    }
    beams.push({ pivot, light, aim: new THREE.Vector3(...aim), phase: i * 1.7 });
  });

  return { root, beams };
}


/** Moves each truss beam (and its light) along a slow figure over the floor. */
function sweep(beams: Beam[], t: number) {
  const down = new THREE.Vector3(0, -1, 0);
  const at = new THREE.Vector3();
  for (const { pivot, light, aim, phase } of beams) {
    at.set(aim.x + Math.sin(t * 0.21 + phase) * 2.2, 0, aim.z + Math.cos(t * 0.17 + phase * 1.3) * 1.8);
    pivot.quaternion.setFromUnitVectors(down, at.clone().sub(pivot.position).normalize());
    light?.target.position.copy(at);
  }
}

/**
 * Renders the booth into `container`, with the camera circling it slowly;
 * dragging turns it. Returns a cleanup function.
 */
export function mountBooth(container: HTMLElement, { onReady }: { onReady?: () => void } = {}) {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Phones get the same scene without the mirror floor and the lamps' own lights
  const lite = matchMedia("(max-width: 767px)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  const dpr = Math.min(devicePixelRatio, lite ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvasEl = renderer.domElement;
  canvasEl.style.cssText = "position:absolute;inset:0;width:100%;height:100%;touch-action:pan-y;cursor:grab";
  container.appendChild(canvasEl);

  // The hall: near-black with a blue cast, and haze that swallows the far floor
  const HALL = "#05060d";
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(HALL);
  scene.fog = new THREE.FogExp2(HALL, 0.045);
  const { root, beams } = build(lite);
  scene.add(root);

  // A little blue skylight so nothing goes fully black...
  scene.add(new THREE.HemisphereLight("#3b4bb8", "#0a0812", 0.7));
  // ...a cool key from high at the front for shape and shadow...
  const key = new THREE.SpotLight("#dfe5ff", 900, 40, 0.42, 0.8, 2);
  key.position.set(-5, 13, 9);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 4;
  scene.add(key, key.target);
  // ...and a warm wash over the seating inside
  const house = new THREE.SpotLight("#ffe2bd", 260, 20, 0.42, 0.9, 2);
  house.position.set(0, 9, 0.5);
  scene.add(house, house.target);
  // The TV throws a little blue onto the room
  const tvGlow = new THREE.PointLight("#4a6bff", 6, 4, 2);
  tvGlow.position.set(-2.1, 1.5, -0.3);
  scene.add(tvGlow);

  // The floor: a mirror under a dark glossy skin, so the booth and beams
  // reflect softly. On phones it's the skin alone.
  const FLOOR_R = 40;
  let mirror: Reflector | null = null;
  if (!lite) {
    mirror = new Reflector(new THREE.CircleGeometry(FLOOR_R, 64), {
      textureWidth: 1024,
      textureHeight: 1024,
      color: 0x8a8a8a,
    });
    mirror.rotation.x = -Math.PI / 2;
    scene.add(mirror);
  }
  const skin = new THREE.Mesh(
    new THREE.CircleGeometry(FLOOR_R, 64),
    new THREE.MeshStandardMaterial({
      color: "#0b0d18",
      roughness: 0.45,
      metalness: 0.1,
      transparent: !lite,
      opacity: lite ? 1 : 0.8,
    }),
  );
  skin.rotation.x = -Math.PI / 2;
  skin.position.y = 0.002;
  skin.receiveShadow = true;
  scene.add(skin);

  const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.5, 100);
  const target = new THREE.Vector3(0, 1.0, 0);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.45, 0.5, 0.9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let distance = 15.5;
  function resize() {
    const { clientWidth: w, clientHeight: h } = container;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    composer.setPixelRatio(dpr);
    composer.setSize(w, h);
    camera.aspect = w / h;
    // Pull back on narrow frames so the whole booth stays in view
    distance = 15.5 * Math.max(1, 1.5 / camera.aspect);
    camera.updateProjectionMatrix();
  }
  resize();

  // The camera circles slowly, low enough that the walls feel tall, rising
  // and dipping a little as it goes. A drag takes over and then hands back.
  const SPIN = (Math.PI * 2) / 50; // one lap every 50s
  let angle = -(Math.PI / 4 - 0.35); // opens on the front-left corner, as in the photo
  let velocity = reducedMotion ? 0 : SPIN;
  let dragging = false;
  let lastX = 0;
  let lastT = 0;

  const onDown = (e: PointerEvent) => {
    dragging = true;
    lastX = e.clientX;
    lastT = performance.now();
    canvasEl.setPointerCapture(e.pointerId);
    canvasEl.style.cursor = "grabbing";
    wake();
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    const now = performance.now();
    // Dragging right turns the booth right, so the camera goes left
    const dx = -(e.clientX - lastX) * 0.008;
    angle += dx;
    velocity = dx / Math.max(0.008, (now - lastT) / 1000);
    lastX = e.clientX;
    lastT = now;
  };
  const onUp = () => {
    dragging = false;
    canvasEl.style.cursor = "grab";
  };
  canvasEl.addEventListener("pointerdown", onDown);
  canvasEl.addEventListener("pointermove", onMove);
  canvasEl.addEventListener("pointerup", onUp);
  canvasEl.addEventListener("pointercancel", onUp);

  let frame = 0;
  let last = 0;
  let clock = 0;
  let visible = true;
  let first = true;

  function tick(now: number) {
    frame = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (!reducedMotion) clock += dt;
    if (!dragging) {
      // Ease back to the idle circling after a flick
      const rest = reducedMotion ? 0 : SPIN;
      velocity += (rest - velocity) * Math.min(1, dt * 1.8);
      angle += velocity * dt;
    }
    const elevation = 0.27 + 0.05 * Math.sin(clock * 0.13);
    camera.position.set(
      Math.sin(angle) * Math.cos(elevation) * distance,
      target.y + Math.sin(elevation) * distance,
      Math.cos(angle) * Math.cos(elevation) * distance,
    );
    camera.lookAt(target);
    sweep(beams, clock + 4);
    composer.render();
    if (first) {
      first = false;
      onReady?.();
    }
    const moving = !reducedMotion || dragging || Math.abs(velocity) > 0.0005;
    if (visible && moving) frame = requestAnimationFrame(tick);
    else last = 0;
  }
  function wake() {
    if (!frame) frame = requestAnimationFrame(tick);
  }

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && document.visibilityState === "visible";
    if (visible) wake();
  });
  io.observe(container);
  const onVisibility = () => {
    visible = document.visibilityState === "visible";
    if (visible) wake();
  };
  document.addEventListener("visibilitychange", onVisibility);
  const ro = new ResizeObserver(() => {
    resize();
    wake();
  });
  ro.observe(container);
  wake();

  return () => {
    cancelAnimationFrame(frame);
    io.disconnect();
    ro.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    mirror?.dispose();
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        for (const m of [o.material].flat()) {
          for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose();
          m.dispose();
        }
      }
    });
    composer.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvasEl.remove();
  };
}
