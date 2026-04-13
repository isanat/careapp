'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input, Label } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { useAppStore } from '../../store';
import { IconCaregiver, IconReputation } from '../../../components/icons';

export default function SearchPage() {
  const caregivers = useAppStore((state) => state.caregivers);
  const role = useAppStore((state) => state.role);
  const [maxPrice, setMaxPrice] = useState('30');
  const [distance, setDistance] = useState('10');
  const [service, setService] = useState('Todos');

  const filtered = useMemo(() => {
    return caregivers.filter((caregiver) => {
      const priceOk = caregiver.priceHour <= Number(maxPrice);
      const distanceOk = caregiver.distanceKm <= Number(distance);
      const serviceOk = service === 'Todos' || caregiver.services.includes(service);
      return priceOk && distanceOk && serviceOk;
    });
  }, [caregivers, maxPrice, distance, service]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{role === 'CUIDADOR' ? 'Propostas disponíveis' : 'Buscar cuidadores'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price">Preço/hora (até)</Label>
              <Input id="price" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="distance">Distância (km)</Label>
              <Input id="distance" value={distance} onChange={(event) => setDistance(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service">Serviços</Label>
              <Select id="service" value={service} onChange={(event) => setService(event.target.value)}>
                <option>Todos</option>
                <option>Higiene</option>
                <option>Companhia</option>
                <option>Medicação</option>
                <option>Mobilidade</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filtered.map((caregiver) => (
          <Card key={caregiver.id}>
            <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <IconCaregiver className="h-10 w-10 text-primary" />
                <div>
                  <p className="text-lg font-semibold">{caregiver.name}</p>
                  <p className="text-sm text-text2">{caregiver.bio}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {caregiver.services.map((item) => (
                      <Badge key={item} status="neutral">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 text-text2">
                  <IconReputation className="h-4 w-4 text-primary" />
                  <span>{caregiver.rating} de reputação</span>
                </div>
                <p className="text-text">€{caregiver.priceHour}/hora · {caregiver.distanceKm} km</p>
                <Button size="sm" asChild>
                  <Link href={`/app/caregivers/${caregiver.id}`}>Ver perfil</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
