import { useNavigate } from 'react-router-dom'
import { FolderOpen,Users,CheckCircle,Clock,AlertCircle,TrendingUp,ArrowRight,FlaskConical,Activity } from 'lucide-react'
import { AreaChart,Area,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer } from 'recharts'
import { Badge,Avatar } from '../components/ui'
import { STATUS_CONFIG,formatRelative } from '../lib/utils'

const CHART=[
  {month:'Jan',cases:18,completed:12},
  {month:'Feb',cases:22,completed:16},
  {month:'Mar',cases:28,completed:19},
  {month:'Apr',cases:24,completed:21},
  {month:'May',cases:31,completed:24},
  {month:'Jun',cases:38,completed:28},
]
const CASES=[
  {id:'1',caseNumber:'OC-2026-0041',status:'awaiting_approval',treatmentType:'aligners',updatedAt:new Date(Date.now()-1000*60*25).toISOString(),patient:{firstName:'Sarah',lastName:'Mitchell'}},
  {id:'2',caseNumber:'OC-2026-0040',status:'in_planning',treatmentType:'aligners',updatedAt:new Date(Date.now()-1000*60*90).toISOString(),patient:{firstName:'James',lastName:'Okonkwo'}},
  {id:'3',caseNumber:'OC-2026-0039',status:'new',treatmentType:'braces',updatedAt:new Date(Date.now()-1000*60*180).toISOString(),patient:{firstName:'Amara',lastName:'Hassan'}},
  {id:'4',caseNumber:'OC-2026-0038',status:'in_treatment',treatmentType:'aligners',updatedAt:new Date(Date.now()-1000*60*60*5).toISOString(),patient:{firstName:'David',lastName:'Park'}},
  {id:'5',caseNumber:'OC-2026-0037',status:'completed',treatmentType:'retainer',updatedAt:new Date(Date.now()-1000*60*60*8).toISOString(),patient:{firstName:'Elena',lastName:'Rossi'}},
]
const ACTIVITY=[
  {id:'1',text:'Sarah Mitchell approved her treatment plan',time:new Date(Date.now()-1000*60*20).toISOString()},
  {id:'2',text:'Lab order #LOD-2026-088 marked as shipped',time:new Date(Date.now()-1000*60*55).toISOString()},
  {id:'3',text:'New case OC-2026-0041 created for James Okonkwo',time:new Date(Date.now()-1000*60*110).toISOString()},
  {id:'4',text:'AI segmentation completed for OC-2026-0040',time:new Date(Date.now()-1000*60*140).toISOString()},
]

function StatCard({icon:Icon,label,value,sub,color}:any){
  return <div className="stat-card">
    <div className={`p-2 rounded-xl w-fit ${color}`}><Icon size={18}/></div>
    <div className="mt-3">
      <p className="text-2xl font-bold text-ink-900">{value}</p>
      <p className="text-xs font-medium text-ink-500 mt-0.5">{label}</p>
      {sub&&<p className="text-xs text-ink-400 mt-1">{sub}</p>}
    </div>
  </div>
}

export default function Dashboard(){
  const navigate=useNavigate()
  return <div className="space-y-6 animate-fade-in">
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard icon={FolderOpen} label="Total cases" value={248} color="bg-primary-50 text-primary-600" sub="+12 this week"/>
      <StatCard icon={Activity} label="In treatment" value={89} color="bg-teal-50 text-teal-600" sub="Active patients"/>
      <StatCard icon={AlertCircle} label="Awaiting approval" value={7} color="bg-amber-50 text-amber-600" sub="Needs attention"/>
      <StatCard icon={FlaskConical} label="Lab orders" value={18} color="bg-purple-50 text-purple-600" sub="In production"/>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="card p-5 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div><p className="section-title">Case volume</p><p className="text-muted">New vs completed per month</p></div>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-ink-500"><span className="w-2.5 h-2.5 rounded-full bg-primary-400 inline-block"/>New</span>
            <span className="flex items-center gap-1.5 text-ink-500"><span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block"/>Completed</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={CHART} margin={{top:4,right:4,left:-24,bottom:0}}>
            <defs>
              <linearGradient id="gN" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#28a8fa" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#28a8fa" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#05c4a7" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#05c4a7" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="month" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{borderRadius:8,border:'1px solid #e2e8f0',fontSize:12}}/>
            <Area type="monotone" dataKey="cases" stroke="#28a8fa" strokeWidth={2} fill="url(#gN)" name="New"/>
            <Area type="monotone" dataKey="completed" stroke="#05c4a7" strokeWidth={2} fill="url(#gD)" name="Completed"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="card p-5">
        <p className="section-title mb-4">Recent activity</p>
        <div className="space-y-4">
          {ACTIVITY.map(a=>(
            <div key={a.id} className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0 mt-2"/>
              <div>
                <p className="text-sm text-ink-700 leading-snug">{a.text}</p>
                <p className="text-xs text-ink-400 mt-0.5">{formatRelative(a.time)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
        <p className="section-title">Recent cases</p>
        <button className="btn-ghost btn-sm gap-1" onClick={()=>navigate('/cases')}>View all<ArrowRight size={14}/></button>
      </div>
      <table className="w-full">
        <thead>
          <tr className="bg-surface-50 text-xs font-medium text-ink-400 uppercase tracking-wide">
            <th className="text-left px-5 py-3">Case</th>
            <th className="text-left px-5 py-3">Patient</th>
            <th className="text-left px-5 py-3">Type</th>
            <th className="text-left px-5 py-3">Status</th>
            <th className="text-left px-5 py-3">Updated</th>
            <th className="px-5 py-3"/>
          </tr>
        </thead>
        <tbody>
          {CASES.map(c=>{
            const s=STATUS_CONFIG[c.status]
            return <tr key={c.id} className="table-row cursor-pointer" onClick={()=>navigate(`/cases/${c.id}`)}>
              <td className="px-5 py-3 font-mono text-sm text-ink-700">{c.caseNumber}</td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <Avatar name={`${c.patient.firstName} ${c.patient.lastName}`} size="xs"/>
                  <span className="text-sm">{c.patient.firstName} {c.patient.lastName}</span>
                </div>
              </td>
              <td className="px-5 py-3 capitalize text-sm text-ink-600">{c.treatmentType}</td>
              <td className="px-5 py-3"><Badge variant={s.color.replace('badge-','')} dot>{s.label}</Badge></td>
              <td className="px-5 py-3 text-sm text-ink-400">{formatRelative(c.updatedAt)}</td>
              <td className="px-5 py-3"><button className="btn-ghost btn-sm">Open <ArrowRight size={12}/></button></td>
            </tr>
          })}
        </tbody>
      </table>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {[
        {label:'Conversion rate',value:'78%',icon:TrendingUp,color:'text-teal-600'},
        {label:'Avg treatment',value:'142d',icon:Clock,color:'text-primary-600'},
        {label:'Completed',value:134,icon:CheckCircle,color:'text-teal-600'},
        {label:'Total patients',value:186,icon:Users,color:'text-purple-600'},
      ].map(({label,value,icon:Icon,color})=>(
        <div key={label} className="card p-4 flex items-center gap-3">
          <Icon size={20} className={color}/>
          <div><p className="text-lg font-bold text-ink-900">{value}</p><p className="text-xs text-ink-400">{label}</p></div>
        </div>
      ))}
    </div>
  </div>
}
