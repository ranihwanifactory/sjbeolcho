import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { UserRole } from '../types';
import { Loader2, ArrowLeft } from 'lucide-react';

const NoticeWrite: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Security check: Redirect if not admin
  if (!user || user.role !== UserRole.ADMIN) {
    navigate('/notices');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'notices'), {
        title,
        content,
        authorId: user.uid,
        authorName: user.displayName || '관리자',
        createdAt: serverTimestamp(),
        viewCount: 0
      });
      navigate('/notices');
    } catch (error) {
      console.error("Error creating notice", error);
      alert("공지사항 등록 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <button 
        onClick={() => navigate('/notices')}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-800 mb-4 transition text-sm font-bold"
      >
        <ArrowLeft size={16} /> 목록으로
      </button>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-xl font-bold text-gray-800 mb-6">공지사항 작성</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">제목</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              placeholder="제목을 입력하세요"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">내용</label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-[300px]"
              placeholder="내용을 입력하세요"
              required
            />
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={submitting}
              className="bg-brand-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-700 transition flex items-center gap-2 disabled:opacity-70"
            >
              {submitting && <Loader2 className="animate-spin" size={20} />}
              {submitting ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoticeWrite;