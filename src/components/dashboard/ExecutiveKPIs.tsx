import React from 'react';
import { TrendingUp, DollarSign, MousePointerClick, ShoppingBag, Search, ShieldCheck, Users } from 'lucide-react';

interface Props {
  kpis: {
    click_through_rate: number;
    ctr_lift: string;
    conversion_rate: number;
    conversion_lift: string;
    average_order_value: number;
    aov_lift: string;
    revenue_per_user: number;
    rpu_lift: string;
    search_abandonment_rate: number;
    total_recommendations_served: number;
  };
  sessionMetrics?: {
    active_sessions: number;
    total_clickstream_events: number;
    cold_start_sessions: number;
    three_click_usefulness_pct: number;
    search_abandons: number;
    fbt_bundle_purchases: number;
  };
}

export const ExecutiveKPIs: React.FC<Props> = ({ kpis, sessionMetrics }) => {
  const cards = [
    {
      title: "Click-Through Rate (CTR)",
      value: `${kpis.click_through_rate}%`,
      lift: kpis.ctr_lift,
      icon: MousePointerClick,
      color: "text-red-600",
      description: "Vs baseline popularity ranking"
    },
    {
      title: "Conversion Rate",
      value: `${kpis.conversion_rate}%`,
      lift: kpis.conversion_lift,
      icon: ShoppingBag,
      color: "text-green-700",
      description: "Direct recommendation purchases"
    },
    {
      title: "Average Order Value (AOV)",
      value: `₹${kpis.average_order_value.toFixed(2)}`,
      lift: kpis.aov_lift,
      icon: DollarSign,
      color: "text-gray-900",
      description: "Boosted by Complete-the-Look bundles"
    },
    {
      title: "Revenue Per User (RPU)",
      value: `₹${kpis.revenue_per_user.toFixed(2)}`,
      lift: kpis.rpu_lift,
      icon: TrendingUp,
      color: "text-red-700",
      description: "Net session value monetization"
    },
    ...(sessionMetrics ? [
      {
        title: "Cold-Start Usefulness",
        value: `${sessionMetrics.three_click_usefulness_pct}%`,
        lift: "+33%",
        icon: Users,
        color: "text-blue-700",
        description: `New users served well within 3 clicks (${sessionMetrics.cold_start_sessions} cold starts)`
      },
      {
        title: "Search Abandonment",
        value: `${kpis.search_abandonment_rate}%`,
        lift: "-30%",
        icon: Search,
        color: "text-amber-700",
        description: "Search/discovery abandonment reduction"
      },
      {
        title: "FBT Bundle Purchases",
        value: `${sessionMetrics.fbt_bundle_purchases}`,
        lift: "+12%",
        icon: ShieldCheck,
        color: "text-emerald-700",
        description: "Frequently bought together bundle conversions"
      }
    ] : [])
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between group hover:border-gray-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-bold text-gray-500">{card.title}</span>
              <div className={`p-2.5 rounded-lg bg-gray-100 ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{card.value}</span>
                <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                  {card.lift}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">{card.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
