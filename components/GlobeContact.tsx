"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useReducedMotion } from "framer-motion";
import { clamp, damp } from "@/lib/physics";
import { onThemeChange } from "@/lib/theme";
import { HOME_MARKER, isLand } from "@/lib/worldLand";
import styles from "./GlobeContact.module.css";

// The site's first WebGL/Three.js element — a deliberate, explicit
// departure from the canvas-2D-only approach every other generative
// visual here uses (SpatialObject, ProjectVisual, SystemField). Justified
// specifically for a real, draggable 3D globe; not a pattern to reach for
// again without the same justification. Both the landmasses (a real
// 1-degree grid rasterized from actual Natural Earth coastline data — see
// lib/worldLand.ts / lib/worldLandGrid.ts) and the marker (Dinesh's real
// location) are genuine, not stylized approximations.
const RADIUS = 1;
const DOT_CANDIDATES = 2600; // Fibonacci-sphere sample count before land-filtering
const DOT_SIZE = 0.022;
const AUTO_SPEED = 0.12; // rad/s — idle rotation once drag momentum settles
const MOMENTUM_LAMBDA = 4.5; // damp() rate — how quickly released drag velocity relaxes toward the idle rate
const DRAG_SENSITIVITY = 0.006; // rad of rotation per px of pointer movement
const MORPH_LAMBDA = 5.5; // damp() rate for the globe <-> flat-map transition
const PING_PERIOD = 2.2; // seconds per marker-ping sweep cycle
// Equirectangular projection — the simplest real cartographic flattening
// (lon/lat mapped directly to x/y), not a re-implementation of the
// reference's Van der Grinten projection specifically. Same goal (a flat
// map the dots can morph into), simpler, honest about not chasing an
// unnecessarily exact match.
const FLAT_HALF_WIDTH = 1.4;
const FLAT_HALF_HEIGHT = 0.7;
const CAMERA_Z_GLOBE = 2.7;
const CAMERA_Z_FLAT = 3.5; // pulled back further — the flat map is wider than the sphere's silhouette

function latLonToSphere(lat: number, lon: number, r: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

function latLonToFlat(lat: number, lon: number): THREE.Vector3 {
  return new THREE.Vector3((lon / 180) * FLAT_HALF_WIDTH, (lat / 90) * FLAT_HALF_HEIGHT, 0);
}

// Fibonacci sphere — even point distribution with no pole clustering, the
// same reasoning the icosahedron-based distribution in
// lib/spatialGeometry.ts uses for a similar reason.
function fibonacciSphere(count: number): { lat: number; lon: number }[] {
  const points: { lat: number; lon: number }[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    points.push({
      lat: (Math.asin(y) * 180) / Math.PI,
      lon: (Math.atan2(z, x) * 180) / Math.PI,
    });
  }
  return points;
}

type Mode = "globe" | "flat";

export default function GlobeContact() {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  // The live, Three.js-side source of truth for the current mode, read
  // every frame inside the effect's closure below. `mode` (React state,
  // below) only drives the toggle button's label/aria-text — deliberately
  // kept OUTSIDE the effect's own dependency array, so toggling it doesn't
  // tear down and rebuild the whole scene (losing rotation/drag momentum)
  // on every click. The button's onClick writes to both.
  const modeRef = useRef<Mode>("globe");
  const [mode, setMode] = useState<Mode>("globe");
  const applyModeRef = useRef<(m: Mode) => void>(() => {});

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10);
    camera.position.z = CAMERA_Z_GLOBE;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    const globe = new THREE.Group();
    scene.add(globe);

    const wireGeo = new THREE.WireframeGeometry(new THREE.SphereGeometry(RADIUS, 20, 12));
    const wireMaterial = new THREE.LineBasicMaterial({ color: "#2a2a2a", transparent: true, opacity: 0.16 });
    globe.add(new THREE.LineSegments(wireGeo, wireMaterial));

    // Two parallel position sets per dot — sphere and flat — precomputed
    // once. The tick loop below lerps between them frame by frame rather
    // than recomputing a projection formula per frame.
    const candidates = fibonacciSphere(DOT_CANDIDATES).filter((p) => isLand(p.lat, p.lon));
    const sphereArr = new Float32Array(candidates.length * 3);
    const flatArr = new Float32Array(candidates.length * 3);
    candidates.forEach((p, i) => {
      const sv = latLonToSphere(p.lat, p.lon, RADIUS * 1.002);
      const fv = latLonToFlat(p.lat, p.lon);
      sphereArr[i * 3] = sv.x;
      sphereArr[i * 3 + 1] = sv.y;
      sphereArr[i * 3 + 2] = sv.z;
      flatArr[i * 3] = fv.x;
      flatArr[i * 3 + 1] = fv.y;
      flatArr[i * 3 + 2] = fv.z;
    });
    const currentArr = new Float32Array(sphereArr);
    const dotsGeo = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(currentArr, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    dotsGeo.setAttribute("position", posAttr);
    const dotsMaterial = new THREE.PointsMaterial({ color: "#8a8175", size: DOT_SIZE, sizeAttenuation: true });
    globe.add(new THREE.Points(dotsGeo, dotsMaterial));

    // The one real marker — Dinesh's actual location, not a stylized
    // approximation like the landmass dots around it.
    const markerGeo = new THREE.SphereGeometry(0.03, 14, 14);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: "#ff5a2e" });
    const marker = new THREE.Mesh(markerGeo, markerMaterial);
    const markerSpherePos = latLonToSphere(HOME_MARKER.lat, HOME_MARKER.lon, RADIUS * 1.03);
    const markerFlatPos = latLonToFlat(HOME_MARKER.lat, HOME_MARKER.lon);
    marker.position.copy(markerSpherePos);
    globe.add(marker);

    // A "you are here" ping — a ring lying flat against the sphere's
    // surface at the marker (oriented along the marker's own outward
    // normal, not camera-facing), continuously expanding and fading. The
    // one real, personal data point on the globe is otherwise just a
    // static dot indistinguishable in kind from the marker's own base
    // sphere shape; this is what actually draws the eye to it and gives
    // the globe something alive happening even before a visitor touches
    // it. Only meaningful in globe mode — a flat map has no "surface" for
    // a ping to spread across, so it fades out via the morph opacity
    // below rather than trying to redefine what it means once flattened.
    const pingGeo = new THREE.RingGeometry(0.034, 0.04, 32);
    const pingMaterial = new THREE.MeshBasicMaterial({
      color: "#ff5a2e",
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ping = new THREE.Mesh(pingGeo, pingMaterial);
    ping.position.copy(markerSpherePos);
    ping.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), markerSpherePos.clone().normalize());
    globe.add(ping);

    function readColors() {
      const s = getComputedStyle(document.documentElement);
      wireMaterial.color.set(s.getPropertyValue("--term-border").trim() || "#2a2a2a");
      dotsMaterial.color.set(s.getPropertyValue("--term-fg-dim").trim() || "#8a8175");
      const accent = s.getPropertyValue("--term-accent").trim() || "#ff5a2e";
      markerMaterial.color.set(accent);
      pingMaterial.color.set(accent);
    }
    readColors();
    const unsubTheme = onThemeChange(readColors);

    function resize() {
      const w = container!.clientWidth;
      const h = container!.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    function disposeAll() {
      unsubTheme();
      resizeObserver.disconnect();
      wireGeo.dispose();
      wireMaterial.dispose();
      dotsGeo.dispose();
      dotsMaterial.dispose();
      markerGeo.dispose();
      markerMaterial.dispose();
      pingGeo.dispose();
      pingMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode === container) {
        container!.removeChild(renderer.domElement);
      }
    }

    modeRef.current = "globe"; // reset on (re)mount — e.g. reduced-motion toggling
    let morphT = 0; // 0 = globe, 1 = flat

    function applyMorph(t: number) {
      for (let i = 0; i < candidates.length; i++) {
        const i3 = i * 3;
        currentArr[i3] = sphereArr[i3] + (flatArr[i3] - sphereArr[i3]) * t;
        currentArr[i3 + 1] = sphereArr[i3 + 1] + (flatArr[i3 + 1] - sphereArr[i3 + 1]) * t;
        currentArr[i3 + 2] = sphereArr[i3 + 2] + (flatArr[i3 + 2] - sphereArr[i3 + 2]) * t;
      }
      posAttr.needsUpdate = true;
      marker.position.lerpVectors(markerSpherePos, markerFlatPos, t);
      ping.position.lerpVectors(markerSpherePos, markerFlatPos, t);
      wireMaterial.opacity = 0.16 * (1 - t);
      camera.position.z = CAMERA_Z_GLOBE + (CAMERA_Z_FLAT - CAMERA_Z_GLOBE) * t;
    }

    if (reduced) {
      // A designed resting pose — no rotation, no drag, no pointer-driven
      // interactivity, matching SpatialObject's own reduced-motion
      // treatment. The globe/flat toggle still works (it's a direct,
      // user-initiated control activation, not ambient motion) but jumps
      // instantly between the two states rather than animating the morph.
      globe.rotation.y = -1.7;
      globe.rotation.x = 0.15;
      applyMorph(0);
      renderer.render(scene, camera);
    }

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let lastMoveTime = 0;
    let velY = AUTO_SPEED;
    let velX = 0;

    function onPointerDown(e: PointerEvent) {
      if (modeRef.current !== "globe") return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      lastMoveTime = performance.now();
      renderer.domElement.setPointerCapture(e.pointerId);
    }
    function onPointerMove(e: PointerEvent) {
      if (!dragging) return;
      const now = performance.now();
      const dt = Math.max((now - lastMoveTime) / 1000, 1 / 120);
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      lastMoveTime = now;
      const dRotY = dx * DRAG_SENSITIVITY;
      const dRotX = dy * DRAG_SENSITIVITY;
      globe.rotation.y += dRotY;
      globe.rotation.x = clamp(globe.rotation.x + dRotX, -1.2, 1.2);
      velY = dRotY / dt;
      velX = dRotX / dt;
    }
    function onPointerUp() {
      dragging = false;
    }
    const dom = renderer.domElement;
    if (!reduced) {
      dom.style.touchAction = "none";
      dom.addEventListener("pointerdown", onPointerDown);
      dom.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    }

    let visible = true;
    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
    });
    io.observe(container);

    let raf: number | null = null;
    let lastTime: number | null = null;
    function tick(time: number) {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      if (lastTime === null) lastTime = time;
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const morphTarget = modeRef.current === "flat" ? 1 : 0;
      if (Math.abs(morphT - morphTarget) > 0.001) {
        morphT = damp(morphT, morphTarget, MORPH_LAMBDA, dt);
        applyMorph(morphT);
      }

      // The ping loops on `time` directly (already a continuously
      // increasing rAF timestamp) rather than its own accumulator — one
      // fewer piece of state to keep in sync with the rest of the loop.
      // `raw` 0→1 each cycle: ring scales out from the marker's own size
      // while fading, then resets — a single continuous sonar sweep, not
      // a one-shot. Scaled down by (1 - morphT) so it fades out smoothly
      // as the globe morphs to the flat map instead of popping off.
      const pingRaw = (time / 1000 / PING_PERIOD) % 1;
      const pingScale = 1 + pingRaw * 2.4;
      const pingFade = (1 - pingRaw) * (1 - morphT);
      ping.scale.setScalar(pingScale);
      pingMaterial.opacity = 0.5 * pingFade;

      if (modeRef.current === "globe" && !dragging) {
        velY = damp(velY, AUTO_SPEED, MOMENTUM_LAMBDA, dt);
        velX = damp(velX, 0, MOMENTUM_LAMBDA, dt);
        globe.rotation.y += velY * dt;
        globe.rotation.x = clamp(globe.rotation.x + velX * dt, -1.2, 1.2);
      }

      renderer.render(scene, camera);
    }
    if (!reduced) raf = requestAnimationFrame(tick);

    applyModeRef.current = (m: Mode) => {
      modeRef.current = m;
      if (reduced) {
        applyMorph(m === "flat" ? 1 : 0);
        renderer.render(scene, camera);
      }
    };

    return () => {
      if (!reduced) {
        dom.removeEventListener("pointerdown", onPointerDown);
        dom.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      }
      io.disconnect();
      if (raf !== null) cancelAnimationFrame(raf);
      disposeAll();
    };
  }, [reduced]);

  function toggleMode() {
    const next: Mode = mode === "globe" ? "flat" : "globe";
    setMode(next);
    applyModeRef.current(next);
  }

  return (
    <div>
      <div
        ref={containerRef}
        className={styles.wrap}
        role="img"
        aria-label={`A ${mode === "globe" ? "rotatable 3D globe" : "flat world map"} marking ${HOME_MARKER.label}, where Dinesh is based`}
      />
      <button type="button" className={styles.toggle} onClick={toggleMode}>
        {mode === "globe" ? "→ flat map" : "→ 3d globe"}
      </button>
    </div>
  );
}
