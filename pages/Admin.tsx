
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, doc, setDoc, updateDoc, deleteDoc, where, getDocs, writeBatch } from 'firebase/firestore';
import { Reservation, ReservationStatus, UserRole, WorkerProfile } from '../types';
import { useNavigate } from 'react-router-dom';
import { Phone, MapPin, Calendar, CheckSquare, MessageCircle, Map as MapIcon, X, Trash2, Users, ClipboardList, CheckCircle, AlertTriangle, User as UserIcon, Loader2, Edit3, Save } from 'lucide-react';
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
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // User Edit Modal State
  const [editUserModal, setEditUserModal] = useState<UserData | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');

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

    const qUsers = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserData));
        data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
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
        try {
            await updateDoc(doc(db, 'reservations', id), { status });
        } catch (e) {
            console.error(e);
            alert("상태 변경 권한이 없습니다.");
        }
    }
  };

  const handleApproveWorker = async (workerId: string) => {
      if (window.confirm("이 반장님을 승인하시겠습니까?")) {
          setActionLoading(workerId);
          try {
              const batch = writeBatch(db);
              batch.set(doc(db, 'worker_profiles', workerId), { isApproved: true }, { merge: true });
              batch.set(doc(db, 'users', workerId), { role: UserRole.WORKER }, { merge: true });
              await batch.commit();
              alert("반장 승인 및 권한 변경이 완료되었습니다.");
          } catch (error: any) {
              console.error("Approve failed:", error);
              alert("승인 처리 중 오류가 발생했습니다.");
          } finally {
              setActionLoading(null);
          }
      }
  };

  const handleRevokeWorker = async (workerId: string) => {
      if (window.confirm("반장 승인을 취소하고 일반 회원으로 변경하시겠습니까?")) {
          setActionLoading(workerId);
          try {
              const batch = writeBatch(db);
              batch.set(doc(db, 'worker_profiles', workerId), { isApproved: false }, { merge: true });
              batch.set(doc(db, 'users', workerId), { role: UserRole.CUSTOMER }, { merge: true });
              await batch.commit();
              alert("승인 취소 및 권한 변경 완료.");
          } catch (error: any) {
              console.error(error);
              alert("취소 처리 중 오류가 발생했습니다.");
          } finally {
              setActionLoading(null);
          }
      }
  };

  const handleChangeRole = async (uid: string, newRole: UserRole) => {
      if (uid === user?.uid) {
          alert("본인의 권한은 변경할 수 없습니다.");
          return;
      }
      setActionLoading(uid);
      try {
          await setDoc(doc(db, 'users', uid), { role: newRole }, { merge: true });
          alert("권한이 변경되었습니다.");
      } catch(error: any) {
          console.error(error);
          alert("권한 변경 실패");
      } finally {
          setActionLoading(null);
      }
  }

  // --- Member Edit Logic ---
  const openEditModal = (targetUser: UserData) => {
      setEditUserModal(targetUser);
      setEditUserName(targetUser.name || '');
      setEditUserEmail(targetUser.email || '');
  };

  const closeEditModal = () => {
      setEditUserModal(null);
  };

  const saveUserEdit = async () => {
      if (!editUserModal) return;
      if (!editUserName.trim()) {
          alert("이름을 입력해주세요.");
          return;
      }

      setActionLoading(editUserModal.uid);
      try {
          const batch = writeBatch(db);
          
          // 1. Update user info
          batch.set(doc(db, 'users', editUserModal.uid), {
              name: editUserName,
              email: editUserEmail
          }, { merge: true });

          // 2. If user is a worker, also update the worker profile
          if (editUserModal.role === UserRole.WORKER) {
              batch.set(doc(db, 'worker_profiles', editUserModal.uid), {
                  displayName: editUserName
              }, { merge: true });
          }

          await batch.commit();
          alert("회원 정보가 수정되었습니다.");
          closeEditModal();
      } catch (error) {
          console.error(error);
          alert("수정 중 오류가 발생했습니다.");
      } finally {
          setActionLoading(null);
      }
  };

  const handleDeleteUser = async (uid: string, name: string) => {
      if (uid === user?.uid) {
          alert("본인 계정은 삭제할 수 없습니다.");
          return;
      }

      if (window.confirm(`정말로 '${name}' 회원을 시스템에서 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며 반장 프로필도 함께 삭제됩니다.`)) {
          setActionLoading(uid);
          try {
              const batch = writeBatch(db);
              
              // Delete user record
              batch.delete(doc(db, 'users', uid));
              
              // Delete worker profile if exists
              batch.delete(doc(db, 'worker_profiles', uid));
              
              await batch.commit();
              alert("회원이 삭제되었습니다.");
          } catch (error) {
              console.error(error);
              alert("삭제 중 오류가 발생했습니다.");
          } finally {
              setActionLoading(null);
          }
      }
  };

  const openMapModal = (lat: number, lng: number, name: string) => {
      if (lat && lng) setSelectedMapLocation({ lat, lng, name });
  };

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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">관리자 대시보드</h1>
      
      <div className="flex gap-4 mb-6 border-b border-gray-200 overflow-x-auto">
          <button onClick={() => setActiveTab('reservations')} className={`pb-3 px-2 flex items-center gap-2 font-bold transition whitespace-nowrap ${activeTab === 'reservations' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-400 hover:text-gray-600'}`}><ClipboardList size={20} />예약 관리</button>
          <button onClick={() => setActiveTab('workers')} className={`pb-3 px-2 flex items-center gap-2 font-bold transition whitespace-nowrap ${activeTab === 'workers' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-400 hover:text-gray-600'}`}><Users size={20} />반장님 관리 {pendingWorkers.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{pendingWorkers.length}</span>}</button>
          <button onClick={() => setActiveTab('users')} className={`pb-3 px-2 flex items-center gap-2 font-bold transition whitespace-nowrap ${activeTab === 'users' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-400 hover:text-gray-600'}`}><UserIcon size={20} />회원 관리</button>
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
                    <div className="flex items-start gap-2"><Calendar size={16} className="mt-0.5 text-gray-400" /><span>작업 희망일: {res.requestDate}</span></div>
                    <div className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 text-gray-400" /><div className="flex-1">위치: {res.locationName} <button onClick={() => openMapModal(res.coordinates.lat, res.coordinates.lng, res.locationName)} className="ml-2 text-brand-600 underline text-xs font-bold">지도보기</button></div></div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 items-center">
                    {Object.values(ReservationStatus).map((status) => (
                        <button key={status} onClick={() => updateStatus(res.id, status as ReservationStatus)} className={`px-3 py-1.5 rounded-full text-xs border whitespace-nowrap transition ${res.status === status ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>{status} 변경</button>
                    ))}
                </div>
            </div>
            ))}
        </div>
      )}

      {activeTab === 'workers' && (
          <div className="space-y-8">
              {pendingWorkers.length > 0 && (
                  <div>
                      <h3 className="text-lg font-bold text-yellow-700 mb-3 flex items-center gap-2"><AlertTriangle size={20}/> 승인 대기</h3>
                      <div className="space-y-4">
                          {pendingWorkers.map(worker => (
                              <div key={worker.uid} className="bg-yellow-50 p-5 rounded-xl border border-yellow-200 flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                                      {worker.photoUrl ? <img src={worker.photoUrl} className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full p-2 text-gray-400" />}
                                  </div>
                                  <div className="flex-1">
                                      <h3 className="font-bold">{worker.displayName}</h3>
                                      <p className="text-xs text-gray-600">{worker.address}</p>
                                  </div>
                                  <button 
                                    onClick={() => handleApproveWorker(worker.uid)} 
                                    disabled={actionLoading === worker.uid}
                                    className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
                                  >
                                      {actionLoading === worker.uid ? <Loader2 className="animate-spin" size={16}/> : '승인하기'}
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
              <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2"><CheckCircle size={20} className="text-green-600"/> 활동 중인 반장님</h3>
                  <div className="space-y-4">
                    {activeWorkers.map(worker => (
                        <div key={worker.uid} className="bg-white p-5 rounded-xl border border-gray-200 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                                {worker.photoUrl ? <img src={worker.photoUrl} className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full p-2 text-gray-400" />}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold">{worker.displayName}</h3>
                                <p className="text-xs text-gray-500">{worker.phone} | {worker.experienceYears}년 경력</p>
                            </div>
                            <button 
                                onClick={() => handleRevokeWorker(worker.uid)} 
                                disabled={actionLoading === worker.uid}
                                className="text-xs border border-red-200 text-red-600 px-3 py-2 rounded hover:bg-red-50 disabled:opacity-50"
                            >
                                {actionLoading === worker.uid ? <Loader2 className="animate-spin" size={14}/> : '승인 취소'}
                            </button>
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
                     <thead className="bg-gray-50 text-gray-700 font-bold border-b">
                         <tr>
                             <th className="p-4">이름</th>
                             <th className="p-4">이메일</th>
                             <th className="p-4">구분(Role)</th>
                             <th className="p-4">가입일</th>
                             <th className="p-4">관리</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                         {allUsers.map(u => (
                             <tr key={u.uid} className="hover:bg-gray-50">
                                 <td className="p-4 font-medium text-gray-900">{u.name}</td>
                                 <td className="p-4">{u.email}</td>
                                 <td className="p-4">
                                     {actionLoading === u.uid ? (
                                         <Loader2 className="animate-spin text-brand-600" size={16}/>
                                     ) : (
                                        <select 
                                            value={u.role || UserRole.CUSTOMER} 
                                            onChange={(e) => handleChangeRole(u.uid, e.target.value as UserRole)} 
                                            className={`px-2 py-1 rounded text-xs font-bold border border-gray-300 focus:outline-none ${u.role === UserRole.ADMIN ? 'bg-red-100 text-red-700' : u.role === UserRole.WORKER ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}
                                        >
                                            <option value={UserRole.CUSTOMER}>일반</option>
                                            <option value={UserRole.WORKER}>반장</option>
                                            <option value={UserRole.ADMIN}>관리자</option>
                                        </select>
                                     )}
                                 </td>
                                 <td className="p-4 text-xs">{u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : '-'}</td>
                                 <td className="p-4 flex items-center gap-2">
                                     <button onClick={() => openEditModal(u)} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition" title="정보 수정">
                                         <Edit3 size={18} />
                                     </button>
                                     <button onClick={() => handleDeleteUser(u.uid, u.name)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="회원 삭제">
                                         <Trash2 size={18} />
                                     </button>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
          </div>
      )}

      {/* Map Preview Modal */}
      {selectedMapLocation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative">
                  <div className="p-4 border-b flex justify-between items-center"><h3 className="font-bold flex items-center gap-2">위치 확인</h3><button onClick={() => setSelectedMapLocation(null)}><X size={24} /></button></div>
                  <div className="p-4"><KakaoMap readOnly={true} initialLat={selectedMapLocation.lat} initialLng={selectedMapLocation.lng} /><p className="mt-3 text-sm text-gray-600 bg-gray-100 p-2 rounded">{selectedMapLocation.name}</p></div>
              </div>
          </div>
      )}

      {/* User Edit Modal */}
      {editUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative">
                  <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800">
                          <UserIcon className="text-brand-600" size={20}/>
                          회원 정보 수정
                      </h3>
                      <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">성함</label>
                          <input 
                            type="text" 
                            value={editUserName} 
                            onChange={(e) => setEditUserName(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                            placeholder="성함 입력"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">이메일</label>
                          <input 
                            type="email" 
                            value={editUserEmail} 
                            onChange={(e) => setEditUserEmail(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                            placeholder="이메일 입력"
                          />
                      </div>
                      <p className="text-xs text-gray-400">
                          * 이름 수정 시 반장 프로필의 활동명도 자동으로 변경됩니다.
                      </p>
                  </div>
                  <div className="p-5 bg-gray-50 flex gap-3">
                      <button onClick={closeEditModal} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition">취소</button>
                      <button 
                        onClick={saveUserEdit} 
                        disabled={actionLoading === editUserModal.uid}
                        className="flex-1 py-3 bg-brand-600 text-white font-bold hover:bg-brand-700 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
                      >
                          {actionLoading === editUserModal.uid ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                          저장하기
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Admin;
