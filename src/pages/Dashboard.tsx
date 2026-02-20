import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { t } = useTranslation();
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{t('nav.dashboard')}</h1>
      <p className="text-gray-500 mt-2">{t('dashboard.today')}</p>
    </div>
  );
}
