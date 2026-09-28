"use client";

import { useEffect, useRef } from "react";

/*
 * A heat trail over the hero portrait, after the party page on the GTHR site:
 * where the pointer has just been, the photo is read as a thermal image and
 * recoloured through a ramp taken from the portrait itself (black ground, the
 * cold blue rim light on the face, the orange-red halation around the shirt).
 * The trail cools and thins behind the pointer, and the photo shows through
 * untouched everywhere else.
 */

const TRAIL = 120; // points kept in the trail (enough for a few seconds of drawing)
const LIFE = 5; // seconds each point glows

// The portrait's own colours, dark to hot (raw sRGB)
const RAMP: [number, string][] = [
  [0, "04050a"],
  [0.14, "0a1433"],
  [0.3, "1d3f9e"],
  [0.44, "4f86f0"],
  [0.56, "bcd6ff"],
  [0.66, "ff6a3d"],
  [0.76, "f2361f"],
  [0.86, "ffae84"],
  [1, "fff3ea"],
];

const vertex = `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
  }
`;

const fragment = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uImage;
  uniform vec2 uCover; // object-cover crop: scale of uv into the image
  uniform float uTime;
  uniform vec4 uTrail[${TRAIL}]; // xy point (0..1, y down), z heat, w radius
  uniform vec3 uRamp[${RAMP.length}];
  uniform float uRampAt[${RAMP.length}];

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  vec3 ramp(float h) {
    vec3 col = uRamp[0];
    for (int i = 1; i < ${RAMP.length}; i++) {
      float k = clamp((h - uRampAt[i - 1]) / (uRampAt[i] - uRampAt[i - 1]), 0.0, 1.0);
      col = mix(col, uRamp[i], k);
    }
    return col;
  }

  void main() {
    vec2 p = vec2(vUv.x, 1.0 - vUv.y);

    // A slow wobble so the glow's edges read as heat haze rather than a brush
    vec2 w = p + vec2(sin(p.y * 9.0 + uTime * 1.3), cos(p.x * 8.0 - uTime * 1.1)) * 0.012;
    float heat = 0.0;
    for (int i = 0; i < ${TRAIL}; i++) {
      vec4 t = uTrail[i];
      vec2 d = w - t.xy;
      heat += t.z * exp(-dot(d, d) / (t.w * t.w));
    }
    heat = clamp(heat, 0.0, 1.0);
    if (heat < 0.004) {
      gl_FragColor = vec4(0.0);
      return;
    }

    vec2 uv = (p - 0.5) * uCover + 0.5;
    vec3 photo = texture2D(uImage, uv).rgb;
    float lum = dot(photo, vec3(0.2126, 0.7152, 0.0722));

    // The photo's brightness is the base temperature; the trail adds to it,
    // so the black ground warms to deep blue and the face and shirt run hot.
    float t = clamp(pow(lum, 0.8) * 0.7 + heat * 0.72, 0.0, 1.0);
    vec3 col = ramp(t);

    // Grain, to match the photo's own
    col += (hash(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5) * 0.07;

    float a = smoothstep(0.0, 0.55, heat);
    gl_FragColor = vec4(col * a, a);
  }
`;

const hex = (s: string) => [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);

export function PortraitHeat() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = canvas?.parentElement?.querySelector("img");
    if (!canvas || !img) return;
    if (!matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;

    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(program, name);
    gl.uniform3fv(u("uRamp"), RAMP.flatMap(([, c]) => hex(c)));
    gl.uniform1fv(u("uRampAt"), RAMP.map(([at]) => at));
    const uTrail = u("uTrail");
    const uTime = u("uTime");
    const uCover = u("uCover");

    // The photo already on screen (the optimised size the page loaded)
    const texture = gl.createTexture();
    let ready = false;
    const upload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      ready = true;
    };
    if (img.complete && img.naturalWidth) upload();
    else img.addEventListener("load", upload, { once: true });

    const points = Array.from({ length: TRAIL }, () => ({ x: 0, y: 0, born: -99, heat: 0 }));
    const slots = new Float32Array(TRAIL * 4);
    let next = 0;
    let lastX = NaN;
    let lastY = NaN;
    let frame = 0;
    const start = performance.now();
    const now = () => (performance.now() - start) / 1000;

    function resize() {
      const dpr = Math.min(devicePixelRatio, 2);
      const w = Math.round(canvas!.clientWidth * dpr);
      const h = Math.round(canvas!.clientHeight * dpr);
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
        gl!.viewport(0, 0, w, h);
      }
      // object-cover: fit the image's short side to the frame
      const box = w / Math.max(1, h);
      const pic = img!.naturalWidth / Math.max(1, img!.naturalHeight) || 1;
      gl!.uniform2f(uCover, box > pic ? 1 : box / pic, box > pic ? pic / box : 1);
    }

    function draw() {
      const t = now();
      let alive = false;
      points.forEach((p, i) => {
        const age = (t - p.born) / LIFE;
        const fade = age >= 1 ? 0 : (1 - age) * (1 - age);
        if (fade > 0) alive = true;
        slots.set([p.x, p.y, p.heat * fade, 0.09 * (1 - 0.55 * Math.min(1, age))], i * 4);
      });
      resize();
      gl!.uniform4fv(uTrail, slots);
      gl!.uniform1f(uTime, t);
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      frame = alive ? requestAnimationFrame(draw) : 0;
    }

    function onMove(event: PointerEvent) {
      if (!ready || (event.pointerType !== "mouse" && event.pointerType !== "pen")) return;
      const r = canvas!.getBoundingClientRect();
      const x = (event.clientX - r.left) / r.width;
      const y = (event.clientY - r.top) / r.height;
      if (x < -0.1 || x > 1.1 || y < -0.1 || y > 1.1) {
        lastX = NaN;
        return;
      }
      const moved = Number.isNaN(lastX) ? 0 : Math.hypot(x - lastX, y - lastY);
      if (Number.isNaN(lastX) || moved > 0.012) {
        const p = points[next];
        p.x = x;
        p.y = y;
        p.born = now();
        p.heat = Math.min(0.85, 0.4 + moved * 4);
        next = (next + 1) % TRAIL;
        lastX = x;
        lastY = y;
        if (!frame) frame = requestAnimationFrame(draw);
      }
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      img.removeEventListener("load", upload);
      // No loseContext here: a remount (Strict Mode runs effects twice) gets
      // this same context back from getContext, and a lost one paints white.
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
