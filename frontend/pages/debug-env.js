export default function DebugEnv() {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Environment Variable Debug</h1>
      <p><strong>NEXT_PUBLIC_API_URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'NOT SET'}</p>
      <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
      <p><strong>VERCEL_ENV:</strong> {process.env.VERCEL_ENV}</p>
      <p><strong>All NEXT_PUBLIC_ vars:</strong></p>
      <pre>
        {JSON.stringify(
          Object.keys(process.env)
            .filter(key => key.startsWith('NEXT_PUBLIC_'))
            .reduce((obj, key) => {
              obj[key] = process.env[key];
              return obj;
            }, {}),
          null,
          2
        )}
      </pre>
    </div>
  );
} 