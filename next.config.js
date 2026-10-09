/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com', 'scontent-qro1-1.xx.fbcdn.net', 'scontent.fmex44-1.fna.fbcdn.net', 'res.cloudinary.com'].map((hostname) => ({ protocol: 'https', hostname }))
    },
    transpilePackages: ['antd', '@ant-design/cssinjs', '@ant-design/icons', '@ant-design/plots', '@ant-design/charts', '@ant-design/nextjs-registry'],
    // reactStrictMode: false,
}

module.exports = nextConfig
