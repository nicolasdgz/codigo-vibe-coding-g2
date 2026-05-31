import { Link } from 'react-router-dom'
import type { Task, TaskStatus } from '../types/task'

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-amber-100 text-amber-700' },
  'in-progress': { label: 'In Progress', classes: 'bg-blue-100 text-blue-700' },
  done: { label: 'Done', classes: 'bg-green-100 text-green-700' },
}

export default function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const date = new Date(task.created_at).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const statusCfg = STATUS_CONFIG[task.status]

  return (
    <div
      className={`bg-white rounded-xl border flex flex-col gap-3 p-4 hover:shadow-md transition-all ${
        task.status === 'done' ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link to={`/tasks/${task.id}`} className="flex-1 min-w-0">
          <h3
            className={`font-semibold leading-snug hover:text-violet-600 transition-colors line-clamp-2 ${
              task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'
            }`}
          >
            {task.title}
          </h3>
        </Link>
        <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${statusCfg.classes}`}>
          {statusCfg.label}
        </span>
      </div>

      {task.description && (
        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">{date}</span>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(task)}
            className="text-xs px-3 py-1.5 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(task)}
            className="text-xs px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
