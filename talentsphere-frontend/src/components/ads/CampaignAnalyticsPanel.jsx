/**
 * Campaign Analytics Panel - Display detailed analytics for employer campaigns
 * Integrates Chart.js for visualization of performance metrics
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, MousePointer, TrendingUp, DollarSign, Users, Activity } from 'lucide-react';
import adManagerService from '../../services/adManager';

const CampaignAnalyticsPanel = ({ campaignId, campaignName }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - dateRange);

      const response = await adManagerService.getAnalytics(campaignId, {
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10),
      });
      setAnalytics(response);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [campaignId, dateRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-8 text-muted-foreground">No analytics available</div>;
  }

  const totals = analytics.totals || {};
  const dailyData = analytics.daily || analytics.daily_breakdown || [];
  const creativesData = analytics.creatives_breakdown || [];
  const placementsData = analytics.placements_breakdown || [];

  // Calculate CPM and CPC
  const impressions = totals.impressions || 0;
  const clicks = totals.clicks || 0;
  const spend = totals.spend || 0;
  const cpm = impressions > 0 ? ((spend * 1000) / impressions).toFixed(2) : 0;
  const cpc = clicks > 0 ? (spend / clicks).toFixed(2) : 0;

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex justify-end mb-4">
        <Select value={dateRange.toString()} onValueChange={(v) => setDateRange(parseInt(v))}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          label="Impressions"
          value={impressions.toLocaleString()}
          icon={<Eye className="w-4 h-4" />}
          color="blue"
        />
        <MetricCard
          label="Reach"
          value={(totals.reach || 0).toLocaleString()}
          icon={<Users className="w-4 h-4" />}
          color="green"
        />
        <MetricCard
          label="Clicks"
          value={clicks.toLocaleString()}
          icon={<MousePointer className="w-4 h-4" />}
          color="orange"
        />
        <MetricCard
          label="CTR"
          value={`${(totals.ctr || 0).toFixed(2)}%`}
          icon={<TrendingUp className="w-4 h-4" />}
          color="purple"
        />
        <MetricCard
          label="Avg CPM"
          value={`$${cpm}`}
          icon={<DollarSign className="w-4 h-4" />}
          color="indigo"
        />
        <MetricCard
          label="Avg CPC"
          value={`$${cpc}`}
          icon={<Activity className="w-4 h-4" />}
          color="red"
        />
      </div>

      {/* Spend Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Total Spend</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">${spend.toFixed(2)}</p>
            </div>
            <DollarSign className="w-12 h-12 text-blue-200" />
          </div>
        </CardContent>
      </Card>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{campaignName ? `${campaignName} Performance` : 'Performance Trend'} (Last {dateRange} Days)</CardTitle>
          <CardDescription>Daily impressions and clicks</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="impressions"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
                name="Impressions"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="clicks"
                stroke="#FF6B35"
                strokeWidth={2}
                dot={false}
                name="Clicks"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Creative Performance Table */}
      {creativesData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Creative Performance</CardTitle>
            <CardDescription>Performance metrics per creative</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Creative</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">Spend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creativesData.map((creative) => (
                    <TableRow key={creative.id}>
                      <TableCell>
                        <div className="font-medium text-sm truncate max-w-xs">{creative.title}</div>
                      </TableCell>
                      <TableCell className="text-right">{creative.impressions.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{creative.clicks.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">{creative.ctr.toFixed(2)}%</TableCell>
                      <TableCell className="text-right font-medium">${creative.spend.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Placement Breakdown Chart */}
      {placementsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance by Placement</CardTitle>
            <CardDescription>Impressions and clicks by ad placement</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={placementsData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="placement_key" type="category" width={190} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="impressions" fill="#3B82F6" name="Impressions" />
                <Bar dataKey="clicks" fill="#FF6B35" name="Clicks" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {impressions > 0 && (
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Campaign received {impressions.toLocaleString()} impressions</span>
              </li>
            )}
            {clicks > 0 && (
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>
                  CTR of {(totals.ctr || 0).toFixed(2)}% with {clicks.toLocaleString()} clicks
                </span>
              </li>
            )}
            {creativesData.length > 0 && (
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>
                  Best performing creative: {creativesData[0].title} with{' '}
                  {creativesData[0].impressions.toLocaleString()} impressions
                </span>
              </li>
            )}
            {placementsData.length > 0 && (
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>
                  Top placement: {placementsData[0].name} with{' '}
                  {placementsData[0].impressions.toLocaleString()} impressions
                </span>
              </li>
            )}
            <li className="flex items-center gap-2">
              <span className="text-blue-600">i</span>
              <span>CPM: ${cpm} | CPC: ${cpc}</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ label, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <Card>
      <CardContent className={`pt-6 p-4 ${colorClasses[color]}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium opacity-75 mb-1">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
          <div className="opacity-30">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignAnalyticsPanel;
