export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#0a0c09] px-4 pt-6 pb-24 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-14 w-2/3 animate-pulse rounded-lg bg-white/5" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="h-32 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-32 animate-pulse rounded-2xl bg-white/5" />
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="h-48 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-48 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-48 animate-pulse rounded-2xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}
