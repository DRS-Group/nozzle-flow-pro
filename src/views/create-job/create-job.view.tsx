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
    const { currentPage, setCurrentPage } = useContext(NavFunctionsContext);
    const { currentJob, setCurrentJob } = useContext(JobContext);

    const titleInputRef = useRef<TextInputElement>(null);
    const durationToleranceInputRef = useRef<TextInputElement>(null);
    const expectedFlowInputRef = useRef<TextInputElement>(null);
    const flowToleranceInputRef = useRef<TextInputElement>(null);

    useImperativeHandle(ref, () => ({

    }), []);

    const onBackClick = () => {
        setCurrentPage('jobs');
    }

    const onConfirmButtonClick = () => {
        const title = titleInputRef.current!.getValue();
        const durationTolerance = parseFloat(durationToleranceInputRef.current!.getValue());
        const expectedFlow = parseFloat(expectedFlowInputRef.current!.getValue());
        const flowTolerance = parseFloat(flowToleranceInputRef.current!.getValue()) / 100;

        JobsService.addJob(new Job(title, expectedFlow, flowTolerance, durationTolerance)).then((job: Job) => {
            setCurrentJob(job);
            setCurrentPage('dataView');
        });
    }

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
                        ref={durationToleranceInputRef}
                    />
                    <NumberInput
                        label='Expected flow (L/m²)'
                        className={styles.expectedFlow}
                        value='2.5'
                        decimals={2}
                        ref={expectedFlowInputRef}
                    />
                    <NumberInput
                        label='Variation margin (%)'
                        className={styles.flowToleranceInput}
                        value='5'
                        decimals={2}
                        ref={flowToleranceInputRef}
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