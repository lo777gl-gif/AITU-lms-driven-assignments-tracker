import React, { useState, useRef, useEffect } from 'react';
import { DEFAULT_MOODLE_URL } from '../data/defaultCalendar';
import { RefreshCw, Upload, Link2, FileText, CheckCircle2, AlertCircle, X, HelpCircle, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedUrl: string;
  onSaveUrl: (url: string) => void;
  onSyncFromUrl: (url: string) => Promise<{ success: boolean; count: number; error?: string }>;
  onImportIcsText: (text: string) => { success: boolean; count: number; error?: string };
  onResetToDefault: () => void;
  lastSyncTimestamp: number;
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
}) => {
  const [calendarUrl, setCalendarUrl] = useState(savedUrl || DEFAULT_MOODLE_URL);
  const [activeMode, setActiveMode] = useState<'url' | 'file' | 'paste'>('url');
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

  if (!isOpen) return null;

  const handleSyncUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUrl = calendarUrl.trim();
    if (!targetUrl) return;

    // Save user's URL
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
      // Ignore clipboard read permission denial
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
      setStatusMessage({ type: 'error', text: res.error || 'Некорректный формат iCalendar' });
    }
  };

  const formatLastSync = (ts: number) => {
    if (!ts) return 'Никогда';
    return new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Asia/Almaty',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(ts));
  };

  const isCustomUrl = calendarUrl.trim() !== DEFAULT_MOODLE_URL;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className="w-full max-w-xl rounded-2xl border p-6 shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto"
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
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-main)]">
                Подключение своего Moodle LMS
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
          className="flex items-center gap-2 p-1 rounded-xl my-4 border"
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-hover)',
          }}
        >
          <button
            onClick={() => setActiveMode('url')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeMode === 'url'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Ссылка на ваш Moodle</span>
          </button>

          <button
            onClick={() => setActiveMode('file')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
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
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeMode === 'paste'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Вставить текст</span>
          </button>
        </div>

        {/* Mode 1: URL input */}
        {activeMode === 'url' && (
          <form onSubmit={handleSyncUrl} className="space-y-4">
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
                  {isCustomUrl ? (
                    <span className="text-emerald-500 font-medium">✓ Используется ваша персональная ссылка</span>
                  ) : (
                    <span>Используется демонстрационная ссылка</span>
                  )}
                </p>

                {isCustomUrl && (
                  <button
                    type="button"
                    onClick={() => setCalendarUrl(DEFAULT_MOODLE_URL)}
                    className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-main)] underline"
                  >
                    Сбросить к исходной AITU
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

        {/* Mode 2: Drag and drop file */}
        {activeMode === 'file' && (
          <div className="space-y-4">
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
                или нажмите для выбора файла на вашем компьютере
              </p>
            </div>
          </div>
        )}

        {/* Mode 3: Paste text */}
        {activeMode === 'paste' && (
          <form onSubmit={handlePasteSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                Вставьте содержимое файла iCalendar (начиная с BEGIN:VCALENDAR)
              </label>
              <textarea
                rows={7}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="BEGIN:VCALENDAR&#10;VERSION:2.0&#10;BEGIN:VEVENT..."
                className="w-full px-3 py-2 rounded-xl text-xs border bg-transparent text-[var(--text-main)] font-mono focus:outline-none"
                style={{ borderColor: 'var(--border-subtle)' }}
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              Распарсить и обновить задания
            </button>
          </form>
        )}

        {/* Status Alert */}
        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 font-medium'
                : statusMessage.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-500 font-medium'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-500 font-medium'
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
                text: 'Восстановлен эталонный календарь курсов Astana IT University!',
              });
              setTimeout(() => onClose(), 1000);
            }}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] underline"
          >
            Загрузить демо-календарь AITU (офлайн)
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
