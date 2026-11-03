// A hand-built, iridescent torus-knot surface. No 3D library or remote assets.
export function mountSculpture(canvas, motionButton) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, preserveDrawingBuffer: true });
  const ctx = gl ? null : canvas.getContext('2d');
  if (!gl && !ctx) { canvas.hidden = true; motionButton.hidden = true; return; }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const normalise = ([x, y, z]) => { const length = Math.hypot(x, y, z) || 1; return [x / length, y / length, z / length]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const centre = t => [(2 + .52 * Math.cos(3 * t)) * Math.cos(2 * t), (2 + .52 * Math.cos(3 * t)) * Math.sin(2 * t), .88 * Math.sin(3 * t)];
  const vertices = [], faces = [], segments = 192, rings = 32;
  for (let i = 0; i < segments; i++) {
    const t = i / segments * Math.PI * 2;
    const c = centre(t), ahead = centre(t + .001);
    const tangent = normalise(ahead.map((value, axis) => value - c[axis]));
    const normal = normalise(cross(tangent, [0, 0, 1]));
    const binormal = normalise(cross(tangent, normal));
    for (let j = 0; j < rings; j++) {
      const u = j / rings * Math.PI * 2;
      const n = normal.map((value, axis) => value * Math.cos(u) + binormal[axis] * Math.sin(u));
      vertices.push({ point: c.map((value, axis) => value + n[axis] * .48), normal: n });
      faces.push([i * rings + j, ((i + 1) % segments) * rings + j, ((i + 1) % segments) * rings + (j + 1) % rings, i * rings + (j + 1) % rings]);
    }
  }
  const light = normalise([-.5, -.65, 1]);
  const half = normalise([light[0], light[1], light[2] + 1]);
  let gpu = null;
  if (gl) {
    const shader = (type, source) => {
      const result = gl.createShader(type);
      gl.shaderSource(result, source); gl.compileShader(result);
      if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error('Sculpture shader could not compile');
      return result;
    };
    const program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, `
      attribute vec3 aPosition; attribute vec3 aNormal;
      uniform mat3 uRotation; uniform vec2 uViewport; varying vec3 vNormal;
      void main() {
        vec3 p = uRotation * aPosition;
        float scale = min(uViewport.x, uViewport.y) * .145;
        float perspective = 9.0 / (9.0 - p.z);
        gl_Position = vec4(p.x * scale * perspective * 2.0 / uViewport.x,
          -p.y * scale * perspective * 2.0 / uViewport.y, -p.z / 5.0, 1.0);
        vNormal = uRotation * aNormal;
      }`));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, `
      precision mediump float; varying vec3 vNormal;
      void main() {
        vec3 n = normalize(vNormal);
        vec3 light = normalize(vec3(-.5, -.65, 1.0));
        vec3 halfVector = normalize(light + vec3(0.0, 0.0, 1.0));
        float diffuse = .42 + .58 * max(0.0, dot(n, light));
        float specular = pow(max(0.0, dot(n, halfVector)), 38.0) * .73;
        float blend = (sin(n.x * 3.0 + n.y * 2.0) + 1.0) * .5;
        vec3 cool = vec3(107.0, 96.0, 239.0) / 255.0;
        vec3 warm = vec3(250.0, 165.0, 143.0) / 255.0;
        gl_FragColor = vec4(mix(cool, warm, blend) * diffuse + vec3(specular), 1.0);
      }`));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Sculpture shader could not link');
    gl.useProgram(program);
    for (const [name, key] of [['aPosition', 'point'], ['aNormal', 'normal']]) {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.flatMap(vertex => vertex[key])), gl.STATIC_DRAW);
      const attribute = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, 3, gl.FLOAT, false, 0, 0);
    }
    const indices = new Uint16Array(faces.flatMap(([a, b, c, d]) => [a, b, c, a, c, d]));
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    gl.enable(gl.DEPTH_TEST); gl.clearColor(0, 0, 0, 0);
    gpu = { rotation: gl.getUniformLocation(program, 'uRotation'), viewport: gl.getUniformLocation(program, 'uViewport'), count: indices.length };
    canvas.dataset.renderer = 'webgl';
  } else canvas.dataset.renderer = 'canvas';
  let width = 1, height = 1, frameId = 0, lastTime = 0, phase = 0, active = true, paused = reduced.matches;
  const pointer = { x: 0, y: 0 }, target = { x: 0, y: 0 };
  function draw() {
    const yaw = phase * .12 + pointer.x * .28;
    const pitch = -.72 + pointer.y * .2;
    const roll = -.28;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cx = Math.cos(pitch), sx = Math.sin(pitch), cz = Math.cos(roll), sz = Math.sin(roll);
    function rotate([x, y, z]) {
      const a = x * cy + z * sy, b = -x * sy + z * cy;
      const c = y * cx - b * sx, d = y * sx + b * cx;
      return [a * cz - c * sz, a * sz + c * cz, d];
    }
    if (gpu) {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix3fv(gpu.rotation, false, new Float32Array([...rotate([1, 0, 0]), ...rotate([0, 1, 0]), ...rotate([0, 0, 1])]));
      gl.uniform2f(gpu.viewport, width, height);
      gl.drawElements(gl.TRIANGLES, gpu.count, gl.UNSIGNED_SHORT, 0);
      canvas.dataset.rendered = 'true';
      return;
    }
    const scale = Math.min(width, height) * .145;
    ctx.clearRect(0, 0, width, height);
    const shadow = ctx.createRadialGradient(width * .5, height * .84, 0, width * .5, height * .84, width * .33);
    shadow.addColorStop(0, '#5b35a820'); shadow.addColorStop(1, '#5b35a800');
    ctx.fillStyle = shadow; ctx.save(); ctx.translate(0, height * .63); ctx.scale(1, .25); ctx.fillRect(0, 0, width, height); ctx.restore();
    const transformed = vertices.map(vertex => {
      const p = rotate(vertex.point), n = rotate(vertex.normal), perspective = 9 / (9 - p[2]);
      return { x: width / 2 + p[0] * scale * perspective, y: height / 2 + p[1] * scale * perspective, z: p[2], n };
    });
    const sorted = faces.map(indices => ({ indices, z: indices.reduce((sum, index) => sum + transformed[index].z, 0) / 4 })).sort((a, b) => a.z - b.z);
    for (const { indices } of sorted) {
      const points = indices.map(index => transformed[index]);
      const n = normalise([0, 1, 2].map(axis => points.reduce((sum, point) => sum + point.n[axis], 0) / 4));
      const diffuse = .42 + .58 * Math.max(0, n.reduce((sum, value, axis) => sum + value * light[axis], 0));
      const specular = Math.pow(Math.max(0, n.reduce((sum, value, axis) => sum + value * half[axis], 0)), 38) * 185;
      const blend = (Math.sin(n[0] * 3 + n[1] * 2) + 1) / 2;
      const cool = [107, 96, 239], warm = [250, 165, 143];
      const rgb = cool.map((value, axis) => Math.min(255, Math.round((value + (warm[axis] - value) * blend) * diffuse + specular)));
      ctx.fillStyle = `rgb(${rgb.join(',')})`;
      ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < 4; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = .45; ctx.stroke();
    }
    canvas.dataset.rendered = 'true';
  }
  function frame(time) {
    if (time - lastTime > 48) {
      phase += Math.min((time - lastTime) / 1000, .08);
      pointer.x += (target.x - pointer.x) * .06;
      pointer.y += (target.y - pointer.y) * .06;
      draw(); lastTime = time;
    }
    if (active && !paused && !document.hidden) frameId = requestAnimationFrame(frame);
  }
  function schedule() {
    cancelAnimationFrame(frameId);
    lastTime = performance.now();
    if (active && !paused && !document.hidden) frameId = requestAnimationFrame(frame);
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
    else ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }
  motionButton.addEventListener('click', () => {
    paused = !paused;
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.querySelector('span').textContent = paused ? 'Motion off' : 'Motion on';
    schedule();
  });
  const updatePreference = () => {
    paused = reduced.matches;
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.querySelector('span').textContent = paused ? 'Motion off' : 'Motion on';
    schedule();
  };
  canvas.closest('.art-hero').addEventListener('pointermove', event => {
    if (reduced.matches) return;
    const rect = canvas.getBoundingClientRect();
    target.x = (event.clientX - rect.left) / rect.width - .5;
    target.y = (event.clientY - rect.top) / rect.height - .5;
  });
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => { active = entry.isIntersecting; schedule(); }, { threshold: .05 }).observe(canvas);
  document.addEventListener('visibilitychange', schedule);
  reduced.addEventListener('change', updatePreference);
  updatePreference(); resize();
}
