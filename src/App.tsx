import { createContext, useEffect, useState } from 'react';
import { BottomMenu } from './components/bottom-menu/bottom-menu.component';
import { AndroidFullScreen } from '@awesome-cordova-plugins/android-full-screen';
import { DataFecherService } from './services/data-fetcher.service';
import { DataView } from './views/data/data.view';
import { Nozzle } from './types/nozzle.type';
import { generateFlowAboveExpectedNozzleEvent, generateFlowBelowExpectedNozzleEvent, NozzleEvent } from './types/nozzle-event.type';
import { AlertModal } from './components/alert-modal/alert-modal.component';
import { Menu } from './views/menu/menu.view';
import { Jobs } from './views/jobs/jobs.view';
import { CreateJob } from './views/create-job/create-job.view';
import { NozzlesView } from './views/nozzles/nozzles.view';
import { Settings } from './views/settings/settings.view';
import { SettingsService } from './services/settings.service';
import { Logs } from './views/logs/logs.view';
import { Settings as SettingsType } from './types/settings.type';
import { useNavigation } from './hooks/useNavigation';
import { useCurrentJob } from './hooks/useCurrentJob';

AndroidFullScreen.isImmersiveModeSupported()
  .then(() => AndroidFullScreen.immersiveMode())
  .catch(console.warn);

export const AdminContext = createContext<any>(true);

function App() {
  const navigation = useNavigation();
  const currentJob = useCurrentJob();

  const [isAdmin, setIsAdmin] = useState<boolean>(true);

  const [active, setActive] = useState<'on' | 'off'>('off');
  const [activeButtonState, setActiveButtonState] = useState<'on' | 'off' | 'auto'>('auto');

  const shouldUpdateNozzleEvents = () => {
    if (activeButtonState === 'off') return false;
    if (activeButtonState === 'auto' && active === 'off') return false;
    return true;
  }

  useEffect(() => {
    navigation.navigate('menu');
  }, []);

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

  return (
    <AdminContext.Provider value={{ isAdmin, setIsAdmin }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {
          navigation.currentPage === 'menu' &&
          <Menu />
        }
        {
          navigation.currentPage === 'jobs' &&
          <Jobs />
        }
        {
          navigation.currentPage === 'createJob' &&
          <CreateJob />
        }
        {
          navigation.currentPage === 'dataView' &&
          <DataView />
        }
        {
          navigation.currentPage === 'nozzles' &&
          <NozzlesView />
        }
        {
          navigation.currentPage === 'settings' &&
          <Settings />
        }
        {
          navigation.currentPage === 'logs' &&
          <Logs />
        }
        {
          (
            navigation.currentPage === 'dataView' ||
            (navigation.currentPage === 'nozzles' && currentJob) ||
            (navigation.currentPage === 'settings' && currentJob) ||
            (navigation.currentPage === 'logs' && currentJob)
          ) &&
          <BottomMenu
            onActiveChange={(active) => setActiveButtonState(active)}
          />
        }
        {/* {currentJob.getUnviewedTriggeredEvents().length > 0 &&
          <AlertModal
            event={currentJob.getUnviewedTriggeredEvents()[0]}
            onOkClick={() => { currentJob.markEventAsViewed(currentJob.getUnviewedTriggeredEvents()[0].id) }}
            onOkForAllClick={currentJob.markAllEventAsViewed}
            totalEvents={currentJob.getUnviewedTriggeredEvents().length}
          />
        }
        <span>{currentJob.getUnviewedTriggeredEvents().length}</span> */}
      </div>
    </AdminContext.Provider>
  );
}

export default App;