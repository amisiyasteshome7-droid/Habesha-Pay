'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { sanitizeText, sanitizeEmail } from '@/lib/sanitize';
import {
  Building2,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

/* --- Miniature Ethiopian 200 Birr Banknote Vector --- */
function Birr200Note({ width = 42, height = 24, rotation = 0, opacity = 1 }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 56"
      style={{
        transform: `rotate(${rotation}deg)`,
        opacity,
        filter: 'drop-shadow(1px 2px 2px rgba(40, 20, 10, 0.2))',
        flexShrink: 0,
        display: 'inline-block',
      }}
    >
      <rect
        x="1.5"
        y="1.5"
        width="97"
        height="53"
        rx="3.5"
        fill="#c85a32"
        stroke="#2a160d"
        strokeWidth="2.5"
      />
      <rect
        x="5"
        y="5"
        width="90"
        height="46"
        rx="2"
        fill="#d9744b"
        stroke="#5a220f"
        strokeWidth="1"
        strokeDasharray="2.5 1.5"
      />
      <circle cx="50" cy="28" r="14" fill="#be4d25" stroke="#f6c28b" strokeWidth="1.2" />
      <circle cx="50" cy="28" r="8" fill="#e2855a" opacity="0.8" />
      <text
        x="12"
        y="22"
        fill="#fff8ee"
        fontSize="13"
        fontWeight="900"
        fontFamily="sans-serif"
        letterSpacing="-0.5"
      >
        200
      </text>
      <text
        x="69"
        y="21"
        fill="#fbe5cf"
        fontSize="10"
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        ፪፻
      </text>
      <text
        x="68"
        y="45"
        fill="#fff8ee"
        fontSize="11"
        fontWeight="900"
        fontFamily="sans-serif"
      >
        ብር
      </text>
      <line x1="28" y1="5" x2="28" y2="51" stroke="#872b12" strokeWidth="2" strokeDasharray="3 2" />
      <text
        x="10"
        y="44"
        fill="#f6c28b"
        fontSize="7"
        fontWeight="800"
        fontFamily="sans-serif"
      >
        ETB
      </text>
    </svg>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite') || '';

  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Quick preset helper for rapid testing
  function handlePresetDemo() {
    setCompanyName('Abyssinia Trading PLC');
    setFullName('Abebe Bikila');
    setEmail('abebe.hr@abyssiniaplc.et');
    setPassword('Ethiopia#2026');
    setConfirmPassword('Ethiopia#2026');
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const cleanName = sanitizeText(fullName);
    const cleanEmail = sanitizeEmail(email);
    const cleanCompany = sanitizeText(companyName);

    if (!cleanName) {
      setError('Enter your full name.');
      return;
    }

    if (!cleanEmail) {
      setError('Enter a valid email address.');
      return;
    }

    if (!inviteToken && !cleanCompany) {
      setError('Enter your company name.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (inviteToken) {
      setError('Team invitations are temporarily unavailable while we migrate to MongoDB.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          fullName: cleanName,
          companyName: cleanCompany,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || 'Unable to create account.');
        setLoading(false);
        return;
      }

      const loginResult = await signIn('credentials', {
        email: cleanEmail,
        password,
        redirect: false,
      });

      if (!loginResult || loginResult.error) {
        setError('Account created successfully, but automatic login failed. Please log in manually.');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Signup error:', err);
      setError('Something went wrong while creating your account.');
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#eef4ef',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 16px',
        color: '#1a3325',
        fontFamily: 'inherit',
      }}
    >
      {/* Background Soft Glow Ambience */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-8%',
          right: '-8%',
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(198,224,204,0.45) 55%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-6%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(162,207,174,0.3) 0%, transparent 65%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Floating 200 Birr Banknotes */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '18%',
          left: '7%',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <Birr200Note width={64} height={36} rotation={-14} opacity={0.7} />
      </div>

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '24%',
          right: '6%',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <Birr200Note width={68} height={38} rotation={18} opacity={0.75} />
      </div>

      {/* Background Document Stamped Seal */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '14%',
          right: '9%',
          border: '2px dashed #3a6b52',
          borderRadius: 8,
          padding: '6px 12px',
          background: 'rgba(255,255,255,0.6)',
          color: '#24513b',
          fontSize: 11,
          fontWeight: 800,
          transform: 'rotate(7deg)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        🏢 NEW WORKSPACE ENROLLMENT
      </div>

      {/* Main Form Container */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 430 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <Birr200Note width={36} height={20} rotation={-6} />
            <h1
              style={{
                fontSize: 'clamp(1.7rem, 4.5vw, 2.2rem)',
                fontWeight: 900,
                letterSpacing: '0.5px',
                margin: 0,
                color: '#142c1f',
              }}
            >
              <span style={{ color: '#2d6a4f' }}>ETHIO</span>-PAYROLL
            </h1>
            <Birr200Note width={36} height={20} rotation={6} />
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#446653', margin: '4px 0 0' }}>
            Workforce Portal & Corporate Registration
          </p>
        </div>

        {/* Voucher / Registration Card Container */}
        <div
          style={{
            width: '100%',
            background: '#ffffff',
            borderRadius: 14,
            border: '2.5px solid #142c1f',
            boxShadow: '5px 5px 0px #142c1f',
            overflow: 'hidden',
          }}
        >
          {/* Perforated Top Slip Header */}
          <div
            style={{
              background: '#e4eee6',
              padding: '10px 18px',
              borderBottom: '2px dashed #142c1f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#1a3d2c' }}>
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-800" />
              <span>REGISTRATION DOCKET #{new Date().getFullYear()}</span>
            </div>
            <div
              style={{
                background: '#ffffff',
                border: '1.5px solid #142c1f',
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 10,
                fontWeight: 900,
                color: '#1a3d2c',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
              TAX ONBOARDING
            </div>
          </div>

          <div style={{ padding: '22px 22px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    margin: 0,
                    color: '#142c1f',
                    letterSpacing: '-0.3px',
                  }}
                >
                  {inviteToken ? 'Join Company Team' : 'Create Organization Workspace'}
                </h2>
                <p style={{ fontSize: 12, color: '#577564', margin: '3px 0 0', fontWeight: 500 }}>
                  {inviteToken
                    ? "Connect your employee credentials to your employer's workspace."
                    : 'Set up your company payroll ledger in under a minute.'}
                </p>
              </div>

              {/* Interactive Demo Autofill Preset */}
              {!inviteToken && (
                <button
                  type="button"
                  onClick={handlePresetDemo}
                  title="Autofill sample corporate details"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    background: '#fef3c7',
                    border: '1.5px solid #d97706',
                    borderRadius: 6,
                    color: '#92400e',
                    fontSize: 10,
                    fontWeight: 900,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Preset Fill</span>
                </button>
              )}
            </div>

            {error && (
              <div
                style={{
                  marginBottom: 14,
                  padding: '9px 12px',
                  borderRadius: 6,
                  background: '#ffebe6',
                  border: '1.5px solid #b02a1e',
                  color: '#b02a1e',
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

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {!inviteToken && (
                <div>
                  <label
                    htmlFor="companyName"
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                      color: '#1a3d2c',
                      marginBottom: 5,
                    }}
                  >
                    Registered Company Name
                  </label>
                  <div style={inputContainerStyle}>
                    <Building2 className="w-4 h-4" style={{ color: '#446653', flexShrink: 0 }} />
                    <input
                      id="companyName"
                      type="text"
                      placeholder="e.g. Abyssinia Logistics PLC"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      style={inputFieldStyle}
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="fullName"
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    color: '#1a3d2c',
                    marginBottom: 5,
                  }}
                >
                  Authorized Representative Name
                </label>
                <div style={inputContainerStyle}>
                  <User className="w-4 h-4" style={{ color: '#446653', flexShrink: 0 }} />
                  <input
                    id="fullName"
                    type="text"
                    placeholder="e.g. Abebe Bikila"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    style={inputFieldStyle}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    color: '#1a3d2c',
                    marginBottom: 5,
                  }}
                >
                  Corporate Email
                </label>
                <div style={inputContainerStyle}>
                  <Mail className="w-4 h-4" style={{ color: '#446653', flexShrink: 0 }} />
                  <input
                    id="email"
                    type="email"
                    placeholder="representative@organization.et"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={inputFieldStyle}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    color: '#1a3d2c',
                    marginBottom: 5,
                  }}
                >
                  Master Password
                </label>
                <div
                  style={{
                    ...inputContainerStyle,
                    borderColor: password ? '#2d6a4f' : '#142c1f',
                  }}
                >
                  <Lock className="w-4 h-4" style={{ color: '#446653', flexShrink: 0 }} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={inputFieldStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0 4px',
                      color: '#446653',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    color: '#1a3d2c',
                    marginBottom: 5,
                  }}
                >
                  Confirm Password
                </label>
                <div
                  style={{
                    ...inputContainerStyle,
                    borderColor: confirmPassword && confirmPassword === password ? '#2d6a4f' : '#142c1f',
                  }}
                >
                  <CheckCircle2
                    className="w-4 h-4"
                    style={{
                      color: confirmPassword && confirmPassword === password ? '#2d6a4f' : '#8fa896',
                      flexShrink: 0,
                    }}
                  />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-type password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={inputFieldStyle}
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 6,
                  padding: '12px',
                  borderRadius: 6,
                  border: '2px solid #142c1f',
                  backgroundColor: '#235940',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: 14,
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '3px 3px 0px #142c1f',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>INITIALIZING WORKSPACE…</span>
                  </>
                ) : (
                  <span>
                    {inviteToken ? 'JOIN TEAM LEDGER →' : 'REGISTER & PROVISION WORKSPACE →'}
                  </span>
                )}
              </button>
            </form>

            {/* Bottom Ledger Note */}
            <div
              style={{
                marginTop: 16,
                paddingTop: 12,
                borderTop: '1.5px dashed #d5e0d7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <span style={{ color: '#577564' }}>Existing account?</span>
              <Link
                href="/login"
                style={{
                  color: '#235940',
                  textDecoration: 'none',
                  borderBottom: '1.5px solid #235940',
                  fontWeight: 900,
                }}
              >
                Log In to Workspace
              </Link>
            </div>
          </div>

          {/* Interactive Compliance Stamp Ribbon */}
          <div
            style={{
              background: '#f4f8f5',
              padding: '8px 18px',
              borderTop: '1.5px solid #d5e0d7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 10.5,
              fontWeight: 800,
              color: '#345e46',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Compliant with Ethiopian Labor Proclamation</span>
            </div>
            <span style={{ fontFamily: 'monospace', fontWeight: 900, opacity: 0.85 }}>ETB · ብር</span>
          </div>
        </div>

        {/* Minimal Copyright */}
        <div
          style={{
            marginTop: 18,
            fontSize: 11,
            fontWeight: 700,
            color: '#557563',
            textAlign: 'center',
          }}
        >
          © EthioPayroll 2026 • Secure Payroll Ledger
        </div>
      </div>
    </div>
  );
}

const inputContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  background: '#fafcfa',
  border: '2px solid #142c1f',
  borderRadius: 6,
  padding: '0 10px',
  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
  gap: 8,
};

const inputFieldStyle = {
  flex: 1,
  border: 'none',
  outline: 'none',
  padding: '10px 4px',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: 'inherit',
  background: 'transparent',
  color: '#142c1f',
};