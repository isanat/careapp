import { redirect } from 'next/navigation';

export default function CaregiverLegacyRedirect({ params }: { params: { id: string } }) {
  redirect(`/app/caregivers/${params.id}`);
}
