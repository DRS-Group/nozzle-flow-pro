import { EventHandler } from "../types/event-handler.type";

export interface IBaseService<T extends string> {
    addEventListener: (eventName: T, callback: EventHandler<any>) => void;
    removeEventListener: (eventName: T, callback: EventHandler<any>) => void;
}

export abstract class BaseService<T extends string> implements IBaseService<T> {
    private eventListeners: Map<T, EventHandler<any>[]> = new Map();

    public addEventListener = (eventName: T, callback: EventHandler<any>) => {
        const listeners = this.eventListeners.get(eventName) || [];
        listeners.push(callback);
        this.eventListeners.set(eventName, listeners);
    }

    protected dispatchEvent = (eventName: T, args?: any) => {
        const listeners = this.eventListeners.get(eventName);
        if (listeners) {
            listeners.forEach(listener => listener(args));
        }
    }

    public removeEventListener = (eventName: T, callback: EventHandler<any>) => {
        const listeners = this.eventListeners.get(eventName);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
            if (listeners.length === 0) {
                this.eventListeners.delete(eventName);
            }
        }
    }
}