import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin, Mail, CheckCircle, Calendar, MessageCircle } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-video bg-gray-900">
        <img 
          src="https://picsum.photos/800/450?grayscale&blur=2" 
          alt="Beolcho Background" 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-4">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2">경북 성주권 전문<br/>젊은 벌초 대행</h1>
          <p className="text-gray-200 text-sm sm:text-base mb-6">정성을 다해 조상님의 묘소를 관리해드립니다.</p>
          <Link to="/reserve" className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:scale-105">
            예약 바로가기
          </Link>
        </div>
      </div>

      {/* Service Info Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="bg-brand-100 p-3 rounded-full mb-2 text-brand-600">
                <MapPin size={24} />
            </div>
            <h3 className="font-bold text-gray-800">위성 지도 접수</h3>
            <p className="text-xs text-gray-500 mt-1">정확한 위치 파악</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="bg-brand-100 p-3 rounded-full mb-2 text-brand-600">
                <CheckCircle size={24} />
            </div>
            <h3 className="font-bold text-gray-800">작업 사진 전송</h3>
            <p className="text-xs text-gray-500 mt-1">전/후 사진 제공</p>
        </div>
      </div>

      {/* Intro & Admin Info */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-lg font-bold text-brand-800 mb-4 border-b pb-2">서비스 안내</h2>
        <ul className="space-y-3 text-sm text-gray-600 mb-6">
            <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5"></span>
                <span>전문 장비와 인력을 통한 꼼꼼한 제초 작업</span>
            </li>
            <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5"></span>
                <span>성주군 전 지역 출장 가능</span>
            </li>
            <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5"></span>
                <span>작업 후 깔끔한 뒷정리 보장</span>
            </li>
        </ul>

        <h2 className="text-lg font-bold text-brand-800 mb-4 border-b pb-2">업체 정보</h2>
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-full"><Phone size={18} className="text-gray-600"/></div>
                <div>
                    <p className="text-xs text-gray-500">연락처</p>
                    <a href="tel:010-7545-0038" className="font-bold text-lg text-brand-700">010-7545-0038</a>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-full"><Mail size={18} className="text-gray-600"/></div>
                <div>
                    <p className="text-xs text-gray-500">이메일</p>
                    <p className="text-sm">hwanace@naver.com</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-full"><MapPin size={18} className="text-gray-600"/></div>
                <div>
                    <p className="text-xs text-gray-500">주소</p>
                    <p className="text-sm">경북 성주군 성주읍 성주순환로2길 69</p>
                </div>
            </div>
        </div>
      </div>

       <div className="bg-brand-50 p-6 rounded-xl border border-brand-100 text-center">
            <p className="text-brand-800 font-medium mb-3">궁금한 점이 있으신가요?</p>
            <Link to="/chat" className="inline-flex items-center gap-2 bg-white text-brand-700 border border-brand-200 px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:bg-brand-50">
                <MessageCircle size={16} />
                1:1 문의하기
            </Link>
       </div>
    </div>
  );
};

export default Home;