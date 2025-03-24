import { NumberInput } from '../../components/number-input/number-input.component';
import { TextInput, TextInputElement } from '../../components/text-input/text-input.component';
import { TopBar } from '../../components/top-bar/top-bar.component';
import { services } from '../../dependency-injection';
import { useCurrentJob } from '../../hooks/useCurrentJob';
import { useJobs } from '../../hooks/useJobs';
import { useNavigation } from '../../hooks/useNavigation';
import { useTranslate } from '../../hooks/useTranslate';
import { Job } from '../../types/job.type';
import styles from './create-job.module.css';
import { forwardRef, useContext, useImperativeHandle, useRef } from 'react';

export type CreateJobElement = {

}

export type CreateJobProps = {

}

export const CreateJob = forwardRef<CreateJobElement, CreateJobProps>((props, ref) => {
    const translate = useTranslate();
    const navigation = useNavigation();
    const jobs = useJobs();
    const currentJob = useCurrentJob();

    const titleInputRef = useRef<TextInputElement>(null);
    const durationToleranceInputRef = useRef<TextInputElement>(null);
    const expectedFlowInputRef = useRef<TextInputElement>(null);
    const flowToleranceInputRef = useRef<TextInputElement>(null);

    useImperativeHandle(ref, () => ({

    }), []);

    const onBackClick = () => {
        navigation.navigateBack();
    }

    const onConfirmButtonClick = () => {
        const title = titleInputRef.current!.getValue();
        const durationTolerance = parseFloat(durationToleranceInputRef.current!.getValue());
        // Divide-se por 10.000 para obter o valor em L/m².
        const expectedFlow = parseFloat(expectedFlowInputRef.current!.getValue()) / 10000;
        const flowTolerance = parseFloat(flowToleranceInputRef.current!.getValue()) / 100;

        services.jobsService.saveJob({
            title: title,
            durationTolerance: durationTolerance,
            expectedFlow: expectedFlow,
            creationDate: new Date(),
            tolerance: flowTolerance,
            nozzleEvents: [],
            id: jobs.generateId()
        }).then((job: Job) => {
            currentJob.set(job.id);
            navigation.navigate('dataView');
        });
    }

    return (
        <>
            <div className={styles.wrapper}>
                <TopBar
                    onBackClick={onBackClick}
                    title={translate('Create Job')}
                />
                <div className={styles.content}>
                    <TextInput
                        label={translate('Title')}
                        className={styles.titleInput}
                        ref={titleInputRef}
                        value={translate('New Job')}
                    />
                    <NumberInput
                        label={translate('Time before alert (milliseconds)')}
                        className={styles.durationToleranceInput}
                        value={7000}
                        decimals={0}
                        ref={durationToleranceInputRef}
                        unit='ms'
                    />
                    <NumberInput
                        label={translate('Expected flow (L/ha)')}
                        className={styles.expectedFlow}
                        value={2.5}
                        decimals={2}
                        ref={expectedFlowInputRef}
                        unit='L/ha'
                    />
                    <NumberInput
                        label={translate('Variation margin (%)')}
                        className={styles.flowToleranceInput}
                        value={5}
                        decimals={2}
                        ref={flowToleranceInputRef}
                        unit='%'
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