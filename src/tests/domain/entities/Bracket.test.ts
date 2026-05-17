import { Bracket } from '../../../domain/entities/Bracket.js';
import { RegisteredParticipant } from '../../../domain/entities/Participant.js';
import { RegistratedParticipantsEmptyException, RegistratedParticipantsNotEnoughException } from '../../../domain/exceptions/ParticipantExceptions.js';

// Helper to create participants
function createParticipants(n: number): RegisteredParticipant[] {
    const participants = [];
    for (let i = 0; i < n; i++) {
        participants.push(RegisteredParticipant.rehydrate({
            id: `p-${i}`,
            playerId: `player-${i}`,
            registeredAt: new Date(),
            checkedInAt: null,
            tournamentId: 'tournament-1',
            alias: `Alias ${i}`,
            federation: 'Federation X'
        }));
    }
    return participants;
}

async function runTests() {
    console.log('\x1b[36m%s\x1b[0m', '=== BRACKET DOMAIN ENTITY UNIT TESTS ===');

    const sizes = [2, 4, 8, 16, 32, 64, 128, 256, 512];
    let totalTests = 0;
    let passedTests = 0;

    for (const size of sizes) {
        console.log(`\n\x1b[33mTesting Power of 2: ${size}\x1b[0m`);

        // 1. Full bracket (Exact power of 2)
        try {
            totalTests++;
            const participants = createParticipants(size);
            const bracket = Bracket.createAutomatically('tournament-1', participants);
            const positions = bracket.getPositions();
            const byes = positions.filter(p => p.isBye()).length;

            console.log(`  [Full] Participants: ${size} -> Bracket Size: ${positions.length}, Byes: ${byes}`);

            if (positions.length === size && byes === 0) {
                passedTests++;
                console.log('  \x1b[32m✓ PASSED\x1b[0m');
            } else {
                console.log('  \x1b[31m✗ FAILED\x1b[0m');
            }
        } catch (e) {
            console.log(`  \x1b[31m✗ FAILED (Error): ${e}\x1b[0m`);
        }

        // 2. Partial bracket (power of 2 - 1)
        if (size > 2) {
            try {
                totalTests++;
                const partialCount = size - 1;
                const participants = createParticipants(partialCount);
                const bracket = Bracket.createAutomatically('tournament-1', participants);
                const positions = bracket.getPositions();
                const byes = positions.filter(p => p.isBye()).length;

                console.log(`  [Partial] Participants: ${partialCount} -> Bracket Size: ${positions.length}, Byes: ${byes}`);

                if (positions.length === size && byes === 1) {
                    passedTests++;
                    console.log('  \x1b[32m✓ PASSED\x1b[0m');
                } else {
                    console.log('  \x1b[31m✗ FAILED\x1b[0m');
                }
            } catch (e) {
                console.log(`  \x1b[31m✗ FAILED (Error): ${e}\x1b[0m`);
            }
        }
    }

    // 3. Testing specific Bye positioning (5 participants -> 8 positions, 3 byes)
    console.log(`\n\x1b[33mTesting Specific Bye Positioning (5 participants)\x1b[0m`);
    try {
        totalTests++;
        const participants = createParticipants(5);
        const bracket = Bracket.createAutomatically('tournament-1', participants);
        const positions = bracket.getPositions();

        // Expected Bye positions for 8-size bracket with 3 byes:
        // Seeding order: [0, 7, 3, 4, 1, 6, 2, 5]
        // With 5 players (0-4) and 3 byes (5-7):
        // Pos 1: Player 0
        // Pos 2: Bye (items[7])
        // Pos 3: Player 3
        // Pos 4: Player 4
        // Pos 5: Player 1
        // Pos 6: Bye (items[6])
        // Pos 7: Player 2
        // Pos 8: Bye (items[5])

        const isByeAt = (pos: number) => positions[pos - 1].isBye();

        console.log(`  Positions: ${positions.map(p => p.isBye() ? 'BYE' : 'PLAY').join(', ')}`);

        const correctPositions = isByeAt(2) && isByeAt(6) && isByeAt(8);

        if (correctPositions) {
            passedTests++;
            console.log('  \x1b[32m✓ PASSED (Byes are in positions 2, 6, 8)\x1b[0m');
        } else {
            console.log('  \x1b[31m✗ FAILED (Byes in wrong positions)\x1b[0m');
        }
    } catch (e) {
        console.log(`  \x1b[31m✗ FAILED (Error): ${e}\x1b[0m`);
    }

    // 4. Edge cases
    console.log(`\n\x1b[33mTesting Edge Cases (0 and 1 participants)\x1b[0m`);

    // 0 participants
    try {
        totalTests++;
        Bracket.createAutomatically('tournament-1', []);
        console.log('  [0 participants] \x1b[31m✗ FAILED (Should have thrown)\x1b[0m');
    } catch (e) {
        if (e instanceof RegistratedParticipantsEmptyException) {
            passedTests++;
            console.log('  [0 participants] \x1b[32m✓ PASSED (Threw correctly)\x1b[0m');
        } else {
            console.log(`  [0 participants] \x1b[31m✗ FAILED (Wrong error: ${e})\x1b[0m`);
        }
    }

    // 1 participant
    try {
        totalTests++;
        Bracket.createAutomatically('tournament-1', createParticipants(1));
        console.log('  [1 participant] \x1b[31m✗ FAILED (Should have thrown)\x1b[0m');
    } catch (e) {
        if (e instanceof RegistratedParticipantsNotEnoughException) {
            passedTests++;
            console.log('  [1 participant] \x1b[32m✓ PASSED (Threw correctly)\x1b[0m');
        } else {
            console.log(`  [1 participant] \x1b[31m✗ FAILED (Wrong error: ${e})\x1b[0m`);
        }
    }

    // 5. Shuffle check
    console.log(`\n\x1b[33mTesting Shuffle (Randomness)\x1b[0m`);
    totalTests++;
    const shuffleParticipants = createParticipants(8);
    const bracket1 = Bracket.createAutomatically('tournament-1', shuffleParticipants);
    const bracket2 = Bracket.createAutomatically('tournament-1', shuffleParticipants);

    const ids1 = bracket1.getPositions().filter(p => !p.isBye()).map(p => p.getParticipant().getId());
    const ids2 = bracket2.getPositions().filter(p => !p.isBye()).map(p => p.getParticipant().getId());

    console.log('  Order 1:', ids1.join(', '));
    console.log('  Order 2:', ids2.join(', '));

    if (JSON.stringify(ids1) !== JSON.stringify(ids2)) {
        passedTests++;
        console.log('  \x1b[32m✓ PASSED (Orders are different)\x1b[0m');
    } else {
        console.log('  \x1b[33m⚠ WARNING: Orders are identical (could be random luck, but unlikely for 8 items)\x1b[0m');
    }

    console.log(`\n\x1b[36m=== SUMMARY: ${passedTests}/${totalTests} PASSED ===\x1b[0m\n`);
}

runTests().catch(console.error);
