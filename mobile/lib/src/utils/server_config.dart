// Server URL — override via --dart-define=SERVER_URL=ws://... for production
const serverUrl = String.fromEnvironment(
  'SERVER_URL',
  defaultValue: 'ws://localhost:3001',
);
