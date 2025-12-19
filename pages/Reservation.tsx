
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import KakaoMap from '../components/KakaoMap';
import { db, storage } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ReservationStatus } from '../types';
import { Loader2, Upload, X, ImageIcon } from 'lucide-react';

const Reservation: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    phone: '',
    date: '',
    desc: '',
    lat: 0,
    lng: 0,
    address: '',
  });
  
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setFormData(prev => ({ ...prev, lat, lng, address }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const totalFiles = [...files, ...selectedFiles].slice(0, 5); // Limit to 5 files
      
      setFiles(totalFiles);

      // Create previews
      const newPreviews = totalFiles.map(file => URL.createObjectURL(file));
      setPreviews(newPreviews);
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setPreviews(updatedPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.address) {
        alert("지도에서 벌초할 위치를 선택해주세요.");
        return;
    }
    if (!formData.date || !formData.phone || !formData.name) {
        alert("필수 정보를 입력해주세요.");
        return;
    }

    setLoading(true);

    try {
      const imageUrls: string[] = [];
      
      // Upload all selected files
      if (files.length > 0) {
        await Promise.all(
          files.map(async (file) => {
            const fileRef = ref(storage, `reservations/${user.uid}/${Date.now()}_${file.name}`);
            const uploadResult = await uploadBytes(fileRef, file);
            const url = await getDownloadURL(uploadResult.ref);
            imageUrls.push(url);
          })
        );
      }

      const docRef = await addDoc(collection(db, 'reservations'), {
        userId: user.uid,
        userName: formData.name,
        userPhone: formData.phone,
        locationName: formData.address,
        coordinates: { lat: formData.lat, lng: formData.lng },
        requestDate: formData.date,
        description: formData.desc,
        imageUrls: imageUrls,
        status: ReservationStatus.PENDING,
        createdAt: serverTimestamp(),
      });

      navigate('/reserve/success', { 
        state: { 
          reservation: {
            id: docRef.id,
            userName: formData.name,
            locationName: formData.address,
            requestDate: formData.date
          } 
        } 
      });

    } catch (error) {
      console.error(error);
      alert("접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">벌초 예약 신청</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: User Info */}
        <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-md font-semibold text-brand-700 mb-4 flex items-center gap-2">
                <span className="bg-brand-100 text-brand-600 w-6 h-6 flex items-center justify-center rounded-full text-xs">1</span>
                신청자 정보
            </h2>
            <div className="grid gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">성함</label>
                    <input 
                        type="text" 
                        required
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="홍길동"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                    <input 
                        type="tel" 
                        required
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        placeholder="010-0000-0000"
                    />
                </div>
            </div>
        </section>

        {/* Step 2: Location */}
        <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-md font-semibold text-brand-700 mb-4 flex items-center gap-2">
                <span className="bg-brand-100 text-brand-600 w-6 h-6 flex items-center justify-center rounded-full text-xs">2</span>
                벌초 위치 선택
            </h2>
            <p className="text-xs text-gray-500 mb-3">지도에서 정확한 묘소 위치를 클릭하거나 주소를 검색하세요.</p>
            <KakaoMap onLocationSelect={handleLocationSelect} />
            {formData.address && (
                <div className="mt-3 p-3 bg-gray-50 text-sm text-gray-700 rounded-lg">
                    선택된 주소: <span className="font-bold">{formData.address}</span>
                </div>
            )}
        </section>

        {/* Step 3: Details */}
        <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-md font-semibold text-brand-700 mb-4 flex items-center gap-2">
                <span className="bg-brand-100 text-brand-600 w-6 h-6 flex items-center justify-center rounded-full text-xs">3</span>
                상세 정보
            </h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">희망 작업일</label>
                    <input 
                        type="date" 
                        required
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">현장 참고 사진 (최대 5장)</label>
                    
                    {/* Selected Images Preview Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
                        {previews.map((preview, index) => (
                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                <button 
                                    type="button" 
                                    onClick={() => removeFile(index)}
                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-red-500 transition"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        
                        {/* Add Button Placeholder if < 5 */}
                        {files.length < 5 && (
                            <label className="aspect-square cursor-pointer bg-gray-50 border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:bg-gray-100 transition">
                                <Upload className="text-gray-400 mb-1" size={20} />
                                <span className="text-[10px] text-gray-500">{files.length}/5</span>
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*" 
                                    multiple 
                                    onChange={handleFileChange}
                                />
                            </label>
                        )}
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">요청 사항</label>
                    <textarea 
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none h-24 resize-none"
                        placeholder="묘소의 특징이나 특별히 신경 써야 할 부분을 적어주세요."
                        value={formData.desc}
                        onChange={e => setFormData({...formData, desc: e.target.value})}
                    />
                </div>
            </div>
        </section>

        <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl shadow-lg transition flex items-center justify-center text-lg disabled:opacity-70"
        >
            {loading ? <Loader2 className="animate-spin mr-2"/> : null}
            {loading ? '사진 업로드 및 접수 중...' : '예약 신청하기'}
        </button>
      </form>
    </div>
  );
};

export default Reservation;
