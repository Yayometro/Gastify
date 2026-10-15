/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com', 'scontent-qro1-1.xx.fbcdn.net', 'scontent.fmex44-1.fna.fbcdn.net', 'res.cloudinary.com'].map((hostname) => ({ protocol: 'https', hostname }))
    },
    transpilePackages: ['antd', '@ant-design/cssinjs', '@ant-design/icons', '@ant-design/nextjs-registry'],
    // reactStrictMode: false,
    async headers() {
        return [
            {
                // Category icons (public/icons/fluent): one year, immutable. The URL carries
                // ?v=<set version> (src/components/icons/fluentIcons.ts) so a rebuilt set gets new URLs.
                source: '/icons/fluent/:file*',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
            },
        ];
    },
}

module.exports = nextConfig
