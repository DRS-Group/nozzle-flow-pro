export type Nozzle = {
    name: string;
    flow: number;
    pulsesPerLiter: number;

    ignored?: boolean;
}