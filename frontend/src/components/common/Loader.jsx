import { Loader2 } from 'lucide-react';

const Loader = ({ text = 'Loading...' }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: '64px',
    }}>
      <Loader2
        size={36}
        style={{ color: '#1D6EF5', animation: 'spin 1s linear infinite' }}
      />
      <p style={{ color: '#64748B', fontSize: '14px', fontWeight: 500 }}>{text}</p>
    </div>
  );
};

export default Loader;
