import { BoardAlreadyOccupiedException, BoardDisabledException, BoardNotAvailableException, BoardNotDisabledException, BoardNotFoundException, BoardNotOccupiedException, BoardOccupiedException, PlayingAreaHasNoBoardsException, MatchAlreadyAssignedToBoardException } from "../exceptions/PlayingAreaExceptions.js";

export enum BoardStatus {
    AVAILABLE = 'AVAILABLE',
    OCCUPIED = 'OCCUPIED',
    DISABLED = 'DISABLED',
}


export class PlayingArea {
    private readonly id: string;
    private readonly shortId: string;
    private tournamentId: string;
    private boards: Board[];

    constructor(
        id: string,
        shortId: string,
        tournamentId: string,
        boards: Board[],
    ) {
        this.id = id;
        this.shortId = shortId;
        this.tournamentId = tournamentId;
        this.boards = boards;
    }


    // --------------------------------------------------------------------
    // FACTORY METHOD
    // --------------------------------------------------------------------
    public static create(tournamentId: string, numbBoards: number): PlayingArea {
        const shortId = this.generateShortId();
        const boards = Array.from({ length: numbBoards }, (_, i) => Board.create(i + 1, shortId));
        return new PlayingArea(
            crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
            shortId,
            tournamentId,
            boards,
        );
    }

    private static generateShortId(): string {
        const randomPart = crypto.randomUUID().split('-')[0].toUpperCase();
        return "S" + randomPart.substring(0, 3);
    }


    // --------------------------------------------------------------------
    // DOMAIN METHODS
    // --------------------------------------------------------------------
    public addBoard(): void {
        this.boards.push(Board.create(this.boards.length + 1, this.shortId));
    }

    public removeLastBoard(): void {
        if (this.boards.length === 0) {
            throw new PlayingAreaHasNoBoardsException();
        }

        const lastBoard = this.boards[this.boards.length - 1];
        if (lastBoard.isOccupied()) {
            throw new BoardOccupiedException();
        }

        this.boards.pop();
    }

    public assignMatchToBoard(matchId: string, board: Board): void {
        board.occupy(matchId);
    }

    public releaseBoard(board: Board): void {
        board.release();
    }

    public disableBoard(board: Board): void {
        board.disable();
    }

    public enableBoard(board: Board): void {
        board.enable();
    }

    public getAvailableBoards(): Board[] {
        return this.boards.filter(b => b.isAvailable());
    }


    // --------------------------------------------------------------------
    // HELPER METHODS
    // --------------------------------------------------------------------
    public findBoardByNumber(boardNumber: number): Board {
        const board = this.boards.find(b => b.getNumber() === boardNumber);
        if (!board) {
            throw new BoardNotFoundException();
        }
        return board;
    }

    public findBoardById(id: string): Board {
        const board = this.boards.find(b => b.getId() === id);
        if (!board) {
            throw new BoardNotFoundException();
        }
        return board;
    }

    public findBoardByMatchId(matchId: string): Board {
        const board = this.boards.find(b => b.getMatchId() === matchId);
        if (!board) {
            throw new BoardNotFoundException();
        }
        return board;
    }


    // --------------------------------------------------------------------
    // GETTERS
    // --------------------------------------------------------------------
    public getId(): string {
        return this.id;
    }

    public getShortId(): string {
        return this.shortId;
    }

    public getTournamentId(): string {
        return this.tournamentId;
    }

    public getBoards(): Board[] {
        return this.boards;
    }
}



export class Board {
    private readonly id: string;
    private readonly shortId: string;
    private readonly number: number;
    private status: BoardStatus;
    private matchId: string | null;

    constructor(
        id: string,
        shortId: string,
        number: number,
        status: BoardStatus,
        matchId: string | null,
    ) {
        this.id = id;
        this.shortId = shortId;
        this.number = number;
        this.status = status;
        this.matchId = matchId;
    }


    // --------------------------------------------------------------------
    // FACTORY METHOD
    // --------------------------------------------------------------------
    public static create(number: number, areaShortId: string): Board {
        return new Board(
            crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
            this.generateShortId(number, areaShortId),
            number,
            BoardStatus.AVAILABLE,
            null,
        );
    }


    private static generateShortId(number: number, areaShortId: string): string {
        const paddedNumber = number.toString().padStart(3, '0');
        return `${areaShortId}-D${paddedNumber}`;
    }


    // --------------------------------------------------------------------
    // DOMAIN METHODS
    // --------------------------------------------------------------------
    public occupy(matchId: string): void {
        if (this.status === BoardStatus.OCCUPIED) {
            throw new BoardAlreadyOccupiedException();
        }
        if (this.status === BoardStatus.DISABLED) {
            throw new BoardDisabledException();
        }

        this.status = BoardStatus.OCCUPIED;
        this.matchId = matchId;
    }

    public release(): void {
        if (this.status !== BoardStatus.OCCUPIED) {
            throw new BoardNotOccupiedException();
        }

        this.status = BoardStatus.AVAILABLE;
        this.matchId = null;
    }

    public disable(): void {
        if (this.status === BoardStatus.OCCUPIED) {
            throw new BoardNotAvailableException();
        }

        this.status = BoardStatus.DISABLED;
    }

    public enable(): void {
        if (this.status !== BoardStatus.DISABLED) {
            throw new BoardNotDisabledException();
        }
        this.status = BoardStatus.AVAILABLE;
    }

    public isAvailable(): boolean {
        return this.status === BoardStatus.AVAILABLE;
    }

    public isOccupied(): boolean {
        return this.status === BoardStatus.OCCUPIED;
    }


    // --------------------------------------------------------------------
    // GETTERS
    // --------------------------------------------------------------------
    public getId(): string {
        return this.id;
    }

    public getShortId(): string {
        return this.shortId;
    }

    public getNumber(): number {
        return this.number;
    }

    public getStatus(): BoardStatus {
        return this.status;
    }

    public getMatchId(): string | null {
        return this.matchId;
    }
}
