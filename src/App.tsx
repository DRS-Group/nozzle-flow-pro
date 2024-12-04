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
import { useAdmin } from './hooks/useAdmin';
import { TextInputDialog } from './components/text-input-dialog/text-input-dialog.component';
import { useTranslate } from './hooks/useTranslate';
import { services } from './dependency-injection';
import { NozzlesService } from './services/nozzles.service';

AndroidFullScreen.isImmersiveModeSupported()
  .then(() => AndroidFullScreen.immersiveMode())
  .catch(() => {
    document.onclick = () => {
    }
  });

function App() {
  const navigation = useNavigation();
  const currentJob = useCurrentJob();
  const admin = useAdmin();
  const translate = useTranslate();

  const [active, setActive] = useState<'on' | 'off'>('off');
  const [activeButtonState, setActiveButtonState] = useState<'on' | 'off' | 'auto'>('auto');

  const shouldUpdateNozzleEvents = () => {
    if (activeButtonState === 'off') return false;
    if (activeButtonState === 'auto' && active === 'off') return false;
    return true;
  }

  useEffect(() => {
    navigation.navigate('menu');

    SettingsService.getSettings().then((settings: SettingsType) => {
      NozzlesService.getNozzles().then((nozzles: Nozzle[]) => {
        nozzles.map((nozzle: Nozzle, index) => {
          services.dataFetcherService.calibrateNozzle(index, nozzle.pulsesPerLiter);
        });
      });
      const interval = settings.interval;
      services.dataFetcherService.setInterval(interval);
    });

  }, []);

  useEffect(() => {
    const eventHandler = async (data: any) => {
      const actice: boolean = data.active;
      setActive(actice ? 'on' : 'off');
    }

    services.dataFetcherService.addEventListener('onDataFetched', eventHandler);

    return () => {
      services.dataFetcherService.removeEventListener('onDataFetched', eventHandler);
    }
  }, [setActive]);

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
          (navigation.currentPage === 'nozzles' && currentJob.job != null) ||
          (navigation.currentPage === 'settings' && currentJob.job != null) ||
          (navigation.currentPage === 'logs' && currentJob.job != null)
        ) &&
        <BottomMenu
          onActiveChange={(active) => setActiveButtonState(active)}
        />
      }
      {
        admin.isPasswordSet === false &&
        <TextInputDialog
          title={translate("Set Admin Password")}
          label={translate("Admin password")}
          type="password"
          onConfirmClick={(password) => {
            admin.setPassword(password);
          }}
        />
      }
      {
        currentJob.getUnviewedTriggeredEvents().length > 0 && (activeButtonState === 'on' || (activeButtonState === 'auto' && active === 'on')) &&
        <AlertModal
          event={currentJob.getUnviewedTriggeredEvents()[0]}
          onOkClick={() => { currentJob.markEventAsViewed(currentJob.getUnviewedTriggeredEvents()[0].id) }}
          onOkForAllClick={currentJob.markAllEventAsViewed}
          totalEvents={currentJob.getUnviewedTriggeredEvents().length}
        />
      }
    </div>
  );
}

export default App;