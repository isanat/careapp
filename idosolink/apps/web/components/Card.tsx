export const Card = ({ title, children }: { title?: string; children: React.ReactNode }) => {
  return (
    <div className="glass-card p-5 space-y-3">
      {title ? <h3 className="text-lg font-semibold text-white">{title}</h3> : null}
      {children}
    </div>
  );
};
