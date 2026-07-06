export default function PublicFormLoading() {
  return (
    <div className="min-h-screen bg-[#fafafa] px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-lg animate-pulse rounded-xl border border-[#e5e5e5] bg-white p-6 shadow-sm sm:p-8">
        <div className="mx-auto mb-6 h-6 w-2/3 rounded bg-[#f0f0f0]" />
        <div className="mb-2 h-4 w-full rounded bg-[#f5f5f5]" />
        <div className="mb-6 h-4 w-4/5 rounded bg-[#f5f5f5]" />
        <div className="space-y-4">
          <div className="h-10 rounded bg-[#f5f5f5]" />
          <div className="h-10 rounded bg-[#f5f5f5]" />
          <div className="h-10 rounded bg-[#f5f5f5]" />
        </div>
        <div className="mt-6 h-12 rounded-md bg-[#25D366]/30" />
      </div>
    </div>
  );
}
