import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const { user, loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();
  const navigate = useNavigate();
  
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(-1); // Go back to where they came from
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        if (isSignup) {
            await signupWithEmail(email, password, name);
        } else {
            await loginWithEmail(email, password);
        }
        // Navigation handled by useEffect
    } catch (err: any) {
        console.error(err);
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
            setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        } else if (err.code === 'auth/email-already-in-use') {
            setError('이미 사용 중인 이메일입니다.');
        } else if (err.code === 'auth/weak-password') {
            setError('비밀번호는 6자 이상이어야 합니다.');
        } else {
            setError('로그인/회원가입 중 오류가 발생했습니다.');
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
        <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-800">{isSignup ? '회원가입' : '로그인'}</h1>
            <p className="text-gray-500 text-sm mt-2">서비스 이용을 위해 로그인이 필요합니다.</p>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 mb-4">
                <AlertCircle size={16} />
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            {isSignup && (
                <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="이름"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        required={isSignup}
                    />
                </div>
            )}
            <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input 
                    type="email" 
                    placeholder="이메일"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    required
                />
            </div>
            <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input 
                    type="password" 
                    placeholder="비밀번호 (6자 이상)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    required
                />
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700 transition disabled:opacity-70"
            >
                {loading ? '처리 중...' : (isSignup ? '가입하기' : '이메일로 로그인')}
            </button>
        </form>

        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
            </div>
        </div>

        <button
          onClick={() => loginWithGoogle()}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-lg shadow-sm transition-all mb-4"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          구글 계정으로 계속하기
        </button>

        <div className="text-center text-sm">
            <span className="text-gray-500">{isSignup ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'}</span>
            <button 
                onClick={() => { setIsSignup(!isSignup); setError(''); }}
                className="ml-2 text-brand-600 font-bold hover:underline"
            >
                {isSignup ? '로그인' : '회원가입'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Login;