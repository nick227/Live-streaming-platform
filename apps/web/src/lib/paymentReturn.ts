import type { Location } from 'react-router-dom'

export const TOKEN_PACK_RETURN_TO_KEY = 'streamyolo.tokenPacks.returnTo'

type RouteTarget = {
  pathname: string
  search?: string
  hash?: string
}

export function routeToString(target: RouteTarget) {
  return `${target.pathname}${target.search ?? ''}${target.hash ?? ''}`
}

export function getTokenPackReturnTarget(location: Location, fallback = '/rooms') {
  const from = location.state?.from as RouteTarget | string | undefined
  const target = typeof from === 'string' ? from : from ? routeToString(from) : ''

  if (target && isSafeTokenPackReturnTarget(target)) {
    return target
  }

  const storedTarget = sessionStorage.getItem(TOKEN_PACK_RETURN_TO_KEY) ?? ''
  return isSafeTokenPackReturnTarget(storedTarget) ? storedTarget : fallback
}

export function rememberTokenPackReturnTarget(target: string) {
  if (isSafeTokenPackReturnTarget(target)) {
    sessionStorage.setItem(TOKEN_PACK_RETURN_TO_KEY, target)
  }
}

function isSafeTokenPackReturnTarget(target: string) {
  return (
    target.startsWith('/') &&
    !target.startsWith('//') &&
    !target.startsWith('/token-packs') &&
    !target.startsWith('/payments/')
  )
}
