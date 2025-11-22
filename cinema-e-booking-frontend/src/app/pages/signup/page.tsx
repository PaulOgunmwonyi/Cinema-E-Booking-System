'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiService } from '../../utils/api';

interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  promoOptIn: boolean;
  
  // Optional address
  includeAddress: boolean;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  
  // Optional payment cards (max 3)
  includePayment: boolean;
  cards: Array<{
    cardType: string;
    cardNumber: string;
    expirationDate: string;
    isDefault: boolean;
  }>;
}

interface VerificationModalProps {
  email: string;
  onVerificationSuccess: () => void;
  onClose: () => void;
}

const VerificationModal = ({ email, onVerificationSuccess, onClose }: VerificationModalProps) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      await apiService.verifyEmail(email, verificationCode);
      onVerificationSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="glass-card p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Verify Your Email</h2>
        <p className="text-white/70 mb-6 text-center">
          We&apos;ve sent a 6-digit verification code to <strong>{email}</strong>
        </p>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-white font-medium mb-2">
              Verification Code
            </label>
            <input
              type="text"
              id="code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 text-center text-2xl tracking-widest"
              placeholder="000000"
              maxLength={6}
            />
            {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
          </div>
          
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg border border-white/30 text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying || verificationCode.length !== 6}
              className="flex-1 glass-button py-3 rounded-lg font-bold text-white hover:text-gray-200 shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SignupPage = () => {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<RegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    promoOptIn: false,
    
    includeAddress: false,
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'USA'
    },
    
    includePayment: false,
    cards: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState('');
  
  const router = useRouter();

  // US states for validation
  const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const CARD_TYPES = ['Visa', 'MasterCard', 'American Express', 'Discover'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value }
      }));
    } else if (name.startsWith('card.')) {
      const [, cardIndex, cardField] = name.split('.');
      const index = parseInt(cardIndex);
      setFormData(prev => ({
        ...prev,
        cards: prev.cards.map((card, i) => 
          i === index ? { ...card, [cardField]: type === 'checkbox' ? checked : value } : card
        )
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addPaymentCard = () => {
    if (formData.cards.length < 3) {
      setFormData(prev => ({
        ...prev,
        cards: [...prev.cards, {
          cardType: 'Visa',
          cardNumber: '',
          expirationDate: '',
          isDefault: prev.cards.length === 0
        }]
      }));
    }
  };

  const removePaymentCard = (index: number) => {
    setFormData(prev => ({
      ...prev,
      cards: prev.cards.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Address validation (if included)
    if (formData.includeAddress) {
      if (!formData.address.street.trim()) {
        newErrors['address.street'] = 'Street address is required';
      }
      if (!formData.address.city.trim()) {
        newErrors['address.city'] = 'City is required';
      }
      if (!formData.address.state.trim()) {
        newErrors['address.state'] = 'State is required';
      } else if (!US_STATES.includes(formData.address.state.toUpperCase())) {
        newErrors['address.state'] = 'Please enter a valid US state abbreviation';
      }
      if (!formData.address.zip.trim()) {
        newErrors['address.zip'] = 'ZIP code is required';
      } else if (!/^\d{5}(-\d{4})?$/.test(formData.address.zip)) {
        newErrors['address.zip'] = 'Please enter a valid ZIP code';
      }
    }

    // Payment card validation (if included)
    if (formData.includePayment) {
      formData.cards.forEach((card, index) => {
        if (!card.cardNumber.replace(/\s/g, '')) {
          newErrors[`card.${index}.cardNumber`] = 'Card number is required';
        } else if (!/^\d{13,19}$/.test(card.cardNumber.replace(/\s/g, ''))) {
          newErrors[`card.${index}.cardNumber`] = 'Please enter a valid card number';
        }
        
        if (!card.expirationDate) {
          newErrors[`card.${index}.expirationDate`] = 'Expiration date is required';
        } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expirationDate)) {
          newErrors[`card.${index}.expirationDate`] = 'Please enter date as MM/YY';
        } else {
          // Check if card is not expired
          const [month, year] = card.expirationDate.split('/');
          const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
          const now = new Date();
          if (expiry < now) {
            newErrors[`card.${index}.expirationDate`] = 'Card has expired';
          }
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const registrationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        promoOptIn: formData.promoOptIn,
        ...(formData.includeAddress && { address: formData.address }),
        ...(formData.includePayment && formData.cards.length > 0 && { cards: formData.cards })
      };

      await apiService.registerUser(registrationData);
      setRegistrationEmail(formData.email);
      setShowVerification(true);
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Registration failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerificationSuccess = () => {
    setShowVerification(false);
    
    // Check for redirect parameter and include it in the login URL
    const redirectTo = searchParams.get('redirect');
    const loginPath = redirectTo 
      ? `/pages/login?registered=true&redirect=${encodeURIComponent(redirectTo)}`
      : '/pages/login?registered=true';
    
    // After successful verification, redirect the user to the login page
    router.push(loginPath);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpirationDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + (v.length > 2 ? '/' + v.substring(2, 4) : '');
    }
    return v;
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-red-900 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute top-20 left-20 w-96 h-96 bg-red-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-red-600/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="glass-card p-8 w-full max-w-2xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Join Cinema E-Booking</h1>
              <p className="text-white/70">Create your account to start booking tickets</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-white font-medium mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                      errors.firstName ? 'border-red-500 focus:ring-red-500/50' : ''
                    }`}
                    placeholder="Enter your first name"
                  />
                  {errors.firstName && <p className="text-red-400 text-sm mt-1">{errors.firstName}</p>}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-white font-medium mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                      errors.lastName ? 'border-red-500 focus:ring-red-500/50' : ''
                    }`}
                    placeholder="Enter your last name"
                  />
                  {errors.lastName && <p className="text-red-400 text-sm mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-white font-medium mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                    errors.email ? 'border-red-500 focus:ring-red-500/50' : ''
                  }`}
                  placeholder="Enter your email"
                />
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-white font-medium mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                    errors.phone ? 'border-red-500 focus:ring-red-500/50' : ''
                  }`}
                  placeholder="(555) 123-4567"
                />
                {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-white font-medium mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                      errors.password ? 'border-red-500 focus:ring-red-500/50' : ''
                    }`}
                    placeholder="Create a password"
                  />
                  {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
                  <p className="text-white/50 text-xs mt-1">
                    At least 8 characters with uppercase, lowercase, and number
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-white font-medium mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                      errors.confirmPassword ? 'border-red-500 focus:ring-red-500/50' : ''
                    }`}
                    placeholder="Confirm your password"
                  />
                  {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Promotion Opt-in */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="promoOptIn"
                  name="promoOptIn"
                  checked={formData.promoOptIn}
                  onChange={handleInputChange}
                  className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="promoOptIn" className="text-white">
                  Subscribe to promotions and special offers
                </label>
              </div>

              {/* Optional Address Section */}
              <div className="border-t border-white/20 pt-6">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="includeAddress"
                    name="includeAddress"
                    checked={formData.includeAddress}
                    onChange={handleInputChange}
                    className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includeAddress" className="text-white font-medium">
                    Add shipping address (optional)
                  </label>
                </div>

                {formData.includeAddress && (
                  <div className="space-y-4 pl-7">
                    <div>
                      <label htmlFor="address.street" className="block text-white font-medium mb-2">
                        Street Address
                      </label>
                      <input
                        type="text"
                        id="address.street"
                        name="address.street"
                        value={formData.address.street}
                        onChange={handleInputChange}
                        className={`glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                          errors['address.street'] ? 'border-red-500 focus:ring-red-500/50' : ''
                        }`}
                        placeholder="123 Main St"
                      />
                      {errors['address.street'] && <p className="text-red-400 text-sm mt-1">{errors['address.street']}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="address.city" className="block text-white font-medium mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          id="address.city"
                          name="address.city"
                          value={formData.address.city}
                          onChange={handleInputChange}
                          className={`glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                            errors['address.city'] ? 'border-red-500 focus:ring-red-500/50' : ''
                          }`}
                          placeholder="City"
                        />
                        {errors['address.city'] && <p className="text-red-400 text-sm mt-1">{errors['address.city']}</p>}
                      </div>

                      <div>
                        <label htmlFor="address.state" className="block text-white font-medium mb-2">
                          State
                        </label>
                        <select
                          id="address.state"
                          name="address.state"
                          value={formData.address.state}
                          onChange={handleInputChange}
                          className={`glass-input w-full px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 ${
                            errors['address.state'] ? 'border-red-500 focus:ring-red-500/50' : ''
                          }`}
                        >
                          <option value="">Select State</option>
                          {US_STATES.map(state => (
                            <option key={state} value={state} className="bg-black">{state}</option>
                          ))}
                        </select>
                        {errors['address.state'] && <p className="text-red-400 text-sm mt-1">{errors['address.state']}</p>}
                      </div>

                      <div>
                        <label htmlFor="address.zip" className="block text-white font-medium mb-2">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          id="address.zip"
                          name="address.zip"
                          value={formData.address.zip}
                          onChange={handleInputChange}
                          className={`glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                            errors['address.zip'] ? 'border-red-500 focus:ring-red-500/50' : ''
                          }`}
                          placeholder="12345"
                        />
                        {errors['address.zip'] && <p className="text-red-400 text-sm mt-1">{errors['address.zip']}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Payment Cards Section */}
              <div className="border-t border-white/20 pt-6">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="includePayment"
                    name="includePayment"
                    checked={formData.includePayment}
                    onChange={handleInputChange}
                    className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includePayment" className="text-white font-medium">
                    Add payment cards (optional, max 3)
                  </label>
                </div>

                {formData.includePayment && (
                  <div className="space-y-6 pl-7">
                    {formData.cards.map((card, index) => (
                      <div key={index} className="border border-white/20 rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-white font-medium">Card {index + 1}</h4>
                          {formData.cards.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePaymentCard(index)}
                              className="text-red-400 hover:text-red-300"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-white font-medium mb-2">
                              Card Type
                            </label>
                            <select
                              name={`card.${index}.cardType`}
                              value={card.cardType}
                              onChange={handleInputChange}
                              className="glass-input w-full px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                            >
                              {CARD_TYPES.map(type => (
                                <option key={type} value={type} className="bg-black">{type}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-white font-medium mb-2">
                              Expiration Date (MM/YY)
                            </label>
                            <input
                              type="text"
                              name={`card.${index}.expirationDate`}
                              value={card.expirationDate}
                              onChange={(e) => {
                                e.target.value = formatExpirationDate(e.target.value);
                                handleInputChange(e);
                              }}
                              className={`glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                                errors[`card.${index}.expirationDate`] ? 'border-red-500 focus:ring-red-500/50' : ''
                              }`}
                              placeholder="MM/YY"
                              maxLength={5}
                            />
                            {errors[`card.${index}.expirationDate`] && (
                              <p className="text-red-400 text-sm mt-1">{errors[`card.${index}.expirationDate`]}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-white font-medium mb-2">
                            Card Number
                          </label>
                          <input
                            type="text"
                            name={`card.${index}.cardNumber`}
                            value={card.cardNumber}
                            onChange={(e) => {
                              e.target.value = formatCardNumber(e.target.value);
                              handleInputChange(e);
                            }}
                            className={`glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                              errors[`card.${index}.cardNumber`] ? 'border-red-500 focus:ring-red-500/50' : ''
                            }`}
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                          />
                          {errors[`card.${index}.cardNumber`] && (
                            <p className="text-red-400 text-sm mt-1">{errors[`card.${index}.cardNumber`]}</p>
                          )}
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name={`card.${index}.isDefault`}
                            checked={card.isDefault}
                            onChange={handleInputChange}
                            className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                          <label className="text-white text-sm">
                            Set as default payment method
                          </label>
                        </div>
                      </div>
                    ))}

                    {formData.cards.length < 3 && (
                      <button
                        type="button"
                        onClick={addPaymentCard}
                        className="w-full py-3 border-2 border-dashed border-white/30 rounded-lg text-white hover:border-white/50 transition-colors"
                      >
                        + Add Another Card
                      </button>
                    )}
                  </div>
                )}
              </div>

              {errors.submit && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                  <p className="text-red-400">{errors.submit}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full glass-button py-3 rounded-lg font-bold text-white hover:text-gray-200 shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-white/70">
                Already have an account?{' '}
                <button
                  onClick={() => router.back()}
                  className="text-white font-medium hover:text-gray-200 underline"
                >
                  Go back
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {showVerification && (
        <VerificationModal
          email={registrationEmail}
          onVerificationSuccess={handleVerificationSuccess}
          onClose={() => setShowVerification(false)}
        />
      )}
    </>
  );
};

export default SignupPage;