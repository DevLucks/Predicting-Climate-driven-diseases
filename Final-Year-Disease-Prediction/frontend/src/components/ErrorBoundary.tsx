import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { failed: boolean; error: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, error: '' };

  static getDerivedStateFromError(e: Error): State {
    return { failed: true, error: e.message };
  }

  render() {
    if (this.state.failed) {
      return this.props.fallback ?? (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--navy-mid)', gap: 'var(--s3)',
          fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)',
          color: 'var(--text-dim)', padding: 'var(--s5)',
          textAlign: 'center',
        }}>
          <div style={{ color: 'var(--teal)', letterSpacing: '0.1em' }}>MAP UNAVAILABLE</div>
          <div>Could not load choropleth map</div>
          <div style={{ color: 'var(--text-dim)', fontSize: 9 }}>{this.state.error}</div>
        </div>
      );
    }
    return this.props.children;
  }
}
