const colors = [
  { name: 'bg', className: 'bg-bg' },
  { name: 'surface', className: 'bg-surface border border-border' },
  { name: 'primary', className: 'bg-primary' },
  { name: 'secondary', className: 'bg-secondary' },
  { name: 'accent', className: 'bg-accent' },
  { name: 'warm', className: 'bg-warm' },
  { name: 'text', className: 'bg-text' },
  { name: 'text2', className: 'bg-text2' },
  { name: 'success', className: 'bg-success' },
  { name: 'warning', className: 'bg-warning' },
  { name: 'danger', className: 'bg-danger' },
  { name: 'border', className: 'bg-border' }
];

const spacing = [
  { name: 'page', className: 'px-page' },
  { name: 'section', className: 'px-section' }
];

export default function TokensPage() {
  return (
    <main className="container-page space-y-10 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Design tokens</h1>
        <p className="text-text2">Base visual para toda a experiência care-first.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Cores</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {colors.map((color) => (
            <div key={color.name} className="rounded-lg border border-border bg-surface p-4">
              <div className={`h-16 rounded-md ${color.className}`} />
              <p className="mt-3 text-sm font-semibold text-text">{color.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Tipografia</h2>
        <div className="rounded-lg border border-border bg-surface p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-secondary">Heading / Poppins</p>
          <h3 className="mt-2 text-3xl font-semibold">Cuidar com confiança e calma.</h3>
          <p className="mt-4 text-sm uppercase tracking-[0.3em] text-secondary">Body / Inter</p>
          <p className="mt-2 text-lg text-text2">
            Textos confortáveis, com espaçamento adequado e contraste gentil para leitura prolongada.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Espaçamento</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {spacing.map((item) => (
            <div key={item.name} className="rounded-lg border border-border bg-surface p-4">
              <div className={`h-10 ${item.className} bg-accent/30 rounded-md`} />
              <p className="mt-2 text-sm text-text">Padding {item.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Focus ring</h2>
        <button className="focus-ring rounded-md border border-border bg-surface px-4 py-2 text-sm">
          Clique e veja o foco suave
        </button>
      </section>
    </main>
  );
}
