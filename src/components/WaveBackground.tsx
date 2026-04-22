import { useEffect, useRef } from "react";

/**
 * Spacetime-warped grid background.
 * Horizontal AND vertical lines bend / flow like fabric being stretched
 * by gravity wells. Pure WebGL fragment shader, GPU-rendered.
 */
export function WaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: true, alpha: true });
    if (!gl) return;

    const vert = `
      attribute vec2 a_pos;
      void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
    `;

    // Warped grid: sample a uniform grid through a domain-warped coordinate
    // so the originally straight horizontal + vertical lines visibly bend
    // and flow — like spacetime curvature / fabric being pulled.
    const frag = `
      precision highp float;
      uniform vec2  u_res;
      uniform float u_time;

      mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

      float hash(vec2 p){
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }
      float fbm(vec2 p){
        float v = 0.0; float a = 0.5;
        for(int i = 0; i < 5; i++){
          v += a * noise(p);
          p = rot(0.6) * p * 2.02;
          a *= 0.5;
        }
        return v;
      }

      // Distance to nearest line of a grid with given cell size, in screen-space pixels.
      // We use fwidth-style line thickness so lines stay 1px regardless of warp stretch.
      float gridLines(vec2 p, float cell){
        vec2 g = abs(fract(p / cell - 0.5) - 0.5) * cell;
        float d = min(g.x, g.y);
        // line thickness ~ 1.2 px
        float aa = fwidth(d) * 1.2;
        return 1.0 - smoothstep(0.0, aa, d);
      }

      void main(){
        vec2 res = u_res;
        vec2 frag = gl_FragCoord.xy;
        // Centered, aspect-correct UV in the [-1,1] range (roughly)
        vec2 uv = (frag - 0.5 * res) / min(res.x, res.y);

        float t = u_time * 0.12;

        // Two-octave domain warp — bends BOTH axes
        vec2 q = uv * 1.3;
        vec2 w1 = vec2(
          fbm(q + vec2(0.0,  t * 0.7)),
          fbm(q + vec2(5.2, -t * 0.5))
        );
        vec2 w2 = vec2(
          fbm(q + 4.0 * w1 + vec2(1.7, t * 0.4)),
          fbm(q + 4.0 * w1 + vec2(8.3, t * 0.6))
        );

        // Stronger warp = more dramatic spacetime-bend
        vec2 warpUv = uv + 0.55 * (w2 - 0.5);

        // Slow large-scale flow shifts the entire field like a current
        warpUv += 0.06 * vec2(sin(t * 0.9), cos(t * 0.7));

        // Map back to pixel-space for the grid sampler
        vec2 gridP = warpUv * min(res.x, res.y) + 0.5 * res;

        // Two grids: a fine one and a coarse one for depth
        float fine   = gridLines(gridP, 56.0);
        float coarse = gridLines(gridP, 168.0);

        // Base black
        vec3 base = vec3(0.012, 0.014, 0.020);

        // Cool-white line color, very low intensity for subtlety
        vec3 lineCol = vec3(0.62, 0.74, 0.95);

        vec3 col = base;
        col += lineCol * fine   * 0.22;
        col += lineCol * coarse * 0.34;

        // Faint flow shimmer hugging the warp field
        float shimmer = fbm(warpUv * 3.0 + vec2(t * 1.6, 0.0));
        col += vec3(0.05, 0.08, 0.16) * shimmer * 0.10;

        // Vignette
        float v = smoothstep(1.45, 0.10, length(uv));
        col *= mix(0.40, 1.0, v);

        // Light grain
        col += (hash(frag + u_time) - 0.5) * 0.010;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    function compile(type: number, src: string) {
      const sh = gl!.createShader(type)!;
      gl!.shaderSource(sh, src);
      gl!.compileShader(sh);
      return sh;
    }
    // Need OES_standard_derivatives for fwidth() in WebGL1
    gl.getExtension("OES_standard_derivatives");
    const fragWithExt = "#extension GL_OES_standard_derivatives : enable\n" + frag;

    const vs = compile(gl.VERTEX_SHADER, vert);
    const fs = compile(gl.FRAGMENT_SHADER, fragWithExt);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");

    let raf = 0;
    const start = performance.now();

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
        gl!.viewport(0, 0, w, h);
      }
    }

    function frame() {
      resize();
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform1f(uTime, (performance.now() - start) / 1000);
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(frame);
    }
    resize();
    frame();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 -z-10 h-screen w-screen"
      style={{ display: "block" }}
    />
  );
}
