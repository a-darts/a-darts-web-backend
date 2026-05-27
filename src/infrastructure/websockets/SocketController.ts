import { Server, Socket } from 'socket.io';
import { MatchStateCache } from '../cache/MatchStateCache.js';
import { UpdateMatchScore } from '../../application/services/tournament/matches/UpdateMatchScore.js';
import { FinishMatch } from '../../application/services/tournament/matches/status/FinishMatch.js';

export class SocketController {
    constructor(
        private updateMatchScoreUseCase: UpdateMatchScore,
        private finishMatchUseCase: FinishMatch
    ) {}

    public handleConnection(socket: Socket, io: Server): void {
        console.log(`Client connected: ${socket.id}`);

        socket.on('join_board', (boardShortId) => this.handleJoinBoard(socket, boardShortId));
        socket.on('score_update', (data) => this.handleScoreUpdate(socket, io, data));
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
            // Check if there's an active match for the board
            const matchId = await MatchStateCache.getActiveMatchForBoard(boardShortId);
            if (matchId) {
                // If there's an active match, fetch the current status and history of throws
                const status = await MatchStateCache.getMatchStatus(matchId);
                const historyThrows = await MatchStateCache.getThrows(matchId);

                // If the match is IN_PROGRESS, send the full history of throws
                if (status === 'IN_PROGRESS') {
                    socket.emit('match_restored', { matchId, historyThrows });
                }
                // Else, if the match is not IN_PROGRESS, just send the match assignment
                else {
                    socket.emit('match_assigned', { matchId });
                }
            }
        } catch (error) {
            console.error(`[SocketServer] Error al verificar partido activo en la diana ${boardShortId}:`, error);
        }
    }

    private async handleScoreUpdate(socket: Socket, io: Server, data: any): Promise<void> {
        const { boardShortId, matchId, throwData } = data;
        try {
            // Fetch the last throw to compare if the score has actually changed
            const lastThrow = await MatchStateCache.getLastThrow(matchId);

            // Save the current throw in Redis
            await MatchStateCache.addThrow(matchId, throwData);

            // Update the match score executing the use case only if there's a change in legs or sets won
            const hasScoreChanged = !lastThrow || 
                throwData.participant1.legsWon !== lastThrow.participant1.legsWon ||
                throwData.participant1.setsWon !== lastThrow.participant1.setsWon ||
                throwData.participant2.legsWon !== lastThrow.participant2.legsWon ||
                throwData.participant2.setsWon !== lastThrow.participant2.setsWon;
            if (hasScoreChanged) {
                await this.updateMatchScoreUseCase.execute({
                    id: matchId,
                    participant1Sets: throwData.participant1.setsWon,
                    participant1Legs: throwData.participant1.legsWon,
                    participant2Sets: throwData.participant2.setsWon,
                    participant2Legs: throwData.participant2.legsWon,
                });
            }

            // If the match is finished, execute the finish match use case and clear the cache
            if (throwData.status === 'FINISHED') {
                await this.finishMatchUseCase.execute(matchId);
                await MatchStateCache.clearMatch(matchId, boardShortId);
            }

            // Broadcast the score update to all clients in the same board room except the sender
            const roomName = `room_board_${boardShortId}`;
            socket.to(roomName).emit('score_update_confirmed', { matchId, throwData });
        } catch (error) {
            console.error(`[SocketServer] Error procesando score_update:`, error);
        }
    }

    private async handleScoreUndo(socket: Socket, data: any): Promise<void> {
        const { boardShortId, matchId } = data;
        try {
            // Remove the last throw from Redis
            await MatchStateCache.removeLastThrow(matchId);

            // Fetch the remaining throws after the undo operation
            const remainingThrows = await MatchStateCache.getThrows(matchId);

            // Broadcast the score undo confirmation along with the remaining throws to all clients in the same board room except the sender
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
            if (!historyThrows || historyThrows.length === 0) return;

            const latestThrow = historyThrows[historyThrows.length - 1];
            await MatchStateCache.rebuildHistory(matchId, historyThrows);

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
