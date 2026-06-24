'use client'

import { useState } from 'react'
import axios from 'axios'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { QueryError } from '@/components/ui/query-error'
import { UsersTable } from '@/components/users/UsersTable'
import { UserForm } from '@/components/users/UserForm'
import { UserDeleteDialog } from '@/components/users/UserDeleteDialog'
import { useUsers, useCreateUser, useUpdateUser, useGroups } from '@/hooks/users'
import type { User, UserWritePayload, UserUpdatePayload } from '@/types/users'

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [createApiErrors, setCreateApiErrors] = useState<Partial<Record<string, string>> | undefined>()
  const [editApiErrors, setEditApiErrors] = useState<Partial<Record<string, string>> | undefined>()

  const { data, isLoading, isError, refetch } = useUsers({ page })
  const { data: groupsData } = useGroups()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()

  const groups = groupsData?.results ?? []

  function handleCreateSubmit(payload: UserWritePayload) {
    setCreateApiErrors(undefined)
    createUser.mutate(payload, {
      onSuccess: () => {
        setCreateOpen(false)
        setCreateApiErrors(undefined)
      },
      onError: (err) => {
        if (axios.isAxiosError(err) && err.response?.status === 400) {
          const data = err.response.data as Record<string, string | string[]>
          setCreateApiErrors(
            Object.fromEntries(
              Object.entries(data).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
            )
          )
        }
      },
    })
  }

  function handleEditSubmit(payload: UserUpdatePayload) {
    if (!editTarget) return
    setEditApiErrors(undefined)
    updateUser.mutate(
      { id: editTarget.id, payload },
      {
        onSuccess: () => {
          setEditTarget(null)
          setEditApiErrors(undefined)
        },
        onError: (err) => {
          if (axios.isAxiosError(err) && err.response?.status === 400) {
            const data = err.response.data as Record<string, string | string[]>
            setEditApiErrors(
              Object.fromEntries(
                Object.entries(data).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
              )
            )
          }
        },
      }
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de usuarios y roles del sistema
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon />
          Nuevo usuario
        </Button>
      </div>

      {isError && (
        <QueryError message="Error al cargar los usuarios." onRetry={refetch} />
      )}

      <UsersTable
        data={data?.results ?? []}
        total={data?.count ?? 0}
        page={page}
        onPageChange={setPage}
        isLoading={isLoading}
        onEdit={setEditTarget}
        onDelete={setDeleteTarget}
      />

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nuevo usuario</SheetTitle>
          </SheetHeader>
          <UserForm
            mode="create"
            groups={groups}
            onSubmit={handleCreateSubmit}
            isSubmitting={createUser.isPending}
            apiErrors={createApiErrors}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={editTarget !== null} onOpenChange={(open) => { if (!open) setEditTarget(null) }}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar usuario</SheetTitle>
          </SheetHeader>
          {editTarget && (
            <UserForm
              mode="edit"
              groups={groups}
              defaultValues={{
                email: editTarget.email,
                is_active: editTarget.is_active,
                is_staff: editTarget.is_staff,
              }}
              currentGroupNames={editTarget.groups}
              onSubmit={handleEditSubmit}
              isSubmitting={updateUser.isPending}
              apiErrors={editApiErrors}
            />
          )}
        </SheetContent>
      </Sheet>

      {deleteTarget && (
        <UserDeleteDialog
          userId={deleteTarget.id}
          username={deleteTarget.username}
          open={deleteTarget !== null}
          onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
          onDeleted={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
