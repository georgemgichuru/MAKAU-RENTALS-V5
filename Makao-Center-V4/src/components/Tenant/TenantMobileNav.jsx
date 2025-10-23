import React from "react";
import { NavLink } from "react-router-dom";
import { Home, CreditCard, AlertTriangle, Settings } from "lucide-react";

const TenantMobileNav = () => {
  // FIXED: Use same paths as TenantLayout
  const navItems = [
    { 
      id: "dashboard", 
      label: "Dashboard", 
      icon: Home, 
      path: "/tenant-dashboard"
    },
    { 
      id: "payments", 
      label: "Payments", 
      icon: CreditCard, 
      path: "/tenant-dashboard/payments"
    },
    { 
      id: "report", 
      label: "Report", 
      icon: AlertTriangle, 
      path: "/tenant-dashboard/report"
    },
    { 
      id: "settings", 
      label: "Settings", 
      icon: Settings, 
      path: "/tenant-dashboard/settings"
    },
  ];

  return (
    <div className="bg-white border-t border-gray-200 md:hidden fixed bottom-0 left-0 right-0 z-30">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.id === "dashboard"}
              className={({ isActive }) => 
                `flex flex-col items-center py-2 px-3 transition-colors ${
                  isActive 
                    ? "text-blue-600" 
                    : "text-gray-400 hover:text-blue-500"
                }`
              }
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
              
              {({ isActive }) => isActive && (
                <div className="w-1 h-1 bg-blue-600 rounded-full mt-1"></div>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default TenantMobileNav;