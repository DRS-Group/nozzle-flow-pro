import { JobContext, NavFunctionsContext, useTranslate } from '../../App';
import { TopBar } from '../../components/top-bar/top-bar.component';
import { Event } from '../../types/event.type';
import { Job } from '../../types/job.type';
import { NozzleEvent } from '../../types/nozzle-event.type';
import styles from './logs.module.css';
import { forwardRef, useContext, useEffect, useImperativeHandle, useState } from 'react';

export type LogsElement = {

}

export type LogsProps = {
    onBackClick: () => void;
}

export const Logs = forwardRef<LogsElement, LogsProps>((props, ref) => {
    const translate = useTranslate();

    const { setOppenedFromMenu, oppenedFromMenu } = useContext(NavFunctionsContext);
    const { currentJob, setCurrentJob } = useContext<any>(JobContext);
    const [nozzleEvents, setNozzleEvents] = useState<NozzleEvent[]>([]);

    useImperativeHandle(ref, () => ({

    }), []);

    useEffect(() => {
        const newNozzleEvents = currentJob?.nozzleEvents.filter((event: NozzleEvent) => event._triggered == true);
        setNozzleEvents(newNozzleEvents);
    }, [currentJob, setNozzleEvents]);

    const onBackClick = () => {
        setOppenedFromMenu(false);
        setCurrentJob(null);
        props.onBackClick();
    }

    return (
        <>
            <div className={styles.wrapper}>
                {oppenedFromMenu &&
                    <TopBar
                        onBackClick={onBackClick}
                        title={translate('Logs') + ' - ' + currentJob?.title}
                    />
                }
                <div className={styles.content}>

                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>{translate('Date')}</th>
                                <th>{translate('Title')}</th>
                                <th>{translate('Description')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {nozzleEvents.map((event: Event, index: number) => (
                                <tr key={index}>
                                    <td>{event._startTime.toLocaleDateString()} {event._startTime.toLocaleTimeString()}</td>
                                    <td>{event._title}</td>
                                    <td>{event._description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
});