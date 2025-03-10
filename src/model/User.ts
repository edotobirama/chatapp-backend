import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  friends: [
    {
      friendName: {type: String, required: true},
      friendId: { type: String, required: true },
      friendType: {type:String, required:true},
      chatId: { type: String, required: true },
    },
  ],
});


export const User = mongoose.model('User', userSchema);

// userModels
export const FindUserByEmail=async(email:string) =>{
  const user = await User.findOne({email:email});
  return user;
}
export const FindUserByName=async(username:string) =>{
  const user = await User.findOne({username:username});
  return user;
}
export const FindFriendsByName=async(userId:string,searchQuery:string) =>{
  try {
    const user = await User.findById(userId).select('friends');

    if (!user) {
      throw new Error('User not found');
    }

    // Filter friends whose names match the search query (case-insensitive)
    const filteredFriends = user.friends.filter((friend) =>
      friend.friendName.match(new RegExp(searchQuery, 'i'))
    );

    // Extract the required fields
    const result = filteredFriends.slice(0,5).map((friend) => ({
      friendName: friend.friendName,
      chatId: friend.chatId,
    }));

    return result;
  } catch (error) {
    console.error('Error searching friends:', error);
    throw error;
  }
}

export const FindAllFriendsByName=async(userId:string) =>{
  try {
    const user = await User.findById(userId).select('friends');

    if (!user) {
      throw new Error('User not found');
    }

    // Filter friends whose names match the search query (case-insensitive)
    const filteredFriends = user.friends;

    // Extract the required fields
    const result = filteredFriends.slice(0,5).map((friend) => ({
      friendName: friend.friendName,
      chatId: friend.chatId,
    }));

    return result;
  } catch (error) {
    console.error('Error searching friends:', error);
    throw error;
  }
}

