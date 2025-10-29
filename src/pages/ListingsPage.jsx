import { mockListings } from "../mockData.js";

export default function ListingsPage({ setRoute }) {
  return (
    <div className="p-6 space-y-6">
      {/* Top banner like in WelcomeScreen */}
      <div className="bg-blue-100 border border-blue-200 text-blue-700 text-xs px-4 py-2 rounded flex items-center justify-between">
        <span>
          Love WelcomeScreen? Refer in your network and earn $9.99 credit
        </span>
        <button className="bg-blue-600 text-white text-xs px-3 py-1 rounded">
          Refer Now
        </button>
      </div>

      {/* Search + buttons row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* search box */}
        <div className="flex items-center border border-gray-300 rounded px-3 py-2 text-sm w-full max-w-xs">
          <input
            className="outline-none flex-1 text-sm"
            placeholder="Search Listing..."
          />
          <span className="text-gray-400 text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-2">
          <button className="border border-gray-300 text-sm px-3 py-2 rounded bg-white">
            Export Listings
          </button>
          <button className="bg-blue-600 text-white text-sm px-3 py-2 rounded">
            + Add Listing
          </button>
        </div>
      </div>

      {/* Listings cards */}
      <div className="grid gap-4 sm:max-w-md">
        {mockListings.map((listing) => (
          <div
            key={listing.id}
            className="border border-gray-300 rounded-lg overflow-hidden bg-white"
          >
            {/* image */}
            <div className="h-40 w-full bg-gray-100">
              <img
                src={listing.photoUrl}
                alt={listing.name}
                className="h-full w-full object-cover"
              />
            </div>

            {/* info */}
            <div className="p-4 space-y-2">
              <div className="text-sm font-medium text-gray-900 leading-snug">
                {listing.name}
              </div>
              <div className="text-xs text-gray-600 leading-snug">
                {listing.address}
              </div>

              {/* action buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                  onClick={() => {
                    alert("Preview display (TV preview)");
                  }}
                >
                  Preview
                </button>

                <button
                  className="flex-1 border border-blue-600 text-blue-600 rounded px-3 py-2 text-sm bg-white"
                  onClick={() => {
                    // navigate to property config later
                    setRoute({
                      type: "property",
                      id: listing.id,
                      tab: "display",
                    });
                  }}
                >
                  Edit →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}