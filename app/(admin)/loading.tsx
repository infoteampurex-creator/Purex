/**
 * Admin root loading skeleton. Renders instantly on every admin
 * navigation so the WebView doesn't just show a frozen previous
 * page while the server fetches data.
 *
 * The skeleton is deliberately generic — matching the shape of the
 * most common admin pages (header + a couple of stat rows + a card
 * area) rather than a specific page layout, so it works for
 * /admin, /admin/clients, /admin/clients/[id], /admin/enquiries etc.
 */
export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-hidden>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/5" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-48 rounded bg-white/5" />
          <div className="h-3 w-32 rounded bg-white/5" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="h-24 rounded-xl bg-white/5" />
        <div className="h-24 rounded-xl bg-white/5" />
        <div className="h-24 rounded-xl bg-white/5" />
        <div className="h-24 rounded-xl bg-white/5" />
      </div>

      <div className="h-64 rounded-2xl bg-white/5" />
      <div className="h-40 rounded-2xl bg-white/5" />
    </div>
  );
}
