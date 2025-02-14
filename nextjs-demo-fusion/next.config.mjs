/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "sepolia-optimism.etherscan.io",
          pathname: "/assets/**"
        },        
        {
          protocol: "https",
          hostname: "cryptologos.cc",
          pathname: "/logos/**"
        }
      ],
      dangerouslyAllowSVG: true,
      contentDispositionType: "attachment",
      contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
    }
  }
  
  export default nextConfig