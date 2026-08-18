import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const COLOR_CHROME = 0xeaffef;
const COLOR_PLATE_OUTER = 0x14532d;
const COLOR_PLATE_MID = 0x15803d;
const COLOR_PLATE_INNER = 0x16a34a;
const COLOR_EMERALD_GLOW = 0x10b981;
const COLOR_GREEN_GLOW = 0x22c55e;

function buildDumbbell(): THREE.Group {
  const group = new THREE.Group();

  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: COLOR_CHROME,
    metalness: 1,
    roughness: 0.15,
  });

  const barLength = 3.0;
  const bar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, barLength, 24),
    chromeMaterial,
  );
  bar.rotation.z = Math.PI / 2;
  group.add(bar);

  // Knurled grip rings at the center of the bar.
  const knurlMaterial = new THREE.MeshStandardMaterial({
    color: COLOR_CHROME,
    metalness: 0.9,
    roughness: 0.4,
  });
  for (let i = -3; i <= 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.062, 0.008, 8, 16),
      knurlMaterial,
    );
    ring.rotation.y = Math.PI / 2;
    ring.position.x = i * 0.09;
    group.add(ring);
  }

  const plateMaterials = [
    new THREE.MeshStandardMaterial({ color: COLOR_PLATE_INNER, emissive: COLOR_PLATE_INNER, emissiveIntensity: 0.18, metalness: 0.55, roughness: 0.3 }),
    new THREE.MeshStandardMaterial({ color: COLOR_PLATE_MID, emissive: COLOR_PLATE_MID, emissiveIntensity: 0.15, metalness: 0.6, roughness: 0.32 }),
    new THREE.MeshStandardMaterial({ color: COLOR_PLATE_OUTER, emissive: COLOR_PLATE_OUTER, emissiveIntensity: 0.12, metalness: 0.65, roughness: 0.35 }),
  ];

  const glowRingMaterial = new THREE.MeshStandardMaterial({
    color: COLOR_EMERALD_GLOW,
    emissive: COLOR_EMERALD_GLOW,
    emissiveIntensity: 1.4,
    metalness: 0.3,
    roughness: 0.3,
  });

  const plateSpecs = [
    { radius: 0.34, thickness: 0.1 },
    { radius: 0.46, thickness: 0.09 },
    { radius: 0.56, thickness: 0.08 },
  ];

  for (const side of [-1, 1]) {
    let x = side * 0.85;

    // Collar between grip and plates.
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.1, 20),
      chromeMaterial,
    );
    collar.rotation.z = Math.PI / 2;
    collar.position.x = x;
    group.add(collar);

    plateSpecs.forEach((spec, i) => {
      x += side * (spec.thickness / 2 + 0.012);
      const plate = new THREE.Mesh(
        new THREE.CylinderGeometry(spec.radius, spec.radius, spec.thickness, 32),
        plateMaterials[i],
      );
      plate.rotation.z = Math.PI / 2;
      plate.position.x = x;
      group.add(plate);
      x += side * (spec.thickness / 2);
    });

    // Thin glowing rim on the outer plate face.
    const glowRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.014, 10, 40),
      glowRingMaterial,
    );
    glowRing.rotation.y = Math.PI / 2;
    glowRing.position.x = x + side * 0.005;
    group.add(glowRing);

    // End cap / locknut.
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.05, 20),
      chromeMaterial,
    );
    cap.rotation.z = Math.PI / 2;
    cap.position.x = x + side * 0.045;
    group.add(cap);
  }

  return group;
}

export function DumbbellScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.3, 4.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x143d24, 1.1));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);

    const frontFill = new THREE.DirectionalLight(0xdcfce7, 0.9);
    frontFill.position.set(0, 0.5, 6);
    scene.add(frontFill);

    const emeraldFill = new THREE.PointLight(COLOR_EMERALD_GLOW, 4.5, 14);
    emeraldFill.position.set(-3, 1, 2.5);
    scene.add(emeraldFill);

    const greenRim = new THREE.PointLight(COLOR_GREEN_GLOW, 3.2, 14);
    greenRim.position.set(3, -1.2, -2);
    scene.add(greenRim);

    const dumbbell = buildDumbbell();
    const rig = new THREE.Group();
    rig.rotation.x = 0.15;
    rig.rotation.y = -0.5;
    rig.add(dumbbell);
    scene.add(rig);

    const pointer = { x: 0, y: 0 };
    const targetPointer = { x: 0, y: 0 };

    function handlePointerMove(event: PointerEvent) {
      const rect = container!.getBoundingClientRect();
      targetPointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      targetPointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    }

    function handlePointerLeave() {
      targetPointer.x = 0;
      targetPointer.y = 0;
    }

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerleave', handlePointerLeave);

    function resize() {
      const width = container!.clientWidth;
      const height = container!.clientHeight;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height, false);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    let frameId = 0;
    const timer = new THREE.Timer();
    timer.connect(document);

    function animate(timestamp: number) {
      frameId = requestAnimationFrame(animate);
      timer.update(timestamp);
      const elapsed = timer.getElapsed();

      pointer.x += (targetPointer.x - pointer.x) * 0.04;
      pointer.y += (targetPointer.y - pointer.y) * 0.04;

      if (!prefersReducedMotion) {
        rig.rotation.y = -0.5 + elapsed * 0.35 + pointer.x * 0.35;
        rig.position.y = Math.sin(elapsed * 1.1) * 0.14;
        rig.rotation.z = Math.sin(elapsed * 0.6) * 0.05 - pointer.y * 0.15;
      } else {
        rig.rotation.y = -0.5 + pointer.x * 0.2;
        rig.rotation.z = -pointer.y * 0.1;
      }

      renderer.render(scene, camera);
    }
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      timer.dispose();
      resizeObserver.disconnect();
      container!.removeEventListener('pointermove', handlePointerMove);
      container!.removeEventListener('pointerleave', handlePointerLeave);

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) {
            material.forEach((m) => m.dispose());
          } else {
            material.dispose();
          }
        }
      });

      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container!.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="dumbbell-scene" aria-hidden="true" />;
}
