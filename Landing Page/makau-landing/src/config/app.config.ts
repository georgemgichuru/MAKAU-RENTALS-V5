// Configuration for external app URLs
// Update these URLs to point to your React application

interface AppConfig {
  reactAppUrl: string;
  routes: {
    login: string;
    signup: string;
  };
  getUrl: (route: keyof AppConfig['routes']) => string;
}

export const config: AppConfig = {
  // Your React application base URL
  reactAppUrl: process.env.NEXT_PUBLIC_REACT_APP_URL || "http://localhost:3001",
  
  // Specific route paths (these will be appended to reactAppUrl)
  routes: {
    login: "/login",
    signup: "/signup",
  },
  
  // Helper function to get full URL
  getUrl(route) {
    return `${this.reactAppUrl}${this.routes[route]}`;
  },
};

export default config;
