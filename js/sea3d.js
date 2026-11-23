/* Ocean theme: the sea creatures as real 3-D objects (three.js), drawn behind the page.
   Lit by fading sunlight and their own bioluminescence, swimming with vertex-shader
   undulation, fading in and out by depth zone. All geometry is built here (no downloads).
   life.js keeps the seabed, plankton and the companion; it reads window.SEA3D.hits so
   tapping a 3-D creature still opens its field-guide card. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const canvas = document.getElementById('sea3d');
const D = window.DIVE;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isHP = () => document.documentElement.dataset.theme === 'hogwarts';
let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' }); } catch { renderer = null; }

if (renderer && D) {
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x05203a, 38, 95);
  const camera = new THREE.PerspectiveCamera(40, 1, .5, 200);
  camera.position.set(0, 0, 40);
  const amb = new THREE.AmbientLight(0x4a7aa6, .6); scene.add(amb);
  const sun = new THREE.DirectionalLight(0xcfeaff, 1.6); sun.position.set(.3, 1, .4); scene.add(sun);
  const hemi = new THREE.HemisphereLight(0x9fd8ff, 0x041222, .5); scene.add(hemi);

  let W = 1, H = 1, halfW = 1, halfH = 1;
  const fit = () => {
    W = innerWidth; H = innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.25)); renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    halfH = Math.tan(THREE.MathUtils.degToRad(20)) * camera.position.z; halfW = halfH * camera.aspect;
  };
  addEventListener('resize', fit); fit();
  const small = () => W < 700;
  const smooth = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  const band = (d, a, b, c, e) => smooth(a, b, d) * (1 - smooth(c, e, d));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const uTime = { value: 0 };

  /* swim: bend the body side to side (or up and down for whales) more towards the tail */
  const swimMat = (params, { len = 1, amp = .12, speed = 8, vertical = false, instanced = false } = {}) => {
    const m = new THREE.MeshStandardMaterial(params);
    m.onBeforeCompile = sh => {
      sh.uniforms.uTime = uTime;
      sh.vertexShader = 'uniform float uTime;\n' + (instanced ? 'attribute float aPhase;\n' : 'const float aPhase = 0.0;\n') + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        float k = clamp((${(len / 2).toFixed(3)} - position.x) / ${len.toFixed(3)}, 0.0, 1.0);
        float sw = sin(uTime * ${speed.toFixed(2)} + aPhase - position.x * ${(6 / len).toFixed(3)}) * ${amp.toFixed(3)} * k * k;
        ${vertical ? 'transformed.y += sw;' : 'transformed.z += sw;'}`);
    };
    return m;
  };
  // a body of revolution along +x (head at +x) from a [radius, x] profile
  const bodyOf = (profile, squashZ = .55, squashY = 1) => {
    const g = new THREE.LatheGeometry(profile.map(([r, x]) => new THREE.Vector2(r, x)), 24);
    g.rotateZ(-Math.PI / 2); g.scale(1, squashY, squashZ); return g;
  };
  const tri = pts => { const s = new THREE.Shape(); s.moveTo(...pts[0]); pts.slice(1).forEach(p => s.lineTo(...p)); return new THREE.ShapeGeometry(s); };
  const merge = gs => mergeGeometries(gs.map(g => g.index ? g.toNonIndexed() : g), false);

  /* projection helpers for hit-testing and placing things in screen space */
  const v3 = new THREE.Vector3();
  const toScreen = (p, out) => { v3.copy(p).project(camera); out.x = (v3.x + 1) / 2 * W; out.y = (1 - v3.y) / 2 * H; return out; };
  const worldAt = (sx, sy) => new THREE.Vector3((sx / W * 2 - 1) * halfW, -(sy / H * 2 - 1) * halfH, 0);
  const pxPerUnit = z => H / (2 * Math.tan(THREE.MathUtils.degToRad(20)) * (camera.position.z - z));
  const hits = [];
  window.SEA3D = { ok: false, hits };
  const hit = (id, p, rWorld) => { const s = toScreen(p, {}); hits.push({ id, x: s.x, y: s.y, r: Math.max(18, rWorld * pxPerUnit(p.z)) }); };
  const setAlpha = (obj, a) => obj.traverse(o => { if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(m => { if (m.userData.base == null) m.userData.base = m.opacity; m.transparent = true; m.opacity = m.userData.base * a; }); } });

  /* ---------------- fish geometry shared by the school and the lanternfish ---------------- */
  const fishGeo = merge([
    bodyOf([[0, -.5], [.035, -.44], [.06, -.32], [.12, -.1], [.14, .1], [.12, .3], [.07, .45], [0, .52]], .5),
    tri([[-.44, 0], [-.68, .2], [-.6, 0], [-.68, -.2]]),
    tri([[0, .12], [.16, .12], [-.08, .24]])
  ]);

  /* ---------------- baitfish school (sunlight zone): instanced boids ---------------- */
  const NF = small() ? 34 : 70;
  const schoolMat = swimMat({ color: 0xbcd6e6, metalness: .75, roughness: .28, transparent: true, opacity: 1 }, { len: 1, amp: .16, speed: 14, instanced: true });
  const fishGeoI = fishGeo.clone(); fishGeoI.setAttribute('aPhase', new THREE.InstancedBufferAttribute(new Float32Array(NF).map(() => Math.random() * 6.28), 1));
  const school = new THREE.InstancedMesh(fishGeoI, schoolMat, NF); school.frustumCulled = false; scene.add(school);
  const boids = Array.from({ length: NF }, () => ({ p: new THREE.Vector3(rnd(-3, 3), rnd(-2, 2), rnd(-4, 4)), v: new THREE.Vector3(rnd(-.08, -.02), rnd(-.02, .02), rnd(-.02, .02)), s: rnd(.85, 1.25) }));
  let schoolC = new THREE.Vector3(halfW * .35, 0, 0);
  const m4 = new THREE.Matrix4(), xAx = new THREE.Vector3(), yAx = new THREE.Vector3(), zAx = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), sc = new THREE.Vector3();
  const orient = (p, v, s, out = m4) => {
    xAx.copy(v).normalize(); zAx.crossVectors(xAx, UP).normalize(); if (zAx.lengthSq() < .01) zAx.set(0, 0, 1);
    yAx.crossVectors(zAx, xAx).normalize();
    out.makeBasis(xAx.multiplyScalar(s), yAx.multiplyScalar(s), zAx.multiplyScalar(s)); out.setPosition(p); return out;
  };

  /* ---------------- blue whale (sunlight zone), far away ---------------- */
  const whaleMat = swimMat({ color: 0x3b5a78, roughness: .85, metalness: .05, transparent: true, opacity: .95 }, { len: 1, amp: .045, speed: 1.6, vertical: true });
  const flukes = tri([[-.47, 0], [-.6, .0], [-.66, .16], [-.56, .05], [-.52, 0], [-.56, -.05], [-.66, -.16], [-.6, 0]]); flukes.rotateX(Math.PI / 2);
  const pecs = [1, -1].map(sd => { const g = tri([[.18, 0], [.05, 0], [-.02, .17 * sd]]); g.rotateX(Math.PI / 2); g.rotateZ(-.3); g.translate(0, -.06, 0); return g; });
  const whaleGeo = merge([bodyOf([[0, -.5], [.02, -.46], [.04, -.36], [.075, -.18], [.1, 0], [.11, .18], [.1, .32], [.075, .44], [.04, .5], [0, .52]], .92, .8), flukes, ...pecs]);
  const whale = new THREE.Mesh(whaleGeo, whaleMat); scene.add(whale);
  const W0 = { x: 1.4, y: .2, z: -34 };

  /* ---------------- lanternfish (twilight): dark fish with glowing photophores ---------------- */
  const NL = small() ? 14 : 26, NP = 6;
  const lanternMat = swimMat({ color: 0x2c4660, roughness: .5, metalness: .5, transparent: true, opacity: 1 }, { len: 1, amp: .12, speed: 10, instanced: true });
  const lGeo = fishGeo.clone(); lGeo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(new Float32Array(NL).map(() => Math.random() * 6.28), 1));
  const lantern = new THREE.InstancedMesh(lGeo, lanternMat, NL); lantern.frustumCulled = false; scene.add(lantern);
  const photoMat = new THREE.MeshBasicMaterial({ color: 0x8ff6ff, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
  const photo = new THREE.InstancedMesh(new THREE.SphereGeometry(.05, 8, 6), photoMat, NL * NP); photo.frustumCulled = false; scene.add(photo);
  const lf = Array.from({ length: NL }, () => ({ x: rnd(-1.1, 1.1), y: rnd(-1, 1), z: rnd(-8, 8), dir: Math.random() < .5 ? -1 : 1, v: rnd(.6, 1.2), s: rnd(1.3, 2), ph: Math.random() * 6 }));
  const phLocal = Array.from({ length: NP }, (_, k) => new THREE.Vector3(.32 - k * .12, -.07, 0));

  /* ---------------- siphonophore (twilight): a glowing colonial chain ---------------- */
  const NB = 30;
  const beadMat = new THREE.MeshBasicMaterial({ color: 0xb39dff, transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false });
  const beads = new THREE.InstancedMesh(new THREE.SphereGeometry(.16, 10, 8), beadMat, NB); beads.frustumCulled = false; scene.add(beads);
  const siphLines = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(NB * 2 * 3), 3)), new THREE.LineBasicMaterial({ color: 0xb39dff, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false }));
  siphLines.frustumCulled = false; scene.add(siphLines);
  const SI = { x: -.4, y: -1.4, z: -2 };

  /* ---------------- anglerfish (midnight → abyss): lit only by its lure ---------------- */
  const anglerMat = new THREE.MeshStandardMaterial({ color: 0x2d3a40, roughness: .55, metalness: .15, transparent: true, opacity: 1 });
  const toothMat = new THREE.MeshStandardMaterial({ color: 0xe8eef0, roughness: .3, transparent: true, opacity: 1 });
  const lureMat = new THREE.MeshBasicMaterial({ color: 0xd9fff3, transparent: true, opacity: 1 });
  const glowMat = new THREE.SpriteMaterial({ color: 0x7fffd4, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false, map: (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.3, 'rgba(255,255,255,.4)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })() });
  const makeAngler = () => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20).scale(1.25, .95, .8), anglerMat); g.add(body);
    const jaw = new THREE.Group(); jaw.position.set(.55, -.25, 0); g.add(jaw);
    jaw.add(new THREE.Mesh(new THREE.SphereGeometry(.75, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).scale(1.05, .55, .85), anglerMat));
    const teeth = new THREE.Group(); g.add(teeth);
    const tg = new THREE.ConeGeometry(.045, .26, 6);
    for (let i = 0; i < 9; i++) { const a = -.9 + i * .225; const t = new THREE.Mesh(tg, toothMat); t.position.set(.55 + Math.cos(a) * .7, -.12, Math.sin(a) * .62); t.rotation.z = Math.PI; teeth.add(t);
      const b = new THREE.Mesh(tg, toothMat); b.position.set(.55 + Math.cos(a) * .7, -.34, Math.sin(a) * .62); jaw.add(b); b.position.sub(jaw.position); }
    const tail = tri([[-1.15, 0], [-1.85, .55], [-1.65, 0], [-1.85, -.55]]); g.add(new THREE.Mesh(tail, new THREE.MeshStandardMaterial({ color: 0x24323a, side: THREE.DoubleSide, transparent: true, opacity: 1 })));
    [1, -1].forEach(sd => { const e = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), new THREE.MeshBasicMaterial({ color: 0xcfe9f2, transparent: true, opacity: 1 })); e.position.set(.62, .35, .55 * sd); g.add(e); });
    const stalk = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(.3, .85, 0), new THREE.Vector3(.65, 1.7, 0), new THREE.Vector3(1.35, 1.95, 0), new THREE.Vector3(1.7, 1.55, 0)]), 20, .035, 6), anglerMat); g.add(stalk);
    const lure = new THREE.Mesh(new THREE.SphereGeometry(.13, 12, 10), lureMat); lure.position.set(1.72, 1.48, 0); g.add(lure);
    const halo = new THREE.Sprite(glowMat.clone()); halo.scale.set(2.6, 2.6, 1); lure.add(halo);
    const light = new THREE.PointLight(0x8fffe0, 6, 7, 1.6); lure.add(light);
    g.userData = { jaw, lure, light, halo };
    scene.add(g); return g;
  };
  const anglers = [makeAngler(), makeAngler()];
  const AN = [{ x: .62, y: -.15, z: 2, dir: -1, ph: 0, s: 1 }, { x: -.65, y: .4, z: -8, dir: 1, ph: 2, s: .75 }];

  /* ---------------- jellyfish (midnight and below) ---------------- */
  const jellyGeo = new THREE.LatheGeometry([[0, .52], [.22, .5], [.4, .42], [.52, .27], [.57, .08], [.55, -.02], [.47, -.04], [.42, 0]].map(([r, y]) => new THREE.Vector2(r, y)), 32);
  const NJ = small() ? 4 : 7, NT = 10, TS = 14;
  const jellies = Array.from({ length: NJ }, (_, i) => {
    const c = i % 3 === 0 ? 0xb69cff : 0x5fe6ff;
    const g = new THREE.Group();
    const bell = new THREE.Mesh(jellyGeo, new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: .35, transparent: true, opacity: .42, roughness: .2, side: THREE.DoubleSide, depthWrite: false }));
    g.add(bell);
    const core = new THREE.Mesh(new THREE.SphereGeometry(.22, 12, 10).scale(1, .6, 1), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false })); core.position.y = .2; g.add(core);
    const glow = new THREE.Sprite(glowMat.clone()); glow.material.color.set(c); glow.material.opacity = .35; glow.scale.set(3, 3, 1); glow.position.y = .2; g.add(glow);
    const tpos = new Float32Array(NT * TS * 2 * 3);
    const tent = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(tpos, 3)), new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false }));
    tent.frustumCulled = false; g.add(tent);
    scene.add(g);
    return { g, bell, tent, tpos, x: rnd(-1, 1), y: rnd(-1.1, 1.1), z: rnd(-10, 6), s: rnd(.8, 1.5), ph: Math.random() * 6.28 };
  });

  /* ---------------- comb jellies (abyss): rainbow cilia rows ---------------- */
  const NC = 4, ROWS = 8, PER = 11;
  const combBodyMat = new THREE.MeshStandardMaterial({ color: 0xd8ecff, transparent: true, opacity: .16, roughness: .1, depthWrite: false });
  const cilMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false });
  const cil = new THREE.InstancedMesh(new THREE.BoxGeometry(.07, .045, .025), cilMat, NC * ROWS * PER); cil.frustumCulled = false; scene.add(cil);
  cil.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NC * ROWS * PER * 3), 3);
  const combs = Array.from({ length: NC }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.5, 20, 16).scale(.62, 1, .62), combBodyMat); scene.add(m); return { m, x: rnd(-1, 1), y: rnd(-1, 1), z: rnd(-6, 4), s: rnd(.9, 1.5), ph: Math.random() * 6 }; });
  const col = new THREE.Color();

  /* ---------------- hadal snailfish: pale, translucent tadpoles ---------------- */
  const snailMat = swimMat({ color: 0xf6cfda, emissive: 0x3a1a24, roughness: .35, transparent: true, opacity: .78 }, { len: 1.6, amp: .1, speed: 4 });
  const snailGeo = bodyOf([[0, -1], [.02, -.85], [.05, -.55], [.1, -.25], [.2, .05], [.27, .28], [.26, .45], [.16, .58], [0, .62]], .7);
  const snails = Array.from({ length: 4 }, () => { const g = new THREE.Group(); g.add(new THREE.Mesh(snailGeo, snailMat));
    const e = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0x1a1016, transparent: true, opacity: 1 })); e.position.set(.42, .1, .15); g.add(e); scene.add(g);
    return { g, x: rnd(-1, 1), y: rnd(-.6, .6), z: rnd(-6, 6), dir: Math.random() < .5 ? -1 : 1, s: rnd(1.2, 1.8), ph: Math.random() * 6 }; });

  /* ---------------- frame ---------------- */
  let lastY = scrollY, last = performance.now(), cleared = false;
  const mouse = { x: -1e4, y: -1e4 };
  addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), sp = {};
  const water = new THREE.Color(), shallow = new THREE.Color(0x0a3a5e), deepC = new THREE.Color(0x020714);

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(50, now - last) / 16.67; last = now;
    const dyPx = Math.max(-40, Math.min(40, scrollY - lastY)); lastY = scrollY;
    hits.length = 0;
    if (isHP()) { if (!cleared) { renderer.clear(); cleared = true; } return; }
    cleared = false;
    const d = D.depth, t = now / 1000; uTime.value = reduced ? 0 : t;
    const dy = dyPx * 2 * halfH / H;                     // scroll parallax in world units
    // light fades with depth; fog takes the water's colour
    const e = Math.pow(d, .7);
    sun.intensity = 1.6 * Math.pow(1 - d, 2.2); hemi.intensity = .5 * (1 - e) + .05; amb.intensity = .55 * (1 - e) + .12;
    water.copy(shallow).lerp(deepC, e); scene.fog.color.copy(water);

    const A = {
      whale: band(d, .005, .03, .12, .2), fish: band(d, .02, .06, .13, .2), lantern: band(d, .1, .16, .34, .42), siph: band(d, .17, .22, .4, .48),
      angler: band(d, .28, .36, .66, .76), jelly: band(d, .4, .52, 2, 3), comb: band(d, .42, .5, .82, .9), snail: band(d, .74, .82, 2, 3)
    };

    // whale
    whale.visible = A.whale > .01;
    if (whale.visible) {
      if (W0.seen !== true) { W0.seen = true; W0.x = .95; }
      if (!reduced) W0.x -= .0009 * dt; if (W0.x < -1.8) { W0.x = 1.8; W0.y = rnd(-.1, .5); }
      W0.y -= dy * .35 / halfH;
      const L = 30 * (small() ? .7 : 1);
      whale.position.set(W0.x * (halfW * 1.9), W0.y * halfH * 1.6 + Math.sin(t * .6) * .8, W0.z);
      whale.scale.setScalar(L); whale.rotation.set(0, Math.PI, Math.sin(t * .3) * .05);
      setAlpha(whale, A.whale);
      hit('whale', whale.position, L * .2);
    } else W0.seen = false;

    // fish school
    school.visible = A.fish > .01;
    if (school.visible) {
      const mw = mouse.x > -1e3 ? worldAt(mouse.x, mouse.y) : null;
      const target = new THREE.Vector3(Math.sin(t * .12) * halfW * .45, Math.sin(t * .17) * halfH * .35, 0);
      schoolC.lerp(target, .004 * dt);
      let cx = 0, cy = 0, cz = 0;
      for (const b of boids) {
        let ax = 0, ay = 0, az = 0, n = 0, sx = 0, sy = 0, sz = 0, vx = 0, vy = 0, vz = 0, px = 0, py = 0, pz = 0;
        for (const o of boids) { if (o === b) continue; tmp.subVectors(o.p, b.p); const q = tmp.lengthSq();
          if (q < 9) { px += o.p.x; py += o.p.y; pz += o.p.z; vx += o.v.x; vy += o.v.y; vz += o.v.z; n++; if (q < .5) { sx -= tmp.x / (q + .05); sy -= tmp.y / (q + .05); sz -= tmp.z / (q + .05); } } }
        if (n) { ax += (px / n - b.p.x) * .002 + (vx / n - b.v.x) * .05; ay += (py / n - b.p.y) * .002 + (vy / n - b.v.y) * .05; az += (pz / n - b.p.z) * .002 + (vz / n - b.v.z) * .05; }
        ax += sx * .004 + (schoolC.x - b.p.x) * .0008; ay += sy * .004 + (schoolC.y - b.p.y) * .0008; az += sz * .004 + (schoolC.z - b.p.z) * .0012;
        if (mw) { tmp.set(b.p.x - mw.x, b.p.y - mw.y, 0); const q = tmp.lengthSq(); if (q < 16) { const k = (1 - q / 16) * .03; ax += tmp.x * k; ay += tmp.y * k; } }
        b.v.x += ax * dt; b.v.y += ay * dt; b.v.z += az * dt;
        const s = b.v.length(), mx = .14, mn = .05; if (s > mx) b.v.multiplyScalar(mx / s); else if (s < mn) b.v.multiplyScalar(mn / s);
        if (!reduced) b.p.addScaledVector(b.v, dt);
        b.p.y += dy * .5;
        cx += b.p.x; cy += b.p.y; cz += b.p.z;
      }
      // keep the school on screen when scrolling
      cy /= NF; if (Math.abs(cy) > halfH * 1.2) boids.forEach(b => { b.p.y -= cy; }); schoolC.y = Math.max(-halfH * .6, Math.min(halfH * .6, schoolC.y));
      boids.forEach((b, i) => school.setMatrixAt(i, orient(b.p, b.v, b.s * (small() ? 1.2 : 1.55))));
      school.instanceMatrix.needsUpdate = true; schoolMat.opacity = A.fish;
      hit('fish', tmp2.set(cx / NF, cy, cz / NF), 3.5);
    }

    // lanternfish + photophores
    lantern.visible = photo.visible = A.lantern > .01;
    if (lantern.visible) {
      lf.forEach((f, i) => {
        if (!reduced) f.x += f.dir * f.v * .0007 * dt; f.y += dy * .5 / halfH;
        if (f.x < -1.2) f.x = 1.2; if (f.x > 1.2) f.x = -1.2; if (f.y < -1.2) f.y = 1.2; if (f.y > 1.2) f.y = -1.2;
        tmp.set(f.x * halfW, f.y * halfH + Math.sin(t * 1.2 + f.ph) * .2, f.z);
        orient(tmp, tmp2.set(f.dir, Math.sin(t + f.ph) * .05, 0), f.s); lantern.setMatrixAt(i, m4);
        const blink = .5 + .5 * Math.sin(t * 3 + f.ph * 3);
        phLocal.forEach((pl, k) => { const mm = new THREE.Matrix4().makeTranslation(pl.x, pl.y, pl.z).premultiply(m4); mm.scale(sc.setScalar(.5 + blink * .7)); photo.setMatrixAt(i * NP + k, mm); });
        if (i % 2 === 0) hit('lantern', tmp, 1);
      });
      lantern.instanceMatrix.needsUpdate = photo.instanceMatrix.needsUpdate = true;
      lanternMat.opacity = A.lantern; photoMat.opacity = A.lantern;
    }

    // siphonophore
    beads.visible = siphLines.visible = A.siph > .01;
    if (beads.visible) {
      if (!reduced) { SI.y += .0035 * dt; SI.x += Math.sin(t * .2) * .0006 * dt; }
      SI.y += dy * .4 / halfH; if (SI.y > 1.7) { SI.y = -1.5; SI.x = rnd(-.7, .7); }
      const lp = siphLines.geometry.attributes.position.array;
      for (let i = 0; i < NB; i++) {
        tmp.set(SI.x * halfW + Math.sin(t * 1.2 - i * .3) * (.3 + i * .05), SI.y * halfH - i * .55, SI.z + Math.cos(t * .8 - i * .25) * .6);
        m4.makeScale(1 - i / NB * .5, 1 - i / NB * .5, 1 - i / NB * .5).setPosition(tmp); beads.setMatrixAt(i, m4);
        lp.set([tmp.x, tmp.y, tmp.z, tmp.x + Math.sin(t * 2 + i) * .4, tmp.y - .9, tmp.z], i * 6);
        if (i % 7 === 0) hit('siph', tmp, 1);
      }
      beads.instanceMatrix.needsUpdate = true; siphLines.geometry.attributes.position.needsUpdate = true;
      beadMat.opacity = .85 * A.siph; siphLines.material.opacity = .5 * A.siph;
    }

    // anglerfish
    anglers.forEach((g, i) => {
      const a = AN[i]; g.visible = A.angler > .01; if (!g.visible) return;
      if (!reduced) a.x += a.dir * .00012 * dt; a.y += dy * .3 / halfH;
      if (a.x < -1.3) a.x = 1.3; if (a.x > 1.3) a.x = -1.3; if (a.y < -1.3) a.y = 1.3; if (a.y > 1.3) a.y = -1.3;
      g.position.set(a.x * halfW, a.y * halfH + Math.sin(t * .7 + a.ph) * .3, a.z);
      g.rotation.set(0, a.dir > 0 ? 0 : Math.PI, Math.sin(t * .5 + a.ph) * .06);
      g.scale.setScalar(a.s * (small() ? 1.1 : 1.5));
      const u = g.userData, pulse = .65 + .35 * Math.sin(t * 2.6 + a.ph);
      u.jaw.rotation.z = -Math.max(0, Math.sin(t * .9 + a.ph)) * .35;
      u.lure.position.y = 1.48 + Math.sin(t * 2 + a.ph) * .06;
      u.light.intensity = 6 * pulse * A.angler; u.halo.material.opacity = .55 * pulse * A.angler;
      setAlpha(g, A.angler);
      hit('angler', g.position, 2.2 * a.s);
    });

    // jellyfish
    jellies.forEach(j => {
      j.g.visible = A.jelly > .01; if (!j.g.visible) return;
      const p = Math.sin(t * 2.4 + j.ph);
      if (!reduced) j.y += (.0012 + Math.max(0, p) * .0045) * dt; j.y += dy * .35 / halfH; j.x += Math.sin(t * .3 + j.ph) * .0003 * dt;
      if (j.y > 1.3) { j.y = -1.3; j.x = rnd(-1, 1); } if (j.y < -1.35) { j.y = 1.25; j.x = rnd(-1, 1); }
      j.g.position.set(j.x * halfW, j.y * halfH, j.z); j.g.scale.setScalar(j.s * (small() ? 1 : 1.3));
      j.g.rotation.set(Math.sin(t * .4 + j.ph) * .15, t * .2 + j.ph, Math.cos(t * .35 + j.ph) * .12);
      j.bell.scale.set(1 + .13 * p, 1 - .12 * p, 1 + .13 * p);
      const tp = j.tpos; let o = 0;
      for (let k = 0; k < NT; k++) {
        const ang = k / NT * Math.PI * 2, r = .42 * (1 + .13 * p);
        let px = Math.cos(ang) * r, py = 0, pz = Math.sin(ang) * r;
        for (let s = 0; s < TS; s++) {
          const nx = px + Math.sin(t * 1.6 + j.ph + s * .5 + k) * .03 * s * .3, ny = py - .14 - (k % 3 === 0 ? .06 : 0), nz = pz + Math.cos(t * 1.4 + j.ph + s * .45 + k) * .03 * s * .3;
          tp[o++] = px; tp[o++] = py; tp[o++] = pz; tp[o++] = nx; tp[o++] = ny; tp[o++] = nz; px = nx; py = ny; pz = nz;
        }
      }
      j.tent.geometry.attributes.position.needsUpdate = true;
      setAlpha(j.g, A.jelly);
      hit('jelly', j.g.position, 1.4 * j.s);
    });

    // comb jellies
    cil.visible = A.comb > .01;
    combs.forEach((c, ci) => {
      c.m.visible = cil.visible; if (!c.m.visible) return;
      if (!reduced) c.y += .0018 * dt; c.y += dy * .35 / halfH; if (c.y > 1.3) { c.y = -1.3; c.x = rnd(-1, 1); } if (c.y < -1.35) c.y = 1.25;
      c.m.position.set(c.x * halfW, c.y * halfH, c.z); c.m.scale.setScalar(c.s); c.m.rotation.y = t * .3 + c.ph;
      combBodyMat.opacity = .16 * A.comb;
      for (let r = 0; r < ROWS; r++) {
        const ang = r / ROWS * Math.PI * 2 + c.m.rotation.y;
        for (let k = 0; k < PER; k++) {
          const v = -.42 + k * .084, rad = .31 * Math.sqrt(Math.max(0, 1 - (v / .5) ** 2)) + .01;
          tmp.set(Math.cos(ang) * rad, v, Math.sin(ang) * rad).multiplyScalar(c.s).add(c.m.position);
          m4.makeRotationY(-ang).scale(sc.setScalar(c.s)).setPosition(tmp);
          const idx = (ci * ROWS + r) * PER + k; cil.setMatrixAt(idx, m4);
          const wave = Math.max(0, Math.sin(t * 6 - k * .8 + r));
          col.setHSL(((t * .25 + k * .07 + r * .12 + c.ph) % 1 + 1) % 1, .95, .45 + wave * .25).multiplyScalar(A.comb * (.35 + .65 * wave));
          cil.setColorAt(idx, col);
        }
      }
      hit('comb', c.m.position, .9 * c.s);
    });
    if (cil.visible) { cil.instanceMatrix.needsUpdate = true; cil.instanceColor.needsUpdate = true; }

    // snailfish
    snails.forEach(f => {
      f.g.visible = A.snail > .01; if (!f.g.visible) return;
      if (!reduced) f.x += f.dir * .00022 * dt; f.y += dy * .2 / halfH;
      if (f.x < -1.2) f.x = 1.2; if (f.x > 1.2) f.x = -1.2; if (f.y < -.9) f.y = .9; if (f.y > .9) f.y = -.9;
      f.g.position.set(f.x * halfW, f.y * halfH + Math.sin(t * .9 + f.ph) * .25, f.z);
      f.g.rotation.set(0, f.dir > 0 ? 0 : Math.PI, Math.sin(t * .6 + f.ph) * .08); f.g.scale.setScalar(f.s * (small() ? .9 : 1.3));
      setAlpha(f.g, A.snail);
      hit('snail', f.g.position, .9 * f.s);
    });

    renderer.render(scene, camera);
    if (!window.SEA3D.ok) window.SEA3D.ok = true;
  }
  requestAnimationFrame(frame);
}
