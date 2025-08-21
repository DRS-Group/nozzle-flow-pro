import { useNavigation } from '../../hooks/useNavigation';
import { useTranslate } from '../../hooks/useTranslate';
import { SettingsService } from '../../services/settings.service';
import styles from './menu.module.css';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

export type MenuElement = {}

export type MenuProps = {}

export const Menu = forwardRef<MenuElement, MenuProps>((props, ref) => {
    const translate = useTranslate();
    const navigation = useNavigation();

    const [logo, setLogo] = useState<string>('');

    useImperativeHandle(ref, () => ({

    }), []);

    useEffect(() => {
        SettingsService.getLogoUri().then((logo) => {
            setLogo(logo);
        });
    }, []);

    const onJobsClick = () => {
        navigation.navigate('jobs');
    }

    const onNozzlesClick = () => {
        navigation.navigate('nozzles');
    }

    const onSettingsClick = () => {
        navigation.navigate('settings');
    }

    return (
        <div className={styles.wrapper}>
            <img src={logo} className={styles.logo} />
            <div className={styles.itemsWrapper}>
                <div
                    className={styles.item}
                    onPointerDown={onJobsClick}
                >
                    <img src="/images/briefcase.svg" />
                    <span>{translate('Jobs')}</span>
                </div>
                <div className={styles.item}
                    onPointerDown={onNozzlesClick}
                >
                    <img src="/images/nozzle.svg" />
                    <span>{translate('Nozzles')}</span>
                </div>
                <div className={styles.item}
                    onPointerDown={onSettingsClick}
                >
                    <img src="/images/settings.svg" />
                    <span>{translate('Settings')}</span>
                </div>
            </div>
        </div>
    )
});