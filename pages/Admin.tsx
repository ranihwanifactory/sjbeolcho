import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Reservation, ReservationStatus, UserRole } from '../types.ts';
import { useNavigate } from 'react-router-dom';
import { Phone, MapPin, Calendar, CheckSquare, MessageCircle, Map as MapIcon, X } from 'lucide-react';
import KakaoMap from '../components/KakaoMap';

const Admin: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedMapLocation, setSelectedMapLocation] = useState<{lat: number, lng: number, name: string} | null>(null);

  useEffect(() => {
    if (!user || user.role !== UserRole.ADMIN) {
      navigate('/');
      return;
    }

    const q = query(collection(db, 'reservations'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
      setReservations(data);
    });

    return () => unsubscribe();
  }, [user, navigate]);

  const updateStatus = async (id: string, status: ReservationStatus) => {
    if (window.confirm(`상태를 '${status}'(으)로 변경하시겠습니까?`)) {
        await updateDoc(doc(db, 'reservations', id), { status });
    }
  };

  const openMapModal = (lat: number, lng: number, name: string) => {
      setSelectedMapLocation({ lat, lng, name });
  };

  const closeMapModal = () => {
      setSelectedMapLocation(null);
  }

  const statusColors = {
    [ReservationStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [ReservationStatus.CONFIRMED]: 'bg-blue-100 text-blue-800',
    [ReservationStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [ReservationStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="pb-8 relative">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-between">
          <span>관리자 대시보드</span>
          <span className="text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">총 {reservations.length}건</span>
      </h1>
      
      <div className="space-y-4">
        {reservations.map((res) => (
          <div key={res.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-lg">{res.userName}</h3>
                    <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                        <Phone size={14} /> <a href={`tel:${res.userPhone}`} className="underline">{res.userPhone}</a>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${statusColors[res.status] || 'bg-gray-100'}`}>
                        {res.status}
                    </span>
                    <button onClick={() => navigate('/chat')} className="text-xs text-brand-600 flex items-center gap-1">
                        <MessageCircle size={12}/> 채팅하기
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg mb-4">
                <div className="flex items-start gap-2">
                    <Calendar size={16} className="mt-0.5 text-gray-400" />
                    <span><span className="font-semibold">작업 희망일:</span> {res.requestDate}</span>
                </div>
                <div className="flex items-start gap-2">
                    <MapPin size={16} className="mt-0.5 text-gray-400" />
                    <div className="flex-1">
                        <span className="font-semibold">위치:</span> {res.locationName}
                        <button 
                            onClick={() => openMapModal(res.coordinates.lat, res.coordinates.lng, res.locationName)}
                            className="ml-2 text-brand-600 underline text-xs inline-flex items-center font-bold hover:text-brand-800"
                        >
                            <MapIcon size={12} className="mr-1"/> 지도보기 (마커확인)
                        </button>
                    </div>
                </div>
                {res.description && (
                     <div className="flex items-start gap-2 col-span-1">
                        <CheckSquare size={16} className="mt-0.5 text-gray-400" />
                        <span><span className="font-semibold">요청사항:</span> {res.description}</span>
                    </div>
                )}
                {res.imageUrls && res.imageUrls.length > 0 && (
                    <div className="mt-2">
                        <p className="font-semibold mb-1 text-xs text-gray-500">첨부 사진</p>
                        <div className="flex gap-2">
                            {res.imageUrls.map((url, idx) => (
                                <a key={idx} href={url} target="_blank" rel="noreferrer">
                                    <img src={url} alt="attachment" className="w-16 h-16 object-cover rounded border border-gray-300" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
                {Object.values(ReservationStatus).map((status) => (
                    <button
                        key={status}
                        onClick={() => updateStatus(res.id, status as ReservationStatus)}
                        className={`px-3 py-1.5 rounded-full text-xs border whitespace-nowrap transition ${res.status === status ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                    >
                        {status}로 변경
                    </button>
                ))}
            </div>
          </div>
        ))}

        {reservations.length === 0 && (
            <div className="text-center py-10 text-gray-500">
                접수된 예약이 없습니다.
            </div>
        )}
      </div>

      {/* Map Modal */}
      {selectedMapLocation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative">
                  <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                          <MapPin size={18} className="text-brand-600"/>
                          예약 위치 확인
                      </h3>
                      <button onClick={closeMapModal} className="p-1 rounded-full hover:bg-gray-200 transition">
                          <X size={24} />
                      </button>
                  </div>
                  <div className="p-4">
                      <KakaoMap 
                          readOnly={true} 
                          initialLat={selectedMapLocation.lat} 
                          initialLng={selectedMapLocation.lng} 
                      />
                      <p className="mt-3 text-sm text-gray-600 bg-gray-100 p-2 rounded">
                          <span className="font-bold">주소/명칭:</span> {selectedMapLocation.name}
                      </p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Admin;