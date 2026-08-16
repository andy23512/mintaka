export const MAX_RIPPLES = 32

export const oceanVertexShader = /* glsl */ `
  #define MAX_RIPPLES ${MAX_RIPPLES}
  #define NUM_WAVES 4

  uniform float uTime;
  uniform vec2 uRipplePos[MAX_RIPPLES];
  uniform float uRippleTime[MAX_RIPPLES];
  uniform float uRippleActive[MAX_RIPPLES];

  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vFoam;

  // Gerstner (trochoid) swell: each wave pushes points sideways as well as up,
  // producing peaked crests and shallow troughs instead of symmetric sine bumps.
  const vec2 waveDir[NUM_WAVES] = vec2[NUM_WAVES](
    vec2(0.94, 0.34),
    vec2(-0.55, 0.83),
    vec2(0.86, -0.51),
    vec2(-0.25, -0.97)
  );
  const float waveLength[NUM_WAVES] = float[NUM_WAVES](26.0, 15.0, 9.0, 5.5);
  const float waveSteepness[NUM_WAVES] = float[NUM_WAVES](0.22, 0.16, 0.1, 0.06);
  const float waveSpeed[NUM_WAVES] = float[NUM_WAVES](0.6, 0.85, 1.15, 1.5);

  void gerstner(vec2 p, out vec2 offsetXY, out float offsetZ, out vec3 normal) {
    offsetXY = vec2(0.0);
    offsetZ = 0.0;
    vec2 gradSum = vec2(0.0);

    for (int i = 0; i < NUM_WAVES; i++) {
      float w = 6.28318 / waveLength[i];
      float amp = waveSteepness[i] / w;
      vec2 d = waveDir[i];
      float phase = w * dot(d, p) + uTime * waveSpeed[i];
      float c = cos(phase);
      float s = sin(phase);

      offsetXY += waveSteepness[i] * amp * d * c;
      offsetZ += amp * s;
      gradSum += d * w * amp * c;
    }

    normal = normalize(vec3(-gradSum, 1.0));
  }

  float rippleHeight(vec2 p, out float foam) {
    float h = 0.0;
    foam = 0.0;
    for (int i = 0; i < MAX_RIPPLES; i++) {
      if (uRippleActive[i] < 0.5) continue;
      float age = uTime - uRippleTime[i];
      if (age < 0.0 || age > 4.5) continue;
      float dist = length(p - uRipplePos[i]);
      float speed = 2.8;
      float front = age * speed;
      float band = exp(-pow(dist - front, 2.0) * 2.4);
      float decay = exp(-age * 1.2) * smoothstep(0.0, 0.1, age);
      float amp = 0.32 * decay * band;
      h += amp * sin(dist * 5.0 - age * 9.0);
      foam += band * decay;
    }
    return h;
  }

  void main() {
    vec2 p = position.xy;

    vec2 swellXY;
    float swellZ;
    vec3 swellNormal;
    gerstner(p, swellXY, swellZ, swellNormal);

    float foam;
    float rh = rippleHeight(p, foam);

    float eps = 0.6;
    float fL, fR, fD, fU;
    float rL = rippleHeight(p - vec2(eps, 0.0), fL);
    float rR = rippleHeight(p + vec2(eps, 0.0), fR);
    float rD = rippleHeight(p - vec2(0.0, eps), fD);
    float rU = rippleHeight(p + vec2(0.0, eps), fU);
    vec2 rippleGrad = vec2(rL - rR, rD - rU) / (2.0 * eps);

    vec3 localNormal = normalize(swellNormal + vec3(rippleGrad, 0.0));

    vec3 displaced = position + vec3(swellXY, swellZ + rh);

    vNormal = normalize(normalMatrix * localNormal);
    vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
    vWorldPos = worldPos.xyz;
    vFoam = foam;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`

export const oceanFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uSunDir;
  uniform vec3 uColorShallow;
  uniform vec3 uColorDeep;
  uniform vec3 uSkyZenith;
  uniform vec3 uSkyHorizon;
  uniform float uOpacity;
  uniform float uFloorDepth;
  uniform float uExtinction;

  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vFoam;

  // Cheap hash-based value noise, stands in for a scrolling water-normal
  // texture: two independently scrolling layers give the fine, view-dependent
  // micro-ripples that make the specular glitter look like real chop rather
  // than a single smooth highlight.
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

  vec2 bumpGradient(vec2 p, float scale, vec2 drift) {
    vec2 q = p * scale + drift;
    float eps = 0.35;
    float hL = valueNoise(q - vec2(eps, 0.0));
    float hR = valueNoise(q + vec2(eps, 0.0));
    float hD = valueNoise(q - vec2(0.0, eps));
    float hU = valueNoise(q + vec2(0.0, eps));
    return vec2(hL - hR, hD - hU) / (2.0 * eps);
  }

  void main() {
    vec3 geoNormal = normalize(vNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 L = normalize(uSunDir);

    vec2 bump = bumpGradient(vWorldPos.xz, 0.9, vec2(uTime * 0.05, uTime * 0.03)) * 0.05
      + bumpGradient(vWorldPos.xz, 2.3, vec2(-uTime * 0.09, uTime * 0.07)) * 0.025;
    vec3 N = normalize(geoNormal + vec3(bump.x, bump.y, 0.0));

    // Schlick fresnel with water's real ~2% base reflectance.
    float cosTheta = clamp(dot(N, V), 0.0, 1.0);
    float fresnel = 0.02 + 0.98 * pow(1.0 - cosTheta, 5.0);

    vec3 R = reflect(-V, N);
    float skyMix = smoothstep(-0.1, 0.55, R.y);
    vec3 skyColor = mix(uSkyHorizon, uSkyZenith, skyMix);

    // Analytic ray/floor-plane intersection: since both the water's rest
    // level and the seafloor are flat, the distance light travels through
    // the water can be solved directly instead of sampling a depth buffer.
    float pathLength = max(vWorldPos.y + uFloorDepth, 0.0) / max(V.y, 0.001);
    float depthAlpha = 1.0 - exp(-uExtinction * pathLength);

    vec3 body = mix(uColorDeep, uColorShallow, clamp(1.0 - depthAlpha * 0.85, 0.0, 1.0));
    vec3 base = mix(body, skyColor, fresnel);

    vec3 H = normalize(L + V);
    float ndh = max(dot(N, H), 0.0);
    float spec = pow(ndh, 180.0);
    float glitterMask = smoothstep(0.8, 0.98, valueNoise(vWorldPos.xz * 9.0 + uTime * 0.6));
    float sparkle = pow(ndh, 700.0) * glitterMask;
    vec3 specColor = vec3(1.0, 0.99, 0.92) * (spec * 0.8 + sparkle * 2.0);

    vec3 foamColor = vec3(0.96, 1.0, 0.99) * clamp(vFoam * 1.3, 0.0, 1.0);

    vec3 color = base + specColor + foamColor;
    float alpha = clamp(mix(depthAlpha, 1.0, fresnel), 0.0, 1.0) * uOpacity;
    gl_FragColor = vec4(color, alpha);

    #include <colorspace_fragment>
  }
`
