import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Notice, NoticeComment, UserRole } from '../types';
import { ArrowLeft, Trash2, User, Send, Calendar, Clock } from 'lucide-react';

const NoticeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [notice, setNotice] = useState<Notice | null>(null);
  const [comments, setComments] = useState<NoticeComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Fetch Notice
    const fetchNotice = async () => {
      try {
        const docRef = doc(db, 'notices', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setNotice({ id: docSnap.id, ...docSnap.data() } as Notice);
        } else {
          alert("존재하지 않는 게시글입니다.");
          navigate('/notices');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotice();

    // Subscribe to Comments
    const q = query(collection(db, `notices/${id}/comments`), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as NoticeComment));
      setComments(data);
    });

    return () => unsubscribe();
  }, [id, navigate]);

  const handleDeleteNotice = async () => {
    if (!id || !user || user.role !== UserRole.ADMIN) return;
    if (window.confirm("정말로 이 공지사항을 삭제하시겠습니까?")) {
      try {
        await deleteDoc(doc(db, 'notices', id));
        navigate('/notices');
      } catch (error) {
        console.error("Error deleting notice", error);
        alert("삭제 중 오류가 발생했습니다.");
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user || !newComment.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, `notices/${id}/comments`), {
        noticeId: id,
        userId: user.uid,
        userName: user.displayName || '익명',
        text: newComment,
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (error) {
      console.error(error);
      alert("댓글 작성 실패");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!id) return;
    if (window.confirm("댓글을 삭제하시겠습니까?")) {
      try {
        await deleteDoc(doc(db, `notices/${id}/comments`, commentId));
      } catch (error) {
        console.error(error);
      }
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400">로딩 중...</div>;
  if (!notice) return null;

  return (
    <div className="max-w-3xl mx-auto pb-20">
       <button 
        onClick={() => navigate('/notices')}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-800 mb-4 transition text-sm font-bold"
      >
        <ArrowLeft size={16} /> 목록으로
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
             <span className="bg-brand-100 text-brand-700 text-xs px-2 py-0.5 rounded-full font-bold">공지</span>
             <h1 className="text-xl md:text-2xl font-bold text-gray-800">{notice.title}</h1>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><User size={14}/> {notice.authorName}</span>
              <span className="flex items-center gap-1"><Calendar size={14}/> {notice.createdAt ? new Date(notice.createdAt.seconds * 1000).toLocaleDateString() : ''}</span>
            </div>
            {user?.role === UserRole.ADMIN && (
              <button 
                onClick={handleDeleteNotice}
                className="text-red-500 flex items-center gap-1 hover:text-red-700 font-bold"
              >
                <Trash2 size={14} /> 삭제
              </button>
            )}
          </div>
        </div>
        <div className="p-6 min-h-[200px] text-gray-800 whitespace-pre-wrap leading-relaxed">
          {notice.content}
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
          댓글 <span className="text-brand-600">{comments.length}</span>
        </h3>

        {/* Comment List */}
        <div className="space-y-4 mb-6">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-800">{comment.userName}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={10} />
                    {comment.createdAt ? new Date(comment.createdAt.seconds * 1000).toLocaleString() : ''}
                  </span>
                </div>
                {(user?.uid === comment.userId || user?.role === UserRole.ADMIN) && (
                  <button 
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-700">{comment.text}</p>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-4">첫 번째 댓글을 남겨보세요.</p>
          )}
        </div>

        {/* Comment Form */}
        {user ? (
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input 
              type="text" 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 입력하세요..."
              className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
              disabled={submitting}
            />
            <button 
              type="submit" 
              disabled={submitting || !newComment.trim()}
              className="bg-brand-600 text-white p-3 rounded-lg hover:bg-brand-700 transition disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </form>
        ) : (
          <div className="text-center py-4 bg-white rounded-lg border border-gray-200 text-sm text-gray-500">
            댓글을 작성하려면 <span className="font-bold text-brand-600 cursor-pointer" onClick={() => navigate('/login')}>로그인</span>이 필요합니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticeDetail;