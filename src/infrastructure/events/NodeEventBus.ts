import { EventEmitter } from 'events';
import { EventBus } from '../../domain/events/EventBus.js';
import { IDomainEvent } from '../../domain/events/IDomainEvent.js';

export class NodeEventBus implements EventBus {
    private emitter = new EventEmitter();

    public async publish(events: IDomainEvent[]): Promise<void> {
        for (const event of events) {
            this.emitter.emit(event.getEventName(), event);
        }
    }

    public register(eventName: string, listener: (event: any) => void): void {
        this.emitter.on(eventName, listener);
    }
}
