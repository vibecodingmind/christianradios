import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  Save,
  Radio,
  Sparkles,
  Layers,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  UserCheck,
  Search,
  X,
  RotateCw,
  User,
  Tag,
  Mic,
} from 'lucide-react';
import type { Station, BroadcastScheduleItem } from '../../types';
import { apiFetch } from '../../lib/api';

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const SHOW_TAGS = [
  'Worship & Praise',
  'Sermon & Bible Study',
  'Morning Devotional',
  'Prayer & Intercession',
  'Talk & Youth',
  'Family & Marriage',
  'Gospel Countdown',
  'Night Vigil & Meditations',
  'Community & News',
  'Kids Kingdom',
];

const DEFAULT_SCHEDULE_PRESET: BroadcastScheduleItem[] = [
  // Sunday
  { dayOfWeek: 0, startTime: '06:00', endTime: '08:00', programName: 'Sunday Morning Glory & Devotion', presenter: 'Pastor Emmanuel', description: 'Early morning prayers, scriptures, and uplifting praise to start the Lord\'s Day.' },
  { dayOfWeek: 0, startTime: '08:00', endTime: '11:00', programName: 'Live Sunday Divine Service', presenter: 'Rev. Dr. Grace Mwangi', description: 'Live broadcast of Sunday worship service, choir anthems, and the Word of God.' },
  { dayOfWeek: 0, startTime: '11:00', endTime: '13:00', programName: 'Gospel Celebrations & Praises', presenter: 'Brother Joshua', description: 'Top African & international gospel hits, uplifting testimonies, and listener song requests.' },
  { dayOfWeek: 0, startTime: '13:00', endTime: '15:00', programName: 'Faith & Family Life', presenter: 'Elder & Mrs. Baraka', description: 'Biblical wisdom on Christian family, parenting, marriage, and youth guidance.' },
  { dayOfWeek: 0, startTime: '15:00', endTime: '18:00', programName: 'Gospel Top 20 Weekly Countdown', presenter: 'DJ Faith', description: 'The biggest Christian praise and worship tracks voted by listeners worldwide.' },
  { dayOfWeek: 0, startTime: '18:00', endTime: '21:00', programName: 'Evening Sermon & Scripture Exposition', presenter: 'Guest Evangelists', description: 'Deep theological teachings, verse-by-verse scripture study, and call-in discussions.' },
  { dayOfWeek: 0, startTime: '21:00', endTime: '23:59', programName: 'Night Praise Vigil & Quiet Waters', presenter: 'Sister Mary', description: 'Peaceful instrumental worship, bedtime scripture readings, and midnight prayers.' },

  // Weekdays (Monday to Friday)
  ...[1, 2, 3, 4, 5].flatMap((day) => [
    { dayOfWeek: day, startTime: '05:30', endTime: '07:30', programName: 'Early Dawn Prayer & Bread of Life', presenter: 'Pastor Emmanuel', description: 'Daily scripture reading, prophetic declarations, and sunrise prayers.' },
    { dayOfWeek: day, startTime: '07:30', endTime: '10:00', programName: 'Morning Gospel Breakfast Show', presenter: 'Joy & Brother Joshua', description: 'Spiritual motivation, live studio banter, traffic & weather updates, and uplifting praise.' },
    { dayOfWeek: day, startTime: '10:00', endTime: '13:00', programName: 'Midday Worship Oasis', presenter: 'Sister Deborah', description: 'Continuous non-stop worship, prayers for the sick, and inspirational ministry.' },
    { dayOfWeek: day, startTime: '13:00', endTime: '16:00', programName: 'Kingdom Impact & Talk Radio', presenter: 'Rev. Baraka', description: 'Interactive listener call-ins, Christian news, lifestyle issues, and community stories.' },
    { dayOfWeek: day, startTime: '16:00', endTime: '19:00', programName: 'Drive-Time Praise Explosion', presenter: 'DJ Faith', description: 'High-energy gospel music to accompany commuters on their evening journey home.' },
    { dayOfWeek: day, startTime: '19:00', endTime: '21:30', programName: 'Evening Healing & Intercession Hour', presenter: 'Pastor Daniel', description: 'Prayers for deliverance, testimonies of miracles, and soothing worship.' },
    { dayOfWeek: day, startTime: '21:30', endTime: '23:59', programName: 'Late Night Sanctuary & Devotion', presenter: 'Sister Mary', description: 'Gentle worship acoustics, spiritual reflection, and resting in His peace.' },
  ]),

  // Saturday
  { dayOfWeek: 6, startTime: '06:00', endTime: '09:00', programName: 'Weekend Sunrise Praise & Workout', presenter: 'Joy Mlay', description: 'Joyful Christian music to start the weekend with physical and spiritual energy.' },
  { dayOfWeek: 6, startTime: '09:00', endTime: '12:00', programName: 'Youth Kingdom Vibes & Generation Next', presenter: 'Youth Pastors & DJ Faith', description: 'Contemporary Christian music, youth talks, campus ministries, and hip-hop gospel.' },
  { dayOfWeek: 6, startTime: '12:00', endTime: '15:00', programName: 'Swahili & African Choir Showcase', presenter: 'Mwalimu John', description: 'Celebrating traditional and contemporary church choirs across East and Central Africa.' },
  { dayOfWeek: 6, startTime: '15:00', endTime: '18:00', programName: 'Saturday Afternoon Gospel Request Show', presenter: 'Brother Joshua', description: 'Direct listener song dedications, WhatsApp voice notes, and ministry greetings.' },
  { dayOfWeek: 6, startTime: '18:00', endTime: '21:00', programName: 'Weekend Praise & Live Studio Concert', presenter: 'Gospel Artists Live', description: 'Live acoustic sessions, interviews with gospel artists, and worship sets.' },
  { dayOfWeek: 6, startTime: '21:00', endTime: '23:59', programName: 'Saturday Night Revival Prayer Watch', presenter: 'Pastor Emmanuel', description: 'Preparing hearts for Sunday with fervent intercessory prayer and worship.' },
];

interface WeeklyScheduleEditorProps {
  stations: Station[];
  initialSelectedStationId?: string;
  onSaveSchedule?: (stationId: string, updatedSchedule: BroadcastScheduleItem[]) => Promise<void> | void;
  isModal?: boolean;
  onClose?: () => void;
}

export function WeeklyScheduleEditor({
  stations,
  initialSelectedStationId,
  onSaveSchedule,
  isModal = false,
  onClose,
}: WeeklyScheduleEditorProps) {
  // Station selection
  const [selectedStationId, setSelectedStationId] = useState<string>(
    initialSelectedStationId || stations[0]?.id || ''
  );

  // Active Station
  const currentStation = useMemo(() => {
    return stations.find((s) => s.id === selectedStationId) || stations[0];
  }, [stations, selectedStationId]);

  // Working schedule state
  const [schedule, setSchedule] = useState<BroadcastScheduleItem[]>([]);
  const [savedScheduleJson, setSavedScheduleJson] = useState<string>('[]');
  const [selectedDayTab, setSelectedDayTab] = useState<number | 'ALL'>('ALL');

  // Form modal state for creating/editing a show
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formDayOfWeek, setFormDayOfWeek] = useState<number>(0);
  const [formProgramName, setFormProgramName] = useState('');
  const [formStartTime, setFormStartTime] = useState('08:00');
  const [formEndTime, setFormEndTime] = useState('10:00');
  const [formPresenter, setFormPresenter] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [applyDays, setApplyDays] = useState<number[]>([0]);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCopyModal, setShowCopyModal] = useState<number | null>(null);
  const [copyTargetDays, setCopyTargetDays] = useState<number[]>([]);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonText, setJsonText] = useState('');

  // Sync station schedule on switch
  useEffect(() => {
    if (currentStation) {
      const items = Array.isArray(currentStation.schedule) ? [...currentStation.schedule] : [];
      setSchedule(items);
      setSavedScheduleJson(JSON.stringify(items));
      setEditingIndex(null);
      resetForm();
    }
  }, [currentStation?.id]);

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(schedule) !== savedScheduleJson;
  }, [schedule, savedScheduleJson]);

  const resetForm = () => {
    setEditingIndex(null);
    setFormProgramName('');
    setFormStartTime('08:00');
    setFormEndTime('10:00');
    setFormPresenter('');
    setFormDescription('');
    setApplyDays([formDayOfWeek]);
    setErrorMessage(null);
  };

  const openNewProgramModal = (defaultDay?: number) => {
    resetForm();
    const day = defaultDay !== undefined ? defaultDay : selectedDayTab !== 'ALL' ? selectedDayTab : 0;
    setFormDayOfWeek(day);
    setApplyDays([day]);
    setShowProgramModal(true);
  };

  const calculateDuration = (start: string, end: string) => {
    try {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      let diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
      if (diffMinutes <= 0) diffMinutes += 24 * 60;
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      if (hours === 0) return `${mins}m`;
      if (mins === 0) return `${hours}h`;
      return `${hours}h ${mins}m`;
    } catch {
      return '';
    }
  };

  const handleSaveShow = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const name = formProgramName.trim();
    if (!name) {
      setErrorMessage('Please provide a show or program name.');
      return;
    }

    if (!formStartTime || !formEndTime) {
      setErrorMessage('Start and End times are required.');
      return;
    }

    if (editingIndex !== null) {
      const updated = [...schedule];
      updated[editingIndex] = {
        dayOfWeek: formDayOfWeek,
        startTime: formStartTime,
        endTime: formEndTime,
        programName: name,
        presenter: formPresenter.trim() || undefined,
        description: formDescription.trim() || undefined,
      };

      updated.sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
        return a.startTime.localeCompare(b.startTime);
      });

      setSchedule(updated);
      setShowProgramModal(false);
      resetForm();
    } else {
      const daysToCreate = applyDays.length > 0 ? applyDays : [formDayOfWeek];
      const newItems: BroadcastScheduleItem[] = daysToCreate.map((d) => ({
        dayOfWeek: d,
        startTime: formStartTime,
        endTime: formEndTime,
        programName: name,
        presenter: formPresenter.trim() || undefined,
        description: formDescription.trim() || undefined,
      }));

      const combined = [...schedule, ...newItems];
      combined.sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
        return a.startTime.localeCompare(b.startTime);
      });

      setSchedule(combined);
      setShowProgramModal(false);
      resetForm();
    }
  };

  const handleStartEdit = (index: number) => {
    const item = schedule[index];
    if (!item) return;
    setEditingIndex(index);
    setFormDayOfWeek(item.dayOfWeek);
    setApplyDays([item.dayOfWeek]);
    setFormProgramName(item.programName);
    setFormStartTime(item.startTime);
    setFormEndTime(item.endTime);
    setFormPresenter(item.presenter || '');
    setFormDescription(item.description || '');
    setErrorMessage(null);
    setShowProgramModal(true);
  };

  const handleDeleteShow = (index: number) => {
    const item = schedule[index];
    if (!item) return;
    if (confirm(`Remove "${item.programName}" (${DAY_NAMES[item.dayOfWeek]} ${item.startTime}-${item.endTime})?`)) {
      const updated = schedule.filter((_, i) => i !== index);
      setSchedule(updated);
      if (editingIndex === index) {
        resetForm();
      }
    }
  };

  const handleExecuteCopy = () => {
    if (showCopyModal === null) return;
    const sourceItem = schedule[showCopyModal];
    if (!sourceItem || copyTargetDays.length === 0) return;

    const clonedItems: BroadcastScheduleItem[] = copyTargetDays.map((d) => ({
      ...sourceItem,
      dayOfWeek: d,
    }));

    const combined = [...schedule, ...clonedItems];
    combined.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return a.startTime.localeCompare(b.startTime);
    });

    setSchedule(combined);
    setShowCopyModal(null);
    setCopyTargetDays([]);
  };

  const handleLoadPreset = () => {
    if (
      schedule.length > 0 &&
      !confirm('Replace your current timetable with a full 7-day Christian Radio programming template?')
    ) {
      return;
    }
    setSchedule([...DEFAULT_SCHEDULE_PRESET]);
    resetForm();
  };

  const handleClearSchedule = () => {
    if (confirm('Are you sure you want to clear all broadcast shows for this station?')) {
      setSchedule([]);
      resetForm();
    }
  };

  const handleSaveToBackend = async () => {
    if (!currentStation) return;
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccessMsg(null);

    try {
      const res = await apiFetch(`/api/owner/stations/${currentStation.id}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSavedScheduleJson(JSON.stringify(schedule));
        setSaveSuccessMsg(`Weekly schedule for "${currentStation.name}" published successfully!`);
        if (onSaveSchedule) {
          await onSaveSchedule(currentStation.id, schedule);
        }
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      } else {
        setErrorMessage(data.error || 'Failed to save broadcast schedule.');
      }
    } catch {
      setErrorMessage('Network error while saving schedule. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdjustEndTime = (hoursToAdd: number) => {
    try {
      const [sh, sm] = formStartTime.split(':').map(Number);
      let eh = (sh + hoursToAdd) % 24;
      let em = sm;
      const ehStr = String(eh).padStart(2, '0');
      const emStr = String(em).padStart(2, '0');
      setFormEndTime(`${ehStr}:${emStr}`);
    } catch {}
  };

  const filteredSchedule = useMemo(() => {
    return schedule.filter((item) => {
      const matchesDay = selectedDayTab === 'ALL' || item.dayOfWeek === selectedDayTab;
      const matchesSearch =
        !searchQuery ||
        item.programName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.presenter && item.presenter.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesDay && matchesSearch;
    });
  }, [schedule, selectedDayTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. TOP CONTROL BAR */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/30 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {currentStation?.logoUrl ? (
              <img
                src={currentStation.logoUrl}
                alt={currentStation.name}
                className="w-12 h-12 rounded-2xl object-cover bg-slate-950 border border-slate-800 shrink-0 shadow-md"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight truncate">
                  {currentStation?.name || 'Radio Broadcast Lineup'}
                </h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {schedule.length} Shows
                </span>
                {hasUnsavedChanges && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                    Unsaved Changes
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure your 7-day program schedule, on-air hosts, and show descriptions visible to your listeners.
              </p>
            </div>
          </div>

          {/* Station Switcher & Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {stations.length > 1 && (
              <select
                value={selectedStationId}
                onChange={(e) => setSelectedStationId(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white font-semibold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500"
              >
                {stations.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.city || st.countryCode})
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={handleLoadPreset}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Populate standard 7-day Christian Radio template"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Load Template</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setJsonText(JSON.stringify(schedule, null, 2));
                setShowJsonModal(true);
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Import or Export Schedule JSON"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>

            {schedule.length > 0 && (
              <button
                type="button"
                onClick={handleClearSchedule}
                className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-rose-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Clear all shows"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}

            {/* Publish Changes Button */}
            <button
              type="button"
              onClick={handleSaveToBackend}
              disabled={isSaving || !hasUnsavedChanges}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg cursor-pointer ${
                hasUnsavedChanges
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 animate-pulse'
                  : 'bg-slate-800 text-slate-400 opacity-60 cursor-default'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : hasUnsavedChanges ? 'Publish Changes' : 'Saved'}</span>
            </button>

            {isModal && onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Feedback Alerts */}
        {saveSuccessMsg && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{saveSuccessMsg}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* 2. DAY SELECTOR TABS & SEARCH */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Day of Week Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedDayTab('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedDayTab === 'ALL'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Days ({schedule.length})
          </button>

          {DAY_SHORT.map((dayName, idx) => {
            const count = schedule.filter((s) => s.dayOfWeek === idx).length;
            const isSelected = selectedDayTab === idx;
            return (
              <button
                key={dayName}
                type="button"
                onClick={() => setSelectedDayTab(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{dayName}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-sky-400/30 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Add Show Button */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search programs..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            type="button"
            onClick={() => openNewProgramModal()}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Show</span>
          </button>
        </div>
      </div>

      {/* 3. SHOWS LIST TIMETABLE */}
      {filteredSchedule.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-14 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-500 mx-auto">
            <Calendar className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Programs Scheduled</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No shows match "${searchQuery}".`
                : selectedDayTab !== 'ALL'
                ? `No shows configured for ${DAY_NAMES[selectedDayTab]}.`
                : 'Your radio station has not published a weekly programming schedule yet.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => openNewProgramModal()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Program</span>
            </button>
            <button
              type="button"
              onClick={handleLoadPreset}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Preset Template</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSchedule.map((item, idx) => {
            const originalIndex = schedule.findIndex((s) => s === item);
            const duration = calculateDuration(item.startTime, item.endTime);

            return (
              <div
                key={`${item.dayOfWeek}-${item.startTime}-${item.programName}-${idx}`}
                className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                {/* Left Side: Time Badge & Program Info */}
                <div className="flex items-start gap-4 min-w-0">
                  {/* Time Badge */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-center shrink-0 w-24">
                    <div className="text-xs font-mono font-bold text-white">
                      {item.startTime}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      to {item.endTime}
                    </div>
                    {duration && (
                      <span className="inline-block mt-1 text-[9px] font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded">
                        {duration}
                      </span>
                    )}
                  </div>

                  {/* Program Info */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {DAY_SHORT[item.dayOfWeek]}
                      </span>
                      <h4 className="text-sm font-bold text-white truncate">
                        {item.programName}
                      </h4>
                    </div>

                    {item.presenter && (
                      <div className="flex items-center gap-1.5 text-xs text-sky-400 font-semibold">
                        <Mic className="w-3 h-3 text-sky-400" />
                        <span>Host: {item.presenter}</span>
                      </div>
                    )}

                    {item.description && (
                      <p className="text-xs text-slate-400 line-clamp-1 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Side: Quick Action Buttons */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCopyModal(originalIndex);
                      setCopyTargetDays([1, 2, 3, 4, 5]);
                    }}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-sky-300 transition text-xs flex items-center gap-1 cursor-pointer"
                    title="Duplicate show to other days"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden md:inline text-[11px] font-medium">Duplicate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartEdit(originalIndex)}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition text-xs flex items-center gap-1 cursor-pointer"
                    title="Edit program"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span className="hidden md:inline text-[11px] font-medium">Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteShow(originalIndex)}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-900/30 text-slate-400 hover:text-rose-400 transition text-xs cursor-pointer"
                    title="Delete program"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. PROGRAM ENTRY / EDIT MODAL */}
      {showProgramModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 text-slate-100 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  {editingIndex !== null ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingIndex !== null ? 'Edit Broadcast Program' : 'Add Broadcast Program'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure program name, broadcast times, host, and summary.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProgramModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShow} className="space-y-4 text-xs">
              {/* Show Name */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Program Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunday Morning Glory & Worship"
                  value={formProgramName}
                  onChange={(e) => setFormProgramName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Tag Suggestions */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Common Themes:
                </span>
                <div className="flex flex-wrap gap-1">
                  {SHOW_TAGS.slice(0, 5).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (!formProgramName) setFormProgramName(tag);
                        else setFormDescription((prev) => (prev ? `${prev} • ${tag}` : tag));
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Day Selection */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Day of the Week <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-7 gap-1">
                  {DAY_SHORT.map((dayName, idx) => (
                    <button
                      key={dayName}
                      type="button"
                      onClick={() => {
                        setFormDayOfWeek(idx);
                        if (editingIndex === null) setApplyDays([idx]);
                      }}
                      className={`py-2 rounded-xl text-center text-xs font-bold transition cursor-pointer ${
                        formDayOfWeek === idx
                          ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {dayName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multi-Day Repeat Selector (Only for new shows) */}
              {editingIndex === null && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                    Quick Repeat Across Days:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setApplyDays([1, 2, 3, 4, 5])}
                      className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold border transition cursor-pointer ${
                        applyDays.length === 5 && applyDays.every((d) => [1, 2, 3, 4, 5].includes(d))
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Weekdays (Mon-Fri)
                    </button>
                    <button
                      type="button"
                      onClick={() => setApplyDays([0, 6])}
                      className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold border transition cursor-pointer ${
                        applyDays.length === 2 && applyDays.includes(0) && applyDays.includes(6)
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Weekends (Sat-Sun)
                    </button>
                    <button
                      type="button"
                      onClick={() => setApplyDays([0, 1, 2, 3, 4, 5, 6])}
                      className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold border transition cursor-pointer ${
                        applyDays.length === 7
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Daily (All 7 Days)
                    </button>
                    <button
                      type="button"
                      onClick={() => setApplyDays([formDayOfWeek])}
                      className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold border transition cursor-pointer ${
                        applyDays.length === 1 && applyDays[0] === formDayOfWeek
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Single Day ({DAY_SHORT[formDayOfWeek]})
                    </button>
                  </div>
                </div>
              )}

              {/* Time Slots */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Start Time <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    End Time <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Duration: <strong className="text-sky-400">{calculateDuration(formStartTime, formEndTime)}</strong></span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleAdjustEndTime(1)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
                  >
                    +1 hr
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustEndTime(2)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
                  >
                    +2 hrs
                  </button>
                </div>
              </div>

              {/* Presenter */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Host / Presenter (Optional)
                </label>
                <div className="relative">
                  <Mic className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Pastor Emmanuel & Sister Mary"
                    value={formPresenter}
                    onChange={(e) => setFormPresenter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Show Description / Scripture Focus (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Live worship songs, intercessory prayer, and devotional study."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProgramModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/20 transition cursor-pointer"
                >
                  {editingIndex !== null ? 'Save Changes' : 'Add to Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DUPLICATE SHOW MODAL */}
      {showCopyModal !== null && schedule[showCopyModal] && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Copy className="w-4 h-4 text-sky-400" />
                <span>Duplicate Show to Other Days</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCopyModal(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Copy <strong className="text-white">"{schedule[showCopyModal].programName}"</strong> ({schedule[showCopyModal].startTime}-{schedule[showCopyModal].endTime}) to which days?
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {DAY_NAMES.map((name, idx) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setCopyTargetDays((prev) =>
                      prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx]
                    );
                  }}
                  className={`p-2.5 rounded-xl border font-bold text-center transition cursor-pointer ${
                    copyTargetDays.includes(idx)
                      ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {name.slice(0, 3)}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCopyModal(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteCopy}
                disabled={copyTargetDays.length === 0}
                className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition disabled:opacity-50"
              >
                Duplicate to {copyTargetDays.length} Day(s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. JSON MODAL */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Import / Export Schedule JSON</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              rows={12}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-white focus:outline-none focus:border-sky-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(jsonText);
                    if (Array.isArray(parsed)) {
                      setSchedule(parsed);
                      setShowJsonModal(false);
                      alert(`Loaded ${parsed.length} shows!`);
                    } else {
                      alert('Must be an array of schedule items.');
                    }
                  } catch {
                    alert('Invalid JSON.');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs"
              >
                Apply JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
