"use client";

import { redirect } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export default function PaymentsPage() {
  const { status } = useSession();

  useEffect(() => {
    // Redirect to dashboard as payments/wallet feature was removed
    if (status === 'authenticated') {
      redirect('/app/dashboard');
    }
  }, [status]);

  return null;
}
