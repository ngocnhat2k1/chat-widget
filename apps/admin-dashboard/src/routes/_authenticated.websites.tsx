import { createFileRoute } from '@tanstack/react-router';
import { WebsitesPage } from '../pages/websites';

export const Route = createFileRoute('/_authenticated/websites')({
  component: WebsitesPage,
});
