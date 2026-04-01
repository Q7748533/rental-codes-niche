export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="flex items-center space-x-4">
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse hidden sm:block" />
            <div className="h-4 w-10 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero Skeleton */}
        <div className="text-center mb-20 mt-8">
          <div className="h-12 w-3/4 mx-auto bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-12 w-1/2 mx-auto bg-gray-200 rounded animate-pulse mb-6" />
          <div className="h-6 w-2/3 mx-auto bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-1/3 mx-auto bg-gray-200 rounded animate-pulse mb-10" />
          
          {/* Search Widget Skeleton */}
          <div className="max-w-3xl mx-auto">
            <div className="h-14 w-full bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Brands Section Skeleton */}
        <section className="mb-24">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-lg border border-gray-200 animate-pulse" />
            ))}
          </div>
        </section>

        {/* Guide Section Skeleton */}
        <section className="mb-24">
          <div className="h-8 w-72 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-white rounded-xl shadow-sm border border-gray-200 animate-pulse" />
            ))}
          </div>
        </section>

        {/* FAQ Section Skeleton */}
        <section className="mb-24">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-white rounded-lg shadow-sm border border-gray-200 animate-pulse" />
            ))}
          </div>
        </section>
      </main>

      {/* Footer Skeleton */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="h-24 bg-gray-800 rounded animate-pulse" />
            <div className="h-24 bg-gray-800 rounded animate-pulse" />
            <div className="h-24 bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
      </footer>
    </div>
  );
}
