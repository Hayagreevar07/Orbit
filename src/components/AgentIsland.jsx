import { Box, Stack, Typography } from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';

export default function AgentIsland({ status, message, onClick }) {
  return <Box className="agent-island" onClick={onClick} role="status" aria-live="polite"><Box className="agent-island-icon"><AutoAwesomeRoundedIcon /></Box><Stack spacing={0.15}><Typography className="agent-island-status">{status}</Typography><Typography className="agent-island-message">{message}</Typography></Stack><Box className="agent-island-pulse" /></Box>;
}
