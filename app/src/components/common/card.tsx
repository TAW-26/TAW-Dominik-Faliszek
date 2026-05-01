import React from 'react';
import './styles/card.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div className={`ui-card ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}