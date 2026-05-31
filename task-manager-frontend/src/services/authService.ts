import type { AuthUser } from '../context/AuthContext'

const BASE_URL = 'http://localhost:3000'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  lastname: string
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

export async function loginUser(data: LoginPayload): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? 'Invalid credentials')
  }
  return res.json()
}

export async function registerUser(data: RegisterPayload): Promise<{ id: string; email: string; name: string }> {
  const res = await fetch(`${BASE_URL}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? 'Registration failed')
  }
  return res.json()
}
