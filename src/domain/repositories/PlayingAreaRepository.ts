import { PlayingArea } from '../entities/PlayingArea.js';

export interface PlayingAreaRepository {
    create(playingArea: PlayingArea): Promise<void>;
    update(playingArea: PlayingArea): Promise<void>;
    delete(id: string): Promise<void>;
    findById(id: string): Promise<PlayingArea | null>;
    findByTournamentId(tournamentId: string): Promise<PlayingArea | null>;
}
