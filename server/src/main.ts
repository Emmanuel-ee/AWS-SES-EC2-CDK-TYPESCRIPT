import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import donationRoutes from './routes/donationRoutes';

const app = express();

app.use(bodyParser.json());

// const corsOptions = {
//   origin: 'http://127.0.0.1:5500', 
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//   credentials: true,
//   optionsSuccessStatus: 204,
// };

// app.use(cors(corsOptions));
app.use(cors())

app.use('/api', donationRoutes);


export default app