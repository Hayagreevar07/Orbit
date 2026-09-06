import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { aiConfigured, interpretCommand } from '../lib/ai';

export default function AiAssistant({ onAction, onNotify, onAgentUpdate }) {
  const [open, setOpen] = useState(false);
  const [command, setCommand] = useState('');
  const [proposal, setProposal] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const ask = async (event) => {
    event.preventDefault();
    if (!command.trim()) return;
    setLoading(true);
    setError('');
    onAgentUpdate?.({ status: 'Thinking', message: 'Turning your request into a safe action' });
    try {
      const result = await interpretCommand(command);
      setProposal(result);
      onAgentUpdate?.({ status: 'Action ready', message: result.message || 'Review the proposed action' });
    } catch (assistantError) {
      setError(assistantError.message);
      onAgentUpdate?.({ status: 'Needs setup', message: assistantError.message });
    } finally {
      setLoading(false);
    }
  };

  const approve = async () => {
    if (!proposal?.action || proposal.action.type === 'none') return;
    setLoading(true);
    setError('');
    try {
      const result = await onAction(proposal.action);
      setProposal(null);
      setCommand('');
      setOpen(false);
      onNotify(result?.source === 'Mess-21'
        ? `Mess-21 confirmed: ₹${Number(result.amount).toLocaleString('en-IN')} added to ${result.category}`
        : 'Action completed and verified');
      onAgentUpdate?.({ status: 'Action applied', message: 'The connected app confirmed the update' });
    } catch (actionError) {
      setError(actionError.message);
      onNotify('Action failed - nothing was confirmed');
      onAgentUpdate?.({ status: 'Action failed', message: actionError.message });
    } finally {
      setLoading(false);
    }
  };

  return <><Tooltip title="Ask Orbit"><Button variant="outlined" startIcon={<AutoAwesomeRoundedIcon />} onClick={() => setOpen(true)}>Ask Orbit</Button></Tooltip><Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" className="ai-dialog"><DialogTitle><Stack direction="row" alignItems="center" justifyContent="space-between"><Box><Typography className="card-kicker">Mistral assistant</Typography><Typography variant="h2">What should Orbit do?</Typography></Box><IconButton onClick={() => setOpen(false)}><CloseRoundedIcon /></IconButton></Stack></DialogTitle><DialogContent><Typography className="muted ai-intro">Write naturally. Orbit will turn your request into a reviewable action and wait for your approval.</Typography>{!aiConfigured && <Alert severity="info" className="ai-alert">Add `VITE_OPENROUTER_API_KEY` to enable Mistral through OpenRouter.</Alert>}<form onSubmit={ask}><TextField autoFocus fullWidth multiline minRows={3} placeholder="e.g. Add a 45 minute study block for distributed systems at 2pm" value={command} onChange={(event) => setCommand(event.target.value)} disabled={!aiConfigured} /><Button type="submit" variant="contained" endIcon={loading ? <CircularProgress size={16} /> : <SendRoundedIcon />} disabled={!aiConfigured || loading || !command.trim()} className="ai-submit">Interpret request</Button></form>{error && <Alert severity="error" className="ai-alert">{error}</Alert>}{proposal && <Box className="ai-proposal"><Typography className="card-kicker">Proposed action</Typography><Typography className="proposal-message">{proposal.message}</Typography><Typography className="muted">{proposal.action?.type === 'none' ? 'No data will change.' : `${proposal.action?.type?.replace('_', ' ')}${proposal.action?.title ? `: ${proposal.action.title}` : ''}`}</Typography></Box>}</DialogContent><DialogActions>{proposal?.action?.type !== 'none' && proposal ? <><Button onClick={() => setProposal(null)}>Revise</Button><Button variant="contained" onClick={approve}>Approve action</Button></> : <Button onClick={() => setOpen(false)}>Close</Button>}</DialogActions></Dialog></>;
}
