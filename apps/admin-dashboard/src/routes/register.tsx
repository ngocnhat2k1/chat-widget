import { createFileRoute, redirect } from '@tanstack/react-router';
import { RegisterPage } from '../pages/register';

export const Route = createFileRoute('/register')({
  beforeLoad: () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: RegisterPage,
});
