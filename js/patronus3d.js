/* Expecto Patronum: a silver stag (Quaternius "Stag", CC0, rigged and animated) rendered
   with a ghostly fresnel glow. It gallops in to the centre of the screen, pauses to look at
   you, walks off into the scene and wanders: walking, galloping, grazing, until it fades
   into mist. Exposes window.Patronus3D = { cast(), stop() }. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const canvas = document.getElementById('patronus');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }); } catch { renderer = null; }

if (renderer) {
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 200);
  camera.position.set(0, 3.2, 15); camera.lookAt(0, -.6, -3);
  const FLOOR = -2.6;

  /* ghost material: silver-blue, brighter at the silhouette (fresnel), skinning-aware */
  const uFade = { value: 0 }, uTime = { value: 0 };
  const ghost = new THREE.MeshStandardMaterial({ color: 0x9cc4ff, transparent: true, depthWrite: false });
  ghost.onBeforeCompile = sh => {
    sh.uniforms.uFade = uFade; sh.uniforms.uTime = uTime;
    sh.fragmentShader = 'uniform float uFade;\nuniform float uTime;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
      float fr = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition))), 1.8);
      float shimmer = 0.88 + 0.12 * sin(vViewPosition.y * 3.0 - uTime * 3.0);
      gl_FragColor.rgb = mix(vec3(0.45, 0.66, 1.0), vec3(0.97, 0.99, 1.0), fr) * shimmer * 1.08;
      gl_FragColor.a = (0.32 + 0.68 * fr) * uFade;`);
  };
  ghost.depthFunc = THREE.LessEqualDepth;
  const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false });

  /* silver mist */
  const N = 900;
  const pos = new Float32Array(N * 3), life = new Float32Array(N), vel = new Float32Array(N * 3);
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('life', new THREE.BufferAttribute(life, 1));
  const pm = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: { uFade: { value: 1 } },
    vertexShader: `attribute float life; varying float vL; void main() { vL = life; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = 150.0 * life / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vL; uniform float uFade; void main() { float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(0.84, 0.92, 1.0, smoothstep(0.5, 0.0, d) * vL * 0.5 * uFade); }`
  });
  const mist = new THREE.Points(pg, pm); mist.frustumCulled = false; scene.add(mist);
  let pi = 0;
  const emit = (p, n, spread = .8) => { for (let k = 0; k < n; k++) { const i = pi++ % N; pos[i * 3] = p.x + (Math.random() - .5) * spread; pos[i * 3 + 1] = p.y + Math.random() * spread; pos[i * 3 + 2] = p.z + (Math.random() - .5) * spread; vel[i * 3] = (Math.random() - .5) * .012; vel[i * 3 + 1] = .006 + Math.random() * .014; vel[i * 3 + 2] = (Math.random() - .5) * .012; life[i] = 1; } };

  /* the stag */
  const stag = new THREE.Group(); scene.add(stag);       // stag.rotation.y = heading; the model faces +z
  let mixer = null, current = null, ready = false, failed = false, loading = null;
  const clips = {};
  function load() {
    if (loading) return loading;
    loading = new Promise(res => {
      new GLTFLoader().load('assets/models/stag.glb', gltf => {
        const model = gltf.scene;
        // measure through the skeleton (precise), since this rig scales its geometry with bones
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model, true), size = box.getSize(new THREE.Vector3());
        model.scale.multiplyScalar(3.4 / Math.max(size.x, size.y, size.z));
        model.updateMatrixWorld(true); box.setFromObject(model, true); model.position.y -= box.min.y; model.position.x -= (box.min.x + box.max.x) / 2; model.position.z -= (box.min.z + box.max.z) / 2;
        const meshes = [];
        model.traverse(o => { if (o.isMesh) { o.material = ghost; o.renderOrder = 2; o.frustumCulled = false; meshes.push(o); } });
        // depth pre-pass twins so only the outer surface glows
        meshes.forEach(o => { const d = o.clone(); d.material = depthOnly; d.renderOrder = 1; if (o.isSkinnedMesh) d.bind(o.skeleton, o.bindMatrix); o.parent.add(d); });
        stag.add(model);
        mixer = new THREE.AnimationMixer(model);
        gltf.animations.forEach(c => { if (!c.name.includes('|')) clips[c.name] = mixer.clipAction(c); });
        ready = true; res(true);
      }, undefined, () => { failed = true; res(false); });
    });
    return loading;
  }
  function play(name, fade = .35, speed = 1) {
    const a = clips[name]; if (!a) return;
    a.timeScale = speed; if (a === current) return;
    a.reset(); a.setEffectiveWeight(1); a.fadeIn(fade).play();
    if (current) current.fadeOut(fade);
    current = a;
  }

  /* layout: how wide the floor is at a given depth */
  let W = 1, H = 1;
  const fit = () => { W = innerWidth; H = innerHeight; renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); };
  addEventListener('resize', fit); fit();
  const v = new THREE.Vector3();
  const floorHalfWidth = z => { let lo = 0, hi = 60; for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; v.set(m, FLOOR, z).project(camera); if (v.x < .8) lo = m; else hi = m; } return lo; };

  /* behaviour: gallop in → centre → look at you → walk into the scene → wander → fade */
  const S = { active: false, phase: 'enter', t: 0, heading: 0, target: new THREE.Vector3(), wait: 0, speed: 0, life: 0, fade: 0 };
  const LIFE = 22;
  const go = () => { const z = -12 + Math.random() * 13, hw = floorHalfWidth(z); S.target.set((Math.random() * 2 - 1) * hw * .85, FLOOR, z); const far = S.target.distanceTo(stag.position) > 7; S.phase = far ? 'run' : 'walk'; S.t = 0; play(far ? 'Gallop' : 'Walk', .45, 1.1); };
  function start() {
    const side = Math.random() < .5 ? -1 : 1, z = 1.5;
    stag.position.set(side * (floorHalfWidth(z) + 4), FLOOR, z);
    S.heading = side < 0 ? Math.PI / 2 : -Math.PI / 2; stag.rotation.y = S.heading;
    S.target.set(0, FLOOR, 2.2); S.phase = 'enter'; S.t = 0; S.life = 0; S.wait = 0; S.fade = 0; S.speed = 7;
    play('Gallop', .01, 1.15);
    life.fill(0);
  }
  let last = 0;
  function frame(now) {
    if (!S.active) return;
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    S.life += dt; S.t += dt; uTime.value = S.life;
    const ending = S.life > LIFE;
    S.fade += ((ending ? 0 : 1) - S.fade) * Math.min(1, dt * (ending ? 1.2 : 2.5));
    uFade.value = S.fade; pm.uniforms.uFade.value = Math.min(1, S.fade * 1.4 + .15);

    const to = v.copy(S.target).sub(stag.position); to.y = 0;
    const dist = to.length();
    let speed = 0;
    if (S.phase === 'enter') { speed = 7; if (dist < .7) { S.phase = 'look'; S.t = 0; play('Idle_Headlow', .4); } }
    else if (S.phase === 'look') {
      let d = 0 - S.heading; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; S.heading += d * Math.min(1, dt * 3);   // turn to face you
      if (S.t > 1.0) play('Idle', .4);
      if (S.t > 2.4) { S.phase = 'walk'; S.t = 0; S.target.set((Math.random() - .5) * 3, FLOOR, -9); play('Walk', .4, 1.1); }
    } else if (S.phase === 'walk' || S.phase === 'run') {
      speed = S.phase === 'run' ? 6.2 : 2.1;
      if (dist < 1.1) { if (Math.random() < .45) { S.phase = 'pause'; S.t = 0; S.wait = 1.6 + Math.random() * 1.8; play(Math.random() < .55 ? 'Eating' : 'Idle_2', .45); } else go(); }
    } else if (S.phase === 'pause' && S.t > S.wait) go();
    if (speed > 0 && dist > .01) {
      let d = Math.atan2(to.x, to.z) - S.heading; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283;
      S.heading += d * Math.min(1, dt * (S.phase === 'walk' ? 1.8 : 2.4));
      S.speed += (speed - S.speed) * Math.min(1, dt * 3);
      const slow = 1 - Math.min(.6, Math.abs(d) / Math.PI);           // ease off in tight turns
      stag.position.x += Math.sin(S.heading) * S.speed * slow * dt;
      stag.position.z += Math.cos(S.heading) * S.speed * slow * dt;
    } else S.speed *= .9;
    stag.rotation.y = S.heading;
    if (S.phase !== 'enter') { const hw = floorHalfWidth(stag.position.z); stag.position.x = Math.max(-hw, Math.min(hw, stag.position.x)); }
    stag.position.z = Math.max(-13, Math.min(3, stag.position.z));
    if (mixer) mixer.update(reduced ? 0 : dt);

    emit(v.set(stag.position.x, FLOOR + 1.3, stag.position.z), ending ? 14 : (S.speed > 3 ? 5 : 2), ending ? 2.4 : 1.4);
    if (S.speed > 3) emit(v.set(stag.position.x, FLOOR + .1, stag.position.z), 2, 1);
    for (let i = 0; i < N; i++) if (life[i] > 0) { pos[i * 3] += vel[i * 3]; pos[i * 3 + 1] += vel[i * 3 + 1]; pos[i * 3 + 2] += vel[i * 3 + 2]; life[i] = Math.max(0, life[i] - dt * .55); }
    pg.attributes.position.needsUpdate = true; pg.attributes.life.needsUpdate = true;
    stag.visible = S.fade > .02;
    renderer.render(scene, camera);
    if (ending && S.fade < .01 && life.every(l => l < .02)) stop();
  }
  function begin() { S.active = true; start(); canvas.classList.add('on'); last = performance.now(); requestAnimationFrame(frame); }
  function cast() {
    if (failed) return false;
    if (S.active) { S.life = Math.min(S.life, 4); return true; }    // casting again keeps it around longer
    if (ready) begin(); else load().then(ok => { if (ok) begin(); else dispatchEvent(new Event('patronus-fallback')); });
    return true;
  }
  function stop() { if (!S.active) return; S.active = false; canvas.classList.remove('on'); setTimeout(() => { if (!S.active) renderer.clear(); }, 650); }
  window.Patronus3D = { cast, stop, debug() { const b = new THREE.Box3().setFromObject(stag, true); const sz = b.getSize(new THREE.Vector3()); const c = b.getCenter(new THREE.Vector3()); return { size: sz.toArray().map(n => +n.toFixed(2)), center: c.toArray().map(n => +n.toFixed(2)), children: stag.children.length, rendered: renderer.info.render.triangles }; }, get state() { return { phase: S.phase, x: stag.position.x, z: stag.position.z, ready, failed, clip: current && current.getClip().name }; } };
  // warm the model up in the background once the Gryffindor theme is on
  const warm = () => { if (document.documentElement.dataset.theme === 'hogwarts') setTimeout(load, 2500); };
  warm(); new MutationObserver(warm).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}
