import { Request, Response } from 'express';
import { AuthRequest } from '../utils/authentication';
import { insertNewMessage,getMessagesByChatId } from '../model/Chat';
import { User } from '../model/User';
import { Chat } from '../model/Chat';
import { hasSocketId } from '../mapStore/mapStore';

export const sendMessage = async (req: Request, res: Response) => {
  const { senderId, message } = req.body;
  try {
    // Save message to database (optional)
    const { chatId } = req.params;
    insertNewMessage(chatId,{message,senderId});
    res.status(200).json({ message: 'Message sent' });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const sendMessageViaSocket = async (chatId :string,senderId: string, message:string) => {
  try {
    // Save message to database (optional)
    await insertNewMessage(chatId,{message,senderId});
  } catch (error) {
    console.error('Send message error:', error);
  }
};

export const getMessages = async (req: Request, res: Response)=>{
  try{
    const {chatId} = req.params;
    const messages = await getMessagesByChatId(chatId);
    res.status(200).json(messages);
  }
  catch(error){
    res.status(500).json({message:"Internal Server Error"});
  }
}



export const removeFriendFromChat = async(req: Request, res: Response)=>{
  try {
    const { chatId } = req.params; // Extract chatId from the request body

    // Validate input
    if (!chatId) {
        res.status(400).json({ message: 'chatId is required' });
        return;
    }

    // Find the chat by chatId
    const chat = await Chat.findById(chatId);
    if (!chat) {
        res.status(404).json({ message: 'Chat not found' });
        return;
    }

    // Find user1 and user2 by their usernames
    const user1 = await User.findById({ _id : chat.user1 });
    const user2 = await User.findById({ _id : chat.user2 });

    if (!user1 || !user2) {
        res.status(404).json({ message: 'One or both users not found' });
        return;
    }
    
    // Add user2 to user1's friends array
    user1.friends.pull({friendId: user2._id});
    await user1.save();
 
    // Add user1 to user2's friends array
    user2.friends.pull({ friendId: user1._id });
    await user2.save();
    // Respond with success
    res.status(200).json({ message: 'Friends removed successfully', chatId: chat._id });
  } catch (error) {
      console.error('Error removing friends:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
}

export const getRecipientName = async(req: AuthRequest, res: Response)=>{
  try {
    const { chatId} = req.params;
    
    const chat = await Chat.findById(chatId).select('user1 user2');
    if(!chat){
      res.status(404).json({message:"Chat not found"});
      return;
    }
    const recipientId = chat.user1===req.userId ? chat.user2 :chat.user1;
    const is_online = hasSocketId(recipientId);
    const recipient = await User.findById(recipientId).select('');
    if(!recipient){
      res.status(404).json({message:"Recipient not found"});
      return;
    }
    let v='Not Friend';
    for(let f of recipient?.friends){
      if((f.friendId.toString())==req.userId){
        v = f.friendType;
        break;
      }
    }
    res.status(200).json({
      recipientName:recipient?.username,
      isOnline: is_online,
      isFriend: v
    });
  }
  catch(error){
    console.error('Error getting recipient name:', error);
    res.status(500).json({message:"Internal server error"});
  }
}