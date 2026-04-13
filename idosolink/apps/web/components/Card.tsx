import { Card as BaseCard, CardContent, CardHeader, CardTitle } from './ui/card';

export const Card = ({ title, children }: { title?: string; children: React.ReactNode }) => {
  return (
    <BaseCard>
      {title ? (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      ) : null}
      <CardContent>{children}</CardContent>
    </BaseCard>
  );
};
