import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, limit } from 'firebase/firestore';
import { ChatMessage, UserRole } from '../types.ts';
import { Send, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Chat: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [chatUsers, setChatUsers] = useState<any[]>([]);
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
        // Fetch recent chats to find unique users. 
        // We order by createdAt desc to get latest. This usually works without composite index if no where clause.
        const q = query(collection(db, 'chats'), orderBy('createdAt', 'desc'), limit(100));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersMap = new Map();
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const uid = data.roomId; // roomId is essentially the customer's UID
                if (uid && !usersMap.has(uid)) {
                    // Try to use the senderName if available, otherwise fallback
                    const displayName = data.senderId === uid ? data.senderName : (usersMap.get(uid)?.name || 'Unknown');
                    usersMap.set(uid, { id: uid, name: displayName, lastMsg: data.text });
                }
            });
            setChatUsers(Array.from(usersMap.values()));
        });
        return () => unsubscribe();
    }
  }, [user]);

  // Fetch Messages for the selected room
  useEffect(() => {
    if (!selectedUserId) return; // Wait for selection

    const roomId = selectedUserId;
    
    // FIX: Removing 'orderBy' from the query to avoid "Missing Index" error on Firestore.
    // We will sort the messages in memory (JavaScript) instead.
    const q = query(
        collection(db, 'chats'), 
        where('roomId', '==', roomId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => {
          const data = doc.data();
          return { 
              id: doc.id, 
              ...data,
              // Handle potential null 'createdAt' (optimistic UI) by falling back to now
              createdAt: data.createdAt || { seconds: Date.now() / 1000, nanoseconds: 0 } 
          } as ChatMessage
      });

      // Sort in memory by time ascending
      msgs.sort((a, b) => {
          const timeA = a.createdAt.seconds;
          const timeB = b.createdAt.seconds;
          return timeA - timeB;
      });

      setMessages(msgs);
      setTimeout(scrollToBottom, 100);
    });

    return () => unsubscribe();
  }, [selectedUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedUserId) return;
    
    const roomId = selectedUserId;

    try {
        await addDoc(collection(db, 'chats'), {
            text: newMessage,
            createdAt: serverTimestamp(),
            senderId: user.uid,
            roomId: roomId,
            senderName: user.displayName || (user.role === UserRole.ADMIN ? '관리자' : '고객'),
            isRead: false
        });
        setNewMessage('');
        // We don't need to manually update state, onSnapshot will pick it up
    } catch (error) {
        console.error("Error sending message", error);
        alert("메시지 전송 실패");
    }
  };

  // ADMIN VIEW: Select User
  if (user?.role === UserRole.ADMIN && !selectedUserId) {
      return (
          <div className="p-4">
              <h2 className="text-xl font-bold mb-4">상담 대기 목록</h2>
              {chatUsers.length === 0 ? (
                  <div className="text-center text-gray-500 py-10 bg-white rounded-xl border border-gray-200">
                      <p>진행 중인 상담이 없습니다.</p>
                      <p className="text-xs mt-2">고객이 메시지를 보내면 여기에 표시됩니다.</p>
                  </div>
              ) : null}
              <div className="space-y-2">
                  {chatUsers.map(c => (
                      <div key={c.id} onClick={() => setSelectedUserId(c.id)} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 flex items-center gap-3 transition">
                          <div className="bg-brand-100 p-3 rounded-full"><UserIcon size={20} className="text-brand-600"/></div>
                          <div className="flex-1 min-w-0">
                              <span className="font-bold text-gray-800 block">{c.name}</span>
                              <span className="text-xs text-gray-500 truncate block">{c.lastMsg}</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {user?.role === UserRole.ADMIN && (
          <div className="flex items-center gap-2 mb-2">
             <button onClick={() => setSelectedUserId(null)} className="text-sm text-gray-500 hover:text-brand-600 flex items-center">
                 &larr; 목록으로
             </button>
             <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-700">
                 {chatUsers.find(u => u.id === selectedUserId)?.name || '고객'}님과의 대화
             </span>
          </div>
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
              <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-brand-500 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
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
          className="flex-1 px-4 py-2 bg-gray-50 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
        />
        <button type="submit" className="bg-brand-600 text-white p-2 rounded-full hover:bg-brand-700 transition shadow-md">
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default Chat;