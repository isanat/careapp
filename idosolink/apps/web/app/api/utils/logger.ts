export const logInfo = (message: string, meta?: Record<string, unknown>) => {
  console.log(JSON.stringify({ level: 'info', message, ...meta }));
};

export const logError = (message: string, meta?: Record<string, unknown>) => {
  console.error(JSON.stringify({ level: 'error', message, ...meta }));
};
