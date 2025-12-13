import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserRole, WorkerProfile } from '../types.ts';
import { useNavigate } from 'react-router-dom';
import KakaoMap from '../components/KakaoMap';
import { Loader2, Save } from 'lucide-react';

const WorkerSettings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Partial<WorkerProfile>>({
      displayName: '',
      phone: '',
      bio: '',
      address: '',
      experienceYears: 1,
      isAvailable: true,
      coordinates: { lat: 35.919069, lng: 128.283038 }
  });

  useEffect(() => {
    if (!user) {
        navigate('/login');
        return;
    }
    if (user.role !== UserRole.WORKER) {
        alert("반장님(Worker) 계정만 접근할 수 있습니다.");
        navigate('/');
        return;
    }

    const fetchProfile = async () => {
        try {
            const docRef = doc(db, 'worker_profiles', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setProfile(docSnap.data() as WorkerProfile);
            } else {
                setProfile(prev => ({ ...prev, displayName: user.displayName }));
            }
        } catch (error) {
            console.error("Error fetching profile", error);
        }
    };
    fetchProfile();
  }, [user, navigate]);

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setProfile(prev => ({ ...prev, coordinates: { lat, lng }, address }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
        await setDoc(doc(db, 'worker_profiles', user.uid), {
            uid: user.uid,
            ...profile,
            updatedAt: new Date()
        });
        alert("프로필이 저장되었습니다.");
    } catch (error) {
        console.error("Error saving profile", error);
        alert("저장 중 오류가 발생했습니다.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="pb-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">반장님 프로필 설정</h1>
      <p className="text-gray-500 mb-6 bg-blue-50 p-4 rounded-lg text-sm border border-blue-100">
          고객님들이 지도에서 반장님의 위치와 정보를 보고 연락할 수 있도록 정확한 정보를 입력해주세요.
          주 활동 지역을 지도에 표시해주세요.
      </p>

      <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="font-bold text-lg mb-4">기본 정보</h2>
              <div className="grid gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">성함 (표시용)</label>
                    <input 
                        type="text" 
                        value={profile.displayName || ''}
                        onChange={e => setProfile({...profile, displayName: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                    <input 
                        type="tel" 
                        value={profile.phone || ''}
                        onChange={e => setProfile({...profile, phone: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        placeholder="010-0000-0000"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">경력 (년)</label>
                    <input 
                        type="number" 
                        value={profile.experienceYears || 0}
                        onChange={e => setProfile({...profile, experienceYears: parseInt(e.target.value)})}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        min="0"
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">소개글</label>
                    <textarea 
                        value={profile.bio || ''}
                        onChange={e => setProfile({...profile, bio: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg h-24"
                        placeholder="예: 꼼꼼하게 작업해드립니다. 최신 장비 보유."
                    />
                </div>
              </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="font-bold text-lg mb-4">활동 거점 설정</h2>
              <p className="text-xs text-gray-500 mb-3">지도에서 주로 활동하시는 지역의 중심을 클릭해주세요.</p>
              <KakaoMap 
                onLocationSelect={handleLocationSelect} 
                initialLat={profile.coordinates?.lat}
                initialLng={profile.coordinates?.lng}
              />
              {profile.address && (
                  <p className="mt-2 text-sm text-gray-700 font-bold bg-gray-50 p-2 rounded">
                      선택 위치: {profile.address}
                  </p>
              )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-brand-700 transition flex items-center justify-center gap-2"
          >
              {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              정보 저장하기
          </button>
      </form>
    </div>
  );
};

export default WorkerSettings;