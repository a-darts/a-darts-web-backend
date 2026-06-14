import { describe, it, expect, vi, beforeEach } from "vitest";
import { createServer } from "node:http";

describe("SocketServer Unit Tests", () => {
    let mockServer: any;
    let mockController: any;

    beforeEach(() => {
        vi.resetModules();
        mockServer = createServer();
        mockController = {
            handleConnection: vi.fn(),
        };
    });

    it("debe lanzar un error si se intenta obtener el servidor antes de inicializarlo", async () => {
        const { getSocketServer } = await import("../../../infrastructure/websockets/SocketServer.js");

        expect(() => getSocketServer()).toThrow("Socket.io has not been initialized.");
    });

    it("debe retornar la instancia del servidor una vez inicializado", async () => {
        const { initializeSocketServer, getSocketServer } = await import("../../../infrastructure/websockets/SocketServer.js");

        const ioInstance = initializeSocketServer(mockServer, mockController);
        const retrievedInstance = getSocketServer();

        expect(retrievedInstance).toBe(ioInstance);
    });

    it("debe parsear correctamente múltiples orígenes CORS desde las variables de entorno", async () => {
        vi.stubEnv("FRONTEND_URL", "https://a-darts.com");

        const { initializeSocketServer } = await import("../../../infrastructure/websockets/SocketServer.js");
        const ioInstance = initializeSocketServer(mockServer, mockController);

        // Accedemos a las opciones de configuración internas que generó Socket.io
        const corsOptions = (ioInstance as any).opts.cors;

        expect(corsOptions.origin).toEqual([
            "https://a-darts.com",
        ]);
        expect(corsOptions.credentials).toBe(true);

        vi.unstubAllEnvs();
    });
});
