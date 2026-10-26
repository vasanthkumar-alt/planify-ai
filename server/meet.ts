/**
 * Google Meet and Calendar link utility for Planify AI
 */

export function generateMeetCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const part = (len: number) => {
    let res = '';
    for (let i = 0; i < len; i++) {
      res += chars[Math.floor(Math.random() * chars.length)];
    }
    return res;
  };
  return `${part(3)}-${part(4)}-${part(3)}`;
}

export function generateMeetLink(): string {
  return `https://meet.google.com/${generateMeetCode()}`;
}

/**
 * Generates a randomized meeting time within working hours (10:00 AM - 5:00 PM)
 * 3 to 7 days from the base date, avoiding weekends
 */
export function generateRandomMeetingTime(baseDate?: string): { iso: string; formatted: string } {
  const date = baseDate ? new Date(baseDate) : new Date();
  if (isNaN(date.getTime())) {
    date.setTime(Date.now());
  }

  // Add random days between 3 and 7 days
  const randomDays = Math.floor(Math.random() * 5) + 3;
  date.setDate(date.getDate() + randomDays);

  // If Saturday (6) or Sunday (0), push to Monday
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 6) {
    date.setDate(date.getDate() + 2);
  } else if (dayOfWeek === 0) {
    date.setDate(date.getDate() + 1);
  }

  // Random business hour: 10:00, 11:00, 11:30, 14:00, 15:00, 16:00
  const possibleHours = [10, 11, 13, 14, 15, 16];
  const possibleMinutes = [0, 15, 30, 45];
  const hour = possibleHours[Math.floor(Math.random() * possibleHours.length)];
  const minute = possibleMinutes[Math.floor(Math.random() * possibleMinutes.length)];

  date.setHours(hour, minute, 0, 0);

  const formatted = date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return {
    iso: date.toISOString(),
    formatted,
  };
}

export function generateCalendarLink(
  title: string,
  description: string,
  scheduledDate: string,
  meetLink: string,
  durationMinutes: number = 45
): string {
  try {
    const startDate = new Date(scheduledDate);
    const validStart = isNaN(startDate.getTime()) ? new Date(Date.now() + 86400000 * 5) : startDate;
    const endDate = new Date(validStart.getTime() + durationMinutes * 60 * 1000);

    const formatIsoForCal = (d: Date) =>
      d.toISOString().replace(/-|:|\.\d\d\d/g, '');

    const datesParam = `${formatIsoForCal(validStart)}/${formatIsoForCal(endDate)}`;
    const fullDesc = `${description}\n\nJoin Google Meet (Hosted by Admin): ${meetLink}\nAutomated by Planify AI`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&dates=${datesParam}&details=${encodeURIComponent(fullDesc)}&location=${encodeURIComponent(
      meetLink
    )}`;
  } catch (e) {
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}`;
  }
}

