import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControlLabel,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AppsRoundedIcon from '@mui/icons-material/AppsRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import AgentIsland from './components/AgentIsland';
import AiAssistant from './components/AiAssistant';
import AuthScreen from './components/AuthScreen';
import { auth } from './lib/firebase';
import { addMess21Expense } from './integrations/mess21';
import { loadStored, saveStored } from './lib/storage';
import NotesTasks from './components/NotesTasks';
import { getDateString, notificationsSupported, sendDailySummary, scheduleTaskNotifications } from './lib/notifications';
import { MaintenancePage, ProfilePage, SchedulePage, StudyPage } from './components/WorkspacePages';

const initialTasks = [
  { id: 1, time: '09:00', title: 'Deep work: product system', label: 'Build', color: 'lime', done: true },
  { id: 2, time: '11:30', title: 'Send weekly project pulse', label: 'Admin', color: 'coral', done: false },
  { id: 3, time: '14:00', title: 'Study: distributed systems', label: 'Learn', color: 'blue', done: false },
  { id: 4, time: '16:30', title: 'Reset workspace + plan tomorrow', label: 'Care', color: 'gold', done: false },
];

const initialApprovals = [
  { id: 1, title: 'Move “Review API notes” to tomorrow', source: 'Planner', action: 'Reschedule' },
  { id: 2, title: 'Log 45 min of distributed systems', source: 'Study log', action: 'Record time' },
];

const navItems = [
  { label: 'Today', icon: DashboardRoundedIcon },
  { label: 'Schedule', icon: CalendarMonthRoundedIcon },
  { label: 'Study map', icon: AutoAwesomeRoundedIcon },
  { label: 'Maintenance', icon: TuneRoundedIcon },
];

function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [displayName, setDisplayName] = useState(() => loadStored('displayName', 'Orbit user'));
  const [agentState, setAgentState] = useState({ status: 'Orbit ready', message: 'Watching your day' });
  const [activeNav, setActiveNav] = useState('Today');
  const [tasks, setTasks] = useState(() => loadStored('tasks', initialTasks));
  const [approvals, setApprovals] = useState(() => loadStored('approvals', initialApprovals));
  const [menuOpen, setMenuOpen] = useState(false);
  const [snack, setSnack] = useState('');
  const [studyMinutes, setStudyMinutes] = useState(() => loadStored('studyMinutes', 45));
  const [notes, setNotes] = useState(() => loadStored('notes', []));
  const [events, setEvents] = useState(() => loadStored('events', []));
  const [view, setView] = useState(0);

  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      return undefined;
    }
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setDisplayName(currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Orbit user');
      setAuthReady(true);
    });
  }, []);

  const completedCount = tasks.filter((task) => task.done).length;
  const progress = Math.round((completedCount / tasks.length) * 100);
  const remaining = tasks.length - completedCount;
  const todayLabel = useMemo(() => new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date()), []);

  useEffect(() => saveStored('tasks', tasks), [tasks]);
  useEffect(() => saveStored('approvals', approvals), [approvals]);
  useEffect(() => saveStored('studyMinutes', studyMinutes), [studyMinutes]);
  useEffect(() => saveStored('notes', notes), [notes]);
  useEffect(() => saveStored('events', events), [events]);
  useEffect(() => saveStored('displayName', displayName), [displayName]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const summaryKey = `summary-${getDateString()}-${new Date().getHours() >= 18 ? 'evening' : 'morning'}`;
    if (loadStored(summaryKey, false)) return;
    const summary = sendDailySummary(tasks, events);
    if (summary) saveStored(summaryKey, true);
    if (notificationsSupported() && Notification.permission === 'granted') scheduleTaskNotifications(tasks, events);
  }, [tasks, events]);

  const toggleTask = (id) => {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task));
  };

  const approve = (id) => {
    setApprovals((current) => current.filter((item) => item.id !== id));
    setSnack('Approved and added to your activity log');
  };

  const addTask = () => {
    setTasks((current) => [...current, { id: Date.now(), time: '18:00', title: 'New focus block', label: 'Focus', color: 'purple', done: false }]);
    setSnack('Focus block added');
  };

  const logStudyTime = () => {
    setStudyMinutes((current) => current + 15);
    setSnack('15 minutes added to your study log');
  };

  const applyAiAction = async (action) => {
    if (action.type === 'add_mess21_expense') {
      const confirmed = await addMess21Expense({
        title: action.title || action.category || 'Expense',
        amount: action.amount,
        category: action.category || 'Other',
        date: action.date,
        confirmed: true,
      });
      return confirmed;
    }
    if (action.type === 'add_task') {
      setTasks((current) => [...current, { id: Date.now(), time: action.time || '18:00', title: action.title || 'New focus block', label: 'Focus', color: 'blue', done: false }]);
    }
    if (action.type === 'log_study') {
      setStudyMinutes((current) => current + (Number(action.minutes) || 15));
    }
    if (action.type === 'complete_task') {
      setTasks((current) => current.map((task) => task.title.toLowerCase().includes((action.title || '').toLowerCase()) ? { ...task, done: true } : task));
    }
    if (action.type === 'add_note') {
      setNotes((current) => [{ id: Date.now(), text: action.text || action.title || 'Orbit note', createdAt: new Date().toISOString() }, ...current]);
    }
    if (action.type === 'add_event') {
      setEvents((current) => [...current, { id: Date.now(), title: action.title || 'Orbit event', date: action.date || getDateString(1), time: action.time || '19:00', type: 'event', done: false }]);
    }
    setAgentState({ status: 'Action applied', message: 'Your workspace was updated after approval' });
  };

  if (!authReady) return <Box className="loading-screen"><CircularProgress /></Box>;
  if (!user && !demoMode) return <AuthScreen onDemoMode={() => setDemoMode(true)} />;

  const pageTitle = activeNav === 'Today' ? `Good morning, ${displayName}` : activeNav;
  const pageSubtitle = activeNav === 'Today' ? 'Your day, in one calm place.' : `Keep your ${activeNav.toLowerCase()} moving with less friction.`;

  return (
    <Box className="app-shell">
      <AgentIsland status={agentState.status} message={agentState.message} onClick={() => setSnack(agentState.message)} />
      <Drawer variant="temporary" open={menuOpen} onClose={() => setMenuOpen(false)} className="mobile-drawer">
        <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} closeMenu={() => setMenuOpen(false)} displayName={displayName} />
      </Drawer>
      <aside className="sidebar-desktop"><Sidebar activeNav={activeNav} setActiveNav={setActiveNav} displayName={displayName} /></aside>
      <main className="main-content">
        <header className="topbar">
          <IconButton className="mobile-menu" onClick={() => setMenuOpen(true)}><MenuRoundedIcon /></IconButton>
          <Box className="breadcrumb"><span>Workspace</span><ChevronRightRoundedIcon /><strong>{activeNav}</strong></Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Notifications"><IconButton className="quiet-icon"><NotificationsNoneRoundedIcon /></IconButton></Tooltip>
            <Tooltip title={demoMode ? 'Demo mode' : 'Sign out'}><IconButton onClick={() => demoMode ? setDemoMode(false) : signOut(auth)}><Avatar className="top-avatar">{displayName[0]?.toUpperCase() || 'O'}</Avatar></IconButton></Tooltip>
          </Stack>
        </header>

        <Box className="page-heading">
          <Box>
            <Typography className="eyebrow">{todayLabel} <span className="live-dot" /> Live focus</Typography>
            <Typography variant="h1">{pageTitle}</Typography>
            <Typography className="subheading">{pageSubtitle}</Typography>
          </Box>
          <Stack direction="row" spacing={1} className="heading-actions">
            <AiAssistant onAction={applyAiAction} onNotify={setSnack} onAgentUpdate={setAgentState} context={{ tasks, notes, events, studyMinutes, activeView: activeNav }} />
            <Button variant="outlined" startIcon={<AutoAwesomeRoundedIcon />} onClick={() => setSnack('Daily rhythm refreshed')}>Refresh rhythm</Button>
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={addTask}>Add block</Button>
          </Stack>
        </Box>

        <Tabs value={view} onChange={(_, value) => setView(value)} className="view-tabs">
          <Tab label="Command center" />
          <Tab label="Activity" />
          <Tab label="Connections" />
          <Tab label="Notes & tasks" />
        </Tabs>

        {activeNav === 'Schedule' ? <SchedulePage tasks={tasks} events={events} /> : activeNav === 'Study map' ? <StudyPage studyMinutes={studyMinutes} onLog={logStudyTime} /> : activeNav === 'Maintenance' ? <MaintenancePage onNotify={setSnack} /> : activeNav === 'Settings' ? <ProfilePage user={user} displayName={displayName} onSaved={setDisplayName} onNotify={setSnack} demoMode={demoMode} /> : view === 3 ? <NotesTasks tasks={tasks} setTasks={setTasks} notes={notes} setNotes={setNotes} events={events} setEvents={setEvents} onNotify={setSnack} /> : view === 2 ? <Connections onNotify={setSnack} /> : view === 1 ? <Activity tasks={tasks} /> : <>
          <section className="overview-grid">
            <Paper className="hero-progress panel-accent" elevation={0}>
              <Box className="progress-top"><Box><Typography className="card-kicker">Daily pulse</Typography><Typography className="hero-stat">{progress}%</Typography></Box><Box className="pulse-icon"><TrendingUpRoundedIcon /></Box></Box>
              <Typography className="card-title">You are building a good day.</Typography>
              <Typography className="muted">{completedCount} complete <span className="bullet">•</span> {remaining} to go <span className="bullet">•</span> 7h 20m planned</Typography>
              <LinearProgress variant="determinate" value={progress} className="lime-progress" />
              <Stack direction="row" justifyContent="space-between" className="progress-footer"><Typography>Consistency streak</Typography><strong>6 days</strong></Stack>
            </Paper>
            <Paper className="study-card" elevation={0}>
              <Box className="card-heading"><Box><Typography className="card-kicker">Study radar</Typography><Typography className="card-title">Distributed systems</Typography></Box><AutoAwesomeRoundedIcon className="coral-icon" /></Box>
              <Box className="study-metric"><Typography className="study-number">{studyMinutes}</Typography><Typography className="muted">min logged this week</Typography></Box>
              <LinearProgress variant="determinate" value={Math.min(100, (studyMinutes / 120) * 100)} className="coral-progress" />
              <Stack direction="row" justifyContent="space-between" alignItems="center" className="progress-footer"><Typography>Next: consensus models</Typography><Button size="small" startIcon={<PlayArrowRoundedIcon />} onClick={logStudyTime}>Log 15 min</Button></Stack>
            </Paper>
            <Paper className="energy-card" elevation={0}><Typography className="card-kicker">Energy check-in</Typography><Typography className="card-title">What kind of day is this?</Typography><Stack direction="row" spacing={1} className="energy-options"><Button onClick={() => setSnack('Energy set to deep focus')}>Deep focus</Button><Button onClick={() => setSnack('Energy set to steady')}>Steady</Button><Button onClick={() => setSnack('Energy set to light')}>Light</Button></Stack><Typography className="muted small-note">Your plan adapts around this signal.</Typography></Paper>
          </section>

          <section className="workspace-grid">
            <Paper className="schedule-panel" elevation={0}>
              <Box className="section-heading"><Box><Typography className="section-title">Today’s rhythm</Typography><Typography className="muted">A light plan with room to think.</Typography></Box><IconButton><MoreHorizRoundedIcon /></IconButton></Box>
              <List className="task-list">{tasks.map((task) => <ListItem key={task.id} disablePadding className={task.done ? 'task-row complete' : 'task-row'}>
                <Box className="task-time">{task.time}</Box>
                <ListItemButton onClick={() => toggleTask(task.id)} className="task-content"><Box className={`task-marker ${task.color}`}>{task.done && <CheckRoundedIcon />}</Box><ListItemText primary={task.title} secondary={<Chip label={task.label} size="small" className={`tag tag-${task.color}`} />} /><ChevronRightRoundedIcon className="task-arrow" /></ListItemButton>
              </ListItem>)}</List>
              <Button className="add-inline" startIcon={<AddRoundedIcon />} onClick={addTask}>Add a focus block</Button>
            </Paper>
            <Box className="right-column">
              <Paper className="approval-panel" elevation={0}><Box className="section-heading"><Box><Typography className="section-title">Needs your say</Typography><Typography className="muted">Nothing changes without you.</Typography></Box><Chip label={approvals.length} className="count-chip" /></Box>{approvals.length === 0 ? <Box className="empty-state"><CheckRoundedIcon /><Typography>All clear for now.</Typography></Box> : approvals.map((item) => <Box className="approval-item" key={item.id}><Box className="approval-copy"><Typography className="approval-title">{item.title}</Typography><Typography className="muted">{item.source} <span className="bullet">•</span> {item.action}</Typography></Box><Stack direction="row" spacing={0.5}><Tooltip title="Dismiss"><IconButton size="small" onClick={() => setApprovals((current) => current.filter((approval) => approval.id !== item.id))}><CloseRoundedIcon fontSize="small" /></IconButton></Tooltip><Button size="small" variant="contained" onClick={() => approve(item.id)}>Approve</Button></Stack></Box>)}</Paper>
              <Paper className="maintenance-panel" elevation={0}><Box className="section-heading"><Box><Typography className="section-title">Maintenance</Typography><Typography className="muted">Small actions, lower drag.</Typography></Box><ShieldOutlinedIcon className="lime-icon" /></Box><MaintenanceRow icon={<TimerOutlinedIcon />} label="Inbox zero" value="12 items" /><MaintenanceRow icon={<FlagRoundedIcon />} label="Weekly review" value="Due today" /><MaintenanceRow icon={<TaskAltRoundedIcon />} label="Workspace reset" value="Tomorrow" /></Paper>
            </Box>
          </section>
          <section className="footer-strip"><Box><Typography className="section-title">A quieter operating system for your day.</Typography><Typography className="muted">Local-first now. Connected when you are ready.</Typography></Box><Button variant="text" endIcon={<ArrowUpwardRoundedIcon />} onClick={() => setSnack('Your personal system is taking shape')}>View weekly pulse</Button></section>
        </>}
      </main>
      <Snackbar open={Boolean(snack)} autoHideDuration={2600} onClose={() => setSnack('')} message={snack} action={<IconButton color="inherit" size="small" onClick={() => setSnack('')}><CloseRoundedIcon fontSize="small" /></IconButton>} />
    </Box>
  );
}

function Sidebar({ activeNav, setActiveNav, closeMenu, displayName }) {
  return <Box className="sidebar-inner"><Box className="brand"><Box className="brand-mark"><span /><span /><span /></Box><Typography className="brand-name">orbit<span>.</span></Typography></Box><Box className="workspace-switch"><Avatar className="workspace-avatar">{displayName[0]?.toUpperCase() || 'O'}</Avatar><Box><Typography className="workspace-name">{displayName}'s space</Typography><Typography className="workspace-type">Personal OS</Typography></Box><MoreHorizRoundedIcon /></Box><Typography className="nav-label">YOUR SPACE</Typography><List className="nav-list">{navItems.map(({ label, icon: Icon }) => <ListItem key={label} disablePadding><ListItemButton selected={activeNav === label} onClick={() => { setActiveNav(label); closeMenu?.(); }}><ListItemIcon><Icon /></ListItemIcon><ListItemText primary={label} /></ListItemButton></ListItem>)}</List><Typography className="nav-label connections-label">SYSTEM</Typography><List className="nav-list"><ListItem disablePadding><ListItemButton onClick={() => { setActiveNav('Connections'); closeMenu?.(); }} selected={activeNav === 'Connections'}><ListItemIcon><AppsRoundedIcon /></ListItemIcon><ListItemText primary="Connections" /><Chip label="2" size="small" /></ListItemButton></ListItem><ListItem disablePadding><ListItemButton onClick={() => { setActiveNav('Settings'); closeMenu?.(); }} selected={activeNav === 'Settings'}><ListItemIcon><SettingsRoundedIcon /></ListItemIcon><ListItemText primary="Settings" /></ListItemButton></ListItem></List><Box className="sidebar-bottom"><Box className="spark-line"><AutoAwesomeRoundedIcon /><Typography>Make room for good work.</Typography></Box><Typography className="muted">Orbit Desk v0.1</Typography></Box></Box>;
}

function MaintenanceRow({ icon, label, value }) { return <Box className="maintenance-row"><Box className="maintenance-icon">{icon}</Box><Typography>{label}</Typography><Typography className="muted maintenance-value">{value}</Typography><ChevronRightRoundedIcon className="muted" /></Box>; }

function Activity({ tasks }) { return <Box className="activity-view"><Paper className="activity-summary" elevation={0}><Typography className="card-kicker">Activity log</Typography><Typography variant="h2">Your recent momentum</Typography><Typography className="muted">A simple record of what moved today.</Typography><Box className="activity-chart"><Box className="chart-bars">{[44, 70, 54, 86, 61, 92, 39].map((height, index) => <Box key={index} className={index === 5 ? 'chart-bar active' : 'chart-bar'} style={{ height: `${height}%` }}><span>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span></Box>)}</Box></Box></Paper><Paper className="activity-summary" elevation={0}><Typography className="card-kicker">Completed blocks</Typography>{tasks.filter((task) => task.done).map((task) => <Box className="log-row" key={task.id}><CheckRoundedIcon /><Typography>{task.title}</Typography><Typography className="muted">{task.time}</Typography></Box>)}<Typography className="muted activity-note">Approve planned changes from Command center to keep this log intentional.</Typography></Paper></Box>; }

function Connections({ onNotify }) { const [connected, setConnected] = useState({ calendar: true, notes: false, messenger: false }); return <Box className="connections-view"><Box className="connections-intro"><Typography className="card-kicker">Your ecosystem</Typography><Typography variant="h2">Bring your tools into orbit.</Typography><Typography className="muted">Connect one app at a time. Orbit only reads or acts when you approve the exact operation.</Typography></Box><Box className="connection-grid">{[{ key: 'calendar', icon: <CalendarMonthRoundedIcon />, name: 'Calendar', detail: 'Schedule and availability', tone: 'lime' }, { key: 'notes', icon: <AutoAwesomeRoundedIcon />, name: 'Notes', detail: 'Study material and capture', tone: 'coral' }, { key: 'messenger', icon: <AppsRoundedIcon />, name: 'Messenger', detail: 'Last integration step', tone: 'blue', locked: true }].map((connection) => <Paper className="connection-card" elevation={0} key={connection.key}><Box className={`connection-icon ${connection.tone}`}>{connection.icon}</Box><Typography className="connection-name">{connection.name}</Typography><Typography className="muted">{connection.detail}</Typography><Divider /><FormControlLabel control={<Switch checked={connected[connection.key]} disabled={connection.locked} onChange={(event) => { setConnected({ ...connected, [connection.key]: event.target.checked }); onNotify(`${connection.name} ${event.target.checked ? 'connected' : 'paused'}`); }} />} label={connection.locked ? 'Available after core setup' : connected[connection.key] ? 'Connected' : 'Paused'} /></Paper>)}</Box><Alert icon={<ShieldOutlinedIcon />} severity="info" className="privacy-alert">Approval gate is on. Reads, writes, and messenger operations will always appear here before they run.</Alert></Box>; }

export default App;
