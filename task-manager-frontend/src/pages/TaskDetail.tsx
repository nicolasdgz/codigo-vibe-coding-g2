import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import type { Task, TaskStatus, TaskFormData } from '../types/task'
import { getTask, updateTask, deleteTask } from '../services/taskService'
import Dialog from '../components/Dialog'
import TaskForm from '../components/TaskForm'

const STATUS_CONFIG: Record<TaskStatus, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-amber-100 text-amber-700' },
  'in-progress': { label: 'In Progress', classes: 'bg-blue-100 text-blue-700' },
  done: { label: 'Done', classes: 'bg-green-100 text-green-700' },
}

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const data = await getTask(id!)
        setTask(data)
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleUpdate = async (data: TaskFormData) => {
    if (!task) return
    setSaving(true)
    try {
      const updated = await updateTask(task.id, data)
      setTask(updated)
      setEditOpen(false)
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!task) return
    setSaving(true)
    try {
      await deleteTask(task.id)
      navigate('/')
    } catch (e) {
      alert((e as Error).message)
      setSaving(false)
    }
  }

  const statusCfg = task ? STATUS_CONFIG[task.status] : null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Back to list"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Task Detail</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {loading && (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-24">
            <p className="text-red-500 font-medium mb-3">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-violet-600 hover:text-violet-700 font-medium underline underline-offset-2"
            >
              Back to list
            </button>
          </div>
        )}

        {task && statusCfg && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <h2
                className={`text-2xl font-bold leading-tight ${
                  task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'
                }`}
              >
                {task.title}
              </h2>
              <span className={`shrink-0 text-sm font-medium px-3 py-1 rounded-full ${statusCfg.classes}`}>
                {statusCfg.label}
              </span>
            </div>

            <div className="text-gray-600 leading-relaxed min-h-[60px]">
              {task.description ? (
                <p>{task.description}</p>
              ) : (
                <p className="text-gray-400 italic text-sm">No description provided.</p>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Created</p>
              <p className="text-sm text-gray-500">
                {new Date(task.created_at).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditOpen(true)}
                className="flex-1 py-2.5 text-sm font-medium text-violet-600 border border-violet-200 rounded-xl hover:bg-violet-50 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                className="flex-1 py-2.5 text-sm font-medium text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </main>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Edit Task">
        {task && (
          <TaskForm
            initial={task}
            onSubmit={handleUpdate}
            onCancel={() => setEditOpen(false)}
            loading={saving}
          />
        )}
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Task">
        {task && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Delete{' '}
              <span className="font-semibold text-gray-900">
                &ldquo;{task.title}&rdquo;
              </span>
              ? This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
