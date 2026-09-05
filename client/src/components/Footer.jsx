import React from "react";
import { assets } from "../assets/assets";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white mt-12 sm:mt-20 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="container px-3 sm:px-4 2xl:px-20 mx-auto py-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
        <img width={140} className="max-w-[min(140px,70vw)] h-auto" src={assets.logo} alt="JobBoard Logo" />
        <p className="text-sm text-gray-400">
          © {currentYear} JobBoard. All rights reserved.
        </p>
        <div className="flex gap-3">
          <a href="#" className="hover:scale-110 transition-transform">
            <img width={34} src={assets.facebook_icon} alt="Facebook" />
          </a>
          <a href="#" className="hover:scale-110 transition-transform">
            <img width={34} src={assets.twitter_icon} alt="Twitter" />
          </a>
          <a href="#" className="hover:scale-110 transition-transform">
            <img width={34} src={assets.instagram_icon} alt="Instagram" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
