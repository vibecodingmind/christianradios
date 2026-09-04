import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Building2,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Lock,
  Globe,
  Radio,
  FileCheck,
  Loader2,
  X,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { WORLDWIDE_COUNTRIES } from '../../data/worldwideCountries';
import type { KYCApplication, KYCDocument, KYCOwnerType, DocumentType } from '../../types';

interface OwnerKYCFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function OwnerKYCForm({ onSuccess, onCancel }: OwnerKYCFormProps) {
  const [step, setStep] = useState<number>(1);
  const [verificationType, setVerificationType] = useState<KYCOwnerType>('INDIVIDUAL');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [organizationType, setOrganizationType] = useState('Non-Profit / Ministry');
  const [country, setCountry] = useState('TZ');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [idType, setIdType] = useState('NATIONAL_ID');
  const [idNumber, setIdNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [taxId, setTaxId] = useState('');
  const [website, setWebsite] = useState('');
  const [representativeName, setRepresentativeName] = useState('');
  const [representativeTitle, setRepresentativeTitle] = useState('General Manager / Station Director');
  const [representativeIdNumber, setRepresentativeIdNumber] = useState('');

  // Station Authorization Details
  const [licenceNumber, setLicenceNumber] = useState('');
  const [licenceType, setLicenceType] = useState('Commercial / Religious Broadcast Licence');
  const [issuingAuthority, setIssuingAuthority] = useState('National Telecommunications Authority');

  // State & Loading
  const [uploadedDocs, setUploadedDocs] = useState<KYCDocument[]>([]);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    // Load existing application data if available
    apiFetch('/api/kyc/application')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.application) {
          const app: KYCApplication = data.application;
          setVerificationType(app.verificationType || 'INDIVIDUAL');
          setFullName(app.fullName || '');
          setOrganizationName(app.organizationName || '');
          setOrganizationType(app.organizationType || 'Non-Profit / Ministry');
          setCountry(app.country || 'TZ');
          setAddress(app.address || '');
          setPhone(app.phone || '');
          setEmail(app.email || '');
          setIdType(app.idType || 'NATIONAL_ID');
          setIdNumber(app.idNumber || '');
          setRegistrationNumber(app.registrationNumber || '');
          setTaxId(app.taxId || '');
          setWebsite(app.website || '');
          setRepresentativeName(app.representativeName || '');
          setRepresentativeTitle(app.representativeTitle || '');
          setRepresentativeIdNumber(app.representativeIdNumber || '');
        }
        if (data && data.documents) {
          setUploadedDocs(data.documents);
        }
      })
      .catch(() => {});
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: DocumentType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File is too large. Maximum allowed document size is 10MB.');
      return;
    }

    setUploadingDocType(docType);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const fileData = reader.result as string;
        const res = await apiFetch('/api/kyc/upload-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentType: docType,
            fileName: file.name,
            fileData,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setUploadedDocs((prev) => [...prev.filter((d) => d.documentType !== docType), data.document]);
        } else {
          const err = await res.json();
          setErrorMsg(err.error || 'Failed to upload document.');
        }
      } catch (err) {
        setErrorMsg('Network error during file upload.');
      } finally {
        setUploadingDocType(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitKYC = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        verificationType,
        fullName: verificationType === 'INDIVIDUAL' ? fullName : undefined,
        organizationName: verificationType === 'ORGANIZATION' ? organizationName : undefined,
        organizationType: verificationType === 'ORGANIZATION' ? organizationType : undefined,
        country,
        address,
        phone,
        email,
        idType: verificationType === 'INDIVIDUAL' ? idType : undefined,
        idNumber: verificationType === 'INDIVIDUAL' ? idNumber : undefined,
        registrationNumber: verificationType === 'ORGANIZATION' ? registrationNumber : undefined,
        taxId: verificationType === 'ORGANIZATION' ? taxId : undefined,
        website: verificationType === 'ORGANIZATION' ? website : undefined,
        representativeName: verificationType === 'ORGANIZATION' ? representativeName : undefined,
        representativeTitle: verificationType === 'ORGANIZATION' ? representativeTitle : undefined,
        representativeIdNumber: verificationType === 'ORGANIZATION' ? representativeIdNumber : undefined,
      };

      const res = await apiFetch('/api/kyc/application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccessMsg('Your Radio Owner verification application has been submitted to Admin review!');
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1500);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to submit verification application.');
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md">
      {/* Wizard Header Progress Stepper */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Radio Owner Verification (KYC)</h2>
              <p className="text-xs text-slate-400">Step {step} of 4 — {step === 1 ? 'Owner Category' : step === 2 ? 'Identity & Contact' : step === 3 ? 'Verification Documents' : 'Review & Final Submission'}</p>
            </div>
          </div>

          {onCancel && (
            <button onClick={onCancel} className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Stepper Bar */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < step ? 'bg-emerald-400' : i === step ? 'bg-sky-500 animate-pulse' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* STEP 1: OWNER CATEGORY (INDIVIDUAL VS ORGANIZATION) */}
      {step === 1 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Select Owner Verification Type</h3>
            <p className="text-xs text-slate-400">Choose whether this radio station is registered under an individual broadcaster or an organization/ministry.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setVerificationType('INDIVIDUAL')}
              className={`p-5 rounded-2xl border text-left transition-all relative ${
                verificationType === 'INDIVIDUAL'
                  ? 'bg-sky-500/15 border-sky-500 ring-2 ring-sky-500/30 text-white shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                {verificationType === 'INDIVIDUAL' && <CheckCircle2 className="w-5 h-5 text-sky-400" />}
              </div>
              <h4 className="text-base font-bold text-white">Individual Broadcaster</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                For independent radio operators, pastors, podcasters, or solo ministry leaders. Requires personal government identification.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setVerificationType('ORGANIZATION')}
              className={`p-5 rounded-2xl border text-left transition-all relative ${
                verificationType === 'ORGANIZATION'
                  ? 'bg-sky-500/15 border-sky-500 ring-2 ring-sky-500/30 text-white shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                {verificationType === 'ORGANIZATION' && <CheckCircle2 className="w-5 h-5 text-sky-400" />}
              </div>
              <h4 className="text-base font-bold text-white">Organization / Ministry / Church</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                For registered Christian ministries, churches, media networks, or NGOs. Requires business registration or tax registration documents.
              </p>
            </button>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 transition"
            >
              <span>Continue to Information</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PERSONAL OR BUSINESS DETAILS */}
      {step === 2 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {verificationType === 'INDIVIDUAL' ? 'Personal Information' : 'Organization & Representative Details'}
            </h3>
            <p className="text-xs text-slate-400">All information is kept strictly confidential and only used for verification compliance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {verificationType === 'INDIVIDUAL' ? (
              <>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-300">Full Legal Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Pastor John David Mwangi"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">ID Document Type *</label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="NATIONAL_ID">National Identity Card (NIDA / Govt ID)</option>
                    <option value="PASSPORT">International Passport</option>
                    <option value="DRIVERS_LICENSE">Driver's License</option>
                    <option value="VOTERS_CARD">Voter Registration Card</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">ID Document Number *</label>
                  <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="e.g. 19850412-12104-00001-24"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-300">Organization Legal Name *</label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="e.g. Voice of Hope Media Ministries Foundation"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Organization Type *</label>
                  <select
                    value={organizationType}
                    onChange={(e) => setOrganizationType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Non-Profit / Ministry">Non-Profit / Ministry</option>
                    <option value="Church Network">Church Network</option>
                    <option value="Commercial Media Limited">Commercial Media Limited</option>
                    <option value="NGO / Trust">Registered NGO / Trust</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Registration / BRELA Number *</label>
                  <input
                    type="text"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="e.g. REG-142859"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">TIN / Tax Identification Number</label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="e.g. 104-582-990"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Official Website URL</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://voiceofhopemedia.org"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Authorized Representative Name *</label>
                  <input
                    type="text"
                    value={representativeName}
                    onChange={(e) => setRepresentativeName(e.target.value)}
                    placeholder="e.g. Bishop David Kasanga"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Representative Title / Role</label>
                  <input
                    type="text"
                    value={representativeTitle}
                    onChange={(e) => setRepresentativeTitle(e.target.value)}
                    placeholder="e.g. Executive Director / Station Manager"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Country of Jurisdiction *</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                {WORLDWIDE_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flagEmoji} {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Official Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+255 700 000 000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Contact / Physical Address *</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, City, Region, Building name"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (verificationType === 'INDIVIDUAL' && (!fullName.trim() || !phone.trim())) {
                  alert('Please enter your Full Legal Name and Phone Number.');
                  return;
                }
                if (verificationType === 'ORGANIZATION' && (!organizationName.trim() || !registrationNumber.trim() || !phone.trim())) {
                  alert('Please enter your Organization Legal Name, Registration Number, and Phone Number.');
                  return;
                }
                setStep(3);
              }}
              className="px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 transition"
            >
              <span>Next: Upload Documents</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: DOCUMENT UPLOADS */}
      {step === 3 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Secure Document Uploads</h3>
            <p className="text-xs text-slate-400">
              Upload clear copies of identification and licensing documents. Documents are stored in secure access-controlled storage and never exposed publicly.
            </p>
          </div>

          <div className="space-y-4">
            {verificationType === 'INDIVIDUAL' ? (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-white">Government ID Document (National ID / Passport / Driver's License) *</span>
                  </div>
                  {uploadedDocs.some((d) => ['NATIONAL_ID', 'PASSPORT', 'DRIVERS_LICENSE'].includes(d.documentType)) && (
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Uploaded
                    </span>
                  )}
                </div>

                <label className="border-2 border-dashed border-slate-800 hover:border-sky-500/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-slate-900/40 group">
                  {uploadingDocType === 'NATIONAL_ID' ? (
                    <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
                  ) : (
                    <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-sky-400 transition" />
                  )}
                  <span className="text-xs font-bold text-slate-300 mt-2">Click to browse & upload ID file</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">Supports PDF, JPG, PNG, WEBP (Max 10MB)</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => handleFileUpload(e, 'NATIONAL_ID')}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <>
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-white">Certificate of Business / Ministry Registration *</span>
                    </div>
                    {uploadedDocs.some((d) => d.documentType === 'BUSINESS_REGISTRATION') && (
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Uploaded
                      </span>
                    )}
                  </div>

                  <label className="border-2 border-dashed border-slate-800 hover:border-purple-500/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-slate-900/40 group">
                    {uploadingDocType === 'BUSINESS_REGISTRATION' ? (
                      <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                    ) : (
                      <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-purple-400 transition" />
                    )}
                    <span className="text-xs font-bold text-slate-300 mt-2">Upload Certificate of Registration</span>
                    <span className="text-[11px] text-slate-500 mt-0.5">Supports PDF, JPG, PNG (Max 10MB)</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => handleFileUpload(e, 'BUSINESS_REGISTRATION')}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white">Tax Registration / TIN Certificate</span>
                    </div>
                    {uploadedDocs.some((d) => d.documentType === 'TAX_CERTIFICATE') && (
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Uploaded
                      </span>
                    )}
                  </div>

                  <label className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition bg-slate-900/40 group">
                    <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-amber-400 transition" />
                    <span className="text-xs font-semibold text-slate-300 mt-1.5">Upload Tax / TIN Certificate (Optional)</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => handleFileUpload(e, 'TAX_CERTIFICATE')}
                      className="hidden"
                    />
                  </label>
                </div>
              </>
            )}

            {/* Station Licence Upload Option */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Broadcast Licence / Frequency Permit (For Licence Verification Badge)</span>
                </div>
                {uploadedDocs.some((d) => d.documentType === 'STATION_LICENSE') && (
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Uploaded
                  </span>
                )}
              </div>

              <label className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition bg-slate-900/40 group">
                <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition" />
                <span className="text-xs font-semibold text-slate-300 mt-1.5">Upload Broadcast Licence Document</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => handleFileUpload(e, 'STATION_LICENSE')}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => setStep(4)}
              className="px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 transition"
            >
              <span>Next: Review & Submit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW & FINAL SUBMISSION */}
      {step === 4 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Review Your Application</h3>
            <p className="text-xs text-slate-400">Please confirm all details before submitting for official administrator review.</p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Verification Type</span>
                <strong className="text-white font-bold">{verificationType}</strong>
              </div>

              <div>
                <span className="text-slate-500 block">Country</span>
                <strong className="text-white font-bold">{country}</strong>
              </div>

              <div>
                <span className="text-slate-500 block">{verificationType === 'INDIVIDUAL' ? 'Legal Name' : 'Organization Name'}</span>
                <strong className="text-sky-300 font-bold">{verificationType === 'INDIVIDUAL' ? fullName : organizationName}</strong>
              </div>

              <div>
                <span className="text-slate-500 block">Phone</span>
                <strong className="text-white font-bold">{phone}</strong>
              </div>

              <div>
                <span className="text-slate-500 block">Email</span>
                <strong className="text-white font-bold">{email}</strong>
              </div>

              <div>
                <span className="text-slate-500 block">Uploaded Documents</span>
                <strong className="text-emerald-400 font-bold">{uploadedDocs.length} Documents Attached</strong>
              </div>
            </div>

            {uploadedDocs.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Attached Verification Documents:</span>
                <div className="space-y-1.5">
                  {uploadedDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between text-xs bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
                      <span className="text-slate-200 font-medium">{doc.fileName}</span>
                      <span className="text-[10px] font-bold text-sky-400 uppercase">{doc.documentType}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed flex items-start gap-3">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              By submitting this verification application, you certify that all information and documents provided are genuine and accurate. Administrative verification typically takes 12-24 hours.
            </span>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleSubmitKYC}
              disabled={loading}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-sky-500 hover:from-emerald-300 hover:to-sky-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-xl shadow-emerald-500/20 transition hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileCheck className="w-4 h-4" />
              )}
              <span>Submit Application for Review</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
