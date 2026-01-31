import { Metadata } from 'next';
import LoginClient from './LoginClient';

export const metadata: Metadata = {
  title: 'Login | VMDb',
  description: 'Sign in or create an account on VMDb - The Vegan Meat Database',
};

export default function LoginPage() {
  return (
    <main className="container mx-auto px-4 py-16">
      <LoginClient />
    </main>
  );
}
