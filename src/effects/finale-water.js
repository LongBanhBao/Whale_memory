import { isCompactRuntime, renderPixelRatio } from './runtime-profile.js';

const vertexSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * .5 + .5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// The reference supplies the water's fine surface detail. Advecting its UVs
// through travelling waves changes the silhouette, folds and foam separately;
// no transform rotates the canvas or its containing element.
const fragmentSource = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif
  varying vec2 v_uv;
  uniform sampler2D u_water;
  uniform float u_time;

  void main() {
    vec2 p = (v_uv - .5) * 1.08;
    float radius = length(p);
    if (radius > .55) { gl_FragColor = vec4(0.0); return; }
    float angle = atan(p.y, p.x);
    float t = u_time;
    float band = smoothstep(.18, .31, radius);

    // Large swells bend the rim; smaller waves run along each water ribbon.
    // Integer angular frequencies keep the atan seam continuous.
    float swell = .020 * sin(3.0 * angle - t * 1.12)
                + .010 * sin(5.0 * angle + t * .73 + radius * 15.0);
    float ripple = .0045 * sin(11.0 * angle - t * 2.1 + radius * 36.0);
    float r = radius - (swell + ripple) * band;
    float shear = .19 * sin(radius * 16.0 - t * .62)
                + .075 * sin(4.0 * angle - t * 1.3 + radius * 12.0);
    float flow = angle + t * .29 + shear * band;
    vec2 uv = .5 + vec2(cos(flow), sin(flow)) * r;
    vec4 water = texture2D(u_water, clamp(uv, .001, .999));

    // A second, faster surface flow refracts the highlights without winding
    // the source into ever tighter rings during a long visit to the finale.
    float fine = .006 * sin(8.0 * angle + radius * 65.0 - t * 2.8) * band;
    vec2 refracted = .5 + vec2(cos(flow + fine), sin(flow + fine)) * (r + fine * .35);
    vec4 detail = texture2D(u_water, clamp(refracted, .001, .999));
    water = mix(water, detail, .32 * band);

    float surface = radius * 138.0 + 3.0 * angle - t * 2.3
                  + 1.7 * sin(4.0 * angle - t * 1.12 + radius * 18.0);
    float crest = pow(max(0.0, sin(surface)), 18.0);
    float current = .5 + .5 * sin(5.0 * angle + radius * 24.0 + t * .9);
    float rim = smoothstep(.25, .32, radius) * (1.0 - smoothstep(.46, .52, radius));
    float light = .97 + .13 * sin(3.0 * angle + radius * 30.0 - t * 1.25) * band;
    float foam = smoothstep(.52, .94, max(water.r, water.g));
    vec3 color = water.rgb * light;
    color += vec3(.25, .65, .85) * crest * current * rim * .22;
    color += vec3(.14, .23, .26) * foam * current * rim;
    float alpha = water.a * (1.0 - smoothstep(.51, .55, radius));
    gl_FragColor = vec4(color * alpha, alpha);
  }
`;

export function createFinaleWater(host, textureUrl, reducedMotion = false) {
  const canvas = host.querySelector('canvas');
  const compact = isCompactRuntime();
  let gl;
  let program;
  let buffer;
  let texture;
  let timeUniform;
  let image;
  let prepared = false;
  let ready = false;
  let active = false;
  let lost = false;
  let destroyed = false;
  let frame = 0;
  let previous = 0;
  let elapsed = 0;
  let frameCount = 0;

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    canvas.dataset.running = 'false';
  }

  function disposeResources() {
    if (!gl || lost) return;
    if (texture) gl.deleteTexture(texture);
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    texture = buffer = program = null;
  }

  function fallback() {
    stop();
    ready = false;
    host.classList.remove('has-flowing-water');
    canvas.dataset.renderer = 'fallback';
    disposeResources();
  }

  function resize() {
    if (!gl || lost) return;
    // Measure the untransformed box: the opening animation scales its parent.
    // A capped backing store keeps the mobile GPU workload bounded at 60 Hz.
    const size = Math.max(1, Math.min(compact ? 640 : 1000,
      Math.round(host.clientWidth * renderPixelRatio(1.15, 1.25))));
    if (canvas.width !== size) canvas.width = canvas.height = size;
    gl.viewport(0, 0, size, size);
  }

  function paint() {
    gl.useProgram(program);
    gl.uniform1f(timeUniform, elapsed);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    // Coarse diagnostics avoid DOM writes on every animation frame.
    frameCount += 1;
    if (frameCount % 30 === 1) canvas.dataset.flowTime = elapsed.toFixed(3);
  }

  function draw(now) {
    frame = 0;
    if (!ready || !active || document.hidden || lost || destroyed) return;
    if (previous && !reducedMotion) elapsed += Math.min((now - previous) / 1000, .05);
    previous = now;
    paint();
    if (!reducedMotion) frame = requestAnimationFrame(draw);
    if (!reducedMotion && canvas.dataset.running !== 'true') canvas.dataset.running = 'true';
  }

  function schedule() {
    if (ready && active && !document.hidden && !frame && !destroyed) {
      frame = requestAnimationFrame(draw);
    }
  }

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function initialize() {
    if (destroyed || lost) return;
    gl ||= canvas.getContext('webgl', {
      alpha: true, antialias: false, depth: false, stencil: false,
      premultipliedAlpha: true, powerPreference: compact ? 'low-power' : 'default',
    });
    if (!gl) { fallback(); return; }
    const vertex = compile(gl.VERTEX_SHADER, vertexSource);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertex || !fragment) {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
      fallback();
      return;
    }
    program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { fallback(); return; }
    gl.useProgram(program);
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    timeUniform = gl.getUniformLocation(program, 'u_time');
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    } catch {
      fallback();
      return;
    }
    if (gl.getError() !== gl.NO_ERROR) { fallback(); return; }
    gl.uniform1i(gl.getUniformLocation(program, 'u_water'), 0);
    resize();
    ready = true;
    paint();
    host.classList.add('has-flowing-water');
    canvas.dataset.renderer = 'webgl';
    schedule();
  }

  function visibilityChanged() {
    if (document.hidden) stop();
    else schedule();
  }
  function contextLost(event) {
    event.preventDefault();
    lost = true;
    fallback();
  }
  function contextRestored() {
    lost = false;
    texture = buffer = program = null;
    initialize();
  }
  const observer = new ResizeObserver(() => {
    resize();
    if (ready && active && !document.hidden) { paint(); schedule(); }
  });
  observer.observe(host);
  document.addEventListener('visibilitychange', visibilityChanged);
  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.addEventListener('webglcontextrestored', contextRestored);
  canvas.dataset.running = 'false';

  return {
    prepare() {
      if (prepared || destroyed) return;
      prepared = true;
      image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = initialize;
      image.onerror = fallback;
      image.src = textureUrl;
    },
    setActive(value) {
      if (active === value) return;
      active = value;
      host.classList.toggle('is-water-active', value);
      if (active) schedule();
      else stop();
    },
    reset() {
      active = false;
      stop();
      elapsed = 0;
      frameCount = 0;
      canvas.dataset.flowTime = '0';
      host.classList.remove('is-water-active');
    },
    destroy() {
      destroyed = true;
      active = false;
      stop();
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibilityChanged);
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', contextRestored);
      if (image) image.onload = image.onerror = null;
      disposeResources();
    },
  };
}
