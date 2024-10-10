export type Nozzle = {
    name: string;
    flow: number | null;
    pulsesPerLiter: number;

    ignored?: boolean;
}