import {
  IconBurn,
  IconCare,
  IconCaregiver,
  IconContract,
  IconFamily,
  IconPayment,
  IconReputation,
  IconSchedule,
  IconSupport,
  IconToken,
  IconWallet
} from '../../../components/icons';

const icons = [
  { name: 'IconCare', Component: IconCare },
  { name: 'IconFamily', Component: IconFamily },
  { name: 'IconCaregiver', Component: IconCaregiver },
  { name: 'IconContract', Component: IconContract },
  { name: 'IconWallet', Component: IconWallet },
  { name: 'IconToken', Component: IconToken },
  { name: 'IconReputation', Component: IconReputation },
  { name: 'IconSchedule', Component: IconSchedule },
  { name: 'IconPayment', Component: IconPayment },
  { name: 'IconBurn', Component: IconBurn },
  { name: 'IconSupport', Component: IconSupport }
];

const sizes = [16, 20, 24, 32];
const colors = ['text-primary', 'text-secondary', 'text-text2'];

export default function IconsPage() {
  return (
    <main className="container-page space-y-8 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Ícones</h1>
        <p className="text-text2">Pack proprietário com traços arredondados e amigáveis.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {icons.map(({ name, Component }) => (
          <div key={name} className="rounded-[14px] border border-border/10 bg-surface p-4">
            <div className="flex flex-wrap items-center gap-3">
              {sizes.map((size) => (
                <Component key={size} className="text-primary" style={{ width: size, height: size }} />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              {colors.map((color) => (
                <Component key={color} className={`${color} h-5 w-5`} />
              ))}
            </div>
            <p className="mt-3 text-sm font-semibold text-text">{name}</p>
            <pre className="mt-2 rounded-md bg-bg px-3 py-2 text-xs text-text2">
              {`<${name} className="h-5 w-5 text-primary" />`}
            </pre>
          </div>
        ))}
      </div>
    </main>
  );
}
