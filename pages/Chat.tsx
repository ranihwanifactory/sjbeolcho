
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, limit, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { ChatMessage, UserRole } from '../types';
import { Send, User as UserIcon, Loader2, LogOut, Trash2, ArrowLeft, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Chat: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [chatUsers, setChatUsers] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
        navigate('/login');
        return;
    }
    if (user.role !== UserRole.ADMIN) {
      setSelectedUserId(user.uid);
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
        const q = query(collection(db, 'chats'), orderBy('createdAt', 'desc'), limit(100));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersMap = new Map();
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const uid = data.roomId;
                if (uid && !usersMap.has(uid)) {
                    const displayName = data.senderId === uid ? data.senderName : (usersMap.get(uid)?.name || '사용자');
                    usersMap.set(uid, { id: uid, name: displayName, lastMsg: data.text });
                }
            });
            setChatUsers(Array.from(usersMap.values()));
        });
        return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (!selectedUserId) return;

    const q = query(collection(db, 'chats'), where('roomId', '==', selectedUserId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => {
          const data = doc.data();
          return { id: doc.id, ...data, createdAt: data.createdAt || { seconds: Date.now() / 1000, nanoseconds: 0 } } as ChatMessage
      });
      msgs.sort((a, b) => a.createdAt.seconds - b.createdAt.seconds);
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
    setSending(true);
    try {
        await addDoc(collection(db, 'chats'), {
            text: newMessage,
            createdAt: serverTimestamp(),
            senderId: user.uid,
            roomId: selectedUserId,
            senderName: user.displayName || (user.role === UserRole.ADMIN ? '관리자' : '사용자'),
            isRead: false
        });
        setNewMessage('');
        setTimeout(() => inputRef.current?.focus(), 0);
    } catch (error) {
        console.error(error);
        alert("전송 실패");
    } finally {
        setSending(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
      if (!window.confirm("대화 내용을 모두 삭제하고 나가시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) return;
      
      setDeleting(true);
      try {
          const q = query(collection(db, 'chats'), where('roomId', '==', roomId));
          const snapshot = await getDocs(q);
          const batch = writeBatch(db);
          snapshot.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
          
          if (user?.role === UserRole.ADMIN) {
              setSelectedUserId(null);
          } else {
              setMessages([]);
          }
          alert("대화방이 정리되었습니다.");
      } catch (error) {
          console.error(error);
          alert("삭제 중 오류가 발생했습니다.");
      } finally {
          setDeleting(false);
      }
  };

  const formatTime = (timestamp: any) => {
      if (!timestamp || !timestamp.seconds) return '';
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  if (user?.role === UserRole.ADMIN && !selectedUserId) {
      return (
          <div className="p-4">
              <h2 className="text-xl font-bold mb-4">상담 대기 목록</h2>
              {chatUsers.length === 0 ? (
                  <div className="text-center text-gray-500 py-10 bg-white rounded-xl border border-gray-200">상담 내역이 없습니다.</div>
              ) : (
                  <div className="space-y-2">
                    {chatUsers.map(c => (
                        <div key={c.id} className="bg-white rounded-lg shadow-sm border border-gray-100 flex items-center gap-3 group">
                            <div onClick={() => setSelectedUserId(c.id)} className="flex-1 p-4 cursor-pointer hover:bg-gray-50 flex items-center gap-3 transition overflow-hidden">
                                <div className="bg-brand-100 p-3 rounded-full flex-shrink-0"><UserIcon size={20} className="text-brand-600"/></div>
                                <div className="flex-1 min-w-0">
                                    <span className="font-bold text-gray-800 block">{c.name}</span>
                                    <span className="text-xs text-gray-500 truncate block">{c.lastMsg}</span>
                                </div>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteRoom(c.id); }}
                                className="p-4 text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                                title="상담 종료 및 삭제"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                </div>
              )}
          </div>
      )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-150px)]">
      <div className="flex items-center justify-between p-2 bg-white rounded-t-xl border border-gray-200 border-b-0">
          <div className="flex items-center gap-2">
            {user?.role === UserRole.ADMIN && (
                <button onClick={() => setSelectedUserId(null)} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20}/></button>
            )}
            <span className="text-sm font-bold text-gray-700 ml-1">
                {user?.role === UserRole.ADMIN 
                    ? `${chatUsers.find(u => u.id === selectedUserId)?.name || '사용자'}님과 상담`
                    : '관리자 일대일 문의'}
            </span>
          </div>
          {selectedUserId && (
              <button 
                onClick={() => handleDeleteRoom(selectedUserId)}
                className="text-gray-400 hover:text-red-500 p-2 flex items-center gap-1 text-xs font-bold"
                title="대화 나가기"
              >
                  {deleting ? <Loader2 size={16} className="animate-spin"/> : <LogOut size={16} />}
                  나가기
              </button>
          )}
      </div>
      
      <div className="flex-1 bg-white overflow-y-auto p-4 space-y-4 border-x border-gray-200">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                <UserIcon size={48} className="mb-2 bg-gray-100 p-3 rounded-full"/>
                <p className="text-sm">상담 메시지를 보내주세요.</p>
            </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-brand-500 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                {msg.text}
              </div>
              <span className="text-[10px] text-gray-400 mt-1 px-1">{formatTime(msg.createdAt)}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="bg-white p-3 border border-gray-200 flex gap-2 rounded-b-xl shadow-lg">
        <input ref={inputRef} type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="메시지를 입력하세요..." disabled={sending || deleting} className="flex-1 px-4 py-3 bg-gray-50 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm" />
        <button type="submit" disabled={sending || deleting || !newMessage.trim()} className="bg-brand-600 text-white p-3 rounded-full hover:bg-brand-700 transition disabled:bg-gray-300 flex items-center justify-center min-w-[44px]">
          {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </form>
    </div>
  );
};

export default Chat;
