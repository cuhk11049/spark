import dayjs from 'dayjs';

export function formatDateTime(ts: number) {
  return dayjs.unix(ts).format('MM-DD HH:mm');
}

export function formatClock(ts: number) {
  return dayjs.unix(ts).format('HH:mm');
}
