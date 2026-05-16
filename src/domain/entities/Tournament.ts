import { RegistrationNotClosedException } from "../exceptions/RegistrationExceptions.js";
import {
  TournamentAlreadyFinishedException,
  TournamentNotInDraftException,
  TournamentNotInProgressException,
  TournamentNotPublishedException,
} from "../exceptions/TournamentExceptions.js";
import { MissingRequiredUserFieldsException } from "../exceptions/UserExceptions.js";
import { Registration, RegistrationPeriod, RegistrationStatus } from "./Registration.js";
import { TournamentInfo } from "./TournamentInfo.js";

export enum TournamentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

export class Tournament {
  private readonly id: string;
  private name: string;

  private readonly createdAt: Date;
  private status: TournamentStatus;

  private info: TournamentInfo;
  private registration: Registration;

  constructor(
    id: string,
    name: string,
    createdAt: Date,
    status: TournamentStatus,
    info: TournamentInfo,
    registration: Registration,
  ) {
    this.id = id;
    this.name = name;
    this.createdAt = createdAt;
    this.status = status;
    this.info = info;
    this.registration = registration;
  }


  // --------------------------------------------------------------------
  // FACTORY METHOD
  // --------------------------------------------------------------------
  public static create(
    name: string,
    info: TournamentInfo,
  ): Tournament {
    if (!name || name.trim() === '' || !info) {
      throw new MissingRequiredUserFieldsException();
    }

    return new Tournament(
      crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
      name,
      new Date(),
      TournamentStatus.DRAFT,
      info,
      Registration.create(),
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

  public updateInfo(info: TournamentInfo): void {
    this.info = info;
  }


  // --------------------------------------------------------------------
  // STATUS MANAGEMENT
  // --------------------------------------------------------------------
  public unpublish(): void {
    if (this.status !== TournamentStatus.PUBLISHED) {
      throw new TournamentNotPublishedException();
    }
    this.status = TournamentStatus.DRAFT;
  }

  public publish(): void {
    if (this.status !== TournamentStatus.DRAFT) {
      throw new TournamentNotInDraftException();
    }
    this.status = TournamentStatus.PUBLISHED;
  }

  public start(): void {
    if (this.status !== TournamentStatus.PUBLISHED) {
      throw new TournamentNotPublishedException();
    }

    if (this.registration.isOpen()) {
      throw new RegistrationNotClosedException();
    }
    this.status = TournamentStatus.IN_PROGRESS;
  }

  public finish(): void {
    if (this.status !== TournamentStatus.IN_PROGRESS) {
      throw new TournamentNotInProgressException();
    }
    this.status = TournamentStatus.FINISHED;
  }

  public cancel(): void {
    if (this.status === TournamentStatus.FINISHED) {
      throw new TournamentAlreadyFinishedException();
    }

    this.status = TournamentStatus.CANCELLED;
  }

  private isPublished(): boolean {
    return this.status === TournamentStatus.PUBLISHED;
  }


  // --------------------------------------------------------------------
  // REGISTRATION METHODS
  // --------------------------------------------------------------------
  public openRegistration(): void {
    if (!this.isPublished()) {
      throw new TournamentNotPublishedException();
    }

    this.registration = this.registration.open();
  }

  public closeRegistration(): void {
    if (!this.isPublished()) {
      throw new TournamentNotPublishedException();
    }

    this.registration = this.registration.close();
  }

  public scheduleRegistration(open: Date | null, close: Date | null) {
    if (!this.isPublished()) {
      throw new TournamentNotPublishedException();
    }

    this.registration = this.registration.schedule(open, close);
  }

  public registerParticipant(participantId: string) {
    this.registration = this.registration.registerParticipant(participantId);
  }

  public unregisterParticipant(participantId: string) {
    this.registration = this.registration.unregisterParticipant(participantId);
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

  public getInfo(): TournamentInfo {
    return this.info;
  }

  public getRegistration(): Registration {
    return this.registration;
  }


  // --------------------------------------------------------------------
  // REHYDRATE METHOD
  // --------------------------------------------------------------------
  static rehydrate(data: any): Tournament {
    return new Tournament(
      data.id,
      data.name,
      new Date(data.createdAt),
      data.status as TournamentStatus,
      new TournamentInfo(
        data.info.place,
        data.info.dateTime,
        data.info.mode,
        data.info.game,
        data.info.schedule,
        data.info.maxPlayers,
        data.info.gameType,
        data.info.numLegs,
        data.info.numSets,
        data.info.rules,
        data.info.info,
        data.info.federation,
      ),
      new Registration(
        data.registration.hasCheckIn,
        data.registration.status as RegistrationStatus,
        new RegistrationPeriod(
          data.registration.registrationPeriod.startsAt ? new Date(data.registration.registrationPeriod.startsAt) : null,
          data.registration.registrationPeriod.endsAt ? new Date(data.registration.registrationPeriod.endsAt) : null,
        ),
        data.registration.registeredParticipantsIds,
      ),
    );
  }
}
