export interface ISensor {
    name: string;
    ignored: boolean;
    type: 'optical' | 'flowmeter';
    lastPulseAge: number;
}