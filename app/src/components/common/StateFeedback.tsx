import React from 'react';
import './styles/state_feedback.css';

interface StateFeedbackProps {
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
  asTableRow?: boolean;
  colSpan?: number;
}

export default function StateFeedback({
  loading,
  error,
  isEmpty,
  emptyMessage = "Brak danych do wyświetlenia.",
  onRetry,
  children,
  asTableRow = false,
  colSpan = 1
}: StateFeedbackProps) {

  const renderContent = (content: React.ReactNode, className: string) => {
    const innerUI = <div className={`state-container ${className}`}>{content}</div>;
    return asTableRow ? (
      <tr>
        <td colSpan={colSpan}>{innerUI}</td>
      </tr>
    ) : (
      innerUI
    );
  };

  if (loading) {
    return renderContent(
      <>
        <div className="spinner"></div>
        <p>Ładowanie danych...</p>
      </>,
      ''
    );
  }

  if (error) {
    return renderContent(
      <>
        <p><strong>Wystąpił błąd:</strong> {error}</p>
        {onRetry && (
          <button onClick={onRetry} className="btn-primary" style={{ marginTop: '10px' }}>
            Spróbuj ponownie
          </button>
        )}
      </>,
      'error-state'
    );
  }

  if (isEmpty) {
    return renderContent(<p>{emptyMessage}</p>, 'empty-state');
  }

  return <>{children}</>;
}