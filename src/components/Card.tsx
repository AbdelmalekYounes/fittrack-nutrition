import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  value?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export default function Card({ title, value, children, className }: CardProps) {
  return (
    <div className={`card ${className ?? ''}`.trim()}>
      {title && <div className="card__title">{title}</div>}
      {value !== undefined && <div className="card__value">{value}</div>}
      {children}
    </div>
  );
}
