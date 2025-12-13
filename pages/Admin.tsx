import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, where, getDocs } from 'firebase/firestore';
import { Reservation, ReservationStatus, UserRole, WorkerProfile } from '../types.ts';
import { useNavigate } from 'react-router-dom';
import { Phone, MapPin, Calendar, CheckSquare, MessageCircle, Map as MapIcon, X, Trash2, Users, ClipboardList } from 'lucide-react';
import KakaoMap from '../components/KakaoMap';

const Admin: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'reservations' | 'workers'>('reservations');
  
  // Reservations State
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedMapLocation, setSelectedMapLocation] = useState<{lat: number, lng: number, name: string} | null>(null);

  // Workers State
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);

  useEffect(() => {
    if (!user || user.role !== UserRole.ADMIN) {
      navigate('/');
      return;
    }

    // Subscribe to Reservations
    const qRes = query(collection(db, 'reservations'), orderBy('createdAt', 'desc'));
    const unsubscribeRes = onSnapshot(qRes, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
      setReservations(data);
    });

    // Fetch Workers (Real-time not strictly necessary but good)
    const qWork = query(collection(db, 'worker_profiles'));
    const unsubscribeWork = onSnapshot(qWork, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as WorkerProfile));
        setWorkers(data);
    });

    return () => {
        unsubscribeRes();
        unsubscribeWork();
    };
  }, [user, navigate]);

  const updateStatus = async (id: string, status: ReservationStatus) => {
    if (window.confirm(`상태를 '${status}'(으)로 변경하시겠습니까?`)) {
        await updateDoc(doc(db, 'reservations', id), { status });
    }
  };

  const handleDelete = async (id: string) => {
      if (window.confirm("정말로 이 예약 내역을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.")) {
          try {
              await deleteDoc(doc(db, 'reservations', id));
          } catch (error) {
              console.error("Error deleting document: ", error);
              alert("삭제 중 오류가 발생했습니다.");
          }
      }
  };

  const openMapModal = (lat: number, lng: number, name: string) => {
      if (lat && lng) {
          setSelectedMapLocation({ lat, lng, name });
      } else {
          alert("위치 정보가 올바르지 않습니다.");
      }
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
      </h1>
      
      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('reservations')}
            className={`pb-3 px-2 flex items-center gap-2 font-bold transition ${activeTab === 'reservations' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
              <ClipboardList size={20} />
              예약 관리 ({reservations.length})
          </button>
          <button 
            onClick={() => setActiveTab('workers')}
            className={`pb-3 px-2 flex items-center gap-2 font-bold transition ${activeTab === 'workers' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
              <Users size={20} />
              반장님 관리 ({workers.length})
          </button>
      </div>
      
      {/* Reservations Tab */}
      {activeTab === 'reservations' && (
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
                            {res.coordinates && (
                                <button 
                                    onClick={() => openMapModal(res.coordinates.lat, res.coordinates.lng, res.locationName)}
                                    className="ml-2 text-brand-600 underline text-xs inline-flex items-center font-bold hover:text-brand-800"
                                >
                                    <MapIcon size={12} className="mr-1"/> 지도보기 (마커확인)
                                </button>
                            )}
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

                <div className="flex gap-2 overflow-x-auto pb-1 items-center">
                    {Object.values(ReservationStatus).map((status) => (
                        <button
                            key={status}
                            onClick={() => updateStatus(res.id, status as ReservationStatus)}
                            className={`px-3 py-1.5 rounded-full text-xs border whitespace-nowrap transition ${res.status === status ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                        >
                            {status}로 변경
                        </button>
                    ))}
                    <div className="w-[1px] h-6 bg-gray-300 mx-1"></div>
                    <button
                        onClick={() => handleDelete(res.id)}
                        className="px-3 py-1.5 rounded-full text-xs border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 whitespace-nowrap transition flex items-center gap-1"
                    >
                        <Trash2 size={12} /> 삭제
                    </button>
                </div>
            </div>
            ))}

            {reservations.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    접수된 예약이 없습니다.
                </div>
            )}
        </div>
      )}

      {/* Workers Tab */}
      {activeTab === 'workers' && (
          <div className="space-y-4">
              {workers.map(worker => (
                  <div key={worker.uid} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-start">
                      <div className="bg-brand-50 p-3 rounded-full hidden md:block">
                          <Users size={24} className="text-brand-600"/>
                      </div>
                      <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-800">{worker.displayName} <span className="text-xs text-brand-600 font-normal bg-brand-100 px-2 py-0.5 rounded-full">반장님</span></h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2"><Phone size={14}/> {worker.phone}</div>
                              <div className="flex items-center gap-2"><MapPin size={14}/> {worker.address}</div>
                              <div><strong>경력:</strong> {worker.experienceYears}년</div>
                              <div><strong>소개:</strong> {worker.bio}</div>
                          </div>
                      </div>
                      <div>
                          <button 
                             onClick={() => openMapModal(worker.coordinates.lat, worker.coordinates.lng, `${worker.displayName} 반장님 활동지`)}
                             className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200"
                          >
                              위치 확인
                          </button>
                      </div>
                  </div>
              ))}
              {workers.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    등록된 반장님이 없습니다.
                </div>
            )}
          </div>
      )}

      {/* Map Modal */}
      {selectedMapLocation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative">
                  <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                          <MapPin size={18} className="text-brand-600"/>
                          위치 확인
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