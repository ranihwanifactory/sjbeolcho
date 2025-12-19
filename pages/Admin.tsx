
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, where, getDocs } from 'firebase/firestore';
import { Reservation, ReservationStatus, UserRole, WorkerProfile } from '../types';
import { useNavigate } from 'react-router-dom';
import { Phone, MapPin, Calendar, CheckSquare, MessageCircle, Map as MapIcon, X, Trash2, Users, ClipboardList, CheckCircle, AlertTriangle, User as UserIcon } from 'lucide-react';
import KakaoMap from '../components/KakaoMap';

interface UserData {
    uid: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt?: any;
}

const Admin: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'reservations' | 'workers' | 'users'>('reservations');
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedMapLocation, setSelectedMapLocation] = useState<{lat: number, lng: number, name: string} | null>(null);
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [selectedWorkerForPortfolio, setSelectedWorkerForPortfolio] = useState<WorkerProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);

  useEffect(() => {
    if (!user || user.role !== UserRole.ADMIN) {
      navigate('/');
      return;
    }

    const qRes = query(collection(db, 'reservations'), orderBy('createdAt', 'desc'));
    const unsubscribeRes = onSnapshot(qRes, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
      setReservations(data);
    });

    const qWork = query(collection(db, 'worker_profiles'));
    const unsubscribeWork = onSnapshot(qWork, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as WorkerProfile));
        setWorkers(data);
    });

    const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserData));
        setAllUsers(data);
    });

    return () => {
        unsubscribeRes();
        unsubscribeWork();
        unsubscribeUsers();
    };
  }, [user, navigate]);

  const updateStatus = async (id: string, status: ReservationStatus) => {
    if (window.confirm(`상태를 '${status}'(으)로 변경하시겠습니까?`)) {
        await updateDoc(doc(db, 'reservations', id), { status });
    }
  };

  const handleDelete = async (id: string) => {
      if (window.confirm("정말로 이 예약 내역을 삭제하시겠습니까?")) {
          try {
              await deleteDoc(doc(db, 'reservations', id));
          } catch (error) {
              console.error(error);
          }
      }
  };

  const handleApproveWorker = async (workerId: string) => {
      if (window.confirm("이 반장님을 승인하시겠습니까?")) {
          try {
              await updateDoc(doc(db, 'worker_profiles', workerId), { isApproved: true });
              await updateDoc(doc(db, 'users', workerId), { role: UserRole.WORKER });
              alert("승인 완료");
          } catch (error) {
              console.error(error);
          }
      }
  };

  const handleRevokeWorker = async (workerId: string) => {
      if (window.confirm("승인을 취소하시겠습니까?")) {
          try {
              await updateDoc(doc(db, 'worker_profiles', workerId), { isApproved: false });
              await updateDoc(doc(db, 'users', workerId), { role: UserRole.CUSTOMER });
              alert("취소 완료");
          } catch (error) {
              console.error(error);
          }
      }
  };

  const handleChangeRole = async (uid: string, newRole: UserRole) => {
      if (uid === user?.uid) return;
      if(window.confirm(`권한을 '${newRole}'(으)로 변경하시겠습니까?`)) {
          try {
              await updateDoc(doc(db, 'users', uid), { role: newRole });
          } catch(error) {
              console.error(error);
          }
      }
  }

  const openMapModal = (lat: number, lng: number, name: string) => {
      if (lat && lng) setSelectedMapLocation({ lat, lng, name });
  };

  const closeMapModal = () => setSelectedMapLocation(null);

  const statusColors = {
    [ReservationStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [ReservationStatus.CONFIRMED]: 'bg-blue-100 text-blue-800',
    [ReservationStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [ReservationStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
  };

  const pendingWorkers = workers.filter(w => !w.isApproved);
  const activeWorkers = workers.filter(w => w.isApproved);

  return (
    <div className="pb-8 relative">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-between"><span>관리자 대시보드</span></h1>
      
      <div className="flex gap-4 mb-6 border-b border-gray-200 overflow-x-auto">
          <button onClick={() => setActiveTab('reservations')} className={`pb-3 px-2 flex items-center gap-2 font-bold transition whitespace-nowrap ${activeTab === 'reservations' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-400 hover:text-gray-600'}`}><ClipboardList size={20} />예약 관리 ({reservations.length})</button>
          <button onClick={() => setActiveTab('workers')} className={`pb-3 px-2 flex items-center gap-2 font-bold transition whitespace-nowrap ${activeTab === 'workers' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-400 hover:text-gray-600'}`}><Users size={20} />반장님 관리 ({workers.length}){pendingWorkers.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{pendingWorkers.length}</span>}</button>
          <button onClick={() => setActiveTab('users')} className={`pb-3 px-2 flex items-center gap-2 font-bold transition whitespace-nowrap ${activeTab === 'users' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-400 hover:text-gray-600'}`}><UserIcon size={20} />회원 관리 ({allUsers.length})</button>
      </div>
      
      {activeTab === 'reservations' && (
        <div className="space-y-4">
            {reservations.map((res) => (
            <div key={res.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-lg">{res.userName}</h3>
                        <div className="flex items-center gap-1 text-gray-500 text-sm mt-1"><Phone size={14} /> {res.userPhone}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${statusColors[res.status] || 'bg-gray-100'}`}>{res.status}</span>
                </div>
                <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg mb-4">
                    <div className="flex items-start gap-2"><Calendar size={16} className="mt-0.5 text-gray-400" /><span><span className="font-semibold">작업 희망일:</span> {res.requestDate}</span></div>
                    <div className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 text-gray-400" /><div className="flex-1"><span className="font-semibold">위치:</span> {res.locationName} <button onClick={() => openMapModal(res.coordinates.lat, res.coordinates.lng, res.locationName)} className="ml-2 text-brand-600 underline text-xs font-bold hover:text-brand-800">지도보기</button></div></div>
                    {res.description && <div className="flex items-start gap-2 col-span-1"><CheckSquare size={16} className="mt-0.5 text-gray-400" /><span><span className="font-semibold">요청사항:</span> {res.description}</span></div>}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 items-center">
                    {Object.values(ReservationStatus).map((status) => (
                        <button key={status} onClick={() => updateStatus(res.id, status as ReservationStatus)} className={`px-3 py-1.5 rounded-full text-xs border whitespace-nowrap transition ${res.status === status ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>{status}로 변경</button>
                    ))}
                    <button onClick={() => handleDelete(res.id)} className="px-3 py-1.5 rounded-full text-xs border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition flex items-center gap-1 ml-auto"><Trash2 size={12} /> 삭제</button>
                </div>
            </div>
            ))}
        </div>
      )}

      {activeTab === 'workers' && (
          <div className="space-y-8">
              {pendingWorkers.length > 0 && (
                  <div>
                      <h3 className="text-lg font-bold text-yellow-700 mb-3 flex items-center gap-2"><AlertTriangle size={20}/> 승인 대기 ({pendingWorkers.length})</h3>
                      <div className="space-y-4">
                          {pendingWorkers.map(worker => (
                              <div key={worker.uid} className="bg-yellow-50 p-5 rounded-xl shadow-sm border border-yellow-200 flex flex-col md:flex-row gap-4 items-center">
                                  <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 border-2 border-white">
                                      {worker.photoUrl ? <img src={worker.photoUrl} className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full p-3 text-gray-400" />}
                                  </div>
                                  <div className="flex-1 w-full text-center md:text-left">
                                      <h3 className="font-bold text-lg">{worker.displayName}</h3>
                                      <p className="text-sm text-gray-600">{worker.phone} | {worker.address}</p>
                                  </div>
                                  <button onClick={() => handleApproveWorker(worker.uid)} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md">승인하기</button>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
              <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2"><CheckCircle size={20} className="text-green-600"/> 활동 중인 반장님 ({activeWorkers.length})</h3>
                  <div className="space-y-4">
                    {activeWorkers.map(worker => (
                        <div key={worker.uid} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center">
                            <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 border-2 border-brand-50 shadow-sm">
                                {worker.photoUrl ? <img src={worker.photoUrl} className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full p-3 text-gray-400" />}
                            </div>
                            <div className="flex-1 w-full text-center md:text-left">
                                <h3 className="font-bold text-lg">{worker.displayName}</h3>
                                <div className="text-sm text-gray-600 flex flex-wrap justify-center md:justify-start gap-3">
                                    <span>{worker.phone}</span>
                                    <span>{worker.experienceYears}년 경력</span>
                                    <span>활동반경 {worker.maxDistance}km</span>
                                </div>
                            </div>
                            <button onClick={() => handleRevokeWorker(worker.uid)} className="text-xs border border-red-200 text-red-600 hover:bg-red-50 px-3 py-2 rounded">승인 취소</button>
                        </div>
                    ))}
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-gray-600">
                     <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                         <tr><th className="p-4">이름</th><th className="p-4">이메일</th><th className="p-4">구분(Role)</th><th className="p-4">가입일</th></tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                         {allUsers.map(user => (
                             <tr key={user.uid} className="hover:bg-gray-50">
                                 <td className="p-4 font-medium text-gray-900">{user.name}</td>
                                 <td className="p-4">{user.email}</td>
                                 <td className="p-4">
                                     <select value={user.role || UserRole.CUSTOMER} onChange={(e) => handleChangeRole(user.uid, e.target.value as UserRole)} className={`px-2 py-1 rounded text-xs font-bold border border-gray-300 ${user.role === UserRole.ADMIN ? 'bg-red-100 text-red-700' : user.role === UserRole.WORKER ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                                         <option value={UserRole.CUSTOMER}>일반</option><option value={UserRole.WORKER}>반장</option><option value={UserRole.ADMIN}>관리자</option>
                                     </select>
                                 </td>
                                 <td className="p-4 text-xs">{user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : '-'}</td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
          </div>
      )}

      {selectedMapLocation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative">
                  <div className="p-4 border-b flex justify-between items-center bg-gray-50"><h3 className="font-bold flex items-center gap-2"><MapPin size={18} className="text-brand-600"/>위치 확인</h3><button onClick={closeMapModal}><X size={24} /></button></div>
                  <div className="p-4"><KakaoMap readOnly={true} initialLat={selectedMapLocation.lat} initialLng={selectedMapLocation.lng} /><p className="mt-3 text-sm text-gray-600 bg-gray-100 p-2 rounded">{selectedMapLocation.name}</p></div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Admin;
