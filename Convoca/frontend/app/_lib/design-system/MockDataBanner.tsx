export function MockDataBanner({ note }: { note?: string }) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-warning-bg px-3.5 py-1.5 text-[12.5px] font-semibold text-amber-700">
      <span>⚠️</span>
      Dados de exemplo — integração com a API ainda não existe{note ? ` (${note})` : ""}
    </div>
  );
}
