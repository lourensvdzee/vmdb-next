import { Metadata } from 'next';
import ResetPasswordClient from './ResetPasswordClient';

export const metadata: Metadata = {
  title: 'Reset Password | VMDb',
  description: 'Set a new password for your VMDb account',
};

export default function ResetPasswordPage() {
  return (
    <main className="container mx-auto px-4 py-16">
      <ResetPasswordClient />
    </main>
  );
}
