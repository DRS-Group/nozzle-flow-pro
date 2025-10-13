import { TopBar } from '../../components/top-bar/top-bar.component';
import { useCurrentJob } from '../../hooks/useCurrentJob';
import { useNavigation } from '../../hooks/useNavigation';
import { useTranslate } from '../../hooks/useTranslate';
import { IEvent } from '../../types/event.type';
import styles from './logs.module.css';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

export type LogsElement = {}

export type LogsProps = {}

export const Logs = forwardRef<LogsElement, LogsProps>((props, ref) => {
    const translate = useTranslate();
    const navigation = useNavigation();
    const currentJob = useCurrentJob();

    const [eventsToShow, setEventsToShow] = useState<IEvent[]>([]);

    useImperativeHandle(ref, () => ({

    }), []);

    useEffect(() => {
        setEventsToShow(currentJob.job?.events.filter(event => event.triggered).sort(
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
        function toDMS(coord: number, isLat: boolean) {
            const abs = Math.abs(coord);
            const deg = Math.floor(abs);
            const minFloat = (abs - deg) * 60;
            const min = Math.floor(minFloat);
            const sec = ((minFloat - min) * 60).toFixed(2);
            const dir = coord >= 0 ? (isLat ? 'N' : 'E') : (isLat ? 'S' : 'W');
            return `${deg}°${min}'${sec}"${dir}`;
        }

        let content = 'Start Time,End Time,Title,Description,Coordinates\n';
        eventsToShow.forEach(event => {
            const latDMS = toDMS(event.coordinates.latitude, true);
            const lonDMS = toDMS(event.coordinates.longitude, false);
            const coords = `${latDMS}, ${lonDMS}`;
            content += `${event.startTime.toLocaleDateString()} ${event.startTime.toLocaleTimeString()},${event.endTime ? event.endTime.toLocaleDateString() : ''},${event.title},${event.description},${coords}\n`;
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
                            {eventsToShow.map((event: IEvent, index: number) => (
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
                    onClick={download}
                >
                    <i className="icon-export"></i>
                </div>
            </div>
        </>
    )
});