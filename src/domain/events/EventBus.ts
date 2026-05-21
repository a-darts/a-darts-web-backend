import { IDomainEvent } from './IDomainEvent.js';

export interface EventBus {
    publish(events: IDomainEvent[]): Promise<void>;
}