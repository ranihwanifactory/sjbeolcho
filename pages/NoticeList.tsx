import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Notice, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Megaphone, PenTool, ChevronRight } from 'lucide-react';

const NoticeList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notice));
      setNotices(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="pb-20 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Megaphone className="text-brand-600" /> 공지사항
          </h1>
          <p className="text-sm text-gray-500 mt-1">젊은벌초의 새로운 소식을 확인하세요.</p>
        </div>
        
        {user?.role === UserRole.ADMIN && (
          <Link 
            to="/notices/new" 
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-brand-700 transition text-sm font-bold"
          >
            <PenTool size={16} />
            글쓰기
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
           <div className="p-10 text-center text-gray-400">로딩 중...</div>
        ) : notices.length === 0 ? (
           <div className="p-10 text-center text-gray-400">등록된 공지사항이 없습니다.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notices.map((notice) => (
              <div 
                key={notice.id} 
                onClick={() => navigate(`/notices/${notice.id}`)}
                className="p-5 hover:bg-gray-50 cursor-pointer transition flex items-center justify-between group"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-brand-100 text-brand-700 text-[10px] px-2 py-0.5 rounded-full font-bold">공지</span>
                    <h3 className="text-base md:text-lg font-bold text-gray-800 truncate group-hover:text-brand-600 transition">
                      {notice.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{notice.authorName}</span>
                    <span className="w-[1px] h-3 bg-gray-300"></span>
                    <span>{notice.createdAt ? new Date(notice.createdAt.seconds * 1000).toLocaleDateString() : ''}</span>
                  </div>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-brand-500 transition" size={20} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticeList;