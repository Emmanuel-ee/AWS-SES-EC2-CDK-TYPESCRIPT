import express from 'express';
// import { donate } from '../controllers/donationController';
import { donate } from '../controllers/donationController';

const router = express.Router();

router.post('/donate', donate);

export default router;
