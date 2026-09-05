// Continuous swimming on a deformable mesh, independent of scene 2's sprite loop.
// UV coordinates refer to the original frame; its transparent top margin is
// compensated in the vertex shader so the whale's body starts at the portal.
export function createIntroWhale(canvas, image, reducedMotion = false) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true });
  if (!gl) return { setDepth() {}, setActive() {}, reset() {} };

  const vertexSource = `
    precision mediump float;
    attribute vec2 a_uv;
    varying vec2 v_uv;
    varying float v_bend;
    uniform float u_phase;
    uniform float u_strength;
    uniform float u_depth;
    void main() {
      v_uv = a_uv;
      float tail = 1.0 - smoothstep(0.18, 0.76, a_uv.x);
      float stroke = sin(u_phase - (0.76 - a_uv.x) * 4.1);
      vec2 p = (a_uv - vec2(0.50, 0.748)) * vec2(1.68, 2.42);
      // The shoulder stays stable; the wave grows toward the tailstock.
      float bend = stroke * pow(tail, 1.65) * 0.19 * u_strength;
      p.y += bend;
      // Flukes fold slightly during the power stroke, then open on recovery.
      p.x += sin(u_phase - 1.6) * pow(tail, 3.0) * 0.026 * u_strength;
      p.y += (a_uv.y - 0.755) * pow(tail, 3.0) * sin(u_phase - 1.2) * 0.28 * u_strength;
      // A delayed, smaller pectoral-fin stroke steers the body.
      float fin = exp(-pow((a_uv.x - 0.57) / 0.15, 2.0)) * smoothstep(0.795, 0.935, a_uv.y);
      p.y += sin(u_phase - 0.9) * fin * 0.052 * u_strength;
      p.x += cos(u_phase - 0.9) * fin * 0.018 * u_strength;
      p.y += sin(u_phase) * 0.006 * u_strength;
      // Foreshortening eases away as the animal turns broadside toward us.
      p.x *= mix(0.78, 1.0, smoothstep(0.0, 0.8, u_depth));
      v_bend = bend;
      gl_Position = vec4(p.x, -p.y, 0.0, 1.0);
    }
  `;
  const fragmentSource = `
    precision mediump float;
    varying vec2 v_uv;
    varying float v_bend;
    uniform sampler2D u_texture;
    uniform float u_phase;
    uniform float u_depth;
    void main() {
      vec4 color = texture2D(u_texture, v_uv);
      float caustic = sin(v_uv.x * 13.0 + v_uv.y * 8.0 - u_phase * 0.4);
      float light = 1.0 + caustic * 0.025 + v_bend * 0.12;
      color.rgb *= light;
      color.rgb = mix(color.rgb, vec3(0.81, 0.95, 1.0), (1.0 - u_depth) * 0.16);
      gl_FragColor = vec4(color.rgb * color.a, color.a);
    }
  `;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('Whale mesh shader:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertex = compile(gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) return { setDepth() {}, setActive() {}, reset() {} };
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('Whale mesh program:', gl.getProgramInfoLog(program));
    return { setDepth() {}, setActive() {}, reset() {} };
  }
  gl.useProgram(program);

  const points = [];
  const columns = 56;
  const rows = 26;
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const left = x / columns;
      const right = (x + 1) / columns;
      const top = 0.45 + (y / rows) * 0.55;
      const bottom = 0.45 + ((y + 1) / rows) * 0.55;
      points.push(left, top, right, top, left, bottom, left, bottom, right, top, right, bottom);
    }
  }
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
  const attribute = gl.getAttribLocation(program, 'a_uv');
  gl.enableVertexAttribArray(attribute);
  gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
  const uniforms = Object.fromEntries(['phase', 'strength', 'depth'].map((key) => [key, gl.getUniformLocation(program, `u_${key}`)]));
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  let depth = 0;
  let phase = 0;
  let active = false;
  let ready = false;
  let frame = 0;
  let previousTime = 0;

  function draw(time) {
    frame = 0;
    if (!active || !ready || document.hidden) return;
    const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0;
    previousTime = time;
    if (!reducedMotion) phase += delta * (3.9 - depth * 1.35);
    const ratio = Math.min(devicePixelRatio || 1, 1.75);
    const width = Math.round(Math.min(innerWidth < 720 ? innerWidth * 0.96 : innerWidth * 0.62, 900) * ratio);
    const height = Math.round(width * 0.59);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uniforms.phase, phase);
    gl.uniform1f(uniforms.strength, reducedMotion ? 0 : 1.0 - depth * 0.48);
    gl.uniform1f(uniforms.depth, depth);
    gl.drawArrays(gl.TRIANGLES, 0, points.length / 2);
    if (!reducedMotion) frame = requestAnimationFrame(draw);
  }

  function schedule() {
    if (active && ready && !frame && !document.hidden) frame = requestAnimationFrame(draw);
  }

  function upload() {
    if (!image.naturalWidth) return;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    ready = true;
    canvas.parentElement.classList.add('has-swim-mesh');
    schedule();
  }
  image.addEventListener('load', upload);
  if (image.complete && image.naturalWidth) upload();
  document.addEventListener('visibilitychange', () => {
    previousTime = 0;
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else schedule();
  });
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    ready = false;
    cancelAnimationFrame(frame);
    frame = 0;
    canvas.parentElement.classList.remove('has-swim-mesh');
  });

  return {
    setDepth(value) {
      depth = value;
      schedule();
    },
    setActive(value) {
      if (active === value) return;
      active = value;
      previousTime = 0;
      if (!active) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else schedule();
    },
    reset() {
      depth = 0;
      phase = 0;
      previousTime = 0;
    },
  };
}
