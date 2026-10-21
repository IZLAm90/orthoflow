import { Box } from 'lucide-react'
import SequenceViewer from './SequenceViewer'
import type { TreatmentPlanDetail } from '../../lib/queries/treatmentPlans'

const ext = (name:string) => name.split('?')[0].split('.').pop()?.toLowerCase() ?? ''
const MODEL = ['stl','obj','ply'], VIDEO = ['mp4','webm','mov','m4v'], IMAGE = ['png','jpg','jpeg','gif','webp']

// Picks the viewer the way the reference platform does for each plan type.
export default function TreatmentViewer({ plan }: { plan: TreatmentPlanDetail }) {
  const file = plan.files.find(f => f.kind === 'VIEWER')
  const frame = (src:string, title:string, sandbox?:string) => (
    <iframe src={src} title={title} className="w-full h-full rounded-xl border-0 bg-white" allow="fullscreen; xr-spatial-tracking" allowFullScreen sandbox={sandbox}/>
  )

  if (plan.viewer_type === 'URL' && plan.viewer_url) return frame(plan.viewer_url, plan.name)
  if (plan.viewer_type === 'ONYXCEPH' && file) {
    const src = `https://onyx.orthorobot.com/webviewer/main.html?mlink=${encodeURIComponent(file.url)}&fg=76f&bg=fff&p=${encodeURIComponent(plan.onyx_password ?? '')}`
    return frame(src, `${plan.name} (OnyxCeph)`)
  }
  if (file && (plan.viewer_type === 'SHAPE3D' || MODEL.includes(ext(file.file_name)))) return <SequenceViewer url={file.url} fileName={file.file_name}/>
  if (file && VIDEO.includes(ext(file.file_name))) return <video src={file.url} controls className="w-full h-full rounded-xl bg-black"/>
  if (file && IMAGE.includes(ext(file.file_name))) return <img src={file.url} alt={plan.name} className="w-full h-full object-contain rounded-xl bg-white"/>
  if (file && ext(file.file_name) === 'pdf') return frame(file.url, plan.name)
  // Exocad HTML exports run their own scripts; keep them away from this origin.
  if (file && ['html','htm'].includes(ext(file.file_name))) return frame(file.url, plan.name, 'allow-scripts allow-popups')
  if (file) return <div className="w-full h-full flex items-center justify-center text-sm text-ink-500"><a className="text-primary-600 underline" href={file.url} target="_blank" rel="noreferrer">Download {file.file_name}</a></div>

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-center text-ink-400">
      <Box size={36}/>
      <p className="text-sm font-semibold text-ink-600">No viewer published for this plan yet</p>
      <p className="text-xs">The lab can add a link, a file, a 3Shape export or an OnyxCeph file from “Configure”.</p>
    </div>
  )
}
