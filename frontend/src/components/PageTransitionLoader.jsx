import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function PageTransitionLoader() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    const timer = setTimeout(() => {
      if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
      else window.scrollTo(0, 0)
    }, 0)
    return () => clearTimeout(timer)
  }, [pathname, hash])
  return null
}
