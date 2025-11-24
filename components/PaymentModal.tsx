
import React, { useState } from 'react';
import { CreditCard, Lock, CheckCircle2, AlertTriangle, Tag } from 'lucide-react';
import { Button, InputField } from './Common';
import { paymentService } from '../services/paymentService';

interface PaymentModalProps {
  amount: number;
  description: string;
  userId: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ amount, description, userId, onSuccess, onClose }) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvc: '' });
  
  // Coupon State
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const finalAmount = Math.max(0, amount - (amount * (appliedDiscount / 100)));

  const handleApplyCoupon = async () => {
      if (!promoCode) return;
      setIsValidatingCoupon(true);
      setCouponMessage(null);
      
      const coupon = await paymentService.validateCoupon(promoCode);
      
      if (coupon) {
          setAppliedDiscount(coupon.discountPercent);
          setCouponMessage({ type: 'success', text: `Code applied! ${coupon.discountPercent}% off.` });
      } else {
          setAppliedDiscount(0);
          setCouponMessage({ type: 'error', text: 'Invalid coupon code.' });
      }
      setIsValidatingCoupon(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setProcessing(true);

    const result = await paymentService.processPayment(userId, finalAmount, description);

    if (result.success) {
        setTimeout(() => {
            onSuccess();
            setProcessing(false);
        }, 500);
    } else {
        setError(result.error || 'Payment failed');
        setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Lock size={16} className="text-green-600"/> Secure Checkout
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">Close</button>
        </div>
        
        <div className="p-6 space-y-6">
            {/* Order Summary */}
            <div className="space-y-2">
                <p className="text-sm text-slate-500">Purchasing</p>
                <p className="font-bold text-slate-900 text-lg">{description}</p>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-dashed border-slate-200">
                    <span>Subtotal</span>
                    <span>${amount.toFixed(2)}</span>
                </div>
                {appliedDiscount > 0 && (
                    <div className="flex justify-between items-center text-sm text-green-600">
                        <span>Discount ({appliedDiscount}%)</span>
                        <span>-${(amount * (appliedDiscount/100)).toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between items-center font-bold text-xl pt-2 border-t border-slate-200">
                    <span>Total</span>
                    <span>${finalAmount.toFixed(2)}</span>
                </div>
            </div>

            {/* Coupon Input */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                     <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                     <input 
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                        placeholder="Promo Code"
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value)}
                     />
                </div>
                <Button variant="secondary" className="text-xs" onClick={handleApplyCoupon} isLoading={isValidatingCoupon} disabled={!promoCode}>Apply</Button>
            </div>
            {couponMessage && (
                <p className={`text-xs ${couponMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {couponMessage.text}
                </p>
            )}

            {/* Card Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <InputField 
                    label="Card Number" 
                    placeholder="0000 0000 0000 0000" 
                    value={cardDetails.number}
                    onChange={e => setCardDetails({...cardDetails, number: e.target.value})}
                    required
                />
                <div className="grid grid-cols-2 gap-4">
                    <InputField 
                        label="Expiry" 
                        placeholder="MM/YY" 
                        value={cardDetails.expiry}
                        onChange={e => setCardDetails({...cardDetails, expiry: e.target.value})}
                        required
                    />
                    <InputField 
                        label="CVC" 
                        placeholder="123" 
                        type="password"
                        maxLength={3}
                        value={cardDetails.cvc}
                        onChange={e => setCardDetails({...cardDetails, cvc: e.target.value})}
                        required
                    />
                </div>

                {error && (
                     <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
                         <AlertTriangle size={16} /> {error}
                     </div>
                )}

                <Button className="w-full py-3" icon={CreditCard} isLoading={processing}>
                    Pay ${finalAmount.toFixed(2)}
                </Button>
                
                <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
                    <Lock size={12}/> Payments processed securely by Stripe
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};
