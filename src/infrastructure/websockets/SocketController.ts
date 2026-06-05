import { Server, Socket } from 'socket.io';
import { IMatchCacheRepository } from '../../domain/ports/repositories/IMatchCacheRepository.js';
import { MatchService } from '../../application/services/MatchService.js';
import { MatchStatus } from '../../domain/entities/Match.js';

export class SocketController {
    constructor(
        private matchService: MatchService,
        private matchCacheRepository: IMatchCacheRepository,
    ) { }

    public handleConnection(socket: Socket, io: Server): void {
        console.log(`Client connected: ${socket.id}`);

        socket.on('join_board', (boardShortId) => this.handleJoinBoard(socket, boardShortId));
        socket.on('score_update', (data) => this.handleScoreUpdate(socket, data));
        socket.on('score_undo', (data) => this.handleScoreUndo(socket, data));
        socket.on('score_edit', (data) => this.handleScoreEdit(io, data));

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    }

    private async handleJoinBoard(socket: Socket, boardShortId: string): Promise<void> {
        const roomName = `room_board_${boardShortId}`;
        await socket.join(roomName);
        console.log(`[SocketServer] Client ${socket.id} successfully joined ${roomName}`);

        try {
            // 1. Check if there's an active match for the board
            const matchId = await this.matchCacheRepository.getActiveMatchForBoard(boardShortId);
            if (matchId) {
                // 1.1. If there's an active match, fetch the current status and history of throws
                const status = await this.matchCacheRepository.getMatchStatus(matchId);
                const historyThrows = await this.matchCacheRepository.getThrows(matchId);

                // 1.1.1. If the match is IN_PROGRESS, send the full history of throws
                if (status === MatchStatus.IN_PROGRESS) {
                    socket.emit('match_restored', { matchId, historyThrows });
                }
                // 1.1.2. Else, if the match is not IN_PROGRESS, just send the match assignment
                else {
                    socket.emit('match_assigned', { matchId });
                }
            }
        } catch (error) {
            console.error(`[SocketServer] Error al verificar partido activo en la diana ${boardShortId}:`, error);
        }
    }

    private async handleScoreUpdate(socket: Socket, data: any): Promise<void> {
        const { boardShortId, matchId, throwData } = data;
        try {
            // 1. Fetch the last throw to compare if the score has actually changed
            const lastThrow = await this.matchCacheRepository.getLastThrow(matchId);

            // 2. Save the current throw in Redis
            await this.matchCacheRepository.addThrow(matchId, throwData);

            // 3. Update the match score executing the use case only if there's a change in legs or sets won
            const hasScoreChanged = !lastThrow ||
                throwData.participant1.legsWon !== lastThrow.participant1.legsWon ||
                throwData.participant1.setsWon !== lastThrow.participant1.setsWon ||
                throwData.participant2.legsWon !== lastThrow.participant2.legsWon ||
                throwData.participant2.setsWon !== lastThrow.participant2.setsWon;
            if (hasScoreChanged) {
                await this.matchService.updateScore({
                    id: matchId,
                    participant1Sets: throwData.participant1.setsWon,
                    participant1Legs: throwData.participant1.legsWon,
                    participant2Sets: throwData.participant2.setsWon,
                    participant2Legs: throwData.participant2.legsWon,
                });
            }

            // 4. If the match is finished, execute the finish match use case and clear the cache
            if (throwData.status === MatchStatus.FINISHED) {
                await this.matchService.finish(matchId);
                await this.matchCacheRepository.clearMatch(matchId, boardShortId);
            }

            // 5. Broadcast the score update to all clients in the same board room except the sender
            const roomName = `room_board_${boardShortId}`;
            socket.to(roomName).emit('score_update_confirmed', { matchId, throwData });
        } catch (error) {
            console.error(`[SocketServer] Error procesando score_update:`, error);
        }
    }

    private async handleScoreUndo(socket: Socket, data: any): Promise<void> {
        const { boardShortId, matchId } = data;
        try {
            // 1. Remove the last throw from Redis
            await this.matchCacheRepository.removeLastThrow(matchId);

            // 2. Fetch the remaining throws after the undo operation
            const remainingThrows = await this.matchCacheRepository.getThrows(matchId);

            // 3. Broadcast the score undo confirmation along with the remaining throws to all clients in the same board room except the sender
            const roomName = `room_board_${boardShortId}`;
            socket.to(roomName).emit('score_undo_confirmed', {
                matchId,
                historyThrows: remainingThrows
            });
        } catch (error) {
            console.error(`[SocketServer] Error procesando match_undo:`, error);
        }
    }

    private async handleScoreEdit(io: Server, data: any): Promise<void> {
        const { boardShortId, matchId, historyThrows } = data;
        try {
            if (!historyThrows || historyThrows.length === 0) {
                console.warn(`[SocketServer] Received empty historyThrows: ${matchId}`);
                return;
            };

            // 1. Rebuild the match history in Redis with the provided edited history
            // (without the first empty throw)
            const latestThrow = historyThrows[historyThrows.length - 1];
            await this.matchCacheRepository.rebuildHistory(matchId, historyThrows);

            // 2. Broadcast the score edit confirmation along with the latest throw and the full edited history to all clients in the same board room except the sender
            const roomName = `room_board_${boardShortId}`;
            io.to(roomName).emit('score_edit_confirmed', {
                matchId,
                throwData: latestThrow,
                historyThrows: historyThrows,
            });
        } catch (error) {
            console.error(`[SocketServer] Error procesando score_edit:`, error);
        }
    }
}
