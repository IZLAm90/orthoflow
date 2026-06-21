import { BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,LineChart,Line,Legend } from 'recharts'

const M=[
  {month:'Jan',new:18,completed:12,revenue:24000},
  {month:'Feb',new:22,completed:16,revenue:29000},
  {month:'Mar',new:28,completed:19,revenue:36000},
  {month:'Apr',new:24,completed:21,revenue:32000},
  {month:'May',new:31,completed:24,revenue:41000},
  {month:'Jun',new:38,completed:28,revenue:48000},
]
const T=[
  {name:'Aligners',value:68,color:'#28a8fa'},
  {name:'Braces',value:22,color:'#05c4a7'},
  {name:'Retainer',value:6,color:'#f59e0b'},
  {name:'Surgical',value:4,color:'#8b5cf6'},
]

export default function AnalyticsPage(){
  return <div className="space-y-6 animate-fade-in">
    <div><h2 className="section-title">Analytics</h2><p className="text-muted">June 2026</p></div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        {label:'Cases this month',value:'38',delta:'+23%'},
        {label:'Conversion rate',value:'78%',delta:'+4%'},
        {label:'Avg treatment',value:'142d',delta:'-8d'},
        {label:'Revenue',value:'$48k',delta:'+18%'},
      ].map(({label,value,delta})=>(
        <div key={label} className="stat-card">
          <p className="text-2xl font-bold text-ink-900">{value}</p>
          <p className="text-xs text-ink-500 mt-0.5">{label}</p>
          <span className="text-xs font-semibold text-teal-600">{delta} vs last month</span>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="card p-5 lg:col-span-2">
        <p className="section-title mb-4">Monthly case volume</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={M} margin={{left:-20,right:8}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="month" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{borderRadius:8,fontSize:12}}/>
            <Legend wrapperStyle={{fontSize:12}}/>
            <Bar dataKey="new" name="New" fill="#28a8fa" radius={[4,4,0,0]}/>
            <Bar dataKey="completed" name="Completed" fill="#05c4a7" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="card p-5">
        <p className="section-title mb-4">Treatment types</p>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={T} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
              {T.map((e,i)=><Cell key={i} fill={e.color}/>)}
            </Pie>
            <Tooltip formatter={(v:any)=>`${v}%`}/>
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2 mt-2">
          {T.map(t=>(
            <div key={t.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{background:t.color}}/>
                <span className="text-ink-600">{t.name}</span>
              </div>
              <span className="font-semibold text-ink-900">{t.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="card p-5">
      <p className="section-title mb-4">Revenue trend</p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={M} margin={{left:-20,right:8}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
          <XAxis dataKey="month" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
          <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(v:any)=>`$${v/1000}k`}/>
          <Tooltip formatter={(v:any)=>`$${v.toLocaleString()}`} contentStyle={{borderRadius:8,fontSize:12}}/>
          <Line type="monotone" dataKey="revenue" stroke="#28a8fa" strokeWidth={2.5} dot={{fill:'#28a8fa',r:3}} name="Revenue"/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
}
