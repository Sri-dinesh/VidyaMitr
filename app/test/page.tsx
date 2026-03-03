export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-indigo-600 mb-4">
            🎉 Tailwind is Working!
          </h1>
          <p className="text-xl text-gray-600">
            If you can see this styled page, Tailwind CSS v4 is configured correctly.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">✅ Colors Working</h3>
            <p className="text-sm text-blue-700">Background gradients and color utilities are applied.</p>
          </div>

          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
            <h3 className="font-semibold text-indigo-900 mb-2">✅ Spacing Working</h3>
            <p className="text-sm text-indigo-700">Padding, margins, and gaps are properly sized.</p>
          </div>

          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-2">✅ Typography Working</h3>
            <p className="text-sm text-purple-700">Font sizes, weights, and families are applied.</p>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">✅ Layout Working</h3>
            <p className="text-sm text-green-700">Flexbox, grid, and positioning utilities work.</p>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-500 transition-colors shadow-lg">
            Primary Button
          </button>
          <button className="flex-1 border-2 border-indigo-600 text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors">
            Secondary Button
          </button>
        </div>

        <div className="mt-8 text-center">
          <a href="/" className="text-indigo-600 hover:text-indigo-500 font-medium">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
