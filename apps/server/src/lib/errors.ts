export function httpError(statusCode: number, message: string) {
  const err = new Error(message)
  ;(err as any).statusCode = statusCode
  return err
}
