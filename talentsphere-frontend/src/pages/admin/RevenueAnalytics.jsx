import { useEffect, useState } from 'react';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  Filter,
  CreditCard,
  Target,
  Users,
  Building
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAdminStore } from '../../stores/adminStore';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/helpers';

// Mock chart components (in a real app, you'd use recharts or similar)
const SimpleBarChart = ({ data, title }) => (
  <div className="space-y-2">
    <h4 className="text-sm font-medium">{title}</h4>
    <div className="space-y-1">
      {data.slice(0, 5).map((item, index) => (
        <div key={index} className="flex justify-between items-center">
          <span className="text-sm text-gray-600">{item.label}</span>
          <span className="text-sm font-medium">{formatCurrency(item.value)}</span>
        </div>
      ))}
    </div>
  </div>
);

const SimpleLineChart = ({ data, title }) => (
  <div className="space-y-2">
    <h4 className="text-sm font-medium">{title}</h4>
    <div className="h-32 flex items-end space-x-1">
      {data.map((point, index) => (
        <div
          key={index}
          className="bg-blue-500 w-4 rounded-t"
          style={{ height: `${(point.value / Math.max(...data.map(d => d.value))) * 100}%` }}
          title={`${point.date}: ${formatCurrency(point.value)}`}
        />
      ))}
    </div>
  </div>
);

const RevenueAnalytics = () => {
  const { 
    revenueAnalytics, 
    isLoading, 
    error, 
    fetchRevenueAnalytics 
  } = useAdminStore();

  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchRevenueAnalytics(parseInt(timeRange));
  }, [timeRange, fetchRevenueAnalytics]);

  if (isLoading && !revenueAnalytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load revenue analytics: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!revenueAnalytics) {
    return null;
  }

  const {
    daily_revenue = [],
    revenue_by_purpose = [],
    top_companies = [],
    payment_methods = []
  } = revenueAnalytics;

  // Calculate totals and trends
  const totalRevenue = daily_revenue.reduce((sum, day) => sum + day.revenue, 0);
  const averageDailyRevenue = totalRevenue / daily_revenue.length;
  const recentRevenue = daily_revenue.slice(-7).reduce((sum, day) => sum + day.revenue, 0);
  const previousRevenue = daily_revenue.slice(-14, -7).reduce((sum, day) => sum + day.revenue, 0);
  const growthRate = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Revenue Analytics</h1>
          <p className="text-gray-600 mt-1">Financial performance and revenue insights</p>
        </div>
        <div className="flex space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {growthRate >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={growthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatPercentage(Math.abs(growthRate))} vs last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageDailyRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Based on {daily_revenue.length} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Sources</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenue_by_purpose.length}</div>
            <p className="text-xs text-muted-foreground">
              Different revenue streams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Customers</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{top_companies.length}</div>
            <p className="text-xs text-muted-foreground">
              Paying companies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="customers">Top Customers</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Revenue Trend</CardTitle>
                <CardDescription>Revenue generated each day</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleLineChart 
                  data={daily_revenue.map(d => ({ date: d.date, value: d.revenue }))} 
                  title="Daily Revenue"
                />
              </CardContent>
            </Card>

            {/* Revenue by Purpose */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Purpose</CardTitle>
                <CardDescription>Breakdown by revenue streams</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenue_by_purpose.map((purpose, index) => {
                    const percentage = (purpose.revenue / totalRevenue) * 100;
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{purpose.purpose}</span>
                          <span className="text-sm text-gray-600">
                            {formatCurrency(purpose.revenue)} ({formatPercentage(percentage)})
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          {purpose.count} transactions
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Weekly and monthly patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center text-gray-500 py-8">
                    Advanced trend analysis would be implemented here with proper charting library
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Forecasting</CardTitle>
                <CardDescription>Projected revenue based on trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center text-gray-500 py-8">
                    Revenue forecasting would be implemented here
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Revenue by payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payment_methods.map((method, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{method.method}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(method.revenue)}</div>
                        <div className="text-sm text-gray-500">{method.count} transactions</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Revenue Sources Detail */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Sources Detail</CardTitle>
                <CardDescription>Detailed breakdown of all revenue streams</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {revenue_by_purpose.map((purpose, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{purpose.purpose}</div>
                        <div className="text-sm text-gray-500">{purpose.count} transactions</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(purpose.revenue)}</div>
                        <div className="text-sm text-gray-500">
                          Avg: {formatCurrency(purpose.revenue / purpose.count)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Top Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Paying Companies</CardTitle>
              <CardDescription>Companies contributing the most revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {top_companies.map((company, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {company.company?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{company.company}</div>
                        <div className="text-sm text-gray-500">
                          #{index + 1} customer
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">
                        {formatCurrency(company.total_spent)}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Top {Math.round(((top_companies.length - index) / top_companies.length) * 100)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RevenueAnalytics;
