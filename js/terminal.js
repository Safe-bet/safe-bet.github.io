/**
 * SUYASH KUMAR — DEVELOPER COMMAND PALETTE & CLI (WARM PALETTE)
 */

const DeveloperTerminal = {
  isOpen: false,
  history: [],
  historyIndex: -1,

  commands: {
    help: {
      desc: "List all available interactive commands",
      exec: () => `
<span class="text-terracotta font-bold">SUYASH KUMAR — CLI SHELL v3.0</span>
--------------------------------------------------
<span class="text-amber">skills</span>       : View primary technical proficiencies & stack
<span class="text-amber">projects</span>     : List core engineering workbenches
<span class="text-amber">honeywell</span>    : Architecture breakdown of Multi-Agent Pipeline
<span class="text-amber">auv</span>          : Details on ATAL AUV 6-DoF Autonomy & SAUVC
<span class="text-amber">isro</span>         : Chandrayaan-II Lunar Surface Spectral Pipeline
<span class="text-amber">surge</span>        : Granular Particle Flow Profiler (YOLOv11+SAM2)
<span class="text-amber">scholastic</span>   : Scholastic ranks (JEE Adv, KVPY, NTSE)
<span class="text-amber">leadership</span>   : AUV-IITK Head, Pragaman, & Programming Club
<span class="text-amber">resume</span>       : Download verified PDF resume
<span class="text-amber">theme [dark|light]</span> : Toggle visual appearance
<span class="text-amber">contact</span>      : Display direct communication channels
<span class="text-amber">clear</span>        : Clear the terminal output buffer
`
    },

    skills: {
      desc: "Display technical skills and frameworks matrix",
      exec: () => `
<span class="text-sage font-bold">SYSTEMS & PROGRAMMING</span>: C, C++, Python, SQL, MATLAB, LaTeX
<span class="text-sage font-bold">AI / DEEP LEARNING</span>   : PyTorch, TensorFlow, OpenCV, YOLOv11, SAM2, HuggingFace, Ray
<span class="text-sage font-bold">ROBOTICS & PLATFORMS</span> : ROS, NVIDIA Jetson Orin Nano, EKF, Cascaded PID, Docker, Linux, GCP, Databricks
<span class="text-sage font-bold">AI PRODUCTIVITY</span>      : Antigravity, GitHub Copilot, Stitch, Kaggle
`
    },

    projects: {
      desc: "Overview of key engineering workbenches",
      exec: () => `
1. <span class="text-terracotta font-bold">Honeywell Forge</span>: Agentic Data Ingestion Pipeline (Kafka, Ray, 3x Thor GPUs, Claude+Phi-4)
2. <span class="text-terracotta font-bold">ATAL AUV Autonomy</span>: 6-DoF EKF State Estimation & Cascaded PID Control (SAUVC Singapore)
3. <span class="text-terracotta font-bold">ISRO Lunar Spectral Mapping</span>: Chandrayaan-II XRF Flare Filter (Inter-IIT 2nd/6th)
4. <span class="text-terracotta font-bold">SURGE '25 Flow Profiler</span>: Granular Morphology with YOLOv11 + SAM2 (99.2% mAP)
5. <span class="text-terracotta font-bold">Face Reconstruction</span>: CCTV Motion Deblurring GANs & 3D Yaw Frontalization
`
    },

    honeywell: {
      desc: "Honeywell Forge AI team engineering achievements",
      exec: () => `
<span class="text-terracotta font-bold">HONEYWELL TECHNOLOGIES | AI INTERN (BENGALURU)</span>
• Built plug-and-play connectors unifying Kafka, PostgreSQL, and Elasticsearch.
• Integrated Master Claude LLM + Phi-4 sub-agents for automated schema drift self-healing.
• Engineered distributed parallel inference across 3 NVIDIA Thor GPUs using Ray.
• Proved multi-instance replication superior for real-time throughput vs model splitting.
`
    },

    lenek: {
      desc: "LENEK Technologies Multi-Modal Chest X-Ray Vision Diagnostics",
      exec: () => `
<span class="text-amber font-bold">LENEK TECHNOLOGIES | AI INTERN (JULY '25 - DEC '25)</span>
• Multi-modal vision model for disease diagnosis using chest X-ray imaging.
• Automated detection for cardiomegaly, pleural effusion, lung shrinkage, and pneumothorax.
• Reduced dependency on expensive secondary CT scans with faster, accurate radiologist triage.
`
    },

    auv: {
      desc: "ATAL AUV robotics perception and 6-DoF control suite",
      exec: () => `
<span class="text-amber font-bold">ATAL AUV — PERCEPTION & 6-DoF AUTONOMY (AUV-IITK)</span>
• Cascaded PID dynamic stabilization across all 6 Degrees of Freedom.
• Custom Extended Kalman Filter (EKF) fusing IMU, DVL, and pressure sensors.
• Real-time underwater YOLOv11 multi-class detection running at 30 FPS on Jetson Orin Nano.
• Represented IIT Kanpur at SAUVC '25 in Singapore among 100+ international teams.
`
    },

    isro: {
      desc: "ISRO Chandrayaan-II lunar elemental mapping",
      exec: () => `
<span class="text-amber font-bold">ISRO LUNAR SURFACE ELEMENTAL MAPPING</span>
• Processed Chandrayaan-II XRF spectral data for elemental abundance mapping (Mg, Al, Si, Ca, Fe).
• Isolated solar flare background noise using NASA timestamp synchronization.
• Ranked 2nd in XRF Catalogue & 6th Overall among 23 IITs at 13th Inter-IIT Tech Meet.
`
    },

    surge: {
      desc: "SURGE '25 Granular Particle Flow Profiler",
      exec: () => `
<span class="text-sage font-bold">GRANULAR FLOW PROFILER | SURGE '25 (IIT KANPUR)</span>
• Coupled YOLOv11 particle detection with SAM2 segmentation (99.2% mAP@0.5).
• Extracted morphological features: aspect ratio, sphericity, contact eccentricity.
• Automated real-time quality control on high-speed industrial video streams.
`
    },

    scholastic: {
      desc: "Scholastic honors and competitive standings",
      exec: () => `
<span class="text-terracotta font-bold">SCHOLASTIC ACHIEVEMENTS</span>
• <span class="text-sage">Qualified</span>: JEE Advanced (2023) — admission into IIT Kanpur
• <span class="text-sage">Qualified</span>: JEE Main (2023) — National Engineering Entrance Examination
• <span class="text-sage">AIR 1034</span>: KVPY-SA (2022) conducted by IISc Bangalore
• <span class="text-sage">NTSE Scholar</span>: National Talent Search Stage 2 (State Rank 20 in Stage 1)
`
    },

    leadership: {
      desc: "Leadership & organizational impact metrics",
      exec: () => `
<span class="text-terracotta font-bold">LEADERSHIP & POSITIONS OF RESPONSIBILITY</span>
• <span class="text-amber">Team Head @ AUV-IITK</span>: Led 30+ engineers, secured ₹70L+ in alumni funding, managed ₹40L+ inventory.
• <span class="text-amber">Overall Coordinator @ Pragaman</span>: Led flagship IITK Academic & Career Festival (₹25L+ budget, 4 verticals).
• <span class="text-amber">Programming Club Secretary</span>: Curated CV roadmap & won 2nd in Computer Vision at Takneek '24.
`
    },

    resume: {
      desc: "Download verified PDF resume",
      exec: () => {
        window.open('assets/Suyash_Kumar_Resume.pdf', '_blank');
        return `<span class="text-sage">📄 Triggered resume download: assets/Suyash_Kumar_Resume.pdf</span>`;
      }
    },

    theme: {
      desc: "Toggle light/dark theme (e.g. 'theme light' or 'theme dark')",
      exec: (arg) => {
        const target = arg === 'light' || arg === 'dark' ? arg : (document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
        document.documentElement.setAttribute('data-theme', target);
        localStorage.setItem('suyash_theme', target);
        TelemetryEngine.updateThemeIcon(target);
        return `<span class="text-amber">Theme updated to: ${target.toUpperCase()}</span>`;
      }
    },

    contact: {
      desc: "Contact information and direct handles",
      exec: () => `
<span class="text-terracotta font-bold">DIRECT CHANNELS</span>
• Email: <a href="mailto:k.suyashc@gmail.com" class="text-amber">k.suyashc@gmail.com</a>
• Phone: <a href="tel:+919807199316" class="text-amber">+91 9807199316</a>
• LinkedIn: <a href="https://www.linkedin.com/in/suyashkumar/" target="_blank" class="text-amber">linkedin.com/in/suyashkumar</a>
• GitHub: <a href="https://github.com/safe-bet" target="_blank" class="text-amber">github.com/safe-bet</a>
• Kaggle: <a href="https://www.kaggle.com/safebet1034" target="_blank" class="text-amber">kaggle.com/safebet1034</a>
`
    },

    clear: {
      desc: "Clear the terminal output",
      exec: () => {
        const out = document.getElementById('cmdTerminalOutput');
        if (out) out.innerHTML = '';
        return '';
      }
    }
  },

  init() {
    this.modalEl = document.getElementById('cmdModalBackdrop');
    this.inputEl = document.getElementById('cmdPaletteInput');
    this.resultsEl = document.getElementById('cmdResultsList');
    this.outputEl = document.getElementById('cmdTerminalOutput');

    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.toggleModal();
      } else if (e.key === 'Escape' && this.isOpen) {
        this.closeModal();
      }
    });

    const triggerBtn = document.getElementById('cmdTriggerBtn');
    if (triggerBtn) triggerBtn.addEventListener('click', () => this.openModal());

    const escBtn = document.getElementById('cmdEscBtn');
    if (escBtn) escBtn.addEventListener('click', () => this.closeModal());

    if (this.modalEl) {
      this.modalEl.addEventListener('click', (e) => {
        if (e.target === this.modalEl) this.closeModal();
      });
    }

    if (this.inputEl) {
      this.inputEl.addEventListener('input', (e) => this.handleFilter(e.target.value));
      this.inputEl.addEventListener('keydown', (e) => this.handleInputKey(e));
    }

    this.renderInitialList();
  },

  openModal() {
    if (!this.modalEl) return;
    this.isOpen = true;
    this.modalEl.classList.add('open');
    if (this.inputEl) {
      this.inputEl.value = '';
      this.inputEl.focus();
    }
    this.renderInitialList();
  },

  closeModal() {
    if (!this.modalEl) return;
    this.isOpen = false;
    this.modalEl.classList.remove('open');
  },

  toggleModal() {
    if (this.isOpen) this.closeModal();
    else this.openModal();
  },

  renderInitialList() {
    if (!this.resultsEl) return;
    this.resultsEl.innerHTML = '';
    Object.keys(this.commands).forEach(cmd => {
      const item = document.createElement('div');
      item.className = 'cmd-item';
      item.innerHTML = `
        <div class="cmd-item-title">
          <span class="text-terracotta font-bold">> ${cmd}</span>
          <span class="cmd-category-tag">${this.commands[cmd].desc}</span>
        </div>
        <span class="cmd-esc-hint">↵ RUN</span>
      `;
      item.addEventListener('click', () => this.executeCommand(cmd));
      this.resultsEl.appendChild(item);
    });
  },

  handleFilter(query) {
    const q = query.trim().toLowerCase();
    if (!this.resultsEl) return;
    this.resultsEl.innerHTML = '';

    const matches = Object.keys(this.commands).filter(cmd => 
      cmd.includes(q) || this.commands[cmd].desc.toLowerCase().includes(q)
    );

    if (matches.length === 0) {
      this.resultsEl.innerHTML = `<div class="p-3 text-muted text-center font-mono text-sm">No command matches "${query}". Press Enter to run directly.</div>`;
      return;
    }

    matches.forEach(cmd => {
      const item = document.createElement('div');
      item.className = 'cmd-item';
      item.innerHTML = `
        <div class="cmd-item-title">
          <span class="text-terracotta font-bold">> ${cmd}</span>
          <span class="cmd-category-tag">${this.commands[cmd].desc}</span>
        </div>
        <span class="cmd-esc-hint">↵ RUN</span>
      `;
      item.addEventListener('click', () => this.executeCommand(cmd));
      this.resultsEl.appendChild(item);
    });
  },

  handleInputKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = this.inputEl.value.trim();
      if (val) {
        this.executeCommand(val);
      }
    }
  },

  executeCommand(rawCmd) {
    if (!this.outputEl) return;
    const parts = rawCmd.trim().split(' ');
    const cmd = parts[0].toLowerCase();
    const arg = parts[1];

    const outLine = document.createElement('div');
    outLine.style.marginBottom = '0.75rem';

    if (this.commands[cmd]) {
      const result = this.commands[cmd].exec(arg);
      outLine.innerHTML = `
        <div class="text-muted">> ${rawCmd}</div>
        <div>${result}</div>
      `;
    } else {
      outLine.innerHTML = `
        <div class="text-muted">> ${rawCmd}</div>
        <div class="text-amber">Command not found: "${cmd}". Type <span class="text-terracotta font-bold">help</span> to see available commands.</div>
      `;
    }

    this.outputEl.appendChild(outLine);
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
    if (this.inputEl) this.inputEl.value = '';
  }
};
