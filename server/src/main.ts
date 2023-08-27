import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan'
import path from 'path'
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

app.use(morgan("combined"));
app.use(express.static(path.join(__dirname, "..", "client")));

app.use('/api', donationRoutes);

app.get("/*", (req, res) => {
    res.sendFile(
      path.join(__dirname, "..", "client", "index.html")
    );
  });


export default app