/** @type {import('next').NextConfig} */

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NEXT_PUBLIC_ENABLE_PWA !== 'true',
});

module.exports = withPWA({
  reactStrictMode: true,
});
