import { apiClient } from '@/lib/axios'
import type {
  User,
  UserWritePayload,
  UserUpdatePayload,
  PaginatedUsers,
  PaginatedGroups,
  UserListParams,
  GroupDetail,
  GroupWritePayload,
  Permission,
} from '@/types/users'

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me/')
  return data
}

export async function updateMe(payload: { email?: string; password?: string }): Promise<User> {
  const { data } = await apiClient.patch<User>('/auth/me/', payload)
  return data
}

export async function getUsers(params: UserListParams = {}): Promise<PaginatedUsers> {
  const { data } = await apiClient.get<PaginatedUsers>('/auth/users/', { params })
  return data
}

export async function createUser(payload: UserWritePayload): Promise<User> {
  const { data } = await apiClient.post<User>('/auth/users/', payload)
  return data
}

export async function updateUser(id: number, payload: UserUpdatePayload): Promise<User> {
  const { data } = await apiClient.patch<User>(`/auth/users/${id}/`, payload)
  return data
}

export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`/auth/users/${id}/`)
}

export async function getGroups(): Promise<PaginatedGroups> {
  const { data } = await apiClient.get<PaginatedGroups>('/auth/groups/')
  return data
}

export async function getGroup(id: number): Promise<GroupDetail> {
  const { data } = await apiClient.get<GroupDetail>(`/auth/groups/${id}/`)
  return data
}

export async function createGroup(payload: GroupWritePayload): Promise<GroupDetail> {
  const { data } = await apiClient.post<GroupDetail>('/auth/groups/', payload)
  return data
}

export async function updateGroup(id: number, payload: GroupWritePayload): Promise<GroupDetail> {
  const { data } = await apiClient.patch<GroupDetail>(`/auth/groups/${id}/`, payload)
  return data
}

export async function deleteGroup(id: number): Promise<void> {
  await apiClient.delete(`/auth/groups/${id}/`)
}

export async function getPermissions(): Promise<Permission[]> {
  const { data } = await apiClient.get<Permission[]>('/auth/permissions/')
  return data
}
