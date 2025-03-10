import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import {
  activeUsersNumber,
  addMapping,
  getUidBySocketId,
  removeMappingBySocketId,
  getAllSocketIds,
  getAllUids,
  initializeQueue,
  connectQueue,
  getSocketIdByUid,
} from '../mapStore/mapStore';
import { FindUsersIdByChat } from '../model/Chat';
import { User } from '../model/User';
import { sendMessageViaSocket } from '../controllers/chatController';


export const initializeSocket = (io: Server) => {
  // Initialize the queue with the io instance
  initializeQueue(io);

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token; // Retrieve token from auth field
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      addMapping(socket.id, decoded.userId);
      next();
    } catch (error) {
      console.error('Socket authentication failed:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    activeUsersNumber.size += 1;
    io.emit('activeUsersCount', activeUsersNumber.size);
    console.log(activeUsersNumber.size);
    let v = getAllSocketIds();
    console.log(v);
    let u = getAllUids();
    console.log(u);

    // Listen for match requests
    socket.on('reqActiveUsersCount', () => {
      io.to(socket.id).emit('activeUsersCount', activeUsersNumber.size);
    });
    socket.on('request-match', async (data: { userId: string; hashedArray: string }) => {
      const { userId, hashedArray } = data;
      console.log('Match req Received');
      await connectQueue.processMatchRequest(hashedArray, userId);
    });
    
    socket.on('add-friend', async (data)=>{
      const {chatId} = data;
      console.log('Add friend');
      try{
        const currentUid = getSocketIdByUid(socket.id);
        const {user1,user2} = await FindUsersIdByChat(chatId);
        const {user1:recipientId,user2:senderId} = (currentUid=== user1) ? {user1:user2,user2:user1} : {user1:user1,user2:user2};
        const userObj1 = await User.findById({ _id : recipientId });
        const userObj2 = await User.findById({ _id : senderId });
      
        if (!userObj1 || !userObj2) {
            return;
        }
          
          // Add user2 to user1's friends array
        userObj1.friends.push({
            friendName: userObj2.username,
            friendId: userObj2._id.toString(),
            friendType: 'received',
            chatId: chatId, // Store the chatId for the new chat
        });
        await userObj1.save();
      
          // Add user1 to user2's friends array
        userObj2.friends.push({
          friendName: userObj1.username,
          friendId: userObj1._id.toString(),
          friendType: 'requested',
          chatId: chatId, // Store the chatId for the new chat
        });
        await userObj2.save();
        const recipientSocket= getUidBySocketId(recipientId);
        if(recipientSocket){
          socket.to(recipientSocket).emit('friend-request-recieved');
        }
      }
      catch(error){
        console.log(error);
      }
    })

    socket.on('accept-friend-request', async (data)=>{
      const {chatId} = data;
      console.log('Friend request accepted');
      try{
        const currentUid = getSocketIdByUid(socket.id);
        const {user1,user2} = await FindUsersIdByChat(chatId);
        const {user1:recipientId,user2:senderId} = (currentUid=== user1) ? {user1:user2,user2:user1} : {user1:user1,user2:user2};
        const userObj1 = await User.findById({ _id : recipientId });
        const userObj2 = await User.findById({ _id : senderId });
      
        if (!userObj1 || !userObj2) {
            return;
        }
          
          // Add user2 to user1's friends array
          await User.updateOne(
            { _id: recipientId, 'friends.friendId': senderId }, // Find the user and the specific friend
            { $set: { 'friends.$.friendType': 'Friends' } } // Update the `friendType` for the matched friend
          );
          await User.updateOne(
            { _id: senderId, 'friends.friendId': recipientId }, // Find the user and the specific friend
            { $set: { 'friends.$.friendType': 'Friends' } } // Update the `friendType` for the matched friend
          );
        const recipientSocket= getUidBySocketId(recipientId);
        if(recipientSocket){
          socket.to(recipientSocket).emit('friend-request-accepted');
        }
      }
      catch(error){
        console.log(error);
      }
    })

    socket.on('remove-friend', async (data)=>{
      const {chatId} = data;
      console.log('remove friend');
      try{
        const currentUid = getSocketIdByUid(socket.id);
        const {user1,user2} = await FindUsersIdByChat(chatId);
        const {user1:recipientId,user2:senderId} = (currentUid=== user1) ? {user1:user2,user2:user1} : {user1:user1,user2:user2};
        const userObj1 = await User.findById({ _id : recipientId });
        const userObj2 = await User.findById({ _id : senderId });
      
        if (!userObj1 || !userObj2) {
            return;
        }
          
          // Add user2 to user1's friends array
          await User.updateMany(
            { _id: recipientId },
            { $pull: { friends: { friendId: senderId } } } // Remove sender from recipient's friends list
          );
          
          await User.updateMany(
            { _id: senderId },
            { $pull: { friends: { friendId: recipientId } } } // Remove recipient from sender's friends list
          );
        
        const recipientSocket= getUidBySocketId(recipientId);
        if(recipientSocket){
          socket.to(recipientSocket).emit('friend-removed');
        }
      }
      catch(error){
        console.log(error);
      }
    })
    socket.on('cancel-friend-request', async (data)=>{
      const {chatId} = data;
      console.log('cancel friend request');
      try{
        const currentUid = getSocketIdByUid(socket.id);
        const {user1,user2} = await FindUsersIdByChat(chatId);
        const {user1:recipientId,user2:senderId} = (currentUid=== user1) ? {user1:user2,user2:user1} : {user1:user1,user2:user2};
        const userObj1 = await User.findById({ _id : recipientId });
        const userObj2 = await User.findById({ _id : senderId });
      
        if (!userObj1 || !userObj2) {
            return;
        }
          
          // Add user2 to user1's friends array
          await User.updateMany(
            { _id: recipientId },
            { $pull: { friends: { friendId: senderId } } } // Remove sender from recipient's friends list
          );
          
          await User.updateMany(
            { _id: senderId },
            { $pull: { friends: { friendId: recipientId } } } // Remove recipient from sender's friends list
          );
        
        const recipientSocket= getUidBySocketId(recipientId);
        if(recipientSocket){
          socket.to(recipientSocket).emit('friend-request-cancelled');
        }
      }
      catch(error){
        console.log(error);
      }
    })
    

    // Listen for messages
    socket.on('send-message', async (data) => {
      const { chatId, message } = data;
      const {user1,user2} = await FindUsersIdByChat(chatId);
      const currentUid = getSocketIdByUid(socket.id);
      const {user1:recipientId,user2:senderId} = (currentUid=== user1) ? {user1:user2,user2:user1} : {user1:user1,user2:user2};
      sendMessageViaSocket(chatId,senderId,message);
      const recipientSocket= getUidBySocketId(recipientId);
      if(recipientSocket)
      socket.to(recipientSocket).emit('receive-message', { senderId: senderId, message });
    });

    //PAGE Reload
    socket.on('page-reload', () => {
      console.log('Page reload detected for socket:', socket.id);
      removeMappingBySocketId(socket.id);
    });

    // Listen for disconnection
    socket.on('disconnect', () => {
      removeMappingBySocketId(socket.id);
      activeUsersNumber.size -= 1;
      io.emit('activeUsersCount', activeUsersNumber.size);
      console.log('User disconnected:', socket.id);
    });
  });
};