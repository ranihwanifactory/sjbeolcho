import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, X, Star } from 'lucide-react';
import { Reservation } from '../types';

interface CompletionModalProps {
  reservation: Reservation;
  onClose: () => void;
}

const CompletionModal: React.FC<CompletionModalProps> = ({ reservation, onClose }) => {
  const navigate = useNavigate();

  const handleReviewClick = () => {
    onClose();
    navigate('/reviews');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl relative transform transition-all scale-100">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="bg-green-100 p-4 rounded-full mb-4 animate-bounce">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-800 mb-2">작업이 완료되었습니다!</h2>
          <p className="text-gray-600 text-sm mb-6">
            <span className="font-bold text-brand-700">"{reservation.locationName}"</span><br/>
            벌초 작업이 성공적으로 마무리되었습니다.
          </p>

          <div className="w-full space-y-3">
            <button 
              onClick={handleReviewClick}
              className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition flex items-center justify-center gap-2 shadow-lg shadow-brand-200"
            >
              <Star size={18} fill="currentColor" className="text-yellow-400" />
              후기 작성하러 가기
            </button>
            <button 
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition"
            >
              나중에 하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletionModal;