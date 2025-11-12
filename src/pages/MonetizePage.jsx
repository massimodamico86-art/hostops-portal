
import { DollarSign, TrendingUp, Target, Star } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import { mockData } from '../data/mockData';

const MonetizePage = ({ showToast }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Monetize with Viator</h1>
        <p className="text-gray-600">Earn commission by recommending local experiences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Earnings"
          value={`$${mockData.viatorStats.totalEarnings.toFixed(2)}`}
          icon={DollarSign}
          subtitle="All time"
        />
        <StatCard
          title="This Month"
          value={`$${mockData.viatorStats.thisMonth.toFixed(2)}`}
          icon={TrendingUp}
          trend={15}
        />
        <StatCard
          title="Total Bookings"
          value={mockData.viatorStats.bookings}
          icon={Target}
          subtitle="Via your links"
        />
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Featured Experiences</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockData.viatorStats.experiences.map(exp => (
            <div key={exp.id} className="flex gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
              <img src={exp.image} alt={exp.name} className="w-32 h-32 object-cover rounded-lg" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{exp.name}</h3>
                <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span>{exp.rating}</span>
                </div>
                <div className="text-lg font-bold text-blue-600 mb-2">${exp.price}</div>
                <div className="text-sm text-green-600 font-medium">
                  You earn: ${exp.commission}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-xl font-bold mb-2">How It Works</h2>
        <div className="space-y-2 text-gray-700">
          <p>1. Browse and add Viator experiences to your guidebooks</p>
          <p>2. Guests book experiences through your unique links</p>
          <p>3. Earn commission on every booking (typically 8-15%)</p>
        </div>
        <Button className="mt-4" onClick={() => showToast('Browse experiences feature coming soon!')}>
          Browse Experiences
        </Button>
      </Card>
    </div>
  );
};

export default MonetizePage;
