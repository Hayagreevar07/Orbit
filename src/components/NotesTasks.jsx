import { useState } from 'react';
import { Alert, Box, Button, Chip, IconButton, List, ListItem, ListItemButton, ListItemText, Paper, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AlarmAddRoundedIcon from '@mui/icons-material/AlarmAddRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import { getDateString, isAndroid, requestNotificationPermission, scheduleTaskNotifications } from '../lib/notifications';

export default function NotesTasks({ tasks, setTasks, notes, setNotes, events, setEvents, onNotify }) {
  const [tab, setTab] = useState(0);
  const [noteText, setNoteText] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('19:00');

  const enableNotifications = async () => {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      onNotify(permission === 'unsupported' ? 'Browser notifications are unavailable here' : 'Notification permission was not granted');
      return;
    }
    const count = await scheduleTaskNotifications(tasks, events);
    onNotify(`${count} task and event alarm${count === 1 ? '' : 's'} scheduled`);
  };

  const addTask = () => {
    if (!taskTitle.trim()) return;
    setTasks((current) => [...current, { id: Date.now(), time: eventTime, date: getDateString(), title: taskTitle.trim(), label: 'Todo', color: 'blue', done: false }]);
    setTaskTitle('');
    onNotify('Todo added for today');
  };

  const addNote = () => {
    if (!noteText.trim()) return;
    setNotes((current) => [{ id: Date.now(), text: noteText.trim(), createdAt: new Date().toISOString() }, ...current]);
    setNoteText('');
    onNotify('Note saved');
  };

  const addEvent = () => {
    if (!eventTitle.trim()) return;
    setEvents((current) => [...current, { id: Date.now(), title: eventTitle.trim(), date: getDateString(1), time: eventTime, type: 'event', done: false }]);
    setEventTitle('');
    onNotify('Tomorrow event added');
  };

  return <Box className="notes-tasks-view"><Box className="notes-tasks-header"><Box><Typography className="card-kicker">Daily capture</Typography><Typography variant="h2">Notes, todos, and alarms</Typography><Typography className="muted">Keep the small things visible. Orbit will remind you at the right time.</Typography></Box><Button variant="contained" startIcon={<NotificationsActiveRoundedIcon />} onClick={enableNotifications}>Enable alarms</Button></Box><Alert severity="info" className="schedule-alert">Browser alarms run while Orbit is open. For background mobile alarms, the next step is the Capacitor Local Notifications bridge.</Alert><Tabs value={tab} onChange={(_, value) => setTab(value)} className="notes-tabs"><Tab label="Todos" /><Tab label="Notes" /><Tab label="Tomorrow" /></Tabs>{tab === 0 && <Paper className="capture-panel" elevation={0}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}><TextField fullWidth size="small" label="What needs doing?" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && addTask()} /><TextField size="small" label="Time" type="time" value={eventTime} onChange={(event) => setEventTime(event.target.value)} InputLabelProps={{ shrink: true }} /><Button variant="contained" startIcon={<AddRoundedIcon />} onClick={addTask}>Add todo</Button></Stack><List className="capture-list">{tasks.filter((task) => task.date === getDateString() || !task.date).map((task) => <ListItem key={task.id} disablePadding secondaryAction={<IconButton edge="end" onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))}><DeleteOutlineRoundedIcon /></IconButton>}><ListItemButton onClick={() => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))}><Box className={`task-marker ${task.color || 'blue'}`}>{task.done && <CheckRoundedIcon />}</Box><ListItemText primary={task.title} secondary={`${task.time || 'Any time'} · ${task.done ? 'Complete' : 'Pending alarm'}`} /></ListItemButton></ListItem>)}</List></Paper>}{tab === 1 && <Paper className="capture-panel" elevation={0}><Stack direction="row" spacing={1}><TextField fullWidth multiline minRows={2} label="Write a note" value={noteText} onChange={(event) => setNoteText(event.target.value)} /><Button variant="contained" startIcon={<EditNoteRoundedIcon />} onClick={addNote}>Save</Button></Stack><List className="capture-list">{notes.map((note) => <ListItem key={note.id} secondaryAction={<IconButton onClick={() => setNotes((current) => current.filter((item) => item.id !== note.id))}><DeleteOutlineRoundedIcon /></IconButton>}><ListItemText primary={note.text} secondary={new Date(note.createdAt).toLocaleString()} /></ListItem>)}</List></Paper>}{tab === 2 && <Paper className="capture-panel" elevation={0}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}><TextField fullWidth size="small" label="Tomorrow's event" value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} /><TextField size="small" label="Time" type="time" value={eventTime} onChange={(event) => setEventTime(event.target.value)} InputLabelProps={{ shrink: true }} /><Button variant="contained" startIcon={<AlarmAddRoundedIcon />} onClick={addEvent}>Schedule</Button></Stack><List className="capture-list">{events.filter((event) => event.date === getDateString(1)).map((event) => <ListItem key={event.id}><ListItemText primary={event.title} secondary={`${event.date} · ${event.time}`} /><Chip label="Tomorrow" size="small" /></ListItem>)}</List></Paper>}</Box>;
}
