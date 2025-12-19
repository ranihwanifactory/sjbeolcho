import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import KakaoMap from '../components/KakaoMap';
import { db, storage } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ReservationStatus } from '../types';
import { Loader2, Upload } from 'lucide-react';

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
  
  const [file, setFile] = useState<File | null>(null);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setFormData(prev => ({ ...prev, lat, lng, address }));
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
      let imageUrl = '';
      if (file) {
        const fileRef = ref(storage, `reservations/${user.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        imageUrl = await getDownloadURL(fileRef);
      }

      const docRef = await addDoc(collection(db, 'reservations'), {
        userId: user.uid,
        userName: formData.name,
        userPhone: formData.phone,
        locationName: formData.address,
        coordinates: { lat: formData.lat, lng: formData.lng },
        requestDate: formData.date,
        description: formData.desc,
        imageUrls: imageUrl ? [imageUrl] : [],
        status: ReservationStatus.PENDING,
        createdAt: serverTimestamp(),
      });

      // Navigate to success page with reservation details
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">참고 사진 (선택)</label>
                    <div className="flex items-center gap-2">
                        <label className="flex-1 cursor-pointer bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center hover:bg-gray-100 transition">
                            <Upload className="text-gray-400 mb-1" size={24} />
                            <span className="text-xs text-gray-500">{file ? file.name : "사진 업로드 (클릭)"}</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}/>
                        </label>
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
            {loading ? '접수 중...' : '예약 신청하기'}
        </button>
      </form>
    </div>
  );
};

export default Reservation;