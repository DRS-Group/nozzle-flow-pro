export class Event {
    _id: string;
    _title: string;
    _description: string;
    _startTime: Date;
    _endTime: Date | undefined;
    _viewed: boolean;
    _triggered: boolean;

    constructor(title: string, description: string, startTime: Date, endTime: Date | undefined, triggered: boolean) {
        this._id = Math.random().toString(36).substring(2) + Date.now().toString(36);
        this._title = title;
        this._description = description;
        this._startTime = startTime;
        this._endTime = endTime;
        this._viewed = false;
        this._triggered = triggered;
    }


    get id() {
        return this._id;
    }

    get title() {
        return this._title;
    }
    set title(title: string) {
        this._title = title;
    }

    get description() {
        return this._description;
    }
    set description(description: string) {
        this._description = description;
    }

    get startTime() {
        return this._startTime;
    }
    set startTime(startTime: Date) {
        this._startTime = startTime;
    }

    get endTime(): Date {
        return this._endTime!;
    }
    set endTime(endTime: Date) {
        this._endTime = endTime;
    }

    get viewed() {
        return this._viewed;
    }
    set viewed(viewed: boolean) {
        this._viewed = viewed;
    }

    get triggered() {
        return this._triggered;
    }
    set triggered(triggered: boolean) {
        this._triggered = triggered;
    }

    get duration() {
        if (this._endTime === undefined)
            return Date.now() - this._startTime.getTime();

        return this._endTime!.getTime() - this._startTime.getTime();
    }

    get isOngoing() {
        return this._startTime.getTime() <= Date.now() && this._endTime!.getTime() >= Date.now();
    }

    get isUpcoming() {
        return this._startTime.getTime() > Date.now();
    }

    get isPast() {
        return this._endTime!.getTime() < Date.now();
    }
}