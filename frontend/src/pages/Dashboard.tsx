import { useNavigate } from 'react-router-dom'
import { FolderOpen,Users,CheckCircle,Clock,AlertCircle,TrendingUp,ArrowRight,FlaskConical,Activity } from 'lucide-react'
import { AreaChart,Area,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer } from 'recharts'
import { Badge,Avatar,Spinner } from '../components/ui'
import { STATUS_CONFIG,formatRelative } from '../lib/utils'
import { useCases } from '../lib/queries/cases'
import { usePatients } from '../lib/queries/patients'
import { useLabOrders } from '../lib/queries/labOrders'

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
  const { data:cases=[], isLoading:casesLoading } = useCases()
  const { data:patients=[] } = usePatients()
  const { data:labOrders=[] } = useLabOrders()

  const inTreatment = cases.filter(c=>c.status==='in_treatment').length
  const awaitingApproval = cases.filter(c=>c.status==='awaiting_approval').length
  const completed = cases.filter(c=>c.status==='completed').length
  const recentCases = [...cases].sort((a,b)=>+new Date(b.updated_at)-+new Date(a.updated_at)).slice(0,5)

  const monthKey = (iso:string)=> new Date(iso).toLocaleString('en-US',{month:'short'})
  const chartMap = new Map<string,{month:string;cases:number;completed:number}>()
  for(const c of cases){
    const m = monthKey(c.created_at)
    if(!chartMap.has(m)) chartMap.set(m,{month:m,cases:0,completed:0})
    const row = chartMap.get(m)!
    row.cases++
    if(c.status==='completed') row.completed++
  }
  const chart = Array.from(chartMap.values())

  const activity = [...cases]
    .sort((a,b)=>+new Date(b.created_at)-+new Date(a.created_at))
    .slice(0,4)
    .map(c=>({ id:c.id, text:`New case ${c.case_number} created for ${c.patient?`${c.patient.first_name} ${c.patient.last_name}`:'a patient'}`, time:c.created_at }))

  return <div className="space-y-6 animate-fade-in">
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard icon={FolderOpen} label="Total cases" value={cases.length} color="bg-primary-50 text-primary-600"/>
      <StatCard icon={Activity} label="In treatment" value={inTreatment} color="bg-teal-50 text-teal-600" sub="Active patients"/>
      <StatCard icon={AlertCircle} label="Awaiting approval" value={awaitingApproval} color="bg-amber-50 text-amber-600" sub="Needs attention"/>
      <StatCard icon={FlaskConical} label="Lab orders" value={labOrders.length} color="bg-purple-50 text-purple-600" sub="In production"/>
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
        {casesLoading?<div className="flex justify-center py-16"><Spinner/></div>:chart.length===0?(
          <p className="text-sm text-ink-400 text-center py-16">No case data yet</p>
        ):(
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chart} margin={{top:4,right:4,left:-24,bottom:0}}>
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
        )}
      </div>
      <div className="card p-5">
        <p className="section-title mb-4">Recent activity</p>
        <div className="space-y-4">
          {activity.length===0 && <p className="text-sm text-ink-400">No recent activity</p>}
          {activity.map(a=>(
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
      {casesLoading?<div className="flex justify-center py-16"><Spinner/></div>:recentCases.length===0?(
        <p className="text-sm text-ink-400 text-center py-16">No cases yet</p>
      ):(
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
          {recentCases.map(c=>{
            const s=STATUS_CONFIG[c.status]
            const name = c.patient?`${c.patient.first_name} ${c.patient.last_name}`:'—'
            return <tr key={c.id} className="table-row cursor-pointer" onClick={()=>navigate(`/cases/${c.id}`)}>
              <td className="px-5 py-3 font-mono text-sm text-ink-700">{c.case_number}</td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <Avatar name={name} size="xs"/>
                  <span className="text-sm">{name}</span>
                </div>
              </td>
              <td className="px-5 py-3 capitalize text-sm text-ink-600">{c.treatment_type}</td>
              <td className="px-5 py-3"><Badge variant={s.color.replace('badge-','')} dot>{s.label}</Badge></td>
              <td className="px-5 py-3 text-sm text-ink-400">{formatRelative(c.updated_at)}</td>
              <td className="px-5 py-3"><button className="btn-ghost btn-sm">Open <ArrowRight size={12}/></button></td>
            </tr>
          })}
        </tbody>
      </table>
      )}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {[
        {label:'Completed',value:completed,icon:CheckCircle,color:'text-teal-600'},
        {label:'Total patients',value:patients.length,icon:Users,color:'text-purple-600'},
        {label:'Awaiting approval',value:awaitingApproval,icon:Clock,color:'text-primary-600'},
        {label:'Lab orders',value:labOrders.length,icon:TrendingUp,color:'text-teal-600'},
      ].map(({label,value,icon:Icon,color})=>(
        <div key={label} className="card p-4 flex items-center gap-3">
          <Icon size={20} className={color}/>
          <div><p className="text-lg font-bold text-ink-900">{value}</p><p className="text-xs text-ink-400">{label}</p></div>
        </div>
      ))}
    </div>
  </div>
}
