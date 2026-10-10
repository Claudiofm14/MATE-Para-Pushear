import React from 'react';
import { Layout } from '../components/Layout';

/**
 * Layout principal de la aplicación
 * Proporciona la estructura común para todas las páginas
 */
interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return <Layout>{children}</Layout>;
};

export default AppLayout;
