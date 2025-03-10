import express from 'express';
import { login,register  } from '../controllers/userController';

const router = express.Router();

// User routes

router.post('/auth/login', login);
router.post('/auth/register', register);

export default router;