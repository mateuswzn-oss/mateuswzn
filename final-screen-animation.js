(() => {
  class FinalScreenAnimation {
    constructor({ screen, stage, canvas, isCoarsePointerDevice }) {
      this.screen = screen;
      this.stage = stage;
      this.canvas = canvas;
      this.isCoarsePointerDevice = Boolean(isCoarsePointerDevice);
      this.ctx = this.canvas ? this.canvas.getContext('2d', { alpha: true, desynchronized: true }) : null;

      this.running = false;
      this.rafId = 0;
      this.lastTs = 0;
      this.bound = false;

      this.states = [
        { name: 'idle', ms: 900 },
        { name: 'formingHeart', ms: 1200 },
        { name: 'heartStable', ms: 1500 },
        { name: 'dissolving', ms: 1000 },
        { name: 'formingText', ms: 1200 },
        { name: 'textStable', ms: 1500 },
        { name: 'dissolvingText', ms: 1000 }
      ];
      this.stateIndex = 0;
      this.stateName = this.states[0].name;
      this.stateElapsed = 0;
      this.stateProgress = 0;

      this.centerHeartScale = 1;
      this.centerHeartAlpha = 0;

      this.pointerX = 0;
      this.pointerY = 0;
      this.pointerTargetX = 0;
      this.pointerTargetY = 0;
      this.pointerActive = false;
      this.pointerHistory = [];
      this.pointerHistoryLimit = this.isCoarsePointerDevice ? 16 : 24;
      this.trailSpawnThrottleMs = this.isCoarsePointerDevice ? 80 : 56;
      this.lastTrailSpawnAt = 0;
      this.targetFrameMs = this.isCoarsePointerDevice ? (1000 / 24) : (1000 / 30);

      this.particles = [];
      this.morphTargetsHeart = [];
      this.morphTargetsText = [];
      this.morphCount = this.isCoarsePointerDevice ? 180 : 300;

      this.petals = [];
      this.petalCount = this.isCoarsePointerDevice ? 5 : 7;

      this.sparkles = [];
      this.sparkleCount = this.isCoarsePointerDevice ? 5 : 7;

      this.trailParticles = [];
      this.trailParticleMax = this.isCoarsePointerDevice ? 40 : 56;

      this.maxLetterIndex = 0;

      this.textSampleCanvas = document.createElement('canvas');
      this.textSampleCtx = this.textSampleCanvas.getContext('2d', { willReadFrequently: true });
      this.textPhrase = 'EU TE AMO';
      this.textGlyphRanges = [];
      this.textSourceWidth = 1200;
      this.textSourceHeight = 420;
      this.textPointLimit = 1200;

      this.handleResize = this.handleResize.bind(this);
      this.handlePointerMove = this.handlePointerMove.bind(this);
      this.handlePointerLeave = this.handlePointerLeave.bind(this);
      this.render = this.render.bind(this);
    }

    bind() {
      if (this.bound) return;
      window.addEventListener('resize', this.handleResize, { passive: true });
      window.addEventListener('pointermove', this.handlePointerMove, { passive: true });
      window.addEventListener('pointerdown', this.handlePointerMove, { passive: true });
      window.addEventListener('pointerleave', this.handlePointerLeave, { passive: true });
      this.bound = true;
    }

    unbind() {
      if (!this.bound) return;
      window.removeEventListener('resize', this.handleResize);
      window.removeEventListener('pointermove', this.handlePointerMove);
      window.removeEventListener('pointerdown', this.handlePointerMove);
      window.removeEventListener('pointerleave', this.handlePointerLeave);
      this.bound = false;
    }

    handleResize() {
      this.resize();
      if (this.running) {
        this.rebuildScene();
      }
    }

    handlePointerMove(event) {
      if (!this.running || !this.screen || !this.stage) return;
      if (!this.screen.classList.contains('active') || !this.screen.classList.contains('final-phase-effect')) return;

      const rect = this.stage.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));

      this.pointerActive = true;
      this.pointerTargetX = x;
      this.pointerTargetY = y;

      this.pointerHistory.push({ x, y, life: 1 });
      if (this.pointerHistory.length > this.pointerHistoryLimit) {
        this.pointerHistory.shift();
      }

      const now = (typeof performance !== 'undefined' && typeof performance.now === 'function') ? performance.now() : Date.now();
      if ((now - this.lastTrailSpawnAt) >= this.trailSpawnThrottleMs) {
        this.lastTrailSpawnAt = now;
        this.spawnTrailBurst(x, y);
      }
    }

    handlePointerLeave() {
      this.pointerActive = false;
    }

    resize() {
      if (!this.canvas || !this.ctx) return;
      const width = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
      const height = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      this.canvas.width = Math.floor(width * dpr);
      this.canvas.height = Math.floor(height * dpr);
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    get width() {
      return this.canvas?.clientWidth || window.innerWidth;
    }

    get height() {
      return this.canvas?.clientHeight || window.innerHeight;
    }

    get center() {
      return {
        x: this.width / 2,
        y: this.height / 2
      };
    }

    start() {
      if (!this.ctx || !this.canvas || !this.screen || !this.stage) return;
      if (!this.screen.classList.contains('active') || !this.screen.classList.contains('final-phase-effect')) return;

      this.bind();
      this.resize();
      this.rebuildScene();

      this.running = true;
      this.lastTs = 0;
      this.stateIndex = 0;
      this.stateName = this.states[0].name;
      this.stateElapsed = 0;
      this.stateProgress = 0;

      const center = this.center;
      this.pointerX = center.x;
      this.pointerY = center.y;
      this.pointerTargetX = center.x;
      this.pointerTargetY = center.y;
      this.pointerActive = false;
      this.pointerHistory = [];
      this.trailParticles = [];
      this.lastTrailSpawnAt = 0;

      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.enterState(this.stateName, 0);
      this.rafId = requestAnimationFrame(this.render);
    }

    stop() {
      this.running = false;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = 0;
      }
      this.unbind();

      this.particles = [];
      this.morphTargetsHeart = [];
      this.morphTargetsText = [];
      this.petals = [];
      this.sparkles = [];
      this.pointerHistory = [];
      this.trailParticles = [];

      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.width, this.height);
      }
    }

    rebuildScene() {
      const width = this.width;
      const height = this.height;

      const heartRaw = this.buildHeartContourTargets(this.morphCount, width, height);
      const textRaw = this.buildTextTargetsFromCanvas(width, height, this.textPhrase);
      const particleCount = Math.min(this.morphCount, heartRaw.length, textRaw.length);

      this.morphTargetsHeart = this.selectTargets(heartRaw, particleCount);
      this.morphTargetsText = this.selectTargets(textRaw, particleCount);
      this.initMorphParticles(width, height, particleCount);
      this.initPetals(width, height);
      this.initSparkles(width, height);
    }

    selectTargets(targets, count) {
      if (!Array.isArray(targets) || !targets.length || count <= 0) return [];
      if (targets.length === count) return targets.slice();
      if (count === 1) return [targets[0]];

      const mapped = [];
      for (let i = 0; i < count; i += 1) {
        const ratio = i / (count - 1);
        const idx = Math.round(ratio * (targets.length - 1));
        mapped.push(targets[idx]);
      }
      return mapped;
    }

    buildHeartContourTargets(count, width, height) {
      const centerX = width / 2;
      const centerY = height / 2;
      const baseScale = Math.min(width, height) * (this.isCoarsePointerDevice ? 0.0083 : 0.0091);
      const scaleX = baseScale * 0.7;
      const scaleY = baseScale * 0.92;
      const samples = 720;
      const raw = [];

      for (let i = 0; i <= samples; i += 1) {
        const t = (i / samples) * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        raw.push({
          x: centerX + (hx * scaleX),
          y: centerY + (hy * scaleY)
        });
      }

      return this.sampleEvenly(raw, count);
    }

    sampleEvenly(points, count) {
      if (!Array.isArray(points) || points.length < 2 || count <= 0) return [];

      const lengths = [0];
      for (let i = 1; i < points.length; i += 1) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        lengths[i] = lengths[i - 1] + Math.hypot(dx, dy);
      }

      const total = lengths[lengths.length - 1] || 1;
      const result = [];
      let seg = 1;

      for (let i = 0; i < count; i += 1) {
        const targetLen = (i / count) * total;
        while (seg < lengths.length && lengths[seg] < targetLen) {
          seg += 1;
        }

        const rightIdx = Math.min(seg, points.length - 1);
        const leftIdx = Math.max(0, rightIdx - 1);
        const l0 = lengths[leftIdx];
        const l1 = lengths[rightIdx] || l0;
        const ratio = l1 === l0 ? 0 : (targetLen - l0) / (l1 - l0);
        const p0 = points[leftIdx];
        const p1 = points[rightIdx];

        result.push({
          x: p0.x + ((p1.x - p0.x) * ratio),
          y: p0.y + ((p1.y - p0.y) * ratio)
        });
      }

      return result;
    }

    buildTextTargetsFromCanvas(width, height, phrase) {
      const ctx = this.textSampleCtx;
      if (!ctx) return [];

      const canvas = this.textSampleCanvas;
      const sourceW = this.textSourceWidth;
      const sourceH = this.textSourceHeight;
      canvas.width = sourceW;
      canvas.height = sourceH;
      ctx.clearRect(0, 0, sourceW, sourceH);

      const fontSize = 160;
      const letterSpacing = 18;
      const wordSpacing = 68;
      const centerX = sourceW * 0.5;
      const centerY = sourceH * 0.5;

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${fontSize}px sans-serif`;

      const chars = Array.from(phrase);
      const totalWidth = chars.reduce((sum, ch, index) => {
        if (ch === ' ') return sum + wordSpacing;
        const glyphW = ctx.measureText(ch).width;
        const spacing = index < chars.length - 1 ? letterSpacing : 0;
        return sum + glyphW + spacing;
      }, 0);
      let cursorX = centerX - (totalWidth / 2);

      const ranges = [];
      let letterIndex = 0;

      for (let i = 0; i < chars.length; i += 1) {
        const ch = chars[i];
        if (ch === ' ') {
          cursorX += wordSpacing;
          continue;
        }

        const glyphWidth = ctx.measureText(ch).width;
        ctx.fillText(ch, cursorX, centerY);
        ranges.push({
          x0: cursorX - (letterSpacing * 0.2),
          x1: cursorX + glyphWidth + (letterSpacing * 0.2),
          letterIndex
        });
        cursorX += glyphWidth + letterSpacing;
        letterIndex += 1;
      }

      this.maxLetterIndex = Math.max(0, letterIndex - 1);
      this.textGlyphRanges = ranges;

      const image = ctx.getImageData(0, 0, sourceW, sourceH).data;
      const samplePoints = (step) => {
        const sampled = [];
        for (let y = 0; y < sourceH; y += step) {
          for (let x = 0; x < sourceW; x += step) {
            const idx = ((y * sourceW) + x) * 4;
            const alpha = image[idx + 3];
            if (alpha <= 128) continue;
            sampled.push({
              x,
              y,
              letterIndex: this.resolveGlyphIndex(x)
            });
          }
        }
        return sampled;
      };

      let step = this.isCoarsePointerDevice ? 8 : 6;
      let points = samplePoints(step);
      while (points.length > this.textPointLimit && step < 18) {
        step += 1;
        points = samplePoints(step);
      }

      const textBoxWidth = Math.min(width * (this.isCoarsePointerDevice ? 0.9 : 0.84), 980);
      const textBoxHeight = Math.min(height * 0.32, 240);
      const scale = Math.min(textBoxWidth / sourceW, textBoxHeight / sourceH);
      const drawW = sourceW * scale;
      const drawH = sourceH * scale;
      const offsetX = (width - drawW) / 2;
      const offsetY = (height * 0.64) - (drawH / 2);

      for (let i = 0; i < points.length; i += 1) {
        points[i].x = offsetX + (points[i].x * scale);
        points[i].y = offsetY + (points[i].y * scale);
      }

      return points;
    }

    resolveGlyphIndex(x) {
      if (!this.textGlyphRanges.length) return 0;
      for (let i = 0; i < this.textGlyphRanges.length; i += 1) {
        const range = this.textGlyphRanges[i];
        if (x >= range.x0 && x <= range.x1) {
          return range.letterIndex;
        }
      }
      const last = this.textGlyphRanges[this.textGlyphRanges.length - 1];
      return last ? last.letterIndex : 0;
    }

    initMorphParticles(width, height, count) {
      const center = this.center;
      const outerRadius = Math.max(width, height) * 0.64;

      this.particles = Array.from({ length: count }, (_, index) => {
        const angle = Math.random() * Math.PI * 2;
        const radius = outerRadius * (0.55 + (Math.random() * 0.6));
        return {
          index,
          x: center.x + (Math.cos(angle) * radius),
          y: center.y + (Math.sin(angle) * radius),
          fromX: center.x + (Math.cos(angle) * radius),
          fromY: center.y + (Math.sin(angle) * radius),
          targetX: center.x,
          targetY: center.y,
          homeX: center.x,
          homeY: center.y,
          hx: center.x,
          hy: center.y,
          tx: center.x,
          ty: center.y,

          alpha: 0.68,
          fromAlpha: 0.68,
          targetAlpha: 0.68,

          scale: 0.95,
          fromScale: 0.95,
          targetScale: 1,

          letterDelay: 0,
          radialDelay: 0,
          transitionDelay: 0,

          pulseSeed: Math.random() * Math.PI * 2,
          noiseSeed: Math.random() * Math.PI * 2,
          escapeSeed: Math.random() * Math.PI * 2,

          speed: 0.08 + (Math.random() * 0.05),
          noiseAmp: this.isCoarsePointerDevice ? 0.35 : 0.5,
          size: this.isCoarsePointerDevice ? 4.7 : 5.2
        };
      });

      this.assignPairedTargets();
    }

    assignPairedTargets() {
      const center = this.center;
      const radiusNormBase = Math.max(40, Math.min(this.width, this.height) * 0.22);

      this.particles.forEach((particle, index) => {
        const heartTarget = this.morphTargetsHeart[index] || center;
        const textTarget = this.morphTargetsText[index] || center;

        particle.hx = heartTarget.x;
        particle.hy = heartTarget.y;
        particle.tx = textTarget.x;
        particle.ty = textTarget.y;

        const letterIndex = Number.isFinite(textTarget.letterIndex) ? textTarget.letterIndex : 0;
        const maxLetter = Math.max(1, this.maxLetterIndex);

        const dx = heartTarget.x - center.x;
        const dy = heartTarget.y - center.y;
        const radial = this.clamp01(Math.hypot(dx, dy) / radiusNormBase);

        particle.letterDelay = (letterIndex / maxLetter) * 0.22;
        particle.radialDelay = radial * 0.24;
      });
    }

    initPetals(width, height) {
      this.petals = Array.from({ length: this.petalCount }, () => this.makePetal(width, height));
    }

    makePetal(width, height) {
      let x = Math.random() * width;
      const centerZoneStart = width * 0.36;
      const centerZoneEnd = width * 0.64;
      if (x > centerZoneStart && x < centerZoneEnd) {
        x = Math.random() < 0.5 ? Math.random() * centerZoneStart : centerZoneEnd + Math.random() * (width - centerZoneEnd);
      }

      return {
        x,
        y: -20 - (Math.random() * height),
        vx: (Math.random() - 0.5) * 0.12,
        vy: 0.12 + Math.random() * 0.21,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.007,
        size: this.isCoarsePointerDevice ? 3.2 : 3.8,
        alpha: 0.12 + Math.random() * 0.1
      };
    }

    resetPetal(petal, width, height) {
      Object.assign(petal, this.makePetal(width, height));
      petal.y = -20 - (Math.random() * (height * 0.25));
    }

    initSparkles(width, height) {
      this.sparkles = Array.from({ length: this.sparkleCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.024,
        vy: (Math.random() - 0.5) * 0.03,
        r: 0.8 + Math.random() * 1.3,
        alpha: 0.06 + Math.random() * 0.09,
        pulse: Math.random() * Math.PI * 2
      }));
    }

    spawnTrailBurst(x, y) {
      const burstCount = this.isCoarsePointerDevice ? 3 : 5;
      for (let i = 0; i < burstCount; i += 1) {
        if (this.trailParticles.length >= this.trailParticleMax) {
          const reused = this.trailParticles.shift();
          reused.x = x;
          reused.y = y;
          reused.vx = (Math.random() - 0.5) * 0.86;
          reused.vy = -0.05 - (Math.random() * 0.36);
          reused.size = this.isCoarsePointerDevice ? 5.3 : 6.2;
          reused.alpha = 0.62;
          reused.life = 380;
          reused.maxLife = 380;
          reused.rot = Math.random() * Math.PI * 2;
          reused.spin = (Math.random() - 0.5) * 0.05;
          this.trailParticles.push(reused);
          continue;
        }
        this.trailParticles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 0.86,
          vy: -0.05 - (Math.random() * 0.36),
          size: this.isCoarsePointerDevice ? 5.3 : 6.2,
          alpha: 0.62,
          life: 380,
          maxLife: 380,
          rot: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.05
        });
      }
    }

    drawHeart(x, y, size, color, alpha, glow, strokeAlpha = 0.14, rotation = 0) {
      const ctx = this.ctx;
      if (!ctx) return;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.scale(size, size);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      if (glow > 0) {
        ctx.shadowColor = color;
        ctx.shadowBlur = glow;
      }

      ctx.beginPath();
      ctx.moveTo(0, -0.42);
      ctx.bezierCurveTo(0.56, -1.08, 1.74, -0.46, 0, 1.12);
      ctx.bezierCurveTo(-1.74, -0.46, -0.56, -1.08, 0, -0.42);
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = strokeAlpha;
      ctx.lineWidth = 0.08;
      ctx.strokeStyle = '#ffd4e8';
      ctx.stroke();
      ctx.restore();
    }

    clamp01(value) {
      return Math.max(0, Math.min(1, value));
    }

    easeInOutCubic(value) {
      const t = this.clamp01(value);
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    easeOutCubic(value) {
      const t = this.clamp01(value);
      return 1 - Math.pow(1 - t, 3);
    }

    easeInCubic(value) {
      const t = this.clamp01(value);
      return t * t * t;
    }

    lerp(from, to, t) {
      return from + ((to - from) * this.clamp01(t));
    }

    setParticleTransition(particle, targetX, targetY, targetAlpha, targetScale, delayNorm) {
      particle.fromX = particle.x;
      particle.fromY = particle.y;
      particle.targetX = targetX;
      particle.targetY = targetY;
      particle.fromAlpha = particle.alpha;
      particle.targetAlpha = targetAlpha;
      particle.fromScale = particle.scale;
      particle.targetScale = targetScale;
      particle.transitionDelay = this.clamp01(delayNorm);
    }

    enterState(stateName, carry = 0) {
      this.stateName = stateName;
      this.stateElapsed = carry;
      const center = this.center;

      if (!this.particles.length) return;

      if (stateName === 'idle') {
        for (let i = 0; i < this.particles.length; i += 1) {
          const p = this.particles[i];
          const angle = (Math.PI * 2 * (i / this.particles.length)) + p.noiseSeed;
          const r = Math.min(this.width, this.height) * (0.14 + ((i % 9) * 0.012));
          this.setParticleTransition(
            p,
            center.x + (Math.cos(angle) * r),
            center.y + (Math.sin(angle) * r * 0.72),
            0.54,
            0.95,
            p.radialDelay * 0.35
          );
        }
        this.centerHeartAlpha = 0;
        this.centerHeartScale = 0.96;
        return;
      }

      if (stateName === 'formingHeart') {
        for (let i = 0; i < this.particles.length; i += 1) {
          const p = this.particles[i];
          this.setParticleTransition(p, p.hx, p.hy, 0.9, 1, p.radialDelay);
        }
        this.centerHeartAlpha = 0.68;
        this.centerHeartScale = 0.96;
        return;
      }

      if (stateName === 'heartStable') {
        for (let i = 0; i < this.particles.length; i += 1) {
          const p = this.particles[i];
          this.setParticleTransition(p, p.hx, p.hy, 0.93, 1, p.radialDelay * 0.35);
        }
        this.centerHeartAlpha = 0.92;
        this.centerHeartScale = 1;
        return;
      }

      if (stateName === 'dissolving') {
        for (let i = 0; i < this.particles.length; i += 1) {
          const p = this.particles[i];
          const dx = p.hx - center.x;
          const dy = p.hy - center.y;
          const boost = 26 + (22 * p.radialDelay);
          const up = 18 + (14 * (1 - p.radialDelay));
          this.setParticleTransition(
            p,
            p.hx + ((dx === 0 && dy === 0 ? Math.cos(p.escapeSeed) : dx / (Math.hypot(dx, dy) || 1)) * boost),
            p.hy + ((dy === 0 ? Math.sin(p.escapeSeed) : dy / (Math.hypot(dx, dy) || 1)) * boost) - up,
            0.58,
            0.96,
            p.radialDelay * 0.7
          );
        }
        this.centerHeartAlpha = 0.42;
        this.centerHeartScale = 1.03;
        return;
      }

      if (stateName === 'formingText') {
        for (let i = 0; i < this.particles.length; i += 1) {
          const p = this.particles[i];
          const waveDelay = (p.letterDelay * 0.68) + (p.radialDelay * 0.25);
          this.setParticleTransition(p, p.tx, p.ty, 0.86, 1, waveDelay);
        }
        this.centerHeartAlpha = 0.18;
        this.centerHeartScale = 0.98;
        return;
      }

      if (stateName === 'textStable') {
        for (let i = 0; i < this.particles.length; i += 1) {
          const p = this.particles[i];
          this.setParticleTransition(p, p.tx, p.ty, 0.9, 1, p.letterDelay * 0.2);
        }
        this.centerHeartAlpha = 0;
        this.centerHeartScale = 0.96;
        return;
      }

      if (stateName === 'dissolvingText') {
        for (let i = 0; i < this.particles.length; i += 1) {
          const p = this.particles[i];
          const up = 22 + (14 * (1 - p.letterDelay));
          const side = (Math.cos(p.escapeSeed) * (12 + (14 * p.radialDelay)));
          this.setParticleTransition(
            p,
            p.tx + side,
            p.ty - up,
            0.56,
            0.96,
            (1 - p.letterDelay) * 0.5
          );
        }
        this.centerHeartAlpha = 0;
        this.centerHeartScale = 0.96;
      }
    }

    advanceState() {
      this.stateIndex = (this.stateIndex + 1) % this.states.length;
      const next = this.states[this.stateIndex];
      this.enterState(next.name, 0);
    }

    updateStateMachine(dt) {
      const current = this.states[this.stateIndex];
      this.stateElapsed += dt;
      this.stateProgress = this.clamp01(this.stateElapsed / current.ms);

      while (this.stateElapsed >= current.ms) {
        this.stateElapsed -= current.ms;
        this.advanceState();
      }
    }

    updateParticles(timestamp, step) {
      const center = this.center;
      const stateEase = this.easeInOutCubic(this.stateProgress);
      const slowEase = this.easeOutCubic(this.stateProgress);

      for (let i = 0; i < this.particles.length; i += 1) {
        const p = this.particles[i];
        const localProgress = this.clamp01((this.stateProgress - p.transitionDelay) / Math.max(0.08, 1 - p.transitionDelay));
        const eased = this.easeInOutCubic(localProgress);

        const desiredX = this.lerp(p.fromX, p.targetX, eased);
        const desiredY = this.lerp(p.fromY, p.targetY, eased);

        const follow = (0.045 + (0.17 * (1 - eased)) + p.speed) * step;
        p.x += (desiredX - p.x) * Math.min(0.38, follow);
        p.y += (desiredY - p.y) * Math.min(0.38, follow);

        const noise = Math.sin((timestamp * 0.0017) + p.noiseSeed + (i * 0.09));
        const noise2 = Math.cos((timestamp * 0.0013) + p.noiseSeed);
        const jitterFactor = this.stateName === 'textStable'
          ? 0.08
          : this.stateName === 'formingText'
            ? 0.16
            : this.stateName === 'dissolving'
              ? 0.42
              : 0.32;
        p.x += noise * p.noiseAmp * 0.06 * step * jitterFactor;
        p.y += noise2 * p.noiseAmp * 0.05 * step * jitterFactor;

        p.alpha = this.lerp(p.fromAlpha, p.targetAlpha, eased);
        p.scale = this.lerp(p.fromScale, p.targetScale, eased);

        if (this.stateName === 'formingText') {
          const snap = this.easeOutCubic(Math.min(1, localProgress * 1.22));
          p.x = this.lerp(p.x, desiredX, 0.1 + (0.22 * snap));
          p.y = this.lerp(p.y, desiredY, 0.1 + (0.22 * snap));
        }

        if (this.stateName === 'heartStable') {
          const pulse = 1 + (Math.sin((timestamp * 0.0032) + p.pulseSeed) * 0.03);
          p.scale *= this.lerp(1, 1.02, slowEase) * pulse;
        } else if (this.stateName === 'textStable') {
          p.y += Math.sin((timestamp * 0.0011) + p.pulseSeed) * 0.04;
          p.scale *= this.lerp(0.998, 1, stateEase);
        }

        this.drawHeart(
          p.x,
          p.y,
          p.size * p.scale,
          '#ff4da6',
          p.alpha,
          this.stateName === 'textStable' ? 6 : 8,
          0.08
        );
      }

      if (this.stateName === 'heartStable' || this.stateName === 'formingHeart' || this.stateName === 'dissolving') {
        const breath = 1 + (Math.sin(timestamp * 0.0028) * 0.05);
        const glow = 14 + (10 * breath);
        const stableFactor = this.stateName === 'heartStable' ? 1 : this.stateName === 'formingHeart' ? stateEase : (1 - stateEase);
        this.drawHeart(
          center.x,
          center.y,
          (this.isCoarsePointerDevice ? 48 : 54) * breath * (0.95 + (stableFactor * 0.05)),
          '#ff4da6',
          this.centerHeartAlpha * (0.6 + (0.4 * stableFactor)),
          glow,
          0.12,
          0
        );
      }
    }

    render(timestamp) {
      if (!this.running || !this.ctx) return;

      if (this.lastTs && ((timestamp - this.lastTs) < this.targetFrameMs)) {
        this.rafId = requestAnimationFrame(this.render);
        return;
      }

      const width = this.width;
      const height = this.height;
      const dt = this.lastTs ? Math.min(42, timestamp - this.lastTs) : this.targetFrameMs;
      const step = dt / 16.7;
      this.lastTs = timestamp;

      this.updateStateMachine(dt);

      const pointerFollow = Math.min(0.24, 0.14 * step);
      this.pointerX += (this.pointerTargetX - this.pointerX) * pointerFollow;
      this.pointerY += (this.pointerTargetY - this.pointerY) * pointerFollow;

      const ctx = this.ctx;
      const center = this.center;
      ctx.clearRect(0, 0, width, height);

      const bg = ctx.createRadialGradient(
        center.x,
        center.y,
        Math.min(width, height) * 0.04,
        center.x,
        center.y,
        Math.min(width, height) * 0.9
      );
      bg.addColorStop(0, 'rgba(33, 10, 25, 0.42)');
      bg.addColorStop(0.48, 'rgba(13, 5, 12, 0.78)');
      bg.addColorStop(1, 'rgba(4, 2, 5, 0.96)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const auraMoveX = Math.cos(timestamp * 0.00019) * (width * 0.05);
      const auraMoveY = Math.sin(timestamp * 0.00016) * (height * 0.04);
      const aura = ctx.createRadialGradient(
        center.x + auraMoveX,
        center.y + auraMoveY,
        0,
        center.x + auraMoveX,
        center.y + auraMoveY,
        Math.min(width, height) * 0.48
      );
      aura.addColorStop(0, 'rgba(255, 102, 177, 0.18)');
      aura.addColorStop(0.55, 'rgba(255, 77, 166, 0.08)');
      aura.addColorStop(1, 'rgba(255, 77, 166, 0)');
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < this.sparkles.length; i += 1) {
        const s = this.sparkles[i];
        s.x += s.vx * step;
        s.y += s.vy * step;
        if (s.x < -8) s.x = width + 8;
        if (s.x > width + 8) s.x = -8;
        if (s.y < -8) s.y = height + 8;
        if (s.y > height + 8) s.y = -8;

        const twinkle = s.alpha * (0.7 + ((Math.sin((timestamp * 0.0024) + s.pulse) + 1) * 0.5));
        ctx.save();
        ctx.globalAlpha = twinkle;
        ctx.fillStyle = 'rgba(255, 142, 198, 0.9)';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      for (let i = 0; i < this.petals.length; i += 1) {
        const p = this.petals[i];
        p.x += p.vx * step;
        p.y += p.vy * step;
        p.rot += p.spin * step;
        if (p.y > height + 20 || p.x < -20 || p.x > width + 20) {
          this.resetPetal(p, width, height);
        }
        this.drawHeart(p.x, p.y, p.size, '#ff7fbe', p.alpha, 6, 0.05, p.rot);
      }

      let trailWrite = 0;
      for (let i = 0; i < this.trailParticles.length; i += 1) {
        const tp = this.trailParticles[i];
        tp.life -= dt;
        if (tp.life <= 0) continue;
        tp.x += tp.vx * step;
        tp.y += tp.vy * step;
        tp.rot += tp.spin * step;
        this.trailParticles[trailWrite] = tp;
        trailWrite += 1;
      }
      this.trailParticles.length = trailWrite;

      let pointerWrite = 0;
      for (let i = 0; i < this.pointerHistory.length; i += 1) {
        const node = this.pointerHistory[i];
        node.life *= 0.965;
        if (node.life <= 0.06) continue;

        const ratio = (i + 1) / this.pointerHistory.length;
        const fade = Math.max(0.08, node.life) * ratio;
        const size = (this.isCoarsePointerDevice ? 6.2 : 7.1) + (ratio * 5.4);
        this.drawHeart(node.x, node.y, size, '#ff4da6', 0.24 + (fade * 0.54), 20 + (ratio * 18), 0.06);

        this.pointerHistory[pointerWrite] = node;
        pointerWrite += 1;
      }
      this.pointerHistory.length = pointerWrite;

      for (let i = 0; i < this.trailParticles.length; i += 1) {
        const tp = this.trailParticles[i];
        const alpha = Math.max(0, (tp.life / tp.maxLife) * tp.alpha);
        this.drawHeart(tp.x, tp.y, tp.size, '#ff5cac', alpha, 14, 0.06, tp.rot);
      }

      this.updateParticles(timestamp, step);

      this.rafId = requestAnimationFrame(this.render);
    }
  }

  window.FinalScreenAnimation = FinalScreenAnimation;
})();
