import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg'; // Importamos el adaptador
import pg from 'pg'; // Importamos el driver de Postgres
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto'; // Mejor usar la importación nativa
import * as dotenv from 'dotenv';

dotenv.config();

// 1. Configuramos la conexión manualmente para el script
const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

// 2. Pasamos el adaptador al cliente
const prisma = new PrismaClient({ adapter });

async function main() {
    const adminEmail = 'admin@a-darts.com';
    const clearPassword = '123456';

    const hashedPassword = await bcrypt.hash(clearPassword, 10);

    console.log('--- Seeding Database ---');

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            id: randomUUID(),
            email: adminEmail,
            password: hashedPassword,
            alias: 'SuperAdmin',
            role: 'ADMIN',
            status: 'ACTIVE',
            registeredAt: new Date(),
        },
    });

    console.log('✅ Admin user created/verified:');
    console.log(`   Email: ${admin.email}`);
    console.log('------------------------');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end(); // Cerramos el pool de conexiones
    });
