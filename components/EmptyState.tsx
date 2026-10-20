export function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
      <h2 className="text-lg font-semibold">Hələ məlumat yoxdur</h2>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Yuxarıdakı <strong>“Sinxron et”</strong> düyməsi ilə əmsalları yükləyin.
      </p>
    </div>
  );
}
