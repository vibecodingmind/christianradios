import React, { useState } from 'react';
import {
  Globe,
  Tag,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  CheckCircle2,
  XCircle,
  X,
  Save,
  RefreshCw,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { Category, Country } from '../../types';

interface AdminTaxonomyTabProps {
  categories: Category[];
  countries: Country[];
  onRefresh: () => void;
}

export function AdminTaxonomyTab({ categories, countries, onRefresh }: AdminTaxonomyTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'categories' | 'countries'>('categories');

  // Category modal
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [catFormData, setCatFormData] = useState<Partial<Category>>({
    name: '',
    slug: '',
    description: '',
    iconName: 'Radio',
    displayOrder: 10,
    isActive: true,
  });

  // Country modal
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [isCreatingCountry, setIsCreatingCountry] = useState(false);
  const [countryFormData, setCountryFormData] = useState<Partial<Country>>({
    code: '',
    name: '',
    flagEmoji: '🌍',
    continent: 'Africa',
    isFeatured: true,
  });

  const [saving, setSaving] = useState(false);

  // Category Actions
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isCreatingCategory) {
        await apiFetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(catFormData),
        });
      } else if (editingCategory) {
        await apiFetch(`/api/admin/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(catFormData),
        });
      }
      setIsCreatingCategory(false);
      setEditingCategory(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    try {
      await apiFetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Country Actions
  const handleSaveCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isCreatingCountry) {
        await apiFetch('/api/admin/countries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(countryFormData),
        });
      } else if (editingCountry) {
        await apiFetch(`/api/admin/countries/${editingCountry.code}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(countryFormData),
        });
      }
      setIsCreatingCountry(false);
      setEditingCountry(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCountry = async (code: string, name: string) => {
    if (!window.confirm(`Delete country "${name}" (${code})?`)) return;
    try {
      await apiFetch(`/api/admin/countries/${code}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="admin-taxonomy-tab" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-amber-400" />
            Taxonomy, Categories & Global Broadcast Regions
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage station genres, ministries, and country directories displayed across the frontend exploration portals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'categories' ? (
            <button
              onClick={() => {
                setCatFormData({
                  name: '',
                  slug: '',
                  description: '',
                  iconName: 'Radio',
                  displayOrder: categories.length + 1,
                  isActive: true,
                });
                setIsCreatingCategory(true);
                setEditingCategory(null);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>
          ) : (
            <button
              onClick={() => {
                setCountryFormData({
                  code: '',
                  name: '',
                  flagEmoji: '🌍',
                  continent: 'Africa',
                  isFeatured: true,
                });
                setIsCreatingCountry(true);
                setEditingCountry(null);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" /> Add Country
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'categories'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4" /> Genres & Categories ({categories.length})
        </button>

        <button
          onClick={() => setActiveSubTab('countries')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'countries'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" /> Countries & Regions ({countries.length})
        </button>
      </div>

      {/* CATEGORIES GRID */}
      {activeSubTab === 'categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:border-slate-700 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{cat.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    Order: {cat.displayOrder}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1">{cat.description || cat.slug}</p>
              </div>

              <div className="flex items-center gap-1.5 ml-3">
                <button
                  onClick={() => {
                    setCatFormData({ ...cat });
                    setEditingCategory(cat);
                    setIsCreatingCategory(false);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-amber-500 hover:text-slate-950 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-red-500 hover:text-white transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* COUNTRIES GRID */}
      {activeSubTab === 'countries' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {countries.map((c) => (
            <div
              key={c.code}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{c.flagEmoji}</span>
                <div>
                  <div className="font-bold text-white text-sm flex items-center gap-1">
                    {c.name}
                    {c.isFeatured && <span className="text-[10px] text-amber-400">⭐</span>}
                  </div>
                  <span className="text-slate-500 text-xs font-mono">{c.code} • {c.continent}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setCountryFormData({ ...c });
                    setEditingCountry(c);
                    setIsCreatingCountry(false);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-amber-500 hover:text-slate-950 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteCountry(c.code, c.name)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-red-500 hover:text-white transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CATEGORY CREATE / EDIT MODAL */}
      {(isCreatingCategory || editingCategory) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {isCreatingCategory ? 'Add Genre Category' : `Edit: ${editingCategory?.name}`}
              </h3>
              <button
                onClick={() => {
                  setIsCreatingCategory(false);
                  setEditingCategory(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catFormData.name || ''}
                  onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Slug URL Identifier</label>
                <input
                  type="text"
                  value={catFormData.slug || ''}
                  onChange={(e) => setCatFormData({ ...catFormData, slug: e.target.value })}
                  placeholder="e.g. gospel-worship"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={catFormData.description || ''}
                  onChange={(e) => setCatFormData({ ...catFormData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Display Sort Order</label>
                <input
                  type="number"
                  value={catFormData.displayOrder || 1}
                  onChange={(e) => setCatFormData({ ...catFormData, displayOrder: parseInt(e.target.value, 10) || 1 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingCategory(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 bg-slate-800 text-xs font-semibold text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20"
                >
                  {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COUNTRY CREATE / EDIT MODAL */}
      {(isCreatingCountry || editingCountry) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {isCreatingCountry ? 'Add Country' : `Edit: ${editingCountry?.name}`}
              </h3>
              <button
                onClick={() => {
                  setIsCreatingCountry(false);
                  setEditingCountry(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCountry} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">ISO 2-Letter Code *</label>
                  <input
                    type="text"
                    maxLength={2}
                    required
                    value={countryFormData.code || ''}
                    onChange={(e) => setCountryFormData({ ...countryFormData, code: e.target.value.toUpperCase() })}
                    placeholder="TZ"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Flag Emoji</label>
                  <input
                    type="text"
                    value={countryFormData.flagEmoji || '🌍'}
                    onChange={(e) => setCountryFormData({ ...countryFormData, flagEmoji: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 text-center text-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Country Name *</label>
                <input
                  type="text"
                  required
                  value={countryFormData.name || ''}
                  onChange={(e) => setCountryFormData({ ...countryFormData, name: e.target.value })}
                  placeholder="Tanzania"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Continent / Region</label>
                <select
                  value={countryFormData.continent || 'Africa'}
                  onChange={(e) => setCountryFormData({ ...countryFormData, continent: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="Africa">Africa</option>
                  <option value="North America">North America</option>
                  <option value="Europe">Europe</option>
                  <option value="Asia">Asia</option>
                  <option value="South America">South America</option>
                  <option value="Oceania">Oceania</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={countryFormData.isFeatured}
                    onChange={(e) => setCountryFormData({ ...countryFormData, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500"
                  />
                  Featured in Top Regional Spotlight
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingCountry(false);
                    setEditingCountry(null);
                  }}
                  className="px-4 py-2 bg-slate-800 text-xs font-semibold text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20"
                >
                  {saving ? 'Saving...' : 'Save Country'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
