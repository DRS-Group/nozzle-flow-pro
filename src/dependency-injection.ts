import { IPumpService as IPumpService } from "./services/pump.service";
import { ICurrentJobService } from "./services/current-job.service";
import { IDataFecherService } from "./services/data-fetcher.service";
import { IJobsService } from "./services/jobs.service";
import { INavigationService } from "./services/navigation.service";

type ServicesTemplate = {
    jobsService: IJobsService;
    navigationService: INavigationService;
    dataFetcherService: IDataFecherService;
    currentJobService: ICurrentJobService;
    pumpService: IPumpService;
}

export let services: ServicesTemplate = {} as ServicesTemplate;