import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, Loader, MessageSquare } from 'lucide-react';
import Styles from "./styles/Login.module.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        // Navigate based on role
        if (result.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/chat');
        }
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
          <h1 className={Styles.title}>Welcome Back</h1>
          <p className={Styles.subtitle}>Sign in to continue to AI Chatbot</p>
        </div>

        {/* Login Form */}
        <div className={Styles.card}>
          <form onSubmit={handleSubmit} className={Styles.form}>
            {/* Error Message */}
            {error && (
              <div className={Styles.errorAlert}>
                {error}
              </div>
            )}

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
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className={Styles.buttonIcon} />
                  Sign In
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

          {/* Sign Up Link */}
          <div className={Styles.linkContainer}>
            <p className={Styles.linkText}>
              Don't have an account?{' '}
              <Link to="/signup" className={Styles.link}>
                Create one now
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

export default LoginPage;