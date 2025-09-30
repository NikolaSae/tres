// app/(protected)/admin/aidash/components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 border border-red-500 rounded-lg bg-red-50 text-red-700">
          <h2 className="text-lg font-bold mb-2">Greška pri učitavanju dashboard-a</h2>
          <p>Došlo je do neočekivane greške. Osvežite stranicu ili kontaktirajte podršku.</p>
          {this.state.error && <pre className="mt-2 text-xs">{this.state.error.message}</pre>}
        </div>
      );
    }
    return this.props.children;
  }
}
