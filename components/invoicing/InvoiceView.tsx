import type { InvoiceWithItems, CompanySettings } from '@/lib/data/invoices';
import { formatMoney } from '@/lib/data/invoices';

interface Props {
  invoice: InvoiceWithItems;
  settings: CompanySettings | null;
}

/**
 * Presentation component for a single invoice. Same layout used
 * by the admin's invoice detail page AND the client's invoice
 * view — so once shipped, edits to the design flow to both
 * surfaces automatically.
 *
 * Print-safe: on print, the outer dark background is dropped and
 * only the paper prints, giving users a clean PDF via
 * Browser → Print → Save as PDF.
 *
 * Design follows the mock we shipped at
 * teampurex-invoice-mock.html — Team Purex wordmark, gold
 * accent thread, warm off-white paper.
 */
export function InvoiceView({ invoice, settings }: Props) {
  const isUK = invoice.currency === 'GBP';
  // Customer-facing status label: "SENT" was accurate but read as
  // "you already got this" — client-friendly is "PENDING" (i.e.
  // pending payment). DB status stays 'sent' for admin clarity.
  const statusLabel =
    invoice.status === 'sent'
      ? 'PENDING'
      : invoice.status.toUpperCase();
  const statusColor =
    invoice.status === 'paid'
      ? '#c6ff3d'
      : invoice.status === 'sent'
        ? '#ffd24d'
        : invoice.status === 'void'
          ? '#ff6b6b'
          : '#7dd3ff';

  const paymentUpi = !isUK ? settings?.indiaUpiId : null;

  return (
    <>
      <style>{`
        @page { size: A4; margin: 0; }
        @media print {
          body { background: white !important; }
          .invoice-stage-outer { background: white !important; padding: 0 !important; min-height: 0 !important; }
          .invoice-paper { box-shadow: none !important; border-radius: 0 !important; }
          .print-hide { display: none !important; }
        }
      `}</style>

      <div
        className="invoice-stage-outer"
        style={{
          padding: '32px 16px 64px',
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(212,160,80,0.08) 0%, transparent 55%), #0d0f0b',
          minHeight: '100vh',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div
            className="invoice-paper"
            style={{
              background: '#fbf9f4',
              borderRadius: 6,
              overflow: 'hidden',
              boxShadow: '0 32px 80px -18px rgba(0,0,0,0.42)',
              color: '#1a1c17',
              fontSize: 15,
              lineHeight: 1.5,
            }}
          >
            {/* HERO */}
            <div
              style={{
                background: 'linear-gradient(180deg, #14180f 0%, #0d0f0b 100%)',
                padding: '32px 44px 28px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 32,
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 2,
                  background:
                    'linear-gradient(90deg, transparent 0%, #d4a050 20%, #d4a050 80%, transparent 100%)',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: '0.44em',
                    color: 'rgba(250,244,228,0.96)',
                    marginBottom: 7,
                    paddingLeft: 3,
                  }}
                >
                  TEAM
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                  <span
                    style={{
                      fontSize: 34,
                      fontWeight: 900,
                      color: 'rgba(250,244,228,0.98)',
                      letterSpacing: '-0.005em',
                    }}
                  >
                    PURE
                  </span>
                  <span
                    style={{
                      fontSize: 34,
                      fontWeight: 900,
                      color: '#c6ff3d',
                      textShadow: '0 0 22px rgba(198,255,61,0.32)',
                    }}
                  >
                    X
                  </span>
                </div>
                <div
                  style={{
                    marginTop: 14,
                    fontFamily: '"SF Mono", Menlo, Consolas, monospace',
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: '0.28em',
                    textTransform: 'uppercase',
                    color: '#d4a050',
                  }}
                >
                  Train for life. Not just aesthetics.
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    color: '#d4a050',
                    fontFamily: '"SF Mono", Menlo, Consolas, monospace',
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.28em',
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  Invoice
                </div>
                <div
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    color: 'rgba(250,244,228,0.98)',
                    fontSize: 22,
                    fontWeight: 500,
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {invoice.invoiceNumber}
                </div>
              </div>
            </div>

            {/* META */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr auto',
                gap: 32,
                padding: '24px 44px',
                background: '#fbf3e0',
                borderBottom: '1px solid #e8e2d4',
                alignItems: 'center',
              }}
            >
              <MetaItem label="Issued" value={fmtDate(invoice.issueDate)} strong />
              <MetaItem label="Due by" value={fmtDate(invoice.dueDate)} strong />
              <MetaItem
                label="Reference"
                value={invoice.reference || '—'}
              />
              <StatusPill label={statusLabel} color={statusColor} />
            </div>

            {/* ADDRESSES */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 48,
                padding: '40px 44px 32px',
              }}
            >
              <AddrBlock
                label="Billed to"
                name={invoice.billToName}
                lines={[
                  ...(invoice.billToAddress?.split('\n') ?? []),
                ]}
                monoLine={invoice.billToEmail}
              />
              <AddrBlock
                label="From"
                name={invoice.billFromName}
                lines={invoice.billFromAddress?.split('\n') ?? []}
                monoLine={settings?.billingEmail ?? 'info.teampurex@gmail.com'}
              />
            </div>

            {/* LINE ITEMS */}
            <div style={{ padding: '0 44px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 76px 96px 60px 108px',
                  gap: 20,
                  padding: '14px 0 12px',
                  borderTop: '1.5px solid #1a1c17',
                  borderBottom: '1px solid #e8e2d4',
                  fontFamily: '"SF Mono", Menlo, Consolas, monospace',
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: '#1a1c17',
                }}
              >
                <div>Service</div>
                <div style={{ textAlign: 'right' }}>Qty</div>
                <div style={{ textAlign: 'right' }}>Unit price</div>
                <div style={{ textAlign: 'right' }}>
                  {isUK ? 'VAT' : 'GST'}
                </div>
                <div style={{ textAlign: 'right' }}>Amount</div>
              </div>

              {invoice.lineItems.map((li) => (
                <div
                  key={li.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 76px 96px 60px 108px',
                    gap: 20,
                    padding: '22px 0',
                    borderBottom: '1px solid #f0ebde',
                    alignItems: 'baseline',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: 'Georgia, serif',
                        fontSize: 16.5,
                        color: '#1a1c17',
                        letterSpacing: '-0.005em',
                        lineHeight: 1.3,
                        marginBottom: 4,
                        fontWeight: 500,
                      }}
                    >
                      {li.descriptionTitle}
                    </div>
                    {li.descriptionBody && (
                      <div
                        style={{
                          fontSize: 12.5,
                          color: '#82857a',
                          lineHeight: 1.5,
                          maxWidth: '34em',
                        }}
                      >
                        {li.descriptionBody}
                      </div>
                    )}
                  </div>
                  <NumCell>{li.quantity}</NumCell>
                  <NumCell>
                    {formatMoney(li.unitPrice, invoice.currency)}
                  </NumCell>
                  <NumCell>
                    {Math.round(invoice.vatRate * 100)}%
                  </NumCell>
                  <NumCell bold>
                    {formatMoney(li.lineTotal, invoice.currency)}
                  </NumCell>
                </div>
              ))}
            </div>

            {/* TOTALS */}
            <div
              style={{
                padding: '24px 44px 32px',
                display: 'grid',
                gridTemplateColumns: '1fr 300px',
                gap: 32,
                alignItems: 'end',
              }}
            >
              <div
                style={{
                  color: '#82857a',
                  fontSize: 12,
                  lineHeight: 1.6,
                  paddingTop: 8,
                }}
              >
                {isUK ? (
                  invoice.billFromVatNumber ? (
                    <>
                      VAT charged at UK standard rate. {invoice.billFromName} is
                      registered for VAT in the United Kingdom
                      {invoice.billFromVatNumber
                        ? ` under ${invoice.billFromVatNumber}`
                        : ''}
                      .
                    </>
                  ) : (
                    <>VAT is not applied on this invoice.</>
                  )
                ) : invoice.billFromGstNumber ? (
                  <>
                    GST charged at Indian standard rate. GSTIN{' '}
                    {invoice.billFromGstNumber}.
                  </>
                ) : (
                  <>GST is not applied on this invoice.</>
                )}{' '}
                Please retain this invoice for your records.
              </div>

              <div style={{ display: 'grid', gap: 8 }}>
                <TotalRow
                  label="Subtotal"
                  value={formatMoney(invoice.subtotalAmount, invoice.currency)}
                />
                {invoice.vatRate > 0 && (
                  <TotalRow
                    label={`${isUK ? 'VAT' : 'GST'} · ${Math.round(invoice.vatRate * 100)}%`}
                    value={formatMoney(invoice.vatAmount, invoice.currency)}
                  />
                )}
                <div
                  style={{
                    marginTop: 12,
                    padding: '18px 20px',
                    background: '#0d0f0b',
                    color: '#fbf9f4',
                    borderRadius: 6,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 4,
                      background: '#d4a050',
                    }}
                  />
                  <div
                    style={{
                      fontFamily: '"SF Mono", Menlo, Consolas, monospace',
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.24em',
                      fontWeight: 700,
                      color: '#d4a050',
                    }}
                  >
                    Total due
                  </div>
                  <div
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: 26,
                      fontWeight: 500,
                      letterSpacing: '-0.005em',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatMoney(invoice.totalAmount, invoice.currency)}
                  </div>
                </div>
              </div>
            </div>

            {/* PAYMENT */}
            {hasPaymentInfo(settings, isUK) && (
              <div
                style={{
                  padding: '0 44px 32px',
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: 20,
                }}
              >
                {isUK && settings?.ukSortCode && settings.ukAccountNumber && (
                  <PayCard
                    label="Pay by bank transfer"
                    heading={settings.ukAccountHolder ?? invoice.billFromName}
                    kv={[
                      ['Bank', settings.ukBankName ?? 'Bank'],
                      ['Sort code', settings.ukSortCode],
                      ['Account', settings.ukAccountNumber],
                      ['Reference', invoice.invoiceNumber],
                    ]}
                  />
                )}
                {!isUK &&
                  settings?.indiaIfsc &&
                  settings.indiaAccountNumber && (
                    <PayCard
                      label="Pay by bank transfer"
                      heading={settings.indiaAccountHolder ?? invoice.billFromName}
                      kv={[
                        ['Bank', settings.indiaBankName ?? 'Bank'],
                        ['IFSC', settings.indiaIfsc],
                        ['Account', settings.indiaAccountNumber],
                        ['Reference', invoice.invoiceNumber],
                      ]}
                    />
                  )}
                {paymentUpi && (
                  <PayCard
                    label="Pay by UPI"
                    heading="UPI"
                    kv={[
                      ['UPI ID', paymentUpi],
                      ['Reference', invoice.invoiceNumber],
                    ]}
                  />
                )}
              </div>
            )}

            {/* COACH NOTE */}
            {invoice.coachNote && (
              <div style={{ padding: '0 44px 28px' }}>
                <div
                  style={{
                    borderLeft: '3px solid #d4a050',
                    padding: '6px 18px',
                    color: '#4a4d43',
                    fontSize: 13,
                    lineHeight: 1.65,
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                  }}
                >
                  {invoice.coachNote}
                </div>
              </div>
            )}

            {/* FOOTER */}
            <div
              style={{
                background: '#0d0f0b',
                color: 'rgba(245,240,225,0.62)',
                padding: '26px 44px 28px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 32,
                fontSize: 11,
                lineHeight: 1.7,
                borderTop: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                    color: '#d4a050',
                    fontSize: 13,
                  }}
                >
                  Train for life. Not just aesthetics.
                </div>
                <div style={{ marginTop: 6 }}>
                  Questions?{' '}
                  <strong style={{ color: 'rgba(250,244,228,0.92)' }}>
                    {settings?.billingEmail ?? 'info.teampurex@gmail.com'}
                  </strong>
                </div>
              </div>
              <div
                style={{
                  textAlign: 'right',
                  fontFamily: '"SF Mono", Menlo, Consolas, monospace',
                  fontSize: 10,
                  letterSpacing: '0.06em',
                  color: 'rgba(245,240,225,0.48)',
                }}
              >
                <div>{invoice.billFromName}</div>
                {invoice.billFromCompanyRegistrationNumber && (
                  <div style={{ marginTop: 4 }}>
                    Reg. no. {invoice.billFromCompanyRegistrationNumber}
                  </div>
                )}
                {(invoice.billFromVatNumber || invoice.billFromGstNumber) && (
                  <div style={{ marginTop: 4 }}>
                    {isUK && invoice.billFromVatNumber
                      ? `VAT no. ${invoice.billFromVatNumber}`
                      : !isUK && invoice.billFromGstNumber
                        ? `GSTIN ${invoice.billFromGstNumber}`
                        : ''}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function hasPaymentInfo(s: CompanySettings | null, isUK: boolean): boolean {
  if (!s) return false;
  if (isUK) return !!(s.ukSortCode && s.ukAccountNumber);
  return !!(
    (s.indiaIfsc && s.indiaAccountNumber) ||
    s.indiaUpiId
  );
}

function MetaItem({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: '"SF Mono", Menlo, Consolas, monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.20em',
          fontSize: 9.5,
          fontWeight: 700,
          color: '#82857a',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13.5,
          color: '#1a1c17',
          fontWeight: strong ? 600 : 400,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function StatusPill({ label, color }: { label: string; color: string }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        background: '#0d0f0b',
        color,
        borderRadius: 999,
        fontFamily: '"SF Mono", Menlo, Consolas, monospace',
        textTransform: 'uppercase',
        letterSpacing: '0.20em',
        fontSize: 10,
        fontWeight: 700,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: color,
          boxShadow: `0 0 0 4px ${color}22`,
        }}
      />
      {label}
    </div>
  );
}

function AddrBlock({
  label,
  name,
  lines,
  monoLine,
}: {
  label: string;
  name: string;
  lines: string[];
  monoLine?: string | null;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: '"SF Mono", Menlo, Consolas, monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.22em',
          fontSize: 10,
          fontWeight: 700,
          color: '#b98836',
          marginBottom: 12,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'Georgia, serif',
          fontWeight: 500,
          fontSize: 20,
          color: '#1a1c17',
          lineHeight: 1.25,
          marginBottom: 6,
          letterSpacing: '-0.005em',
        }}
      >
        {name}
      </div>
      {lines.filter(Boolean).map((line, i) => (
        <div
          key={i}
          style={{ color: '#4a4d43', fontSize: 13.5, lineHeight: 1.55 }}
        >
          {line}
        </div>
      ))}
      {monoLine && (
        <div
          style={{
            fontFamily: '"SF Mono", Menlo, Consolas, monospace',
            fontSize: 11.5,
            color: '#82857a',
            marginTop: 6,
            letterSpacing: '0.04em',
          }}
        >
          {monoLine}
        </div>
      )}
    </div>
  );
}

function NumCell({
  children,
  bold,
}: {
  children: React.ReactNode;
  bold?: boolean;
}) {
  return (
    <div
      style={{
        fontVariantNumeric: 'tabular-nums',
        fontSize: 14,
        color: '#1a1c17',
        textAlign: 'right',
        fontWeight: bold ? 600 : 400,
      }}
    >
      {children}
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        fontSize: 13.5,
        color: '#4a4d43',
        fontVariantNumeric: 'tabular-nums',
        padding: '2px 0',
      }}
    >
      <div
        style={{
          fontFamily: '"SF Mono", Menlo, Consolas, monospace',
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#82857a',
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      <div>{value}</div>
    </div>
  );
}

function PayCard({
  label,
  heading,
  kv,
}: {
  label: string;
  heading: string;
  kv: Array<[string, string]>;
}) {
  return (
    <div
      style={{
        background: '#fbf9f4',
        border: '1px solid #e8e2d4',
        borderRadius: 6,
        padding: '22px 22px 20px',
      }}
    >
      <div
        style={{
          fontFamily: '"SF Mono", Menlo, Consolas, monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.20em',
          fontSize: 10,
          fontWeight: 700,
          color: '#b98836',
          marginBottom: 12,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'Georgia, serif',
          fontWeight: 500,
          fontSize: 16,
          margin: '0 0 10px',
          color: '#1a1c17',
          letterSpacing: '-0.005em',
        }}
      >
        {heading}
      </div>
      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: '92px 1fr',
          gap: '4px 14px',
          fontSize: 13,
          color: '#4a4d43',
          fontVariantNumeric: 'tabular-nums',
          margin: 0,
        }}
      >
        {kv.map(([k, v]) => (
          <div
            key={k}
            style={{ display: 'contents' }}
          >
            <dt
              style={{
                color: '#82857a',
                fontFamily: '"SF Mono", Menlo, Consolas, monospace',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
                fontWeight: 600,
                paddingTop: 3,
              }}
            >
              {k}
            </dt>
            <dd
              style={{ margin: 0, color: '#1a1c17', letterSpacing: '0.02em' }}
            >
              {v}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
