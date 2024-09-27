import { JobContext, NavFunctionsContext } from '../../App';
import { DateTimeInput } from '../../components/datetime-input/datetime-input.component';
import { NumberInput } from '../../components/number-input/number-input.component';
import { TextInput, TextInputElement } from '../../components/text-input/text-input.component';
import { TopBar } from '../../components/top-bar/top-bar.component';
import { JobsService } from '../../services/jobs.service';
import { Job } from '../../types/job.type';
import styles from './create-job.module.css';
import { forwardRef, useContext, useEffect, useImperativeHandle, useRef } from 'react';

export type CreateJobElement = {

}

export type CreateJobProps = {

}

export const CreateJob = forwardRef<CreateJobElement, CreateJobProps>((props, ref) => {
    const navFunctions = useContext(NavFunctionsContext);
    const { currentJob, setCurrentJob } = useContext(JobContext);

    const titleInputRef = useRef<TextInputElement>(null);

    useImperativeHandle(ref, () => ({

    }), []);

    const onBackClick = () => {
        navFunctions?.setPage('jobs');
    }

    const onConfirmButtonClick = () => {
        JobsService.addJob(new Job(titleInputRef.current!.getValue(), 2.5, 0.05, 7000)).then((job: Job) => {
            setCurrentJob(job);
            navFunctions?.setPage('dataView');
        });
    }

    useEffect(() => {
        console.log(currentJob);
    }, [currentJob]);

    return (
        <>
            <div className={styles.wrapper}>
                <TopBar
                    onBackClick={onBackClick}
                    title='Create Job'
                />
                <div className={styles.content}>
                    <TextInput
                        label='Title'
                        className={styles.titleInput}
                        ref={titleInputRef}
                        value='New Job'
                    />
                    <NumberInput
                        label='Time before alert (milliseconds)'
                        className={styles.durationToleranceInput}
                        value='7000'
                        decimals={0}
                    />
                    <NumberInput
                        label='Expected flow (L/min)'
                        className={styles.expectedFlow}
                        value='2.5'
                        decimals={2}
                    />
                    <NumberInput
                        label='Variation margin (%)'
                        className={styles.flowToleranceInput}
                        value='5'
                        decimals={2}
                    />
                </div>
            </div>
            <div
                className={styles.confirmButton}
                onClick={onConfirmButtonClick}
            >
                <i className="icon-check"></i>
            </div>
        </>
    )
});