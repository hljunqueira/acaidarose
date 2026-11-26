export interface OpeningDaySchedule {
  open: string;
  close: string;
  closed?: boolean;
}

export type OpeningHoursMap = Record<string, OpeningDaySchedule> | null | undefined;

export interface StoreOpenStatus {
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
  closedToday?: boolean;
}

const WEEKDAY_MAP: Record<string, string> = {
  Sun: 'dom',
  Mon: 'seg',
  Tue: 'ter',
  Wed: 'qua',
  Thu: 'qui',
  Fri: 'sex',
  Sat: 'sab',
};

export function getStoreOpenStatus(openingHours: OpeningHoursMap): StoreOpenStatus | null {
  if (!openingHours || typeof openingHours !== 'object') return null;

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Lisbon',
      hour: 'numeric',
      minute: 'numeric',
      weekday: 'short',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const weekdayPart = parts.find((p) => p.type === 'weekday')?.value || 'Mon';
    const dayKey = WEEKDAY_MAP[weekdayPart] || 'seg';
    const today = openingHours[dayKey];

    if (!today || today.closed) {
      return { isOpen: false, closedToday: true };
    }

    const hourPart = Number(parts.find((p) => p.type === 'hour')?.value) || 0;
    const minutePart = Number(parts.find((p) => p.type === 'minute')?.value) || 0;
    const currentMinutes = hourPart * 60 + minutePart;

    const [openH, openM] = (today.open || '12:00').split(':').map(Number);
    const [closeH, closeM] = (today.close || '22:00').split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    return {
      isOpen: currentMinutes >= openMinutes && currentMinutes <= closeMinutes,
      openTime: today.open,
      closeTime: today.close,
      closedToday: false,
    };
  } catch {
    return null;
  }
}
