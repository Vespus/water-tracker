import { useTranslation } from 'react-i18next';

export default function Stats() {
  const { t } = useTranslation();
  return <div className="p-4"><h1 className="text-2xl font-bold">{t('nav.stats')}</h1></div>;
}
