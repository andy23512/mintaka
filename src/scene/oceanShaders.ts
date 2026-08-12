export const MAX_RIPPLES = 32

export const oceanVertexShader = /* glsl */ `
  #define MAX_RIPPLES ${MAX_RIPPLES}

  uniform float uTime;
  uniform vec2 uRipplePos[MAX_RIPPLES];
  uniform float uRippleTime[MAX_RIPPLES];
  uniform float uRippleActive[MAX_RIPPLES];

  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vFoam;

  float swellHeight(vec2 p) {
    float h = 0.0;
    h += 0.16 * sin(dot(p, vec2(0.045, 0.02)) + uTime * 0.32);
    h += 0.09 * sin(dot(p, vec2(-0.03, 0.06)) + uTime * 0.21 + 1.3);
    h += 0.05 * sin(dot(p, vec2(0.08, -0.035)) + uTime * 0.47 + 2.7);
    return h;
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

  float totalHeight(vec2 p, out float foam) {
    float rf;
    float h = swellHeight(p) + rippleHeight(p, rf);
    foam = rf;
    return h;
  }

  void main() {
    vec2 p = position.xy;
    float foam;
    float h = totalHeight(p, foam);

    float eps = 0.6;
    float fL, fR, fD, fU;
    float hL = totalHeight(p - vec2(eps, 0.0), fL);
    float hR = totalHeight(p + vec2(eps, 0.0), fR);
    float hD = totalHeight(p - vec2(0.0, eps), fD);
    float hU = totalHeight(p + vec2(0.0, eps), fU);

    vec3 localNormal = normalize(vec3(hL - hR, hD - hU, 2.0 * eps));

    vec3 displaced = position + vec3(0.0, 0.0, h);

    vNormal = normalize(normalMatrix * localNormal);
    vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
    vWorldPos = worldPos.xyz;
    vFoam = foam;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`

export const oceanFragmentShader = /* glsl */ `
  uniform vec3 uSunDir;
  uniform vec3 uColorShallow;
  uniform vec3 uColorDeep;
  uniform float uOpacity;

  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vFoam;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 L = normalize(uSunDir);

    float fresnel = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);
    vec3 base = mix(uColorDeep, uColorShallow, clamp(fresnel * 0.85 + 0.15, 0.0, 1.0));

    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0), 130.0);
    float sparkle = pow(max(dot(N, H), 0.0), 420.0);
    vec3 specColor = vec3(1.0, 0.99, 0.92) * (spec * 1.4 + sparkle * 2.2);

    vec3 foamColor = vec3(0.96, 1.0, 0.99) * clamp(vFoam * 1.3, 0.0, 1.0);

    vec3 color = base + specColor + foamColor;
    gl_FragColor = vec4(color, uOpacity);

    #include <colorspace_fragment>
  }
`
