export interface IEvent {
    id: string;
    title: string;
    description: string;
    startTime: Date;
    endTime: Date | undefined;
    viewed: boolean;
    triggered: boolean;
    coordinates: {
        latitude: number;
        longitude: number;
    };
    type: 'opticalSensor' | 'flowmeterSensor'
};