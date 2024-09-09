import React, { useState, useEffect } from 'react'
import Paper from '@mui/material/Paper'
import { styled } from '@mui/material/styles'
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import {
  Scheduler,
  DayView,
  WeekView,
  MonthView,
  Appointments,
  Toolbar,
  ViewSwitcher,
  DateNavigator,
  TodayButton,
  AppointmentTooltip,
  AppointmentForm,
  EditRecurrenceMenu,
  AllDayPanel,
  ConfirmationDialog
} from '@devexpress/dx-react-scheduler-material-ui'
import {
  ViewState,
  EditingState,
  IntegratedEditing
} from '@devexpress/dx-react-scheduler'
import { collection, addDoc, updateDoc, deleteDoc, getDocs, doc, query, where } from 'firebase/firestore'
import { db, auth } from './firebase'
import Auth from './components/Auth'
import { Box, Button, Typography } from '@mui/material'

type Appointment = {
  id: string,
  title: string,
  startDate: Date,
  endDate: Date
}

function App() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentViewName, setCurrentViewName] = useState('Week')
  const [appointments, setAppointments] = useState<Appointment[]>([])

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (user) {
        const appointmentsCollection = collection(db, 'appointments')
        const userAppointmentsQuery = query(appointmentsCollection, where('userId', '==', user.uid))
        const appointmentsSnapshot = await getDocs(userAppointmentsQuery)
        const appointmentsList = appointmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startDate: doc.data().startDate.toDate(),
          endDate: doc.data().endDate.toDate()
        })) as Appointment[]
        setAppointments(appointmentsList)
      } else {
        setAppointments([])
      }
    })

    return () => unsubscribe()
  }, [])


  const commitChanges = async ({ added, changed, deleted }: { added?: { [key: string]: any }, changed?: { [key: string]: Appointment }, deleted?: string | number }) => {
    if (!auth.currentUser) return

    if (added) {
      const appointmentsCollection = collection(db, 'appointments')
      const docRef = await addDoc(appointmentsCollection, {
        title: added.title || 'Untitled',
        startDate: added.startDate || new Date(),
        endDate: added.endDate || new Date(),
        userId: auth.currentUser.uid,
        ...added
      })
      setAppointments([...appointments, {
        id: docRef.id,
        title: added.title || 'Untitled',
        startDate: added.startDate || new Date(),
        endDate: added.endDate || new Date(),
        userId: auth.currentUser.uid
      } as Appointment])
    }
    if (changed) {
      const appointmentId = Object.keys(changed)[0]
      const appointmentRef = doc(db, 'appointments', appointmentId)
      await updateDoc(appointmentRef, changed[appointmentId])
      setAppointments(appointments.map(
        appointment => appointment.id === appointmentId
          ? { ...appointment, ...changed[appointmentId] }
          : appointment
      ))
    }
    if (deleted !== undefined) {
      const appointmentRef = doc(db, 'appointments', deleted.toString())
      await deleteDoc(appointmentRef)
      setAppointments(appointments.filter(appointment => appointment.id !== deleted))
    }
  }

  const PREFIX = 'Demo';

  const classes = {
    container: `${PREFIX}-container`,
    text: `${PREFIX}-text`,
  };

  const StyledDiv = styled('div')(({ theme }) => ({
    [`&.${classes.container}`]: {
      display: 'flex',
      marginBottom: theme.spacing(2),
      justifyContent: 'flex-end',
    },
    [`& .${classes.text}`]: {
      ...theme.typography.h6,
      marginRight: theme.spacing(2),
    },
  }));

  const allDayLocalizationMessages = {
    'pl-PL': {
      allDay: 'Cały dzień',
      today: 'Dzisiaj',
      week: 'Tydzień',
      month: 'Miesiąc',
      day: 'Dzień',
    },
  };

  const getAllDayMessages = (locale: string) => allDayLocalizationMessages[locale as keyof typeof allDayLocalizationMessages];


  const [locale] = useState('pl-PL')



  return (
    <Auth>
      <Paper>
        <Typography variant='h6' style={{ textAlign: 'center', margin: '10px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>Zalogowany jako: {auth.currentUser?.uid}</Typography>
        <Box display='flex' justifyContent='center' mb={2}>
          <Button variant='contained' color='primary' onClick={() => auth.signOut()}>Wyloguj</Button>
        </Box>
        <Scheduler
          data={appointments}
          height={660}
          locale={locale}
        >
          <ViewState
            currentDate={currentDate}
            onCurrentDateChange={setCurrentDate}
            currentViewName={currentViewName}
            onCurrentViewNameChange={setCurrentViewName}
          />
          <EditingState onCommitChanges={commitChanges} />
          <IntegratedEditing />

          <DayView startDayHour={9} endDayHour={18} displayName='Dzień' />
          <WeekView startDayHour={9} endDayHour={18} displayName='Tydzień' />
          <MonthView displayName='Miesiąc' />



          <Toolbar />
          <DateNavigator />
          <TodayButton messages={getAllDayMessages(locale)}/>
          <ViewSwitcher />
          <Appointments />
          <EditRecurrenceMenu />
          <AppointmentTooltip showOpenButton showDeleteButton />
          <AppointmentForm />
          <AllDayPanel messages={getAllDayMessages(locale)} />
          <ConfirmationDialog />
        </Scheduler>
      </Paper>
    </Auth>
  )
}

export default App