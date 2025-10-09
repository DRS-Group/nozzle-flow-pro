import { IEvent } from "./event.type";
export type Job = {
    id: string;
    title: string;
    expectedFlow: number;
    tolerance: number;
    creationDate: Date;
    events: IEvent[];
};