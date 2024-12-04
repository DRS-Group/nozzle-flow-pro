import { DataFecherService, IDataFecherService } from "./services/data-fetcher.service";
import { IJobsService, JobsService } from "./services/jobs.service";
import { INavigationService, NavigationService } from "./services/navigation.service";

type ServicesTemplate = {
    jobsService: IJobsService;
    navigationService: INavigationService;
    dataFetcherService: IDataFecherService;
}

export const services: ServicesTemplate = {
    jobsService: new JobsService(),
    navigationService: new NavigationService(),
    dataFetcherService: new DataFecherService()
};