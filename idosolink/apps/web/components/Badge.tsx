export const Badge = ({ label }: { label: string }) => {
  return (
    <span className="inline-flex items-center rounded-full bg-secondary/20 px-3 py-1 text-xs text-secondary">
      {label}
    </span>
  );
};
