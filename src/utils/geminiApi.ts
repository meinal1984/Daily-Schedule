import { ScheduleItem, LetterheadConfig, ScheduleDocument } from '../types';

export interface GeminiStatus {
  available: boolean;
  models: {
    complex: string;
    general: string;
    fast: string;
  };
}

export interface ParsedScheduleResult {
  title?: string;
  date?: string;
  subject?: string;
  docHeading?: string;
  officeName?: string;
  branchName?: string;
  items: Array<{
    serialNo?: string;
    dateAndDay?: string;
    timeOnly?: string;
    venue?: string;
    description?: string;
    chairperson?: string;
    remarks?: string;
    priority?: 'high' | 'medium' | 'low';
  }>;
}

export interface FormalizedScheduleResult {
  formalizedItems: ScheduleItem[];
  improvementsList: string[];
  executiveSummary?: string;
}

export interface SmartSortResult {
  sortedItems: ScheduleItem[];
  hasConflicts: boolean;
  conflicts: Array<{
    itemIds?: string[];
    message: string;
  }>;
  suggestions: string[];
}

export async function checkGeminiStatus(): Promise<GeminiStatus> {
  try {
    const res = await fetch('/api/gemini/status');
    if (!res.ok) return { available: false, models: { complex: 'gemini-3.1-pro-preview', general: 'gemini-3.5-flash', fast: 'gemini-3.1-flash-lite' } };
    return await res.json();
  } catch {
    return { available: false, models: { complex: 'gemini-3.1-pro-preview', general: 'gemini-3.5-flash', fast: 'gemini-3.1-flash-lite' } };
  }
}

export async function parseScheduleWithGemini(
  text: string,
  defaultDate?: string,
  model = 'gemini-3.5-flash'
): Promise<ParsedScheduleResult> {
  const res = await fetch('/api/gemini/parse-schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, defaultDate, model }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error || 'Failed to parse schedule text with Gemini.');
  }

  return data.data || data;
}

export async function formalizeScheduleWithGemini(
  items: ScheduleItem[],
  letterhead: LetterheadConfig,
  model = 'gemini-3.5-flash'
): Promise<FormalizedScheduleResult> {
  const res = await fetch('/api/gemini/formalize-schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, letterhead, model }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error || 'Failed to formalize schedule with Gemini.');
  }

  return data.data || data;
}

export async function smartSortScheduleWithGemini(
  items: ScheduleItem[],
  model = 'gemini-3.1-flash-lite'
): Promise<SmartSortResult> {
  const res = await fetch('/api/gemini/smart-sort', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, model }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error || 'Failed to sort schedule with Gemini.');
  }

  return data.data || data;
}

export async function generateBriefingWithGemini(
  items: ScheduleItem[],
  letterhead: LetterheadConfig,
  formatType: 'meeting_notice' | 'executive_summary' | 'chairperson_speech' | 'press_release',
  model = 'gemini-3.5-flash'
): Promise<{ document: string; formatType: string }> {
  const res = await fetch('/api/gemini/generate-briefing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, letterhead, formatType, model }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error || 'Failed to generate briefing with Gemini.');
  }

  return data;
}

export async function refineItemWithGemini(
  item: ScheduleItem,
  action: 'formalize' | 'expand' | 'speech_talking_points' | 'conflict_check' = 'formalize',
  model = 'gemini-3.1-flash-lite'
): Promise<Partial<ScheduleItem>> {
  const res = await fetch('/api/gemini/refine-item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item, action, model }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error || 'Failed to refine schedule item with Gemini.');
  }

  return data.data || {};
}

export async function chatWithGeminiAssistant(
  message: string,
  context: { items: ScheduleItem[]; letterhead: LetterheadConfig; title?: string; date?: string },
  history: Array<{ role: string; text: string }> = [],
  model = 'gemini-3.5-flash'
): Promise<string> {
  const res = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context, history, model }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error || 'Failed to communicate with Gemini assistant.');
  }

  return data.reply || '';
}
