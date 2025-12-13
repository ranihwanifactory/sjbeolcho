import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { WorkerProfile } from '../types.ts';
import KakaoMap, { MapMarkerData } from '../components/KakaoMap';
import { Phone, User, Award, CheckCircle } from 'lucide-react';

const WorkersMap: React.FC = () => {
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [markers, setMarkers] = useState<MapMarkerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'worker_profiles'));
        const workerData: WorkerProfile[] = [];
        querySnapshot.forEach((doc) => {
          workerData.push(doc.data() as WorkerProfile);
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
            <div style="padding:10px; min-width:200px; font-family:sans-serif;">
                <div style="font-weight:bold; margin-bottom:4px; font-size:16px; color:#166534;">${worker.displayName} 반장님</div>
                <div style="font-size:12px; color:#555; margin-bottom:8px;">${worker.address}</div>
                <div style="font-size:13px; margin-bottom:4px;">경력: ${worker.experienceYears}년</div>
                <div style="font-size:13px; color:#16a34a; font-weight:bold;">${worker.phone}</div>
                <p style="font-size:12px; color:#666; margin-top:5px; border-top:1px solid #eee; padding-top:5px;">${worker.bio || '안녕하세요, 정성을 다하겠습니다.'}</p>
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
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">우리동네 반장 찾기</h1>
        <p className="text-gray-500 text-sm">지도에서 가까운 벌초 전문가를 찾아보세요.</p>
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
                        등록된 반장님 ({workers.length}명)
                    </h3>
                    {workers.length === 0 && <p className="text-sm text-gray-400">등록된 반장님이 없습니다.</p>}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {workers.map((worker, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-start gap-3">
                                <div className="bg-green-100 p-2 rounded-full text-green-700">
                                    <User size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-800">{worker.displayName}</div>
                                    <div className="text-xs text-gray-500 mb-1">{worker.address}</div>
                                    <div className="text-sm font-bold text-green-700 flex items-center gap-1">
                                        <Phone size={12} /> {worker.phone}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                        <Award size={12} className="text-orange-400"/> 경력 {worker.experienceYears}년
                                    </div>
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