
import Card from './Card';

const StatCard = ({ title, value, icon: Icon, trend, subtitle }) => (
  <Card className="p-6 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-2">
      <div className="text-sm font-medium text-gray-600">{title}</div>
      {Icon && <Icon size={20} className="text-gray-400" />}
    </div>
    <div className="text-3xl font-bold mb-1">{value}</div>
    {trend !== undefined && (
      <div className={`text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
      </div>
    )}
    {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
  </Card>
);

export default StatCard;
