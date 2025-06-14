// src/sections/auth/AuthRegister.jsx
import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';

import {
  Button,
  FormHelperText,
  Grid,
  Link,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Stack,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';

import * as Yup from 'yup';
import { Formik } from 'formik';

import IconButton from 'components/@extended/IconButton';
import AnimateButton from 'components/@extended/AnimateButton';
import { strengthColor, strengthIndicator } from 'utils/password-strength';

import EyeOutlined from '@ant-design/icons/EyeOutlined';
import EyeInvisibleOutlined from '@ant-design/icons/EyeInvisibleOutlined';

import { useUser } from '../../contexts/UserContext';

export default function AuthRegister() {
  const [level, setLevel] = useState();
  const [showPassword, setShowPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const { login } = useUser();
  const navigate = useNavigate();

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (event) => event.preventDefault();

  const changePassword = (value) => {
    const temp = strengthIndicator(value);
    setLevel(strengthColor(temp));
  };

  const [searchParams] = useSearchParams();
  const auth = searchParams.get('auth');

  useEffect(() => {
    changePassword('');
  }, []);

  return (
    <Formik
      initialValues={{
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password2: '',
        document_id: '',
        fecha_nacimiento: '',
        pais: '',
        institucion: '',
        carrera: '',
        telefono: '',
        submit: null
      }}
      validationSchema={Yup.object().shape({
        first_name: Yup.string().required('First Name is required'),
        last_name: Yup.string().required('Last Name is required'),
        email: Yup.string().email('Must be a valid email').required('Email is required'),
        password: Yup.string().required('Password is required').max(10),
        password2: Yup.string()
          .required('Confirm your password')
          .oneOf([Yup.ref('password'), null], 'Passwords must match'),
        document_id: Yup.string().required('Document ID is required'),
        fecha_nacimiento: Yup.date().required('Birth date is required'),
        pais: Yup.string().required('pais is required'),
        institucion: Yup.string().required('Institucion is required'),
        carrera: Yup.string().required('Career is required'),
        telefono: Yup.string().required('telefono is required')
      })}
      onSubmit={async (values, { setErrors, setSubmitting }) => {
        try {
          const res = await fetch(`${import.meta.env.VITE_URL_BACKEND_API}usuarios/api/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values)
          });

          const data = await res.json();

          if (!res.ok) {
            setErrors({ submit: data.message || 'Algo salió mal' });
            setSubmitting(false);
            return;
          }

          if (data.token && data.user) {
            setSuccessMsg('Registro exitoso. Serás redirigido al inicio de sesión...');
            setTimeout(() => {
              login(data.token, data.user);
              navigate('/login');
            }, 1500);
          } else {
            setErrors({ submit: 'Error: datos incompletos desde el servidor' });
          }
        } catch (error) {
          setErrors({ submit: error.message || 'Error en el servidor' });
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ errors, handleBlur, handleChange, touched, values, handleSubmit, isSubmitting }) => (
        <form noValidate onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {[
              ['first_name', 'First Name'],
              ['last_name', 'Last Name']
            ].map(([name, label]) => (
              <Grid item xs={12} md={6} key={name}>
                <InputLabel>{label}</InputLabel>
                <OutlinedInput
                  fullWidth
                  name={name}
                  value={values[name]}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched[name] && errors[name])}
                />
                {touched[name] && errors[name] && <FormHelperText error>{errors[name]}</FormHelperText>}
              </Grid>
            ))}

            {[
              ['document_id', 'Document ID'],
              ['fecha_nacimiento', 'Birth Date', 'date']
            ].map(([name, label, type = 'text']) => (
              <Grid item xs={12} md={6} key={name}>
                <InputLabel>{label}</InputLabel>
                <OutlinedInput
                  fullWidth
                  type={type}
                  name={name}
                  value={values[name]}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched[name] && errors[name])}
                />
                {touched[name] && errors[name] && <FormHelperText error>{errors[name]}</FormHelperText>}
              </Grid>
            ))}

            {[
              ['pais', 'País'],
              ['institucion', 'Institución'],
              ['carrera', 'Carrera'],
              ['telefono', 'Teléfono']
            ].map(([name, label]) => (
              <Grid item xs={12} md={6} key={name}>
                <InputLabel>{label}</InputLabel>
                <OutlinedInput
                  fullWidth
                  name={name}
                  value={values[name]}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched[name] && errors[name])}
                />
                {touched[name] && errors[name] && <FormHelperText error>{errors[name]}</FormHelperText>}
              </Grid>
            ))}

            <Grid item xs={12}>
              <InputLabel>Email Address*</InputLabel>
              <OutlinedInput
                fullWidth
                name="email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={Boolean(touched.email && errors.email)}
              />
              {touched.email && errors.email && <FormHelperText error>{errors.email}</FormHelperText>}
            </Grid>

            {[
              ['password', 'Password'],
              ['password2', 'Confirm Password']
            ].map(([name, label]) => (
              <Grid item xs={12} md={6} key={name}>
                <InputLabel>{label}</InputLabel>
                <OutlinedInput
                  fullWidth
                  name={name}
                  type={showPassword ? 'text' : 'password'}
                  value={values[name]}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton onClick={handleClickShowPassword} onMouseDown={handleMouseDownPassword} edge="end" color="secondary">
                        {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                      </IconButton>
                    </InputAdornment>
                  }
                  error={Boolean(touched[name] && errors[name])}
                />
                {touched[name] && errors[name] && <FormHelperText error>{errors[name]}</FormHelperText>}
              </Grid>
            ))}

            {errors.submit && (
              <Grid item xs={12}>
                <Alert severity="error">{errors.submit}</Alert>
              </Grid>
            )}

            {successMsg && (
              <Grid item xs={12}>
                <Alert severity="success">{successMsg}</Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <AnimateButton>
                <Button fullWidth size="large" variant="contained" color="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <CircularProgress size={24} /> : 'Crear cuenta'}
                </Button>
              </AnimateButton>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body2" align="center">
                Al registrarte, aceptas nuestros{' '}
                <Link component={RouterLink} to="#">
                  Términos de servicio
                </Link>{' '}
                y{' '}
                <Link component={RouterLink} to="#">
                  Política de privacidad
                </Link>
                .
              </Typography>
            </Grid>
          </Grid>
        </form>
      )}
    </Formik>
  );
}
