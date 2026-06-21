import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stethoscope, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

export default function Login(){
  const navigate=useNavigate()
  const {login}=useAuthStore()
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [showPw,setShowPw]=useState(false)
  const [loading,setLoading]=useState(false)
  const handleLogin=async(e:any)=>{
    e.preventDefault(); setLoading(true)
    await new Promise(r=>setTimeout(r,600))
    login({id:'u1',name:'Admin Islam',email,role:'admin',createdAt:new Date().toISOString()},'mock_token')
    navigate('/')
  }
  return <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-teal-900 flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-white/10 items-center justify-center mb-4 border border-white/20">
          <Stethoscope size={28} className="text-white"/>
        </div>
        <h1 className="text-2xl font-bold text-white">OrthoFlow</h1>
        <p className="text-primary-300 text-sm mt-1">3D Orthodontics Treatment Platform</p>
      </div>
      <div className="bg-white rounded-2xl p-8 shadow-float">
        <h2 className="text-lg font-semibold text-ink-900 mb-1">Welcome back</h2>
        <p className="text-sm text-ink-500 mb-6">Sign in to your clinic account</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="your@clinic.com" value={email} onChange={e=>setEmail(e.target.value)} required/>
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input type={showPw?'text':'password'} className="input pr-10" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required/>
              <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">
                {showPw?<EyeOff size={15}/>:<Eye size={15}/>}
              </button>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
            {loading?'Signing in…':'Sign in'}
          </button>
        </form>
        <p className="text-xs text-center text-ink-400 mt-4">Any email + any password works in demo mode</p>
      </div>
      <p className="text-center text-xs text-primary-400 mt-6">HIPAA compliant · End-to-end encrypted</p>
    </div>
  </div>
}
