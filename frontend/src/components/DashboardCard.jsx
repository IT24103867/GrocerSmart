import React from 'react';
import Card from './ui/Card';

export default function DashboardCard({ 
  title, 
  subtitle, 
  children, 
  action,
  className = '',
  contentClassName = ''
}) {
  return (
    <Card 
      title={title} 
      subtitle={subtitle} 
      actions={action} 
      className={className} 
      glass={true}
    >
      <div className={contentClassName}>
        {children}
      </div>
    </Card>
  );
}
