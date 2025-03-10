import { Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { AuthRequest } from '../utils/authentication';
import { FindFriendsByName,FindAllFriendsByName } from '../model/User';

dotenv.config();

export const findFriends = async (req: AuthRequest, res: Response, next: NextFunction) => {
    
    const searchQuery: string = req.query.q as string;
    
    try {
        if (!searchQuery||searchQuery=='') {
        res.status(400).json({ message: "Search query is required" });
        return;
        }
    
        const results = await FindFriendsByName(req.userId,searchQuery);
        //console.log(results);
        res.json(results);
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const findAllFriends = async (req: AuthRequest, res: Response, next: NextFunction) => {
    
    try {
        const results = await FindAllFriendsByName(req.userId);
        //console.log(results);
        res.json(results);
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
