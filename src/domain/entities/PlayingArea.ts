import { BoardAlreadyOccupiedException, BoardDisabledException, BoardNotAvailableException, BoardNotDisabledException, BoardNotFoundException, BoardNotOccupiedException, BoardOccupiedException, PlayingAreaHasNoBoardsException, MatchAlreadyAssignedToBoardException } from "../exceptions/PlayingAreaExceptions.js";

export enum BoardStatus {
    AVAILABLE = 'AVAILABLE',
    OCCUPIED = 'OCCUPIED',
    DISABLED = 'DISABLED',
}


export class PlayingArea {
    private readonly id: string;
    private tournamentId: string;
    private boards: Board[];

    constructor(
        id: string,
        tournamentId: string,
        boards: Board[],
    ) {
        this.id = id;
        this.tournamentId = tournamentId;
        this.boards = boards;
    }


    // --------------------------------------------------------------------
    // FACTORY METHOD
    // --------------------------------------------------------------------
    public static create(tournamentId: string, numbBoards: number): PlayingArea {
        const boards = Array.from({ length: numbBoards }, (_, i) => Board.create(i + 1));
        return new PlayingArea(
            crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
            tournamentId,
            boards,
        );
    }


    // --------------------------------------------------------------------
    // FACTORY METHOD
    // --------------------------------------------------------------------
    public addBoard(): void {
        this.boards.push(Board.create(this.boards.length + 1));
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

    public assignMatchToBoard(matchId: string, boardNumber: number): void {
        const isMatchAssigned = this.boards.some(b => b.getMatchId() === matchId);
        if (isMatchAssigned) {
            throw new MatchAlreadyAssignedToBoardException();
        }

        const board = this.findBoardByNumber(boardNumber);
        board.occupy(matchId);
    }

    public reassignMatchToBoard(matchId: string, boardNumber: number): void {
        const board = this.findBoardByNumber(boardNumber);
        board.occupy(matchId);
    }

    public releaseBoard(boardNumber: number): void {
        const board = this.findBoardByNumber(boardNumber);
        board.release();
    }

    public disableBoard(boardNumber: number): void {
        const board = this.findBoardByNumber(boardNumber);
        board.disable();
    }

    public enableBoard(boardNumber: number): void {
        const board = this.findBoardByNumber(boardNumber);
        board.enable();
    }

    public getAvailableBoards(): Board[] {
        return this.boards.filter(b => b.isAvailable());
    }


    // --------------------------------------------------------------------
    // HELPER METHODS
    // --------------------------------------------------------------------
    private findBoardByNumber(boardNumber: number): Board {
        const board = this.boards.find(b => b.getNumber() === boardNumber);
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

    public getTournamentId(): string {
        return this.tournamentId;
    }

    public getBoards(): Board[] {
        return this.boards;
    }
}



export class Board {
    private readonly number: number;
    private status: BoardStatus;
    private matchId: string | null;

    constructor(
        number: number,
        status: BoardStatus,
        matchId: string | null,
    ) {
        this.number = number;
        this.status = status;
        this.matchId = matchId;
    }


    // --------------------------------------------------------------------
    // FACTORY METHOD
    // --------------------------------------------------------------------
    public static create(number: number): Board {
        return new Board(
            number,
            BoardStatus.AVAILABLE,
            null,
        );
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