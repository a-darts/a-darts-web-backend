import { describe, it, expect, vi, beforeEach } from "vitest";
import { SocketController } from "../../../infrastructure/websockets/SocketController.js";
import { MatchStatus } from "../../../domain/entities/Match.js";

describe("SocketController - Unit Tests", () => {
    let mockMatchService: any;
    let mockMatchCacheRepository: any;
    let controller: SocketController;
    let mockSocket: any;
    let mockIo: any;

    beforeEach(() => {
        vi.restoreAllMocks();

        mockMatchService = {
            updateScore: vi.fn().mockResolvedValue(undefined),
            finish: vi.fn().mockResolvedValue(undefined),
        };

        mockMatchCacheRepository = {
            setBoardActiveSession: vi.fn().mockResolvedValue(undefined),
            getActiveMatchForBoard: vi.fn().mockResolvedValue(null),
            getMatchStatus: vi.fn().mockResolvedValue(null),
            getThrows: vi.fn().mockResolvedValue([]),
            getLastThrow: vi.fn().mockResolvedValue(null),
            addThrow: vi.fn().mockResolvedValue(undefined),
            clearMatch: vi.fn().mockResolvedValue(undefined),
            removeLastThrow: vi.fn().mockResolvedValue(undefined),
            rebuildHistory: vi.fn().mockResolvedValue(undefined),
        };

        // Instanciamos el controlador con los mocks del servicio y del repositorio
        controller = new SocketController(mockMatchService, mockMatchCacheRepository);

        // Mock de un Socket individual de Socket.io
        mockSocket = {
            id: "socket-id-123",
            rooms: new Set(["socket-id-123"]),
            on: vi.fn(),
            join: vi.fn().mockResolvedValue(undefined),
            emit: vi.fn(),
            to: vi.fn().mockReturnThis(),
        };

        // Mock de la instancia global Server de Socket.io
        mockIo = {
            to: vi.fn().mockReturnThis(),
            emit: vi.fn(),
            sockets: {
                adapter: {
                    rooms: {
                        get: vi.fn().mockReturnValue(new Set(["socket-id-123"])),
                    },
                },
            },
        };
    });


    // --------------------------------------------------------------------
    // 1. TEST DE handleConnection (Registro de manejadores de eventos)
    // --------------------------------------------------------------------
    describe("handleConnection", () => {
        it("debe registrar todos los escuchadores de eventos del protocolo WebSocket", () => {
            controller.handleConnection(mockSocket, mockIo);

            expect(mockSocket.on).toHaveBeenCalledWith("join_board", expect.any(Function));
            expect(mockSocket.on).toHaveBeenCalledWith("score_update", expect.any(Function));
            expect(mockSocket.on).toHaveBeenCalledWith("score_undo", expect.any(Function));
            expect(mockSocket.on).toHaveBeenCalledWith("score_edit", expect.any(Function));
            expect(mockSocket.on).toHaveBeenCalledWith("swap_starting_player", expect.any(Function));
            expect(mockSocket.on).toHaveBeenCalledWith("disconnect", expect.any(Function));
        });
    });


    // --------------------------------------------------------------------
    // 2. TEST DE handleDisconnection
    // --------------------------------------------------------------------
    describe("handleDisconnection", () => {
        it("debe desactivar la sesión en caché si el socket sale y la sala queda vacía", async () => {
            // Preparamos al socket para simular que pertenecía a una diana
            mockSocket.rooms = new Set(["socket-id-123", "room_board_SXYZ-D001"]);
            // Simulamos que tras la desconexión, la sala tiene un tamaño menor o igual a 1 miembro restante
            mockIo.sockets.adapter.rooms.get.mockReturnValue(new Set(["socket-id-123"]));

            await controller.handleDisconnection(mockSocket, mockIo);

            expect(mockMatchCacheRepository.setBoardActiveSession).toHaveBeenCalledWith("SXYZ-D001", false);
        });

        it("NO debe desactivar la sesión en caché si todavía quedan clientes escuchando en la tablet/sala", async () => {
            mockSocket.rooms = new Set(["socket-id-123", "room_board_SXYZ-D001"]);
            // Simulamos que quedan más clientes conectados (por ejemplo 2)
            mockIo.sockets.adapter.rooms.get.mockReturnValue(new Set(["socket-id-123", "otra-tablet-id"]));

            await controller.handleDisconnection(mockSocket, mockIo);

            expect(mockMatchCacheRepository.setBoardActiveSession).not.toHaveBeenCalled();
        });
    });


    // --------------------------------------------------------------------
    // 3. TEST DE handleJoinBoard
    // --------------------------------------------------------------------
    describe("handleJoinBoard", () => {
        const boardId = "SXYZ-D001";
        const matchId = "match-999";

        it("debe unir al cliente a la sala, marcar activo en Redis y emitir 'match_assigned' si no está en progreso", async () => {
            mockMatchCacheRepository.getActiveMatchForBoard.mockResolvedValue(matchId);
            mockMatchCacheRepository.getMatchStatus.mockResolvedValue(MatchStatus.READY);

            await (controller as any).handleJoinBoard(mockSocket, boardId);

            expect(mockSocket.join).toHaveBeenCalledWith(`room_board_${boardId}`);
            expect(mockMatchCacheRepository.setBoardActiveSession).toHaveBeenCalledWith(boardId, true);
            expect(mockSocket.emit).toHaveBeenCalledWith("match_assigned", { matchId });
        });

        it("debe restaurar la partida emitiendo 'match_restored' con el historial completo si está IN_PROGRESS", async () => {
            const mockThrows = [{ turn: 1, score: 60 }];
            mockMatchCacheRepository.getActiveMatchForBoard.mockResolvedValue(matchId);
            mockMatchCacheRepository.getMatchStatus.mockResolvedValue(MatchStatus.IN_PROGRESS);
            mockMatchCacheRepository.getThrows.mockResolvedValue(mockThrows);

            await (controller as any).handleJoinBoard(mockSocket, boardId);

            expect(mockSocket.emit).toHaveBeenCalledWith("match_restored", { matchId, historyThrows: mockThrows });
        });

        it("debe tolerar errores de Redis sin romper el servidor y loguear en consola", async () => {
            const spyConsole = vi.spyOn(console, "error").mockImplementation(() => { });
            mockMatchCacheRepository.setBoardActiveSession.mockRejectedValue(new Error("Redis Down"));

            await (controller as any).handleJoinBoard(mockSocket, boardId);

            expect(spyConsole).toHaveBeenCalled();
            spyConsole.mockRestore();
        });
    });


    // --------------------------------------------------------------------
    // 4. TEST DE handleScoreUpdate
    // --------------------------------------------------------------------
    describe("handleScoreUpdate", () => {
        const updatePayload = {
            boardShortId: "SXYZ-D001",
            matchId: "match-999",
            throwData: {
                status: MatchStatus.IN_PROGRESS,
                participant1: { legsWon: 1, setsWon: 0 },
                participant2: { legsWon: 0, setsWon: 0 }
            }
        };

        it("debe invocar a updateScore si las piernas (legs) o sets del marcador cambiaron respecto a la última tirada", async () => {
            // Simulamos que en la tirada anterior iban 0-0
            mockMatchCacheRepository.getLastThrow.mockResolvedValue({
                participant1: { legsWon: 0, setsWon: 0 },
                participant2: { legsWon: 0, setsWon: 0 }
            });

            await (controller as any).handleScoreUpdate(mockSocket, updatePayload);

            expect(mockMatchCacheRepository.addThrow).toHaveBeenCalledWith(updatePayload.matchId, updatePayload.throwData);
            expect(mockMatchService.updateScore).toHaveBeenCalled();
            expect(mockSocket.to).toHaveBeenCalledWith(`room_board_${updatePayload.boardShortId}`);
            expect(mockSocket.emit).toHaveBeenCalledWith("score_update_confirmed", {
                matchId: updatePayload.matchId,
                throwData: updatePayload.throwData
            });
        });

        it("NO debe invocar a updateScore en la BD relacional si el set/leg sigue siendo idéntico", async () => {
            // Tirada anterior idéntica en sets/legs (por ejemplo, solo bajaron los puntos de 501, no cambió el leg)
            mockMatchCacheRepository.getLastThrow.mockResolvedValue({
                participant1: { legsWon: 1, setsWon: 0 },
                participant2: { legsWon: 0, setsWon: 0 }
            });

            await (controller as any).handleScoreUpdate(mockSocket, updatePayload);

            expect(mockMatchCacheRepository.addThrow).toHaveBeenCalled();
            expect(mockMatchService.updateScore).not.toHaveBeenCalled();
        });

        it("debe finalizar el partido y limpiar la caché si el estado de la tirada es FINISHED", async () => {
            const finishedPayload = {
                ...updatePayload,
                throwData: { ...updatePayload.throwData, status: MatchStatus.FINISHED }
            };

            await (controller as any).handleScoreUpdate(mockSocket, finishedPayload);

            expect(mockMatchService.finish).toHaveBeenCalledWith(finishedPayload.matchId);
            expect(mockMatchCacheRepository.clearMatch).toHaveBeenCalledWith(finishedPayload.matchId, finishedPayload.boardShortId);
        });
    });


    // --------------------------------------------------------------------
    // 5. TEST DE handleScoreUndo
    // --------------------------------------------------------------------
    describe("handleScoreUndo", () => {
        it("debe remover el último tiro, recuperar remanentes y difundir a la sala", async () => {
            const payload = { boardShortId: "SXYZ-D001", matchId: "match-999" };
            const remaining = [{ turn: 1, score: 40 }];
            mockMatchCacheRepository.getThrows.mockResolvedValue(remaining);

            await (controller as any).handleScoreUndo(mockSocket, payload);

            expect(mockMatchCacheRepository.removeLastThrow).toHaveBeenCalledWith(payload.matchId);
            expect(mockSocket.to).toHaveBeenCalledWith(`room_board_${payload.boardShortId}`);
            expect(mockSocket.emit).toHaveBeenCalledWith("score_undo_confirmed", {
                matchId: payload.matchId,
                historyThrows: remaining
            });
        });
    });


    // --------------------------------------------------------------------
    // 6. TEST DE handleScoreEdit
    // --------------------------------------------------------------------
    describe("handleScoreEdit", () => {
        it("debe reconstruir el historial en Redis y avisar a la sala usando el objeto IO general", async () => {
            const payload = {
                boardShortId: "SXYZ-D001",
                matchId: "match-999",
                historyThrows: [{ turn: 1, score: 60 }, { turn: 2, score: 100 }]
            };

            await (controller as any).handleScoreEdit(mockIo, payload);

            expect(mockMatchCacheRepository.rebuildHistory).toHaveBeenCalledWith(payload.matchId, payload.historyThrows);
            expect(mockIo.to).toHaveBeenCalledWith(`room_board_${payload.boardShortId}`);
            expect(mockIo.emit).toHaveBeenCalledWith("score_edit_confirmed", {
                matchId: payload.matchId,
                throwData: payload.historyThrows[1], // El último elemento
                historyThrows: payload.historyThrows
            });
        });

        it("debe ignorar la edición y lanzar un warning si el array de historial enviado viene vacío", async () => {
            const spyWarn = vi.spyOn(console, "warn").mockImplementation(() => { });
            const payload = { boardShortId: "SXYZ-D001", matchId: "match-999", historyThrows: [] };

            await (controller as any).handleScoreEdit(mockIo, payload);

            expect(mockMatchCacheRepository.rebuildHistory).not.toHaveBeenCalled();
            expect(spyWarn).toHaveBeenCalled();
            spyWarn.mockRestore();
        });
    });


    // --------------------------------------------------------------------
    // 7. TEST DE handleSwapStartingPlayer
    // --------------------------------------------------------------------
    describe("handleSwapStartingPlayer", () => {
        it("debe retransmitir la confirmación del intercambio del jugador inicial a la sala", async () => {
            const payload = { boardShortId: "SXYZ-D001", matchId: "match-999" };

            await (controller as any).handleSwapStartingPlayer(mockSocket, payload);

            expect(mockSocket.to).toHaveBeenCalledWith(`room_board_${payload.boardShortId}`);
            expect(mockSocket.emit).toHaveBeenCalledWith("swap_starting_player_confirmed", {
                matchId: payload.matchId
            });
        });
    });
});
