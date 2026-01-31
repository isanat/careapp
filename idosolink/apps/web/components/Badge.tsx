export const Badge = ({ label }: { label: string }) => {
  return (
    <span className="inline-flex items-center rounded-full bg-accent/20 px-3 py-1 text-xs text-accent">
      {label}
    </span>
  );
};
