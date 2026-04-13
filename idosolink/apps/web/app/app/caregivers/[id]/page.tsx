'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { useAppStore } from '../../../store';
import { IconCaregiver, IconSchedule } from '../../../../components/icons';

export default function CaregiverDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caregivers = useAppStore((state) => state.caregivers);
  const caregiver = caregivers.find((item) => item.id === params.id);

  if (!caregiver) {
    return (
      <Card>
        <CardContent>
          <p className="text-text2">Cuidador não encontrado.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{caregiver.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <IconCaregiver className="h-8 w-8" />
            <p className="text-sm text-text2">Reputação {caregiver.rating} · €{caregiver.priceHour}/hora</p>
          </div>
          <p className="text-text2">{caregiver.bio}</p>
          <div className="flex flex-wrap gap-2">
            {caregiver.services.map((service) => (
              <Badge key={service} status="info">
                {service}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-text2">
            <IconSchedule className="h-4 w-4 text-primary" />
            {caregiver.availability}
          </div>
          <Button onClick={() => router.push('/app/contracts/new')}>Propor contrato</Button>
        </CardContent>
      </Card>
    </div>
  );
}
