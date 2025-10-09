import { useEffect } from 'react';
import { BottomMenu } from './components/bottom-menu/bottom-menu.component';
import { DataFecherService } from './services/data-fetcher.service';
import { DataView } from './views/data/data.view';
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
import { JobsService } from './services/jobs.service';
import { NavigationService } from './services/navigation.service';
import { CurrentJobService } from './services/current-job.service';
import { PumpService } from './services/pump.service';
import { AlertModal } from './components/alert-modal/alert-modal.component';
import { SensorsService } from './services/sensors.service';

services.jobsService = new JobsService();
services.currentJobService = new CurrentJobService();
services.navigationService = new NavigationService();
services.dataFetcherService = new DataFecherService();
services.pumpService = new PumpService();
services.sensorsService = new SensorsService();

function App() {
  const navigation = useNavigation();
  const currentJob = useCurrentJob();
  const admin = useAdmin();
  const translate = useTranslate();

  useEffect(() => {
    navigation.navigate('menu');

    // const settings: SettingsType = SettingsService.getSettings();
    // const interval = settings.interval;
    // services.dataFetcherService.setInterval(interval);

    const onNetworkStatusChange = (isConnected: boolean) => {
      if (!isConnected) return;

      const settings: SettingsType = SettingsService.getSettings();
      const interval = settings.interval;
      services.dataFetcherService.setInterval(interval);
    };

    SettingsService.addEventListener("onNetworkStatusChange", onNetworkStatusChange);

    return () => {
      SettingsService.removeEventListener("onNetworkStatusChange", onNetworkStatusChange);
    }
  }, []);

  useEffect(() => {
    const interfaceScale = SettingsService.getSettingOrDefault('interfaceScale', 1);
    const root = document.documentElement;
    const fontSize = 16 * interfaceScale;
    root.style.setProperty('font-size', `${fontSize}px`);

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
    const color = SettingsService.getSettingOrDefault('primaryColor', '#466905');
    const root = document.documentElement;
    root.style.setProperty('--primary-color', color);

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
    const color = SettingsService.getSettingOrDefault('secondaryColor', '#ffffff');
    const root = document.documentElement;
    root.style.setProperty('--secondary-color', color);

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
    const color = SettingsService.getSettingOrDefault('primaryFontColor', '#000000');
    const root = document.documentElement;
    root.style.setProperty('--primary-font-color', color);

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
    const color = SettingsService.getSettingOrDefault('secondaryFontColor', '#ffffff');
    const root = document.documentElement;
    root.style.setProperty('--secondary-font-color', color);

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
    <>
      {/* <SpeedSimulator /> */}

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
            (navigation.currentPage === 'logs' && navigation.previousPage !== 'jobs')
          ) &&
          <BottomMenu />
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
          currentJob.unviewedTriggeredEvents.length > 0 &&
          <AlertModal
            event={currentJob.unviewedTriggeredEvents[0]}
            onOkClick={() => { currentJob.markEventAsViewed(currentJob.unviewedTriggeredEvents[0].id) }}
            onOkForAllClick={currentJob.markAllEventsAsViewed}
            totalEvents={currentJob.unviewedTriggeredEvents.length}
          />
        }
      </div>
    </>
  );
}

export default App;