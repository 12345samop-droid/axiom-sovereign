"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { Stars, OrbitControls, PerspectiveCamera, Sphere, Trail, Float } from "@react-three/drei"
import { Physics, RigidBody } from "@react-three/rapier"
import { Suspense, useRef, useEffect, useMemo } from "react"
import * as THREE from "three"
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette, ToneMapping } from "@react-three/postprocessing"
import { sharedState } from "@/lib/yjs"

// Custom Atmosphere Shader for Fresnel Glow
const AtmosphereShader = {
  uniforms: {
    color: { value: new THREE.Color("#4287f5") },
    coefficient: { value: 0.1 },
    power: { value: 4.0 },
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vEyeVector;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vEyeVector = normalize(-mvPosition.xyz);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    uniform float coefficient;
    uniform float power;
    varying vec3 vNormal;
    varying vec3 vEyeVector;
    void main() {
      float dotProduct = dot(vNormal, vEyeVector);
      float intensity = pow(coefficient + (1.0 - dotProduct), power);
      gl_FragColor = vec4(color, intensity);
    }
  `,
}

function Atmosphere() {
  const meshRef = useRef<THREE.Mesh>(null)
  const uniforms = useMemo(() => THREE.UniformsUtils.clone(AtmosphereShader.uniforms), [])

  return (
    <mesh ref={meshRef} scale={[1.15, 1.15, 1.15]}>
      <sphereGeometry args={[5, 64, 64]} />
      <shaderMaterial
        transparent
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        vertexShader={AtmosphereShader.vertexShader}
        fragmentShader={AtmosphereShader.fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}

function Earth() {
  const earthRef = useRef<THREE.Mesh>(null)
  const cloudsRef = useRef<THREE.Mesh>(null)

  useFrame((_state, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.02
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.03
  })

  return (
    <RigidBody type="fixed" colliders="ball" name="earth">
      {/* Earth Body with refined PBR-like material */}
      <Sphere ref={earthRef} args={[5, 64, 64]}>
        <meshStandardMaterial 
          color="#1a2b4c" 
          emissive="#050a14"
          roughness={0.6}
          metalness={0.3}
        />
      </Sphere>
      
      {/* Cloud Layer */}
      <Sphere ref={cloudsRef} args={[5.08, 64, 64]}>
        <meshStandardMaterial 
          color="#ffffff"
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </Sphere>

      <Atmosphere />
    </RigidBody>
  )
}

function Satellite() {
  const satelliteRef = useRef<any>(null)
  const thrusterRef = useRef<THREE.PointLight>(null)
  
  // Smoothing interpolation for telemetry
  const smoothTelemetry = useRef({ velocity: 0, altitude: 0 })

  useEffect(() => {
    const handleSync = () => {
      const command = sharedState.get('command') as any
      if (command && satelliteRef.current) {
        if (command.type === 'SET_VELOCITY') {
          satelliteRef.current.setLinearVelocity(command.value, true)
        }
        if (command.type === 'SET_POSITION') {
          satelliteRef.current.setTranslation(command.value, true)
        }
        sharedState.delete('command')
      }
    }
    sharedState.observe(handleSync)
    return () => sharedState.unobserve(handleSync)
  }, [])

  useFrame((state, delta) => {
    if (satelliteRef.current) {
      const position = satelliteRef.current.translation()
      const velocity = satelliteRef.current.linvel()
      const distSq = position.x ** 2 + position.y ** 2 + position.z ** 2
      const dist = Math.sqrt(distSq)
      
      const GM = 500 
      const forceMagnitude = GM / distSq
      
      const force = {
        x: (-position.x / dist) * forceMagnitude,
        y: (-position.y / dist) * forceMagnitude,
        z: (-position.z / dist) * forceMagnitude
      }
      
      satelliteRef.current.applyImpulse(force, true)

      // Internal smoothing for display
      const currentSpeed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2)
      const currentAlt = dist - 5
      
      smoothTelemetry.current.velocity = THREE.MathUtils.lerp(smoothTelemetry.current.velocity, currentSpeed, 0.1)
      smoothTelemetry.current.altitude = THREE.MathUtils.lerp(smoothTelemetry.current.altitude, currentAlt, 0.1)
      
      sharedState.set('telemetry', {
        velocity: smoothTelemetry.current.velocity.toFixed(2),
        altitude: smoothTelemetry.current.altitude.toFixed(2),
        eccentricity: "0.0004"
      })
      
      // Animate thruster glow
      if (thrusterRef.current) {
        thrusterRef.current.intensity = 2 + Math.sin(state.clock.elapsedTime * 10) * 1
      }
    }
  })

  return (
    <RigidBody 
      ref={satelliteRef} 
      position={[12, 0, 0]} 
      linearVelocity={[0, 0, 6.5]}
      colliders="cuboid"
      linearDamping={0}
      angularDamping={0}
    >
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh>
          <boxGeometry args={[0.4, 0.15, 0.2]} />
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={4} metalness={1} roughness={0} />
          <pointLight ref={thrusterRef} position={[-0.3, 0, 0]} color="#00ffff" intensity={2} distance={2} />
        </mesh>
        <mesh position={[0, 0, 0.35]}>
          <boxGeometry args={[0.2, 0.02, 0.5]} />
          <meshStandardMaterial color="#333" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0, -0.35]}>
          <boxGeometry args={[0.2, 0.02, 0.5]} />
          <meshStandardMaterial color="#333" metalness={0.9} roughness={0.1} />
        </mesh>
      </Float>
      <Trail width={2} length={30} color={new THREE.Color("#00ffff")} attenuation={(t) => t * t} />
    </RigidBody>
  )
}

export default function OrbitalSimulation() {
  return (
    <div className="w-full h-full bg-[#010101]">
      <Canvas shadows gl={{ antialias: false, stencil: false, depth: true }}>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[18, 18, 18]} fov={40} />
          <OrbitControls makeDefault enablePan={false} minDistance={8} maxDistance={60} />
          <color attach="background" args={["#000000"]} />
          <Stars radius={120} depth={60} count={10000} factor={6} saturation={0} fade speed={0.5} />
          <ambientLight intensity={0.1} />
          <directionalLight position={[10, 10, 10]} intensity={2.5} color="#ffffff" />
          <pointLight position={[-15, -5, -10]} intensity={1.5} color="#4287f5" />
          
          <Physics gravity={[0, 0, 0]}>
            <Earth />
            <Satellite />
          </Physics>

          <EffectComposer multisampling={0}>
            <Bloom intensity={1.5} luminanceThreshold={0.7} luminanceSmoothing={0.3} mipmapBlur />
            <ToneMapping />
            <ChromaticAberration offset={new THREE.Vector2(0.002, 0.002)} />
            <Noise opacity={0.04} />
            <Vignette eskil={false} offset={0.1} darkness={1.2} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  )
}
