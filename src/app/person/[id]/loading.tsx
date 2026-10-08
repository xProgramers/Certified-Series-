export default function Loading() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-12 sm:px-8 sm:pt-16" aria-label="Carregando" aria-busy>
      <div className="grid gap-8 md:grid-cols-[minmax(0,240px)_1fr] md:gap-14">
        <div className="skeleton aspect-[2/3] w-36 rounded-lg sm:w-44 md:w-full" />
        <div>
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton mt-5 h-16 w-2/3 max-w-md rounded-lg" />
          <div className="skeleton mt-8 h-24 w-full max-w-2xl rounded" />
        </div>
      </div>
    </div>
  );
}
