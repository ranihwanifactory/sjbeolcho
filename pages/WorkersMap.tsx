import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { WorkerProfile } from '../types';
import KakaoMap, { MapMarkerData } from '../components/KakaoMap';
import { Phone, User, Award, CheckCircle, MapPin, Settings, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface WorkersMapProps {
    isEmbedded?: boolean;
}

const WorkersMap: React.FC<WorkersMapProps> = ({ isEmbedded = false }) => {
  const { user } = useAuth();
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [markers, setMarkers] = useState<MapMarkerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'worker_profiles'));
        const workerData: WorkerProfile[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as WorkerProfile;
          if (data.isApproved) workerData.push(data);
        });
        setWorkers(workerData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkers();
  }, []);

  const maskPhoneNumber = (phone: string) => {
      if (!phone) return '';
      if (phone.includes('-')) {
          const parts = phone.split('-');
          return parts.length === 3 ? `${parts[0]}-${parts[1]}-****` : '****';
      }
      return phone.length > 4 ? phone.substring(0, phone.length - 4) + '****' : '****';
  };

  useEffect(() => {
    const newMarkers = workers.map(worker => {
        const maskedPhone = maskPhoneNumber(worker.phone);
        const isAvailable = worker.isAvailable !== false;
        
        const infoContent = `
            <div style="padding:15px; min-width:220px; font-family:sans-serif;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                    <div style="width:40px; height:40px; border-radius:50%; overflow:hidden; background:#eee; border: 1px solid ${isAvailable ? '#ddd' : '#9ca3af'}; filter: ${isAvailable ? 'none' : 'grayscale(100%)'};">
                        <img src="${worker.photoUrl || 'https://via.placeholder.com/40'}" style="width:100%; height:100%; object-fit:cover;" />
                    </div>
                    <div>
                        <div style="font-weight:bold; font-size:16px; color:${isAvailable ? '#166534' : '#4b5563'};">${worker.displayName}</div>
                        <div style="font-size:11px; color:${isAvailable ? '#15803d' : '#6b7280'}; font-weight:600;">
                            ${isAvailable ? '● 작업 가능' : '○ 상담/작업 중'}
                        </div>
                    </div>
                </div>
                <div style="font-size:12px; color:#4b5563; margin-bottom:4px; display:flex; align-items:center; gap:4px;">
                    📍 ${worker.address}
                </div>
                <div style="font-size:14px; color:${isAvailable ? '#16a34a' : '#9ca3af'}; font-weight:bold;">
                    📞 ${maskedPhone}
                </div>
                <div style="margin-top:10px; font-size:11px; color:#9ca3af; text-align:right;">
                    경력 ${worker.experienceYears}년 | 반경 ${worker.maxDistance}km
                </div>
            </div>
        `;
        return { 
            lat: worker.coordinates.lat, 
            lng: worker.coordinates.lng, 
            title: worker.displayName, 
            content: infoContent,
            imageUrl: worker.photoUrl || 'https://via.placeholder.com/50',
            isAvailable: isAvailable
        };
    });
    setMarkers(newMarkers);
  }, [workers]);

  return (
    <div className={`flex flex-col ${isEmbedded ? 'h-[350px] md:h-[500px]' : 'pb-10 h-[calc(100vh-100px)]'}`}>
      {!isEmbedded && (
          <div className="mb-4 flex justify-between items-end px-2">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">우리동네 반장 찾기</h1>
                <p className="text-gray-500 text-sm">성주군 전문가들을 지도에서 확인하세요.</p>
            </div>
            <Link to="/profile" className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition"><Settings size={14}/> 프로필 설정</Link>
          </div>
      )}

      <div className={`flex-1 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden relative flex flex-col ${isEmbedded ? 'shadow-lg' : ''}`}>
          {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50"><span className="text-gray-500">불러오는 중...</span></div>
          ) : (
            <>
                 <KakaoMap markers={markers} readOnly={true} />
                 {!isEmbedded && (
                     <div className="p-4 bg-gray-50 border-t border-gray-200 overflow-y-auto max-h-[300px]">
                        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2 px-1"><CheckCircle size={16} className="text-green-600"/> 활동 중인 반장님 ({workers.length}명)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {workers.map((worker, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col gap-3 relative overflow-hidden">
                                    {!worker.isAvailable && (
                                        <div className="absolute top-0 left-0 w-1 bg-gray-400 h-full"></div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 border border-brand-50 shadow-sm ${!worker.isAvailable ? 'grayscale opacity-70' : ''}`}>
                                            {worker.photoUrl ? <img src={worker.photoUrl} className="w-full h-full object-cover" /> : <User size={24} className="w-full h-full p-2 text-gray-300" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <div className="font-bold text-gray-800 text-base truncate">{worker.displayName}</div>
                                                {worker.isAvailable === false && (
                                                    <span className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">작업중</span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-gray-500 truncate">{worker.address}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs border-t border-gray-50 pt-2">
                                        <div className="flex items-center gap-1">
                                            <div className={`w-2 h-2 rounded-full ${worker.isAvailable !== false ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                                            <span className={`font-bold ${worker.isAvailable !== false ? 'text-green-700' : 'text-gray-400'}`}>
                                                {worker.isAvailable !== false ? '작업 가능' : '상담 중'}
                                            </span>
                                        </div>
                                        <span className="text-gray-400">경력 {worker.experienceYears}년</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>
                 )}
            </>
          )}
      </div>
    </div>
  );
};

export default WorkersMap;