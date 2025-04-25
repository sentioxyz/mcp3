import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import {fileURLToPath} from 'url';
import {ServerConfig, DEFAULT_CONFIG, getServerUrl} from './config.js';
import {setServerUrl} from './utils.js';
import {transactionStore} from './transaction-store.js';
import {Transaction} from "@mysten/sui/transactions";
import {Server} from "node:http";

// Track the server instance
let server: ReturnType<typeof express> | null = null;
let httpServer: Server | null = null;

/**
 * Start the transaction server
 * @param config Optional server configuration options
 * @returns The server URL or null if server is disabled
 */
export async function startTransactionServer(config?: Partial<ServerConfig>): Promise<string | null> {
    const serverConfig = {...DEFAULT_CONFIG, ...config};

    // If server is already running, return the URL
    if (server) {
        return getServerUrl(serverConfig);
    }

    try {
        // Create Express app
        const app = express();
        server = app;

        // Enable CORS
        app.use(cors());

        // Parse JSON bodies
        app.use(bodyParser.json());

        // Parse text bodies (for transaction bytes)
        app.use(bodyParser.text({type: 'text/plain'}));

        // Register API endpoints
        registerApiEndpoints(app);

        // Serve static files from transaction-ui
        const __dirname = path.dirname(fileURLToPath(import.meta.url));

        // Try to resolve the path to transaction-ui
        let staticPath: string;

        // Try multiple possible locations
        const possiblePaths = [
            // 1. Node modules in current working directory
            path.resolve(process.cwd(), 'node_modules/@mcp3/transaction-ui/dist'),
            // 2. Relative path for monorepo development
            path.resolve(__dirname, '../../transaction-ui/dist'),
            // 3. Node modules relative to this file
            path.resolve(__dirname, '../node_modules/@mcp3/transaction-ui/dist'),
            // 4. Parent directory's node_modules (for npm/yarn workspaces)
            path.resolve(__dirname, '../../../node_modules/@mcp3/transaction-ui/dist')
        ];

        // Find the first path that exists
        const foundPath = possiblePaths.find(p => fs.existsSync(p));

        if (foundPath) {
            staticPath = foundPath;
        } else {
            console.warn('Could not find @mcp3/transaction-ui static files in any expected location');
            // Create a minimal static directory with a placeholder
            staticPath = path.resolve(__dirname, '../static');
            fs.mkdirSync(staticPath, {recursive: true});

            // Create a simple index.html if it doesn't exist
            const indexPath = path.join(staticPath, 'index.html');
            if (!fs.existsSync(indexPath)) {
                fs.writeFileSync(indexPath, `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Transaction Server</title>
            </head>
            <body>
              <h1>Transaction Server</h1>
              <p>The transaction UI is not available. Please install @mcp3/transaction-ui.</p>
            </body>
          </html>
        `);
            }
        }

        app.use(express.static(staticPath));

        // Serve index.html for all routes not matched by API or static files
        app.get('*', (req, res) => {
            // Check if index.html exists
            const indexPath = path.join(staticPath, 'index.html');
            if (fs.existsSync(indexPath)) {
                res.sendFile(indexPath);
            } else {
                res.status(404).send('Not found: index.html is missing from the static files directory');
            }
        });

        // Set up SIGINT handler
        process.on('SIGINT', async () => {
            console.error('\nShutting down transaction server...');
            await stopTransactionServer();
        });

        // Start the server with port fallback
        return new Promise<string | null>((resolve, reject) => {
            const startServerOnPort = (port: number) => {
                const server = app.listen(port, serverConfig.address);

                server.on('listening', () => {
                    console.error(`Transaction server started on port ${port}`);
                    // Update the server config with the actual port used
                    serverConfig.port = port;
                    httpServer = server;
                    const url = getServerUrl(serverConfig);
                    setServerUrl(url);
                    resolve(url);
                });

                server.on('error', (err: any) => {
                    if (err.code === 'EADDRINUSE') {
                        const nextPort = port + 1;
                        console.error(`Port ${port} is already in use, trying port ${nextPort}...`);
                        startServerOnPort(nextPort);
                    } else {
                        console.error(`Failed to start server:`, err.message);
                        reject(err);
                    }
                });
            };

            startServerOnPort(serverConfig.port);
        });
    } catch (error) {
        console.error('Failed to start transaction server:', error);
        return null;
    }
}

/**
 * Stop the transaction server
 */
export async function stopTransactionServer(): Promise<void> {
    if (httpServer) {
        httpServer.close((err: any) => {
            if (err) {
                console.error(err)
            }
            process.exit(0);
        });
        setTimeout(() => {
            console.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 10000);
        httpServer = null;
        server = null;
    }
}

/**
 * Register API endpoints
 * @param app Express app
 */
function registerApiEndpoints(app: ReturnType<typeof express>): void {
    // POST /api/sui/tx - Register a transaction
    app.post('/api/sui/tx', async (req, res) => {
        try {
            // Get the txBytes from the request body
            const txBytes = req.body;

            if (!txBytes) {
                return res.status(400).json({
                    error: 'Transaction bytes are required'
                });
            }

            const transaction = Transaction.from(txBytes);

            // Generate a transaction ID using a hash of the transaction bytes
            const txId = await transaction.getDigest();

            // Store the transaction
            transactionStore.addTransaction(txId, transaction, txBytes);

            // Get the server URL
            const serverUrl = getServerUrl();

            return res.json({
                success: true,
                message: 'Transaction registered successfully',
                txId,
                url: `${serverUrl}/sui/tx/${txId}`
            });
        } catch (error) {
            console.error('Error registering transaction:', error);
            return res.status(500).json({
                error: 'Failed to register transaction'
            });
        }
    });

    // GET /api/sui/tx/:txId - Get a transaction
    app.get('/api/sui/tx/:txId', (req, res) => {
        try {
            const {txId} = req.params;
            const pendingTx = transactionStore.getTransaction(txId);

            if (!pendingTx) {
                return res.status(404).json({
                    error: 'Transaction not found'
                });
            }
            return res.json(pendingTx.txBytes);
        } catch (error) {
            console.error('Error fetching transaction:', error);
            return res.status(500).json({
                error: 'Failed to fetch transaction'
            });
        }
    });
}
