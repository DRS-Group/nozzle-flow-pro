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
        setLogo(SettingsService.getLogoUri());
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
                    onClick={onJobsClick}
                >
                    <img src={`${process.env.PUBLIC_URL}/images/briefcase.svg`} />
                    <span>{translate('Jobs')}</span>
                </div>
                <div className={styles.item}
                    onClick={onNozzlesClick}
                >
                    <img src={`${process.env.PUBLIC_URL}/images/nozzle.svg`} />
                    <span>{translate('Nozzles')}</span>
                </div>
                <div className={styles.item}
                    onClick={onSettingsClick}
                >
                    <img src={`${process.env.PUBLIC_URL}/images/settings.svg`} />
                    <span>{translate('Settings')}</span>
                </div>
            </div>
        </div>
    )
});