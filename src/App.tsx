import { act, createContext, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { SideMenu } from './components/side-menu/side-menu.component';
import { AndroidFullScreen } from '@awesome-cordova-plugins/android-full-screen';
import { DataFecherService } from './services/data-fetcher.service';
import { DataView } from './views/data/data.view';
import { Nozzle } from './types/nozzle.type';
import { generateFlowAboveExpectedNozzleEvent, generateFlowBelowExpectedNozzleEvent, NozzleEvent } from './types/nozzle-event.type';
import { AlertModal } from './components/alert-modal/alert-modal.component';
import { Menu } from './views/menu/menu.view';
import { Jobs } from './views/jobs/jobs.view';
import { CreateJob } from './views/create-job/create-job.view';
import { Job } from './types/job.type';
import { NozzlesView } from './views/nozzles/nozzles.view';
import { Settings } from './views/settings/settings.view';
import { SettingsService } from './services/settings.service';
import translations from './translations.json';
console.log(translations);

AndroidFullScreen.isImmersiveModeSupported()
  .then(() => AndroidFullScreen.immersiveMode())
  .catch(console.warn);


export type Page = 'jobs' | 'menu' | 'createJob' | 'dataView' | 'nozzles' | 'settings';

export const NavFunctionsContext = createContext<any>(undefined);
export const JobContext = createContext<any>(undefined);

export const SpeedContext = createContext<number>(3);


export type SpeedSimulatorElement = {
  getSpeed: () => number;
}

export type SpeedSimulatorProps = {
  onSpeedChange: (speed: number) => void;
}

export const SpeedSimulator = forwardRef<SpeedSimulatorElement, SpeedSimulatorProps>((props, ref) => {
  const [speed, setSpeed] = useState<number>(3);
  useImperativeHandle(ref, () => ({
    getSpeed: () => {
      return speed;
    }
  }), []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      top: 0,
      right: '5rem',
      left: '5rem',
      height: '2rem',
      zIndex: 100,
      opacity: 0.5,
    }}>
      <input type='range' min={0} max={15} defaultValue={speed} step={0.1} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        setSpeed(parseFloat(e.target.value));
        props.onSpeedChange(parseFloat(e.target.value));
      }}
        style={{
          flexGrow: 1
        }}
      />
      <span>{speed.toFixed(1)}m/s</span>
    </div>
  );
});

function App() {
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState<Page>('menu');
  const [currentJob, setCurrentJob] = useState<Job | undefined>(undefined);

  const [speed, setSpeed] = useState<number>(3);
  const [active, setActive] = useState<'on' | 'off'>('off');
  const [activeButtonState, setActiveButtonState] = useState<'on' | 'off' | 'auto'>('auto');
  const [nozzleSpacing, setNozzleSpacing] = useState<number>(0.1);

  const speedSimulatorRef = useRef<SpeedSimulatorElement>(null);

  const refresh = async () => {
    DataFecherService.fetchData().then(() => {
      setIsRefreshing(false);
    })
      .catch(() => {
      });
  }

  const shouldUpdateNozzleEvents = () => {
    if (activeButtonState === 'off') return false;
    if (activeButtonState === 'auto' && active === 'off') return false;
    return true;
  }

  useEffect(() => {
  }, [currentJob?.nozzleEvents]);

  useEffect(() => {
    if (!currentJob) return;
    if (activeButtonState === 'on') {
      currentJob.nozzleEvents.filter((event: NozzleEvent) => {
        return event.endTime !== undefined;
      });

      setCurrentJob(currentJob);
    }
  }, [activeButtonState, currentJob]);

  useEffect(() => {
    if (!currentJob) return;
    if (activeButtonState === 'auto' && active === 'on') {
      currentJob.nozzleEvents = currentJob.nozzleEvents.filter((event: NozzleEvent) => {
        return event.endTime !== undefined;
      });
      setCurrentJob(currentJob);
    }
  }, [active, currentJob]);

  const updateNozzleEvents = async (nozzles: Nozzle[]) => {
    if (nozzles === undefined || currentJob === undefined) return;

    if (!shouldUpdateNozzleEvents()) {
      return;
    }

    let eventsToAdd: NozzleEvent[] = [];
    let eventsToModify: NozzleEvent[] = [];

    for (let nozzleIndex = 0; nozzleIndex < nozzles.length; nozzleIndex++) {
      const nozzle = nozzles[nozzleIndex];

      if (nozzle.ignored) continue;

      const nozzleEvents: NozzleEvent[] = currentJob?.nozzleEvents.filter((event: NozzleEvent) => {
        return event.nozzleIndex === nozzleIndex;
      });

      if (!nozzleEvents) continue;

      const nozzle_ongoing_events = nozzleEvents.filter((event) => {
        return event.endTime === undefined;
      });

      const expectedFlow = calculateTargetValue() || 0;

      const isNozzleFlowAboveExpected = nozzle.flow !== null && nozzle.flow > expectedFlow * (1 + currentJob!.tolerance);
      const isNozzleFlowBelowExpected = nozzle.flow !== null && nozzle.flow < expectedFlow * (1 - currentJob!.tolerance);
      const doesNozzleHaveOngoingEvent = nozzle_ongoing_events.length > 0;

      if (!doesNozzleHaveOngoingEvent) {
        if (isNozzleFlowAboveExpected) {
          const newEvent = generateFlowAboveExpectedNozzleEvent(nozzleIndex, nozzle);
          eventsToAdd.push(newEvent);
        }
        else if (isNozzleFlowBelowExpected) {
          const newEvent = generateFlowBelowExpectedNozzleEvent(nozzleIndex, nozzle);
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

              const newEvent = generateFlowAboveExpectedNozzleEvent(nozzleIndex, nozzle);
              eventsToAdd.push(newEvent);
            }
          }
          else if (isNozzleFlowBelowExpected) {
            if (eventTitle === 'Flow above expected') {
              nozzleOngoingEvent.endTime = new Date();
              eventsToModify.push(nozzleOngoingEvent);

              const newEvent = generateFlowBelowExpectedNozzleEvent(nozzleIndex, nozzle);
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
    const eventHandler = async (data: any) => {
      updateNozzleEvents(data.nozzles);
      // setSpeed(data.speed);
      setNozzleSpacing(await SettingsService.getSettingOrDefault('nozzleSpacing', 0.1));

      if (activeButtonState === 'auto') {
        setActive(data.active == true ? 'on' : 'off');
      }
    };
    DataFecherService.addEventListener('onDataFetched', eventHandler);
    return () => {
      DataFecherService.removeEventListener('onDataFetched', eventHandler);
    }
  }, [currentJob, setSpeed, setNozzleSpacing, speed, nozzleSpacing, active, activeButtonState]);

  useEffect(() => {
    if (!isRefreshing && currentJob) {
      const interval = setInterval(() => {
        setIsRefreshing(true);
        refresh();
      }, 100);
      return () => clearInterval(interval);
    }

  }, [isRefreshing, currentJob]);

  const calculateTargetValue = () => {
    if (!currentJob) return

    // Nozzle expected flow in liters per second;
    const expectedFlow = currentJob.expectedFlow;

    return (speed * nozzleSpacing * expectedFlow) / 1;
  }

  return (
    <SpeedContext.Provider value={speed}>
      <NavFunctionsContext.Provider value={{ currentPage, setCurrentPage }}>
        <JobContext.Provider value={{ currentJob, setCurrentJob }} >
          <SpeedSimulator ref={speedSimulatorRef} onSpeedChange={(speed: number) => { setSpeed(speed) }} />
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
              currentPage === 'settings' &&
              <Settings />
            }
            {
              (currentPage === 'dataView' || (currentPage === 'nozzles' && currentJob) || (currentPage === 'settings' && currentJob)) &&
              <SideMenu
                onActiveChange={(active) => setActiveButtonState(active)}
              />
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
    </SpeedContext.Provider>
  );
}

export default App;