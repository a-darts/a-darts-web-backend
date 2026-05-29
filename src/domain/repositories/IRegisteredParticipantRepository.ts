import { RegisteredParticipant } from '../entities/Participant.js';

export interface IRegisteredParticipantRepository {
  create(registeredParticipant: RegisteredParticipant): Promise<void>;
  update(registeredParticipant: RegisteredParticipant): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<RegisteredParticipant[]>;
  findById(id: string): Promise<RegisteredParticipant | null>;
  findByTournamentIdAndPlayerId(tournamentId: string, playerId: string): Promise<RegisteredParticipant | null>;
  findAllByTournamentId(tournamentId: string): Promise<RegisteredParticipant[]>;
  findAllByPlayerId(playerId: string): Promise<RegisteredParticipant[]>;
}
