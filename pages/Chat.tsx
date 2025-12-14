import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, limit } from 'firebase/firestore';
import { ChatMessage, UserRole } from '../types';
import { Send, User as UserIcon, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Chat: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [chatUsers, setChatUsers] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
        navigate('/login');
        return;
    }

    // 관리자가 아닌 경우(고객 또는 반장), 자신의 ID로 채팅방 설정
    if (user.role !== UserRole.ADMIN) {
      setSelectedUserId(user.uid);
    }
  }, [user, navigate]);

  // Admin: Fetch list of users who have chatted
  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
        const q = query(collection(db, 'chats'), orderBy('createdAt', 'desc'), limit(100));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersMap = new Map();
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const uid = data.roomId; // roomId is essentially the customer's UID
                if (uid && !usersMap.has(uid)) {
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
    if (!selectedUserId) return;

    const roomId = selectedUserId;
    
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
              createdAt: data.createdAt || { seconds: Date.now() / 1000, nanoseconds: 0 } 
          } as ChatMessage
      });

      // Sort by time ascending
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
    if (!newMessage.trim() || !user || !selectedUserId || sending) return;
    
    const roomId = selectedUserId;
    setSending(true);

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
        
        // Keep focus on input
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);

    } catch (error) {
        console.error("Error sending message", error);
        alert("메시지 전송 실패");
    } finally {
        setSending(false);
    }
  };

  const formatTime = (timestamp: any) => {
      if (!timestamp || !timestamp.seconds) return '';
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
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

  // Adjusted height calculation for mobile with bottom nav
  return (
    <div className="flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-150px)]">
      {user?.role === UserRole.ADMIN && (
          <div className="flex items-center gap-2 mb-2">
             <button onClick={() => setSelectedUserId(null)} className="text-sm bg-gray-100 px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-200 flex items-center font-bold transition">
                 &larr; 목록으로
             </button>
             <span className="text-sm font-bold text-gray-700 ml-1">
                 {chatUsers.find(u => u.id === selectedUserId)?.name || '고객'}님과의 대화
             </span>
          </div>
      )}
      
      <div className="flex-1 bg-white rounded-t-xl shadow-inner overflow-y-auto p-4 space-y-4 border border-gray-200">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                <UserIcon size={48} className="mb-2 bg-gray-100 p-3 rounded-full"/>
                <p className="text-sm">문의하실 내용을 남겨주세요.</p>
                <p className="text-xs">관리자가 확인 후 답변드립니다.</p>
            </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm leading-relaxed ${isMe ? 'bg-brand-500 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                {msg.text}
              </div>
              <span className="text-[10px] text-gray-400 mt-1 px-1">
                  {formatTime(msg.createdAt)}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="bg-white p-3 border-t border-gray-200 flex gap-2 rounded-b-xl shadow-lg">
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="메시지를 입력하세요..."
          disabled={sending}
          className="flex-1 px-4 py-3 bg-gray-50 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm disabled:opacity-50"
        />
        <button 
            type="submit" 
            disabled={sending || !newMessage.trim()}
            className="bg-brand-600 text-white p-3 rounded-full hover:bg-brand-700 transition shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center min-w-[44px]"
        >
          {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </form>
    </div>
  );
};

export default Chat;