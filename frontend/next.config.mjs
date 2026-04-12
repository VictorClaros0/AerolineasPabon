/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: { ignoreDuringBuilds: true },
    typescript: { ignoreBuildErrors: true },
    transpilePackages: ['three', 'three-stdlib'],
};

export default nextConfig;
