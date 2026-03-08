import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <header className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-green-600">BidForJunk</h1>
        <div className="flex gap-4">
          <Link href="/login" className="btn-secondary">
            Log In
          </Link>
          <Link href="/signup" className="btn-primary">
            Sign Up
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Get Competitive Bids for Junk Removal
        </h2>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Post your junk removal job and receive bids from verified local providers.
          Compare prices, read reviews, and choose the best deal.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/signup" className="btn-primary text-lg px-8 py-3">
            Get Started
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="card">
            <div className="text-3xl mb-4">📋</div>
            <h3 className="text-lg font-semibold mb-2">Post Your Job</h3>
            <p className="text-gray-600">
              Describe what needs to be removed and where you are located.
            </p>
          </div>
          <div className="card">
            <div className="text-3xl mb-4">💰</div>
            <h3 className="text-lg font-semibold mb-2">Get Bids</h3>
            <p className="text-gray-600">
              Receive competitive bids from verified junk removal providers.
            </p>
          </div>
          <div className="card">
            <div className="text-3xl mb-4">✅</div>
            <h3 className="text-lg font-semibold mb-2">Get It Done</h3>
            <p className="text-gray-600">
              Choose a provider, pay securely through escrow, and get your junk removed.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
