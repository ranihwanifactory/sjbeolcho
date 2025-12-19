
import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { WorkerProfile } from '../types';
import KakaoMap, { MapMarkerData } from '../components/KakaoMap';
import { Phone, User, Award, CheckCircle, MapPin, Settings } from 'lucide-react';
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
        const content = `
            <div style="padding:12px; min-width:200px; font-family:sans-serif;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                    <div style="width:32px; height:32px; border-radius:50%; overflow:hidden; background:#eee;">
                        <img src="${worker.photoUrl || 'https://via.placeholder.com/32'}" style="width:100%; height:100%; object-cover:fit;" />
                    </div>
                    <div style="font-weight:bold; font-size:14px; color:#166534;">${worker.displayName} 반장님</div>
                </div>
                <div style="font-size:11px; color:#666; margin-bottom:4px;">${worker.address}</div>
                <div style="font-size:12px; color:#16a34a; font-weight:bold;">${maskedPhone}</div>
            </div>
        `;
        return { lat: worker.coordinates.lat, lng: worker.coordinates.lng, title: worker.displayName, content };
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
                                <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 border border-brand-50 shadow-sm">
                                            {worker.photoUrl ? <img src={worker.photoUrl} className="w-full h-full object-cover" /> : <User size={24} className="w-full h-full p-2 text-gray-300" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-gray-800 text-base truncate">{worker.displayName}</div>
                                            <div className="text-[10px] text-gray-500 truncate">{worker.address}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs border-t border-gray-50 pt-2">
                                        <span className="text-brand-700 font-bold">{maskPhoneNumber(worker.phone)}</span>
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
