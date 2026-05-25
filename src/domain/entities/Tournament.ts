import { BracketAlreadyExistsException } from "../exceptions/BracketExceptions.js";
import { RegistrationNotClosedException } from "../exceptions/RegistrationExceptions.js";
import {
  TournamentAlreadyFinishedException,
  TournamentAlreadyHasBracketException,
  TournamentDoesNotHaveBracketException,
  TournamentMaxPlayersExceededException,
  TournamentNotInDraftException,
  TournamentNotInProgressException,
  TournamentNotPublishedException,
} from "../exceptions/TournamentExceptions.js";
import { MissingRequiredUserFieldsException } from "../exceptions/UserExceptions.js";
import { Registration, RegistrationPeriod, RegistrationStatus } from "./Registration.js";
import { Season } from "./Season.js";
import { TournamentInfo } from "./TournamentInfo.js";
import { IDomainEvent } from "../events/IDomainEvent.js";
import { TournamentFinishedEvent } from "../events/TournamentFinishedEvent.js";


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
  private season: Season;
  private readonly createdAt: Date;
  private status: TournamentStatus;

  private info: TournamentInfo;
  private registration: Registration;

  private hasBracket: boolean;

  private domainEvents: IDomainEvent[] = [];


  constructor(
    id: string,
    name: string,
    season: Season,
    createdAt: Date,
    status: TournamentStatus,
    info: TournamentInfo,
    registration: Registration,
    hasBracket: boolean,
  ) {
    this.id = id;
    this.name = name;
    this.season = season;
    this.createdAt = createdAt;
    this.status = status;
    this.info = info;
    this.registration = registration;
    this.hasBracket = hasBracket;
  }


  // --------------------------------------------------------------------
  // FACTORY METHOD
  // --------------------------------------------------------------------
  public static create(
    name: string,
    season: Season,
    info: TournamentInfo,
  ): Tournament {
    if (!name || name.trim() === '' || !info) {
      throw new MissingRequiredUserFieldsException();
    }

    return new Tournament(
      crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
      name,
      season,
      new Date(),
      TournamentStatus.DRAFT,
      info,
      Registration.create(),
      false,
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

  public updateSeason(season: Season): void {
    this.season = season;
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
    if (!this.hasBracket) {
      throw new TournamentDoesNotHaveBracketException();
    }

    this.status = TournamentStatus.IN_PROGRESS;
  }

  public finish(): void {
    if (this.status !== TournamentStatus.IN_PROGRESS) {
      throw new TournamentNotInProgressException();
    }
    this.status = TournamentStatus.FINISHED;
    this.recordEvent(new TournamentFinishedEvent(this.id));
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

  public isDelayed(): boolean {
    if (this.status !== TournamentStatus.PUBLISHED && this.status !== TournamentStatus.DRAFT) {
      return false;
    }
    const now = new Date();
    return now > this.info.getDateTime();
  }


  // --------------------------------------------------------------------
  // REGISTRATION METHODS
  // --------------------------------------------------------------------
  public openRegistration(): void {
    if (!this.isPublished()) {
      throw new TournamentNotPublishedException();
    }
    if (this.hasBracket) {
      throw new TournamentAlreadyHasBracketException();
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
    if (this.hasBracket) {
      throw new TournamentAlreadyHasBracketException();
    }

    this.registration = this.registration.schedule(open, close);
  }

  public registerParticipant(participantId: string) {
    if (this.hasBracket) {
      throw new TournamentAlreadyHasBracketException();
    }
    const maxPlayers = this.getInfo().getMaxPlayers();
    if (maxPlayers && this.registration.getRegisteredParticipantsCount() >= maxPlayers) {
      throw new TournamentMaxPlayersExceededException();
    }

    this.registration = this.registration.registerParticipant(participantId);
  }

  public unregisterParticipant(participantId: string) {
    if (this.hasBracket) {
      throw new TournamentAlreadyHasBracketException();
    }

    this.registration = this.registration.unregisterParticipant(participantId);
  }


  // --------------------------------------------------------------------
  // BRACKET METHODS
  // --------------------------------------------------------------------
  public bracketGenerated() {
    if (!this.isPublished()) {
      throw new TournamentNotPublishedException();
    }
    if (this.registration.isOpen()) {
      throw new RegistrationNotClosedException();
    }
    if (this.hasBracket) {
      throw new TournamentAlreadyHasBracketException();
    }

    this.hasBracket = true;
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

  public getSeason(): Season {
    return this.season;
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

  public getHasBracket(): boolean {
    return this.hasBracket;
  }

  // --------------------------------------------------------------------
  // DOMAIN EVENTS
  // --------------------------------------------------------------------    
  public pullEvents(): IDomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }

  public recordEvent(event: IDomainEvent): void {
    this.domainEvents.push(event);
  }



  // --------------------------------------------------------------------
  // REHYDRATE METHOD
  // --------------------------------------------------------------------
  static rehydrate(data: any): Tournament {
    return new Tournament(
      data.id,
      data.name,
      new Season(data.seasonStartYear),
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
      data.hasBracket,
    );
  }
}
