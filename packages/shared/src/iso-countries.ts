import countriesJson from './iso-countries.json'

export type IsoCountry = { code: string; name: string }

export const ISO_COUNTRIES: readonly IsoCountry[] = countriesJson

export const ISO_COUNTRY_CODES: readonly string[] = ISO_COUNTRIES.map((c) => c.code)

export const POPULAR_COUNTRY_CODES: readonly string[] = [
  'US', 'GB', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'BR', 'MX',
  'CO', 'AR', 'PH', 'IN', 'JP', 'KR', 'NL', 'SE', 'PL', 'RO',
]

const codeSet = new Set(ISO_COUNTRY_CODES)
const nameByCode = new Map(ISO_COUNTRIES.map((c) => [c.code, c.name]))

export function isValidCountryCode(code: string): boolean {
  return codeSet.has(code.toUpperCase())
}

export function normalizeCountryCode(code: string): string {
  return code.trim().toUpperCase()
}

export function getCountryName(code: string): string | undefined {
  return nameByCode.get(normalizeCountryCode(code))
}
