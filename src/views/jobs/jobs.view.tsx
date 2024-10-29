import { JobContext, NavFunctionsContext, useTranslate } from '../../App';
import { ContextMenu } from '../../components/context-menu/context-menu.component';
import { YesNoDialog } from '../../components/yes-no-dialog/yes-no-dialog.component';
import { TopBar } from '../../components/top-bar/top-bar.component';
import { JobsService } from '../../services/jobs.service';
import { Job } from '../../types/job.type';
import styles from './jobs.module.css';
import { forwardRef, useContext, useEffect, useImperativeHandle, useState } from 'react';

export type JobsElement = {

}

export type JobsProps = {
    onBackClick: () => void;
}

export const Jobs = forwardRef<JobsElement, JobsProps>((props, ref) => {
    const translate = useTranslate();
    const { currentPage, setCurrentPage } = useContext(NavFunctionsContext);
    const { currentJob, setCurrentJob } = useContext(JobContext);

    const [contextMenuJob, setContextMenuJob] = useState<Job | null>(null);
    const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number } | null>(null);

    const [deleteJobDialogOpen, setDeleteJobDialogOpen] = useState<boolean>(false);
    const [deleteJobDialogJob, setDeleteJobDialogJob] = useState<Job | null>(null);

    const [jobs, setJobs] = useState<Job[]>([]);

    useImperativeHandle(ref, () => ({

    }), []);

    useEffect(() => {
        refreshJobs();
    }, []);

    const refreshJobs = () => {
        JobsService.getJobs().then((jobs) => {
            setJobs(jobs);
        });
    }

    const onBackClick = () => {
        props.onBackClick();
    }

    const onJobItemClick = (job: Job, position: { x: number, y: number }) => {
        setContextMenuJob(job);
        setContextMenuPosition(position);
    }

    const onContextMenuBackgroundClick = () => {
        setContextMenuJob(null);
        setContextMenuPosition(null);
    }

    const onAddButtonClick = () => {
        setCurrentPage('createJob');
    }

    return (
        <>
            <div className={styles.wrapper}>
                <TopBar
                    onBackClick={onBackClick}
                    title={translate('Jobs')}
                />
                {jobs.length > 0 && (
                    <div className={styles.content}>
                        {jobs.map((job, index) => (
                            <JobItem
                                key={index}
                                job={job}
                                onClick={onJobItemClick}
                            />
                        ))}
                    </div>
                )}
                {jobs.length === 0 && (
                    <div className={styles.noJobsContent}>
                        <button onClick={onAddButtonClick}>{translate('Create Job')}</button>
                    </div>
                )}
            </div>
            <div
                className={styles.addButton}
                onClick={onAddButtonClick}
            >
                <i className="icon-plus"></i>
            </div>
            {contextMenuJob && contextMenuPosition && (
                <ContextMenu
                    onBackgroundClick={onContextMenuBackgroundClick}
                    position={contextMenuPosition}
                    items={[
                        {
                            label: translate('Continue'),
                            onClick: () => {
                                setCurrentJob(contextMenuJob);
                                setCurrentPage('dataView');

                                setContextMenuJob(null);
                                setContextMenuPosition(null);
                            },
                            icon: <i className="icon-play"></i>
                        },
                        {
                            label: translate('Logs'),
                            onClick: () => {
                                console.log('Logs');

                                setContextMenuJob(null);
                                setContextMenuPosition(null);
                            },
                            icon: <i className="icon-file-clock-outline"></i>
                        },
                        {
                            label: translate('Delete'),
                            onClick: () => {
                                setDeleteJobDialogJob(contextMenuJob);
                                setDeleteJobDialogOpen(true);

                                setContextMenuJob(null);
                                setContextMenuPosition(null);
                            },
                            icon: <i className="icon-trash"></i>
                        }
                    ]} />
            )}
            {deleteJobDialogOpen &&
                <YesNoDialog
                    title={translate('Delete Job')}
                    message={translate('Are you sure you want to delete this job?')}
                    onYesClick={() => {

                        JobsService.removeJob(deleteJobDialogJob!).then(() => {
                            refreshJobs();
                        });

                        setDeleteJobDialogOpen(false);
                        setDeleteJobDialogJob(null);
                    }}

                    onNoClick={() => {
                        setDeleteJobDialogOpen(false);
                        setDeleteJobDialogJob(null);
                    }}
                />
            }
        </>
    )
});

type JobItemElement = {

};

type JobItemProps = {
    onClick?: (job: Job, position: { x: number, y: number }) => void;
    job: Job;
}

const JobItem = forwardRef<JobItemElement, JobItemProps>((props, ref) => {
    useImperativeHandle(ref, () => ({

    }), []);

    const onClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        const x = e.nativeEvent.clientX;
        const y = e.nativeEvent.clientY;

        props.onClick!(props.job, { x, y });
    }

    return (
        <div className={styles.jobItem} onClick={onClick}>
            <span>{props.job.title}</span>
            <span>{props.job.creationDate.toLocaleDateString()}</span>
        </div>
    )
});