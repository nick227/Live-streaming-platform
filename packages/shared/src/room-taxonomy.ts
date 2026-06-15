export const ROOM_CATEGORIES = ['MALE', 'FEMALE', 'COUPLES', 'TRANS'] as const
export type RoomCategory = (typeof ROOM_CATEGORIES)[number]

export const ROOM_CATEGORY_SLUGS: Record<RoomCategory, string> = {
  MALE: 'male',
  FEMALE: 'female',
  COUPLES: 'couples',
  TRANS: 'trans',
}

export const ROOM_CATEGORY_LABELS: Record<RoomCategory, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  COUPLES: 'Couples',
  TRANS: 'Trans',
}

const slugToCategory = new Map(
  Object.entries(ROOM_CATEGORY_SLUGS).map(([value, slug]) => [slug, value as RoomCategory]),
)

export function categorySlugToEnum(slug: string): RoomCategory | null {
  return slugToCategory.get(slug.toLowerCase()) ?? null
}

export function categoryEnumToSlug(value: RoomCategory): string {
  return ROOM_CATEGORY_SLUGS[value]
}

export function isRoomCategory(value: string): value is RoomCategory {
  return (ROOM_CATEGORIES as readonly string[]).includes(value)
}

export const MAX_ROOM_TAGS = 10

export const BROWSE_RESERVED_SEGMENTS = ['c', 'country', 't', 'search'] as const
