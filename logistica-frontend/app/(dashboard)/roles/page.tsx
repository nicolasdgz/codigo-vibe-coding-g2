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
import { RolesTable } from '@/components/roles/RolesTable'
import { RoleForm } from '@/components/roles/RoleForm'
import { RoleDeleteDialog } from '@/components/roles/RoleDeleteDialog'
import { useGroups, useGroup, useCreateGroup, useUpdateGroup, usePermissions } from '@/hooks/users'
import type { Group, GroupWritePayload } from '@/types/users'

export default function RolesPage() {
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Group | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null)
  const [createApiErrors, setCreateApiErrors] = useState<Partial<Record<string, string>> | undefined>()
  const [editApiErrors, setEditApiErrors] = useState<Partial<Record<string, string>> | undefined>()

  const { data: groupsData, isLoading, isError, refetch } = useGroups()
  const { data: editGroupDetail, isLoading: isLoadingDetail } = useGroup(editTarget?.id ?? 0)
  const { data: permissions = [] } = usePermissions()
  const createGroup = useCreateGroup()
  const updateGroup = useUpdateGroup()

  function handleCreateSubmit(payload: GroupWritePayload) {
    setCreateApiErrors(undefined)
    createGroup.mutate(payload, {
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

  function handleEditSubmit(payload: GroupWritePayload) {
    if (!editTarget) return
    setEditApiErrors(undefined)
    updateGroup.mutate(
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

  const groups = groupsData?.results ?? []
  const total = groupsData?.count ?? 0

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Roles</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de roles y permisos del sistema
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon />
          Nuevo rol
        </Button>
      </div>

      {isError && (
        <QueryError message="Error al cargar los roles." onRetry={refetch} />
      )}

      <RolesTable
        data={groups}
        total={total}
        page={page}
        onPageChange={setPage}
        isLoading={isLoading}
        onEdit={setEditTarget}
        onDelete={setDeleteTarget}
      />

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nuevo rol</SheetTitle>
          </SheetHeader>
          <RoleForm
            permissions={permissions}
            onSubmit={handleCreateSubmit}
            isSubmitting={createGroup.isPending}
            apiErrors={createApiErrors}
          />
        </SheetContent>
      </Sheet>

      <Sheet
        open={editTarget !== null}
        onOpenChange={(open) => { if (!open) setEditTarget(null) }}
      >
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar rol</SheetTitle>
          </SheetHeader>
          {editTarget && (
            isLoadingDetail ? (
              <div className="p-4 text-sm text-muted-foreground">Cargando...</div>
            ) : (
              <RoleForm
                defaultValues={editGroupDetail}
                permissions={permissions}
                onSubmit={handleEditSubmit}
                isSubmitting={updateGroup.isPending}
                apiErrors={editApiErrors}
              />
            )
          )}
        </SheetContent>
      </Sheet>

      {deleteTarget && (
        <RoleDeleteDialog
          groupId={deleteTarget.id}
          groupName={deleteTarget.name}
          open={deleteTarget !== null}
          onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
          onDeleted={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
