export type Nozzle = {
    id: string;
    name: string;
    flow: number | undefined;
    index: number;

    ignored?: boolean;
}