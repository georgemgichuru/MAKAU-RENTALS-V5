import React from "react";
import { NavLink } from "react-router-dom";
import { Home, CreditCard, AlertTriangle, Settings } from "lucide-react";

const TenantMobileNav = () => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/tenant" },
    { id: "payments", label: "Payments", icon: CreditCard, path: "/tenant/payments" },
    { id: "report", label: "Report", icon: AlertTriangle, path: "/tenant/report" },
    { id: "settings", label: "Settings", icon: Settings, path: "/tenant/settings" },
  ];

  return (
    <div className="bg-white border-t border-gray-200 md:hidden">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === "/tenant"}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-3 ${
                  isActive ? "text-blue-600" : "text-gray-400"
                }`
              }
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default TenantMobileNav;
