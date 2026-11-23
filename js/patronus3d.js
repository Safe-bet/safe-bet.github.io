/* Expecto Patronum: a silver stag built in 3-D (three.js), galloping around a looping
   path that stays inside the screen, trailing mist, then dissolving. Original geometry,
   no downloaded model. Exposes window.Patronus3D = { cast(), stop() }. */
import * as THREE from 'three';

const canvas = document.getElementById('patronus');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true }); }
catch { renderer = null; }

if (renderer) {
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 100);
  camera.position.set(0, 0, 14);

  /* ghost material: brighter at the rim (fresnel), see-through in the middle */
  const ghost = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.FrontSide,
    uniforms: { uFade: { value: 1 }, uTime: { value: 0 } },
    vertexShader: `
      varying vec3 vN; varying vec3 vV; varying float vY;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - wp.xyz);
        vY = wp.y;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      uniform float uFade; uniform float uTime;
      varying vec3 vN; varying vec3 vV; varying float vY;
      void main() {
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
        float shimmer = 0.85 + 0.15 * sin(vY * 6.0 - uTime * 4.0);
        vec3 core = vec3(0.55, 0.72, 1.0);
        vec3 rim = vec3(0.92, 0.97, 1.0);
        vec3 col = mix(core, rim, f);
        float a = (0.22 + 0.78 * f) * shimmer * uFade;
        gl_FragColor = vec4(col, a);
      }`
  });

  const stag = new THREE.Group();
  // depth pre-pass: every part first writes depth only, then the glow draws just the outermost surface,
  // so overlapping parts read as one silhouette instead of stacked bubbles
  const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false });
  ghost.depthTest = true; ghost.depthFunc = THREE.LessEqualDepth;
  const add = (geo, pos, rot, parent = stag) => {
    const holder = new THREE.Group(); if (pos) holder.position.set(...pos); if (rot) holder.rotation.set(...rot); parent.add(holder);
    const d = new THREE.Mesh(geo, depthOnly); d.renderOrder = 1; holder.add(d);
    const m = new THREE.Mesh(geo, ghost); m.renderOrder = 2; holder.add(m);
    return holder;
  };
  const capsule = (r, l) => new THREE.CapsuleGeometry(r, l, 6, 14);

  // body: chest, barrel, rump
  add(new THREE.SphereGeometry(1, 24, 18).scale(1.55, .78, .72), [0, 0, 0]);
  add(new THREE.SphereGeometry(.72, 20, 16).scale(1, 1.05, .95), [1.05, .12, 0]);
  add(new THREE.SphereGeometry(.7, 20, 16).scale(1, 1, .95), [-1.15, .1, 0]);
  // neck + head
  const neck = new THREE.Group(); neck.position.set(1.35, .45, 0); stag.add(neck);
  add(capsule(.34, 1.2), [.28, .62, 0], [0, 0, -.55], neck);
  const head = new THREE.Group(); head.position.set(.72, 1.35, 0); neck.add(head);
  add(new THREE.SphereGeometry(.42, 20, 16).scale(1.25, .85, .8), [0, 0, 0], null, head);
  add(new THREE.ConeGeometry(.26, .75, 16).rotateZ(-Math.PI / 2), [.62, -.12, 0], null, head);
  [-1, 1].forEach(sd => add(new THREE.ConeGeometry(.1, .42, 10), [-.12, .38, sd * .26], [sd * .5, 0, .35], head));
  // antlers: branching tubes
  const antler = sd => {
    const tube = pts => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2] * sd))), 16, .045, 6, false);
    const g = new THREE.Group(); g.position.set(-.05, .35, sd * .16); head.add(g);
    add(tube([[0, 0, 0], [-.15, .55, .25], [-.45, 1.05, .45], [-.8, 1.55, .5]]), null, null, g);
    add(tube([[-.1, .4, .18], [.2, .75, .3]]), null, null, g);
    add(tube([[-.35, .9, .4], [-.15, 1.3, .55]]), null, null, g);
    add(tube([[-.6, 1.3, .48], [-.55, 1.75, .7]]), null, null, g);
    add(tube([[-.7, 1.45, .5], [-1.1, 1.75, .45]]), null, null, g);
  };
  antler(1); antler(-1);
  // tail
  add(new THREE.ConeGeometry(.14, .45, 10), [-1.85, .45, 0], [0, 0, 1.1]);
  // legs: upper + lower segments with knees, for a gallop
  const legs = [];
  const leg = (x, z, front) => {
    const hip = new THREE.Group(); hip.position.set(x, -.35, z); stag.add(hip);
    add(capsule(.17, .8), [0, -.5, 0], null, hip);
    const knee = new THREE.Group(); knee.position.set(0, -1.0, 0); hip.add(knee);
    add(capsule(.1, .85), [0, -.48, 0], null, knee);
    add(new THREE.SphereGeometry(.12, 10, 8).scale(1.2, .7, 1), [front ? .04 : -.04, -.98, 0], null, knee);
    legs.push({ hip, knee, front });
  };
  leg(1.05, .32, true); leg(1.05, -.32, true); leg(-1.1, .32, false); leg(-1.1, -.32, false);
  const phase = [0, .12, .52, .64];               // rotary gallop
  stag.scale.setScalar(.62);
  scene.add(stag);

  /* silver mist trail */
  const N = 700;
  const pos = new Float32Array(N * 3), life = new Float32Array(N), vel = new Float32Array(N * 3);
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pg.setAttribute('life', new THREE.BufferAttribute(life, 1));
  const pm = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uSize: { value: 26 }, uFade: { value: 1 } },
    vertexShader: `attribute float life; varying float vL; uniform float uSize;
      void main() { vL = life; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = uSize * life / -mv.z * 6.0; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vL; uniform float uFade;
      void main() { float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; float a = smoothstep(0.5, 0.0, d) * vL * 0.55 * uFade; gl_FragColor = vec4(0.82, 0.9, 1.0, a); }`
  });
  const points = new THREE.Points(pg, pm); scene.add(points);
  let pi = 0;
  const emit = (p, n) => { for (let k = 0; k < n; k++) { const i = pi++ % N; pos[i * 3] = p.x + (Math.random() - .5) * .9; pos[i * 3 + 1] = p.y + (Math.random() - .4) * .9; pos[i * 3 + 2] = p.z + (Math.random() - .5) * .6; vel[i * 3] = (Math.random() - .5) * .01; vel[i * 3 + 1] = .004 + Math.random() * .012; vel[i * 3 + 2] = (Math.random() - .5) * .01; life[i] = 1; } };

  /* a looping path kept inside the visible area, weaving in depth */
  let path = null, halfW = 6, halfH = 4;
  function fit() {
    const w = innerWidth, h = innerHeight, d = Math.min(devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(d); renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z; halfW = halfH * camera.aspect;
    stag.scale.setScalar(Math.max(.38, Math.min(.68, halfW / 11)));
    const X = halfW * .62, Y = halfH * .55;
    path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-X, -Y * .5, 0), new THREE.Vector3(-X * .2, -Y * .85, 2.2), new THREE.Vector3(X * .6, -Y * .55, 1),
      new THREE.Vector3(X, Y * .05, -1.5), new THREE.Vector3(X * .35, Y * .7, -3), new THREE.Vector3(-X * .45, Y * .55, -2),
      new THREE.Vector3(-X * .95, Y * .1, -.5)
    ], true, 'catmullrom', .5);
  }
  addEventListener('resize', fit); fit();

  let active = false, u = 0, t0 = 0, last = 0, fade = 0, ending = false;
  const tmp = new THREE.Vector3(), ahead = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const DURATION = 11;                              // seconds on screen
  function frame(now) {
    if (!active) return;
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const el = (now - t0) / 1000;
    if (el > DURATION && !ending) ending = true;
    fade += ((ending ? 0 : 1) - fade) * Math.min(1, dt * (ending ? 1.6 : 3));
    ghost.uniforms.uFade.value = fade; ghost.uniforms.uTime.value = el; pm.uniforms.uFade.value = Math.min(1, fade * 1.5 + .2);
    u = (u + dt * (reduced ? .02 : .085)) % 1;
    path.getPointAt(u, tmp); path.getPointAt((u + .01) % 1, ahead);
    const gallop = el * (reduced ? 1 : 9.5);
    stag.position.copy(tmp); stag.position.y += Math.abs(Math.sin(gallop)) * .22 - .1;
    // face along the path; bank slightly into turns
    const dir = ahead.clone().sub(tmp).normalize();
    stag.rotation.set(0, Math.atan2(-dir.z, dir.x), 0);
    stag.rotateZ(dir.y * .5);
    const turn = dir.x * (path.getTangentAt((u + .03) % 1).z) - dir.z * (path.getTangentAt((u + .03) % 1).x);
    stag.rotateX(turn * .6);
    neck.rotation.z = Math.sin(gallop) * .08;
    legs.forEach((L, i) => {
      const p = gallop + phase[i] * Math.PI * 2;
      L.hip.rotation.z = Math.sin(p) * (L.front ? .65 : .55) + (L.front ? 0 : .1);
      L.knee.rotation.z = (L.front ? -1 : 1) * Math.max(0, Math.sin(p + (L.front ? -.9 : .9))) * .9;
    });
    // mist: from the body and hooves, more as it fades so it dissolves
    stag.updateMatrixWorld();
    emit(stag.position, ending ? 10 : 4);
    legs.forEach(L => { L.knee.getWorldPosition(tmp); emit(tmp, 1); });
    for (let i = 0; i < N; i++) if (life[i] > 0) { pos[i * 3] += vel[i * 3]; pos[i * 3 + 1] += vel[i * 3 + 1]; pos[i * 3 + 2] += vel[i * 3 + 2]; life[i] = Math.max(0, life[i] - dt * .7); }
    pg.attributes.position.needsUpdate = true; pg.attributes.life.needsUpdate = true;
    stag.visible = fade > .02;
    renderer.render(scene, camera);
    if (ending && fade < .01 && life.every(l => l < .02)) stop();
  }
  function cast() {
    if (active) { t0 = performance.now(); ending = false; return true; }
    active = true; ending = false; fade = 0; u = 0; t0 = last = performance.now(); life.fill(0);
    canvas.classList.add('on'); requestAnimationFrame(frame); return true;
  }
  function stop() { if (!active) return; active = false; canvas.classList.remove('on'); setTimeout(() => { if (!active) renderer.clear(); }, 650); }
  window.Patronus3D = { cast, stop };
}
