import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from "vitest";
import { createServer, Server as HttpServer } from "node:http";
import { type AddressInfo } from "node:net";
import { io as ioc, type Socket as ClientSocket } from "socket.io-client";
import { Server } from "socket.io";
import { SocketFactory } from "../../../infrastructure/websockets/SocketFactory.js";
import { globalEventBus } from "../../../infrastructure/config/eventBus.js";
import {
    MatchStartedEvent,
    MatchSuspendedEvent,
    MatchResumedEvent,
    MatchCancelledEvent,
    MatchUnassignedFromBoardEvent,
    MatchAssignedToBoardEvent
} from "../../../domain/events/MatchEvents.js";
import { MatchStatus } from "../../../domain/entities/Match.js";

const mockMatchCacheRepository = {
    setBoardActiveSession: vi.fn(),
    setActiveMatchForBoard: vi.fn(),
    getActiveMatchForBoard: vi.fn(),
    getMatchStatus: vi.fn(),
    getThrows: vi.fn(),
    setMatchStatus: vi.fn(),
};

vi.mock("../../../infrastructure/persistence/repositories/RedisMatchCacheRepository.js", () => {
    return {
        RedisMatchCacheRepository: class {
            constructor() {
                return mockMatchCacheRepository;
            }
        }
    };
});

vi.mock("../../../infrastructure/factories/MatchServiceFactory.js", () => {
    return {
        default: {
            getInstance: () => ({ updateScore: vi.fn(), finish: vi.fn() }),
        }
    };
});

describe("Socket Integration Tests - Darts System Full Coverage", () => {
    let ioServer: Server;
    let httpServer: HttpServer;
    let clientSocket: ClientSocket;
    const testBoardShortId = "SXYZ-D001";
    const testMatchId = "match-1234";

    beforeAll(() => {
        return new Promise<void>((resolve) => {
            httpServer = createServer();
            ioServer = SocketFactory.compose(httpServer);

            httpServer.listen(() => {
                const port = (httpServer.address() as AddressInfo).port;
                clientSocket = ioc(`http://localhost:${port}`, {
                    transports: ['websocket'],
                    forceNew: true
                });
                clientSocket.on("connect", resolve); // Solo conecta, no emite el join de forma oculta
            });
        });
    });

    afterAll(() => {
        if (ioServer) ioServer.close();
        if (httpServer) httpServer.close();
        if (clientSocket) clientSocket.disconnect();
    });

    beforeEach(() => {
        vi.restoreAllMocks();
        clientSocket.removeAllListeners();
    });

    // ==========================================
    // 1. PRUEBA DE CONEXIÓN Y UNIÓN A SALA (Mantenida y protegida)
    // ==========================================
    it("debe activar la sesión en la caché y unirse a la sala al emitir 'join_board'", () => {
        return new Promise<void>((resolve, reject) => {
            mockMatchCacheRepository.setBoardActiveSession.mockResolvedValue(undefined);

            clientSocket.emit("join_board", testBoardShortId);

            setTimeout(() => {
                try {
                    // Verificamos Redis
                    expect(mockMatchCacheRepository.setBoardActiveSession).toHaveBeenCalledWith(testBoardShortId, true);

                    // Verificamos Socket.io
                    const roomName = `room_board_${testBoardShortId}`;
                    const rooms = ioServer.sockets.adapter.rooms;
                    expect(rooms.get(roomName)).toBeDefined();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            }, 100);
        });
    });

    // ==========================================
    // 2. TESTS DE SUCESOS DEL EVENT BUS (Requieren que el test anterior haya creado la sala)
    // ==========================================

    it("debe retransmitir 'match_suspended' al recibir un MatchSuspendedEvent", () => {
        return new Promise<void>((resolve) => {
            clientSocket.on("match_suspended", (data: any) => {
                expect(data.matchId).toEqual(testMatchId);
                resolve();
            });
            globalEventBus.publish([new MatchSuspendedEvent(testMatchId, testBoardShortId)]);
        });
    });

    it("debe retransmitir 'match_resumed' al recibir un MatchResumedEvent", () => {
        return new Promise<void>((resolve) => {
            clientSocket.on("match_resumed", (data: any) => {
                expect(data.matchId).toEqual(testMatchId);
                resolve();
            });
            globalEventBus.publish([new MatchResumedEvent(testMatchId, testBoardShortId)]);
        });
    });

    it("debe retransmitir 'match_cancelled' al recibir un MatchCancelledEvent", () => {
        return new Promise<void>((resolve) => {
            clientSocket.on("match_cancelled", (data: any) => {
                expect(data.matchId).toEqual(testMatchId);
                resolve();
            });
            globalEventBus.publish([new MatchCancelledEvent(testMatchId, testBoardShortId)]);
        });
    });

    it("debe retransmitir 'match_unassigned' al recibir un MatchUnassignedFromBoardEvent", () => {
        return new Promise<void>((resolve) => {
            clientSocket.on("match_unassigned", (data: any) => {
                expect(data.matchId).toEqual(testMatchId);
                resolve();
            });
            globalEventBus.publish([new MatchUnassignedFromBoardEvent(testMatchId, testBoardShortId)]);
        });
    });

    it("debe retransmitir 'match_started_confirmed' y actualizar estado en caché ante MatchStartedEvent", () => {
        return new Promise<void>((resolve) => {
            mockMatchCacheRepository.setMatchStatus.mockResolvedValue(undefined);

            clientSocket.on("match_started_confirmed", (data: any) => {
                expect(data.matchId).toEqual(testMatchId);
                expect(mockMatchCacheRepository.setMatchStatus).toHaveBeenCalledWith(testMatchId, MatchStatus.IN_PROGRESS);
                resolve();
            });

            globalEventBus.publish([new MatchStartedEvent(testMatchId, testBoardShortId)]);
        });
    });

    // ==========================================
    // 3. TESTS COMPLEJOS: MatchAssignedToBoardEvent
    // ==========================================

    it("MatchAssigned: debe emitir 'match_assigned' si el partido NO ha comenzado", () => {
        return new Promise<void>((resolve) => {
            mockMatchCacheRepository.getMatchStatus.mockResolvedValue(null);
            mockMatchCacheRepository.setActiveMatchForBoard.mockResolvedValue(undefined);

            clientSocket.on("match_assigned", (data: any) => {
                expect(data.matchId).toEqual(testMatchId);
                expect(mockMatchCacheRepository.setActiveMatchForBoard).toHaveBeenCalledWith(testBoardShortId, testMatchId);
                resolve();
            });

            globalEventBus.publish([new MatchAssignedToBoardEvent(testMatchId, testBoardShortId)]);
        });
    });

    it("MatchAssigned: debe emitir 'match_started_confirmed' si está IN_PROGRESS pero sin tiradas", () => {
        return new Promise<void>((resolve) => {
            mockMatchCacheRepository.getMatchStatus.mockResolvedValue(MatchStatus.IN_PROGRESS);
            mockMatchCacheRepository.getThrows.mockResolvedValue([]);

            clientSocket.on("match_started_confirmed", (data: any) => {
                expect(data.matchId).toEqual(testMatchId);
                resolve();
            });

            globalEventBus.publish([new MatchAssignedToBoardEvent(testMatchId, testBoardShortId)]);
        });
    });

    it("MatchAssigned: debe emitir 'match_restored' con el historial si está IN_PROGRESS y tiene tiradas", () => {
        return new Promise<void>((resolve) => {
            const fakeThrows = [{ turn: 1, score: 60 }, { turn: 2, score: 26 }];
            mockMatchCacheRepository.getMatchStatus.mockResolvedValue(MatchStatus.IN_PROGRESS);
            mockMatchCacheRepository.getThrows.mockResolvedValue(fakeThrows);

            clientSocket.on("match_restored", (data: any) => {
                expect(data.matchId).toEqual(testMatchId);
                expect(data.historyThrows).toEqual(fakeThrows);
                resolve();
            });

            globalEventBus.publish([new MatchAssignedToBoardEvent(testMatchId, testBoardShortId)]);
        });
    });
});
