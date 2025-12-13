import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { WorkerProfile } from '../types.ts';
import KakaoMap, { MapMarkerData } from '../components/KakaoMap';
import { Phone, User, Award, CheckCircle, MapPin, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const WorkersMap: React.FC = () => {
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
          // Only show approved workers
          if (data.isApproved) {
            workerData.push(data);
          }
        });
        setWorkers(workerData);
      } catch (error) {
        console.error("Error fetching workers", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, []);

  useEffect(() => {
    const newMarkers = workers.map(worker => {
        // Create simple HTML content for the InfoWindow
        const content = `
            <div style="padding:12px; min-width:220px; font-family:sans-serif; border-radius:8px;">
                <div style="font-weight:bold; margin-bottom:4px; font-size:16px; color:#166534;">${worker.displayName} 반장님</div>
                <div style="font-size:12px; color:#555; margin-bottom:8px;">${worker.address}</div>
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px; color:#444;">
                    <span>경력 ${worker.experienceYears}년</span>
                    <span>활동반경 ${worker.maxDistance || 10}km</span>
                </div>
                <div style="font-size:13px; color:#16a34a; font-weight:bold; margin-bottom:6px;">${worker.phone}</div>
                ${worker.portfolioUrls && worker.portfolioUrls.length > 0 ? `<div style="font-size:11px; color:#0369a1; background:#e0f2fe; display:inline-block; padding:2px 6px; border-radius:4px;">📸 작업사진 있음</div>` : ''}
            </div>
        `;

        return {
            lat: worker.coordinates.lat,
            lng: worker.coordinates.lng,
            title: worker.displayName,
            content: content
        };
    });
    setMarkers(newMarkers);
  }, [workers]);

  return (
    <div className="pb-10 h-[calc(100vh-100px)] flex flex-col">
      <div className="mb-4 flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">우리동네 반장 찾기</h1>
            <p className="text-gray-500 text-sm">검증된 벌초 전문가를 지도에서 찾아보세요.</p>
        </div>
        {user?.role === 'WORKER' && (
             <Link to="/worker-settings" className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition">
                 <Settings size={14}/> 내 위치 관리
             </Link>
        )}
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden relative flex flex-col">
          {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                  <span className="text-gray-500">데이터를 불러오는 중...</span>
              </div>
          ) : (
            <>
                 <KakaoMap markers={markers} readOnly={true} />
                 <div className="p-4 bg-gray-50 border-t border-gray-200 overflow-y-auto max-h-[300px]">
                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-600"/>
                        활동 중인 반장님 ({workers.length}명)
                    </h3>
                    {workers.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">현재 활동 중인 반장님이 없습니다.</p>}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {workers.map((worker, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col gap-2">
                                <div className="flex items-start gap-3">
                                    <div className="bg-green-100 p-2 rounded-full text-green-700 mt-1">
                                        <User size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div className="font-bold text-gray-800 text-lg truncate">{worker.displayName}</div>
                                            <div className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                반경 {worker.maxDistance || 10}km
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500 mb-1 truncate">{worker.address}</div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                                            <span className="flex items-center gap-1"><Award size={12} className="text-orange-400"/> 경력 {worker.experienceYears}년</span>
                                            <span className="w-[1px] h-3 bg-gray-300"></span>
                                            <span>장비 {worker.equipmentCount || 1}대</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {worker.portfolioUrls && worker.portfolioUrls.length > 0 && (
                                    <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                                        {worker.portfolioUrls.slice(0, 3).map((url, i) => (
                                            <img key={i} src={url} alt="work" className="w-16 h-16 rounded object-cover flex-shrink-0 border border-gray-100" />
                                        ))}
                                        {worker.portfolioUrls.length > 3 && (
                                            <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                                                +{worker.portfolioUrls.length - 3}
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                <div className="mt-auto pt-2 border-t border-gray-50 flex justify-between items-center">
                                    <div className="text-sm font-bold text-green-700 flex items-center gap-1">
                                        <Phone size={14} /> {worker.phone}
                                    </div>
                                    <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded transition">
                                        상세보기
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
            </>
          )}
      </div>
    </div>
  );
};

export default WorkersMap;