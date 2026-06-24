'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from './input'

interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange: (value: string) => void
  delay?: number
}

export function DebouncedInput({ value: externalValue, onChange, delay = 400, ...props }: DebouncedInputProps) {
  const [localValue, setLocalValue] = useState(externalValue)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLocalValue(externalValue)
  }, [externalValue])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setLocalValue(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange(val), delay)
  }

  return <Input {...props} value={localValue} onChange={handleChange} />
}
