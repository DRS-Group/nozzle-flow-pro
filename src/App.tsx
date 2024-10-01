import { createContext, useEffect, useState } from 'react';
import { SideMenu } from './components/side-menu/side-menu.component';
import { AndroidFullScreen } from '@awesome-cordova-plugins/android-full-screen';
import { DataFecherService } from './services/data-fetcher.service';
import { DataView } from './views/data/data.view';
import { Nozzle } from './types/nozzle.type';
import { generateFlowAboveExpectedNozzleEvent, generateFlowBelowExpectedNozzleEvent, NozzleEvent } from './types/nozzle-event.type';
import { AlertModal } from './components/alert-modal/alert-modal.component';
import styles from './App.module.css';
import { Menu } from './views/menu/menu.view';
import { Jobs } from './views/jobs/jobs.view';
import { CreateJob } from './views/create-job/create-job.view';
import { Job } from './types/job.type';
import { NozzlesView } from './views/nozzles/nozzles.view';
import { NozzlesService } from './services/nozzles.service';

AndroidFullScreen.isImmersiveModeSupported()
  .then(() => AndroidFullScreen.immersiveMode())
  .catch(console.warn);


export type Page = 'jobs' | 'menu' | 'createJob' | 'dataView' | 'nozzles';

export const NavFunctionsContext = createContext<any>(undefined);
export const JobContext = createContext<any>(undefined);

function App() {
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState<Page>('menu');
  const [currentJob, setCurrentJob] = useState<Job | undefined>(undefined);

  const refresh = async () => {
    DataFecherService.fetchData().then(() => {
      setIsRefreshing(false);
    });
  }

  const updateNozzleEvents = async (nozzles: Nozzle[]) => {
    if (nozzles === undefined || currentJob === undefined) return;

    let eventsToAdd: NozzleEvent[] = [];
    let eventsToModify: NozzleEvent[] = [];

    for (let i = 0; i < nozzles.length; i++) {
      const nozzle = nozzles[i];

      const nozzleEvents: NozzleEvent[] = currentJob.nozzleEvents.filter((event) => {
        return event.nozzleId === nozzle.id;
      });

      const nozzle_ongoing_events = nozzleEvents.filter((event) => {
        return event.endTime === undefined;
      });

      const isNozzleFlowAboveExpected = nozzle.flow !== undefined && nozzle.flow > currentJob!.expectedFlow * (1 + currentJob!.tolerance);
      const isNozzleFlowBelowExpected = nozzle.flow !== undefined && nozzle.flow < currentJob!.expectedFlow * (1 - currentJob!.tolerance);
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
            if (eventDuration > currentJob!.durationTolerance) {
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

    let newEvents = [...currentJob.nozzleEvents];

    for (let event of eventsToAdd) {
      newEvents.push(event);
    }

    for (let event of eventsToModify) {
      const eventIndex = newEvents.findIndex((e) => e.id === event.id);
      newEvents[eventIndex] = event;
    }

    if (eventsToAdd.length > 0 || eventsToModify.length > 0) {
      currentJob.nozzleEvents = newEvents;
      setCurrentJob(currentJob);
    }
  }

  const getFirstNozzleUnviewedTriggeredEvent = () => {
    return currentJob?.nozzleEvents.find((event: NozzleEvent) => {
      return event.triggered && !event.viewed;
    });
  }

  const getTotalNozzleUnviewedTriggeredEvents = () => {
    return currentJob?.nozzleEvents.filter((event: NozzleEvent) => {
      return event.triggered && !event.viewed;
    }).length;
  }

  const markEventAsViewed = (event: NozzleEvent) => {
    const eventIndex = currentJob!.nozzleEvents.findIndex((e) => e.id === event.id);
    const newEvents = [...currentJob!.nozzleEvents!];
    newEvents[eventIndex].viewed = true;
    currentJob!.nozzleEvents = newEvents;
    setCurrentJob(currentJob);
  }

  const markAllEventsAsViewed = () => {
    const newEvents = [...currentJob!.nozzleEvents];
    newEvents.forEach((event) => {
      event.viewed = true;
    });
    currentJob!.nozzleEvents = newEvents;
    setCurrentJob(currentJob);
  }

  useEffect(() => {
    const eventHandler = (data: any) => {
      updateNozzleEvents(data.nozzles);
    };
    DataFecherService.addEventListener('onDataFetched', eventHandler);
    return () => {
      DataFecherService.removeEventListener('onDataFetched', eventHandler);
    }
  }, [currentJob]);

  useEffect(() => {
    if (!isRefreshing && currentJob) {
      const interval = setInterval(() => {
        setIsRefreshing(true);
        refresh();
      }, 100);
      return () => clearInterval(interval);
    }

  }, [isRefreshing, currentJob]);

  return (
    <NavFunctionsContext.Provider value={{ currentPage, setCurrentPage }}>
      <JobContext.Provider value={{ currentJob, setCurrentJob }} >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          {
            currentPage === 'menu' &&
            <Menu
              onJobsClick={() => setCurrentPage('jobs')}
              onNozzlesClick={() => setCurrentPage('nozzles')}
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
            <DataView />
          }
          {
            currentPage === 'nozzles' &&
            <NozzlesView
              onBackClick={() => setCurrentPage('menu')}
            />
          }
          {
            (currentPage === 'dataView' || (currentPage === 'nozzles' && currentJob)) &&
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
        </div>
      </JobContext.Provider>
    </NavFunctionsContext.Provider>
  );
}

export default App;
