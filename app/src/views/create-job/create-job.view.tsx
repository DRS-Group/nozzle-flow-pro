import { NumberInput, NumberInputElement } from '../../components/number-input/number-input.component';
import { TextInput, TextInputElement } from '../../components/text-input/text-input.component';
import { TopBar } from '../../components/top-bar/top-bar.component';
import { services } from '../../dependency-injection';
import { useCurrentJob } from '../../hooks/useCurrentJob';
import { useJobs } from '../../hooks/useJobs';
import { useNavigation } from '../../hooks/useNavigation';
import { useTranslate } from '../../hooks/useTranslate';
import { SettingsService } from '../../services/settings.service';
import { Job } from '../../types/job.type';
import styles from './create-job.module.css';
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';

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
    const farmInputRef = useRef<TextInputElement>(null);
    const fieldInputRef = useRef<TextInputElement>(null);
    const serviceOrderInputRef = useRef<TextInputElement>(null);
    const operationInputRef = useRef<TextInputElement>(null);

    const expectedFlowInputRef = useRef<NumberInputElement>(null);
    const flowToleranceInputRef = useRef<NumberInputElement>(null);
    const nozzleSpacingInputRef = useRef<NumberInputElement>(null);

    const [page, setPage] = useState<'jobDetails' | 'flowmetersDetails'>('jobDetails');

    useImperativeHandle(ref, () => ({

    }), []);

    const onBackClick = useCallback(() => {
        if (page === 'flowmetersDetails') {
            setPage('jobDetails');
            return;
        }
        navigation.navigateBack();
    }, [page]);

    const onConfirmButtonClick = () => {
        const title = titleInputRef.current!.getValue();
        // Divide-se por 10.000 para obter o valor em L/m². Se não dividir por 10.000, fica em L/ha.
        const expectedFlow = parseFloat(expectedFlowInputRef.current!.getValue()) / 1;
        const flowTolerance = parseFloat(flowToleranceInputRef.current!.getValue()) / 100;
        const nozzleSpacing = parseFloat(nozzleSpacingInputRef.current!.getValue()) / 100;

        services.jobsService.saveJob({
            title: title,
            expectedFlow: expectedFlow,
            creationDate: new Date(),
            tolerance: flowTolerance,
            events: [],
            id: jobs.generateId(),
            nozzleSpacing: nozzleSpacing
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
                        visible={page === 'jobDetails'}
                    />
                    <TextInput
                        label={translate('Farm')}
                        className={styles.titleInput}
                        ref={farmInputRef}
                        value={''}
                        visible={page === 'jobDetails'}
                    />
                    <TextInput
                        label={translate('Field')}
                        className={styles.titleInput}
                        ref={fieldInputRef}
                        value={''}
                        visible={page === 'jobDetails'}
                    />
                    <TextInput
                        label={translate('Service Order')}
                        className={styles.titleInput}
                        ref={serviceOrderInputRef}
                        value={''}
                        visible={page === 'jobDetails'}
                    />
                    <TextInput
                        label={translate('Operation')}
                        className={styles.titleInput}
                        ref={operationInputRef}
                        value={''}
                        visible={page === 'jobDetails'}
                    />
                    {page === 'flowmetersDetails' &&
                        <>
                            <NumberInput
                                label={translate('Expected flow (L/ha)')}
                                className={styles.expectedFlow}
                                value={240}
                                decimals={2}
                                ref={expectedFlowInputRef}
                                unit='L/ha'
                                visible={page === 'flowmetersDetails'}
                            />
                            <NumberInput
                                label={translate('Variation margin (%)')}
                                className={styles.flowToleranceInput}
                                value={10}
                                decimals={2}
                                ref={flowToleranceInputRef}
                                unit='%'
                                visible={page === 'flowmetersDetails'}
                            />
                            <NumberInput
                                label={translate('Nozzle spacing (cm)')}
                                className={styles.flowToleranceInput}
                                value={SettingsService.getNozzleSpacing() * 100}
                                decimals={0}
                                ref={nozzleSpacingInputRef}
                                unit='cm'
                                visible={page === 'flowmetersDetails'}
                            />
                        </>
                    }
                </div>
            </div>
            {page === 'flowmetersDetails' &&
                <div
                    className={styles.confirmButton}
                    onClick={onConfirmButtonClick}
                >
                    <i className="icon-check"></i>
                </div>
            }
            {page === 'jobDetails' &&
                <div
                    className={styles.confirmButton}
                    onClick={() => { setPage('flowmetersDetails') }}
                    style={{ rotate: '180deg' }}
                >
                    <i className="icon-arrow-left"></i>
                </div>
            }
        </>
    )
});