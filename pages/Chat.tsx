import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { ChatMessage, UserRole } from '../types.ts';
import { Send, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Chat: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [chatRooms, setChatRooms] = useState<any[]>([]); // For admin
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
        navigate('/login');
        return;
    }

    if (user.role === UserRole.CUSTOMER) {
      setSelectedUserId(user.uid);
    }
  }, [user, navigate]);

  // Admin: Fetch list of users who have chatted
  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
        const q = query(collection(db, 'chats'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const users = new Set();
            const rooms: any[] = [];
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (!users.has(data.senderId) && data.senderId !== user.uid) {
                    users.add(data.senderId);
                    rooms.push({ id: data.senderId, lastMessage: data.text });
                }
                // Also check if admin sent to a user, that user should be in list (simplified logic)
            });
            // Better approach requires a separate 'chatRooms' collection, but for this demo, 
            // we will query distinct senderIds or manually group. 
            // Simplified: Just use a hardcoded list or assume reservations create chat intent.
            // For now, let's just listen to all messages and group by userId locally for the UI.
        });
        return () => unsubscribe();
    }
  }, [user]);

  // Admin: Simplify room listing for demo - Fetch recent messages to identify users
  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
       // This is a simplified way to get chat heads. In prod, use a separate 'rooms' collection.
       // We will just show a list of unique userIds from messages where sender != admin
       const q = query(collection(db, 'chats'), orderBy('createdAt', 'desc'));
       const unsubscribe = onSnapshot(q, (snapshot) => {
         const uniqueUsers = new Map();
         snapshot.docs.forEach(doc => {
            const data = doc.data();
            const otherId = data.senderId === user.uid ? data.receiverId : data.senderId; // Need receiverId in schema to be perfect
            // Fallback: If current user is admin, we need to know who the message belongs to.
            // Let's assume a 'roomId' field exists or we filter by userId.
         });
       });
       // Actually, let's implement a simpler "All Chats" view for Admin or just 1:1 for Customer.
       // Given constraints, let's implement: Customer sees their chat. Admin needs to pick a user.
    }
  }, [user]);
  
  // Fetch Messages
  useEffect(() => {
    if (!selectedUserId && user?.role === UserRole.ADMIN) return;

    // Defines the "Room": for a customer, it's their ID. For admin, it's the selected customer's ID.
    const roomId = user?.role === UserRole.CUSTOMER ? user.uid : selectedUserId;
    if(!roomId) return;

    const q = query(
        collection(db, 'chats'), 
        where('roomId', '==', roomId),
        orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setMessages(msgs);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [selectedUserId, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    
    // Room ID is always the Customer's UID
    const roomId = user.role === UserRole.CUSTOMER ? user.uid : selectedUserId;
    if (!roomId) return;

    await addDoc(collection(db, 'chats'), {
      text: newMessage,
      createdAt: serverTimestamp(),
      senderId: user.uid,
      roomId: roomId,
      senderName: user.displayName || 'User',
      isRead: false
    });

    setNewMessage('');
  };
  
  // ADMIN VIEW: List of customers to chat with (Derived from Reservations for simplicity)
  const [customers, setCustomers] = useState<any[]>([]);
  useEffect(() => {
      if(user?.role === UserRole.ADMIN) {
          const q = query(collection(db, 'reservations')); // Get users from reservations
          const unsub = onSnapshot(q, (snap) => {
             const unique = new Map();
             snap.docs.forEach(d => {
                 const data = d.data();
                 unique.set(data.userId, { id: data.userId, name: data.userName });
             });
             setCustomers(Array.from(unique.values()));
          });
          return () => unsub();
      }
  }, [user]);


  if (user?.role === UserRole.ADMIN && !selectedUserId) {
      return (
          <div className="p-4">
              <h2 className="text-xl font-bold mb-4">상담 대기 고객</h2>
              {customers.length === 0 ? <p className="text-gray-500">예약 내역이 있는 고객이 표시됩니다.</p> : null}
              <div className="space-y-2">
                  {customers.map(c => (
                      <div key={c.id} onClick={() => setSelectedUserId(c.id)} className="bg-white p-4 rounded-lg shadow cursor-pointer hover:bg-gray-50 flex items-center gap-3">
                          <div className="bg-brand-100 p-2 rounded-full"><UserIcon size={20} className="text-brand-600"/></div>
                          <span className="font-medium">{c.name}</span>
                      </div>
                  ))}
              </div>
          </div>
      )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {user?.role === UserRole.ADMIN && (
          <button onClick={() => setSelectedUserId(null)} className="mb-2 text-sm text-gray-500 underline self-start">
              &larr; 목록으로 돌아가기
          </button>
      )}
      
      <div className="flex-1 bg-white rounded-t-xl shadow-inner overflow-y-auto p-4 space-y-4 border border-gray-200">
        {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-10">
                <p>문의사항을 남겨주시면<br/>관리자가 확인 후 답변드립니다.</p>
            </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-brand-500 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="bg-white p-3 border-t border-gray-200 flex gap-2 rounded-b-xl shadow-lg">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="메시지를 입력하세요..."
          className="flex-1 px-4 py-2 bg-gray-50 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button type="submit" className="bg-brand-600 text-white p-2 rounded-full hover:bg-brand-700 transition">
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default Chat;