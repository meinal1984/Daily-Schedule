import { ScheduleDocument } from '../types';

const LOCAL_STORAGE_KEY = 'bd_daily_schedules_db_v1';

export async function fetchSchedules(): Promise<ScheduleDocument[]> {
  try {
    const response = await fetch('/api/schedules');
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch (error) {
    console.warn('API fetch failed, falling back to LocalStorage:', error);
  }

  // Fallback to LocalStorage
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse local storage schedules', e);
    }
  }

  return [];
}

export async function saveSchedule(doc: ScheduleDocument): Promise<ScheduleDocument> {
  // Update LocalStorage immediately
  const localSchedules = getLocalSchedules();
  const index = localSchedules.findIndex((item) => item.id === doc.id);
  if (index !== -1) {
    localSchedules[index] = doc;
  } else {
    localSchedules.unshift(doc);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localSchedules));

  // Sync to API
  try {
    const isExisting = index !== -1;
    const url = isExisting ? `/api/schedules/${doc.id}` : '/api/schedules';
    const method = isExisting ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });

    if (res.ok) {
      const savedDoc = await res.json();
      return savedDoc;
    }
  } catch (err) {
    console.warn('Failed to sync schedule to server API:', err);
  }

  return doc;
}

export async function deleteSchedule(id: string): Promise<void> {
  const localSchedules = getLocalSchedules().filter((doc) => doc.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localSchedules));

  try {
    await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('Failed to delete schedule from server API:', err);
  }
}

function getLocalSchedules(): ScheduleDocument[] {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return [];
    }
  }
  return [];
}
