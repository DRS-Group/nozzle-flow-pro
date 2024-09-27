import { createContext, useEffect, useState } from 'react';
import { SideMenu } from './components/side-menu/side-menu.component';
import { AndroidFullScreen } from '@awesome-cordova-plugins/android-full-screen';
import { DataFecherService } from './services/data-fetcher.service';
import { DataView } from './views/data/data.view';
import { Nozzle } from './models/nozzle.model';
import { generateFlowAboveExpectedNozzleEvent, generateFlowBelowExpectedNozzleEvent, NozzleEvent } from './types/nozzle-event.type';
import { AlertModal } from './components/alert-modal/alert-modal.component';
import styles from './App.module.css';
import { Menu } from './views/menu/menu.view';
import { Jobs } from './views/jobs/jobs.view';
import { CreateJob } from './views/create-job/create-job.view';
import { Job } from './types/job.type';

AndroidFullScreen.isImmersiveModeSupported()
  .then(() => AndroidFullScreen.immersiveMode())
  .catch(console.warn);


export type Page = 'jobs' | 'menu' | 'createJob' | 'dataView';

export type NavFunctions = {
  setPage: (page: Page) => void;
}

export const NozzlesContext = createContext<Nozzle[] | undefined>(undefined);
export const NavFunctionsContext = createContext<NavFunctions | undefined>(undefined);
export const JobContext = createContext<any>(undefined);

function App() {
  const [nozzles, setNozzles] = useState<Nozzle[] | undefined>(undefined);
  const [shouldRefresh, setShouldRefresh] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const [expectedFlow, setExpectedFlow] = useState<number>(2.5);
  const [tolerance, setTolerance] = useState<number>(0.05);
  const [durationTolerance, setDurationTolerance] = useState<number>(7000);

  const [events, setEvents] = useState<NozzleEvent[]>([]);

  const [currentPage, setCurrentPage] = useState<Page>('menu');
  const [currentJob, setCurrentJob] = useState<Job | undefined>(undefined);

  const [NavFunctionsValue, setNavFunctionsValue] = useState<NavFunctions | undefined>({
    setPage: (page: Page) => {
      setCurrentPage(page);
    }
  });

  const syncNozzles = () => {
    DataFecherService.getNozzles()
      .then((nozzles: Nozzle[]) => {
        setNozzles(nozzles);
        setShouldRefresh(true);
      })
      .catch((error) => {
        setNozzles(undefined);
      });
  }

  const refresh = async () => {
    if (nozzles !== undefined) {
      DataFecherService.getData()
        .then((newNozzles: Nozzle[]) => {
          const oldNozzles = [...nozzles];

          for (let oldNozzleIndez = 0; oldNozzleIndez < oldNozzles.length; oldNozzleIndez++) {
            const oldNozzle = oldNozzles[oldNozzleIndez];
            const newNozzle = newNozzles.find((nozzle: Nozzle) => nozzle.id === oldNozzle.id);

            if (newNozzle) {
              oldNozzles[oldNozzleIndez].flow = newNozzle.flow;
            }
          }

          setNozzles(oldNozzles);
        })
        .catch((error) => {
          setNozzles(undefined);
        })
        .finally(() => {
          setIsRefreshing(false);
        });
    }
  }

  const updateNozzleEvents = () => {
    if (nozzles === undefined) return;

    let eventsToAdd: NozzleEvent[] = [];
    let eventsToModify: NozzleEvent[] = [];

    for (let i = 0; i < nozzles.length; i++) {
      const nozzle = nozzles[i];

      const nozzleEvents: NozzleEvent[] = events.filter((event) => {
        return event.nozzleId === nozzle.id;
      });

      const nozzle_ongoing_events = nozzleEvents.filter((event) => {
        return event.endTime === undefined;
      });

      const isNozzleFlowAboveExpected = nozzle.flow !== undefined && nozzle.flow > expectedFlow * (1 + tolerance);
      const isNozzleFlowBelowExpected = nozzle.flow !== undefined && nozzle.flow < expectedFlow * (1 - tolerance);
      const doesNozzleHaveOngoingEvent = nozzle_ongoing_events.length > 0;

      if (!doesNozzleHaveOngoingEvent) {
        if (isNozzleFlowAboveExpected) {
          const newEvent = generateFlowAboveExpectedNozzleEvent(nozzle.id);
          eventsToAdd.push(newEvent);
        }
        else if (isNozzleFlowBelowExpected) {
          const newEvent = generateFlowBelowExpectedNozzleEvent(nozzle.id);
          eventsToAdd.push(newEvent);
        }
        else {
          continue;
        }
      }
      else {
        for (let nozzleOngoingEvent of nozzle_ongoing_events) {
          const wasEventTriggered = nozzleOngoingEvent.triggered;
          const eventDuration = nozzleOngoingEvent.duration;
          const eventTitle = nozzleOngoingEvent.title;

          if (!wasEventTriggered) {
            if (eventDuration > durationTolerance) {
              nozzleOngoingEvent.triggered = true;
              eventsToModify.push(nozzleOngoingEvent);

              // TRIGGER EVENT
            }
          }

          if (isNozzleFlowAboveExpected) {
            if (eventTitle === 'Flow below expected') {
              nozzleOngoingEvent.endTime = new Date();
              eventsToModify.push(nozzleOngoingEvent);

              const newEvent = generateFlowAboveExpectedNozzleEvent(nozzle.id);
              eventsToAdd.push(newEvent);
            }
          }
          else if (isNozzleFlowBelowExpected) {
            if (eventTitle === 'Flow above expected') {
              nozzleOngoingEvent.endTime = new Date();
              eventsToModify.push(nozzleOngoingEvent);

              const newEvent = generateFlowBelowExpectedNozzleEvent(nozzle.id);
              eventsToAdd.push(newEvent);
            }
          }
          else {
            nozzleOngoingEvent.endTime = new Date();
            eventsToModify.push(nozzleOngoingEvent);

            eventsToModify.push(nozzleOngoingEvent);
          }
        }
      }
    }

    let newEvents = [...events];

    for (let event of eventsToAdd) {
      newEvents.push(event);
    }

    for (let event of eventsToModify) {
      const eventIndex = newEvents.findIndex((e) => e.id === event.id);
      newEvents[eventIndex] = event;
    }

    if (eventsToAdd.length > 0 || eventsToModify.length > 0)
      setEvents(newEvents);
  }

  const getFirstNozzleUnviewedTriggeredEvent = () => {
    return events.find((event: NozzleEvent) => {
      return event.triggered && !event.viewed;
    });
  }

  const getTotalNozzleUnviewedTriggeredEvents = () => {
    return events.filter((event: NozzleEvent) => {
      return event.triggered && !event.viewed;
    }).length;
  }

  const markEventAsViewed = (event: NozzleEvent) => {
    const eventIndex = events.findIndex((e) => e.id === event.id);
    const newEvents = [...events];
    newEvents[eventIndex].viewed = true;
    setEvents(newEvents);
  }

  const markAllEventsAsViewed = () => {
    const newEvents = [...events];
    newEvents.forEach((event) => {
      event.viewed = true;
    });
    setEvents(newEvents);
  }

  useEffect(() => {
    if (shouldRefresh && !isRefreshing) {
      const interval = setInterval(() => {
        setIsRefreshing(true);
        refresh();
      }, 100);
      return () => clearInterval(interval);
    }

  }, [shouldRefresh, isRefreshing]);

  useEffect(() => {
    updateNozzleEvents();
  }, [nozzles]);

  return (
    <NavFunctionsContext.Provider value={NavFunctionsValue}>
      <JobContext.Provider value={{ currentJob, setCurrentJob }} >
        <NozzlesContext.Provider value={nozzles}>
          {
            currentPage === 'menu' &&
            <Menu
              onJobsClick={() => setCurrentPage('jobs')}
            />
          }
          {
            currentPage === 'jobs' &&
            <Jobs
              onBackClick={() => setCurrentPage('menu')}
            />
          }
          {
            currentPage === 'createJob' &&
            <CreateJob />
          }
          {
            currentPage === 'dataView' &&
            <DataView
              onSyncClick={syncNozzles}
            />
          }
          {
            currentPage === 'dataView' &&
            <SideMenu />
          }
          {getFirstNozzleUnviewedTriggeredEvent() &&
            <AlertModal
              event={getFirstNozzleUnviewedTriggeredEvent()!}
              onOkClick={() => { markEventAsViewed(getFirstNozzleUnviewedTriggeredEvent()!) }}
              onOkForAllClick={markAllEventsAsViewed}
              totalEvents={getTotalNozzleUnviewedTriggeredEvents()}
            />
          }
        </NozzlesContext.Provider>
      </JobContext.Provider>
    </NavFunctionsContext.Provider >
    // <NozzlesContext.Provider value={nozzles}>
    //   <div style={{ flexGrow: 1, overflow: 'hidden' }}>
    //     <DataView onSyncClick={syncNozzles} />

    //   </div>
    //   {getFirstNozzleUnviewedTriggeredEvent() &&
    //     <AlertModal
    //       event={getFirstNozzleUnviewedTriggeredEvent()!}
    //       onOkClick={() => { markEventAsViewed(getFirstNozzleUnviewedTriggeredEvent()!) }}
    //       onOkForAllClick={markAllEventsAsViewed}
    //       totalEvents={getTotalNozzleUnviewedTriggeredEvents()}
    //     />
    //   }
    //   <SideMenu />
    // </NozzlesContext.Provider>
  );
}

export default App;
