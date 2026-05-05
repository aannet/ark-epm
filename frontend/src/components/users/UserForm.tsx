import { useEffect, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Role } from '@/types/auth';
import { Domain } from '@/types/domain';

export interface UserFormValues {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
  domainIds: string[];
  isActive: boolean;
}

interface UserFormProps {
  mode: 'create' | 'edit';
  initialValues?: Partial<UserFormValues>;
  roles: Role[];
  domains: Domain[];
  isLoading: boolean;
  canWrite: boolean;
  error: string | null;
  onSubmit: (values: UserFormValues) => Promise<void>;
  onCancel: () => void;
}

const DEFAULT_VALUES: UserFormValues = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  roleId: '',
  domainIds: [],
  isActive: true,
};

export default function UserForm({
  mode,
  initialValues,
  roles,
  domains,
  isLoading,
  canWrite,
  error,
  onSubmit,
  onCancel,
}: UserFormProps): JSX.Element {
  const { t } = useTranslation();
  const [values, setValues] = useState<UserFormValues>({
    ...DEFAULT_VALUES,
    ...initialValues,
  });
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    if (initialValues) {
      setValues((prev) => ({
        ...prev,
        ...initialValues,
      }));
    }
  }, [initialValues]);

  const selectedDomains = domains.filter((domain) => values.domainIds.includes(domain.id));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldError(null);

    if (mode === 'create' && !values.password.trim()) {
      setFieldError(t('users.form.passwordRequired'));
      return;
    }

    await onSubmit(values);
  };

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 4 }}>
      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <Typography variant="h3">
            {mode === 'create' ? t('users.form.createTitle') : t('users.form.editTitle')}
          </Typography>

          <TextField
            label={t('users.form.emailLabel')}
            type="email"
            value={values.email}
            onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
            required
            fullWidth
            variant="outlined"
            disabled={isLoading || mode === 'edit' || !canWrite}
          />

          {mode === 'create' ? (
            <TextField
              label={t('users.form.passwordLabel')}
              type="password"
              value={values.password}
              onChange={(event) => setValues((prev) => ({ ...prev, password: event.target.value }))}
              required
              fullWidth
              variant="outlined"
              disabled={isLoading || !canWrite}
              error={!!fieldError}
              helperText={fieldError || undefined}
            />
          ) : null}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <TextField
              label={t('users.form.firstNameLabel')}
              value={values.firstName}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  firstName: event.target.value,
                }))
              }
              fullWidth
              variant="outlined"
              disabled={isLoading || !canWrite}
            />
            <TextField
              label={t('users.form.lastNameLabel')}
              value={values.lastName}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  lastName: event.target.value,
                }))
              }
              fullWidth
              variant="outlined"
              disabled={isLoading || !canWrite}
            />
          </Box>

          <FormControl fullWidth variant="outlined" disabled={isLoading || !canWrite}>
            <InputLabel id="user-role-label">{t('users.form.roleLabel')}</InputLabel>
            <Select
              labelId="user-role-label"
              value={values.roleId}
              label={t('users.form.roleLabel')}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  roleId: event.target.value,
                }))
              }
            >
              <MenuItem value="">
                <em>{t('users.form.rolePlaceholder')}</em>
              </MenuItem>
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Autocomplete
            multiple
            options={domains}
            getOptionLabel={(option) => option.name}
            value={selectedDomains}
            onChange={(_event, newValue) =>
              setValues((prev) => ({
                ...prev,
                domainIds: newValue.map((domain) => domain.id),
              }))
            }
            disabled={isLoading || !canWrite}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('users.form.domainsLabel')}
                helperText={t('users.form.domainsHelper')}
                variant="outlined"
              />
            )}
          />

          {mode === 'edit' ? (
            <FormControlLabel
              control={
                <Switch
                  checked={values.isActive}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      isActive: event.target.checked,
                    }))
                  }
                  disabled={isLoading || !canWrite}
                />
              }
              label={t('users.form.isActiveLabel')}
            />
          ) : null}

          {error ? (
            <Typography variant="body2" color="error.main">
              {error}
            </Typography>
          ) : null}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={onCancel} disabled={isLoading}>
              {t('users.form.cancelButton')}
            </Button>
            {canWrite ? (
              <Button type="submit" variant="contained" disabled={isLoading}>
                {t('users.form.saveButton')}
              </Button>
            ) : null}
          </Box>
        </Stack>
      </form>
    </Paper>
  );
}
