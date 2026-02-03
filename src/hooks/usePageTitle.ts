import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { primaryItems, secondaryItems } from '../constants/navigation'

export const usePageTitle = () => {
  const location = useLocation()

  const titleMap = useMemo(() => {
    const map: Record<string, string> = {}
    ;[...primaryItems, ...secondaryItems].forEach((item) => {
      map[item.to] = item.label
    })
    return map
  }, [])

  useEffect(() => {
    const path = location.pathname
    let pageTitle = 'Dashboard' // Default

    // Handle exact matches
    if (titleMap[path]) {
      pageTitle = titleMap[path]
    } else {
      // Handle nested routes like /chat/:sessionId
      for (const [key, value] of Object.entries(titleMap)) {
        if (key !== '/' && path.startsWith(key)) {
          pageTitle = value
          break
        }
      }
    }

    document.title = `NextRound.ai | ${pageTitle}`
  }, [location, titleMap])
}
