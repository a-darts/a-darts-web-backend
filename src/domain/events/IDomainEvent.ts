export interface IDomainEvent {
    readonly occurredOn: Date;
    getEventName(): string;
}
