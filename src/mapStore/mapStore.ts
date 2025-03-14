
import { Server } from 'socket.io';
import { createNewChat, FindChatIdByUsers } from '../model/Chat';

// Define the types for UID and SocketID
export type UID = string;
export type SocketID = string;
export type ActiveUsersNumber = {
  size: number;
};


export const activeUsersNumber: ActiveUsersNumber = { size: 0 };

// Create two maps for bidirectional mapping
export const uidToSocketIdMap = new Map<UID, SocketID>();
export const socketIdToUidMap = new Map<SocketID, UID>();


// Function to add a mapping
export function addMapping(uid: UID, socketId: SocketID): void {
  uidToSocketIdMap.set(uid, socketId);
  socketIdToUidMap.set(socketId, uid);
}

// Function to remove a mapping by UID
export function removeMappingByUid(uid: UID): void {
  const socketId = uidToSocketIdMap.get(uid);
  if (socketId) {
    uidToSocketIdMap.delete(uid);
    socketIdToUidMap.delete(socketId);
  }
}

// Function to remove a mapping by SocketID
export function removeMappingBySocketId(socketId: SocketID): void {
  socketIdToUidMap.delete(socketId);
  uidToSocketIdMap.delete(socketId);
}

// Function to get SocketID by UID
export function getSocketIdByUid(uid: UID): SocketID | undefined {
  return uidToSocketIdMap.get(uid);
}

// Function to get UID by SocketID
export function getUidBySocketId(socketId: SocketID): UID | undefined {
  return socketIdToUidMap.get(socketId);
}

// Function to check if a UID exists in the mapping
export function hasUid(uid: UID): boolean {
  return uidToSocketIdMap.has(uid);
}

// Function to check if a SocketID exists in the mapping
export function hasSocketId(socketId: SocketID): boolean {
  return socketIdToUidMap.has(socketId);
}

export function getAllSocketIds(): SocketID[] {
  return Array.from(socketIdToUidMap.keys()).concat(Array.from(socketIdToUidMap.values()));
}

export function getAllUids(): UID[] {
  return Array.from(uidToSocketIdMap.keys()).concat(Array.from(uidToSocketIdMap.values()));
}

// Function to clear all mappings
export function clearMappings(): void {
  uidToSocketIdMap.clear();
  socketIdToUidMap.clear();
}
  
class QueueNode<T> {
  constructor(public value: T, public next: QueueNode<T> | null = null) {}
}

class Queue<T extends { userId: string; hashedArray: string }> {
  private front: QueueNode<T> | null = null;
  private rear: QueueNode<T> | null = null;
  private _size: number = 0;

  // Lock mechanism
  private lock: Promise<void> = Promise.resolve();

  // Socket.io server instance
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  // Add an element to the end of the queue (enqueue)
  enqueue(element: T): void {
    const newNode = new QueueNode(element);

    if (this.rear === null) {
      this.front = newNode;
      this.rear = newNode;
    } else {
      this.rear.next = newNode;
      this.rear = newNode;
    }

    this._size++;
  }

  // Remove and return an element from the queue based on hashedArray
  dequeue(element: string): T | undefined {
    if (this.front === null) {
      return undefined; // Queue is empty
    }

    let first: QueueNode<T> | null = this.front;
    let second: QueueNode<T> | null = null;

    while (first !== null && first.value.hashedArray !== element) {
      second = first;
      first = first.next;
    }

    if (first === null) {
      return undefined; // Element not found
    }

    if (second === null) {
      // Removing the first element
      this.front = this.front.next;
      if (this.front === null) {
        this.rear = null;
      }
    } else {
      second.next = first.next;
      if (first === this.rear) {
        this.rear = second;
      }
    }

    this._size--;
    return first.value; // Return the removed element
  }

  // Check if the queue is empty
  isEmpty(): boolean {
    return this._size === 0;
  }

  // Get the number of elements in the queue
  size(): number {
    return this._size;
  }

  // Clear the queue
  clear(): void {
    this.front = null;
    this.rear = null;
    this._size = 0;
  }

  // Print the queue (for debugging)
  print(): void {
    let current = this.front;
    const items: T[] = [];

    while (current !== null) {
      items.push(current.value);
      current = current.next;
    }

    console.log(items);
  }

  // Acquire the lock and return a function to release it
  private async acquireLock(): Promise<() => void> {
    await this.lock; // Wait for the current lock to be released

    // Create a new lock and return a function to release it
    let releaseLock: () => void;
    this.lock = new Promise((resolve) => (releaseLock = resolve));

    return releaseLock!;
  }

  // Process a match request (thread-safe)
  async processMatchRequest(hashedArray: string, userId: string): Promise<void> {
    const releaseLock = await this.acquireLock(); // Acquire the lock

    try {
      // Check if there is a matching user in the queue
      const dequeueRes = this.dequeue(hashedArray);
      let socket1=getUidBySocketId(userId);
      if (!dequeueRes) {
        // No match found, add the user to the queue
        console.log('No match');
        this.enqueue({ userId, hashedArray } as T); // Use type assertion
        if(socket1)
        this.io.to(socket1).emit('match-status', { status: 'waiting' }); // Notify the user
      }
      else if(dequeueRes.userId===userId){
        if(socket1)
        this.io.to(socket1).emit('match-status', { status: 'cancelled' }); // Notify the user
      }
       else {
        // Match found
        console.log('Match');
        let user1 = userId;
        let user2 = dequeueRes.userId;
        let v ="";
        if(user1>user2){
          v = user1;
          user1= user2;
          user2 = v;
        }
        // get or create a new chat users
        let chatId = await FindChatIdByUsers(user1,user2);
        if(!chatId){
          chatId = await createNewChat(user1,user2);
        }
        // Notify both users
        let socket1=getUidBySocketId(user1);
        if(socket1)
          this.io.to(socket1).emit('match-status', { status: 'matched', chatId: chatId });
        let socket2=getUidBySocketId(user2);
        if(socket2)
          this.io.to(socket2).emit('match-status', { status: 'matched', chatId: chatId });
      }
    } finally {
      releaseLock(); // Release the lock
    }
  }
}

export let connectQueue: Queue<{ userId: string; hashedArray: string; socketId: string }>;

export function initializeQueue(io: Server): void {
  connectQueue = new Queue(io);
}

  