import { isCompactRuntime, renderPixelRatio } from './runtime-profile.js';

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (from, to, amount) => from + (to - from) * amount;
const WHALE_ANCHOR_Y = .742;

const POSE_DEFAULTS = Object.freeze({
  x: .21,
  y: .76,
  scale: .48,
  rotation: -25,
  opacity: 0,
  glow: .08,
  brightness: .56,
  effort: .72,
  wake: .18,
  sadness: 1,
  hope: 0,
  impact: 0,
  bend: 0,
  bank: 0,
});

const POSE_KEYS = Object.keys(POSE_DEFAULTS);

function emotionalPose(pose) {
  const normalized = {};
  for (const key of POSE_KEYS) {
    if (Number.isFinite(pose[key])) normalized[key] = pose[key];
  }

  // Existing storm frames already expose brightness and glow. These fallbacks
  // keep the expression useful before the timeline starts passing the more
  // explicit sadness/family values described below.
  if (!Number.isFinite(pose.sadness) && !Number.isFinite(pose.struggle)) {
    if (Number.isFinite(pose.family)) normalized.sadness = 1 - clamp(pose.family);
    else if (Number.isFinite(pose.brightness)) {
      normalized.sadness = 1 - clamp((pose.brightness - .56) / .68);
    }
  } else if (Number.isFinite(pose.struggle)) {
    normalized.sadness = clamp(pose.struggle);
  }

  if (!Number.isFinite(pose.hope)) {
    if (Number.isFinite(pose.family)) normalized.hope = clamp(pose.family);
    else if (Number.isFinite(pose.glow)) normalized.hope = clamp((pose.glow - .08) / .76);
  }

  return normalized;
}

function makeController(target, current, reducedMotion, schedule) {
  const assign = (destination, pose) => {
    Object.assign(destination, emotionalPose(pose));
    destination.opacity = clamp(destination.opacity);
    destination.glow = clamp(destination.glow);
    destination.brightness = Math.max(0, destination.brightness);
    destination.effort = clamp(destination.effort);
    destination.wake = clamp(destination.wake);
    destination.sadness = clamp(destination.sadness);
    destination.hope = clamp(destination.hope);
    destination.impact = clamp(destination.impact);
  };

  return {
    setPose(pose) {
      assign(target, pose);
      if (reducedMotion) Object.assign(current, target);
      schedule();
    },
    snapPose(pose) {
      assign(target, pose);
      Object.assign(current, target);
      schedule();
    },
  };
}

function createCanvasFallback(canvas, manifest, stillUrl, reducedMotion) {
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) {
    canvas.classList.add('is-unavailable');
    return { setPose() {}, snapPose() {}, destroy() {} };
  }
  const compactRuntime = isCompactRuntime();
  const minimumFrameTime = compactRuntime && !reducedMotion ? 1000 / 45 : 0;
  const image = new Image();
  const target = { ...POSE_DEFAULTS };
  const current = { ...target };
  const sourceWidth = manifest?.frameWidth || 754;
  const sourceHeight = manifest?.frameHeight || 640;
  let width = 0;
  let height = 0;
  let ratio = 1;
  let ready = false;
  let destroyed = false;
  let frameHandle = 0;
  let previousTime = 0;
  let previousDrawTime = 0;
  let resizeTimer = 0;

  function resize() {
    ratio = renderPixelRatio(2, 1.2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.dataset.pixelRatio = ratio.toFixed(2);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function scheduleResize() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 120);
  }

  function drawExpression(drawWidth, drawHeight, time) {
    const sadness = current.sadness * (1 - current.hope * .82);
    if (sadness < .025) return;
    const sx = value => (value / sourceWidth - .5) * drawWidth;
    const sy = value => (value / sourceHeight - WHALE_ANCHOR_Y) * drawHeight;
    const strain = clamp(sadness * (.45 + current.effort * .55) + current.impact * .35);

    context.save();
    context.globalAlpha = current.opacity * strain * .78;
    context.strokeStyle = 'rgba(3, 30, 51, .94)';
    context.lineWidth = Math.max(1.2, drawWidth * .0044);
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(sx(555), sy(431));
    context.quadraticCurveTo(sx(590), sy(425), sx(625), sy(406));
    context.stroke();

    if (!reducedMotion) {
      const tearPulse = .55 + Math.sin(time * .0021) * .2;
      context.globalAlpha *= tearPulse;
      context.strokeStyle = 'rgba(132, 235, 255, .88)';
      context.fillStyle = 'rgba(180, 246, 255, .72)';
      context.lineWidth = Math.max(1, drawWidth * .0025);
      context.beginPath();
      context.moveTo(sx(607), sy(477));
      context.quadraticCurveTo(sx(613), sy(493), sx(610), sy(509));
      context.stroke();
      context.beginPath();
      context.ellipse(sx(610), sy(512), Math.max(1, drawWidth * .003), Math.max(1.5, drawWidth * .005), 0, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  function render(time = performance.now()) {
    frameHandle = 0;
    if (destroyed || document.hidden) return;
    if (minimumFrameTime && previousDrawTime && time - previousDrawTime < minimumFrameTime) {
      schedule();
      return;
    }
    previousDrawTime = time;
    const delta = previousTime ? Math.min((time - previousTime) / 1000, .05) : 0;
    previousTime = time;
    if (!reducedMotion) {
      const poseEase = 1 - Math.exp(-delta * 10.5);
      const impactEase = 1 - Math.exp(-delta * 25);
      for (const key of POSE_KEYS) {
        current[key] = lerp(current[key], target[key], key === 'impact' ? impactEase : poseEase);
      }
    }

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    if (ready && current.opacity > .002) {
      const baseWidth = Math.min(width * (width < 760 ? .82 : .52), 760);
      const drawWidth = baseWidth * current.scale;
      const drawHeight = drawWidth * (sourceHeight / sourceWidth);
      const sadness = current.sadness * (1 - current.hope * .82);
      const bob = reducedMotion ? 0 : Math.sin(time * .00135) * Math.min(5, height * .006);
      const heave = reducedMotion ? 0 : Math.sin(time * .0032) * current.effort * drawHeight * .004;
      const impactX = reducedMotion ? 0 : Math.sin(time * .051) * current.impact * 4;
      const impactY = reducedMotion ? 0 : Math.cos(time * .043) * current.impact * 3;
      const idleRoll = reducedMotion ? 0 : Math.sin(time * .00105) * (.3 + current.hope * .45);

      context.save();
      context.globalAlpha = current.opacity;
      context.translate(current.x * width + impactX, current.y * height + bob + heave + impactY);
      context.rotate(((current.rotation + current.bank + idleRoll + sadness * 1.2) * Math.PI) / 180);
      context.filter = `brightness(${current.brightness}) saturate(${.78 + current.hope * .2}) drop-shadow(0 0 ${8 + current.glow * 25}px rgba(72, 220, 239, ${.18 + current.glow * .28}))`;
      context.drawImage(
        image,
        -drawWidth / 2,
        -drawHeight * WHALE_ANCHOR_Y,
        drawWidth,
        drawHeight,
      );
      context.filter = 'none';
      drawExpression(drawWidth, drawHeight, time);
      context.restore();
    }

    if (!reducedMotion && (current.opacity > .002 || target.opacity > .002)) schedule();
  }

  function schedule() {
    if (!destroyed && !frameHandle && !document.hidden) frameHandle = requestAnimationFrame(render);
  }

  function onLoad() {
    ready = true;
    canvas.classList.remove('is-unavailable');
    schedule();
  }

  function onError() {
    canvas.classList.add('is-unavailable');
    window.__blueVoyageEmergencyUnlock?.();
  }

  function onVisibilityChange() {
    previousTime = 0;
    previousDrawTime = 0;
    if (document.hidden) {
      cancelAnimationFrame(frameHandle);
      frameHandle = 0;
    } else schedule();
  }

  resize();
  window.addEventListener('resize', scheduleResize, { passive: true });
  document.addEventListener('visibilitychange', onVisibilityChange);
  image.addEventListener('load', onLoad, { once: true });
  image.addEventListener('error', onError, { once: true });
  image.decoding = 'async';
  image.src = stillUrl;

  const controller = makeController(target, current, reducedMotion, schedule);
  return {
    ...controller,
    destroy() {
      destroyed = true;
      cancelAnimationFrame(frameHandle);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', scheduleResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      image.removeEventListener('load', onLoad);
      image.removeEventListener('error', onError);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
    },
  };
}

export function createStormWhale(canvas, manifest, stillUrl, reducedMotion = false) {
  const compactRuntime = isCompactRuntime();
  const minimumFrameTime = compactRuntime && !reducedMotion ? 1000 / 45 : 0;
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: !compactRuntime,
    depth: false,
    powerPreference: compactRuntime ? 'low-power' : 'default',
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
  });
  if (!gl) return createCanvasFallback(canvas, manifest, stillUrl, reducedMotion);

  const vertexSource = `
    precision mediump float;
    attribute vec2 a_uv;
    varying vec2 v_uv;
    varying float v_bend;
    uniform vec2 u_viewport;
    uniform vec2 u_position;
    uniform float u_draw_width;
    uniform float u_aspect;
    uniform float u_rotation;
    uniform float u_phase;
    uniform float u_effort;
    uniform float u_sadness;
    uniform float u_hope;
    uniform float u_impact;
    uniform float u_pose_bend;

    void main() {
      v_uv = a_uv;
      vec2 local = a_uv - vec2(.5, ${WHALE_ANCHOR_Y});
      float tail = 1.0 - smoothstep(.16, .72, a_uv.x);
      float body = sin(a_uv.x * 3.14159265);
      float power = .52 + u_effort * .56 + u_hope * .16;
      float stroke = sin(u_phase - (1.0 - a_uv.x) * 4.25);
      float bend = stroke * pow(tail, 1.62) * .055 * power;

      // A travelling wave joins the shoulder to the tail. During the early
      // struggle it is intentionally uneven; Family restores a cleaner beat.
      float fatigue = sin(u_phase * .47 + 1.2) * u_sadness * .22;
      local.y += bend;
      local.y += u_pose_bend * pow(tail, 1.48) * (.68 + body * .32);
      local.y += sin(u_phase - (1.0 - a_uv.x) * 3.45 + fatigue) * body * .0105 * u_effort;

      // The flukes fold on the power stroke and open on recovery.
      local.x += sin(u_phase - 1.55) * pow(tail, 2.8) * .010 * power;
      local.y += (a_uv.y - .755) * pow(tail, 3.0) * sin(u_phase - 1.1) * .17 * power;

      // A delayed pectoral-fin beat: small and heavy while exhausted, wider
      // after the surrounding pod arrives.
      float fin = exp(-pow((a_uv.x - .57) / .145, 2.0)) * smoothstep(.78, .94, a_uv.y);
      local.y += sin(u_phase - .95) * fin * (.014 + u_effort * .018 + u_hope * .016);
      local.x += cos(u_phase - .95) * fin * .006 * power;

      // Sadness is carried by posture as well as the face: the forehead and
      // nose sink a little, while impact sends a short shiver through the body.
      float head = smoothstep(.61, .94, a_uv.x) * smoothstep(.45, .74, a_uv.y);
      local.y += head * u_sadness * .013;
      local.y += sin(u_phase * 5.3 + a_uv.x * 17.0) * body * u_impact * .005;
      local.y += sin(u_phase * .72) * .0025 * power;

      float radians = radians(u_rotation);
      float cosine = cos(radians);
      float sine = sin(radians);
      vec2 pixels = local * vec2(u_draw_width, u_draw_width * u_aspect);
      pixels = vec2(
        pixels.x * cosine - pixels.y * sine,
        pixels.x * sine + pixels.y * cosine
      );
      vec2 ndc = vec2(
        u_position.x * 2.0 - 1.0 + pixels.x * 2.0 / u_viewport.x,
        1.0 - u_position.y * 2.0 - pixels.y * 2.0 / u_viewport.y
      );
      v_bend = bend;
      gl_Position = vec4(ndc, 0.0, 1.0);
    }
  `;

  const fragmentSource = `
    precision mediump float;
    varying vec2 v_uv;
    varying float v_bend;
    uniform sampler2D u_texture;
    uniform float u_phase;
    uniform float u_opacity;
    uniform float u_brightness;
    uniform float u_glow;
    uniform float u_effort;
    uniform float u_sadness;
    uniform float u_hope;
    uniform float u_impact;

    float segmentDistance(vec2 point, vec2 start, vec2 end) {
      vec2 offset = point - start;
      vec2 line = end - start;
      float amount = clamp(dot(offset, line) / dot(line, line), 0.0, 1.0);
      return length(offset - line * amount);
    }

    void main() {
      vec4 textureColor = texture2D(u_texture, v_uv);
      float alpha = textureColor.a;

      // A compact four-direction alpha halo replaces CSS drop-shadow and keeps
      // the full-screen canvas inexpensive to composite.
      float nearAlpha = max(
        max(texture2D(u_texture, v_uv + vec2(.009, 0.0)).a, texture2D(u_texture, v_uv - vec2(.009, 0.0)).a),
        max(texture2D(u_texture, v_uv + vec2(0.0, .009)).a, texture2D(u_texture, v_uv - vec2(0.0, .009)).a)
      );
      float aura = max(0.0, nearAlpha - alpha) * (.12 + u_glow * .38);

      vec3 color = textureColor.rgb;
      float caustic = sin(v_uv.x * 15.0 + v_uv.y * 9.0 - u_phase * .42);
      color *= u_brightness * (1.0 + caustic * (.014 + u_hope * .012) + v_bend * .1);
      color = mix(color, vec3(.28, .43, .58), u_sadness * .085);
      color = mix(color, vec3(.72, .98, 1.0), u_hope * .055);

      // The downturned brow and half-lidded eye are procedural marks anchored
      // to the static texture, so they deform with the head without new art.
      float browA = segmentDistance(v_uv, vec2(.735, .674), vec2(.785, .661));
      float browB = segmentDistance(v_uv, vec2(.785, .661), vec2(.832, .632));
      float brow = 1.0 - smoothstep(.003, .0067, min(browA, browB));
      float lidDistance = segmentDistance(v_uv, vec2(.758, .698), vec2(.818, .689));
      float lid = 1.0 - smoothstep(.0025, .006, lidDistance);
      float expression = u_sadness * (.58 + u_effort * .42);
      color = mix(color, vec3(.015, .09, .15), max(brow, lid * .42) * expression * alpha * .6);

      // One restrained tear appears only through the lonely struggle, then
      // dissolves as hope arrives.
      float tearLine = 1.0 - smoothstep(.0025, .006, segmentDistance(v_uv, vec2(.804, .733), vec2(.810, .766)));
      float tearDrop = 1.0 - smoothstep(.0045, .0095, length(v_uv - vec2(.811, .775)));
      float tearPulse = .68 + sin(u_phase * .54) * .16;
      float tear = max(tearLine, tearDrop) * u_sadness * (1.0 - u_hope) * tearPulse;
      color = mix(color, vec3(.58, .95, 1.0), tear * alpha * .62);

      float impactGlint = u_impact * (1.0 - smoothstep(.0, .34, abs(v_uv.x - .66))) * .13;
      color += vec3(.67, .86, 1.0) * impactGlint * alpha;
      float finalAlpha = clamp(alpha + aura, 0.0, 1.0) * u_opacity;
      vec3 finalColor = mix(vec3(.18, .86, .95), color, alpha / max(alpha + aura, .001));
      gl_FragColor = vec4(finalColor * finalAlpha, finalAlpha);
    }
  `;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('Storm whale shader:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertex = compile(gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) {
    canvas.classList.add('is-unavailable');
    window.__blueVoyageEmergencyUnlock?.();
    return { setPose() {}, snapPose() {}, destroy() {} };
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('Storm whale program:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    canvas.classList.add('is-unavailable');
    window.__blueVoyageEmergencyUnlock?.();
    return { setPose() {}, snapPose() {}, destroy() {} };
  }

  const columns = 58;
  const rows = 36;
  const points = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const left = column / columns;
      const right = (column + 1) / columns;
      const top = row / rows;
      const bottom = (row + 1) / rows;
      points.push(left, top, right, top, left, bottom, left, bottom, right, top, right, bottom);
    }
  }

  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
  const uvAttribute = gl.getAttribLocation(program, 'a_uv');
  gl.enableVertexAttribArray(uvAttribute);
  gl.vertexAttribPointer(uvAttribute, 2, gl.FLOAT, false, 0, 0);

  const uniformNames = [
    'viewport', 'position', 'draw_width', 'aspect', 'rotation', 'phase',
    'opacity', 'brightness', 'glow', 'effort', 'sadness', 'hope', 'impact',
    'pose_bend',
  ];
  const uniforms = Object.fromEntries(uniformNames.map(name => (
    [name, gl.getUniformLocation(program, `u_${name}`)]
  )));
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(gl.getUniformLocation(program, 'u_texture'), 0);
  gl.clearColor(0, 0, 0, 0);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);

  const image = new Image();
  const target = { ...POSE_DEFAULTS };
  const current = { ...target };
  const aspect = (manifest?.frameHeight || 640) / (manifest?.frameWidth || 754);
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let phase = 0;
  let ready = false;
  let destroyed = false;
  let contextLost = false;
  let frameHandle = 0;
  let previousTime = 0;
  let previousDrawTime = 0;
  let resizeTimer = 0;

  function resize() {
    pixelRatio = renderPixelRatio(2, 1.2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.dataset.pixelRatio = pixelRatio.toFixed(2);
    gl.viewport(0, 0, canvas.width, canvas.height);
    schedule();
  }

  function scheduleResize() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 120);
  }

  function render(time = performance.now()) {
    frameHandle = 0;
    if (destroyed || contextLost || document.hidden) return;
    if (minimumFrameTime && previousDrawTime && time - previousDrawTime < minimumFrameTime) {
      schedule();
      return;
    }
    previousDrawTime = time;
    const delta = previousTime ? Math.min((time - previousTime) / 1000, .05) : 0;
    previousTime = time;

    if (!reducedMotion) {
      const poseEase = 1 - Math.exp(-delta * 10.5);
      const impactEase = 1 - Math.exp(-delta * 25);
      for (const key of POSE_KEYS) {
        current[key] = lerp(current[key], target[key], key === 'impact' ? impactEase : poseEase);
      }
      phase += delta * (2.35 + current.effort * 2.15 + current.hope * .75 + current.wake * .35);
    }

    gl.clear(gl.COLOR_BUFFER_BIT);
    if (ready && current.opacity > .002) {
      const baseWidth = Math.min(width * (width < 760 ? .82 : .52), 760);
      const bob = reducedMotion ? 0 : Math.sin(time * .00135) * Math.min(5, height * .006);
      const heave = reducedMotion ? 0 : Math.sin(time * .0032) * current.effort * 2.4;
      const impactX = reducedMotion ? 0 : Math.sin(time * .051) * current.impact * 4;
      const impactY = reducedMotion ? 0 : Math.cos(time * .043) * current.impact * 3;
      const idleRoll = reducedMotion ? 0 : Math.sin(time * .00105) * (.3 + current.hope * .45);
      const sadness = current.sadness * (1 - current.hope * .82);

      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform2f(uniforms.viewport, width, height);
      gl.uniform2f(
        uniforms.position,
        current.x + impactX / Math.max(1, width),
        current.y + (bob + heave + impactY) / Math.max(1, height),
      );
      gl.uniform1f(uniforms.draw_width, baseWidth * current.scale);
      gl.uniform1f(uniforms.aspect, aspect);
      gl.uniform1f(uniforms.rotation, current.rotation + current.bank + idleRoll + sadness * 1.2);
      gl.uniform1f(uniforms.phase, phase);
      gl.uniform1f(uniforms.opacity, current.opacity);
      gl.uniform1f(uniforms.brightness, current.brightness);
      gl.uniform1f(uniforms.glow, current.glow);
      gl.uniform1f(uniforms.effort, reducedMotion ? 0 : current.effort);
      gl.uniform1f(uniforms.sadness, sadness);
      gl.uniform1f(uniforms.hope, current.hope);
      gl.uniform1f(uniforms.impact, reducedMotion ? 0 : current.impact);
      gl.uniform1f(uniforms.pose_bend, reducedMotion ? 0 : current.bend);
      gl.drawArrays(gl.TRIANGLES, 0, points.length / 2);
    }

    if (!reducedMotion && (current.opacity > .002 || target.opacity > .002)) schedule();
  }

  function schedule() {
    if (!destroyed && !contextLost && !frameHandle && !document.hidden) {
      frameHandle = requestAnimationFrame(render);
    }
  }

  function upload() {
    if (!image.naturalWidth || contextLost) return;
    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    ready = true;
    canvas.classList.remove('is-unavailable');
    schedule();
  }

  function onImageError() {
    canvas.classList.add('is-unavailable');
    window.__blueVoyageEmergencyUnlock?.();
  }

  function onVisibilityChange() {
    previousTime = 0;
    previousDrawTime = 0;
    if (document.hidden) {
      cancelAnimationFrame(frameHandle);
      frameHandle = 0;
    } else schedule();
  }

  function onContextLost(event) {
    event.preventDefault();
    contextLost = true;
    ready = false;
    cancelAnimationFrame(frameHandle);
    frameHandle = 0;
    canvas.classList.add('is-unavailable');
  }

  resize();
  window.addEventListener('resize', scheduleResize, { passive: true });
  document.addEventListener('visibilitychange', onVisibilityChange);
  canvas.addEventListener('webglcontextlost', onContextLost);
  image.addEventListener('load', upload, { once: true });
  image.addEventListener('error', onImageError, { once: true });
  image.decoding = 'async';
  image.src = stillUrl;
  if (image.complete && image.naturalWidth) upload();

  const controller = makeController(target, current, reducedMotion, schedule);
  return {
    ...controller,
    destroy() {
      destroyed = true;
      cancelAnimationFrame(frameHandle);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', scheduleResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      image.removeEventListener('load', upload);
      image.removeEventListener('error', onImageError);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
  };
}
