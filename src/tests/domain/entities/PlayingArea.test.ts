import { describe, it, expect } from 'vitest';
import { PlayingArea, Board, BoardStatus } from "../../../domain/entities/PlayingArea.js";
import { BoardAlreadyOccupiedException, BoardDisabledException, BoardNotAvailableException, BoardNotDisabledException, BoardNotFoundException, BoardNotOccupiedException, BoardOccupiedException, PlayingAreaHasNoBoardsException } from "../../../domain/exceptions/PlayingAreaExceptions.js";

describe("PlayingArea Entity", () => {
    describe("PlayingArea", () => {
        it("should create a PlayingArea with specified number of boards", () => {
            const area = PlayingArea.create("tourn1", 4);
            expect(area.getId()).toBeDefined();
            expect(area.getTournamentId()).toBe("tourn1");
            expect(area.getShortId()).toMatch(/^S[A-Z0-9]{3}$/);
            expect(area.getBoards().length).toBe(4);
        });

        it("should add a board", () => {
            const area = PlayingArea.create("tourn1", 2);
            area.addBoard();
            expect(area.getBoards().length).toBe(3);
            expect(area.getBoards()[2].getNumber()).toBe(3);
        });

        it("should remove the last board", () => {
            const area = PlayingArea.create("tourn1", 2);
            area.removeLastBoard();
            expect(area.getBoards().length).toBe(1);
            expect(area.getBoards()[0].getNumber()).toBe(1);
        });

        it("should throw exception if trying to remove last board when none exist", () => {
            const area = PlayingArea.create("tourn1", 0);
            expect(() => area.removeLastBoard()).toThrow(PlayingAreaHasNoBoardsException);
        });

        it("should throw exception if trying to remove last board when it is occupied", () => {
            const area = PlayingArea.create("tourn1", 1);
            area.getBoards()[0].occupy("match1");
            expect(() => area.removeLastBoard()).toThrow(BoardOccupiedException);
        });

        it("should assign match to board", () => {
            const area = PlayingArea.create("tourn1", 1);
            area.assignMatchToBoard("match1", area.getBoards()[0]);
            expect(area.getBoards()[0].isOccupied()).toBe(true);
        });

        it("should release board", () => {
            const area = PlayingArea.create("tourn1", 1);
            area.assignMatchToBoard("match1", area.getBoards()[0]);
            area.releaseBoard(area.getBoards()[0]);
            expect(area.getBoards()[0].isAvailable()).toBe(true);
        });

        it("should disable and enable board", () => {
            const area = PlayingArea.create("tourn1", 1);
            area.disableBoard(area.getBoards()[0]);
            expect(area.getBoards()[0].getStatus()).toBe(BoardStatus.DISABLED);
            
            area.enableBoard(area.getBoards()[0]);
            expect(area.getBoards()[0].getStatus()).toBe(BoardStatus.AVAILABLE);
        });

        it("should find board by number", () => {
            const area = PlayingArea.create("tourn1", 2);
            const board = area.findBoardByNumber(2);
            expect(board.getNumber()).toBe(2);
        });

        it("should throw exception if board by number not found", () => {
            const area = PlayingArea.create("tourn1", 2);
            expect(() => area.findBoardByNumber(3)).toThrow(BoardNotFoundException);
        });

        it("should find board by id", () => {
            const area = PlayingArea.create("tourn1", 2);
            const boardId = area.getBoards()[0].getId();
            const board = area.findBoardById(boardId);
            expect(board.getId()).toBe(boardId);
        });

        it("should throw exception if board by id not found", () => {
            const area = PlayingArea.create("tourn1", 2);
            expect(() => area.findBoardById("invalid")).toThrow(BoardNotFoundException);
        });

        it("should find board by match id", () => {
            const area = PlayingArea.create("tourn1", 2);
            area.getBoards()[0].occupy("match1");
            const board = area.findBoardByMatchId("match1");
            expect(board.getMatchId()).toBe("match1");
        });

        it("should throw exception if board by match id not found", () => {
            const area = PlayingArea.create("tourn1", 2);
            expect(() => area.findBoardByMatchId("match1")).toThrow(BoardNotFoundException);
        });

        it("should return available boards", () => {
            const area = PlayingArea.create("tourn1", 2);
            area.getBoards()[0].disable();
            const available = area.getAvailableBoards();
            expect(available.length).toBe(1);
            expect(available[0].getNumber()).toBe(2);
        });
    });

    describe("Board", () => {
        it("should create a board", () => {
            const board = Board.create(1, "SABC");
            expect(board.getId()).toBeDefined();
            expect(board.getNumber()).toBe(1);
            expect(board.getShortId()).toBe("SABC-D001");
            expect(board.getStatus()).toBe(BoardStatus.AVAILABLE);
            expect(board.isAvailable()).toBe(true);
            expect(board.isOccupied()).toBe(false);
            expect(board.getMatchId()).toBeNull();
        });

        it("should occupy a board", () => {
            const board = Board.create(1, "SABC");
            board.occupy("match1");
            expect(board.getStatus()).toBe(BoardStatus.OCCUPIED);
            expect(board.getMatchId()).toBe("match1");
            expect(board.isOccupied()).toBe(true);
            expect(board.isAvailable()).toBe(false);
        });

        it("should throw exception if occupying an already occupied board", () => {
            const board = Board.create(1, "SABC");
            board.occupy("match1");
            expect(() => board.occupy("match2")).toThrow(BoardAlreadyOccupiedException);
        });

        it("should throw exception if occupying a disabled board", () => {
            const board = Board.create(1, "SABC");
            board.disable();
            expect(() => board.occupy("match1")).toThrow(BoardDisabledException);
        });

        it("should release a board", () => {
            const board = Board.create(1, "SABC");
            board.occupy("match1");
            board.release();
            expect(board.getStatus()).toBe(BoardStatus.AVAILABLE);
            expect(board.getMatchId()).toBeNull();
        });

        it("should throw exception if releasing a not occupied board", () => {
            const board = Board.create(1, "SABC");
            expect(() => board.release()).toThrow(BoardNotOccupiedException);
        });

        it("should disable and enable a board", () => {
            const board = Board.create(1, "SABC");
            board.disable();
            expect(board.getStatus()).toBe(BoardStatus.DISABLED);
            board.enable();
            expect(board.getStatus()).toBe(BoardStatus.AVAILABLE);
        });

        it("should throw exception if disabling an occupied board", () => {
            const board = Board.create(1, "SABC");
            board.occupy("match1");
            expect(() => board.disable()).toThrow(BoardNotAvailableException);
        });

        it("should throw exception if enabling a not disabled board", () => {
            const board = Board.create(1, "SABC");
            expect(() => board.enable()).toThrow(BoardNotDisabledException);
        });
    });
});
