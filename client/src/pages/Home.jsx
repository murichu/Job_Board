import React, { useEffect } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import JobListings from "../components/JobListings";
import AppDownload from "../components/AppDownload";
import Footer from "../components/Footer";

const Home = () => {
  // Reset scroll position when navigating to home
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="flex flex-col">
      <Hero />
      <JobListings />
      <AppDownload />
    </div>
  );
};

export default Home;
