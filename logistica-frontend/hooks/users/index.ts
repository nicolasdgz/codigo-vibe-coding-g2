import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryClient } from '@/lib/query-client'
import {
  getMe,
  updateMe,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  getPermissions,
} from '@/services/users'
import type { UserListParams, UserWritePayload, UserUpdatePayload, GroupWritePayload } from '@/types/users'

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => getMe(),
  })
}

export function useUpdateMe() {
  return useMutation({
    mutationFn: (payload: { email?: string; password?: string }) => updateMe(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      toast.success('Perfil actualizado')
    },
    onError: () => {
      toast.error('No se pudo actualizar el perfil')
    },
  })
}

export function useUsers(params: UserListParams = {}) {
  return useQuery({
    queryKey: ['users', 'list', params],
    queryFn: () => getUsers(params),
  })
}

export function useCreateUser() {
  return useMutation({
    mutationFn: (payload: UserWritePayload) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] })
      toast.success('Usuario creado correctamente')
    },
    onError: () => {
      toast.error('No se pudo crear el usuario')
    },
  })
}

export function useUpdateUser() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UserUpdatePayload }) =>
      updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] })
      toast.success('Usuario actualizado')
    },
    onError: () => {
      toast.error('No se pudo actualizar el usuario')
    },
  })
}

export function useDeleteUser() {
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] })
      toast.success('Usuario eliminado')
    },
    onError: () => {
      toast.error('No se pudo eliminar el usuario')
    },
  })
}

export function useGroups() {
  return useQuery({
    queryKey: ['groups', 'list'],
    queryFn: () => getGroups(),
  })
}

export function useGroup(id: number) {
  return useQuery({
    queryKey: ['groups', id],
    queryFn: () => getGroup(id),
    enabled: id > 0,
  })
}

export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => getPermissions(),
  })
}

export function useCreateGroup() {
  return useMutation({
    mutationFn: (payload: GroupWritePayload) => createGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('Rol creado correctamente')
    },
    onError: () => {
      toast.error('No se pudo crear el rol')
    },
  })
}

export function useUpdateGroup() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: GroupWritePayload }) =>
      updateGroup(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groups', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['groups', variables.id] })
      toast.success('Rol actualizado')
    },
    onError: () => {
      toast.error('No se pudo actualizar el rol')
    },
  })
}

export function useDeleteGroup() {
  return useMutation({
    mutationFn: (id: number) => deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('Rol eliminado')
    },
    onError: () => {
      toast.error('No se pudo eliminar el rol')
    },
  })
}
