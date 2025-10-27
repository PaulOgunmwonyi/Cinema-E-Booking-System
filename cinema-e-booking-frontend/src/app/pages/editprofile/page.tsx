'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiService, Address, PaymentCard, UserProfile } from '../../utils/api';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const CARD_TYPES = ['Visa', 'MasterCard', 'American Express', 'Discover'];

function formatCardNumber(value: string) {
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
}

function formatExpirationDate(value: string) {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  if (v.length >= 2) {
    return v.substring(0, 2) + (v.length > 2 ? '/' + v.substring(2, 4) : '');
  }
  return v;
}

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    password: '',
    promotions: false,
    address: { street: '', city: '', state: '', zip: '', country: 'USA' } as Address,
    paymentCards: [] as PaymentCard[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cardForm, setCardForm] = useState({ cardType: 'Visa', cardNumber: '', expiry: '' });
  const [error, setError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    apiService.getProfile().then((data: any) => {
      // Map backend cards to frontend paymentCards
      const paymentCards = Array.isArray(data.cards)
        ? data.cards.map((card: any) => ({
            id: card.id,
            cardType: card.card_type,
            cardNumber: '',
            expiry: card.expiration_date,
          }))
        : [];

      setProfile({
        email: data.user.email,
        firstName: data.user.first_name,
        lastName: data.user.last_name,
        promotions: !!data.user.promo_opt_in,
        address: data.address
          ? {
              street: data.address.street || '',
              city: data.address.city || '',
              state: data.address.state || '',
              zip: data.address.zip || '',
              country: data.address.country || 'USA',
            }
          : { street: '', city: '', state: '', zip: '', country: 'USA' },
        paymentCards,
      });
      setForm({
        firstName: data.user.first_name,
        lastName: data.user.last_name,
        password: '',
        promotions: !!data.user.promo_opt_in,
        address: data.address
          ? {
              street: data.address.street || '',
              city: data.address.city || '',
              state: data.address.state || '',
              zip: data.address.zip || '',
              country: data.address.country || 'USA',
            }
          : { street: '', city: '', state: '', zip: '', country: 'USA' },
        paymentCards,
      });
      setLoading(false);
    });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setForm(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value }
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCardFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    }
    if (name === 'expiry') {
      formattedValue = formatExpirationDate(value);
    }
    setCardForm(prev => ({
      ...prev,
      [name]: formattedValue,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'currentPassword') {
      setCurrentPassword(value);
      if (newPassword && value === newPassword) {
        setPasswordError('New password cannot be the same as current password.');
      } else {
        setPasswordError(null);
      }
    } else if (name === 'newPassword') {
      setNewPassword(value);
      if (currentPassword && value === currentPassword) {
        setPasswordError('New password cannot be the same as current password.');
      } else {
        setPasswordError(null);
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';

    // Password validation
    if (newPassword) {
      if (!currentPassword) {
        setPasswordError('Please enter your current password.');
        return false;
      }
      if (currentPassword === newPassword) {
        setPasswordError('New password cannot be the same as current password.');
        return false;
      }
    }

    // Address validation (if any field is filled, require all)
    const { street, city, state, zip } = form.address;
    const addressFilled = street || city || state || zip;
    if (addressFilled) {
      if (!street.trim()) newErrors['address.street'] = 'Street address is required';
      if (!city.trim()) newErrors['address.city'] = 'City is required';
      if (!state.trim()) newErrors['address.state'] = 'State is required';
      else if (!US_STATES.includes(state.toUpperCase())) newErrors['address.state'] = 'Invalid US state';
      if (!zip.trim()) newErrors['address.zip'] = 'ZIP code is required';
      else if (!/^\d{5}(-\d{4})?$/.test(zip)) newErrors['address.zip'] = 'Invalid ZIP code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && !passwordError;
  };

  const handleAddCard = async () => {
    if (form.paymentCards.length >= 4) {
      setError('You can only store up to 4 payment cards.');
      return;
    }
    if (!cardForm.cardNumber || !cardForm.expiry || !cardForm.cardType) {
      setError('Please fill out all card fields.');
      return;
    }
    try {
      await apiService.addPaymentCard({
        cardType: cardForm.cardType,
        cardNumber: cardForm.cardNumber,
        expirationDate: cardForm.expiry,
      });
      // Refresh cards
      const data = await apiService.getProfile();
      const paymentCards = Array.isArray(data.cards)
        ? data.cards.map((card: any) => ({
            id: card.id,
            cardType: card.card_type,
            cardNumber: '',
            expiry: card.expiration_date,
          }))
        : [];
      setForm(prev => ({
        ...prev,
        paymentCards,
      }));
      setCardForm({ cardType: 'Visa', cardNumber: '', expiry: '' });
      setError(null);
    } catch (err) {
      setError('Failed to add card.');
    }
  };

  const handleRemoveCard = async (id: string) => {
    try {
      await apiService.removePaymentCard(id);
      const data = await apiService.getProfile();
      const paymentCards = Array.isArray(data.cards)
        ? data.cards.map((card: any) => ({
            id: card.id,
            cardType: card.card_type,
            cardNumber: '',
            expiry: card.expiration_date,
          }))
        : [];
      setForm(prev => ({
        ...prev,
        paymentCards,
      }));
    } catch (err) {
      setError('Failed to remove card.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPasswordError(null);

    if (!validateForm()) return;

    const { street, city, state, zip, country } = form.address;
    const addressFilled = street || city || state || zip;

    try {
      await apiService.updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        password: newPassword ? newPassword : undefined,
        currentPassword: newPassword ? currentPassword : undefined,
        promoOptIn: form.promotions,
        address: addressFilled ? { street, city, state, zip, country } : undefined,
      });
      router.push('/?profileUpdated=true');
    } catch (err: any) {
      // Show password error if backend returns it
      if (err?.message?.toLowerCase().includes('current password')) {
        setPasswordError(err.message);
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError('Failed to update profile. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-red-900 flex items-center justify-center">
        <div className="glass-card p-8 w-full max-w-md text-center text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-red-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="absolute top-20 left-20 w-96 h-96 bg-red-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-red-600/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="glass-card p-8 w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Edit Profile</h1>
            <p className="text-white/70">Update your personal information and preferences</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email (disabled) */}
            <div>
              <label className="block text-white font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="glass-input w-full px-4 py-3 rounded-lg text-gray-400 bg-gray-700 cursor-not-allowed"
              />
            </div>

            {/* Name fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-medium mb-2">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleInputChange}
                  className={`glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                    errors.firstName ? 'border-red-500 focus:ring-red-500/50' : ''
                  }`}
                  placeholder="Enter your first name"
                  required
                />
                {errors.firstName && <p className="text-red-400 text-sm mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleInputChange}
                  className={`glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                    errors.lastName ? 'border-red-500 focus:ring-red-500/50' : ''
                  }`}
                  placeholder="Enter your last name"
                  required
                />
                {errors.lastName && <p className="text-red-400 text-sm mt-1">{errors.lastName}</p>}
              </div>
            </div>

            {/* Billing Address */}
            <div>
              <label className="block text-white font-medium mb-2">Billing Address</label>
              <div className="space-y-4">
                <input
                  type="text"
                  name="address.street"
                  value={form.address.street}
                  onChange={handleInputChange}
                  className={`glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                    errors['address.street'] ? 'border-red-500 focus:ring-red-500/50' : ''
                  }`}
                  placeholder="Street Address"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    name="address.city"
                    value={form.address.city}
                    onChange={handleInputChange}
                    className={`glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                      errors['address.city'] ? 'border-red-500 focus:ring-red-500/50' : ''
                    }`}
                    placeholder="City"
                  />
                  <select
                    name="address.state"
                    value={form.address.state}
                    onChange={handleInputChange}
                    className={`glass-input w-full px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 ${
                      errors['address.state'] ? 'border-red-500 focus:ring-red-500/50' : ''
                    }`}
                  >
                    <option value="">State</option>
                    {US_STATES.map(state => (
                      <option key={state} value={state} className="bg-black">{state}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="address.zip"
                    value={form.address.zip}
                    onChange={handleInputChange}
                    className={`glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                      errors['address.zip'] ? 'border-red-500 focus:ring-red-500/50' : ''
                    }`}
                    placeholder="ZIP"
                  />
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-1">Only one address can be stored.</div>
              {errors['address.street'] && <p className="text-red-400 text-sm mt-1">{errors['address.street']}</p>}
              {errors['address.city'] && <p className="text-red-400 text-sm mt-1">{errors['address.city']}</p>}
              {errors['address.state'] && <p className="text-red-400 text-sm mt-1">{errors['address.state']}</p>}
              {errors['address.zip'] && <p className="text-red-400 text-sm mt-1">{errors['address.zip']}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-white font-medium mb-2">Change Password</label>
              <input
                type="password"
                name="currentPassword"
                value={currentPassword}
                onChange={handlePasswordChange}
                className="glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 mb-2"
                placeholder="Current password"
                autoComplete="current-password"
              />
              <input
                type="password"
                name="newPassword"
                value={newPassword}
                onChange={handlePasswordChange}
                className="glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="New password"
                autoComplete="new-password"
              />
              <p className="text-white/50 text-xs mt-1">
                Enter your current password and a new password to change it.
              </p>
              {passwordError && <p className="text-red-400 text-sm mt-1">{passwordError}</p>}
            </div>

            {/* Promotions */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="promotions"
                checked={form.promotions}
                onChange={handleInputChange}
                className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                id="promotions"
              />
              <label htmlFor="promotions" className="text-white">
                Subscribe to promotions and special offers
              </label>
            </div>

            {/* Payment Cards */}
            <div>
              <label className="block text-white font-medium mb-2">Payment Cards</label>
              <div className="space-y-2 mb-2">
                {form.paymentCards.map((card, idx) => (
                  <div key={card.id} className="border border-white/20 rounded-lg p-4 space-y-2 bg-gray-800">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm text-white">{card.cardType || 'Card'}</span>
                      <span className="ml-2 text-xs text-gray-400">{card.expiry}</span>
                      <button
                        type="button"
                        className="text-red-400 hover:text-red-300 font-bold px-2 py-1 rounded"
                        onClick={() => handleRemoveCard(card.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {form.paymentCards.length < 4 && (
                <div className="border border-white/20 rounded-lg p-4 space-y-4 bg-gray-900">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Card Type</label>
                      <select
                        name="cardType"
                        value={cardForm.cardType}
                        onChange={handleCardFormChange}
                        className="glass-input w-full px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                      >
                        {CARD_TYPES.map(type => (
                          <option key={type} value={type} className="bg-black">{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">Expiration Date (MM/YY)</label>
                      <input
                        type="text"
                        name="expiry"
                        value={cardForm.expiry}
                        onChange={handleCardFormChange}
                        className="glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                        placeholder="MM/YY"
                        maxLength={5}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Card Number</label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={cardForm.cardNumber}
                      onChange={handleCardFormChange}
                      className="glass-input w-full px-4 py-3 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                  </div>
                  <button
                    type="button"
                    className="w-full glass-button py-3 rounded-lg font-bold text-white hover:text-gray-200 shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    onClick={handleAddCard}
                  >
                    Add Card
                  </button>
                  {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
                </div>
              )}
              <div className="text-xs text-gray-400 mt-1">
                You can store up to 4 payment cards.
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full glass-button py-3 rounded-lg font-bold text-white hover:text-gray-200 shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}