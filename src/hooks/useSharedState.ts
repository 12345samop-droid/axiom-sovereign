"use client"

import { useState, useEffect } from 'react'
import { sharedState } from '@/lib/yjs'

export function useSharedState(key: string, defaultValue: any) {
  const [value, setValue] = useState(sharedState.get(key) ?? defaultValue)

  useEffect(() => {
    const observe = () => {
      setValue(sharedState.get(key) ?? defaultValue)
    }
    sharedState.observe(observe)
    return () => sharedState.unobserve(observe)
  }, [key, defaultValue])

  const setSharedValue = (newValue: any) => {
    sharedState.set(key, newValue)
  }

  return [value, setSharedValue] as const
}
