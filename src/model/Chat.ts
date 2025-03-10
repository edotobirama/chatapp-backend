import mongoose from 'mongoose';

interface IMessage{
    message:string;
    senderId:string;
}

const chatSchema = new mongoose.Schema({
  user1: { type: String, required: true},
  user2: { type: String, required: true},
  messages: [
    {
      message: {type: String, required: true},
      senderId: { type: String, required: true },
    }
  ],
});



export const Chat = mongoose.model('Chat', chatSchema);

// userModels
export const getMessagesByChatId=async(id:string) =>{
  const messages = await Chat.findById(id).select('messages');
  return messages?.messages;
}
export const FindChatIdByUsers=async(user1:string,user2:string) =>{
  const chatId = await Chat.findOne({user1,user2}).select(
    '_id'
  );
  if(chatId)return chatId._id;
  return null;
}
export const FindUsersIdByChat=async(id:string) =>{
    try {
        const chat = await Chat.findById(id).select('user1 user2');
        if (!chat) {
            throw new Error('Chat not found');
        }
        // Respond with user1 and user2
        return {
            user1: chat.user1,
            user2: chat.user2,
        };
    }
    catch(error){
        console.log(error);
        throw error;
    }
  }
export const insertNewMessage=async(chatId:string,newMessage:IMessage) =>{
  try {
    console.log(chatId,newMessage);
    const chat = await Chat.findById(chatId).select('messages');
    if(chat){
        chat.messages.push(newMessage)
        await chat.save();
        console.log('Message saved');
    }
    else throw new Error('Chat not found');
    }
    catch (error){
        console.log(error);
        throw error;
    }
}

export const createNewChat=async(user1:string,user2:string) =>{
  try {
    const chat = await new Chat({user1,user2}).save();
    return chat._id;
  } catch (error) {
    console.error('Error searching friends:', error);
    throw error;
  }
}