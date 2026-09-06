import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, Divider, Stack, TextField, Typography } from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import GoogleIcon from '@mui/icons-material/Google';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, firebaseConfigured, googleProvider } from '../lib/firebase';

export default function AuthScreen() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!auth) throw new Error('Firebase is not configured. Add the VITE_FIREBASE_* values from .env.example.');
      if (mode === 'signin') await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (submissionError) {
      setError(submissionError.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const googleSignIn = async () => {
    setError('');
    try {
      if (!auth) throw new Error('Firebase is not configured yet.');
      await signInWithPopup(auth, googleProvider);
    } catch (signInError) {
      setError(signInError.message.replace('Firebase: ', ''));
    }
  };

  return <Box className="auth-shell"><Box className="auth-visual"><Box className="brand"><Box className="brand-mark"><span /><span /><span /></Box><Typography className="brand-name">orbit<span>.</span></Typography></Box><Box className="auth-copy"><Typography className="eyebrow">Your personal operating system</Typography><Typography variant="h1">Make room for good work.</Typography><Typography>Plan the day, learn with intention, and keep every external action under your control.</Typography></Box><Box className="auth-orbit"><AutoAwesomeRoundedIcon /></Box></Box><Box className="auth-panel"><Box className="auth-form"><Typography className="card-kicker">{mode === 'signin' ? 'Welcome back' : 'Start your space'}</Typography><Typography variant="h2">{mode === 'signin' ? 'Sign in to Orbit' : 'Create your Orbit'}</Typography><Typography className="muted auth-description">Your workspace is private by default.</Typography>{!firebaseConfigured && <Alert severity="warning" className="auth-alert">Firebase is not configured. Copy `.env.example` to `.env` and add your project values.</Alert>}{error && <Alert severity="error" className="auth-alert">{error}</Alert>}<form onSubmit={submit}><Stack spacing={1.5}><TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required fullWidth /><TextField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required fullWidth slotProps={{ htmlInput: { minLength: 6 } }} /><Button type="submit" variant="contained" disabled={loading || !firebaseConfigured}>{loading ? <CircularProgress size={19} /> : mode === 'signin' ? 'Sign in' : 'Create account'}</Button></Stack></form><Divider className="auth-divider">or</Divider><Button variant="outlined" startIcon={<GoogleIcon />} onClick={googleSignIn} disabled={!firebaseConfigured}>Continue with Google</Button><Button className="auth-switch" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}>{mode === 'signin' ? 'Create a new account' : 'I already have an account'}</Button></Box></Box></Box>;
}
