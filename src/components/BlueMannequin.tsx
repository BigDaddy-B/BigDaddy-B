import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BodyKeyframe, ArmPose } from '../types/sasl';
import { REST_POSE } from '../lib/saslDictionary';
import { RotateCcw, Play, Pause } from 'lucide-react';

interface BlueMannequinProps {
  currentKeyframe?: BodyKeyframe;
  keyframeQueue?: BodyKeyframe[];
  isPlaying?: boolean;
  onSequenceComplete?: () => void;
  speedMultiplier?: number;
  activeGloss?: string;
  activeWord?: string;
  isFingerspelling?: boolean;
}

interface FingerRig {
  mcp: THREE.Group;        // Knuckle joint
  proximal: THREE.Mesh;
  pip: THREE.Group;        // Mid joint
  middle: THREE.Mesh;
  dip: THREE.Group;        // Tip joint
  distal: THREE.Mesh;
}

interface ThumbRig {
  cmc: THREE.Group;        // Base joint (trapezium/metacarpal)
  metacarpal: THREE.Mesh;
  mcp: THREE.Group;        // Middle knuckle
  proximal: THREE.Mesh;
  ip: THREE.Group;         // Tip joint
  distal: THREE.Mesh;
}

interface ArmRig {
  shoulderJoint: THREE.Group;
  deltoidCap: THREE.Mesh;
  upperArm: THREE.Mesh;
  elbowJoint: THREE.Group;
  forearm: THREE.Mesh;
  wristJoint: THREE.Group;
  palm: THREE.Group;
  fingers: {
    thumb: ThumbRig;
    index: FingerRig;
    middle: FingerRig;
    ring: FingerRig;
    pinky: FingerRig;
  };
}

export const BlueMannequin: React.FC<BlueMannequinProps> = ({
  currentKeyframe,
  keyframeQueue = [],
  isPlaying = true,
  onSequenceComplete,
  speedMultiplier = 1.0,
  activeGloss,
  activeWord,
  isFingerspelling = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Hierarchy references
  const headGroupRef = useRef<THREE.Group | null>(null);
  const torsoGroupRef = useRef<THREE.Group | null>(null);
  const leftArmRigRef = useRef<ArmRig | null>(null);
  const rightArmRigRef = useRef<ArmRig | null>(null);
  const eyesGroupRef = useRef<THREE.Group | null>(null);

  // Pose interpolation state
  const currentPoseRef = useRef<BodyKeyframe>(JSON.parse(JSON.stringify(REST_POSE)));
  const targetPoseRef = useRef<BodyKeyframe>(JSON.parse(JSON.stringify(REST_POSE)));
  const queueIndexRef = useRef<number>(0);
  const transitionProgressRef = useRef<number>(0);
  const transitionDurationRef = useRef<number>(400);

  const [cameraView, setCameraView] = useState<'front' | 'three-quarter' | 'hands'>('front');
  const [internalPaused, setInternalPaused] = useState(!isPlaying);

  useEffect(() => {
    setInternalPaused(!isPlaying);
  }, [isPlaying]);

  // Handle incoming keyframe or queue
  useEffect(() => {
    if (keyframeQueue && keyframeQueue.length > 0) {
      queueIndexRef.current = 0;
      targetPoseRef.current = keyframeQueue[0] || REST_POSE;
      transitionProgressRef.current = 0;
      transitionDurationRef.current = Math.max(150, (targetPoseRef.current.durationMs || 400) / speedMultiplier);
    } else if (currentKeyframe) {
      targetPoseRef.current = currentKeyframe;
      transitionProgressRef.current = 0;
      transitionDurationRef.current = Math.max(150, (currentKeyframe.durationMs || 400) / speedMultiplier);
    }
  }, [keyframeQueue, currentKeyframe, speedMultiplier]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // SCENE SETUP
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 1.28, 3.2);
    camera.lookAt(0, 1.2, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // MOUSE DRAG ROTATION FOR INTERACTIVE 3D INSPECTION
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const rootMannequin = new THREE.Group();
    rootMannequin.position.set(0, 0, 0);
    scene.add(rootMannequin);

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      rootMannequin.rotation.y += deltaX * 0.008;
      rootMannequin.rotation.x = Math.max(-0.2, Math.min(0.2, rootMannequin.rotation.x + deltaY * 0.004));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // LIGHTING: Premium Studio 3-Point Light
    const ambientLight = new THREE.AmbientLight(0x102a45, 2.0);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0x60a5fa, 2.6);
    mainKeyLight.position.set(2.5, 4.5, 3.5);
    scene.add(mainKeyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    fillLight.position.set(-3.0, 2.5, 2.0);
    scene.add(fillLight);

    const cyanRimLight = new THREE.DirectionalLight(0x22d3ee, 2.8);
    cyanRimLight.position.set(0, 3.5, -3.0);
    scene.add(cyanRimLight);

    const underGlow = new THREE.PointLight(0x1d4ed8, 1.4, 10);
    underGlow.position.set(0, -0.5, 1.5);
    scene.add(underGlow);

    // MATERIALS FOR HUMANOID BLUE MANNEQUIN
    // Primary Human Skin (Silky Blue Humanoid Tone)
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0x2563eb, // Vibrant Royal Blue
      roughness: 0.32,
      metalness: 0.18,
      emissive: 0x0f2b5c,
      emissiveIntensity: 0.35,
    });

    // Lighter Palmar/Facial skin tone for human hand palm, fingers, and face details
    const palmSkinMaterial = new THREE.MeshStandardMaterial({
      color: 0x3b82f6, // Lighter Soft Blue
      roughness: 0.28,
      metalness: 0.12,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.25,
    });

    // Anatomic Joints & Shading
    const jointMaterial = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.22,
      metalness: 0.35,
      emissive: 0x0284c7,
      emissiveIntensity: 0.25,
    });

    // Fingernails (Translucent luminous cyan)
    const nailMaterial = new THREE.MeshStandardMaterial({
      color: 0x67e8f9,
      roughness: 0.1,
      metalness: 0.6,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.6,
    });

    // Torso suit / Apparel
    const suitMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a, // Deep Navy Blue
      roughness: 0.45,
      metalness: 0.2,
      emissive: 0x0c1e40,
      emissiveIntensity: 0.2,
    });

    // Eye Material
    const eyeWhiteMaterial = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      roughness: 0.1,
      metalness: 0.1,
    });

    const eyeIrisMaterial = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.1,
      metalness: 0.8,
      emissive: 0x22d3ee,
      emissiveIntensity: 0.9,
    });

    const eyePupilMaterial = new THREE.MeshBasicMaterial({
      color: 0x020617,
    });

    // Lip Material
    const lipMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e40af,
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0x1e3a8a,
      emissiveIntensity: 0.3,
    });

    // ==========================================
    // 1. HUMAN TORSO & WAIST HIERARCHY
    // ==========================================
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 0.95, 0);
    rootMannequin.add(torsoGroup);
    torsoGroupRef.current = torsoGroup;

    // Pelvis & Lower Torso Base
    const pelvisGeo = new THREE.CylinderGeometry(0.18, 0.15, 0.22, 24);
    pelvisGeo.scale(1.2, 1.0, 0.8);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, suitMaterial);
    pelvisMesh.position.set(0, -0.15, 0);
    torsoGroup.add(pelvisMesh);

    // Abdominal core / Midsection with natural human waist taper
    const waistGeo = new THREE.CylinderGeometry(0.22, 0.18, 0.26, 24);
    waistGeo.scale(1.15, 1.0, 0.78);
    const waistMesh = new THREE.Mesh(waistGeo, suitMaterial);
    waistMesh.position.set(0, 0.06, 0);
    torsoGroup.add(waistMesh);

    // Upper Ribcage & Chest (Sculpted Pectorals)
    const chestGeo = new THREE.CylinderGeometry(0.27, 0.22, 0.32, 24);
    chestGeo.scale(1.24, 1.0, 0.75);
    const chestMesh = new THREE.Mesh(chestGeo, suitMaterial);
    chestMesh.position.set(0, 0.3, 0);
    torsoGroup.add(chestMesh);

    // Left & Right Pectoral Muscle Contours
    const pecGeo = new THREE.SphereGeometry(0.11, 16, 16);
    pecGeo.scale(1.2, 0.9, 0.5);

    const leftPec = new THREE.Mesh(pecGeo, skinMaterial);
    leftPec.position.set(-0.11, 0.32, 0.12);
    leftPec.rotation.set(-0.1, 0.1, -0.1);
    torsoGroup.add(leftPec);

    const rightPec = new THREE.Mesh(pecGeo, skinMaterial);
    rightPec.position.set(0.11, 0.32, 0.12);
    rightPec.rotation.set(-0.1, -0.1, 0.1);
    torsoGroup.add(rightPec);

    // Clavicle (Collar Bones) spanning across upper chest
    const clavicleGeo = new THREE.CylinderGeometry(0.018, 0.016, 0.44, 12);
    clavicleGeo.rotateZ(Math.PI / 2);
    const clavicleMesh = new THREE.Mesh(clavicleGeo, jointMaterial);
    clavicleMesh.position.set(0, 0.44, 0.08);
    torsoGroup.add(clavicleMesh);

    // Trapezius Neck Slopes
    const trapGeo = new THREE.ConeGeometry(0.24, 0.16, 16);
    trapGeo.scale(1.4, 1.0, 0.7);
    const trapMesh = new THREE.Mesh(trapGeo, suitMaterial);
    trapMesh.position.set(0, 0.44, -0.02);
    torsoGroup.add(trapMesh);

    // ==========================================
    // 2. HUMAN HEAD & FACIAL ANATOMY
    // ==========================================
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.48, 0);
    torsoGroup.add(headGroup);
    headGroupRef.current = headGroup;

    // Human Neck with Sternocleidomastoid muscle taper
    const neckGeo = new THREE.CylinderGeometry(0.08, 0.095, 0.16, 20);
    const neckMesh = new THREE.Mesh(neckGeo, skinMaterial);
    neckMesh.position.set(0, 0.04, 0);
    headGroup.add(neckMesh);

    // Thyroid cartilage (Adam's Apple)
    const thyroidGeo = new THREE.SphereGeometry(0.02, 10, 10);
    thyroidGeo.scale(0.8, 1.2, 0.8);
    const thyroidMesh = new THREE.Mesh(thyroidGeo, jointMaterial);
    thyroidMesh.position.set(0, 0.05, 0.085);
    headGroup.add(thyroidMesh);

    // Head Base Cranium
    const headCranium = new THREE.Group();
    headCranium.position.set(0, 0.22, 0.02);
    headGroup.add(headCranium);

    // Cranium Sphere (upper head & temples)
    const craniumGeo = new THREE.SphereGeometry(0.14, 24, 24);
    craniumGeo.scale(0.95, 1.12, 1.05);
    const craniumMesh = new THREE.Mesh(craniumGeo, skinMaterial);
    headCranium.add(craniumMesh);

    // Jawline & Chin Taper
    const jawGeo = new THREE.ConeGeometry(0.12, 0.16, 16);
    jawGeo.scale(0.9, 1.0, 0.85);
    jawGeo.rotateX(Math.PI);
    const jawMesh = new THREE.Mesh(jawGeo, skinMaterial);
    jawMesh.position.set(0, -0.06, 0.03);
    headCranium.add(jawMesh);

    // Chin prominence
    const chinGeo = new THREE.SphereGeometry(0.032, 12, 12);
    chinGeo.scale(1.1, 0.8, 1.0);
    const chinMesh = new THREE.Mesh(chinGeo, skinMaterial);
    chinMesh.position.set(0, -0.13, 0.08);
    headCranium.add(chinMesh);

    // Nose Bridge & Tip
    const noseBridgeGeo = new THREE.ConeGeometry(0.022, 0.075, 12);
    noseBridgeGeo.rotateX(-Math.PI / 2.6);
    const noseBridge = new THREE.Mesh(noseBridgeGeo, skinMaterial);
    noseBridge.position.set(0, 0.01, 0.155);
    headCranium.add(noseBridge);

    const noseTipGeo = new THREE.SphereGeometry(0.018, 10, 10);
    const noseTip = new THREE.Mesh(noseTipGeo, skinMaterial);
    noseTip.position.set(0, -0.02, 0.17);
    headCranium.add(noseTip);

    // Human Lips (Upper & Lower)
    const upperLipGeo = new THREE.TorusGeometry(0.024, 0.007, 8, 16, Math.PI);
    upperLipGeo.rotateX(Math.PI / 2);
    const upperLip = new THREE.Mesh(upperLipGeo, lipMaterial);
    upperLip.position.set(0, -0.065, 0.14);
    headCranium.add(upperLip);

    const lowerLipGeo = new THREE.SphereGeometry(0.018, 10, 8);
    lowerLipGeo.scale(1.4, 0.6, 0.8);
    const lowerLip = new THREE.Mesh(lowerLipGeo, lipMaterial);
    lowerLip.position.set(0, -0.082, 0.138);
    headCranium.add(lowerLip);

    // Humanoid Eyes & Pupils
    const eyesGroup = new THREE.Group();
    headCranium.add(eyesGroup);
    eyesGroupRef.current = eyesGroup;

    const buildEye = (isLeft: boolean) => {
      const eyeSide = isLeft ? -1 : 1;
      const eyeMount = new THREE.Group();
      eyeMount.position.set(eyeSide * 0.048, 0.035, 0.125);
      eyesGroup.add(eyeMount);

      // Sclera (eyeball white)
      const eyeballGeo = new THREE.SphereGeometry(0.024, 16, 16);
      eyeballGeo.scale(1.0, 0.75, 0.9);
      const eyeball = new THREE.Mesh(eyeballGeo, eyeWhiteMaterial);
      eyeMount.add(eyeball);

      // Iris (glowing cyan)
      const irisGeo = new THREE.CircleGeometry(0.012, 16);
      const iris = new THREE.Mesh(irisGeo, eyeIrisMaterial);
      iris.position.set(0, 0, 0.022);
      eyeMount.add(iris);

      // Pupil (center black)
      const pupilGeo = new THREE.CircleGeometry(0.005, 12);
      const pupil = new THREE.Mesh(pupilGeo, eyePupilMaterial);
      pupil.position.set(0, 0, 0.023);
      eyeMount.add(pupil);

      // Eyebrow ridge
      const browGeo = new THREE.CylinderGeometry(0.006, 0.004, 0.045, 8);
      browGeo.rotateZ(eyeSide * 0.2 + Math.PI / 2);
      const brow = new THREE.Mesh(browGeo, jointMaterial);
      brow.position.set(0, 0.022, 0.02);
      eyeMount.add(brow);
    };

    buildEye(true);  // Left Eye
    buildEye(false); // Right Eye

    // Left and Right Ears
    const buildEar = (isLeft: boolean) => {
      const earSide = isLeft ? -1 : 1;
      const earGeo = new THREE.TorusGeometry(0.028, 0.008, 8, 16, Math.PI * 1.3);
      earGeo.rotateY(earSide * (Math.PI / 2));
      earGeo.scale(0.8, 1.2, 0.8);
      const earMesh = new THREE.Mesh(earGeo, skinMaterial);
      earMesh.position.set(earSide * 0.13, 0.02, 0);
      headCranium.add(earMesh);
    };
    buildEar(true);
    buildEar(false);

    // ==========================================
    // 3. HUMAN ARMS & ARTICULATED 5-FINGER HANDS
    // ==========================================
    const buildHumanArm = (isLeft: boolean): ArmRig => {
      const sign = isLeft ? -1 : 1;

      // Shoulder Pivot Mount
      const shoulderJoint = new THREE.Group();
      shoulderJoint.position.set(sign * 0.32, 0.42, 0);
      torsoGroup.add(shoulderJoint);

      // Rounded Anatomical Deltoid Muscle Cap
      const deltoidGeo = new THREE.SphereGeometry(0.09, 16, 16);
      deltoidGeo.scale(0.9, 1.25, 1.0);
      const deltoidCap = new THREE.Mesh(deltoidGeo, suitMaterial);
      deltoidCap.position.set(0, -0.02, 0);
      shoulderJoint.add(deltoidCap);

      // Upper Arm (Biceps & Triceps contoured form)
      const upperArmGeo = new THREE.CylinderGeometry(0.058, 0.048, 0.32, 16);
      upperArmGeo.translate(0, -0.16, 0);
      const upperArm = new THREE.Mesh(upperArmGeo, skinMaterial);
      shoulderJoint.add(upperArm);

      // Elbow Joint with Olecranon
      const elbowJoint = new THREE.Group();
      elbowJoint.position.set(0, -0.32, 0);
      shoulderJoint.add(elbowJoint);

      const elbowBall = new THREE.Mesh(new THREE.SphereGeometry(0.052, 16, 16), jointMaterial);
      elbowJoint.add(elbowBall);

      // Forearm (Brachioradialis taper: wider near elbow, tapering to wrist)
      const forearmGeo = new THREE.CylinderGeometry(0.05, 0.038, 0.28, 16);
      forearmGeo.translate(0, -0.14, 0);
      const forearm = new THREE.Mesh(forearmGeo, skinMaterial);
      elbowJoint.add(forearm);

      // Wrist Joint (Carpal bones & ulnar styloid bump)
      const wristJoint = new THREE.Group();
      wristJoint.position.set(0, -0.28, 0);
      elbowJoint.add(wristJoint);

      const wristBall = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.034, 0.04, 14), jointMaterial);
      wristBall.scale.set(1.2, 1.0, 0.8);
      wristJoint.add(wristBall);

      // ==========================================
      // REALISTIC HUMAN HAND & PALM ARCH
      // ==========================================
      const palmGroup = new THREE.Group();
      wristJoint.add(palmGroup);

      // Central Palm Pad
      const palmCenterGeo = new THREE.BoxGeometry(0.082, 0.09, 0.026);
      palmCenterGeo.translate(0, -0.052, 0);
      const palmCenter = new THREE.Mesh(palmCenterGeo, palmSkinMaterial);
      palmGroup.add(palmCenter);

      // Thenar Eminence (Fleshy Thumb Muscle Mound)
      const thenarGeo = new THREE.SphereGeometry(0.032, 12, 12);
      thenarGeo.scale(1.0, 1.4, 0.9);
      const thenarMesh = new THREE.Mesh(thenarGeo, palmSkinMaterial);
      thenarMesh.position.set(sign * 0.032, -0.042, 0.012);
      palmGroup.add(thenarMesh);

      // Hypothenar Eminence (Pinky Side Muscle Mound)
      const hypothenarGeo = new THREE.SphereGeometry(0.026, 10, 10);
      hypothenarGeo.scale(0.8, 1.3, 0.8);
      const hypothenarMesh = new THREE.Mesh(hypothenarGeo, palmSkinMaterial);
      hypothenarMesh.position.set(sign * -0.032, -0.048, 0.01);
      palmGroup.add(hypothenarMesh);

      // Metacarpal Knuckle Ridge (4 distinct knuckles)
      [-0.028, -0.009, 0.009, 0.028].forEach((xOffset) => {
        const knuckleGeo = new THREE.SphereGeometry(0.013, 8, 8);
        const knuckle = new THREE.Mesh(knuckleGeo, jointMaterial);
        knuckle.position.set(sign * xOffset, -0.092, -0.004);
        palmGroup.add(knuckle);
      });

      // ==========================================
      // ARTICULATED 5 FINGERS (MCP -> PIP -> DIP)
      // ==========================================
      const buildFinger = (
        knuckleX: number,
        knuckleY: number,
        totalLength: number,
        spreadAngle: number
      ): FingerRig => {
        // Metacarpophalangeal (MCP) Knuckle Joint
        const mcp = new THREE.Group();
        mcp.position.set(knuckleX, knuckleY, 0);
        mcp.rotation.z = spreadAngle;
        palmGroup.add(mcp);

        const proxLength = totalLength * 0.42;
        const midLength = totalLength * 0.32;
        const distLength = totalLength * 0.26;

        // Proximal Phalanx
        const proxGeo = new THREE.CylinderGeometry(0.012, 0.011, proxLength, 10);
        proxGeo.translate(0, -proxLength / 2, 0);
        const proximal = new THREE.Mesh(proxGeo, skinMaterial);
        mcp.add(proximal);

        // Proximal Interphalangeal (PIP) Joint
        const pip = new THREE.Group();
        pip.position.set(0, -proxLength, 0);
        mcp.add(pip);

        const pipJointBall = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), jointMaterial);
        pip.add(pipJointBall);

        // Middle Phalanx
        const midGeo = new THREE.CylinderGeometry(0.0105, 0.0095, midLength, 10);
        midGeo.translate(0, -midLength / 2, 0);
        const middle = new THREE.Mesh(midGeo, skinMaterial);
        pip.add(middle);

        // Distal Interphalangeal (DIP) Joint
        const dip = new THREE.Group();
        dip.position.set(0, -midLength, 0);
        pip.add(dip);

        const dipJointBall = new THREE.Mesh(new THREE.SphereGeometry(0.0095, 8, 8), jointMaterial);
        dip.add(dipJointBall);

        // Distal Phalanx & Fingertip
        const distGeo = new THREE.CylinderGeometry(0.009, 0.0075, distLength, 10);
        distGeo.translate(0, -distLength / 2, 0);
        const distal = new THREE.Mesh(distGeo, palmSkinMaterial);
        dip.add(distal);

        // Soft rounded fingertip capsule
        const tipGeo = new THREE.SphereGeometry(0.0085, 8, 8);
        const tipMesh = new THREE.Mesh(tipGeo, palmSkinMaterial);
        tipMesh.position.set(0, -distLength, 0);
        dip.add(tipMesh);

        // Human Fingernail
        const nailGeo = new THREE.BoxGeometry(0.009, 0.013, 0.004);
        const nailMesh = new THREE.Mesh(nailGeo, nailMaterial);
        nailMesh.position.set(0, -distLength * 0.7, -0.006);
        dip.add(nailMesh);

        return { mcp, proximal, pip, middle, dip, distal };
      };

      // ARTICULATED OPPOSABLE THUMB
      const buildThumb = (): ThumbRig => {
        // Carpometacarpal (CMC) Base Joint
        const cmc = new THREE.Group();
        cmc.position.set(sign * 0.038, -0.036, 0.014);
        cmc.rotation.set(0.3, sign * -0.4, sign * -0.45);
        palmGroup.add(cmc);

        const metaLength = 0.036;
        const proxLength = 0.032;
        const distLength = 0.026;

        // Metacarpal phalanx
        const metaGeo = new THREE.CylinderGeometry(0.014, 0.0125, metaLength, 10);
        metaGeo.translate(0, -metaLength / 2, 0);
        const metacarpal = new THREE.Mesh(metaGeo, palmSkinMaterial);
        cmc.add(metacarpal);

        // MCP Joint
        const mcp = new THREE.Group();
        mcp.position.set(0, -metaLength, 0);
        cmc.add(mcp);

        const mcpBall = new THREE.Mesh(new THREE.SphereGeometry(0.0125, 8, 8), jointMaterial);
        mcp.add(mcpBall);

        // Proximal phalanx
        const proxGeo = new THREE.CylinderGeometry(0.012, 0.011, proxLength, 10);
        proxGeo.translate(0, -proxLength / 2, 0);
        const proximal = new THREE.Mesh(proxGeo, skinMaterial);
        mcp.add(proximal);

        // Interphalangeal (IP) Joint
        const ip = new THREE.Group();
        ip.position.set(0, -proxLength, 0);
        mcp.add(ip);

        const ipBall = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), jointMaterial);
        ip.add(ipBall);

        // Distal phalanx & thumb tip
        const distGeo = new THREE.CylinderGeometry(0.0105, 0.009, distLength, 10);
        distGeo.translate(0, -distLength / 2, 0);
        const distal = new THREE.Mesh(distGeo, palmSkinMaterial);
        ip.add(distal);

        const tipGeo = new THREE.SphereGeometry(0.01, 8, 8);
        const tip = new THREE.Mesh(tipGeo, palmSkinMaterial);
        tip.position.set(0, -distLength, 0);
        ip.add(tip);

        // Thumb nail
        const nailGeo = new THREE.BoxGeometry(0.011, 0.014, 0.004);
        const nailMesh = new THREE.Mesh(nailGeo, nailMaterial);
        nailMesh.position.set(0, -distLength * 0.65, -0.007);
        ip.add(nailMesh);

        return { cmc, metacarpal, mcp, proximal, ip, distal };
      };

      // 5 Human Fingers with Anatomical Proportions:
      // Index (2nd longest), Middle (longest), Ring (3rd), Pinky (shortest), Thumb (opposable)
      const fingers = {
        thumb: buildThumb(),
        index: buildFinger(sign * 0.028, -0.096, 0.082, sign * 0.06),
        middle: buildFinger(sign * 0.009, -0.099, 0.094, 0),
        ring: buildFinger(sign * -0.009, -0.096, 0.085, sign * -0.06),
        pinky: buildFinger(sign * -0.028, -0.09, 0.068, sign * -0.14),
      };

      return {
        shoulderJoint,
        deltoidCap,
        upperArm,
        elbowJoint,
        forearm,
        wristJoint,
        palm: palmGroup,
        fingers,
      };
    };

    leftArmRigRef.current = buildHumanArm(true);
    rightArmRigRef.current = buildHumanArm(false);

    // RESIZE OBSERVER
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      const { width: newW, height: newH } = entries[0].contentRect;
      if (newW > 0 && newH > 0 && cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = newW / newH;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(newW, newH);
      }
    });
    resizeObserver.observe(container);

    // KINEMATICS ANIMATION LOOP
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(time - lastTime, 100);
      lastTime = time;

      // Natural Human Idle Breathing & subtle micro-movements
      const idleTime = time * 0.002;
      const breathingTorso = Math.sin(idleTime) * 0.012;
      const breathingHead = Math.cos(idleTime * 0.8) * 0.008;

      // Subtle Eye Dart / Blink micro-animation for lifelike human look
      if (eyesGroupRef.current) {
        const eyeDart = Math.sin(idleTime * 1.5) * 0.004;
        eyesGroupRef.current.position.x = eyeDart;
      }

      // Interpolate current pose to target pose
      if (!internalPaused && targetPoseRef.current) {
        const step = (delta / transitionDurationRef.current) * 1.5;
        transitionProgressRef.current = Math.min(1.0, transitionProgressRef.current + step);

        const t = transitionProgressRef.current;
        // Smooth ease-in-out cubic
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const cur = currentPoseRef.current;
        const tgt = targetPoseRef.current;

        // LERP Head & Torso
        cur.head.rotX = THREE.MathUtils.lerp(cur.head.rotX, tgt.head.rotX, ease);
        cur.head.rotY = THREE.MathUtils.lerp(cur.head.rotY, tgt.head.rotY, ease);
        cur.head.rotZ = THREE.MathUtils.lerp(cur.head.rotZ, tgt.head.rotZ, ease);

        cur.torso.leanX = THREE.MathUtils.lerp(cur.torso.leanX, tgt.torso.leanX, ease);
        cur.torso.leanY = THREE.MathUtils.lerp(cur.torso.leanY, tgt.torso.leanY, ease);

        // LERP Arms & Fingers
        const lerpArm = (source: ArmPose, dest: ArmPose) => {
          source.shoulderX = THREE.MathUtils.lerp(source.shoulderX, dest.shoulderX, ease);
          source.shoulderY = THREE.MathUtils.lerp(source.shoulderY, dest.shoulderY, ease);
          source.shoulderZ = THREE.MathUtils.lerp(source.shoulderZ, dest.shoulderZ, ease);
          source.elbowX = THREE.MathUtils.lerp(source.elbowX, dest.elbowX, ease);
          source.elbowY = THREE.MathUtils.lerp(source.elbowY, dest.elbowY, ease);
          source.wristX = THREE.MathUtils.lerp(source.wristX, dest.wristX, ease);
          source.wristY = THREE.MathUtils.lerp(source.wristY, dest.wristY, ease);
          source.wristZ = THREE.MathUtils.lerp(source.wristZ, dest.wristZ, ease);
          source.thumb = THREE.MathUtils.lerp(source.thumb, dest.thumb, ease);
          source.index = THREE.MathUtils.lerp(source.index, dest.index, ease);
          source.middle = THREE.MathUtils.lerp(source.middle, dest.middle, ease);
          source.ring = THREE.MathUtils.lerp(source.ring, dest.ring, ease);
          source.pinky = THREE.MathUtils.lerp(source.pinky, dest.pinky, ease);
          if (dest.fingerSpread !== undefined) {
            source.fingerSpread = THREE.MathUtils.lerp(source.fingerSpread || 0, dest.fingerSpread, ease);
          }
        };

        lerpArm(cur.leftArm, tgt.leftArm);
        lerpArm(cur.rightArm, tgt.rightArm);

        // Advance queue when keyframe finishes
        if (transitionProgressRef.current >= 1.0) {
          if (keyframeQueue && keyframeQueue.length > 0 && queueIndexRef.current < keyframeQueue.length - 1) {
            queueIndexRef.current += 1;
            targetPoseRef.current = keyframeQueue[queueIndexRef.current];
            transitionProgressRef.current = 0;
            transitionDurationRef.current = Math.max(150, (targetPoseRef.current.durationMs || 400) / speedMultiplier);
          } else if (onSequenceComplete && queueIndexRef.current === keyframeQueue.length - 1) {
            onSequenceComplete();
          }
        }
      }

      // APPLY ROTATIONS TO BONES & HIERARCHY
      const cur = currentPoseRef.current;

      if (torsoGroupRef.current) {
        torsoGroupRef.current.rotation.x = cur.torso.leanX + breathingTorso;
        torsoGroupRef.current.rotation.y = cur.torso.leanY;
      }

      if (headGroupRef.current) {
        headGroupRef.current.rotation.x = cur.head.rotX + breathingHead;
        headGroupRef.current.rotation.y = cur.head.rotY;
        headGroupRef.current.rotation.z = cur.head.rotZ;
      }

      const applyArmKinematics = (rig: ArmRig | null, pose: ArmPose, isLeft: boolean) => {
        if (!rig) return;
        const sign = isLeft ? -1 : 1;

        // Shoulder Joint
        rig.shoulderJoint.rotation.x = -pose.shoulderX;
        rig.shoulderJoint.rotation.y = sign * pose.shoulderY;
        rig.shoulderJoint.rotation.z = sign * pose.shoulderZ;

        // Elbow Joint
        rig.elbowJoint.rotation.x = -pose.elbowX;
        rig.elbowJoint.rotation.y = sign * pose.elbowY;

        // Wrist Joint
        rig.wristJoint.rotation.x = -pose.wristX;
        rig.wristJoint.rotation.y = sign * pose.wristY;
        rig.wristJoint.rotation.z = sign * pose.wristZ;

        // Natural Human Multi-Joint Finger Curling Kinematics
        // When finger bends: MCP flexes ~50%, PIP flexes ~65%, DIP flexes ~40%
        const applyFingerCurling = (f: FingerRig, curl: number, spreadOffset = 0) => {
          const totalCurl = curl * 1.55;
          f.mcp.rotation.x = -totalCurl * 0.45;
          f.pip.rotation.x = -totalCurl * 0.65;
          f.dip.rotation.x = -totalCurl * 0.4;

          // Spread abduction / adduction
          const spread = (pose.fingerSpread || 0) * 0.25 + spreadOffset;
          f.mcp.rotation.z = sign * spread;
        };

        applyFingerCurling(rig.fingers.index, pose.index, 0.08);
        applyFingerCurling(rig.fingers.middle, pose.middle, 0.0);
        applyFingerCurling(rig.fingers.ring, pose.ring, -0.06);
        applyFingerCurling(rig.fingers.pinky, pose.pinky, -0.14);

        // Thumb Opposable Flexion & Adduction Kinematics
        const thumbCurl = pose.thumb * 1.4;
        rig.fingers.thumb.cmc.rotation.y = sign * (-0.4 - thumbCurl * 0.45);
        rig.fingers.thumb.cmc.rotation.z = sign * (-0.45 - thumbCurl * 0.25);
        rig.fingers.thumb.mcp.rotation.x = -thumbCurl * 0.6;
        rig.fingers.thumb.ip.rotation.x = -thumbCurl * 0.7;
      };

      applyArmKinematics(leftArmRigRef.current, cur.leftArm, true);
      applyArmKinematics(rightArmRigRef.current, cur.rightArm, false);

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate(performance.now());

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Camera View Preset
  const setCameraPreset = (view: 'front' | 'three-quarter' | 'hands') => {
    setCameraView(view);
    if (!cameraRef.current) return;
    if (view === 'front') {
      cameraRef.current.position.set(0, 1.28, 3.2);
      cameraRef.current.lookAt(0, 1.2, 0);
    } else if (view === 'three-quarter') {
      cameraRef.current.position.set(1.1, 1.35, 2.9);
      cameraRef.current.lookAt(0, 1.2, 0);
    } else if (view === 'hands') {
      cameraRef.current.position.set(0, 1.05, 2.1);
      cameraRef.current.lookAt(0, 1.05, 0);
    }
  };

  return (
    <div id="blue-mannequin-container" className="relative w-full h-full min-h-[400px] bg-black/40 rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col justify-between group select-none">
      {/* Immersive Dot Matrix Background Texture & Depth Gradient */}
      <div className="absolute inset-0 bg-dot-grid opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none z-0" />

      {/* Top Overlay: Status & Camera View Controls */}
      <div className="relative z-20 p-5 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-white">Humanoid SASL Avatar</span>
          </div>

          {isFingerspelling && (
            <span className="px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-[11px] font-semibold text-blue-300 backdrop-blur-md">
              Fingerspelling Mode
            </span>
          )}
        </div>

        {/* View Angle Controls */}
        <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10 backdrop-blur-md pointer-events-auto shadow-lg">
          <button
            id="view-front-btn"
            onClick={() => setCameraPreset('front')}
            title="Frontal View"
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              cameraView === 'front' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Front
          </button>
          <button
            id="view-3quarter-btn"
            onClick={() => setCameraPreset('three-quarter')}
            title="3/4 Perspective"
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              cameraView === 'three-quarter' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3/4 Angle
          </button>
          <button
            id="view-hands-btn"
            onClick={() => setCameraPreset('hands')}
            title="Hand Closeup"
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              cameraView === 'hands' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hands Focus
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Mount */}
      <div
        ref={mountRef}
        className="w-full h-full flex-1 cursor-grab active:cursor-grabbing relative z-10"
        title="Click and drag to rotate the 3D humanoid avatar"
      />

      {/* Subtitles & Gloss Ticker - Immersive UI Pill */}
      <div className="absolute bottom-16 left-6 right-6 z-20 pointer-events-none">
        {(activeGloss || activeWord) && (
          <div className="bg-blue-900/40 backdrop-blur-xl p-4 rounded-2xl border border-blue-400/20 shadow-2xl transition-all animate-in fade-in zoom-in-95">
            {activeWord && (
              <p className="text-blue-100 text-sm italic font-medium leading-relaxed opacity-75 mb-1">
                Input detected: "{activeWord}"
              </p>
            )}
            <p className="text-white text-xl font-semibold tracking-wide">
              {activeGloss || activeWord}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Floating Toolbar: Playback & Speed */}
      <div className="relative z-20 px-6 py-3 bg-black/40 border-t border-white/10 backdrop-blur-md flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-3">
          <button
            id="toggle-playback-btn"
            onClick={() => setInternalPaused(!internalPaused)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition shadow-lg shadow-blue-500/20"
          >
            {internalPaused ? <Play className="w-3.5 h-3.5 fill-white" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{internalPaused ? 'Resume Rig' : 'Pause Avatar'}</span>
          </button>

          <button
            id="reset-pose-btn"
            onClick={() => {
              targetPoseRef.current = REST_POSE;
              transitionProgressRef.current = 0;
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Rest Pose</span>
          </button>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-blue-300/80">
          <span>Speed: {speedMultiplier}x</span>
          <span className="w-1 h-1 rounded-full bg-blue-400" />
          <span>Interactive 3D Drag Enabled</span>
        </div>
      </div>
    </div>
  );
};
