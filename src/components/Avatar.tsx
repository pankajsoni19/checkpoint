import { useState } from 'react'

interface AvatarProps {
  name?: string | null
  email?: string | null
  picture?: string | null
  size?: number
  title?: string
  className?: string
}

// Renders a user's profile picture, falling back to a gradient monogram when
// there's no picture or the image fails to load (e.g. an expired Google URL).
export function Avatar({ name, email, picture, size = 32, title, className = '' }: AvatarProps) {
  const [failed, setFailed] = useState(false)
  const initial = (name || email || '?').charAt(0).toUpperCase()
  const dimensions = { width: size, height: size }

  if (picture && !failed) {
    return (
      <img
        src={picture}
        alt={name || email || 'User'}
        title={title}
        // Google avatar URLs reject requests that send a referrer.
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        style={dimensions}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <div
      title={title}
      style={{ ...dimensions, fontSize: Math.round(size * 0.4) }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 font-semibold text-white ${className}`}
    >
      {initial}
    </div>
  )
}
