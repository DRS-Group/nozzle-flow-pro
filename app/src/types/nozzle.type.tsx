export type Nozzle = {
    name: string;
    pulsesPerMinute: number;
    pulsesPerLiter: number;

    ignored?: boolean;
}