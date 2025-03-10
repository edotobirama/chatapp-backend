import express from 'express';
import { protectChat } from '../utils/authentication';
import { getRecipientName,getMessages } from '../controllers/chatController';

const router = express.Router();

// Chat routes
router.get('/get-recipient-name/:chatId',protectChat ,getRecipientName);
router.get('/get-messages/:chatId',protectChat,getMessages)
export default router;