import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { movimientosRouter } from './routes/movimientos';
import { dashboardRouter } from './routes/dashboard';
import { analisisRouter } from './routes/analisis';

const app = express();

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/movimientos', movimientosRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/analisis', analisisRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

export { app };
