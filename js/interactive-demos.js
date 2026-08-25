/**
 * SUYASH KUMAR — ADVANCED INTERACTIVE WORKBENCHES & SIMULATORS
 * Features:
 * 1. Honeywell Agentic Ingestion Pipeline (Baseline -> Metadata -> Self-Healing)
 * 2. Honeywell 3x Thor Distributed Ray Cluster & Dynamic Router (Kill/Restore Failover)
 * 3. LENEK Technologies Multi-Modal X-Ray Vision Diagnostic Heatmap
 * 4. ATAL AUV 8-Thruster Hydrodynamic Physics & Waypoint Engine
 * 5. SURGE '25 Granular Chute Flow Profiler (YOLOv11 + SAM2)
 * 6. ISRO Chandrayaan-II Lunar XRF Spectral Filter
 * 7. Forensic Face Reconstruction Full-Portrait GAN Slider
 */

const InteractiveDemos = {
  init() {
    this.initHoneywellPipelineSim();
    this.initHoneywellThorRouter();
    this.initLenekXRaySim();
    this.initAUVPhysicsSim();
    this.initSurgeChuteSim();
    this.initISROSim();
    this.initFaceSlider();
  },

  /* --------------------------------------------------------------------------
     1. Honeywell Forge: Agentic Ingestion Pipeline Simulator
     -------------------------------------------------------------------------- */
  initHoneywellPipelineSim() {
    const logsContainer = document.getElementById('pipeLogs');
    const triggerBtn = document.getElementById('triggerDriftBtn');
    const stepBtns = document.querySelectorAll('.pipe-step-btn');
    const stepViews = document.querySelectorAll('.pipe-step-view');

    // Step View Switcher
    stepBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const step = btn.dataset.step;
        stepBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        stepViews.forEach(v => {
          v.classList.toggle('active', v.id === `pipeViewStep${step}`);
        });
      });
    });

    const logMessages = [
      { text: "[SOURCE CONNECT] Bound Kafka/PostgreSQL/ES connectors -> Target: Delta Lake (.whl CI/CD)", type: "log-info" },
      { text: "[RAW LANDING] Ingested raw batch; resolved Spark lowercase casing conflict (Col A vs col a -> a2)", type: "log-info" },
      { text: "[PHI-4 CANONICAL] Profiled cardinality & null rates; generated semantic embeddings", type: "log-success" },
      { text: "[SAFE UNION] Executed Struct-Enlarge & Cast Unions; mutual exclusivity confirmed (0 collisions)", type: "log-info" },
      { text: "[OPUS REVIEW] Claude Opus validated baseline schema with 0 critical warnings", type: "log-success" }
    ];

    const appendLog = (msg, type = "log-info") => {
      if (!logsContainer) return;
      const p = document.createElement('div');
      p.className = `pipe-log-line ${type}`;
      const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
      p.textContent = `[${time}] ${msg}`;
      logsContainer.appendChild(p);
      if (logsContainer.children.length > 8) {
        logsContainer.removeChild(logsContainer.firstChild);
      }
      logsContainer.scrollTop = logsContainer.scrollHeight;
    };

    logMessages.forEach((m, idx) => setTimeout(() => appendLog(m.text, m.type), idx * 250));

    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => {
        // Switch to Step 4 (Self-Healing / Audit)
        const step4Btn = document.querySelector('.pipe-step-btn[data-step="4"]');
        if (step4Btn) step4Btn.click();

        appendLog("⚠️ [SCHEMA DRIFT] Incoming stream payload altered: struct `device_metrics` schema enlarged", "log-alert");
        
        setTimeout(() => {
          appendLog("🔍 [AUDIT LOGGED] Table `schema_change_audit`: renamed conflict column to `device_metrics_v2` (Reason: Struct Mutation)", "log-info");
        }, 500);

        setTimeout(() => {
          appendLog("🤖 [PHI-4 AGENT] Evaluating safe union: Selected `struct-enlarge union` (mutual exclusivity 100%)", "log-info");
        }, 1000);

        setTimeout(() => {
          appendLog("🧠 [CLAUDE OPUS] Root-cause diagnosed: Upstream sensor firmware update. Auto-tuned retry parameters & updated Delta table", "log-info");
        }, 1500);

        setTimeout(() => {
          appendLog("✅ [JOB COMPLETE] Databricks run succeeded (214ms). Dispatched email alert & Jira ticket #ENG-5104", "log-success");
        }, 2100);
      });
    }
  },

  /* --------------------------------------------------------------------------
     2. Honeywell Forge: 3x Thor Distributed Ray Cluster & Dynamic Router
     -------------------------------------------------------------------------- */
  initHoneywellThorRouter() {
    const canvas = document.getElementById('routerCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = canvas.parentElement.clientWidth;
    let height = canvas.height = canvas.parentElement.clientHeight;

    window.addEventListener('resize', () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    });

    let totalReqPerSec = 2400;
    const gpus = [
      { id: 1, name: "THOR #1", status: "online", load: 33, vram: 78, temp: 61 },
      { id: 2, name: "THOR #2", status: "online", load: 33, vram: 82, temp: 63 },
      { id: 3, name: "THOR #3", status: "online", load: 34, vram: 75, temp: 59 }
    ];

    let packets = [];
    const slider = document.getElementById('reqSlider');
    const reqDisplay = document.getElementById('reqDisplayVal');

    if (slider) {
      slider.addEventListener('input', (e) => {
        totalReqPerSec = parseInt(e.target.value);
        if (reqDisplay) reqDisplay.textContent = `${totalReqPerSec} req/s`;
      });
    }

    // Toggle GPU Kill / Restore Buttons
    const setupGpuBtn = (btnId, gpuIdx) => {
      const btn = document.getElementById(btnId);
      if (!btn) return;
      btn.addEventListener('click', () => {
        if (gpus[gpuIdx].status === 'online') {
          gpus[gpuIdx].status = 'killed';
          btn.textContent = `RESTORE THOR #${gpuIdx + 1}`;
          btn.className = 'gpu-kill-btn killed';
        } else {
          gpus[gpuIdx].status = 'online';
          btn.textContent = `KILL THOR #${gpuIdx + 1}`;
          btn.className = 'gpu-kill-btn online';
        }
      });
    };

    setupGpuBtn('killGpu1Btn', 0);
    setupGpuBtn('killGpu2Btn', 1);
    setupGpuBtn('killGpu3Btn', 2);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const routerX = width * 0.2;
      const routerY = height * 0.5;

      const healthyGpus = gpus.filter(g => g.status === 'online');
      const loadPerHealthy = healthyGpus.length > 0 ? Math.round(100 / healthyGpus.length) : 0;

      gpus.forEach(g => {
        g.load = g.status === 'online' ? loadPerHealthy : 0;
      });

      // Spawn Request Packets towards healthy GPUs
      if (healthyGpus.length > 0 && Math.random() < (totalReqPerSec / 3500)) {
        const targetGpu = healthyGpus[Math.floor(Math.random() * healthyGpus.length)];
        const gpuIndex = gpus.indexOf(targetGpu);
        const gpuY = height * (0.22 + gpuIndex * 0.28);
        packets.push({
          x: routerX,
          y: routerY,
          tx: width * 0.78,
          ty: gpuY,
          progress: 0,
          speed: 0.035 + (totalReqPerSec / 50000),
          color: '#E07A5F'
        });
      }

      // Draw Connection Lines
      gpus.forEach((gpu, idx) => {
        const gpuY = height * (0.22 + idx * 0.28);
        ctx.strokeStyle = gpu.status === 'online' ? 'rgba(107, 144, 128, 0.25)' : 'rgba(224, 122, 95, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(routerX, routerY);
        ctx.lineTo(width * 0.78, gpuY);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw In-Flight Packets
      packets.forEach((p, idx) => {
        p.progress += p.speed;
        const curX = routerX + (p.tx - routerX) * p.progress;
        const curY = routerY + (p.ty - routerY) * p.progress;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(curX, curY, 3, 0, Math.PI * 2);
        ctx.fill();

        if (p.progress >= 1) packets.splice(idx, 1);
      });

      // Draw Center Ray Router Node
      ctx.fillStyle = '#1C1917';
      ctx.strokeStyle = '#E07A5F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(routerX - 45, routerY - 30, 90, 60, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#EDE8E1';
      ctx.font = 'bold 9px Geist Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText("RAY ROUTER", routerX, routerY - 8);
      ctx.fillStyle = '#6B9080';
      ctx.font = '8px Geist Mono, monospace';
      ctx.fillText(`${totalReqPerSec} req/s`, routerX, routerY + 10);
      ctx.fillText("LOAD BALANCED", routerX, routerY + 22);

      // Draw 3 Thor GPU Nodes
      gpus.forEach((gpu, idx) => {
        const gpuX = width * 0.78;
        const gpuY = height * (0.22 + idx * 0.28);
        const isOnline = gpu.status === 'online';

        ctx.fillStyle = isOnline ? '#181614' : 'rgba(224, 122, 95, 0.08)';
        ctx.strokeStyle = isOnline ? '#6B9080' : '#E07A5F';
        ctx.lineWidth = isOnline ? 1.5 : 1;
        ctx.beginPath();
        ctx.roundRect(gpuX - 55, gpuY - 22, 110, 44, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isOnline ? '#EDE8E1' : '#E07A5F';
        ctx.font = 'bold 9px Geist Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(gpu.name, gpuX - 48, gpuY - 6);

        ctx.font = '8px Geist Mono, monospace';
        ctx.fillStyle = isOnline ? '#6B9080' : '#E07A5F';
        const statusText = isOnline ? `LOAD: ${gpu.load}% (${Math.round(totalReqPerSec * (gpu.load / 100))} r/s)` : "OFFLINE (FAILED)";
        ctx.fillText(statusText, gpuX - 48, gpuY + 8);
      });

      requestAnimationFrame(render);
    };

    render();
  },

  /* --------------------------------------------------------------------------
     3. LENEK Technologies: Multi-Modal X-Ray Vision Diagnostic Heatmap
     -------------------------------------------------------------------------- */
  initLenekXRaySim() {
    const canvas = document.getElementById('xrayCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = canvas.parentElement.clientWidth;
    let height = canvas.height = canvas.parentElement.clientHeight;

    window.addEventListener('resize', () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    });

    let selectedCondition = 'cardiomegaly'; // 'cardiomegaly', 'pleural', 'pneumothorax'
    let scanLine = 0;

    const conditionBtns = document.querySelectorAll('.xray-cond-btn');
    conditionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        conditionBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedCondition = btn.dataset.condition;
      });
    });

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw Ribcage & Thoracic Silhouette Contours
      ctx.strokeStyle = 'rgba(235, 230, 220, 0.18)';
      ctx.lineWidth = 2;

      // Spine Column
      ctx.beginPath();
      ctx.moveTo(width / 2, 20);
      ctx.lineTo(width / 2, height - 20);
      ctx.stroke();

      // Left & Right Lung Field Outlines
      ctx.strokeStyle = 'rgba(235, 230, 220, 0.25)';
      ctx.beginPath();
      ctx.ellipse(width * 0.35, height * 0.48, width * 0.14, height * 0.35, -0.1, 0, Math.PI * 2);
      ctx.ellipse(width * 0.65, height * 0.48, width * 0.14, height * 0.35, 0.1, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Grad-CAM Attention Heatmap
      let hx = width * 0.48, hy = height * 0.6, hr = width * 0.12, conf = "96.4%";
      let label = "CARDIOMEGALY (HEART ENLARGEMENT)";

      if (selectedCondition === 'pleural') {
        hx = width * 0.68;
        hy = height * 0.72;
        hr = width * 0.09;
        conf = "91.8%";
        label = "RIGHT PLEURAL EFFUSION";
      } else if (selectedCondition === 'pneumothorax') {
        hx = width * 0.32;
        hy = height * 0.35;
        hr = width * 0.08;
        conf = "89.2%";
        label = "APICAL PNEUMOTHORAX";
      }

      // Radial Heatmap Gradient
      const grad = ctx.createRadialGradient(hx, hy, 2, hx, hy, hr * 1.5);
      grad.addColorStop(0, 'rgba(224, 122, 95, 0.75)');
      grad.addColorStop(0.5, 'rgba(217, 119, 6, 0.4)');
      grad.addColorStop(1, 'rgba(107, 144, 128, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(hx, hy, hr * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Bounding Box
      ctx.strokeStyle = '#E07A5F';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hx - hr, hy - hr, hr * 2, hr * 2);

      // Pathology Diagnostic Tag
      ctx.fillStyle = '#1C1917';
      ctx.fillRect(hx - hr, hy - hr - 18, 190, 16);
      ctx.fillStyle = '#EDE8E1';
      ctx.font = '8px Geist Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${label} [${conf}]`, hx - hr + 4, hy - hr - 7);

      // Scanning Laser Bar
      scanLine = (scanLine + 1.2) % height;
      ctx.strokeStyle = 'rgba(107, 144, 128, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(10, scanLine);
      ctx.lineTo(width - 10, scanLine);
      ctx.stroke();

      requestAnimationFrame(render);
    };

    render();
  },

  /* --------------------------------------------------------------------------
     4. ATAL AUV 8-Thruster Hydrodynamic Physics & Waypoint Engine
     -------------------------------------------------------------------------- */
  initAUVPhysicsSim() {
    const canvas = document.getElementById('auvCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = canvas.parentElement.clientWidth;
    let height = canvas.height = canvas.parentElement.clientHeight;

    window.addEventListener('resize', () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    });

    const sub = {
      x: width / 2,
      y: height / 2,
      vx: 0,
      vy: 0,
      heading: 0,
      angularVelocity: 0,
      thrust: 0,
      depth: 3.42
    };

    let target = { x: width * 0.75, y: height * 0.4 };
    let mode = 'autonomous';
    let bubbles = [];
    let sonarPings = [];
    
    // Dynamic randomized waypoints in pool
    let waypoints = [
      { x: width * 0.22, y: height * 0.32, label: "BUOY ALPHA" },
      { x: width * 0.78, y: height * 0.28, label: "TORPEDO GATE" },
      { x: width * 0.68, y: height * 0.75, label: "ACOUSTIC FLARE" },
      { x: width * 0.28, y: height * 0.72, label: "BINS TARGET" }
    ];
    let currentWpIdx = 0;

    canvas.parentElement.addEventListener('mousemove', (e) => {
      if (mode === 'manual') {
        const rect = canvas.getBoundingClientRect();
        target.x = e.clientX - rect.left;
        target.y = e.clientY - rect.top;
      }
    });

    canvas.parentElement.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      target.x = clickX;
      target.y = clickY;
      sonarPings.push({ x: clickX, y: clickY, r: 0, alpha: 1 });
    });

    const modeBtn = document.getElementById('auvModeToggle');
    if (modeBtn) {
      modeBtn.addEventListener('click', () => {
        mode = mode === 'autonomous' ? 'manual' : 'autonomous';
        modeBtn.textContent = mode === 'autonomous' ? 'MODE: AUTONOMOUS' : 'MODE: MANUAL (FOLLOW MOUSE)';
        modeBtn.className = mode === 'autonomous' ? 'btn btn-sm btn-outline-terracotta' : 'btn btn-sm btn-primary';
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (mode === 'autonomous') {
        const currentWp = waypoints[currentWpIdx];
        target.x = currentWp.x;
        target.y = currentWp.y;

        const distToWp = Math.hypot(target.x - sub.x, target.y - sub.y);
        if (distToWp < 35) {
          currentWpIdx = (currentWpIdx + 1) % waypoints.length;
          sonarPings.push({ x: target.x, y: target.y, r: 0, alpha: 1 });
        }
      }

      // Smooth Hydrodynamic Physics Calculation
      const dx = target.x - sub.x;
      const dy = target.y - sub.y;
      const dist = Math.hypot(dx, dy);
      const targetAngle = Math.atan2(dy, dx);

      let angleDiff = targetAngle - sub.heading;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      // Critically Damped Angular Steering
      const pGain = 0.06;
      const dGain = 0.85;
      sub.angularVelocity = sub.angularVelocity * dGain + angleDiff * pGain;
      sub.heading += sub.angularVelocity;

      // Forward Thrust Force
      const alignment = Math.max(0, Math.cos(angleDiff));
      if (dist > 15) {
        sub.thrust = Math.min(2.8, dist * 0.05) * alignment;
        sub.vx += Math.cos(sub.heading) * sub.thrust * 0.18;
        sub.vy += Math.sin(sub.heading) * sub.thrust * 0.18;
      } else {
        sub.thrust = 0;
      }

      // Drag Damping
      sub.vx *= 0.92;
      sub.vy *= 0.92;
      sub.x += sub.vx;
      sub.y += sub.vy;
      sub.depth = 3.4 + Math.sin(Date.now() * 0.002) * 0.1;

      // Thruster Cavitation Bubbles
      if (sub.thrust > 0.4 && Math.random() < 0.75) {
        const rearX = sub.x - Math.cos(sub.heading) * 42;
        const rearY = sub.y - Math.sin(sub.heading) * 42;
        bubbles.push({
          x: rearX + (Math.random() - 0.5) * 6,
          y: rearY + (Math.random() - 0.5) * 6,
          vx: -Math.cos(sub.heading) * (1.2 + Math.random() * 2),
          vy: -Math.sin(sub.heading) * (1.2 + Math.random() * 2),
          r: 2 + Math.random() * 2.5,
          alpha: 0.85
        });
      }

      // Blueprint Grid
      ctx.strokeStyle = 'rgba(240, 230, 215, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Sonar Rings
      sonarPings.forEach((p, idx) => {
        p.r += 1.8;
        p.alpha -= 0.02;
        ctx.strokeStyle = `rgba(224, 122, 95, ${Math.max(0, p.alpha)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.stroke();
        if (p.alpha <= 0) sonarPings.splice(idx, 1);
      });

      // Waypoints
      waypoints.forEach((wp, idx) => {
        const isCurrent = (mode === 'autonomous' && idx === currentWpIdx);
        ctx.strokeStyle = isCurrent ? '#E07A5F' : 'rgba(224, 122, 95, 0.3)';
        ctx.lineWidth = isCurrent ? 1.8 : 1;
        ctx.strokeRect(wp.x - 12, wp.y - 12, 24, 24);
        ctx.fillStyle = isCurrent ? '#E07A5F' : 'rgba(224, 122, 95, 0.5)';
        ctx.font = '8px Geist Mono, monospace';
        ctx.fillText(wp.label, wp.x - 22, wp.y - 16);
      });

      // Bubbles
      bubbles.forEach((b, idx) => {
        b.x += b.vx;
        b.y += b.vy;
        b.alpha -= 0.025;
        ctx.fillStyle = `rgba(224, 122, 95, ${Math.max(0, b.alpha)})`;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        if (b.alpha <= 0) bubbles.splice(idx, 1);
      });

      // Draw ATAL 8-Thruster Hydrodynamic Chassis (Top-View Model)
      ctx.save();
      ctx.translate(sub.x, sub.y);
      ctx.rotate(sub.heading);

      // Outer Aluminum Frame & Fairings
      ctx.strokeStyle = '#E07A5F';
      ctx.fillStyle = 'rgba(224, 122, 95, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-42, -18, 84, 36, 12);
      ctx.fill();
      ctx.stroke();

      // Main Pressure Vessel Cylinder
      ctx.strokeStyle = '#EDE8E1';
      ctx.fillStyle = 'rgba(28, 25, 23, 0.8)';
      ctx.beginPath();
      ctx.roundRect(-30, -12, 60, 24, 6);
      ctx.fill();
      ctx.stroke();

      // Dual IDS Imaging Front Cameras & DVL
      ctx.fillStyle = '#6B9080';
      ctx.beginPath();
      ctx.arc(38, -8, 3.5, 0, Math.PI * 2);
      ctx.arc(38, 8, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // 4 Vectored Horizontal Thrusters (45° canted pods)
      ctx.strokeStyle = sub.thrust > 0.5 ? '#E07A5F' : 'rgba(224, 122, 95, 0.7)';
      ctx.lineWidth = 2.5;
      [
        { x: -35, y: -22, angle: -0.5 },
        { x: -35, y: 22, angle: 0.5 },
        { x: 25, y: -22, angle: 0.5 },
        { x: 25, y: 22, angle: -0.5 }
      ].forEach(t => {
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(t.angle);
        ctx.strokeRect(-6, -3, 12, 6);
        ctx.restore();
      });

      ctx.restore();

      // Real-Time Telemetry HUD
      const depthEl = document.getElementById('auvDepthVal');
      const confEl = document.getElementById('auvEKFConf');
      const headingEl = document.getElementById('auvHeadingVal');
      if (depthEl) depthEl.textContent = `${sub.depth.toFixed(2)} m`;
      if (confEl) confEl.textContent = `${(99.6 + Math.sin(Date.now() * 0.001) * 0.3).toFixed(1)}%`;
      if (headingEl) headingEl.textContent = `${Math.round((sub.heading * 180 / Math.PI + 360) % 360)}°`;

      requestAnimationFrame(render);
    };

    render();
  },

  /* --------------------------------------------------------------------------
     5. SURGE '25 Granular Particle Flow Chute Profiler
     -------------------------------------------------------------------------- */
  initSurgeChuteSim() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = canvas.parentElement.clientWidth;
    let height = canvas.height = canvas.parentElement.clientHeight;

    window.addEventListener('resize', () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    });

    const particles = Array.from({ length: 14 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 1.8 + Math.random() * 1.6,
      vy: 0.9 + Math.random() * 0.8,
      r: 8 + Math.random() * 7,
      aspect: 1.15 + Math.random() * 0.35,
      angle: Math.random() * Math.PI
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Chute Guide Rails & LED Backlight Strip
      ctx.strokeStyle = 'rgba(240, 230, 215, 0.1)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 30);
      ctx.lineTo(width, height - 30);
      ctx.moveTo(0, 60);
      ctx.lineTo(width, height);
      ctx.stroke();

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.angle += 0.03;

        if (p.x > width + 25 || p.y > height + 25) {
          p.x = -20;
          p.y = Math.random() * (height * 0.4);
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        // SAM2 Instance Segmentation Mask
        ctx.fillStyle = 'rgba(107, 144, 128, 0.25)';
        ctx.strokeStyle = '#6B9080';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r * p.aspect, p.r, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // YOLOv11 Bounding Box & Class Confidence
        ctx.strokeStyle = '#E07A5F';
        ctx.lineWidth = 1;
        ctx.strokeRect(-p.r * p.aspect - 2, -p.r - 2, (p.r * p.aspect + 2) * 2, (p.r + 2) * 2);

        ctx.restore();
      });

      requestAnimationFrame(render);
    };

    render();
  },

  /* --------------------------------------------------------------------------
     6. ISRO Chandrayaan-II Lunar XRF Spectrum Visualizer
     -------------------------------------------------------------------------- */
  initISROSim() {
    const canvas = document.getElementById('spectrumCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = canvas.parentElement.clientWidth;
    let height = canvas.height = canvas.parentElement.clientHeight;

    window.addEventListener('resize', () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    });

    let flareFilterActive = true;
    let time = 0;

    const filterBtn = document.getElementById('toggleFlareFilterBtn');
    if (filterBtn) {
      filterBtn.addEventListener('click', () => {
        flareFilterActive = !flareFilterActive;
        filterBtn.textContent = flareFilterActive ? 'SOLAR BACKGROUND: ISOLATED' : 'SOLAR BACKGROUND: RAW (NOISY)';
        filterBtn.className = flareFilterActive ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-secondary';
      });
    }

    const peaks = [
      { name: 'Mg', xRatio: 0.22, heightRatio: 0.55, color: '#6B9080' },
      { name: 'Al', xRatio: 0.38, heightRatio: 0.42, color: '#E07A5F' },
      { name: 'Si', xRatio: 0.52, heightRatio: 0.85, color: '#D97706' },
      { name: 'Ca', xRatio: 0.72, heightRatio: 0.48, color: '#B45309' },
      { name: 'Fe', xRatio: 0.88, heightRatio: 0.65, color: '#9A3412' }
    ];

    const render = () => {
      time += 0.04;
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(240, 230, 215, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, height - 25);
      ctx.lineTo(width - 20, height - 25);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(30, height - 25);

      for (let x = 30; x < width - 20; x += 3) {
        const normX = (x - 30) / (width - 50);
        let yBase = height - 30;

        let noise = Math.sin(x * 0.1 + time) * 2.5;
        if (!flareFilterActive) {
          noise += Math.sin(x * 0.02 + time * 0.5) * 30 + 18;
        }

        let peakContribution = 0;
        peaks.forEach(p => {
          const dist = Math.abs(normX - p.xRatio);
          if (dist < 0.06) {
            const bell = Math.exp(-Math.pow(dist / 0.025, 2));
            peakContribution += bell * (p.heightRatio * (height - 60));
          }
        });

        const y = yBase - noise - peakContribution;
        ctx.lineTo(x, Math.max(15, y));
      }

      ctx.strokeStyle = flareFilterActive ? '#E07A5F' : '#B45309';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      if (flareFilterActive) {
        peaks.forEach(p => {
          const px = 30 + p.xRatio * (width - 50);
          const py = (height - 30) - (p.heightRatio * (height - 60)) - 8;
          ctx.fillStyle = p.color;
          ctx.font = '10px Geist Mono, monospace';
          ctx.fillText(`Kα: ${p.name}`, px - 12, Math.max(20, py));
        });
      }

      requestAnimationFrame(render);
    };

    render();
  },

  /* --------------------------------------------------------------------------
     7. Face Reconstruction GAN Split Slider with Full Portrait Containment
     -------------------------------------------------------------------------- */
  initFaceSlider() {
    const container = document.getElementById('faceSliderBox');
    const handle = document.getElementById('faceSliderHandle');
    const afterOverlay = document.getElementById('faceAfterLayer');
    const psnrValEl = document.getElementById('facePsnrVal');
    const yawValEl = document.getElementById('faceYawVal');
    if (!container || !handle || !afterOverlay) return;

    let isDragging = false;

    const updateSlider = (clientX) => {
      const rect = container.getBoundingClientRect();
      let pos = (clientX - rect.left) / rect.width;
      pos = Math.max(0.02, Math.min(0.98, pos));
      
      const pct = pos * 100;
      handle.style.left = `${pct}%`;
      afterOverlay.style.clipPath = `polygon(${pct}% 0, 100% 0, 100% 100%, ${pct}% 100%)`;

      if (psnrValEl) {
        const psnr = 18.2 + (pos * 14.6);
        psnrValEl.textContent = `${psnr.toFixed(1)} dB`;
      }
      if (yawValEl) {
        const yaw = 45 * (1 - pos);
        yawValEl.textContent = `${Math.round(yaw)}°`;
      }
    };

    handle.addEventListener('mousedown', () => isDragging = true);
    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('mousemove', (e) => {
      if (isDragging) updateSlider(e.clientX);
    });

    handle.addEventListener('touchstart', () => isDragging = true);
    window.addEventListener('touchend', () => isDragging = false);
    window.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches[0]) updateSlider(e.touches[0].clientX);
    });
  }
};
