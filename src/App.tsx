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
import { TranslationServices } from './services/translations.service';
import { Logs } from './views/logs/logs.view';
import { JobsService } from './services/jobs.service';
import { Settings as SettingsType } from './types/settings.type';

AndroidFullScreen.isImmersiveModeSupported()
  .then(() => AndroidFullScreen.immersiveMode())
  .catch(console.warn);


export type Page = 'jobs' | 'menu' | 'createJob' | 'dataView' | 'nozzles' | 'settings' | 'logs';

export const NavFunctionsContext = createContext<any>(undefined);
export const JobContext = createContext<any>(undefined);
export const AdminContext = createContext<any>(true);

export const SpeedContext = createContext<number>(3);

export type SpeedSimulatorElement = {
  getSpeed: () => number;
}

export type SpeedSimulatorProps = {
  onSpeedChange: (speed: number) => void;
}

export const SpeedSimulator = forwardRef<SpeedSimulatorElement, SpeedSimulatorProps>((props, ref) => {
  const [opacity, setOpacity] = useState<number>(0);
  const [timeoutHandle, setTimeoutHandle] = useState<NodeJS.Timeout | null>(null);
  const [timer, setTimer] = useState<NodeJS.Timeout | undefined>(undefined)

  const [speed, setSpeed] = useState<number>(3);
  useImperativeHandle(ref, () => ({
    getSpeed: () => {
      return speed;
    }
  }), []);

  const onTouchStart = () => {
    setOpacity(1);
    clearTimeout(timer)
    setTimer(undefined);
  };

  const onTouchEnd = () => {
    const timer = setTimeout(() => {
      setOpacity(0);
      clearTimeout(timer);
    }, 2000);

    setTimer(timer);
    setTimeoutHandle(timer);
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      top: 0,
      right: '5rem',
      left: '5rem',
      height: '4rem',
      zIndex: 100,
      opacity: opacity,
      transition: 'opacity 0.5s'
    }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
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

export function useTranslate() {
  const [currentLanguage, setCurrentLanguage] = useState<'en-us' | 'pt-br'>('en-us');

  useEffect(() => {
    SettingsService.getSettingOrDefault('language', 'en-us').then((language) => {
      setCurrentLanguage(language);
    });

    const eventHandler = async (settings: SettingsType) => {
      setCurrentLanguage(settings.language);
    };
    SettingsService.addEventListener('onSettingsChanged', eventHandler);
    return () => {
      DataFecherService.removeEventListener('onSettingsChanged', eventHandler);
    }

  }, [setCurrentLanguage, currentLanguage]);

  return (term: string) => TranslationServices.translate(term, currentLanguage);
}

function App() {
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const [isAdmin, setIsAdmin] = useState<boolean>(true);

  const [currentPage, setCurrentPage] = useState<Page>('menu');
  const [currentJob, setCurrentJob] = useState<Job | undefined>(undefined);
  const [oppenedFromMenu, setOppenedFromMenu] = useState<boolean>(false);

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
        setIsRefreshing(false);
      });
  }

  const shouldUpdateNozzleEvents = () => {
    if (activeButtonState === 'off') return false;
    if (activeButtonState === 'auto' && active === 'off') return false;
    return true;
  }

  useEffect(() => {
    SettingsService.getSettingOrDefault('interfaceScale', 1).then((interfaceScale) => {
      const root = document.documentElement;
      const fontSize = 16 * interfaceScale;
      root.style.setProperty('font-size', `${fontSize}px`);
    });

    const eventHandler = async (settings: SettingsType) => {
      const root = document.documentElement;
      const fontSize = 16 * settings.interfaceScale;
      root.style.setProperty('font-size', `${fontSize}px`);
    }

    SettingsService.addEventListener('onSettingsChanged', eventHandler);

    return () => {
      SettingsService.removeEventListener('onSettingsChanged', eventHandler);
    }
  }, []);

  useEffect(() => {
    SettingsService.getSettingOrDefault('primaryColor', '#466905').then((color) => {
      const root = document.documentElement;
      root.style.setProperty('--primary-color', color);
    });

    const eventHandler = async (settings: SettingsType) => {
      const root = document.documentElement;
      root.style.setProperty('--primary-color', settings.primaryColor);
    }

    SettingsService.addEventListener('onSettingsChanged', eventHandler);

    return () => {
      SettingsService.removeEventListener('onSettingsChanged', eventHandler);
    }
  }, []);

  useEffect(() => {
    SettingsService.getSettingOrDefault('secondaryColor', '#ffffff').then((color) => {
      const root = document.documentElement;
      root.style.setProperty('--secondary-color', color);
    });

    const eventHandler = async (settings: SettingsType) => {
      const root = document.documentElement;
      root.style.setProperty('--secondary-color', settings.secondaryColor);
    }

    SettingsService.addEventListener('onSettingsChanged', eventHandler);

    return () => {
      SettingsService.removeEventListener('onSettingsChanged', eventHandler);
    }
  }, []);

  useEffect(() => {
    SettingsService.getSettingOrDefault('primaryFontColor', '#000000').then((color) => {
      const root = document.documentElement;
      root.style.setProperty('--primary-font-color', color);
    });

    const eventHandler = async (settings: SettingsType) => {
      const root = document.documentElement;
      root.style.setProperty('--primary-font-color', settings.primaryFontColor);
    }

    SettingsService.addEventListener('onSettingsChanged', eventHandler);

    return () => {
      SettingsService.removeEventListener('onSettingsChanged', eventHandler);
    }
  }, []);

  useEffect(() => {
    SettingsService.getSettingOrDefault('secondaryFontColor', '#ffffff').then((color) => {
      const root = document.documentElement;
      root.style.setProperty('--secondary-font-color', color);
    });

    const eventHandler = async (settings: SettingsType) => {
      const root = document.documentElement;
      root.style.setProperty('--secondary-font-color', settings.secondaryFontColor);
    }

    SettingsService.addEventListener('onSettingsChanged', eventHandler);

    return () => {
      SettingsService.removeEventListener('onSettingsChanged', eventHandler);
    }
  }, []);


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

    let newEvents = [...currentJob?.nozzleEvents];

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
      JobsService.updateJob(currentJob);
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
    if (currentJob)
      refresh();
  }, [currentJob,]);

  useEffect(() => {
    if (!isRefreshing && currentJob && oppenedFromMenu === false) {
      const interval = setInterval(() => {
        setIsRefreshing(true);
        refresh();
      }, 100);
      return () => clearInterval(interval);
    }

  }, [isRefreshing, currentJob, oppenedFromMenu, setCurrentJob]);

  const calculateTargetValue = () => {
    if (!currentJob) return

    // Nozzle expected flow in liters per second;
    const expectedFlow = currentJob.expectedFlow;

    return (speed * nozzleSpacing * expectedFlow) / 1;
  }

  return (
    <SpeedContext.Provider value={speed}>
      <NavFunctionsContext.Provider value={{ currentPage, setCurrentPage, oppenedFromMenu, setOppenedFromMenu }}>
        <JobContext.Provider value={{ currentJob, setCurrentJob }} >
          <SpeedSimulator ref={speedSimulatorRef} onSpeedChange={(speed: number) => { setSpeed(speed) }} />
          <AdminContext.Provider value={{ isAdmin, setIsAdmin }}>
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
                currentPage === 'logs' &&
                <Logs
                  onBackClick={() => setCurrentPage('jobs')}
                />
              }
              {
                (currentPage === 'dataView' || (currentPage === 'nozzles' && currentJob) || (currentPage === 'settings' && currentJob) || (currentPage === 'logs' && currentJob && !oppenedFromMenu)) &&
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
          </AdminContext.Provider>
        </JobContext.Provider>
      </NavFunctionsContext.Provider>
    </SpeedContext.Provider >
  );
}

export default App;