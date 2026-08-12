import { api } from './client'

export interface Profile {
  Cid: number
  Cname: string
  email: string
  createdAt: string
}

export async function login(email: string, password: string): Promise<string> {
  const data = await api.post<{ Cname: string }>('/api/auth/login', { email, password })
  return data.Cname
}

export async function register(Cname: string, email: string, Cpwd: string): Promise<void> {
  await api.post('/api/auth/register', { Cname, email, Cpwd })
}

export async function logout(): Promise<void> {
  await api.post('/api/auth/logout')
}

export async function me(): Promise<Profile> {
  const data = await api.get<{ user: Profile }>('/api/auth/me')
  return data.user
}
