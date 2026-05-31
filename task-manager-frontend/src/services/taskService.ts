import type { Task, TaskFormData } from '../types/task'

const BASE_URL = 'http://localhost:3000/tasks'
const STORAGE_KEY = 'tm_auth'

function getToken(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as { token: string }).token : ''
  } catch {
    return ''
  }
}

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    localStorage.removeItem(STORAGE_KEY)
    window.location.href = '/login'
    throw new Error('Session expired')
  }
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

export async function getTasks(): Promise<Task[]> {
  const res = await fetch(BASE_URL, { headers: authHeaders() })
  return handleResponse<Task[]>(res)
}

export async function getTask(id: string): Promise<Task> {
  const res = await fetch(`${BASE_URL}/${id}`, { headers: authHeaders() })
  return handleResponse<Task>(res)
}

export async function createTask(data: TaskFormData): Promise<Task> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse<Task>(res)
}

export async function updateTask(id: string, data: TaskFormData): Promise<Task> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse<Task>(res)
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (res.status === 401) {
    localStorage.removeItem(STORAGE_KEY)
    window.location.href = '/login'
    return
  }
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
}
