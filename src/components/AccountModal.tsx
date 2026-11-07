import React, { useState } from 'react';
import { UserAccount } from '../types';
import {
  User,
  LogIn,
  UserPlus,
  Check,
  Trash2,
  X,
  Shield,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  Cloud,
  RefreshCw,
} from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
  accounts: UserAccount[];
  onSelectAccount: (username: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  onCreateAccount: (username: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  onDeleteAccount: (username: string) => void;
  onRefreshCloudAccounts?: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  currentUsername,
  accounts,
  onSelectAccount,
  onCreateAccount,
  onDeleteAccount,
  onRefreshCloudAccounts,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login fields
  const [loginUsername, setLoginUsername] = useState(currentUsername || '');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Register fields
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegPasswordConfirm, setShowRegPasswordConfirm] = useState(false);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanNick = loginUsername.trim();
    if (!cleanNick) {
      setErrorMessage('Пожалуйста, введите никнейм');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Пожалуйста, введите пароль от аккаунта');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSelectAccount(cleanNick, loginPassword);
      if (res.success) {
        setSuccessMessage('Вход выполнен успешно!');
        setTimeout(() => {
          onClose();
        }, 400);
      } else {
        setErrorMessage(res.error || 'Неверный пароль или аккаунт не найден');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ошибка подключения к серверу');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanNick = regUsername.trim();
    if (!cleanNick) {
      setErrorMessage('Пожалуйста, укажите никнейм для регистрации');
      return;
    }
    if (cleanNick.length < 2) {
      setErrorMessage('Никнейм должен содержать минимум 2 символа');
      return;
    }
    if (!regPassword) {
      setErrorMessage('Придумайте пароль для аккаунта');
      return;
    }
    if (regPassword.length < 4) {
      setErrorMessage('Пароль должен содержать не менее 4 символов');
      return;
    }
    if (regPassword !== regPasswordConfirm) {
      setErrorMessage('Пароли не совпадают. Проверьте правильность подтверждения');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onCreateAccount(cleanNick, regPassword);
      if (res.success) {
        setSuccessMessage('Аккаунт успешно создан и синхронизирован с облаком!');
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        setErrorMessage(res.error || 'Не удалось создать аккаунт');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ошибка подключения к серверу');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSwitch = (username: string) => {
    setLoginUsername(username);
    setLoginPassword('');
    setActiveTab('login');
    setErrorMessage('');
    setSuccessMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg rounded-2xl border p-5 sm:p-6 shadow-2xl animate-scaleIn max-h-[92vh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between pb-4 border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                <span>Система аккаунтов</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center gap-1">
                  <Cloud className="w-2.5 h-2.5" />
                  <span>Облако</span>
                </span>
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Доступ к вашему прогрессу и баллам со всех ваших устройств
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Account Banner */}
        <div
          className="my-4 p-3 rounded-xl border flex items-center justify-between gap-3 text-xs"
          style={{
            backgroundColor: 'var(--bg-surface-hover)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Shield className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
            <span className="text-[var(--text-muted)]">Активный аккаунт:</span>
            <span className="font-bold font-mono text-[var(--text-main)] text-sm truncate">
              {currentUsername}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
            В сети
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex rounded-xl p-1 mb-4 border" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'login'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Вход в аккаунт</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'register'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Регистрация нового</span>
          </button>
        </div>

        {/* Global Error/Success Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center gap-2">
            <span>✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tab 1: Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                Никнейм / Логин
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => {
                    setLoginUsername(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="Ваш никнейм"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-sm border bg-transparent text-[var(--text-main)] focus:outline-none font-mono font-semibold"
                  style={{ borderColor: 'var(--border-subtle)' }}
                  required
                />
                <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                Пароль для входа
              </label>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="Введите пароль"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm border bg-transparent text-[var(--text-main)] focus:outline-none font-mono"
                  style={{ borderColor: 'var(--border-subtle)' }}
                  required
                />
                <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? 'Проверка пароля...' : 'Войти в аккаунт'}</span>
            </button>
          </form>
        )}

        {/* Tab 2: Register Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                Никнейм нового пользователя
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => {
                    setRegUsername(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="Придумайте никнейм"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-sm border bg-transparent text-[var(--text-main)] focus:outline-none font-mono font-semibold"
                  style={{ borderColor: 'var(--border-subtle)' }}
                  required
                />
                <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                Пароль (минимум 4 символа)
              </label>
              <div className="relative">
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => {
                    setRegPassword(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="Придумайте пароль"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm border bg-transparent text-[var(--text-main)] focus:outline-none font-mono"
                  style={{ borderColor: 'var(--border-subtle)' }}
                  required
                />
                <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                Подтверждение пароля
              </label>
              <div className="relative">
                <input
                  type={showRegPasswordConfirm ? 'text' : 'password'}
                  value={regPasswordConfirm}
                  onChange={(e) => {
                    setRegPasswordConfirm(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="Повторите пароль еще раз"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm border bg-transparent text-[var(--text-main)] focus:outline-none font-mono"
                  style={{ borderColor: 'var(--border-subtle)' }}
                  required
                />
                <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowRegPasswordConfirm(!showRegPasswordConfirm)}
                  className="absolute right-3 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                >
                  {showRegPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Регистрация...' : 'Зарегистрировать аккаунт'}</span>
            </button>
          </form>
        )}

        {/* Saved Accounts List with Cloud indicator */}
        <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <span>Доступные аккаунты ({accounts.length})</span>
            </h4>
            {onRefreshCloudAccounts && (
              <button
                type="button"
                onClick={onRefreshCloudAccounts}
                title="Обновить список облачных аккаунтов"
                className="text-[10px] text-[var(--accent-primary)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Обновить</span>
              </button>
            )}
          </div>

          {accounts.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] py-3 text-center">
              Нет сохраненных аккаунтов. Зарегистрируйте новый аккаунт выше.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {accounts.map((acc) => {
                const isActive = acc.username.toLowerCase() === currentUsername.toLowerCase();
                return (
                  <div
                    key={acc.username}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      isActive ? 'border-[var(--accent-primary)] shadow-sm' : ''
                    }`}
                    style={{
                      backgroundColor: isActive ? 'var(--bg-surface-hover)' : 'transparent',
                      borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: 'var(--accent-primary)' }}
                      >
                        {acc.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold font-mono text-[var(--text-main)] truncate">
                            {acc.username}
                          </span>
                          <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-500">
                            облако
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono">
                          Вход: {new Date(acc.lastLoginAt || acc.createdAt).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isActive ? (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold text-emerald-500 bg-emerald-500/10 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Выбран</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleQuickSwitch(acc.username)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white shadow-sm flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                          style={{ backgroundColor: 'var(--accent-primary)' }}
                        >
                          <span>Войти</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {/* Delete account button */}
                      {accounts.length > 1 && (
                        <>
                          {confirmDeleteUser === acc.username ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteAccount(acc.username);
                                  setConfirmDeleteUser(null);
                                }}
                                className="px-2 py-0.5 rounded text-[10px] font-bold text-white bg-red-600 cursor-pointer"
                              >
                                Да
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteUser(null)}
                                className="px-1.5 py-0.5 rounded text-[10px] text-[var(--text-muted)] border cursor-pointer"
                                style={{ borderColor: 'var(--border-subtle)' }}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteUser(acc.username)}
                              title="Удалить аккаунт"
                              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
