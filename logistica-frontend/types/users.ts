export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_superuser: boolean
  is_staff: boolean
  is_active: boolean
  groups: string[]
  permissions: string[]
  date_joined: string
}

export interface Permission {
  id: number
  name: string
  codename: string
  app_label: string
  model: string
}

export interface Group {
  id: number
  name: string
}

export interface GroupDetail {
  id: number
  name: string
  permissions: Permission[]
}

export interface GroupWritePayload {
  name?: string
  permissions?: number[]
}

export interface UserWritePayload {
  username: string
  password?: string
  email?: string
  is_staff?: boolean
  groups?: number[]
}

export interface UserUpdatePayload {
  email?: string
  is_active?: boolean
  is_staff?: boolean
  groups?: number[]
}

export interface PaginatedUsers {
  count: number
  next: string | null
  previous: string | null
  results: User[]
}

export interface PaginatedGroups {
  count: number
  next: string | null
  previous: string | null
  results: Group[]
}

export interface UserListParams {
  page?: number
}
