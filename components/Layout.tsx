import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, CalendarPlus, MessageCircle, User as UserIcon, LogOut, Menu, Share2, Shield, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types.ts';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '젊은벌초 - 성주권 벌초 예약',
          text: '성주 지역 전문 벌초 대행 서비스입니다. 앱에서 간편하게 예약하세요.',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      alert('공유 기능을 지원하지 않는 브라우저입니다. URL을 복사해주세요.');
    }
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
        alert("이미 설치되어 있거나 설치를 지원하지 않는 환경입니다. 브라우저 메뉴의 '홈 화면에 추가'를 이용해주세요.");
    }
  };

  const navItems = [
    { path: '/', label: '홈', icon: <Home size={20} /> },
    { path: '/reserve', label: '예약하기', icon: <CalendarPlus size={20} /> },
    { path: '/reviews', label: '이용후기', icon: <Star size={20} /> },
    { path: '/chat', label: '문의채팅', icon: <MessageCircle size={20} /> },
  ];

  if (user?.role === UserRole.ADMIN) {
    navItems.push({ path: '/admin', label: '관리자', icon: <Shield size={20} /> });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-brand-700 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="bg-white text-brand-700 p-1 rounded-md text-xs">성주</span>
            젊은벌초
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={handleShare} className="p-2 hover:bg-brand-600 rounded-full transition">
              <Share2 size={20} />
            </button>
            {user ? (
              <button onClick={logout} className="p-2 hover:bg-brand-600 rounded-full transition" title="로그아웃">
                <LogOut size={20} />
              </button>
            ) : (
              <Link to="/login" className="text-sm bg-brand-800 px-3 py-1 rounded-full hover:bg-brand-900 transition">
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-3xl mx-auto p-4 mb-20">
        {children}
      </main>

      {/* Mobile Install Prompt (Conditional) */}
      {deferredPrompt && (
        <div className="fixed bottom-20 left-4 right-4 bg-brand-900 text-white p-3 rounded-lg shadow-xl z-40 flex justify-between items-center animate-bounce">
            <span className="text-sm">앱을 설치하여 더 편리하게 이용하세요!</span>
            <button onClick={handleInstall} className="bg-white text-brand-900 px-3 py-1 rounded text-sm font-bold">설치</button>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 pb-safe">
        <div className="max-w-3xl mx-auto flex justify-around">
          {navItems.map((item) => {
             const isActive = location.pathname === item.path;
             return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex flex-col items-center py-2 px-4 flex-1 ${isActive ? 'text-brand-600' : 'text-gray-400'}`}
              >
                {item.icon}
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </Link>
             );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;