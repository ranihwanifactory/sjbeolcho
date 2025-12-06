import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../services/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Review, UserRole } from '../types.ts';
import { Star, Upload, X, PenTool, Loader2, MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Reviews: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
      } as Review));
      setReviews(data);
    });
    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setRating(5);
    setText('');
    setFile(null);
    setExistingPhotoUrl(null);
    setIsModalOpen(false);
  };

  const handleOpenWrite = () => {
      if (!user) {
          if (window.confirm("로그인이 필요한 서비스입니다. 로그인 하시겠습니까?")) {
              navigate('/login');
          }
          return;
      }
      resetForm();
      setIsModalOpen(true);
  }

  const handleEdit = (review: Review) => {
      setEditingId(review.id);
      setRating(review.rating);
      setText(review.text);
      setExistingPhotoUrl(review.photoUrl || null);
      setFile(null);
      setIsModalOpen(true);
  };

  const handleDelete = async (reviewId: string) => {
      if (!window.confirm("정말로 이 후기를 삭제하시겠습니까?")) return;
      
      try {
          await deleteDoc(doc(db, 'reviews', reviewId));
          alert("후기가 삭제되었습니다.");
      } catch (error) {
          console.error("Error deleting review", error);
          alert("삭제 중 오류가 발생했습니다.");
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!text.trim()) {
        alert("후기 내용을 입력해주세요.");
        return;
    }

    setLoading(true);
    try {
        let imageUrl = existingPhotoUrl || '';
        
        // Upload new file if selected
        if (file) {
            const fileRef = ref(storage, `reviews/${user.uid}/${Date.now()}_${file.name}`);
            await uploadBytes(fileRef, file);
            imageUrl = await getDownloadURL(fileRef);
        }

        if (editingId) {
            // Update existing review
            await updateDoc(doc(db, 'reviews', editingId), {
                rating,
                text,
                photoUrl: imageUrl,
                // We typically don't update createdAt, but could add updatedAt if needed
            });
            alert("후기가 수정되었습니다.");
        } else {
            // Create new review
            await addDoc(collection(db, 'reviews'), {
                userId: user.uid,
                userName: user.displayName || '익명',
                rating,
                text,
                photoUrl: imageUrl,
                createdAt: serverTimestamp()
            });
            alert("소중한 후기 감사합니다!");
        }

        resetForm();
    } catch (error) {
        console.error("Error submitting review", error);
        alert("작성 중 오류가 발생했습니다.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="pb-20 relative">
      <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">이용 후기</h1>
          <button 
            onClick={handleOpenWrite}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-full shadow-md text-sm hover:bg-brand-700 transition"
          >
              <PenTool size={16} />
              후기 작성
          </button>
      </div>

      {reviews.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
              <p>아직 등록된 후기가 없습니다.</p>
              <p className="text-sm mt-1">첫 번째 후기의 주인공이 되어보세요!</p>
          </div>
      ) : (
          <div className="space-y-4">
              {reviews.map((review) => {
                  const isOwner = user?.uid === review.userId;
                  const isAdmin = user?.role === UserRole.ADMIN;

                  return (
                    <div key={review.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative group">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <div className="font-bold text-gray-800">{review.userName}</div>
                                <div className="flex text-yellow-400">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "text-yellow-400" : "text-gray-300"} />
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">
                                    {review.createdAt ? new Date(review.createdAt.seconds * 1000).toLocaleDateString() : '방금 전'}
                                </span>
                                {(isOwner || isAdmin) && (
                                    <div className="flex items-center gap-1 ml-1">
                                        {isOwner && (
                                            <button 
                                                onClick={() => handleEdit(review)}
                                                className="p-1 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded transition"
                                                title="수정"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleDelete(review.id)}
                                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                            title="삭제"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {review.photoUrl && (
                            <div className="mb-3 rounded-lg overflow-hidden h-48 bg-gray-100">
                                <img src={review.photoUrl} alt="Review" className="w-full h-full object-cover" />
                            </div>
                        )}
                        
                        <p className="text-gray-600 text-sm whitespace-pre-wrap">{review.text}</p>
                    </div>
                  );
              })}
          </div>
      )}

      {/* Write/Edit Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-0">
              <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl relative animate-slide-up sm:animate-none">
                  <button 
                    onClick={resetForm}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                  >
                      <X size={24} />
                  </button>
                  
                  <h2 className="text-xl font-bold mb-4 text-gray-800">
                      {editingId ? '후기 수정' : '후기 작성'}
                  </h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">만족도</label>
                          <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none transition transform active:scale-110"
                                  >
                                      <Star 
                                        size={32} 
                                        className={star <= rating ? "text-yellow-400" : "text-gray-300"} 
                                        fill={star <= rating ? "currentColor" : "none"}
                                      />
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">내용</label>
                          <textarea 
                              value={text}
                              onChange={(e) => setText(e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none h-32 resize-none"
                              placeholder="서비스 이용 후기를 자유롭게 남겨주세요."
                              required
                          />
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">사진 첨부 (선택)</label>
                          <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition relative overflow-hidden">
                                {existingPhotoUrl && !file ? (
                                    <div className="absolute inset-0">
                                        <img src={existingPhotoUrl} alt="Existing" className="w-full h-full object-cover opacity-50" />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10">
                                            <Upload className="text-white drop-shadow-md mb-1" size={24}/>
                                            <p className="text-xs text-white font-bold drop-shadow-md">사진 변경하려면 클릭</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="text-gray-400 mb-1" size={24}/>
                                        <p className="text-xs text-gray-500">{file ? file.name : "클릭하여 사진 업로드"}</p>
                                    </div>
                                )}
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
                          </label>
                      </div>

                      <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition flex items-center justify-center"
                      >
                          {loading ? <Loader2 className="animate-spin mr-2"/> : null}
                          {loading ? (editingId ? '수정 완료' : '등록 중...') : (editingId ? '수정하기' : '후기 등록하기')}
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Reviews;