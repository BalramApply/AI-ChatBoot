import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { User, Mail, Lock, UserPlus, Loader, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import Styles from "./styles/Signup.module.css";

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [checkingPassword, setCheckingPassword] = useState(false);

  // Check password strength when password changes
  useEffect(() => {
    const checkPassword = async () => {
      if (formData.password.length === 0) {
        setPasswordStrength(null);
        return;
      }

      if (formData.password.length < 6) {
        setPasswordStrength({
          score: 0,
          strength: 'weak',
          color: 'red',
          feedback: ['Password must be at least 6 characters']
        });
        return;
      }

      setCheckingPassword(true);
      try {
        const response = await authAPI.checkPassword(formData.password);
        setPasswordStrength(response.passwordStrength);
      } catch (err) {
        console.error('Password check failed:', err);
      } finally {
        setCheckingPassword(false);
      }
    };

    // Debounce password check
    const timer = setTimeout(checkPassword, 300);
    return () => clearTimeout(timer);
  }, [formData.password]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordStrength && passwordStrength.score < 2) {
      setError('Password is too weak. Please follow the suggestions.');
      return;
    }

    setLoading(true);

    try {
      const result = await signup(formData.username, formData.email, formData.password);
      
      if (result.success) {
        navigate('/chat');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={Styles.container}>
      <div className={Styles.wrapper}>
        {/* Header */}
        <div className={Styles.header}>
          <div className={Styles.iconWrapper}>
            <MessageSquare className={Styles.icon} />
          </div>
          <h1 className={Styles.title}>Create Account</h1>
          <p className={Styles.subtitle}>Join AI Chatbot and start chatting</p>
        </div>

        {/* Signup Form */}
        <div className={Styles.card}>
          <form onSubmit={handleSubmit} className={Styles.form}>
            {/* Error Message */}
            {error && (
              <div className={Styles.errorAlert}>
                {error}
              </div>
            )}

            {/* Username Input */}
            <div className={Styles.inputGroup}>
              <label htmlFor="username" className={Styles.label}>
                Username
              </label>
              <div className={Styles.inputWrapper}>
                <div className={Styles.inputIcon}>
                  <User className={Styles.inputIconSvg} />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={Styles.input}
                  placeholder="johndoe"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email Input */}
            <div className={Styles.inputGroup}>
              <label htmlFor="email" className={Styles.label}>
                Email Address
              </label>
              <div className={Styles.inputWrapper}>
                <div className={Styles.inputIcon}>
                  <Mail className={Styles.inputIconSvg} />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={Styles.input}
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className={Styles.inputGroup}>
              <label htmlFor="password" className={Styles.label}>
                Password
              </label>
              <div className={Styles.inputWrapper}>
                <div className={Styles.inputIcon}>
                  <Lock className={Styles.inputIconSvg} />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={Styles.input}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className={Styles.strengthContainer}>
                  {/* Strength Bar */}
                  <div className={Styles.strengthBarBg}>
                    <div 
                      className={`${Styles.strengthBar} ${
                        passwordStrength?.strength === 'weak' ? Styles.strengthWeak :
                        passwordStrength?.strength === 'medium' ? Styles.strengthMedium :
                        passwordStrength?.strength === 'strong' ? Styles.strengthStrong :
                        ''
                      }`}
                    ></div>
                  </div>

                  {/* Strength Text */}
                  <div className={Styles.strengthTextWrapper}>
                    <span className={`${Styles.strengthText} ${
                      passwordStrength?.strength === 'weak' ? Styles.strengthTextWeak :
                      passwordStrength?.strength === 'medium' ? Styles.strengthTextMedium :
                      passwordStrength?.strength === 'strong' ? Styles.strengthTextStrong :
                      Styles.strengthTextDefault
                    }`}>
                      {checkingPassword ? (
                        'Checking...'
                      ) : passwordStrength ? (
                        `Password Strength: ${passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}`
                      ) : (
                        'Enter password'
                      )}
                    </span>
                  </div>

                  {/* Feedback */}
                  {passwordStrength && passwordStrength.feedback && (
                    <div className={Styles.feedbackContainer}>
                      {passwordStrength.feedback.map((feedback, index) => (
                        <div key={index} className={Styles.feedbackItem}>
                          {passwordStrength.strength === 'strong' ? (
                            <CheckCircle className={Styles.feedbackIconSuccess} />
                          ) : (
                            <XCircle className={Styles.feedbackIconDefault} />
                          )}
                          <span className={Styles.feedbackText}>{feedback}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className={Styles.inputGroup}>
              <label htmlFor="confirmPassword" className={Styles.label}>
                Confirm Password
              </label>
              <div className={Styles.inputWrapper}>
                <div className={Styles.inputIcon}>
                  <Lock className={Styles.inputIconSvg} />
                </div>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={Styles.input}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={Styles.submitButton}
            >
              {loading ? (
                <>
                  <Loader className={Styles.spinner} />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className={Styles.buttonIcon} />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className={Styles.divider}>
            <div className={Styles.dividerLine}></div>
            <span className={Styles.dividerText}>or</span>
            <div className={Styles.dividerLine}></div>
          </div>

          {/* Sign In Link */}
          <div className={Styles.linkContainer}>
            <p className={Styles.linkText}>
              Already have an account?{' '}
              <Link to="/login" className={Styles.link}>
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={Styles.footer}>
          <p>© 2024 AI Chatbot. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;