import { Paper, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/api/auth';
import { getDomainIds, getDomains, getUser } from '@/store/auth';

export default function WelcomeBanner(): JSX.Element {
  const { t } = useTranslation();
  const { data: currentUser } = useCurrentUser();

  const user = currentUser ?? getUser();
  const domains = currentUser?.domains ?? getDomains();
  const domainCount = currentUser?.domainIds.length ?? getDomainIds().length;

  const firstName = user?.firstName || user?.email || t('home.welcome.defaultName');

  let contextText = t('home.welcome.globalScope');
  if (domainCount === 1) {
    contextText = domains[0]?.name ?? t('home.welcome.globalScope');
  } else if (domainCount > 1) {
    contextText = t('home.welcome.nDomains', { count: domainCount });
  }

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2,
        mb: 3,
      }}
    >
      <Typography variant="h5">
        {`${t('home.welcome.greeting', { name: firstName })} — ${contextText}`}
      </Typography>
    </Paper>
  );
}
