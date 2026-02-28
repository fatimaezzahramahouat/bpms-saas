import React from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideProps } from 'lucide-react';

interface FunctionIconProps extends LucideProps {
  iconName: string;
}

export const FunctionIcon: React.FC<FunctionIconProps> = ({ iconName, ...props }) => {
  const Icon = (LucideIcons as any)[iconName] || LucideIcons.Activity;
  return <Icon {...props} />;
};
