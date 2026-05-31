export type TaskStatus = 'pending' | 'in-progress' | 'done'

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  created_at: string
  userId: string | null
}

export interface TaskFormData {
  title: string
  description: string
  status: TaskStatus
}
