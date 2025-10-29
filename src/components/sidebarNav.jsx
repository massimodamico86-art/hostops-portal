export default function SidebarNav({ setRoute }) {
  const items = [
    "Listings",
    "Guidebooks",
    "Monetize",
    "PMS Integration",
    "Subscription",
    "Users",
    "FAQs",
    "Refer & Earn",
    "Setup",
  ];

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="text-xl font-semibold px-6 py-4 border-b">
        WelcomeScreen
      </div>
      <nav className="flex-1 overflow-y-auto">
        {items.map((item) => (
          <button
            key={item}
            onClick={() =>
              setRoute({ type: item.toLowerCase().replace(/\s+/g, "-") })
            }
            className="block w-full text-left px-6 py-2 text-sm hover:bg-blue-50"
          >
            {item}
          </button>
        ))}
      </nav>
    </aside>
  );
}