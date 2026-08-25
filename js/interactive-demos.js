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
          appendLog("✅ [JOB COMPLETE] Databricks run succeeded (214ms). Dispatched email alert & Jira ticket #ENG-5104", "log-success");
        }, 2100);
      });
    }
  },

  /* --------------------------------------------------------------------------
     2. Honeywell 3x Thor Distributed Ray Cluster & Dynamic Router (Vertical Graph)
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
          btn.className = 'gpu-kill-btn offline';
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

      // Coordinates for Vertical Circuit Graph
      const routerX = width * 0.5;
      const routerY = 36;
      const busY = 95;
      const gpuXs = [width * 0.2, width * 0.5, width * 0.8];
      const gpuY = 175;

      const healthyGpus = gpus.filter(g => g.status === 'online');
      const loadPerHealthy = healthyGpus.length > 0 ? Math.round(100 / healthyGpus.length) : 0;

      gpus.forEach(g => {
        g.load = g.status === 'online' ? loadPerHealthy : 0;
      });

      // Spawn Request Packets along Circuit Tree
      if (healthyGpus.length > 0 && Math.random() < (totalReqPerSec / 2200)) {
        const targetGpu = healthyGpus[Math.floor(Math.random() * healthyGpus.length)];
        const gpuIndex = gpus.indexOf(targetGpu);
        const targetX = gpuXs[gpuIndex];

        packets.push({
          targetX: targetX,
          stage: 1, // 1: down to bus, 2: across bus, 3: down to GPU
          x: routerX,
          y: routerY + 18,
          progress: 0,
          speed: 0.045 + (totalReqPerSec / 45000),
          color: '#E07A5F'
        });
      }

      // Draw Network Circuit Grid Lines (Graph Layout)
      ctx.lineWidth = 2;

      // 1. Center trunk: Router down to Horizontal Distribution Bus
      ctx.strokeStyle = healthyGpus.length > 0 ? 'rgba(107, 144, 128, 0.4)' : 'rgba(224, 122, 95, 0.3)';
      ctx.beginPath();
      ctx.moveTo(routerX, routerY + 18);
      ctx.lineTo(routerX, busY);
      ctx.stroke();

      // 2. Horizontal Distribution Bus Bar
      ctx.strokeStyle = 'rgba(235, 230, 220, 0.25)';
      ctx.beginPath();
      ctx.moveTo(gpuXs[0], busY);
      ctx.lineTo(gpuXs[2], busY);
      ctx.stroke();

      // Distribution Bus Junction Node Dots
      gpuXs.forEach(gx => {
        ctx.fillStyle = '#E07A5F';
        ctx.beginPath();
        ctx.arc(gx, busY, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Three Vertical Branches down into Thor GPUs
      gpus.forEach((gpu, idx) => {
        const gx = gpuXs[idx];
        const isOnline = gpu.status === 'online';
        ctx.strokeStyle = isOnline ? 'rgba(107, 144, 128, 0.5)' : 'rgba(224, 122, 95, 0.25)';
        ctx.setLineDash(isOnline ? [] : [4, 4]);
        ctx.beginPath();
        ctx.moveTo(gx, busY);
        ctx.lineTo(gx, gpuY - 22);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Update & Draw In-Flight Packets along Circuit Graph
      packets.forEach((p, idx) => {
        if (p.stage === 1) {
          p.y += (busY - (routerY + 18)) * p.speed;
          if (p.y >= busY) {
            p.y = busY;
            p.stage = 2;
          }
        } else if (p.stage === 2) {
          const dx = p.targetX - p.x;
          if (Math.abs(dx) < 4) {
            p.x = p.targetX;
            p.stage = 3;
          } else {
            p.x += Math.sign(dx) * Math.min(Math.abs(dx), (width * 0.6) * p.speed);
          }
        } else if (p.stage === 3) {
          p.y += (gpuY - 22 - busY) * p.speed;
          if (p.y >= gpuY - 22) {
            packets.splice(idx, 1);
            return;
          }
        }

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Top Center Ray Router Node
      const rBoxW = Math.min(170, width * 0.38);
      const rBoxH = 34;
      ctx.fillStyle = '#1C1917';
      ctx.strokeStyle = '#E07A5F';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(routerX - rBoxW / 2, routerY - rBoxH / 2, rBoxW, rBoxH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#EDE8E1';
      ctx.font = 'bold 9px Geist Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText("RAY MASTER ROUTER", routerX, routerY - 3);
      ctx.fillStyle = '#6B9080';
      ctx.font = '8px Geist Mono, monospace';
      ctx.fillText(`${totalReqPerSec} req/s • DYNAMIC BALANCING`, routerX, routerY + 9);

      // Draw 3 Thor GPU Worker Nodes (Horizontal Array at Bottom)
      const gpuBoxW = Math.min(115, width * 0.28);
      const gpuBoxH = 46;

      gpus.forEach((gpu, idx) => {
        const gx = gpuXs[idx];
        const isOnline = gpu.status === 'online';

        ctx.fillStyle = isOnline ? '#181614' : 'rgba(224, 122, 95, 0.08)';
        ctx.strokeStyle = isOnline ? '#6B9080' : '#E07A5F';
        ctx.lineWidth = isOnline ? 1.5 : 1;
        ctx.beginPath();
        ctx.roundRect(gx - gpuBoxW / 2, gpuY - gpuBoxH / 2, gpuBoxW, gpuBoxH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isOnline ? '#EDE8E1' : '#E07A5F';
        ctx.font = 'bold 9px Geist Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(gpu.name, gx, gpuY - 9);

        ctx.font = '8px Geist Mono, monospace';
        ctx.fillStyle = isOnline ? '#6B9080' : '#E07A5F';
        const loadTxt = isOnline ? `LOAD: ${gpu.load}%` : "OFFLINE";
        ctx.fillText(loadTxt, gx, gpuY + 3);

        const subTxt = isOnline ? `${Math.round(totalReqPerSec * (gpu.load / 100))} r/s` : "FAILOVER";
        ctx.fillText(subTxt, gx, gpuY + 14);
      });

      requestAnimationFrame(render);
    };

    render();
  },

  /* --------------------------------------------------------------------------
     3. LENEK Technologies Medical AI Vision (Real Clinical Radiographs & Grad-CAM)
     -------------------------------------------------------------------------- */
  initLenekXRaySim() {
    const xrayImg = document.getElementById('xrayViewerImg');
    const hudCond = document.getElementById('xrayHudCondition');
    const hudConf = document.getElementById('xrayHudConfidence');
    const condBtns = document.querySelectorAll('.xray-cond-btn');

    if (!xrayImg) return;

    const conditions = {
      cardiomegaly: {
        src: 'assets/xray/xray_cardiomegaly.jpg',
        condition: 'CARDIOVASCULAR: ENLARGED CARDIAC SILHOUETTE',
        confidence: 'CONF: 96.4%'
      },
      pleural: {
        src: 'assets/xray/xray_pleural.jpg',
        condition: 'PULMONARY: BILATERAL BLUNTING OF COSTOPHRENIC SULCUS',
        confidence: 'CONF: 91.8%'
      },
      pneumothorax: {
        src: 'assets/xray/xray_pneumothorax.jpg',
        condition: 'PLEURAL: RIGHT APICAL VISCERAL PLEURAL LINE',
        confidence: 'CONF: 89.2%'
      }
    };

    condBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        condBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const condKey = btn.dataset.condition;
        const data = conditions[condKey];
        if (!data) return;

        xrayImg.style.opacity = '0.3';
        setTimeout(() => {
          xrayImg.src = data.src;
          if (hudCond) hudCond.textContent = data.condition;
          if (hudConf) hudConf.textContent = data.confidence;
          xrayImg.style.opacity = '1';
        }, 150);
      });
    });
  },

  /* --------------------------------------------------------------------------
     4. ATAL AUV 8-Thruster Hydrodynamic Submarine Physics Engine
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
      const pGain = 0.055;
      const dGain = 0.86;
      sub.angularVelocity = sub.angularVelocity * dGain + angleDiff * pGain;
      sub.heading += sub.angularVelocity;

      // Forward Thrust Force
      const alignment = Math.max(0, Math.cos(angleDiff));
      if (dist > 15) {
        sub.thrust = Math.min(2.8, dist * 0.05) * alignment;
        sub.vx += Math.cos(sub.heading) * sub.thrust * 0.16;
        sub.vy += Math.sin(sub.heading) * sub.thrust * 0.16;
      } else {
        sub.thrust = 0;
      }

      // Drag Damping
      sub.vx *= 0.93;
      sub.vy *= 0.93;
      sub.x += sub.vx;
      sub.y += sub.vy;
      sub.depth = 3.4 + Math.sin(Date.now() * 0.002) * 0.1;

      // Thruster Cavitation Bubbles
      if (sub.thrust > 0.35 && Math.random() < 0.8) {
        const rearX = sub.x - Math.cos(sub.heading) * 44;
        const rearY = sub.y - Math.sin(sub.heading) * 44;
        bubbles.push({
          x: rearX + (Math.random() - 0.5) * 8,
          y: rearY + (Math.random() - 0.5) * 8,
          vx: -Math.cos(sub.heading) * (1.2 + Math.random() * 2),
          vy: -Math.sin(sub.heading) * (1.2 + Math.random() * 2),
          r: 2 + Math.random() * 2.5,
          alpha: 0.85
        });
      }

      // Blueprint Sub-Aquatic Grid
      ctx.strokeStyle = 'rgba(235, 230, 220, 0.04)';
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

      // Sonar Radar Rings
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

      // Waypoint Indicators
      waypoints.forEach((wp, idx) => {
        const isCurrent = (mode === 'autonomous' && idx === currentWpIdx);
        ctx.strokeStyle = isCurrent ? '#E07A5F' : 'rgba(224, 122, 95, 0.3)';
        ctx.lineWidth = isCurrent ? 2 : 1;
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = isCurrent ? '#EDE8E1' : 'rgba(235, 230, 220, 0.4)';
        ctx.font = '7px Geist Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(wp.label, wp.x, wp.y - 12);
      });

      // Draw Bubbles
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

      // ----------------------------------------------------------------------
      // Draw ATAL Autonomous Underwater Vehicle (Submarine / Torpedo Hull CAD)
      // ----------------------------------------------------------------------
      ctx.save();
      ctx.translate(sub.x, sub.y);
      ctx.rotate(sub.heading);

      // 1. Forward Sonar Scanning Cone (Sweeping Arc)
      const sonarGrad = ctx.createRadialGradient(25, 0, 5, 80, 0, 90);
      sonarGrad.addColorStop(0, 'rgba(107, 144, 128, 0.25)');
      sonarGrad.addColorStop(1, 'rgba(107, 144, 128, 0)');
      ctx.fillStyle = sonarGrad;
      ctx.beginPath();
      ctx.moveTo(25, 0);
      ctx.arc(25, 0, 85, -0.4, 0.4);
      ctx.closePath();
      ctx.fill();

      // 2. Streamlined Submarine Hull (Tapered Nose + Cylindrical Body + Conical Tail)
      ctx.fillStyle = '#14171A';
      ctx.strokeStyle = '#E07A5F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(42, 0);
      ctx.bezierCurveTo(42, -14, 25, -16, 0, -16);
      ctx.lineTo(-32, -15);
      ctx.bezierCurveTo(-42, -12, -48, -4, -50, 0);
      ctx.bezierCurveTo(-48, 4, -42, 12, -32, 15);
      ctx.lineTo(0, 16);
      ctx.bezierCurveTo(25, 16, 42, 14, 42, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 3. Central Acrylic / Avionics Enclosure Window
      ctx.fillStyle = 'rgba(107, 144, 128, 0.2)';
      ctx.strokeStyle = 'rgba(107, 144, 128, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-18, -9, 36, 18, 4);
      ctx.fill();
      ctx.stroke();

      // 4. Titanium Hull Strengthening Ring Ribs
      ctx.strokeStyle = 'rgba(235, 230, 220, 0.2)';
      ctx.lineWidth = 1.2;
      [-18, 0, 18].forEach(rx => {
        ctx.beginPath();
        ctx.moveTo(rx, -15);
        ctx.lineTo(rx, 15);
        ctx.stroke();
      });

      // 5. Dual Optical Dome Front Cameras at Nose Apex
      ctx.fillStyle = '#6B9080';
      ctx.beginPath();
      ctx.arc(38, -6, 2.5, 0, Math.PI * 2);
      ctx.arc(38, 6, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // 6. Rear Hydrodynamic Stabilizer Fins / Rudder Dive Planes
      ctx.fillStyle = '#E07A5F';
      ctx.beginPath();
      ctx.moveTo(-40, -14);
      ctx.lineTo(-52, -22);
      ctx.lineTo(-46, -12);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-40, 14);
      ctx.lineTo(-52, 22);
      ctx.lineTo(-46, 12);
      ctx.closePath();
      ctx.fill();

      // 7. 4 Vectored Horizontal Thrusters on Angled Wing Outriggers (45° canted)
      const hThrusters = [
        { x: -28, y: -26, angle: -0.45 },
        { x: -28, y: 26, angle: 0.45 },
        { x: 20, y: -26, angle: 0.45 },
        { x: 20, y: 26, angle: -0.45 }
      ];

      hThrusters.forEach(t => {
        ctx.strokeStyle = 'rgba(235, 230, 220, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(t.x > 0 ? 12 : -18, t.y > 0 ? 15 : -15);
        ctx.lineTo(t.x, t.y);
        ctx.stroke();

        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(t.angle);
        ctx.fillStyle = sub.thrust > 0.4 ? 'rgba(224, 122, 95, 0.4)' : '#181614';
        ctx.strokeStyle = '#E07A5F';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-6, -3.5, 12, 7);
        ctx.fillRect(-6, -3.5, 12, 7);
        ctx.restore();
      });

      // 8. 4 Vertical Ducted Thruster Shrouds (Circular Tunnels in Hull)
      ctx.fillStyle = '#0E0D0B';
      ctx.strokeStyle = 'rgba(235, 230, 220, 0.4)';
      ctx.lineWidth = 1;
      [
        { x: -16, y: -7 },
        { x: -16, y: 7 },
        { x: 14, y: -7 },
        { x: 14, y: 7 }
      ].forEach(vt => {
        ctx.beginPath();
        ctx.arc(vt.x, vt.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      ctx.restore();

      // Real-Time Telemetry HUD Updates
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
     5. SURGE '25 Granular Particle Flow Media Carousel (Images + Video)
     -------------------------------------------------------------------------- */
  initSurgeCarousel() {
    const slides = document.querySelectorAll('.surge-slide');
    const dots = document.querySelectorAll('.surge-dot');
    const prevBtn = document.getElementById('surgePrevBtn');
    const nextBtn = document.getElementById('surgeNextBtn');
    const captionEl = document.getElementById('surgeCaptionText');

    if (!slides.length) return;

    let currentSlide = 0;
    const captions = [
      "[1/5] YOLOv11 + SAM2 Instance Segmentation on Granular Bed",
      "[2/5] Multi-Material Boundary Bounding Boxes & Class Confidence",
      "[3/5] High-Density Iron Ore Chute Particle Stream",
      "[4/5] Sinter & Coke Morphology Contour Analysis",
      "[5/5] High-Speed Industrial Camera Feed @ 120 FPS Real-Time Inference"
    ];

    const showSlide = (idx) => {
      currentSlide = (idx + slides.length) % slides.length;

      slides.forEach((s, i) => {
        s.classList.toggle('active', i === currentSlide);
      });

      dots.forEach((d, i) => {
        d.classList.toggle('active', i === currentSlide);
      });

      if (captionEl) {
        captionEl.textContent = captions[currentSlide] || '';
      }
    };

    if (prevBtn) {
      prevBtn.addEventListener('click', () => showSlide(currentSlide - 1));
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => showSlide(currentSlide + 1));
    }

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => showSlide(idx));
    });
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
