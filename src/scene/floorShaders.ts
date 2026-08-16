// Depth below the water's rest level (y = 0) where the seafloor sits.
// Shared with oceanShaders.ts so the water's depth-based transparency
// lines up with where the floor mesh actually is.
export const SEA_FLOOR_DEPTH = 2.6

export const floorVertexShader = /* glsl */ `
  varying vec3 vWorldPos;
  varying float vHeight;

  #include <fog_pars_vertex>

  float duneHeight(vec2 p) {
    float h = 0.0;
    h += 0.35 * sin(dot(p, vec2(0.05, 0.03)) + 0.7);
    h += 0.18 * sin(dot(p, vec2(-0.08, 0.06)) + 2.1);
    h += 0.10 * sin(dot(p, vec2(0.11, -0.09)) + 4.4);
    return h;
  }

  void main() {
    vec2 p = position.xy;
    float h = duneHeight(p);
    vHeight = h;

    vec3 displaced = position + vec3(0.0, 0.0, h);
    vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
    vWorldPos = worldPos.xyz;

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    #include <fog_vertex>
  }
`

export const floorFragmentShader = /* glsl */ `
  uniform vec3 uSandLight;
  uniform vec3 uSandDark;

  varying vec3 vWorldPos;
  varying float vHeight;

  #include <fog_pars_fragment>

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  void main() {
    float n = valueNoise(vWorldPos.xz * 0.35) * 0.65 + valueNoise(vWorldPos.xz * 1.6) * 0.35;
    vec3 sand = mix(uSandDark, uSandLight, smoothstep(0.3, 0.75, n));

    float shade = clamp(0.78 + vHeight * 0.5, 0.55, 1.05);
    vec3 color = sand * shade;

    gl_FragColor = vec4(color, 1.0);

    #include <fog_fragment>
    #include <colorspace_fragment>
  }
`
