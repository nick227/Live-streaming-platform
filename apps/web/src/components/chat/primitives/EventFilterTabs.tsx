import { EVENT_FILTERS, type EventFilter } from '../model/eventFilter'

export function EventFilterTabs({
  value,
  onChange,
}: {
  value: EventFilter
  onChange: (filter: EventFilter) => void
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {EVENT_FILTERS.map((filter) => (
        <button
          key={filter}
          type="button"
          onClick={() => onChange(filter)}
          className={
            value === filter
              ? 'h-6 px-2.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-primary text-primary-foreground'
              : 'h-6 px-2.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-muted text-muted-foreground hover:text-foreground transition-colors'
          }
        >
          {filter}
        </button>
      ))}
    </div>
  )
}
