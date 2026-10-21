import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'
import JSZip from 'jszip'
import { Play, Pause, SkipForward, Repeat, Maximize2, Minimize2, RotateCcw, Gauge } from 'lucide-react'
import { cn } from '../../lib/utils'

// 3D treatment viewer, modelled on the reference platform's sequence viewer:
// a 3Shape clear-aligner export (ZIP with a ClearAlignerProductionResources XML
// listing <Mold Stage Jaw Filename>) plays stage by stage; a single STL/OBJ/PLY
// is shown on its own. Models are expected Z-up (occlusal plane horizontal).

type Jaws = 'both'|'upper'|'lower'
type View = 'front'|'right'|'left'|'upper'|'lower'
const VIEWS: { id:View; label:string; dir:[number,number,number] }[] = [
  { id:'front', label:'Front', dir:[0,0,1] },
  { id:'right', label:'Right', dir:[-1,0,0.0001] }, // patient's right is the viewer's left
  { id:'left',  label:'Left',  dir:[1,0,0.0001] },
  { id:'upper', label:'Occlusal upper', dir:[0,-1,0.0001] }, // looking up at the upper arch
  { id:'lower', label:'Occlusal lower', dir:[0,1,0.0001] },  // looking down at the lower arch
]
const SPEEDS = [0.5, 1, 2]
const STAGE_MS = 700

interface Mold { stage:number; jaw:'upper'|'lower'; name:string }

const ext = (name:string) => name.split('?')[0].split('.').pop()?.toLowerCase() ?? ''
const toothMaterial = (vertexColors:boolean) => new THREE.MeshStandardMaterial({ color: vertexColors ? 0xffffff : 0xf3eee2, vertexColors, roughness:0.45, metalness:0, side:THREE.DoubleSide })

async function parseModel(name:string, data:ArrayBuffer, zip?:JSZip): Promise<THREE.Object3D> {
  const kind = ext(name)
  if (kind === 'stl' || kind === 'ply') {
    const geometry = kind === 'stl' ? new STLLoader().parse(data) : new PLYLoader().parse(data)
    geometry.computeVertexNormals()
    return new THREE.Mesh(geometry, toothMaterial(!!geometry.getAttribute('color')))
  }
  if (kind === 'obj') {
    const text = new TextDecoder().decode(data)
    const loader = new OBJLoader()
    const mtlName = name.replace(/\.obj$/i, '.mtl')
    const mtl = zip?.file(mtlName) ?? zip?.file(new RegExp(`${mtlName.split('/').pop()}$`, 'i'))[0]
    if (mtl && zip) {
      // Textures referenced by the .mtl are served from blobs inside the ZIP.
      const blobs = new Map<string,string>()
      for (const f of zip.file(/\.(jpe?g|png|bmp|tga|webp)$/i)) blobs.set(f.name.split('/').pop()!.toLowerCase(), URL.createObjectURL(await f.async('blob')))
      const manager = new THREE.LoadingManager()
      manager.setURLModifier(url => blobs.get(url.split('/').pop()!.toLowerCase()) ?? url)
      const materials = new MTLLoader(manager).parse(await mtl.async('text'), '')
      materials.preload()
      loader.setMaterials(materials)
    }
    const obj = loader.parse(text)
    if (!mtl) obj.traverse(o => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = toothMaterial(false) })
    return obj
  }
  throw new Error(`Unsupported model format: .${kind}`)
}

export default function SequenceViewer({ url, fileName }: { url:string; fileName:string }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasHost = useRef<HTMLDivElement>(null)
  const three = useRef<{ renderer:THREE.WebGLRenderer; camera:THREE.PerspectiveCamera; controls:OrbitControls; scene:THREE.Scene; target:THREE.Vector3|null; radius:number }|null>(null)
  const stagesRef = useRef<THREE.Group[]>([])
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string|null>(null)
  const [ready, setReady] = useState(false)
  const [stageCount, setStageCount] = useState(0)
  const [stage, setStage] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [loop, setLoop] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [jaws, setJaws] = useState<Jaws>('both')
  const [view, setView] = useState<View>('front')
  const [fullscreen, setFullscreen] = useState(false)
  const isSequence = ['zip','xml'].includes(ext(fileName))

  // Scene setup + loading
  useEffect(() => {
    const host = canvasHost.current!
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xffffff)
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 5000)
    const renderer = new THREE.WebGLRenderer({ antialias:true, preserveDrawingBuffer:true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    host.appendChild(renderer.domElement)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.addEventListener('start', () => { if (three.current) three.current.target = null })
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8d7f74, 1.6))
    const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(0.6, 1, 1.2); camera.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 0.6); fill.position.set(-1, -0.4, 0.4); camera.add(fill)
    scene.add(camera)
    three.current = { renderer, camera, controls, scene, target:null, radius:50 }

    const resize = () => {
      const { clientWidth:w, clientHeight:h } = host
      renderer.setSize(w, h, false); renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%'
      camera.aspect = w / Math.max(h, 1); camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize); ro.observe(host); resize()

    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const t = three.current!
      if (t.target) { // glide to the chosen view
        t.camera.position.lerp(t.target, 0.14)
        if (t.camera.position.distanceTo(t.target) < t.radius * 0.002) t.target = null
      }
      controls.update()
      renderer.render(scene, camera)
    }
    tick()

    let cancelled = false
    // Z-up model space -> Y-up scene, arch front facing the camera.
    const root = new THREE.Group(); root.rotation.y = Math.PI
    const zUp = new THREE.Group(); zUp.rotation.x = -Math.PI / 2
    root.add(zUp); scene.add(root)

    ;(async () => {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Could not download the model (${res.status})`)
        const total = Number(res.headers.get('content-length')) || 0
        const reader = res.body!.getReader(); const chunks:Uint8Array[] = []; let got = 0
        for (;;) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); got += value.length; if (total) setProgress(got / total * 0.5) }
        const buf = await new Blob(chunks as BlobPart[]).arrayBuffer()
        if (cancelled) return

        const groups: THREE.Group[] = []
        if (isSequence) {
          const zip = await JSZip.loadAsync(buf)
          const xmlFile = zip.file(/\.xml$/i)[0]
          if (!xmlFile) throw new Error('No XML manifest found inside the ZIP')
          const xml = new DOMParser().parseFromString(await xmlFile.async('text'), 'application/xml')
          const molds: Mold[] = Array.from(xml.getElementsByTagName('Mold')).map(m => ({
            stage: parseInt(m.getAttribute('Stage') || '0'),
            jaw: ((m.getAttribute('Jaw') || '').toLowerCase() === 'lower' ? 'lower' : 'upper') as Mold['jaw'],
            name: (m.getAttribute('Filename') || '').replace(/\\/g, '/'),
          })).filter(m => m.name)
          if (!molds.length) throw new Error('The XML manifest lists no models')
          const stageIds = [...new Set(molds.map(m => m.stage))].sort((a,b)=>a-b)
          let done = 0
          for (const s of stageIds) {
            const g = new THREE.Group(); g.name = `stage-${s}`; g.visible = false
            for (const m of molds.filter(x => x.stage === s)) {
              const f = zip.file(m.name) ?? zip.file(new RegExp(`${m.name.split('/').pop()!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'))[0]
              if (!f) { console.warn('Model missing from ZIP:', m.name); continue }
              const obj = await parseModel(m.name, await f.async('arraybuffer'), zip)
              obj.name = m.jaw; g.add(obj)
              done++; setProgress(0.5 + done / molds.length * 0.5)
              if (cancelled) return
            }
            zUp.add(g); groups.push(g)
          }
        } else {
          const obj = await parseModel(fileName, buf); obj.name = 'single'
          const g = new THREE.Group(); g.add(obj); zUp.add(g); groups.push(g)
        }
        if (cancelled) return
        stagesRef.current = groups
        groups[0].visible = true

        // Fit the camera to the first stage.
        const box = new THREE.Box3().setFromObject(root)
        const center = box.getCenter(new THREE.Vector3())
        root.position.sub(center)
        const radius = box.getSize(new THREE.Vector3()).length() / 2
        const t = three.current!
        t.radius = radius
        controls.target.set(0, 0, 0)
        camera.near = radius / 100; camera.far = radius * 100; camera.updateProjectionMatrix()
        camera.position.set(0, 0, radius * 2.6)
        controls.minDistance = radius * 0.8; controls.maxDistance = radius * 8
        setStageCount(groups.length); setStage(0); setProgress(1); setReady(true)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      }
    })()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf); ro.disconnect(); controls.dispose()
      scene.traverse(o => { const m = o as THREE.Mesh; if (m.isMesh) { m.geometry.dispose(); (Array.isArray(m.material) ? m.material : [m.material]).forEach(x => x.dispose()) } })
      renderer.dispose(); renderer.domElement.remove()
      three.current = null; stagesRef.current = []
    }
  }, [url, fileName, isSequence])

  // Stage + jaw visibility
  useEffect(() => {
    stagesRef.current.forEach((g, i) => {
      g.visible = i === stage
      g.children.forEach(o => { o.visible = o.name === 'single' || jaws === 'both' || o.name === jaws })
    })
  }, [stage, jaws, ready])

  // Playback
  useEffect(() => {
    if (!playing || stageCount < 2) return
    const id = setInterval(() => {
      setStage(s => {
        if (s + 1 < stageCount) return s + 1
        if (loop) return 0
        setPlaying(false); return s
      })
    }, STAGE_MS / speed)
    return () => clearInterval(id)
  }, [playing, loop, speed, stageCount])

  const goView = (v:View) => {
    setView(v)
    if (v === 'upper' && isSequence) setJaws('upper')
    else if (v === 'lower' && isSequence) setJaws('lower')
    else if (jaws !== 'both' && (view === 'upper' || view === 'lower')) setJaws('both')
    const t = three.current; if (!t) return
    const d = VIEWS.find(x => x.id === v)!.dir
    t.controls.target.set(0, 0, 0)
    t.target = new THREE.Vector3(...d).normalize().multiplyScalar(t.radius * 2.6)
  }
  const cycleView = () => goView(VIEWS[(VIEWS.findIndex(v => v.id === view) + 1) % VIEWS.length].id)
  const togglePlay = () => { if (!playing && stage >= stageCount - 1) setStage(0); setPlaying(p => !p) }
  const step = () => { setPlaying(false); setStage(s => (s + 1) % stageCount) }
  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await hostRef.current?.requestFullscreen()
  }
  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const tool = 'h-9 px-3 rounded-lg text-xs font-semibold transition-colors outline outline-1 outline-black/10'
  return (
    <div ref={hostRef} className="relative w-full h-full bg-white overflow-hidden rounded-xl">
      <div ref={canvasHost} className="absolute inset-0" data-testid="viewer-canvas"/>

      {!ready && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white">
          <p className="text-sm font-semibold text-ink-600">Loading 3D model… {Math.round(progress * 100)}%</p>
          <div className="w-64 h-1.5 rounded-full bg-surface-200 overflow-hidden"><div className="h-full bg-primary-500 transition-all" style={{ width:`${progress*100}%` }}/></div>
        </div>
      )}
      {error && <div className="absolute inset-0 flex items-center justify-center bg-white p-6 text-center text-sm font-semibold text-red-600">{error}</div>}

      {ready && (
        <>
          {/* View tools */}
          <div className="absolute top-3 left-3 flex flex-col gap-2" data-testid="viewer-tools">
            {isSequence && <div className="flex gap-1 self-start bg-white/70 backdrop-blur rounded-xl p-1 shadow-sm outline outline-1 outline-black/10">
              {(['upper','both','lower'] as Jaws[]).map(j=>(
                <button key={j} type="button" onClick={()=>setJaws(j)} title={j==='both'?'Show full jaw':`Show ${j} jaw`}
                  className={cn(tool, 'outline-0', jaws===j ? 'bg-primary-600 text-white' : 'text-ink-600 hover:bg-white')}>{j==='both'?'Both jaws':j==='upper'?'Upper jaw':'Lower jaw'}</button>
              ))}
            </div>}
            <div className="flex flex-wrap gap-1 self-start bg-white/70 backdrop-blur rounded-xl p-1 shadow-sm outline outline-1 outline-black/10 max-w-[calc(100vw-4rem)]">
              {VIEWS.map(v=>(
                <button key={v.id} type="button" onClick={()=>goView(v.id)}
                  className={cn(tool, 'outline-0', view===v.id ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-white')}>{v.label}</button>
              ))}
              <button type="button" onClick={cycleView} title="Cycle through views" className={cn(tool, 'outline-0 text-ink-600 hover:bg-white')}><RotateCcw size={14}/></button>
            </div>
          </div>
          <button type="button" onClick={toggleFullscreen} title={fullscreen?'Exit full screen':'Full screen'}
            className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur shadow-sm outline outline-1 outline-black/10 text-ink-600 hover:bg-white">
            {fullscreen ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
          </button>

          {/* Stage player */}
          {stageCount > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[min(42rem,92%)] backdrop-blur bg-white/60 rounded-xl shadow-lg outline outline-1 outline-black/10 overflow-hidden" data-testid="viewer-player">
              <input type="range" min={0} max={stageCount-1} step={1} value={stage} aria-label="Stage"
                onChange={e=>{ setPlaying(false); setStage(Number(e.target.value)) }}
                className="block w-full h-2 accent-red-600 cursor-pointer"/>
              <div className="flex items-center gap-3 px-4 py-3">
                <button type="button" onClick={togglePlay} aria-label={playing?'Pause':'Play'} className="w-12 h-12 rounded-full bg-white shadow-lg outline outline-1 outline-black/10 flex items-center justify-center text-ink-900 hover:bg-surface-50">
                  {playing ? <Pause size={20}/> : <Play size={20} className="ml-0.5"/>}
                </button>
                <button type="button" onClick={step} aria-label="Next stage" className="w-10 h-10 rounded-md bg-white shadow outline outline-1 outline-black/10 flex items-center justify-center text-ink-700 hover:bg-surface-50"><SkipForward size={17}/></button>
                <button type="button" onClick={()=>setLoop(l=>!l)} aria-label="Loop" aria-pressed={loop} className={cn('w-10 h-10 rounded-md shadow outline outline-1 outline-black/10 flex items-center justify-center', loop ? 'bg-primary-600 text-white' : 'bg-white text-ink-700 hover:bg-surface-50')}><Repeat size={17}/></button>
                <button type="button" onClick={()=>setSpeed(s=>SPEEDS[(SPEEDS.indexOf(s)+1)%SPEEDS.length])} aria-label="Speed" className="h-10 px-3 rounded-md bg-white shadow outline outline-1 outline-black/10 flex items-center gap-1.5 text-ink-700 text-sm font-semibold hover:bg-surface-50"><Gauge size={16}/>{speed}×</button>
                <div className="ml-auto text-right">
                  <p className="text-sm font-bold text-ink-900" data-testid="viewer-stage">Stage {stage} / {stageCount-1}</p>
                  <p className="text-[11px] text-ink-500">{stage===0 ? 'Initial' : stage===stageCount-1 ? 'Final' : `Aligner ${stage}`}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
