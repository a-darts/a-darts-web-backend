import { Request, Response } from 'express';
import { GetTournamentResults } from '../../../application/services/tournament/GetTournamentResults.js';

export class TournamentResultController {
    constructor(
        private readonly getTournamentResults: GetTournamentResults,
    ) { }

    public getResults = async (req: Request, res: Response): Promise<void> => {
        try {
            const tournamentId = req.params.id as string;
            const results = await this.getTournamentResults.execute(tournamentId);
            res.status(200).json(results);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    };
}
