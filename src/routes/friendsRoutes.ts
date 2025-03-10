import express from 'express';
import { protect } from '../utils/authentication';
import { findFriends,findAllFriends } from '../controllers/friendsController';
const router = express.Router();

// User routes

router.get('/search',protect, findFriends);
router.get('/',protect, findAllFriends);

export default router;