export default async function getData() {
  // simulate short delay
  await new Promise((r) => setTimeout(r, 220))

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: [
      { name: 'Database', status: 'ok' },
      { name: 'Data source', status: 'ok' },
      { name: 'AI service', status: 'ok' },
    ],
  }
}
