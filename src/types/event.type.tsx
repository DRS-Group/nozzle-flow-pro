export type Event = {
    id: string;
    title: string;
    description: string;
    startTime: Date;
    endTime: Date | undefined;
    viewed: boolean;
    triggered: boolean;
};