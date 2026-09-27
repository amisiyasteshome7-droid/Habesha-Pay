'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  MailCheck,
  Send,
  Building,
  Sparkles,
} from 'lucide-react';

export default function InviteAcceptancePage({ params }) {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handlePresetDemo() {
    setFullName('Tadesse Gemeda');
    setPassword('Payroll#2026');
    setConfirmPassword('Payroll#2026');
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: params.token,
          fullName,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to accept invitation.');
      }

      setSuccess(data.message || 'Invitation accepted! Redirecting to login...');

      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#e9ece6',
        backgroundImage: 'radial-gradient(#cfd8cb 1.5px, transparent 1.5px)',
        backgroundSize: '28px 28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
        color: '#1a3324',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ width: '100%', maxWidth: 440 }}>
        
        {/* Brand Bar */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 14px',
              borderRadius: 20,
              background: '#dbe7dd',
              border: '1.5px solid #23533e',
              color: '#1b4332',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
            }}
          >
            <Building className="w-3.5 h-3.5" />
            <span>EthioPayroll Workspace Invitation</span>
          </div>
        </div>

        {/* Envelope Container with Striped Border */}
        <div
          style={{
            position: 'relative',
            borderRadius: 16,
            padding: 8,
            background:
              'repeating-linear-gradient(135deg, #2d6a4f 0px, #2d6a4f 14px, #ffffff 14px, #ffffff 22px, #b45309 22px, #b45309 36px, #ffffff 36px, #ffffff 44px)',
            boxShadow: '0 18px 36px -12px rgba(27, 67, 50, 0.22)',
          }}
        >
          {/* Inner Letter Sheet */}
          <div
            style={{
              background: '#fefdfb',
              borderRadius: 10,
              padding: '28px 24px 22px',
              border: '1px solid #dcd4c5',
              position: 'relative',
            }}
          >
            {/* Header Ticket Stamp */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 16,
                borderBottom: '1.5px solid #eae3d5',
                marginBottom: 18,
              }}
            >
              <div>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '1px', color: '#b45309', textTransform: 'uppercase' }}>
                  Direct Onboarding
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 900, color: '#163826', margin: '2px 0 0' }}>
                  Accept Team Invite
                </h1>
              </div>

              {/* Postal Mark */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: '2px dashed #2d6a4f',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2d6a4f',
                  transform: 'rotate(12deg)',
                  flexShrink: 0,
                }}
              >
                <MailCheck className="w-5 h-5" />
              </div>
            </div>

            <p style={{ fontSize: 12.5, color: '#526659', margin: '0 0 16px', lineHeight: 1.5 }}>
              You have been granted access to join an active corporate payroll workspace. Fill in your details below to activate your seat.
            </p>

            {/* Quick Preset Fill */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button
                type="button"
                onClick={handlePresetDemo}
                style={{
                  background: '#f4f8f4',
                  border: '1px solid #a3c4ae',
                  borderRadius: 6,
                  padding: '3px 8px',
                  color: '#2d6a4f',
                  fontSize: 10.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Preset Demo Data</span>
              </button>
            </div>

            {error && (
              <div
                style={{
                  marginBottom: 14,
                  padding: '9px 12px',
                  borderRadius: 6,
                  background: '#fef2f2',
                  border: '1px solid #f87171',
                  color: '#991b1b',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div
                style={{
                  marginBottom: 14,
                  padding: '9px 12px',
                  borderRadius: 6,
                  background: '#f0fdf4',
                  border: '1px solid #4ade80',
                  color: '#166534',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    color: '#244533',
                    marginBottom: 5,
                  }}
                >
                  Full Legal Name
                </label>
                <div style={inputContainerStyle}>
                  <User className="w-4 h-4" style={{ color: '#4d705c' }} />
                  <input
                    id="fullName"
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    color: '#244533',
                    marginBottom: 5,
                  }}
                >
                  Create Password
                </label>
                <div
                  style={{
                    ...inputContainerStyle,
                    borderColor: password ? '#2d6a4f' : '#cad6ce',
                  }}
                >
                  <KeyRound className="w-4 h-4" style={{ color: '#4d705c' }} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0 4px',
                      color: '#4d705c',
                      display: 'flex',
                    }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    color: '#244533',
                    marginBottom: 5,
                  }}
                >
                  Confirm Password
                </label>
                <div
                  style={{
                    ...inputContainerStyle,
                    borderColor: confirmPassword && confirmPassword === password ? '#2d6a4f' : '#cad6ce',
                  }}
                >
                  <CheckCircle2
                    className="w-4 h-4"
                    style={{
                      color: confirmPassword && confirmPassword === password ? '#2d6a4f' : '#9bb5a5',
                    }}
                  />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading || Boolean(success)}
                style={{
                  marginTop: 6,
                  padding: '12px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: '#1b4332',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: 13.5,
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  cursor: loading || Boolean(success) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(27, 67, 50, 0.3)',
                  transition: 'opacity 0.2s',
                  opacity: loading || Boolean(success) ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Confirming...</span>
                  </>
                ) : (
                  <>
                    <span>Activate Workspace Seat</span>
                    <Send className="w-3.5 h-3.5 text-amber-300" />
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div
              style={{
                marginTop: 18,
                paddingTop: 12,
                borderTop: '1px dashed #dcd4c5',
                textAlign: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: '#55695e',
              }}
            >
              Already activated your account?{' '}
              <Link
                href="/login"
                style={{
                  color: '#1b4332',
                  textDecoration: 'underline',
                  fontWeight: 900,
                }}
              >
                Sign in here
              </Link>
            </div>
          </div>
        </div>

        {/* Minimal Bottom Tagline */}
        <div
          style={{
            marginTop: 18,
            fontSize: 11,
            fontWeight: 700,
            color: '#657e70',
            textAlign: 'center',
          }}
        >
          Secure Payroll Workspace Access Token
        </div>
      </div>
    </div>
  );
}

const inputContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  background: '#ffffff',
  border: '1.5px solid #cad6ce',
  borderRadius: 8,
  padding: '0 10px',
  gap: 8,
};

const inputStyle = {
  flex: 1,
  border: 'none',
  outline: 'none',
  padding: '11px 4px',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: 'inherit',
  background: 'transparent',
  color: '#163826',
};