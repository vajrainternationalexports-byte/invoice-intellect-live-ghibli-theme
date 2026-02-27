import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockData } from "@/lib/mock-data";
import { ArrowUpRight, TrendingUp, AlertCircle, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Overview</h1>
          <p className="text-sm text-gray-500">Welcome back, Sarah</p>
        </div>
        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
          <span className="text-primary font-semibold">SA</span>
        </div>
      </header>

      {/* Main Stats Card */}
      <div className="bg-primary rounded-3xl p-6 text-white shadow-lg shadow-primary/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
        <p className="text-primary-foreground/80 font-medium text-sm mb-1">Total Pending Payable</p>
        <h2 className="text-4xl font-bold mb-4">${mockData.stats.totalPending.toLocaleString()}</h2>
        
        <div className="flex gap-4">
          <div className="bg-black/10 backdrop-blur-md rounded-2xl p-3 flex-1">
            <div className="flex items-center gap-1.5 text-xs text-primary-foreground/90 mb-1">
              <Clock size={14} /> Upcoming
            </div>
            <p className="font-semibold">{mockData.stats.upcomingPayments} Payments</p>
          </div>
          <div className="bg-black/10 backdrop-blur-md rounded-2xl p-3 flex-1">
            <div className="flex items-center gap-1.5 text-xs text-primary-foreground/90 mb-1">
              <AlertCircle size={14} /> Discrepancies
            </div>
            <p className="font-semibold">{mockData.stats.discrepancies} Invoices</p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div>
        <h3 className="text-lg font-bold mb-3 text-gray-900">Monthly Volume</h3>
        <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-6 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockData.monthlyVolume}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#8E8E93'}} />
                <Tooltip 
                  cursor={{fill: '#F2F2F7'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold mb-3 text-gray-900">Recent Activity</h3>
        <div className="space-y-3">
          {mockData.invoices.slice(0, 2).map((inv) => (
            <div key={inv.id} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                  <ArrowUpRight size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{inv.vendor}</p>
                  <p className="text-xs text-gray-500">{inv.id} • {inv.status}</p>
                </div>
              </div>
              <p className="font-bold text-gray-900">${inv.amount.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}