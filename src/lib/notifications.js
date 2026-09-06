import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const notificationTimers = new Map();

export const isAndroid = () => Capacitor.getPlatform() === 'android';
const androidNotifications = isAndroid;

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestNotificationPermission() {
  if (androidNotifications()) {
    const permission = await LocalNotifications.requestPermissions();
    return permission.display === 'granted' ? 'granted' : permission.display;
  }
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission === 'default') return Notification.requestPermission();
  return Notification.permission;
}

export function notify(title, options = {}) {
  if (androidNotifications()) {
    LocalNotifications.schedule({ notifications: [{ id: Math.floor(Date.now() % 2147483647), title, body: options.body || '', schedule: { at: new Date(Date.now() + 1000) }, extra: { tag: options.tag || 'orbit' } }] });
    return true;
  }
  if (!notificationsSupported() || Notification.permission !== 'granted') return false;
  new Notification(title, { icon: '/vite.svg', ...options });
  return true;
}

export function scheduleNotification({ id, title, body, at }) {
  if (!id || !at) return false;
  const delay = new Date(at).getTime() - Date.now();
  if (delay <= 0 || delay > 2147483647) return false;
  if (notificationTimers.has(id)) clearTimeout(notificationTimers.get(id));
  const timer = window.setTimeout(() => {
    notify(title, { body, tag: id });
    notificationTimers.delete(id);
  }, delay);
  notificationTimers.set(id, timer);
  return true;
}

export async function scheduleTaskNotifications(tasks, events) {
  if (androidNotifications()) {
    const permission = await LocalNotifications.checkPermissions();
    if (permission.display !== 'granted') return 0;
    const notifications = [...tasks, ...events].filter((item) => !item.done && item.time).map((item) => ({
      id: Math.floor(Number(item.id) % 2147483647),
      title: item.type === 'event' ? `Event: ${item.title}` : `Task: ${item.title}`,
      body: item.type === 'event' ? 'Your scheduled event starts now.' : 'Your planned task starts now.',
      schedule: { at: new Date(`${item.date || getDateString()}T${item.time}:00`), allowWhileIdle: true },
      smallIcon: 'ic_stat_orbit',
    }));
    if (notifications.length) await LocalNotifications.schedule({ notifications });
    return notifications.length;
  }
  if (!notificationsSupported() || Notification.permission !== 'granted') return 0;
  let scheduled = 0;
  [...tasks, ...events].forEach((item) => {
    if (item.done || !item.time) return;
    const at = new Date(`${item.date || getDateString()}T${item.time}:00`);
    if (scheduleNotification({
      id: `orbit-${item.id}`,
      title: item.type === 'event' ? `Event: ${item.title}` : `Task: ${item.title}`,
      body: item.type === 'event' ? 'Your scheduled event starts now.' : 'Your planned task starts now.',
      at,
    })) scheduled += 1;
  });
  return scheduled;
}

export function getDateString(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function sendDailySummary(tasks, events) {
  const hour = new Date().getHours();
  const tomorrowItems = [...tasks, ...events].filter((item) => item.date === getDateString(1) && !item.done);
  const todayItems = [...tasks, ...events].filter((item) => item.date === getDateString(0) && !item.done);
  if (hour >= 18 && tomorrowItems.length) {
    notify('Tomorrow in Orbit', { body: `${tomorrowItems.length} planned item${tomorrowItems.length === 1 ? '' : 's'} waiting for you.` });
    return 'tomorrow';
  }
  if (hour < 11 && todayItems.length) {
    notify('Good morning from Orbit', { body: `${todayItems.length} item${todayItems.length === 1 ? '' : 's'} planned for today.` });
    return 'today';
  }
  return null;
}
