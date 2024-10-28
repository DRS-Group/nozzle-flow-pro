import { JobContext, NavFunctionsContext } from '../../App';
import { TopBar } from '../../components/top-bar/top-bar.component';
import { defaultLogoUri, defaultSettings, SettingsService } from '../../services/settings.service';
import styles from './settings.module.css';
import { forwardRef, useContext, useEffect, useImperativeHandle, useState } from 'react';
import { Settings as SettingsType } from '../../types/settings.type';
import { TextInputDialog } from '../../components/text-input-dialog/text-input-dialog.component';
import { ContextMenu } from '../../components/context-menu/context-menu.component';

// SettingsService.setSettings(defaultSettings);

export type SettingsElement = {

}

export type SettingsProps = {

}

export const Settings = forwardRef<SettingsElement, SettingsProps>((props, ref) => {
    const { currentJob, setCurrentJob } = useContext(JobContext);
    const { currentPage, setCurrentPage } = useContext(NavFunctionsContext);

    const [settings, setSettings] = useState<SettingsType | null>(null);
    const [logoUri, setLogoUri] = useState<string>('');

    const [ApiBaseUriDialogOpen, setApiBaseUriDialogOpen] = useState<boolean>(false);

    const [languageContextMenuPosition, setLanguageContextMenuPosition] = useState<{ x: number, y: number } | null>(null);

    useImperativeHandle(ref, () => ({

    }), []);

    useEffect(() => {
        SettingsService.getSettings().then((settings) => {
            setSettings(settings);
        });
        SettingsService.getLogoUri().then((logoUri) => {
            setLogoUri(logoUri);
        });
    }, []);

    useEffect(() => {
        const eventHandler = async (settings: SettingsType) => {
            setSettings(settings);
        };
        SettingsService.addEventListener('onSettingsChange', eventHandler);
        return () => {
            SettingsService.removeEventListener('onSettingsChange', eventHandler);
        }
    }, [settings, setSettings]);

    const onBackClick = () => {
        setCurrentPage('menu');
    }

    const onLanguageClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        const x = e.nativeEvent.clientX;
        const y = e.nativeEvent.clientY;

        setLanguageContextMenuPosition({ x, y });
    }

    const onContextMenuBackgroundClick = () => {
        setLanguageContextMenuPosition(null);
    }

    const onLogoClick = async () => {
        const image = await SettingsService.selectImage();
        const blob = new Blob([image], { type: image.type });
        console.log(blob)
        SettingsService.saveFile(blob)
    }

    return (
        <>
            {!currentJob &&
                <TopBar
                    onBackClick={onBackClick}
                    title='Settings'
                />
            }
            <div className={styles.content}>
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                        Desenvolvimento
                    </div>
                    <div className={styles.sectionContent}>
                        <div className={styles.item}
                            onClick={() => {
                                SettingsService.setSettings(defaultSettings).then(() => {
                                    SettingsService.getSettings().then((settings) => {
                                        setSettings(settings);
                                    });
                                });
                                SettingsService.setLogoUri(defaultLogoUri).then(() => {
                                    SettingsService.getLogoUri().then((logoUri) => {
                                        setLogoUri(logoUri);
                                    });
                                });
                            }}
                        >
                            <div className={styles.itemLeft}>
                                <span className={styles.itemName}>Reset settings</span>
                            </div>
                            <div className={styles.itemRight}>
                                <i className="icon-thin-chevron-right"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                        General
                    </div>
                    <div className={styles.sectionContent}>
                        <div className={styles.item}
                            onClick={() => {
                                setApiBaseUriDialogOpen(true);
                            }}
                        >
                            <div className={styles.itemLeft}>
                                <span className={styles.itemName}>API Base URI</span>
                            </div>
                            <div className={styles.itemRight}>
                                <div className={styles.itemValue}>
                                    <span>{settings?.apiBaseUrl}</span>
                                </div>
                                <i className="icon-thin-chevron-right"></i>
                            </div>
                        </div>
                        <div className={styles.item}
                            onClick={onLanguageClick}
                        >
                            <div className={styles.itemLeft}>
                                <span className={styles.itemName}>Language</span>
                            </div>
                            <div className={styles.itemRight}>
                                <div className={styles.itemValue}>
                                    <span>{settings?.language}</span>
                                </div>
                                <i className="icon-unfold-more-horizontal"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                        Style
                    </div>
                    <div className={styles.sectionContent}>
                        <div className={styles.item}>
                            <div className={styles.itemLeft}>
                                <span className={styles.itemName}>Primary color</span>
                            </div>
                            <div className={styles.itemRight}>
                                <div className={styles.itemValue}>
                                    <div className={styles.colorBox} style={{ backgroundColor: settings?.primaryColor }}></div>
                                </div>
                                <i className="icon-thin-chevron-right"></i>
                            </div>
                        </div>
                        <div className={styles.item}>
                            <div className={styles.itemLeft}>
                                <span className={styles.itemName}>Secondary color</span>
                            </div>
                            <div className={styles.itemRight}>
                                <div className={styles.itemValue}>
                                    <div className={styles.colorBox} style={{ backgroundColor: settings?.secondaryColor }}></div>
                                </div>
                                <i className="icon-thin-chevron-right"></i>
                            </div>
                        </div>
                        <div className={styles.item}>
                            <div className={styles.itemLeft}>
                                <span className={styles.itemName}>Primary font color</span>
                            </div>
                            <div className={styles.itemRight}>
                                <div className={styles.itemValue}>
                                    <div className={styles.colorBox} style={{ backgroundColor: settings?.primaryFontColor }}></div>
                                </div>
                                <i className="icon-thin-chevron-right"></i>
                            </div>
                        </div>
                        <div className={styles.item}>
                            <div className={styles.itemLeft}>
                                <span className={styles.itemName}>Secondary font color</span>
                            </div>
                            <div className={styles.itemRight}>
                                <div className={styles.itemValue}>
                                    <div className={styles.colorBox} style={{ backgroundColor: settings?.secondaryFontColor }}></div>
                                </div>
                                <i className="icon-thin-chevron-right"></i>
                            </div>
                        </div>
                        <div className={styles.item}>
                            <div className={styles.itemLeft}>
                                <span className={styles.itemName}>Interface scale</span>
                            </div>
                            <div className={styles.itemRight}>
                                <div className={styles.itemValue}>
                                    <span>{settings?.interfaceScale}x</span>
                                </div>
                                <i className="icon-unfold-more-horizontal"></i>
                            </div>
                        </div>
                        <div className={styles.item}
                            onClick={() => {
                                onLogoClick();
                            }}
                        >
                            <div className={styles.itemLeft}>
                                <span className={styles.itemName}>Logo</span>
                            </div>
                            <div className={styles.itemRight}>
                                <div className={styles.itemValue}>
                                    <img src={logoUri} />
                                </div>
                                <i className="icon-thin-chevron-right"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {ApiBaseUriDialogOpen &&
                <TextInputDialog
                    title='Set API Base URI'
                    label='API Base URI'
                    defaultValue={settings?.apiBaseUrl}
                    onConfirmClick={(value: string) => {
                        SettingsService.setApiBaseUrl(value).then(() => {
                            SettingsService.getSettings().then((settings) => {
                                setSettings(settings);
                            });
                        });
                        setApiBaseUriDialogOpen(false);
                    }}
                    onCancelClick={() => {
                        setApiBaseUriDialogOpen(false);
                    }}
                />
            }
            {languageContextMenuPosition &&

                <ContextMenu
                    items={[
                        {
                            label: 'English',
                            onClick: () => {
                                SettingsService.setLanguage('en-us');
                            }
                        },
                        {
                            label: 'Português',
                            onClick: () => {
                                SettingsService.setLanguage('pt-br');
                            }
                        }
                    ]}
                    position={languageContextMenuPosition}

                    onBackgroundClick={onContextMenuBackgroundClick}
                />
            }
        </>
    )
});