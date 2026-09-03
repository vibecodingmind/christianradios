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
  Info,
  Download,
  Upload,
  RotateCcw,
  UserCheck,
  Tag,
  AlignLeft,
  Search,
  Filter,
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
  { dayOfWeek: 0, startTime: '08:00', endTime: '11:00', programName: 'Live Sunday Divine Service', presenter: 'Rev. Dr. Grace Mwangi', description: 'Live broadcast of the Sunday worship service, choir anthems, and the Word of God.' },
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
  const [viewMode, setViewMode] = useState<'day' | 'grid'>('day');

  // Form state for creating/editing a show
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formDayOfWeek, setFormDayOfWeek] = useState<number>(0);
  const [formProgramName, setFormProgramName] = useState('');
  const [formStartTime, setFormStartTime] = useState('08:00');
  const [formEndTime, setFormEndTime] = useState('10:00');
  const [formPresenter, setFormPresenter] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [applyDays, setApplyDays] = useState<number[]>([0]); // For multi-day quick apply

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCopyModal, setShowCopyModal] = useState<number | null>(null); // Index of item to copy
  const [copyTargetDays, setCopyTargetDays] = useState<number[]>([]);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonText, setJsonText] = useState('');

  // Sync station schedule on station switch
  useEffect(() => {
    if (currentStation) {
      const items = Array.isArray(currentStation.schedule) ? [...currentStation.schedule] : [];
      setSchedule(items);
      setSavedScheduleJson(JSON.stringify(items));
      setEditingIndex(null);
      resetForm();
    }
  }, [currentStation?.id]);

  // Track if changes exist
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

  // Duration helper
  const calculateDuration = (start: string, end: string) => {
    try {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      let diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
      if (diffMinutes <= 0) diffMinutes += 24 * 60; // Overnight show
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      if (hours === 0) return `${mins}m`;
      if (mins === 0) return `${hours}h`;
      return `${hours}h ${mins}m`;
    } catch {
      return '';
    }
  };

  // Add / Update Show handler
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
      // Update existing item
      const updated = [...schedule];
      updated[editingIndex] = {
        dayOfWeek: formDayOfWeek,
        startTime: formStartTime,
        endTime: formEndTime,
        programName: name,
        presenter: formPresenter.trim() || undefined,
        description: formDescription.trim() || undefined,
      };

      // Sort
      updated.sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
        return a.startTime.localeCompare(b.startTime);
      });

      setSchedule(updated);
      resetForm();
    } else {
      // Add new show(s) - support multi-day application
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
      resetForm();
    }
  };

  // Edit item
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
  };

  // Delete item
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

  // Duplicate to other days
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

  // Load Preset
  const handleLoadPreset = () => {
    if (
      schedule.length > 0 &&
      !confirm('This will replace your current schedule with a comprehensive 7-day Christian Radio broadcast lineup template. Continue?')
    ) {
      return;
    }
    setSchedule([...DEFAULT_SCHEDULE_PRESET]);
    resetForm();
  };

  // Clear Schedule
  const handleClearSchedule = () => {
    if (confirm('Are you sure you want to clear all broadcast shows for this station?')) {
      setSchedule([]);
      resetForm();
    }
  };

  // Save to Backend
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
        setSaveSuccessMsg(`Weekly schedule for "${currentStation.name}" successfully published!`);
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

  // Quick preset duration buttons (+1h, +2h, etc.)
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

  // Filter shows by tab and search
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

  // Shows grouped by day
  const showsByDay = useMemo(() => {
    const map: Record<number, BroadcastScheduleItem[]> = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
    };
    schedule.forEach((item) => {
      if (map[item.dayOfWeek]) {
        map[item.dayOfWeek].push(item);
      }
    });
    return map;
  }, [schedule]);

  if (!stations || stations.length === 0) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
        <Radio className="w-12 h-12 text-slate-500 mx-auto" />
        <h3 className="text-base font-bold text-white">No Radio Stations Registered</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Please create a radio station first before setting up weekly broadcast schedules and programming timetables.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Station Selector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
              <Calendar className="w-4 h-4" />
              Weekly Broadcast Programming Schedule
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Manage Radio Show Lineup & Timetables
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Configure daily shows, host names, on-air time slots, and show descriptions. Your listeners can view this live in your station profile.
            </p>
          </div>

          {/* Station Switcher Dropdown */}
          <div className="flex items-center gap-3 shrink-0">
            {stations.length > 1 && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Select Station:
                </label>
                <select
                  value={selectedStationId}
                  onChange={(e) => setSelectedStationId(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-white font-semibold text-xs rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {stations.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.city || st.countryCode})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isModal && onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 text-xs font-bold"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Selected Station Banner & Quick Actions */}
        {currentStation && (
          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <img
                src={currentStation.logoUrl}
                alt={currentStation.name}
                className="w-12 h-12 rounded-2xl object-cover bg-slate-950 border border-slate-800 shrink-0"
              />
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white truncate">{currentStation.name}</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {schedule.length} Shows Scheduled
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate">
                  {currentStation.genre} • Timezone: <span className="text-slate-200">{currentStation.timezone || 'Africa/Dar_es_Salaam'}</span>
                </p>
              </div>
            </div>

            {/* Top Toolbar Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleLoadPreset}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                title="Populate with standard 7-day Christian Radio shows"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                Load Template
              </button>

              <button
                type="button"
                onClick={() => {
                  setJsonText(JSON.stringify(schedule, null, 2));
                  setShowJsonModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                title="Import or Export JSON"
              >
                <Layers className="w-3.5 h-3.5" />
                JSON
              </button>

              {schedule.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSchedule}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-rose-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                  title="Clear all shows"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All
                </button>
              )}

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSaveToBackend}
                disabled={isSaving || !hasUnsavedChanges}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg ${
                  hasUnsavedChanges
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 ring-2 ring-emerald-400/40 animate-pulse'
                    : 'bg-slate-800 text-slate-400 cursor-default'
                }`}
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving Schedule...' : hasUnsavedChanges ? 'Publish Changes' : 'Schedule Saved'}
              </button>
            </div>
          </div>
        )}

        {/* Feedback Banners */}
        {saveSuccessMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{saveSuccessMsg}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Left Side = Show Editor Form, Right Side = Interactive Weekly Schedule Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Program Entry / Edit Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 sticky top-24">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {editingIndex !== null ? (
                  <>
                    <Edit2 className="w-4 h-4 text-sky-400" />
                    Edit Show Program
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-emerald-400" />
                    Add Broadcast Program
                  </>
                )}
              </h3>
              {editingIndex !== null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800 font-semibold"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSaveShow} className="space-y-4 text-xs">
              {/* Show Name */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Show / Program Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Morning Glory & Devotions"
                  value={formProgramName}
                  onChange={(e) => setFormProgramName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Quick Preset Show Names */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  Popular Themes & Tags:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SHOW_TAGS.slice(0, 5).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (!formProgramName) {
                          setFormProgramName(tag);
                        } else {
                          setFormDescription((prev) => (prev ? `${prev}\nFocus: ${tag}` : `Focus: ${tag}`));
                        }
                      }}
                      className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Day of Week Selector */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Day of the Week <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-7 gap-1">
                  {DAY_SHORT.map((dayName, idx) => (
                    <button
                      key={dayName}
                      type="button"
                      onClick={() => {
                        setFormDayOfWeek(idx);
                        if (editingIndex === null) {
                          setApplyDays([idx]);
                        }
                      }}
                      className={`py-2 rounded-xl text-center text-xs font-bold transition ${
                        formDayOfWeek === idx
                          ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {dayName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multi-Day Apply Options (When Creating New Show) */}
              {editingIndex === null && (
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    Quick Repeat Across Days:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setApplyDays([1, 2, 3, 4, 5])}
                      className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold border transition ${
                        applyDays.length === 5 && applyDays.every((d) => [1, 2, 3, 4, 5].includes(d))
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Weekdays (Mon-Fri)
                    </button>
                    <button
                      type="button"
                      onClick={() => setApplyDays([0, 6])}
                      className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold border transition ${
                        applyDays.length === 2 && applyDays.includes(0) && applyDays.includes(6)
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Weekends (Sat-Sun)
                    </button>
                    <button
                      type="button"
                      onClick={() => setApplyDays([0, 1, 2, 3, 4, 5, 6])}
                      className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold border transition ${
                        applyDays.length === 7
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Daily (All 7 Days)
                    </button>
                    <button
                      type="button"
                      onClick={() => setApplyDays([formDayOfWeek])}
                      className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold border transition ${
                        applyDays.length === 1 && applyDays[0] === formDayOfWeek
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Single Day ({DAY_SHORT[formDayOfWeek]})
                    </button>
                  </div>
                </div>
              )}

              {/* Time Slots (Start Time & End Time) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Start Time (24h) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      required
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    End Time (24h) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      required
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Duration Buttons & Indicator */}
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                    {calculateDuration(formStartTime, formEndTime)}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-slate-500 mr-1">Presets:</span>
                  <button
                    type="button"
                    onClick={() => handleAdjustEndTime(1)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                  >
                    +1 hr
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustEndTime(2)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                  >
                    +2 hrs
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustEndTime(3)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                  >
                    +3 hrs
                  </button>
                </div>
              </div>

              {/* Presenter / Host */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Host / Presenter / Pastor (Optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Pastor Emmanuel & Sister Mary"
                    value={formPresenter}
                    onChange={(e) => setFormPresenter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Show Description */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Program Synopsis & Highlights (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Summary of gospel topics, scripture readings, call-in segments, prayer sessions, and music style..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-all"
                >
                  {editingIndex !== null ? (
                    <>
                      <Check className="w-4 h-4" />
                      Update Show Program
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      {applyDays.length > 1
                        ? `Add Show to ${applyDays.length} Selected Days`
                        : `Add Show to ${DAY_NAMES[formDayOfWeek]}`}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column (7 Cols): Schedule Visualizer & Interactive Show List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5">
            {/* Top Toolbar: Search & Day Filters & View Mode */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter shows by title, host, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* View Switcher */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('day')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    viewMode === 'day'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Daily List
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    viewMode === 'grid'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  7-Day Grid
                </button>
              </div>
            </div>

            {/* Day Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedDayTab('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
                  selectedDayTab === 'ALL'
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>All Days</span>
                <span className="text-[10px] bg-slate-900/60 px-1.5 py-0.2 rounded-full font-mono">
                  {schedule.length}
                </span>
              </button>

              {DAY_NAMES.map((name, idx) => {
                const count = showsByDay[idx]?.length || 0;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedDayTab(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
                      selectedDayTab === idx
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>{name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        count > 0 ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* VIEW 1: DAILY LIST VIEW */}
            {viewMode === 'day' && (
              <div className="space-y-3">
                {filteredSchedule.length > 0 ? (
                  <div className="space-y-2.5">
                    {filteredSchedule.map((item, originalIdx) => {
                      // Find actual index in `schedule`
                      const actualIdx = schedule.findIndex((s) => s === item);
                      const isEditing = editingIndex === actualIdx;

                      return (
                        <div
                          key={`${item.dayOfWeek}-${item.startTime}-${item.programName}-${actualIdx}`}
                          className={`p-4 rounded-2xl border transition-all ${
                            isEditing
                              ? 'bg-sky-950/30 border-sky-500 ring-1 ring-sky-500'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                                  {DAY_NAMES[item.dayOfWeek]}
                                </span>
                                <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-md border border-sky-500/20">
                                  {item.startTime} - {item.endTime}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">
                                  ({calculateDuration(item.startTime, item.endTime)})
                                </span>
                              </div>

                              <h4 className="text-sm font-bold text-white tracking-tight">
                                {item.programName}
                              </h4>

                              {item.presenter && (
                                <p className="text-xs text-sky-300 flex items-center gap-1 font-medium">
                                  <UserCheck className="w-3 h-3 text-sky-400" />
                                  Host: {item.presenter}
                                </p>
                              )}

                              {item.description && (
                                <p className="text-xs text-slate-400 line-clamp-2 pt-0.5 leading-relaxed">
                                  {item.description}
                                </p>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(actualIdx)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition"
                                title="Edit Show"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setShowCopyModal(actualIdx);
                                  setCopyTargetDays([]);
                                }}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl transition"
                                title="Duplicate / Copy to other days"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteShow(actualIdx)}
                                className="p-2 bg-slate-800 hover:bg-rose-950/50 text-rose-400 rounded-xl transition"
                                title="Delete Show"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-slate-950/40 rounded-3xl border border-slate-800/60 space-y-3">
                    <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-300">
                      No broadcast shows scheduled for {selectedDayTab === 'ALL' ? 'this station' : DAY_NAMES[selectedDayTab]}.
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Use the form on the left to add shows, or click "Load Template" above to pre-fill a complete 7-day gospel radio schedule.
                    </p>
                    <button
                      type="button"
                      onClick={handleLoadPreset}
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-md transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Load Christian Radio Template
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: 7-DAY MATRIX GRID VIEW */}
            {viewMode === 'grid' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-7 gap-3 overflow-x-auto pb-4">
                  {DAY_NAMES.map((dayName, dayIdx) => {
                    const dayShows = showsByDay[dayIdx] || [];
                    return (
                      <div
                        key={dayName}
                        className="bg-slate-950 rounded-2xl border border-slate-800/90 p-3 space-y-2.5 min-w-[150px]"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <span className="text-xs font-bold text-white">{DAY_SHORT[dayIdx]}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-900 text-sky-400">
                            {dayShows.length}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {dayShows.length > 0 ? (
                            dayShows.map((item, idx) => (
                              <div
                                key={idx}
                                className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-xs space-y-1 group relative"
                              >
                                <div className="text-[10px] font-mono font-semibold text-sky-400">
                                  {item.startTime} - {item.endTime}
                                </div>
                                <div className="font-bold text-slate-100 text-[11px] line-clamp-2">
                                  {item.programName}
                                </div>
                                {item.presenter && (
                                  <div className="text-[10px] text-slate-400 truncate">
                                    {item.presenter}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="py-6 text-center text-[10px] text-slate-600">
                              No shows
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: Copy / Duplicate Show to Other Days */}
      {showCopyModal !== null && schedule[showCopyModal] && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-5">
            <div>
              <h3 className="text-base font-bold text-white">Duplicate Show Program</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Copy "{schedule[showCopyModal].programName}" to other broadcast days.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <div className="font-bold text-sky-400">{schedule[showCopyModal].programName}</div>
              <div className="text-slate-400">
                Time: {schedule[showCopyModal].startTime} - {schedule[showCopyModal].endTime}
              </div>
              {schedule[showCopyModal].presenter && (
                <div className="text-slate-400">Host: {schedule[showCopyModal].presenter}</div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Select Destination Days:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {DAY_NAMES.map((name, idx) => {
                  const isChecked = copyTargetDays.includes(idx);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setCopyTargetDays(copyTargetDays.filter((d) => d !== idx));
                        } else {
                          setCopyTargetDays([...copyTargetDays, idx]);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left font-semibold flex items-center justify-between ${
                        isChecked
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{name}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-sky-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Bulk Presets */}
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCopyTargetDays([1, 2, 3, 4, 5])}
                className="text-[11px] text-sky-400 hover:underline"
              >
                All Weekdays (Mon-Fri)
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => setCopyTargetDays([0, 1, 2, 3, 4, 5, 6])}
                className="text-[11px] text-sky-400 hover:underline"
              >
                All 7 Days
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCopyModal(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteCopy}
                disabled={copyTargetDays.length === 0}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs disabled:opacity-50 shadow-lg shadow-sky-600/20"
              >
                Copy to {copyTargetDays.length} Days
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: JSON Import / Export */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Import / Export Broadcast Schedule</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Export your timetable backup or paste JSON data to import multiple shows at once.
              </p>
            </div>

            <div>
              <textarea
                rows={12}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-sky-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(jsonText);
                  alert('Schedule JSON copied to clipboard!');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Copy JSON
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowJsonModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(jsonText);
                      if (Array.isArray(parsed)) {
                        setSchedule(parsed);
                        setShowJsonModal(false);
                        alert(`Successfully loaded ${parsed.length} shows!`);
                      } else {
                        alert('Invalid JSON: Must be an array of schedule items.');
                      }
                    } catch {
                      alert('Invalid JSON syntax.');
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs"
                >
                  Apply JSON Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
