import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stethoscope, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { api } from '../lib/api'
import { cn } from '../lib/utils'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login(){
  const navigate=useNavigate()
  const {login}=useAuthStore()
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [showPw,setShowPw]=useState(false)
  const [loading,setLoading]=useState(false)
  const [touched,setTouched]=useState<{email?:boolean;password?:boolean}>({})
  const [submitted,setSubmitted]=useState(false)
  const [serverError,setServerError]=useState<string|null>(null)

  const emailRequiredError = (submitted||touched.email) && !email ? 'Email is required' : null
  const emailFormatError = !emailRequiredError && (submitted||touched.email) && email && !EMAIL_RE.test(email) ? 'Email must be a valid email address' : null
  const emailError = emailRequiredError || emailFormatError
  const passwordError = (submitted||touched.password) && !password ? 'Password is required' : null
  const hasClientErrors = !!(emailError || passwordError)

  const handleLogin=async(e:any)=>{
    e.preventDefault()
    setSubmitted(true)
    setServerError(null)
    if(!email || !password || !EMAIL_RE.test(email)) return
    setLoading(true)
    try{
      const { data } = await api.post('/auth/login', { email, password })
      login(data.user, data.access_token)
      navigate('/')
    }catch(err:any){
      setServerError(err?.response?.data?.detail || 'Incorrect email or password')
      setPassword('')
    }finally{
      setLoading(false)
    }
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
        {serverError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle size={16} className="flex-shrink-0"/>
            {serverError}
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <div>
            <label className="label">Email</label>
            <input
              type="text"
              className={cn('input', emailError && 'border-red-500 focus:ring-red-500')}
              placeholder="your@clinic.com"
              value={email}
              onChange={e=>{setEmail(e.target.value); setServerError(null)}}
              onBlur={()=>setTouched(t=>({...t, email:true}))}
              aria-invalid={!!emailError}
            />
            {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                type={showPw?'text':'password'}
                className={cn('input pr-10', passwordError && 'border-red-500 focus:ring-red-500')}
                placeholder="••••••••"
                value={password}
                onChange={e=>{setPassword(e.target.value); setServerError(null)}}
                onBlur={()=>setTouched(t=>({...t, password:true}))}
                aria-invalid={!!passwordError}
              />
              <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">
                {showPw?<EyeOff size={15}/>:<Eye size={15}/>}
              </button>
            </div>
            {passwordError && <p className="mt-1 text-xs text-red-600">{passwordError}</p>}
          </div>
          <button type="submit" className="btn-primary w-full justify-center" disabled={loading || (submitted && hasClientErrors)}>
            {loading?'Signing in…':'Sign in'}
          </button>
        </form>
      </div>
      <p className="text-center text-xs text-primary-400 mt-6">HIPAA compliant · End-to-end encrypted</p>
    </div>
  </div>
}
