/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'publickey-credentials-create=(self)',
          },
        ],
      },
    ];
  },
  transpilePackages: ['@biconomy/sdk', '@biconomy/passkey']
};

export default nextConfig;