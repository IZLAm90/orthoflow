import { create } from 'zustand'
import { persist } from 'zustand/middleware'
export interface AuthUser { id:string; name:string; email:string; role:string; status:string; created_at:string }
interface AuthState {
  user: AuthUser|null; token: string|null; isAuthenticated: boolean
  login:(user:AuthUser,token:string)=>void; logout:()=>void
}
export const useAuthStore = create<AuthState>()(persist((set)=>({
  user:null, token:null, isAuthenticated:false,
  login:(user,token)=>{ localStorage.setItem('access_token',token); set({user,token,isAuthenticated:true}) },
  logout:()=>{ localStorage.removeItem('access_token'); set({user:null,token:null,isAuthenticated:false}) }
}),{name:'auth',partialize:(s)=>({user:s.user,token:s.token,isAuthenticated:s.isAuthenticated})}))
