import { Link } from "react-router-dom";
import { CheckCircle, ArrowRight, School, Users, BarChart3, Bell, Shield, Globe } from "lucide-react";
import { APP_NAME, APP_FULL_NAME, APP_TAGLINE, PORTAL_CONFIGS } from "@/lib/constants";

const FEATURES = [
  { icon: School, title: "Multi-School Management", desc: "Manage unlimited schools from a single platform with isolated data per institution." },
  { icon: Users, title: "6 Role Portals", desc: "Dedicated portals for Super Admin, Principal, Teachers, Staff, Parents & Students." },
  { icon: BarChart3, title: "Analytics & Reports", desc: "Comprehensive reports on attendance, performance, fees and more." },
  { icon: Bell, title: "Smart Notifications", desc: "Real-time SMS & in-app notifications for all stakeholders." },
  { icon: Shield, title: "Secure & Compliant", desc: "Data encrypted at rest and in transit. Role-based access control." },
  { icon: Globe, title: "Built for Nepal", desc: "NEB curriculum, Nepali calendar (BS), local fee structures supported." },
];

const PLANS = [
  { name: "Basic", price: "NPR 2,999", period: "/month", students: "Up to 300 students", features: ["5 Teacher accounts", "Attendance tracking", "Basic reports", "Parent portal"] },
  { name: "Pro", price: "NPR 6,999", period: "/month", students: "Up to 1,000 students", features: ["Unlimited teachers", "Advanced analytics", "SMS notifications", "Fee management", "Exam module"], popular: true },
  { name: "Enterprise", price: "Custom", period: "", students: "Unlimited students", features: ["Everything in Pro", "Custom branding", "API access", "Dedicated support", "Multiple branches"] },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{APP_NAME[0]}</span>
            </div>
            <span className="font-bold text-gray-900">{APP_NAME}</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#portals" className="hover:text-gray-900 transition-colors">Portals</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
          </div>
          <Link
            to="/login"
            className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          Nepal's Modern School Management Platform
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
          {APP_FULL_NAME}
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">{APP_TAGLINE}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/login"
            className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="#features" className="border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors">
            See Features
          </a>
        </div>
      </section>

      {/* Portals */}
      <section id="portals" className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">One Platform, Six Portals</h2>
          <p className="text-center text-gray-500 text-sm mb-10">Every stakeholder gets their own tailored experience</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.values(PORTAL_CONFIGS).map((p) => (
              <div key={p.role} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
                <div className="text-2xl mb-3">{p.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{p.label} Portal</h3>
                <p className="text-xs text-gray-500">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Everything You Need</h2>
        <p className="text-center text-gray-500 text-sm mb-10">Built specifically for Nepali schools and colleges</p>
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <f.icon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Simple, Transparent Pricing</h2>
          <p className="text-center text-gray-500 text-sm mb-10">No hidden fees. Cancel anytime.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`bg-white rounded-xl border p-6 ${plan.popular ? "border-blue-500 shadow-md relative" : "border-gray-200"}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Most Popular</span>
                  </div>
                )}
                <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-2 mb-1">
                  <span className="text-2xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-gray-400 text-sm">{plan.period}</span>
                </div>
                <p className="text-xs text-gray-500 mb-4">{plan.students}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login"
                  className={`block text-center text-sm font-semibold py-2.5 rounded-lg transition-colors ${plan.popular ? "bg-blue-600 text-white hover:bg-blue-700" : "border border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>&copy; {new Date().getFullYear()} {APP_FULL_NAME}. Built for Nepal 🇳🇵</p>
      </footer>
    </div>
  );
}
