import React, { useState } from 'react';
import { UserAccount } from '../types';
import { User, LogIn, UserPlus, Check, Trash2, X, Shield, ArrowRight } from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
  accounts: UserAccount[];
  onSelectAccount: (username: string) => void;
  onCreateAccount: (username: string) => void;
  onDeleteAccount: (username: string) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  currentUsername,
  accounts,
  onSelectAccount,
  onCreateAccount,
  onDeleteAccount,
}) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNick = usernameInput.trim();
    if (!cleanNick) {
      setErrorMessage('Пожалуйста, введите никнейм');
      return;
    }
    if (cleanNick.length < 2) {
      setErrorMessage('Никнейм должен содержать минимум 2 символа');
      return;
    }

    // Check if account already exists
    const exists = accounts.some((a) => a.username.toLowerCase() === cleanNick.toLowerCase());
    if (exists) {
      const matched = accounts.find((a) => a.username.toLowerCase() === cleanNick.toLowerCase());
      if (matched) {
        onSelectAccount(matched.username);
        onClose();
        return;
      }
    }

    // If account doesn't exist yet, automatically create it
    onCreateAccount(cleanNick);
    onClose();
  };

  const handleCreateNew = () => {
    const cleanNick = usernameInput.trim();
    if (!cleanNick) {
      setErrorMessage('Введите никнейм для регистрации нового аккаунта');
      return;
    }
    if (cleanNick.length < 2) {
      setErrorMessage('Никнейм должен содержать минимум 2 символа');
      return;
    }

    const exists = accounts.some((a) => a.username.toLowerCase() === cleanNick.toLowerCase());
    if (exists) {
      setErrorMessage(`Аккаунт с ником «${cleanNick}» уже существует. Нажмите «Войти».`);
      return;
    }

    onCreateAccount(cleanNick);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto"
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
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-main)]">
                Аккаунты и сохранение
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Вход и регистрация по никнейму (логину) без паролей
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active User Banner */}
        <div
          className="my-4 p-3 rounded-xl border flex items-center justify-between gap-3 text-xs"
          style={{
            backgroundColor: 'var(--bg-surface-hover)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--accent-primary)]" />
            <span className="text-[var(--text-muted)]">Текущий аккаунт:</span>
            <span className="font-bold font-mono text-[var(--text-main)] text-sm">
              {currentUsername}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            Активен
          </span>
        </div>

        {/* Quick Nickname Input Form */}
        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
              Никнейм / Логин
            </label>
            <div className="relative">
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Например: student_se, alikhan, dastan..."
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border bg-transparent text-[var(--text-main)] focus:outline-none font-mono font-semibold"
                style={{ borderColor: errorMessage ? '#ef4444' : 'var(--border-subtle)' }}
              />
            </div>
            {errorMessage && (
              <p className="text-xs text-red-500 mt-1 font-medium">{errorMessage}</p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Войти под этим ником</span>
            </button>

            <button
              type="button"
              onClick={handleCreateNew}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold border text-[var(--text-main)] hover:border-[var(--accent-primary)] transition-all flex items-center gap-1.5"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <UserPlus className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>Зарегистрировать новый</span>
            </button>
          </div>
        </form>

        {/* Saved Accounts List */}
        <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2.5">
            Сохраненные аккаунты ({accounts.length})
          </h4>

          {accounts.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] py-3 text-center">
              Нет сохраненных аккаунтов. Введите никнейм выше для создания.
            </p>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {accounts.map((acc) => {
                const isActive = acc.username.toLowerCase() === currentUsername.toLowerCase();
                return (
                  <div
                    key={acc.username}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      isActive ? 'border-[var(--accent-primary)]' : ''
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
                        <div className="text-xs font-bold font-mono text-[var(--text-main)] truncate">
                          {acc.username}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono">
                          {new Date(acc.lastLoginAt || acc.createdAt).toLocaleDateString('ru-RU')}
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
                          onClick={() => {
                            onSelectAccount(acc.username);
                            onClose();
                          }}
                          className="px-3 py-1 rounded-lg text-xs font-semibold text-white shadow-sm flex items-center gap-1 transition-all active:scale-95"
                          style={{ backgroundColor: 'var(--accent-primary)' }}
                        >
                          <span>Войти</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {/* Delete account button (only if not the only account) */}
                      {accounts.length > 1 && (
                        <>
                          {confirmDeleteUser === acc.username ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  onDeleteAccount(acc.username);
                                  setConfirmDeleteUser(null);
                                }}
                                className="px-2 py-0.5 rounded text-[10px] font-bold text-white bg-red-600"
                              >
                                Да
                              </button>
                              <button
                                onClick={() => setConfirmDeleteUser(null)}
                                className="px-1.5 py-0.5 rounded text-[10px] text-[var(--text-muted)] border"
                                style={{ borderColor: 'var(--border-subtle)' }}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteUser(acc.username)}
                              title="Удалить сохраненные данные этого аккаунта"
                              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 transition-colors"
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
