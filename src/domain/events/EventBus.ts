import { IDomainEvent } from './IDomainEvent.js';

export interface EventBus {
    publish(events: IDomainEvent[]): Promise<void>;
    subscribe(eventClass: new (...args: any[]) => IDomainEvent, listener: (event: any) => void): void;
    register(eventName: string, listener: (event: any) => void): void;
}