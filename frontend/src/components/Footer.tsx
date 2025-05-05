import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-gray-800 text-gray-300 mt-auto">
      <div className="container mx-auto px-4 py-6 text-center">
        <p>&copy; {currentYear} 甲状腺疾病科普网站. 保留所有权利.</p>
        {/* Optional: Add links or other info */}
        {/* <p className="mt-2">
          <a href="/privacy" className="hover:text-white">隐私政策</a> |
          <a href="/terms" className="hover:text-white">服务条款</a>
        </p> */}
      </div>
    </footer>
  );
};

export default Footer;