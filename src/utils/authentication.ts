import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { FindUsersIdByChat } from '../model/Chat';


export interface AuthRequest extends Request {
  userId?: any;
}

//verifies jwt token and adds userId to request
export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    
    const token = req.header('Authorization')?.split(' ')[1];
    
    if (!token){
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
    } 
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    req.userId = decoded.userId;
    next();  
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export const protectChat = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.split(' ')[1];
    
    if (!token){
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
    } 
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    req.userId = decoded.userId;
    let chatId = req.params.chatId;
    let users = await FindUsersIdByChat(chatId);
    if(users.user1!==req.userId && users.user2!==req.userId){
        res.status(401).json({message:"unauthorized user not allowed to access this chat"});
        return;
    }
    
    next();  
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};


