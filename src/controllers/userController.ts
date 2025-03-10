import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../model/User';
import dotenv from 'dotenv';
import { FindUserByEmail,FindUserByName } from '../model/User';
dotenv.config();

// Login a user
export const login = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    const mail:string = email;

    try {
      const user = await FindUserByEmail(mail);
      if (!user){
        res.status(404).json({ message: 'User not found' });
        return;
      } 
  
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid){
         res.status(401).json({ message: 'Invalid password' });
         return;
      }
      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
      }
  
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '10h' });

      const userId = user._id;
      res.status(200).json({ token, userId }); // Ensure response is returned
    } catch (error) {
      next(error); // Pass errors to the error-handling middleware
    }
  };
  

// Register a new user
export const register = async (req: Request, res: Response, next: NextFunction) => {
    const { username, email, password } = req.body;
  
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const existingEmailUser =await FindUserByEmail(email);
      if (existingEmailUser){
        res.status(404).json({ message: 'Email Not Available' });
        return;
      }
      const existingNameUser =await FindUserByName(username);
      if (existingNameUser){
        res.status(404).json({ message: 'User-Name Not Available' });
        return;
      }
      const user = new User({ username, email, password: hashedPassword ,friends:[]});
      await user.save();

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '10h' });
      const userId = user._id;
      res.status(200).json({ token, userId });
      
    } catch (error) {
      next(error); // Pass errors to the error-handling middleware
    }
  };
