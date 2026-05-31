import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, ClipboardCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { registerUser, loginUser } from '../services/authService'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Fields {
  name: string
  lastname: string
  email: string
  password: string
  confirm: string
}

interface Touched {
  name: boolean
  lastname: boolean
  email: boolean
  password: boolean
  confirm: boolean
}

function validate(fields: Fields) {
  const errors: Partial<Record<keyof Fields, string>> = {}
  if (fields.name.trim().length < 2) errors.name = 'Min 2 characters'
  if (fields.name.trim().length > 100) errors.name = 'Max 100 characters'
  if (fields.lastname.trim().length < 2) errors.lastname = 'Min 2 characters'
  if (fields.lastname.trim().length > 100) errors.lastname = 'Max 100 characters'
  if (!EMAIL_REGEX.test(fields.email)) errors.email = 'Enter a valid email address'
  if (fields.email.length > 255) errors.email = 'Max 255 characters'
  if (fields.password.length < 6) errors.password = 'Min 6 characters'
  if (fields.confirm !== fields.password) errors.confirm = 'Passwords do not match'
  return errors
}

export default function Register() {
  const { setAuth } = useAuth()
  const navigate = useNavigate()

  const [fields, setFields] = useState<Fields>({
    name: '',
    lastname: '',
    email: '',
    password: '',
    confirm: '',
  })
  const [touched, setTouched] = useState<Touched>({
    name: false,
    lastname: false,
    email: false,
    password: false,
    confirm: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const errors = validate(fields)
  const hasErrors = Object.keys(errors).length > 0
  const canSubmit = !hasErrors && !loading

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields((f) => ({ ...f, [key]: e.target.value }))
    setTouched((t) => ({ ...t, [key]: true }))
  }

  const blur = (key: keyof Fields) => () => setTouched((t) => ({ ...t, [key]: true }))

  const fieldClass = (key: keyof Fields) =>
    `w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
      touched[key] && errors[key]
        ? 'border-red-300 focus:ring-red-400 bg-red-50 text-red-900 placeholder-red-300'
        : 'border-gray-300 focus:ring-violet-500'
    }`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ name: true, lastname: true, email: true, password: true, confirm: true })
    if (hasErrors) return
    setLoading(true)
    setError(null)
    try {
      await registerUser({
        name: fields.name.trim(),
        lastname: fields.lastname.trim(),
        email: fields.email,
        password: fields.password,
      })
      const { token, user } = await loginUser({ email: fields.email, password: fields.password })
      setAuth(token, user)
      navigate('/', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 flex items-center justify-center sm:p-4">
      <div className="bg-white w-full min-h-screen sm:min-h-0 sm:max-w-md sm:rounded-2xl sm:shadow-2xl flex flex-col justify-center px-8 py-12 sm:px-10">

        <div className="mb-8">
          <div className="w-11 h-11 bg-violet-600 rounded-xl flex items-center justify-center mb-5">
            <ClipboardCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="text-sm text-gray-500 mt-1">Start managing your tasks today</p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">First name</label>
              <input
                type="text"
                value={fields.name}
                onChange={set('name')}
                onBlur={blur('name')}
                placeholder="John"
                autoComplete="given-name"
                maxLength={100}
                className={fieldClass('name')}
              />
              {touched.name && errors.name && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Last name</label>
              <input
                type="text"
                value={fields.lastname}
                onChange={set('lastname')}
                onBlur={blur('lastname')}
                placeholder="Doe"
                autoComplete="family-name"
                maxLength={100}
                className={fieldClass('lastname')}
              />
              {touched.lastname && errors.lastname && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.lastname}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={fields.email}
              onChange={set('email')}
              onBlur={blur('email')}
              placeholder="you@example.com"
              autoComplete="email"
              maxLength={255}
              className={fieldClass('email')}
            />
            {touched.email && errors.email && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={fields.password}
                onChange={set('password')}
                onBlur={blur('password')}
                placeholder="Min 6 characters"
                autoComplete="new-password"
                className={`${fieldClass('password')} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {touched.password && errors.password && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={fields.confirm}
                onChange={set('confirm')}
                onBlur={blur('confirm')}
                placeholder="Repeat your password"
                autoComplete="new-password"
                className={`${fieldClass('confirm')} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {touched.confirm && errors.confirm && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.confirm}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-2.5 mt-1 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-violet-600 font-medium hover:text-violet-700 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
