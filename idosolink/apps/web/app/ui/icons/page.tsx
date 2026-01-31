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
  { name: 'Care', Component: IconCare },
  { name: 'Family', Component: IconFamily },
  { name: 'Caregiver', Component: IconCaregiver },
  { name: 'Contract', Component: IconContract },
  { name: 'Wallet', Component: IconWallet },
  { name: 'Token', Component: IconToken },
  { name: 'Reputation', Component: IconReputation },
  { name: 'Schedule', Component: IconSchedule },
  { name: 'Payment', Component: IconPayment },
  { name: 'Burn', Component: IconBurn },
  { name: 'Support', Component: IconSupport }
];

export default function IconsPage() {
  return (
    <main className="container-page space-y-8 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Ícones</h1>
        <p className="text-text2">Pack proprietário com traços arredondados e amigáveis.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {icons.map(({ name, Component }) => (
          <div key={name} className="rounded-lg border border-border bg-surface p-4 text-center">
            <Component className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-2 text-sm text-text">{name}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
