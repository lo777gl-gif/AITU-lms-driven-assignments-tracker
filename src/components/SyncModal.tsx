import React, { useState, useRef, useEffect } from 'react';
import { DEFAULT_MOODLE_URL } from '../data/defaultCalendar';
import { WEEKLY_BALANCE_OPTIONS } from '../utils/levelMath';
import {
  RefreshCw,
  Upload,
  Link2,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Target,
  Check,
  Settings,
} from 'lucide-react';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedUrl: string;
  onSaveUrl: (url: string) => void;
  onSyncFromUrl: (url: string) => Promise<{ success: boolean; count: number; error?: string }>;
  onImportIcsText: (text: string) => { success: boolean; count: number; error?: string };
  onResetToDefault: () => void;
  lastSyncTimestamp: number;
  weeklyTargetPoints: number;
  onUpdateWeeklyTarget: (points: number) => void;
  initialTab?: 'balance' | 'url' | 'file' | 'paste';
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  savedUrl,
  onSaveUrl,
  onSyncFromUrl,
  onImportIcsText,
  onResetToDefault,
  lastSyncTimestamp,
  weeklyTargetPoints,
  onUpdateWeeklyTarget,
  initialTab = 'balance',
}) => {
  const [calendarUrl, setCalendarUrl] = useState(savedUrl || DEFAULT_MOODLE_URL);
  const [activeMode, setActiveMode] = useState<'balance' | 'url' | 'file' | 'paste'>(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [rawText, setRawText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (savedUrl) {
      setCalendarUrl(savedUrl);
    }
  }, [savedUrl]);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveMode(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleSyncUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUrl = calendarUrl.trim();
    if (!targetUrl) return;

    onSaveUrl(targetUrl);
    setIsLoading(true);
    setStatusMessage({ type: 'info', text: 'Загрузка и парсинг календаря Moodle...' });

    try {
      const res = await onSyncFromUrl(targetUrl);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Синхронизировано! Загружено/обновлено ${res.count} заданий. Ссылка сохранена.`,
        });
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Не удалось загрузить данные по этой ссылке. Проверьте адрес или загрузите файл .ics.',
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка при синхронизации';
      setStatusMessage({ type: 'error', text: message });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text && text.startsWith('http')) {
          setCalendarUrl(text.trim());
          setStatusMessage({ type: 'info', text: 'Ссылка вставлена из буфера обмена!' });
          setTimeout(() => setStatusMessage(null), 2000);
        }
      }
    } catch {
      // Ignore clipboard permission issues
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.ics') && !file.type.includes('calendar') && !file.name.endsWith('.txt')) {
      setStatusMessage({ type: 'error', text: 'Пожалуйста, выберите файл с расширением .ics (iCalendar).' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const res = onImportIcsText(text);
        if (res.success) {
          setStatusMessage({
            type: 'success',
            text: `Файл прочитан! Загружено ${res.count} квестов из ${file.name}.`,
          });
          setTimeout(() => onClose(), 1200);
        } else {
          setStatusMessage({ type: 'error', text: res.error || 'Ошибка парсинга файла .ics' });
        }
      }
    };
    reader.onerror = () => {
      setStatusMessage({ type: 'error', text: 'Не удалось прочитать локальный файл' });
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    const res = onImportIcsText(rawText);
    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: `Импортировано ${res.count} квестов из вставленного текста!`,
      });
      setTimeout(() => onClose(), 1200);
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Не удалось распознать формат iCalendar' });
    }
  };

  const formatLastSync = (timestamp: number) => {
    if (!timestamp) return 'Ещё не проводилась';
    return new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Asia/Almaty',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-xl rounded-2xl border p-5 sm:p-6 shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto"
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
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm"
              style={{
                backgroundColor: 'var(--accent-primary)',
              }}
            >
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-main)]">
                Настройки и Moodle LMS
              </h3>
              <div className="text-xs text-[var(--text-muted)] font-mono">
                Синхронизировано: {formatLastSync(lastSyncTimestamp)} (Астана, UTC+5)
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl my-4 border"
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-hover)',
          }}
        >
          <button
            onClick={() => setActiveMode('balance')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-lg transition-all ${
              activeMode === 'balance'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Балансировка</span>
          </button>

          <button
            onClick={() => setActiveMode('url')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-lg transition-all ${
              activeMode === 'url'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Moodle URL</span>
          </button>

          <button
            onClick={() => setActiveMode('file')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-lg transition-all ${
              activeMode === 'file'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Файл .ics</span>
          </button>

          <button
            onClick={() => setActiveMode('paste')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-lg transition-all ${
              activeMode === 'paste'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Текст</span>
          </button>
        </div>

        {/* Safe synchronization banner */}
        <div
          className="flex items-center gap-2 p-2.5 rounded-xl mb-4 border text-[11px] text-[var(--text-muted)] leading-snug"
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-hover)',
          }}
        >
          <span className="text-emerald-500 font-bold shrink-0">🛡️ Безопасное сохранение:</span>
          <span>Все ваши созданные задания, привычки, установленные штрафы и заработанный прогресс надежно сохраняются.</span>
        </div>

        {/* Tab 1: Weekly Points Balancing Configuration */}
        {activeMode === 'balance' && (
          <div className="space-y-3.5 animate-fadeIn">
            <div>
              <h4 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>Рекомендованная недельная балансировка баллов</span>
              </h4>
              <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                Задайте желаемый недельный ориентир для вашей программы. Основной рекомендованный режим составляет <strong>200 баллов</strong> в неделю.
                При переключении шкалы награды за <strong>текущие активные задания</strong> масштабируются автоматически (например, при 400 б. задания S ранга дают 90 б. вместо 45), а за уже сданные квесты баллы сохраняются.
              </p>
            </div>

            <div className="space-y-2">
              {WEEKLY_BALANCE_OPTIONS.map((opt) => {
                const isSelected = (weeklyTargetPoints || 200) === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onUpdateWeeklyTarget(opt.value);
                      setStatusMessage({
                        type: 'success',
                        text: `Недельная цель обновлена: ${opt.label}!`,
                      });
                      setTimeout(() => setStatusMessage(null), 2000);
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${
                      isSelected
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-sm'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-surface-hover)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--text-main)] font-mono">
                          {opt.label}
                        </span>
                        {opt.isRecommended && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                            Основное / Рекомендуемое
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
                        {opt.desc}
                      </p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white'
                          : 'border-[var(--border-subtle)]'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: URL input */}
        {activeMode === 'url' && (
          <form onSubmit={handleSyncUrl} className="space-y-4 animate-fadeIn">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[var(--text-main)]">
                  Ваша персональная ссылка на экспорт календаря Moodle
                </label>
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="text-[11px] text-[var(--accent-primary)] hover:underline flex items-center gap-1"
                >
                  Вставить из буфера
                </button>
              </div>

              <input
                type="url"
                required
                value={calendarUrl}
                onChange={(e) => setCalendarUrl(e.target.value)}
                placeholder="https://lms.../calendar/export_execute.php?userid=...&authtoken=..."
                className="w-full px-3 py-2 rounded-xl text-xs border bg-transparent text-[var(--text-main)] font-mono focus:outline-none"
                style={{ borderColor: 'var(--border-subtle)' }}
              />

              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  {calendarUrl.trim() ? (
                    <span className="text-emerald-500 font-medium">✓ Ссылка для синхронизации установлена</span>
                  ) : (
                    <span>Вставьте URL экспорта календаря из вашей системы Moodle</span>
                  )}
                </p>

                {calendarUrl.trim() && (
                  <button
                    type="button"
                    onClick={() => setCalendarUrl('')}
                    className="text-[11px] text-[var(--text-muted)] hover:text-red-400 underline"
                  >
                    Очистить
                  </button>
                )}
              </div>
            </div>

            {/* Accordion Guide: How to get Moodle URL */}
            <div
              className="rounded-xl border p-3 text-xs"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-surface-hover)',
              }}
            >
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="w-full flex items-center justify-between font-semibold text-[var(--text-main)]"
              >
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span>Как получить свою персональную ссылку в Moodle (30 секунд)</span>
                </span>
                {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showGuide && (
                <ol className="list-decimal list-inside space-y-1.5 mt-2.5 text-[var(--text-muted)] leading-relaxed pl-1 pt-2 border-t"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <li>Войдите в личный кабинет вашей Moodle LMS (например, lms.astanait.edu.kz).</li>
                  <li>Перейдите в раздел <strong>«Календарь»</strong> в левом меню.</li>
                  <li>Прокрутите страницу вниз и нажмите кнопку <strong>«Экспорт календаря»</strong>.</li>
                  <li>Выберите <strong>«Все события»</strong> или «События курсов» и нужный период.</li>
                  <li>Нажмите <strong>«Получить URL календаря»</strong> и скопируйте сформированный адрес.</li>
                  <li>Вставьте полученный URL в поле выше и нажмите кнопку ниже.</li>
                </ol>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold text-white shadow-sm transition-all active:scale-95 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--accent-primary)',
              }}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Загрузка заданий...' : 'Сохранить ссылку и синхронизировать'}</span>
            </button>
          </form>
        )}

        {/* Tab 3: Drag and drop file */}
        {activeMode === 'file' && (
          <div className="space-y-4 animate-fadeIn">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                isDragging ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'hover:border-[var(--border-strong)]'
              }`}
              style={{ borderColor: isDragging ? undefined : 'var(--border-subtle)' }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".ics,text/calendar"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <Upload className="w-10 h-10 mx-auto text-[var(--accent-primary)] mb-2" />
              <div className="font-bold text-sm text-[var(--text-main)]">
                Перетащите файл календаря (.ics) сюда
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                или нажмите для выбора файла на устройстве
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Paste raw text */}
        {activeMode === 'paste' && (
          <form onSubmit={handlePasteSubmit} className="space-y-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                Вставьте содержимое файла календаря (BEGIN:VCALENDAR...)
              </label>
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="BEGIN:VCALENDAR&#10;VERSION:2.0&#10;PRODID:-//Moodle..."
                className="w-full px-3 py-2 rounded-xl text-xs border bg-transparent text-[var(--text-main)] font-mono focus:outline-none"
                style={{ borderColor: 'var(--border-subtle)' }}
              />
            </div>

            <button
              type="submit"
              disabled={!rawText.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all active:scale-95 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--accent-primary)',
              }}
            >
              <FileText className="w-4 h-4" />
              <span>Распознать и импортировать</span>
            </button>
          </form>
        )}

        {/* Status Message Alert */}
        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-xl border flex items-center gap-2 text-xs animate-fadeIn ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : statusMessage.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Fallback */}
        <div
          className="mt-5 pt-4 border-t flex items-center justify-between"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <button
            type="button"
            onClick={() => {
              onResetToDefault();
              setCalendarUrl(DEFAULT_MOODLE_URL);
              setStatusMessage({
                type: 'success',
                text: 'Загружен пример учебных квестов и задач!',
              });
              setTimeout(() => onClose(), 1000);
            }}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] underline"
          >
            Восстановить пример расписания
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] border"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
