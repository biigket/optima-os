import { mockCalendarEvents, getUserById } from '@/data/mockData';
import StatusBadge from '@/components/ui/StatusBadge';
import { Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react';

export default function CalendarPage() {
  const events = [...mockCalendarEvents].sort(
    (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
        <p className="text-sm text-muted-foreground">Upcoming events and scheduled tasks</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map(event => {
          const owner = getUserById(event.ownerUserId);
          const start = new Date(event.startDateTime);
          const end = new Date(event.endDateTime);
          return (
            <div key={event.calendarEventId} className="rounded-lg border bg-card p-4 space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <CalendarIcon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{event.title}</p>
                    <StatusBadge status={event.departmentOwner} />
                  </div>
                </div>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock size={12} />
                  <span>
                    {start.toLocaleDateString()} {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} />
                    <span>{event.location}</span>
                  </div>
                )}
                <p>Owner: {owner?.name}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
