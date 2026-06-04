'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Save,
  PencilLine,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { updateEnquiryFields } from '@/lib/actions/enquiries';
import {
  PRIMARY_GOAL_OPTIONS,
  START_TIMING_OPTIONS,
  LEAD_TEMPERATURE_OPTIONS,
  PLAN_DISCUSSED_OPTIONS,
  NEXT_STEP_OPTIONS,
  GENDER_OPTIONS,
  FOOD_PREFERENCE_OPTIONS,
  WORKOUT_EXPERIENCE_OPTIONS,
  TRAINING_DAYS_OPTIONS,
  COMMITMENT_DURATION_OPTIONS,
  MEDICAL_CONDITION_OPTIONS,
  type AdminEnquiry,
  type EnquiryAdminData,
  type LeadTemperature,
  type PlanDiscussed,
  type NextStep,
  type Gender,
  type FoodPreference,
  type WorkoutExperience,
  type TrainingDays,
  type CommitmentDuration,
  type MedicalCondition,
  type PrimaryGoal,
  type StartTiming,
} from '@/lib/data/enquiries-types';

interface Props {
  enquiry: AdminEnquiry;
}

/**
 * Admin "Edit & enrich" panel.
 *
 * Three buckets, collapsible to keep the page manageable:
 *  1. What they told us (applicant-submitted, locked by default)
 *  2. Sales / discovery (lead temp, plan, money, objections, next step)
 *  3. About the client (Form-B-style profile fields admin captures
 *     on the qualifying call — age, body baseline, medical, habits,
 *     training plan, commitment)
 *
 * All admin fields go into the same admin_data JSONB column.
 */
export function EnquiryEditForm({ enquiry }: Props) {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Section collapse state ───────────────────────────────────────
  const [showSales, setShowSales] = useState(true);
  const [showProfile, setShowProfile] = useState(true);

  // ── Applicant fields ────────────────────────────────────────────
  const [fullName, setFullName] = useState(enquiry.fullName);
  const [whatsapp, setWhatsapp] = useState(enquiry.whatsapp);
  const [email, setEmail] = useState(enquiry.email);
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>(
    enquiry.primaryGoal
  );
  const [startTiming, setStartTiming] = useState<StartTiming>(
    enquiry.startTiming
  );
  const [message, setMessage] = useState(enquiry.message ?? '');

  // ── Sales / discovery ───────────────────────────────────────────
  const a = enquiry.adminData ?? {};
  const [temperature, setTemperature] = useState<LeadTemperature | ''>(
    a.temperature ?? ''
  );
  const [planDiscussed, setPlanDiscussed] = useState<PlanDiscussed | ''>(
    a.plan_discussed ?? ''
  );
  const [pricingDiscussed, setPricingDiscussed] = useState<boolean>(
    a.pricing_discussed ?? false
  );
  const [budget, setBudget] = useState(a.budget_inr ?? '');
  const [objections, setObjections] = useState(a.objections ?? '');
  const [nextStep, setNextStep] = useState<NextStep | ''>(a.next_step ?? '');
  const [discoveryCallDate, setDiscoveryCallDate] = useState(
    a.discovery_call_date ?? ''
  );
  const [followUpAt, setFollowUpAt] = useState(a.follow_up_at ?? '');
  const [sourceChannel, setSourceChannel] = useState(a.source_channel ?? '');

  // ── About the client ────────────────────────────────────────────
  const [age, setAge] = useState<string>(
    a.age != null ? String(a.age) : ''
  );
  const [gender, setGender] = useState<Gender | ''>(a.gender ?? '');
  const [occupation, setOccupation] = useState(a.occupation ?? '');
  const [cityCountry, setCityCountry] = useState(a.city_country ?? '');
  const [heightCm, setHeightCm] = useState<string>(
    a.height_cm != null ? String(a.height_cm) : ''
  );
  const [weightKg, setWeightKg] = useState<string>(
    a.weight_kg != null ? String(a.weight_kg) : ''
  );

  // ── Medical ─────────────────────────────────────────────────────
  const [medicalConditions, setMedicalConditions] = useState<
    MedicalCondition[]
  >(a.medical_conditions ?? []);
  const [injuriesNotes, setInjuriesNotes] = useState(a.injuries_notes ?? '');
  const [energyLevel, setEnergyLevel] = useState<number | null>(
    a.energy_level ?? null
  );

  // ── Habits + training ───────────────────────────────────────────
  const [foodPreference, setFoodPreference] = useState<FoodPreference | ''>(
    a.food_preference ?? ''
  );
  const [currentlyWorkingOut, setCurrentlyWorkingOut] = useState<
    boolean | null
  >(a.currently_working_out ?? null);
  const [workoutExperience, setWorkoutExperience] = useState<
    WorkoutExperience | ''
  >(a.workout_experience ?? '');
  const [gymAccess, setGymAccess] = useState<boolean | null>(
    a.gym_access ?? null
  );
  const [trainingDays, setTrainingDays] = useState<TrainingDays | ''>(
    a.training_days_per_week ?? ''
  );

  // ── Commitment ──────────────────────────────────────────────────
  const [commitmentDuration, setCommitmentDuration] = useState<
    CommitmentDuration | ''
  >(a.commitment_duration ?? '');

  // ────────────────────────────────────────────────────────────────
  // Dirty calculation
  // ────────────────────────────────────────────────────────────────
  const dirty = useMemo(() => {
    if (fullName !== enquiry.fullName) return true;
    if (whatsapp !== enquiry.whatsapp) return true;
    if (email !== enquiry.email) return true;
    if (primaryGoal !== enquiry.primaryGoal) return true;
    if (startTiming !== enquiry.startTiming) return true;
    if ((message ?? '') !== (enquiry.message ?? '')) return true;
    if ((temperature || undefined) !== a.temperature) return true;
    if ((planDiscussed || undefined) !== a.plan_discussed) return true;
    if (pricingDiscussed !== (a.pricing_discussed ?? false)) return true;
    if ((budget || '') !== (a.budget_inr ?? '')) return true;
    if ((objections || '') !== (a.objections ?? '')) return true;
    if ((nextStep || undefined) !== a.next_step) return true;
    if ((discoveryCallDate || '') !== (a.discovery_call_date ?? ''))
      return true;
    if ((followUpAt || '') !== (a.follow_up_at ?? '')) return true;
    if ((sourceChannel || '') !== (a.source_channel ?? '')) return true;
    if (age !== (a.age != null ? String(a.age) : '')) return true;
    if ((gender || undefined) !== a.gender) return true;
    if ((occupation || '') !== (a.occupation ?? '')) return true;
    if ((cityCountry || '') !== (a.city_country ?? '')) return true;
    if (heightCm !== (a.height_cm != null ? String(a.height_cm) : ''))
      return true;
    if (weightKg !== (a.weight_kg != null ? String(a.weight_kg) : ''))
      return true;
    if (
      JSON.stringify([...medicalConditions].sort()) !==
      JSON.stringify([...(a.medical_conditions ?? [])].sort())
    )
      return true;
    if ((injuriesNotes || '') !== (a.injuries_notes ?? '')) return true;
    if (energyLevel !== (a.energy_level ?? null)) return true;
    if ((foodPreference || undefined) !== a.food_preference) return true;
    if (currentlyWorkingOut !== (a.currently_working_out ?? null))
      return true;
    if ((workoutExperience || undefined) !== a.workout_experience) return true;
    if (gymAccess !== (a.gym_access ?? null)) return true;
    if ((trainingDays || undefined) !== a.training_days_per_week) return true;
    if ((commitmentDuration || undefined) !== a.commitment_duration)
      return true;
    return false;
  }, [
    enquiry,
    a,
    fullName,
    whatsapp,
    email,
    primaryGoal,
    startTiming,
    message,
    temperature,
    planDiscussed,
    pricingDiscussed,
    budget,
    objections,
    nextStep,
    discoveryCallDate,
    followUpAt,
    sourceChannel,
    age,
    gender,
    occupation,
    cityCountry,
    heightCm,
    weightKg,
    medicalConditions,
    injuriesNotes,
    energyLevel,
    foodPreference,
    currentlyWorkingOut,
    workoutExperience,
    gymAccess,
    trainingDays,
    commitmentDuration,
  ]);

  // ────────────────────────────────────────────────────────────────
  // Save
  // ────────────────────────────────────────────────────────────────
  const onSave = () => {
    setErrorMsg(null);
    const adminData: EnquiryAdminData = {};

    // Sales / discovery
    if (temperature) adminData.temperature = temperature;
    if (planDiscussed) adminData.plan_discussed = planDiscussed;
    adminData.pricing_discussed = pricingDiscussed;
    if (budget.trim()) adminData.budget_inr = budget.trim();
    if (objections.trim()) adminData.objections = objections.trim();
    if (nextStep) adminData.next_step = nextStep;
    if (discoveryCallDate) adminData.discovery_call_date = discoveryCallDate;
    if (followUpAt) adminData.follow_up_at = followUpAt;
    if (sourceChannel.trim()) adminData.source_channel = sourceChannel.trim();

    // About the client
    if (age.trim()) {
      const n = Number(age);
      if (Number.isFinite(n)) adminData.age = Math.round(n);
    }
    if (gender) adminData.gender = gender;
    if (occupation.trim()) adminData.occupation = occupation.trim();
    if (cityCountry.trim()) adminData.city_country = cityCountry.trim();
    if (heightCm.trim()) {
      const n = Number(heightCm);
      if (Number.isFinite(n)) adminData.height_cm = n;
    }
    if (weightKg.trim()) {
      const n = Number(weightKg);
      if (Number.isFinite(n)) adminData.weight_kg = n;
    }

    // Medical
    if (medicalConditions.length > 0)
      adminData.medical_conditions = medicalConditions;
    if (injuriesNotes.trim()) adminData.injuries_notes = injuriesNotes.trim();
    if (energyLevel != null) adminData.energy_level = energyLevel;

    // Habits + training
    if (foodPreference) adminData.food_preference = foodPreference;
    if (currentlyWorkingOut !== null)
      adminData.currently_working_out = currentlyWorkingOut;
    if (workoutExperience) adminData.workout_experience = workoutExperience;
    if (gymAccess !== null) adminData.gym_access = gymAccess;
    if (trainingDays) adminData.training_days_per_week = trainingDays;

    // Commitment
    if (commitmentDuration) adminData.commitment_duration = commitmentDuration;

    startTransition(async () => {
      const r = await updateEnquiryFields({
        enquiryId: enquiry.id,
        fullName,
        whatsapp,
        email,
        primaryGoal,
        startTiming,
        message: message.trim() || null,
        adminData,
      });
      if (!r.ok) {
        setErrorMsg(r.error);
        return;
      }
      setSavedAt(Date.now());
      router.refresh();
    });
  };

  // ────────────────────────────────────────────────────────────────
  // Shared styles
  // ────────────────────────────────────────────────────────────────
  const inputCls =
    'w-full h-11 px-3 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed';
  const labelCls =
    'font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-1.5 block';
  const sectionHeadCls =
    'font-mono text-[10px] uppercase tracking-[0.22em] font-bold mb-3 pb-2 border-b flex items-center justify-between gap-2';

  // ────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl bg-bg-card border border-border p-5 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          <PencilLine size={16} className="text-accent" strokeWidth={2.5} />
          <h2 className="font-display font-semibold text-lg tracking-tight">
            Edit &amp; enrich
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setUnlocked((u) => !u)}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-[0.12em] font-bold border transition-colors',
            unlocked
              ? 'border-amber/40 text-amber bg-amber/10 hover:bg-amber/15'
              : 'border-border-soft text-text-muted hover:text-text hover:border-text-muted'
          )}
        >
          {unlocked ? <Unlock size={11} /> : <Lock size={11} />}
          {unlocked ? 'Editing applicant fields' : 'Edit applicant fields'}
        </button>
      </div>

      {/* ─── 1. What they told us ─── */}
      <div className="mb-7">
        <div
          className={cn(
            sectionHeadCls,
            'text-text-muted border-border-soft'
          )}
        >
          What they told us
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input
            label="Full name"
            value={fullName}
            onChange={setFullName}
            disabled={!unlocked}
            labelCls={labelCls}
            inputCls={inputCls}
          />
          <Input
            label="WhatsApp"
            value={whatsapp}
            onChange={(v) => setWhatsapp(v.replace(/\D/g, '').slice(0, 10))}
            disabled={!unlocked}
            inputMode="numeric"
            type="tel"
            labelCls={labelCls}
            inputCls={inputCls}
          />
          <Input
            label="Email"
            value={email}
            onChange={setEmail}
            disabled={!unlocked}
            type="email"
            colSpan2
            labelCls={labelCls}
            inputCls={inputCls}
          />
          <div>
            <label className={labelCls}>Primary goal</label>
            <select
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value as PrimaryGoal)}
              disabled={!unlocked}
              className={inputCls}
            >
              {PRIMARY_GOAL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Can start</label>
            <select
              value={startTiming}
              onChange={(e) => setStartTiming(e.target.value as StartTiming)}
              disabled={!unlocked}
              className={inputCls}
            >
              {START_TIMING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Message from applicant</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!unlocked}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent focus:outline-none resize-none disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ fontSize: 13 }}
            />
          </div>
        </div>
      </div>

      {/* ─── 2. Sales / discovery ─── */}
      <div className="mb-7">
        <button
          type="button"
          onClick={() => setShowSales((s) => !s)}
          className={cn(
            sectionHeadCls,
            'text-accent border-accent/20 w-full hover:text-accent-hover transition-colors'
          )}
        >
          <span>Discovery call · sales</span>
          {showSales ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {showSales && (
          <div>
            {/* Temperature pills */}
            <div className="mb-4">
              <label className={labelCls}>Lead temperature</label>
              <div className="flex gap-2 flex-wrap">
                {LEAD_TEMPERATURE_OPTIONS.map((opt) => {
                  const active = temperature === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setTemperature(
                          active ? '' : (opt.value as LeadTemperature)
                        )
                      }
                      className={cn(
                        'px-3.5 py-2 rounded-full font-mono text-[12px] uppercase tracking-[0.14em] font-bold border transition-all',
                        active
                          ? ''
                          : 'border-border-soft text-text-muted hover:text-text hover:border-text-muted'
                      )}
                      style={
                        active
                          ? {
                              color: opt.color,
                              borderColor: opt.color + '60',
                              background: opt.color + '15',
                            }
                          : {}
                      }
                    >
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle"
                        style={{
                          background: active ? opt.color : '#3a4438',
                          boxShadow: active ? `0 0 6px ${opt.color}` : 'none',
                        }}
                      />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Plan discussed</label>
                <select
                  value={planDiscussed}
                  onChange={(e) =>
                    setPlanDiscussed(e.target.value as PlanDiscussed | '')
                  }
                  className={inputCls}
                >
                  <option value="">— Not yet —</option>
                  {PLAN_DISCUSSED_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Budget mentioned (₹)"
                value={budget}
                onChange={setBudget}
                placeholder="e.g. 15,000/month"
                labelCls={labelCls}
                inputCls={inputCls}
              />

              <div className="sm:col-span-2">
                <label className={cn(labelCls, 'mb-2')}>
                  Pricing discussed
                </label>
                <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={pricingDiscussed}
                    onChange={(e) => setPricingDiscussed(e.target.checked)}
                    className="w-4 h-4 rounded accent-accent cursor-pointer"
                  />
                  <span className="text-sm text-text">
                    Yes — they know our pricing
                  </span>
                </label>
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Objections / concerns</label>
                <textarea
                  value={objections}
                  onChange={(e) => setObjections(e.target.value)}
                  placeholder="e.g. needs to talk to spouse, worried about time commitment…"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent focus:outline-none resize-none"
                  style={{ fontSize: 13 }}
                />
              </div>

              <div>
                <label className={labelCls}>Next step</label>
                <select
                  value={nextStep}
                  onChange={(e) => setNextStep(e.target.value as NextStep | '')}
                  className={inputCls}
                >
                  <option value="">— Not decided —</option>
                  {NEXT_STEP_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Source channel"
                value={sourceChannel}
                onChange={setSourceChannel}
                placeholder="Instagram / referral / Google…"
                labelCls={labelCls}
                inputCls={inputCls}
              />

              <div>
                <label className={labelCls}>Discovery call date</label>
                <input
                  type="date"
                  value={discoveryCallDate}
                  onChange={(e) => setDiscoveryCallDate(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Follow-up at</label>
                <input
                  type="datetime-local"
                  value={followUpAt}
                  onChange={(e) => setFollowUpAt(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 3. About the client (Form-B profile fields) ─── */}
      <div className="mb-2">
        <button
          type="button"
          onClick={() => setShowProfile((s) => !s)}
          className={cn(
            sectionHeadCls,
            'text-accent border-accent/20 w-full hover:text-accent-hover transition-colors'
          )}
        >
          <span>About the client · discovery</span>
          {showProfile ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {showProfile && (
          <div className="space-y-5">
            {/* ── Personal ── */}
            <div>
              <SubHead label="Personal" />
              <div className="grid sm:grid-cols-2 gap-3">
                <Input
                  label="Age"
                  value={age}
                  onChange={(v) => setAge(v.replace(/\D/g, '').slice(0, 3))}
                  inputMode="numeric"
                  type="number"
                  placeholder="32"
                  labelCls={labelCls}
                  inputCls={inputCls}
                />
                <div>
                  <label className={labelCls}>Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender | '')}
                    className={inputCls}
                  >
                    <option value="">—</option>
                    {GENDER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Occupation"
                  value={occupation}
                  onChange={setOccupation}
                  placeholder="e.g. Software engineer"
                  labelCls={labelCls}
                  inputCls={inputCls}
                />
                <Input
                  label="City & country"
                  value={cityCountry}
                  onChange={setCityCountry}
                  placeholder="Bengaluru, India"
                  labelCls={labelCls}
                  inputCls={inputCls}
                />
              </div>
            </div>

            {/* ── Body baseline ── */}
            <div>
              <SubHead label="Body baseline" />
              <div className="grid sm:grid-cols-2 gap-3">
                <NumberWithSuffix
                  label="Height"
                  suffix="cm"
                  value={heightCm}
                  onChange={setHeightCm}
                  placeholder="170"
                  labelCls={labelCls}
                  inputCls={inputCls}
                />
                <NumberWithSuffix
                  label="Weight"
                  suffix="kg"
                  value={weightKg}
                  onChange={setWeightKg}
                  placeholder="72"
                  labelCls={labelCls}
                  inputCls={inputCls}
                />
              </div>
            </div>

            {/* ── Medical ── */}
            <div>
              <SubHead label="Medical" />
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Conditions</label>
                  <div className="flex flex-wrap gap-1.5">
                    {MEDICAL_CONDITION_OPTIONS.map((opt) => {
                      const active = medicalConditions.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setMedicalConditions((prev) => {
                              if (opt.value === 'none') {
                                return active ? [] : ['none'];
                              }
                              const next = prev.filter((v) => v !== 'none');
                              return active
                                ? next.filter((v) => v !== opt.value)
                                : [...next, opt.value];
                            });
                          }}
                          className={cn(
                            'px-3 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-[0.12em] font-bold border transition-all',
                            active
                              ? 'border-accent/60 text-accent bg-accent/15'
                              : 'border-border-soft text-text-muted hover:text-text hover:border-text-muted'
                          )}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>
                    Injuries / surgeries / medication notes
                  </label>
                  <textarea
                    value={injuriesNotes}
                    onChange={(e) => setInjuriesNotes(e.target.value)}
                    rows={3}
                    placeholder="Knee surgery 2022; takes thyroxine; lower-back flare-ups…"
                    className="w-full px-3 py-2.5 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent focus:outline-none resize-none"
                    style={{ fontSize: 13 }}
                  />
                </div>

                <div>
                  <label className={labelCls}>
                    Daily energy level{energyLevel ? ` · ${energyLevel}/10` : ''}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                      const on = energyLevel === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setEnergyLevel(on ? null : n)}
                          className={cn(
                            'w-9 h-9 rounded-lg border font-mono text-sm font-bold transition-all',
                            on
                              ? 'border-accent bg-accent text-bg'
                              : 'border-border-soft text-text-muted hover:border-text-muted hover:text-text'
                          )}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Habits + training ── */}
            <div>
              <SubHead label="Habits & training" />
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Food preference</label>
                  <select
                    value={foodPreference}
                    onChange={(e) =>
                      setFoodPreference(e.target.value as FoodPreference | '')
                    }
                    className={inputCls}
                  >
                    <option value="">—</option>
                    {FOOD_PREFERENCE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Workout experience</label>
                  <select
                    value={workoutExperience}
                    onChange={(e) =>
                      setWorkoutExperience(
                        e.target.value as WorkoutExperience | ''
                      )
                    }
                    className={inputCls}
                  >
                    <option value="">—</option>
                    {WORKOUT_EXPERIENCE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <YesNo
                  label="Currently working out"
                  value={currentlyWorkingOut}
                  onChange={setCurrentlyWorkingOut}
                  labelCls={labelCls}
                />
                <YesNo
                  label="Has gym access"
                  value={gymAccess}
                  onChange={setGymAccess}
                  labelCls={labelCls}
                />
                <div>
                  <label className={labelCls}>Training days / week</label>
                  <select
                    value={trainingDays}
                    onChange={(e) =>
                      setTrainingDays(e.target.value as TrainingDays | '')
                    }
                    className={inputCls}
                  >
                    <option value="">—</option>
                    {TRAINING_DAYS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Commitment duration</label>
                  <select
                    value={commitmentDuration}
                    onChange={(e) =>
                      setCommitmentDuration(
                        e.target.value as CommitmentDuration | ''
                      )
                    }
                    className={inputCls}
                  >
                    <option value="">—</option>
                    {COMMITMENT_DURATION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Footer: save + status ─── */}
      <div className="mt-6 pt-5 border-t border-border-soft flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-text-muted min-h-[20px]">
          {errorMsg && <span className="text-danger">{errorMsg}</span>}
          {!errorMsg &&
            savedAt &&
            Date.now() - savedAt < 2500 &&
            !isPending && (
              <span className="text-accent font-mono uppercase tracking-[0.16em] font-bold">
                ✓ Saved
              </span>
            )}
          {!errorMsg && !savedAt && dirty && !isPending && (
            <span className="font-mono uppercase tracking-[0.16em] font-bold text-amber">
              · Unsaved changes
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={isPending || !dirty}
          className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} strokeWidth={2.5} />
          )}
          Save changes
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Small helpers
// ════════════════════════════════════════════════════════════════════

function SubHead({ label }: { label: string }) {
  return (
    <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted font-bold mb-2.5">
      {label}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  inputMode,
  placeholder,
  disabled,
  colSpan2,
  labelCls,
  inputCls,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: 'numeric' | 'text' | 'tel' | 'email';
  placeholder?: string;
  disabled?: boolean;
  colSpan2?: boolean;
  labelCls: string;
  inputCls: string;
}) {
  return (
    <div className={colSpan2 ? 'sm:col-span-2' : ''}>
      <label className={labelCls}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        inputMode={inputMode}
        className={inputCls}
      />
    </div>
  );
}

function NumberWithSuffix({
  label,
  suffix,
  value,
  onChange,
  placeholder,
  labelCls,
  inputCls,
}: {
  label: string;
  suffix: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  labelCls: string;
  inputCls: string;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(inputCls, 'pr-12')}
        />
        <span
          aria-hidden
          className="absolute inset-y-0 right-3 flex items-center font-mono text-xs uppercase tracking-[0.14em] font-bold text-text-muted pointer-events-none"
        >
          {suffix}
        </span>
      </div>
    </div>
  );
}

function YesNo({
  label,
  value,
  onChange,
  labelCls,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
  labelCls: string;
}) {
  const Btn = ({ label, val }: { label: string; val: boolean }) => {
    const on = value === val;
    return (
      <button
        type="button"
        onClick={() => onChange(on ? null : val)}
        className={cn(
          'flex-1 h-11 rounded-lg border font-mono text-[12px] uppercase tracking-[0.14em] font-bold transition-all',
          on
            ? 'border-accent text-accent bg-accent/10'
            : 'border-border-soft text-text-muted hover:text-text hover:border-text-muted'
        )}
      >
        {label}
      </button>
    );
  };
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex gap-2">
        <Btn label="Yes" val={true} />
        <Btn label="No" val={false} />
      </div>
    </div>
  );
}
