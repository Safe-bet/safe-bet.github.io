/* Content data for the journey (git log) and the periodic table.
   Dates follow the robotics résumé (Nov 2026). */
window.SITE = {
  projects: {
    now:  { label: 'SeamFinder @ Armatrix', href: '#now' },
    atal: { label: 'ATAL AUV', href: '#atal' },
    thor: { label: 'Honeywell · 3× Thor', href: '#thor' },
    ingest: { label: 'Agentic ingestion @ Honeywell', href: '#ingest' },
    flow: { label: 'Particle flow profiler', href: '#flow' },
    xray: { label: 'LENEK chest X-ray', href: '#xray' },
    face: { label: 'Face reconstruction', href: '#work' },
    isro: { label: 'ISRO lunar XRF', href: '#work' },
    oss:  { label: 'Open source', href: '#oss' }
  },

  branches: [
    { id: 'main',     name: 'main',        color: '#ffc061' },
    { id: 'robotics', name: 'robotics',    color: '#46e3ff' },
    { id: 'ai',       name: 'industry-ai', color: '#a78bfa' },
    { id: 'research', name: 'research',    color: '#4ade80' },
    { id: 'oss',      name: 'open-source', color: '#fb923c' }
  ],

  // newest first
  commits: [
    { b: 'main', hash: 'f04d2ae', type: 'feat(career)', msg: 'Data Scientist II — Honeywell Forge', date: 'Incoming', ref: 'origin/next',
      diff: ['Rejoining the Forge AI team full-time', 'Agentic data systems and AI at industrial scale'], link: '#ingest' },
    { b: 'main', hash: 'a7f3c19', head: true, type: 'feat(vision)', msg: 'Vision Intern at Armatrix — SeamFinder', date: 'Now',
      diff: ['CAD seam → RealSense depth → torch poses for a welding arm', 'Pose lock: stable poses × 24 rotations, render-and-compare, ICP', 'Measured seams from fitted plates + per-seam confidence', 'Hand-held 3-D scan and CAD deviation maps'], link: '#now' },
    { b: 'oss', hash: '3c09e4b', type: 'fix(cub)', msg: 'align DeviceFind temp buffer to VectorT', date: 'Aug 2026', ref: 'NVIDIA/cccl#10890',
      diff: ['alignas(VectorT) on the stack buffer behind vectorized loads', 'Fixes misaligned access in cub::DeviceFind (issue #10840)', 'Merged upstream'], link: 'https://github.com/NVIDIA/cccl/pull/10890' },
    { b: 'oss', hash: '91be2d0', type: 'fix(kraken)', msg: '404s for missing containers, non-Linux FC guard', date: 'Aug 2026', ref: 'BlueOS#4184–86',
      diff: ['Container existence check before log streaming → clean 404', 'ExtensionNotFound on restarting uninstalled extensions', 'Empty serial list on non-Linux / STM32 flight controllers', '3 PRs merged upstream'], link: 'https://github.com/bluerobotics/BlueOS/pull/4186' },
    { b: 'ai', hash: 'e52a7f1', type: 'feat(inference)', msg: 'Qwen-32B on 3× NVIDIA Thor via Ray', date: 'Jul 2026', ref: 'honeywell',
      diff: ['3-node Ray cluster, one model instance per GPU → ~3× throughput', 'Tensor parallelism benchmarked: inter-GPU latency outweighs gains at 32B', 'Custom router on load, queue depth and memory headroom', 'Killed a node under load: zero-downtime failover'], link: '#thor' },
    { b: 'ai', hash: '6d1f0a8', type: 'feat(agent)', msg: 'self-healing agentic ingestion → Delta Lake', date: 'May 2026',
      diff: ['Kafka / Postgres / Elasticsearch → Delta Lake on Databricks (CI/CD)', 'Schema drift + Spark case collisions → conflict-renames + audit tables', 'Phi-4 profiling → master metadata; embedding-clustered safe unions', 'Claude Opus governance, HITL escalation, self-healing reruns, Jira alerts'], link: '#ingest' },
    { b: 'ai', hash: 'b8c4e27', type: 'feat(medical)', msg: 'chest X-ray diagnosis with Grad-CAM', date: 'Jul 2025', ref: 'lenek',
      diff: ['Multi-modal vision model trained on CheXpert', 'Cardiomegaly, effusion, pneumothorax, lung shrinkage', 'Grad-CAM evidence for radiologists'], link: '#xray' },
    { b: 'research', hash: '4f7a93c', type: 'feat(cv)', msg: 'YOLOv11 + SAM2 particle flow profiler', date: 'May 2025',
      diff: ['Inclined flow bench, DC backlight, pixel-to-mm calibration', 'Masks for touching / occluded / fast particles', '99.2% mAP@0.5 · 89.5% mAP@0.95', 'Sphericity, aspect ratio, eccentricity → material classifier'], link: '#flow' },
    { b: 'robotics', hash: 'c2d55e0', type: 'lead', msg: 'Team Head, AUV-IITK', date: 'Apr 2025',
      diff: ['30+ engineers across 6 divisions', '₹20L + ₹50L alumni funding via pitches and live demos', '₹40L+ inventory, GPU workstations for the team'], link: '#lead' },
    { b: 'oss', hash: '0a6e3f2', type: 'fix(sitl)', msg: 'drop int-vs-float ternary', date: 'Apr 2025', ref: 'ArduPilot#29624',
      diff: ['Removed an integer-literal default in SITL wind turbulence', 'Merged upstream'], link: 'https://github.com/ArduPilot/ardupilot/pull/29624' },
    { b: 'robotics', hash: '7e19b4d', type: 'release', msg: "ATAL qualifies at SAUVC '25, Singapore", date: 'Mar 2025', tag: 'sauvc-25',
      diff: ['Custom turbid-pool dataset: gates, buoys, flares, buckets', 'YOLOv11 at 30 fps on Jetson Orin Nano', 'Among 100+ teams from 20 countries'], link: '#atal' },
    { b: 'research', hash: '5b30c8a', type: 'feat(space)', msg: 'Chandrayaan-2 XRF lunar elemental map', date: 'Dec 2024', ref: 'isro',
      diff: ['Solar-flare isolation from NASA timestamps', 'Background estimation + 2-D spatial interpolation', '2nd in XRF catalogue, 6th overall of 23 IITs'], link: 'https://github.com/Safe-bet/ISRO-High-Prep-Inter-IIT-Tech-13.0' },
    { b: 'research', hash: 'd04f61e', type: 'feat(gan)', msg: 'forensic face deblurring + frontalization', date: 'Oct 2024',
      diff: ['YOLOv8 blur detection, GAN deblurring (PSNR / SSIM)', '3-D yaw estimation; extreme poses → Qwen-2.5 Image Edit'], link: '#work' },
    { b: 'robotics', hash: '8a2c7d5', type: 'feat(control)', msg: '6-DoF cascaded PID + EKF on ATAL', date: '2024',
      diff: ['Inner rate / outer attitude-position loops on 6-DoF', 'EKF fusing IMU, DVL and pressure on the MCU', 'Teleop ↔ autonomous switching, web telemetry + kill-switch'], link: '#atal' },
    { b: 'robotics', hash: '2f81a0c', type: 'feat(perception)', msg: 'underwater detection + stereo depth', date: 'Apr 2024',
      diff: ['YOLOv11 / SSD on custom pool data at 30 fps', 'Dual-IDS stereo disparity; MiDaS evaluated', 'Jetson Orin ↔ Intel NUC over onboard ethernet'], link: '#atal' },
    { b: 'main', hash: '1e0d9b3', type: 'init', msg: 'IIT Kanpur — B.Tech ChemE, minor in Cognitive Science', date: '2023',
      diff: ['JEE Advanced qualified · JEE Main top 0.5%', 'KVPY-SA AIR 1034 · NTSE Scholar'], link: '#lead' }
  ],

  groups: [
    { id: 'rob', name: 'Robotics',          color: '#46e3ff' },
    { id: 'vis', name: 'Vision',            color: '#ffc061' },
    { id: 'ml',  name: 'ML & GPU',          color: '#a78bfa' },
    { id: 'lng', name: 'Languages',         color: '#4ade80' },
    { id: 'sys', name: 'Systems & data',    color: '#94a3b8' }
  ],

  // s: symbol, n: name, g: group, u: projects that use it, d: one-line note
  elements: [
    { s: 'Ro', n: 'ROS',            g: 'rob', u: ['atal'],               d: 'Nodes, topics and mission logic on ATAL.' },
    { s: 'Pd', n: 'PID control',    g: 'rob', u: ['atal'],               d: '2-loop cascaded PID across 6-DoF, tuned live from a web dashboard.' },
    { s: 'Ek', n: 'EKF',            g: 'rob', u: ['atal'],               d: 'IMU + DVL + pressure fusion on the microcontroller.' },
    { s: 'Sv', n: 'Stereo vision',  g: 'rob', u: ['atal', 'now'],        d: 'Dual-IDS disparity on ATAL; active-stereo depth for SeamFinder.' },
    { s: 'Ic', n: 'ICP',            g: 'rob', u: ['now'],                d: 'Fine pose refinement of CAD against the measured surface.' },
    { s: 'He', n: 'Hand-eye calib', g: 'rob', u: ['now'],                d: 'Camera → robot-base transform for torch poses.' },
    { s: 'Rs', n: 'RealSense',      g: 'rob', u: ['now'],                d: 'D435 / D435i capture in its own process, native C++ helper.' },
    { s: 'Jt', n: 'Jetson Orin',    g: 'rob', u: ['atal'],               d: 'Onboard GPU perception at 30 fps.' },
    { s: 'Fw', n: 'Embedded FW',    g: 'rob', u: ['atal', 'oss'],        d: 'MCU-side estimation; ArduPilot and BlueOS contributions.' },

    { s: 'Yo', n: 'YOLO',           g: 'vis', u: ['atal', 'flow', 'face'], d: 'YOLOv11 underwater and on granular flow; YOLOv8 blur detection.' },
    { s: 'Sa', n: 'SAM2',           g: 'vis', u: ['flow'],               d: 'Instance masks for touching, occluded particles.' },
    { s: 'Cv', n: 'OpenCV',         g: 'vis', u: ['flow', 'face', 'now'], d: 'Calibration, landmarks, image processing everywhere.' },
    { s: 'Md', n: 'MiDaS',          g: 'vis', u: ['atal'],               d: 'Monocular depth evaluated under underwater scattering.' },
    { s: 'Pc', n: 'Point clouds',   g: 'vis', u: ['now'],                d: 'Depth → 3-D, plate fitting, deviation maps.' },
    { s: 'Ca', n: 'ChArUco',        g: 'vis', u: ['now'],                d: 'Board-tracked scanning and accuracy ground truth.' },
    { s: 'Gc', n: 'Grad-CAM',       g: 'vis', u: ['xray'],               d: 'Visual evidence for X-ray findings.' },
    { s: 'Gn', n: 'GANs',           g: 'vis', u: ['face'],               d: 'Motion deblurring of CCTV faces.' },
    { s: 'Vt', n: 'ViTs',           g: 'vis', u: ['xray', 'atal'],       d: 'Transformer backbones for X-ray and depth.' },

    { s: 'Pt', n: 'PyTorch',        g: 'ml',  u: ['flow', 'xray', 'face', 'thor'], d: 'Default for training and inference.' },
    { s: 'Ry', n: 'Ray',            g: 'ml',  u: ['thor'],               d: 'Multi-GPU cluster, custom router, failover.' },
    { s: 'Cu', n: 'CUDA',           g: 'ml',  u: ['thor', 'oss'],        d: 'GPU serving; CUB alignment fix upstream in NVIDIA CCCL.' },
    { s: 'Ll', n: 'LLMs',           g: 'ml',  u: ['thor', 'ingest'],               d: 'Qwen-32B serving on Thor; Phi-4 and Claude Opus inside data pipelines.' },
    { s: 'Ag', n: 'Agents',         g: 'ml',  u: ['ingest'],               d: 'Claude Opus supervising a self-healing data pipeline.' },
    { s: 'Hf', n: 'HuggingFace',    g: 'ml',  u: ['xray', 'face'],       d: 'Pretrained backbones and image-edit models.' },
    { s: 'Tf', n: 'TensorFlow',     g: 'ml',  u: [],                     d: 'Early CNN work: X-ray and flow-regime classifiers.' },
    { s: 'Sk', n: 'scikit-learn',   g: 'ml',  u: ['flow'],               d: 'Classical models on morphology features.' },
    { s: 'Np', n: 'NumPy / SciPy',  g: 'ml',  u: ['isro', 'flow'],       d: 'Spectral processing and interpolation.' },

    { s: 'Py', n: 'Python',         g: 'lng', u: ['now', 'atal', 'thor', 'ingest', 'flow', 'xray', 'face', 'isro'], d: 'Everything above, mostly.' },
    { s: 'C+', n: 'C++',            g: 'lng', u: ['atal', 'now', 'oss'], d: 'Robot code, native camera capture, ArduPilot.' },
    { s: 'C',  n: 'C',              g: 'lng', u: ['atal'],               d: 'Microcontroller firmware.' },
    { s: 'Cd', n: 'CUDA C++',       g: 'lng', u: ['oss'],                d: 'CUB device primitives.' },
    { s: 'Js', n: 'JavaScript',     g: 'lng', u: ['now', 'atal'],        d: 'three.js UI for SeamFinder; telemetry dashboard; this site.' },
    { s: 'Sq', n: 'SQL',            g: 'lng', u: ['ingest'],               d: 'Postgres sources and Delta tables.' },
    { s: 'Ml', n: 'MATLAB',         g: 'lng', u: [],                     d: 'Coursework and analysis.' },
    { s: 'Sh', n: 'Shell',          g: 'lng', u: ['now'],                d: 'Build and run tooling.' },
    { s: 'Tx', n: 'LaTeX',          g: 'lng', u: [],                     d: 'Reports, papers and the résumé behind this page.' },

    { s: 'Lx', n: 'Linux',          g: 'sys', u: ['atal', 'thor'],       d: 'Robots and clusters.' },
    { s: 'Dk', n: 'Docker',         g: 'sys', u: ['oss'],                d: 'BlueOS extensions and services.' },
    { s: 'Fa', n: 'FastAPI',        g: 'sys', u: ['now', 'oss'],         d: 'SeamFinder server; BlueOS Kraken API.' },
    { s: 'Db', n: 'Databricks',     g: 'sys', u: ['ingest'],               d: 'Jobs deployed as wheels via CI/CD.' },
    { s: 'Dl', n: 'Delta Lake',     g: 'sys', u: ['ingest'],               d: 'Source-agnostic tables with audit trails.' },
    { s: 'Kf', n: 'Kafka',          g: 'sys', u: ['ingest'],               d: 'Streaming source for ingestion.' },
    { s: 'Ci', n: 'CI/CD',          g: 'sys', u: ['ingest'],               d: 'Databricks jobs shipped as Python wheels.' },
    { s: 'Gp', n: 'GCP',            g: 'sys', u: [],                     d: 'Cloud compute.' },
    { s: 'Gt', n: 'Git',            g: 'sys', u: ['oss'],                d: 'Including this page’s journey section.' }
  ]
};
