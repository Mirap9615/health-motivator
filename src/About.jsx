import React from "react";
import SideBar from "./SideBar.jsx";
import "./About.css";

const About = () => {
  const features = [
    {
      title: "Personalized Health Score",
      description: "Get instant, digestible feedback based on your daily habits."
    },
    {
      title: "Seamless Data Integration",
      description: "Track your fitness and diet data all in one place."
    },
    {
      title: "Comparative Insights",
      description: "See how you stack up against others in your age group."
    },
    {
      title: "AI-Powered Coaching",
      description: "Receive customized tips on improving your fitness and nutrition."
    },
    {
      title: "Manual Input Support",
      description: "Not using wearables? Manually log your health data with ease."
    }
  ];

  return (
    <>
      <SideBar />
      <div className="about-container">
        <section className="about-hero">
          <div className="hero-content">
            <h1>Welcome to Health Motivator</h1>
            <p className="tagline">Empowering you to take control of your health, one step at a time.</p>
          </div>
        </section>

        <div className="about-content">
          <section className="about-section">
            <h2>Our Mission</h2>
            <div className="section-content">
              <p>
                At <strong>Health Motivator</strong>, we believe that small, consistent habits lead to a healthier life.
                Our goal is to provide you with an interactive and insightful way to track, understand, and improve
                your physical activity, diet, and overall well-being.
              </p>
              <p>
                By giving you a personalized health score based on your daily activities, 
                we aim to make health tracking engaging and rewarding.
              </p>
            </div>
          </section>

          <section className="about-section features-section">
            <h2>What Makes Us Different?</h2>
            <div className="features-grid">
              {features.map((feature, index) => (
                <div className="feature-card" key={index}>
                  <div className="feature-icon">✦</div>
                  <div className="feature-content">
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="about-section cta-section">
            <h2>Join Us on This Journey</h2>
            <div className="section-content">
              <p>
                Whether you're looking to track your fitness progress, eat healthier, or simply stay mindful of your daily habits, 
                <strong> Health Motivator</strong> is here to support you every step of the way.
              </p>
              <div className="cta-container">
                <p className="cta-text">Start today and take control of your well-being!</p>
                <a href="/register" className="cta-button">Get Started</a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default About;
