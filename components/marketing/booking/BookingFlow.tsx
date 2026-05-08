'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Video,
  MapPin,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Label, FieldError } from '@/components/ui/Input';
import { BookingStepper } from './BookingStepper';
import { PreConsultForm } from './PreConsultForm';
import {
  type Expert,
  FALLBACK_EXPERTS,
} from '@/lib/constants';
import {
  getServicesForExpert,
  getServiceById,
  getFormTemplate,
  type Service,
} from '@/lib/services';
import { submitBooking, type BookingActionState } from '@/lib/actions/bookings';
import { cn } from '@/lib/cn';

const STEPS = ['Expert', 'Service', 'Intake', 'Schedule', 'Confirm'];

interface BookingFlowProps {
  preselectedExpertSlug?: string;
}

type TimeSlot = 'morning' | 'afternoon' | 'evening';
type BookingFormat = 'online' | 'in_person' | 'hybrid';

export function BookingFlow({ preselectedExpertSlug }: BookingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(preselectedExpertSlug ? 1 : 0);
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Booking state
  const [expert, setExpert] = useState<Expert | null>(
    preselectedExpertSlug
      ? FALLBACK_EXPERTS.find((e) => e.slug === preselectedExpertSlug) ?? null
      : null
  );
  const [service, setService] = useState<Service | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | string[]>>({});
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<TimeSlot | ''>('');
  const [alternateDate, setAlternateDate] = useState('');
  const [format, setFormat] = useState<BookingFormat>('online');

  // Personal info (step 4)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);

  // Validation errors per step
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation helpers
  const validateFormStep = () => {
    if (!service) return false;
    const template = getFormTemplate(service.formTemplateId);
    if (!template) return true;
    const newErrors: Record<string, string> = {};
    template.fields.forEach((field) => {
      if (field.required) {
        const val = formValues[field.id];
        const isEmpty =
          val === undefined ||
          val === '' ||
          (Array.isArray(val) && val.length === 0);
        if (isEmpty) newErrors[field.id] = 'This field is required';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSchedule = () => {
    const newErrors: Record<string, string> = {};
    if (!preferredDate) newErrors.preferredDate = 'Select a preferred date';
    if (!preferredTimeSlot) newErrors.preferredTimeSlot = 'Select a time slot';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateConfirm = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName || fullName.trim().length < 2) newErrors.fullName = 'Enter your full name';
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Enter a valid email';
    if (!phone || phone.trim().length < 10) newErrors.phone = 'Enter a valid phone number';
    if (!consent) newErrors.consent = 'You must agree to be contacted';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    setErrors({});
    if (step === 2 && !validateFormStep()) return;
    if (step === 3 && !validateSchedule()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = () => {
    if (!validateConfirm()) return;
    if (!expert || !service) return;

    setSubmitError(null);

    const fd = new FormData();
    fd.set('fullName', fullName);
    fd.set('email', email);
    fd.set('phone', phone);
    fd.set('expertSlug', expert.slug);
    fd.set('serviceId', service.id);
    fd.set('preferredDate', preferredDate);
    fd.set('preferredTimeSlot', preferredTimeSlot as string);
    if (alternateDate) fd.set('alternateDate', alternateDate);
    fd.set('format', format);
    fd.set('formResponse', JSON.stringify(formValues));
    if (consent) fd.set('consent', 'on');

    startTransition(async () => {
      const initialState: BookingActionState = { ok: false };
      const result = await submitBooking(initialState, fd);
      // submitBooking redirects on success, so we only hit this on error
      if (!result.ok) {
        setSubmitError(result.error ?? 'Something went wrong');
        if (result.fieldErrors) setErrors(result.fieldErrors);
      }
    });
  };

  // Today's date for min on date input
  const today = new Date().toISOString().split('T')[0];
  const services = expert ? getServicesForExpert(expert.slug) : [];
  const template = service ? getFormTemplate(service.formTemplateId) : null;

  return (
    <div className="max-w-3xl mx-auto">
      <BookingStepper steps={STEPS} current={step} />

      <div className="bg-bg-card border border-border rounded-xl p-6 md:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* ─── STEP 0: Choose expert ─── */}
            {step === 0 && (
              <div>
                <span className="eyebrow-accent">Step 1 of 5</span>
                <h2 className="mt-2 font-display font-semibold text-2xl md:text-3xl tracking-tight">
                  Who would you like to speak with?
                </h2>
                <p className="mt-2 text-sm text-text-muted">
                  Not sure? Start with Siva Jampana (Operations) — he&rsquo;ll recommend the right person.
                </p>

                <div className="mt-8 grid md:grid-cols-2 gap-3">
                  {FALLBACK_EXPERTS.map((e) => (
                    <button
                      key={e.slug}
                      onClick={() => {
                        setExpert(e);
                        setService(null);
                        setStep(1);
                      }}
                      className="text-left p-4 rounded-lg bg-bg-inset border border-border hover:border-accent/60 transition-all group"
                    >
                      <div className="font-display font-semibold text-base tracking-tight group-hover:text-accent transition-colors">
                        {e.name}
                      </div>
                      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-medium">
                        {e.title}
                      </div>
                      <div className="mt-3 text-xs text-text-muted line-clamp-2 leading-relaxed">
                        {e.bioShort}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ─── STEP 1: Choose service ─── */}
            {step === 1 && expert && (
              <div>
                <span className="eyebrow-accent">Step 2 of 5</span>
                <h2 className="mt-2 font-display font-semibold text-2xl md:text-3xl tracking-tight">
                  What would you like to book with {expert.name}?
                </h2>

                <div className="mt-8 space-y-3">
                  {services.length === 0 && (
                    <p className="text-sm text-text-muted">
                      No services currently available for this expert.
                    </p>
                  )}
                  {services.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setService(s);
                        setFormat(s.format);
                        setStep(2);
                      }}
                      className={cn(
                        'w-full text-left p-4 md:p-5 rounded-lg border transition-all group',
                        'bg-bg-inset border-border hover:border-accent/60'
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-display font-semibold text-lg tracking-tight">
                            {s.name}
                          </div>
                          <p className="mt-2 text-sm text-text-muted leading-relaxed">
                            {s.description}
                          </p>
                          <div className="mt-3 flex items-center gap-4 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-medium">
                              <Clock size={12} />
                              {s.durationMinutes}min
                            </span>
                            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-medium">
                              {s.format === 'online' ? <Video size={12} /> : <MapPin size={12} />}
                              {s.format === 'online'
                                ? 'Online'
                                : s.format === 'in_person'
                                ? 'In-person'
                                : 'Online or in-person'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="font-display font-bold text-lg text-accent">
                            {s.priceDisplay}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ─── STEP 2: Pre-consultation form ─── */}
            {step === 2 && expert && service && template && (
              <div>
                <span className="eyebrow-accent">Step 3 of 5</span>
                <h2 className="mt-2 font-display font-semibold text-2xl md:text-3xl tracking-tight">
                  {template.name}
                </h2>

                <div className="mt-8">
                  <PreConsultForm
                    template={template}
                    values={formValues}
                    onChange={(id, value) =>
                      setFormValues((prev) => ({ ...prev, [id]: value }))
                    }
                    errors={errors}
                  />
                </div>
              </div>
            )}

            {/* ─── STEP 3: Schedule ─── */}
            {step === 3 && service && (
              <div>
                <span className="eyebrow-accent">Step 4 of 5</span>
                <h2 className="mt-2 font-display font-semibold text-2xl md:text-3xl tracking-tight">
                  When works for you?
                </h2>
                <p className="mt-2 text-sm text-text-muted">
                  We&rsquo;ll confirm the exact time within 24 hours of booking.
                </p>

                <div className="mt-8 space-y-6">
                  <div>
                    <Label htmlFor="preferredDate" required>
                      Preferred date
                    </Label>
                    <Input
                      id="preferredDate"
                      type="date"
                      min={today}
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      error={errors.preferredDate}
                    />
                    <FieldError message={errors.preferredDate} />
                  </div>

                  <div>
                    <Label required>Preferred time of day</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['morning', 'afternoon', 'evening'] as const).map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setPreferredTimeSlot(slot)}
                          className={cn(
                            'p-3 rounded-lg border text-sm font-medium capitalize transition-all',
                            preferredTimeSlot === slot
                              ? 'border-accent bg-accent/10 text-accent'
                              : 'border-border bg-bg-inset text-text hover:border-border-soft'
                          )}
                        >
                          {slot}
                          <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted font-medium normal-case">
                            {slot === 'morning' ? '6am–12pm' : slot === 'afternoon' ? '12–5pm' : '5–9pm'}
                          </div>
                        </button>
                      ))}
                    </div>
                    <FieldError message={errors.preferredTimeSlot} />
                  </div>

                  <div>
                    <Label htmlFor="alternateDate">Alternate date (optional)</Label>
                    <Input
                      id="alternateDate"
                      type="date"
                      min={today}
                      value={alternateDate}
                      onChange={(e) => setAlternateDate(e.target.value)}
                    />
                  </div>

                  {service.format === 'hybrid' && (
                    <div>
                      <Label required>Format</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['online', 'in_person'] as const).map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setFormat(f)}
                            className={cn(
                              'p-3 rounded-lg border text-sm font-medium capitalize transition-all',
                              format === f
                                ? 'border-accent bg-accent/10 text-accent'
                                : 'border-border bg-bg-inset text-text hover:border-border-soft'
                            )}
                          >
                            {f === 'online' ? 'Online' : 'In-person'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── STEP 4: Confirm ─── */}
            {step === 4 && expert && service && (
              <div>
                <span className="eyebrow-accent">Step 5 of 5</span>
                <h2 className="mt-2 font-display font-semibold text-2xl md:text-3xl tracking-tight">
                  Confirm your booking
                </h2>

                {/* Summary */}
                <div className="mt-8 p-5 rounded-lg bg-bg-inset border border-border space-y-3">
                  <SummaryRow label="With" value={expert.name} sub={expert.title} />
                  <SummaryRow label="Service" value={service.name} sub={service.priceDisplay} />
                  <SummaryRow
                    label="Preferred"
                    value={formatDate(preferredDate)}
                    sub={`${preferredTimeSlot} · ${format.replace('_', '-')}`}
                  />
                  {alternateDate && (
                    <SummaryRow label="Alternate" value={formatDate(alternateDate)} />
                  )}
                </div>

                {/* Personal info */}
                <div className="mt-8 space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName" required>
                        Full name
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Siva Reddy"
                        error={errors.fullName}
                      />
                      <FieldError message={errors.fullName} />
                    </div>
                    <div>
                      <Label htmlFor="phone" required>
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210 / +44 77 1234 5678"
                        error={errors.phone}
                      />
                      <FieldError message={errors.phone} />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" required>
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      error={errors.email}
                    />
                    <FieldError message={errors.email} />
                  </div>

                  <label className="flex items-start gap-3 p-4 rounded-lg border border-border bg-bg-inset cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={cn(
                        'w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors',
                        consent ? 'border-accent bg-accent' : 'border-border'
                      )}
                    >
                      {consent && (
                        <Check size={12} strokeWidth={3} className="text-bg" />
                      )}
                    </div>
                    <span className="text-sm text-text-muted leading-relaxed">
                      I agree to be contacted about this booking by WhatsApp or email, and I&rsquo;ve read the{' '}
                      <a href="/privacy" className="text-accent hover:underline">
                        privacy policy
                      </a>
                      .
                    </span>
                  </label>
                  <FieldError message={errors.consent} />

                  {submitError && (
                    <div className="p-4 rounded-lg bg-danger/10 border border-danger/40 text-danger text-sm">
                      {submitError}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-10 pt-6 border-t border-border flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={goBack}
            disabled={step === 0 || isPending}
            className={cn(step === 0 && 'invisible')}
          >
            <ArrowLeft size={16} />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              variant="primary"
              onClick={goNext}
              disabled={(step === 0 && !expert) || (step === 1 && !service)}
            >
              Continue
              <ArrowRight size={16} />
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Booking Request
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-medium mt-0.5">
        {label}
      </span>
      <div className="text-right">
        <div className="font-medium text-sm text-text">{value}</div>
        {sub && <div className="text-xs text-text-muted mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
