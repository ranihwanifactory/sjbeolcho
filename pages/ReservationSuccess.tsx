import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Home, MessageCircle, Calendar, MapPin, User, ArrowRight } from 'lucide-react';

const ReservationSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reservation = location.state?.reservation;

  if (!reservation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="bg-gray-100 p-4 rounded-full mb-4">
            <CheckCircle size={48} className="text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">예약 정보가 없습니다.</h1>
        <p className="text-gray-500 mb-6">정상적인 경로로 접근해주세요.</p>
        <Link to="/" className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold">홈으로 이동</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-100 text-brand-600 rounded-full mb-6 animate-bounce-slight">
          <CheckCircle size={48} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">예약이 접수되었습니다!</h1>
        <p className="text-gray-600">관리자가 확인 후 빠른 시일 내에 연락드리겠습니다.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
        <div className="bg-brand-600 px-6 py-4 text-white">
          <h2 className="font-bold flex items-center gap-2">
            <Calendar size={18} /> 예약 신청 요약
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
              <User size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">신청자</p>
              <p className="text-lg font-bold text-gray-800">{reservation.userName}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">작업 위치</p>
              <p className="text-gray-800 font-medium leading-relaxed">{reservation.locationName}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">희망 작업일</p>
              <p className="text-gray-800 font-bold">{reservation.requestDate}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            상세 견적 및 일정 조율은 <span className="text-brand-600 font-bold">1:1 채팅</span>으로 안내해 드립니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button 
          onClick={() => navigate('/chat')}
          className="flex items-center justify-center gap-2 bg-white border-2 border-brand-600 text-brand-600 font-bold py-4 rounded-xl hover:bg-brand-50 transition shadow-sm"
        >
          <MessageCircle size={20} />
          실시간 상담하기
        </button>
        <button 
          onClick={() => navigate('/')}
          className="flex items-center justify-center gap-2 bg-brand-600 text-white font-bold py-4 rounded-xl hover:bg-brand-700 transition shadow-lg shadow-brand-100"
        >
          <Home size={20} />
          홈으로 가기
        </button>
      </div>

      <div className="mt-12 text-center">
        <p className="text-xs text-gray-400">
          예약 번호: {reservation.id.substring(0, 8).toUpperCase()}<br/>
          접수 일시: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default ReservationSuccess;