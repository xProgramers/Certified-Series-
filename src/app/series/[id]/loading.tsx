export default function Loading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 pt-16 sm:px-8" aria-label="Carregando" aria-busy>
      <div className="skeleton h-4 w-40 rounded" />
      <div className="skeleton mt-6 h-20 w-2/3 max-w-xl rounded-lg" />
      <div className="card-grid mt-16">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton aspect-[5/8] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
