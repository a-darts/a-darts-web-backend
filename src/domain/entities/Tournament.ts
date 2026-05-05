import { TournamentNotInDraftException, TournamentNotInProgressException, TournamentRegistrationNotClosedException } from "../exceptions/TournamentExceptions.js";
import { MissingRequiredUserFieldsException } from "../exceptions/UserExceptions.js";

export type TournamentStatus = 'draft' | 'published' | 'registration_open' | 'registration_closed' | 'in_progress' | 'finished' | 'cancelled';


export class Tournament {
  private readonly id: string;
  private name: string;

  private readonly createdAt: Date;
  private status: TournamentStatus;

  constructor(
    id: string,
    name: string,
    createdAt: Date,
    status: TournamentStatus,
  ) {
    this.id = id;
    this.name = name;
    this.createdAt = createdAt;
    this.status = status;
  }


  // --------------------------------------------------------------------
  // FACTORY METHOD
  // --------------------------------------------------------------------
  public static create(
    name: string,
  ): Tournament {
    if (!name) {
      throw new MissingRequiredUserFieldsException();
    }
    if (name.trim() === '') {
      throw new MissingRequiredUserFieldsException();
    }

    return new Tournament(
      crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
      name,
      new Date(),
      'draft',
    );
  }


  // --------------------------------------------------------------------
  // UPDATE METHODS
  // --------------------------------------------------------------------
  public updateName(newName: string): void {
    if (!newName || newName.trim() === '') {
      throw new MissingRequiredUserFieldsException();
    }
    this.name = newName;
  }


  // --------------------------------------------------------------------
  // STATUS MANAGEMENT
  // --------------------------------------------------------------------
  public publish(): void {
    if (this.status !== 'draft') {
      throw new TournamentNotInDraftException();
    }
    this.status = 'published';
  }

  public start(): void {
    if (this.status !== 'registration_closed') {
      throw new TournamentRegistrationNotClosedException();
    }
    this.status = 'in_progress';
  }

  public finish(): void {
    if (this.status !== 'in_progress') {
      throw new TournamentNotInProgressException();
    }
    this.status = 'finished';
  }

  public cancel(): void {
    this.status = 'cancelled';
  }


  // --------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------
  public getId(): string {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getStatus(): TournamentStatus {
    return this.status;
  }

  // --------------------------------------------------------------------
  // REHYDRATE METHOD
  // --------------------------------------------------------------------
  static rehydrate(data: any): Tournament {
    return new Tournament(
      data.id,
      data.name,
      data.createdAt,
      data.status,
    );
  }
}
