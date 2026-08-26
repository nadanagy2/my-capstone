export default function DashboardPage() {
  return (
    <div className="min-h-full bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded shadow">Summary Card 1</div>
          <div className="p-4 bg-white rounded shadow">Summary Card 2</div>
          <div className="p-4 bg-white rounded shadow">Summary Card 3</div>
        </div>
      </div>
    </div>
  )
}
