export interface IMatchCacheRepository {
    addThrow(matchId: string, throwData: any): Promise<void>;
    removeLastThrow(matchId: string): Promise<any | null>;
    getThrows(matchId: string): Promise<any[]>;
    setActiveMatchForBoard(boardShortId: string, matchId: string): Promise<void>;
    getActiveMatchForBoard(boardShortId: string): Promise<string | null>;
    getLastThrow(matchId: string): Promise<any | null>;
    clearMatch(matchId: string, boardShortId?: string): Promise<void>;
    clearBoardActiveMatch(boardShortId: string): Promise<void>;
    rebuildHistory(matchId: string, newHistory: any[]): Promise<void>;
    setMatchStatus(matchId: string, status: string): Promise<void>;
    getMatchStatus(matchId: string): Promise<string | null>;
}
