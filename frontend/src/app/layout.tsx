import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/providers/QueryProvider';
import { Toaster } from 'react-hot-toast';
import Header from "@/components/ui/Header";
import React from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Smart Todo List - AI-Powered Task Management',
  description: 'An intelligent todo list application with AI-powered task enhancement, context processing, and smart insights.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <QueryProvider>
          <div className="min-h-screen bg-gray-50">
            <Toaster position="top-right" />
            {children}
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
