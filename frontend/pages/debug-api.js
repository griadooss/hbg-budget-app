export default function DebugAPI() {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Environment Variable Debug</h1>
      <div style={{ margin: '20px 0' }}>
        <strong>NEXT_PUBLIC_API_URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'NOT SET'}
      </div>
      <div style={{ margin: '20px 0' }}>
        <strong>NODE_ENV:</strong> {process.env.NODE_ENV}
      </div>
      <div style={{ margin: '20px 0' }}>
        <strong>VERCEL_ENV:</strong> {process.env.VERCEL_ENV}
      </div>
      <div style={{ margin: '20px 0' }}>
        <strong>All NEXT_PUBLIC_ vars:</strong>
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
    </div>
  );
} 