import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, Plus, ClipboardList, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import TaskCard from '../components/TaskCard'
import Dialog from '../components/Dialog'
import TaskForm from '../components/TaskForm'
import type { Task, TaskStatus, TaskFormData } from '../types/task'
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from '../services/taskService'

type FilterValue = 'all' | TaskStatus

interface Filter {
  value: FilterValue
  label: string
}

const FILTERS: Filter[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

export default function TaskList() {
  const { user, clearAuth } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterValue>('all')

  const [createOpen, setCreateOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getTasks()
      setTasks(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = tasks.filter((t) =>
    filter === 'all' ? true : t.status === filter
  )

  const counts: Record<FilterValue, number> = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    'in-progress': tasks.filter((t) => t.status === 'in-progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  }

  const handleCreate = async (data: TaskFormData) => {
    setSaving(true)
    try {
      await createTask(data)
      setCreateOpen(false)
      await load()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (data: TaskFormData) => {
    if (!editTask) return
    setSaving(true)
    try {
      await updateTask(editTask.id, data)
      setEditTask(null)
      await load()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await deleteTask(deleteTarget.id)
      setDeleteTarget(null)
      await load()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Task Manager</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {user && (
              <span className="hidden sm:block text-sm text-gray-500 font-medium truncate max-w-[140px]">
                {user.name}
              </span>
            )}
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Task</span>
              <span className="sm:hidden">New</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg shrink-0">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                  filter === value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
                <span
                  className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    filter === value
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {counts[value]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-24">
            <p className="text-red-500 font-medium mb-2">{error}</p>
            <p className="text-sm text-gray-400 mb-4">Check that your backend is running on localhost:3000</p>
            <button
              onClick={load}
              className="text-sm text-violet-600 hover:text-violet-700 font-medium underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">
              {filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => setCreateOpen(true)}
                className="mt-3 text-sm text-violet-600 hover:text-violet-700 font-medium underline underline-offset-2"
              >
                Create your first task
              </button>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={setEditTask}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </main>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="New Task">
        <TaskForm
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          loading={saving}
        />
      </Dialog>

      <Dialog open={!!editTask} onClose={() => setEditTask(null)} title="Edit Task">
        {editTask && (
          <TaskForm
            initial={editTask}
            onSubmit={handleUpdate}
            onCancel={() => setEditTask(null)}
            loading={saving}
          />
        )}
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Task">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Delete{' '}
              <span className="font-semibold text-gray-900">
                &ldquo;{deleteTarget.title}&rdquo;
              </span>
              ? This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
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
