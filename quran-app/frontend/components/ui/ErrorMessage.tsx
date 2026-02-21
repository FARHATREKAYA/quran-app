import { useTranslation } from '@/hooks/useTranslation';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-red-600 mb-4">
        <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {t.error}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          {t.retry}
        </button>
      )}
    </div>
  );
}
