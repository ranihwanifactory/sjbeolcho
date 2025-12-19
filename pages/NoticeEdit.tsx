import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Notice, UserRole } from '../types';
import { Loader2, ArrowLeft, Upload, X, Image as ImageIcon } from 'lucide-react';

const NoticeEdit: React.FC = () => {
  const { id } = useParams<{id: string}>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Security check: Redirect if not admin
  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
        navigate('/notices');
    }
  }, [user, navigate]);

  useEffect(() => {
      const fetchNotice = async () => {
          if(!id) return;
          try {
              const docRef = doc(db, 'notices', id);
              const docSnap = await getDoc(docRef);
              if(docSnap.exists()) {
                  const data = docSnap.data() as Notice;
                  setTitle(data.title);
                  setContent(data.content);
                  if(data.imageUrls && data.imageUrls.length > 0) {
                      setExistingImageUrl(data.imageUrls[0]);
                  }
              } else {
                  alert("존재하지 않는 글입니다.");
                  navigate('/notices');
              }
          } catch(e) {
              console.error(e);
          } finally {
              setLoading(false);
          }
      };
      fetchNotice();
  }, [id, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setFile(e.target.files[0]);
          setExistingImageUrl(null); // Clear existing if new selected
      }
  };

  const handleRemoveExisting = () => {
      setExistingImageUrl(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      let imageUrl = existingImageUrl;

      // Upload new file if selected
      if (file && user) {
          const fileRef = ref(storage, `notices/${user.uid}/${Date.now()}_${file.name}`);
          await uploadBytes(fileRef, file);
          imageUrl = await getDownloadURL(fileRef);
      }

      const updateData: any = {
          title,
          content,
          imageUrls: imageUrl ? [imageUrl] : []
      };

      await updateDoc(doc(db, 'notices', id), updateData);
      
      alert("공지사항이 수정되었습니다.");
      navigate(`/notices/${id}`);
    } catch (error) {
      console.error("Error updating notice", error);
      alert("수정 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if(loading) return <div className="p-10 text-center">불러오는 중...</div>;

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <button 
        onClick={() => navigate(`/notices/${id}`)}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-800 mb-4 transition text-sm font-bold"
      >
        <ArrowLeft size={16} /> 취소
      </button>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-xl font-bold text-gray-800 mb-6">공지사항 수정</h1>
        
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

          <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">사진 첨부</label>
              
              {/* Case 1: Existing Image present */}
              {existingImageUrl && !file && (
                   <div className="relative inline-block">
                        <div className="w-32 h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                            <img src={existingImageUrl} alt="Existing" className="w-full h-full object-cover" />
                        </div>
                        <button 
                            type="button" 
                            onClick={handleRemoveExisting}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition"
                            title="사진 삭제"
                        >
                            <X size={14} />
                        </button>
                    </div>
              )}

              {/* Case 2: No Image (or removed), show Upload */}
              {!existingImageUrl && !file && (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="text-gray-400 mb-2" size={24} />
                          <p className="text-sm text-gray-500">클릭하여 사진 변경/추가</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
              )}

              {/* Case 3: New File selected */}
              {file && (
                  <div className="relative inline-block">
                      <div className="w-32 h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                           <ImageIcon size={32} className="text-gray-400" />
                           <span className="absolute bottom-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded truncate max-w-[90%]">{file.name}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setFile(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition"
                      >
                          <X size={14} />
                      </button>
                  </div>
              )}
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={submitting}
              className="bg-brand-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-700 transition flex items-center gap-2 disabled:opacity-70"
            >
              {submitting && <Loader2 className="animate-spin" size={20} />}
              {submitting ? '저장 중...' : '수정 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoticeEdit;