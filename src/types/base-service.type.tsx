import { EventHandler } from "../types/event-handler";

export abstract class BaseService {
    private static eventListeners: Map<string, EventHandler<any>[]> = new Map();

    public static addEventListener = (eventName: string, callback: EventHandler<any>) => {
        const listeners = this.eventListeners.get(eventName) || [];
        listeners.push(callback);
        this.eventListeners.set(eventName, listeners);
    }

    protected static dispatchEvent = (eventName: string, args?: any) => {
        const listeners = this.eventListeners.get(eventName);
        if (listeners) {
            listeners.forEach(listener => listener(args));
        }
    }

    public static removeEventListener = (eventName: string, callback: EventHandler<any>) => {
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