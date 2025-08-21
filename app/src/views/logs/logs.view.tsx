import { TopBar } from '../../components/top-bar/top-bar.component';
import { useCurrentJob } from '../../hooks/useCurrentJob';
import { useNavigation } from '../../hooks/useNavigation';
import { useTranslate } from '../../hooks/useTranslate';
import { Event } from '../../types/event.type';
import styles from './logs.module.css';
import { forwardRef, useContext, useEffect, useImperativeHandle, useState } from 'react';

export type LogsElement = {}

export type LogsProps = {}

export const Logs = forwardRef<LogsElement, LogsProps>((props, ref) => {
    const translate = useTranslate();
    const navigation = useNavigation();
    const currentJob = useCurrentJob();

    const [eventsToShow, setEventsToShow] = useState<Event[]>([]);

    useImperativeHandle(ref, () => ({

    }), []);

    useEffect(() => {
        setEventsToShow(currentJob.job?.nozzleEvents.filter(event => event.triggered).sort(
            (a, b) => b.startTime.getTime() - a.startTime.getTime()
        ) || []);
    }, [currentJob.job]);

const onBackClick = () => {
    currentJob.set(null);
    navigation.navigateBack();
}

function download() {
    if (!currentJob.job) return;

    // CSV content
    let content = 'Start Time,End Time,Title,Description\n';
    eventsToShow.forEach(event => {
        content += `${event.startTime.toLocaleDateString()} ${event.startTime.toLocaleTimeString()},${event.endTime ? event.endTime.toLocaleDateString() : ''},${event.title},${event.description}\n`;
    });

    content = content.replace('<b>', '');
    content = content.replace('</b>', '');


    var FileSaver = require('file-saver');
    var blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    FileSaver.saveAs(blob, `${currentJob.job.title}.csv`);
}

return (
    <>
        <div className={styles.wrapper}>
            {navigation.previousPage === 'jobs' &&
                <TopBar
                    onBackClick={onBackClick}
                    title={translate('Logs') + ' - ' + currentJob.job?.title}
                />
            }
            <div className={styles.content}>

                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>{translate('Date')}</th>
                            <th>{translate('Title')}</th>
                            <th>{translate('Coordinates')}</th>
                            <th>{translate('Description')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {eventsToShow.map((event: Event, index: number) => (
                            <tr key={index}>
                                <td>{event.startTime.toLocaleDateString()} {event.startTime.toLocaleTimeString()}</td>
                                <td>{event.title}</td>
                                <td>{event.coordinates.latitude}, {event.coordinates.longitude}</td>
                                <td dangerouslySetInnerHTML={{ __html: event.description }}></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div
                className={styles.confirmButton}
                onPointerDown={download}
            >
                <i className="icon-export"></i>
            </div>
        </div>
    </>
)
});