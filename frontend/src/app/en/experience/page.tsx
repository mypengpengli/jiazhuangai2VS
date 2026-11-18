import ExperiencePage, { type ExperiencePageProps } from '@/components/pages/ExperiencePage';

export const metadata = { title: { absolute: 'Field Notes | Jiazhuang AI' } };

export default function Page(props: ExperiencePageProps) {
  return <ExperiencePage {...props} locale="en" />;
}
