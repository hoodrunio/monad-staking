/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  webpack: (config, { isServer }) => {
    // Fix for MetaMask SDK React Native dependencies
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
    };

    // Ignore React Native specific modules
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push('@react-native-async-storage/async-storage');
    }

    return config;
  },
};

export default nextConfig;
