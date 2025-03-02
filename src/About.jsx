import React from "react";
import SideBar from "./SideBar.jsx";
import "./About.css";

const About = () => {
  return (
    <>
      <SideBar />
      <div className="about-container">
        <h1>Welcome to Health Motivator</h1>
        <p className="tagline">Empowering you to take control of your health, one step at a time.</p>

        <section className="about-section">
          <h2>Our Mission</h2>
          <p>
            At <strong>Health Motivator</strong>, we believe that small, consistent habits lead to a healthier life.
            Our goal is to provide you with an interactive and insightful way to track, understand, and improve
            your physical activity, diet, and overall well-being. By giving you a personalized health score based on
            your daily activities, we aim to make health tracking engaging and rewarding.
          </p>
        </section>

        <section className="about-section">
          <h2>What Makes Us Different?</h2>
          <ul>
            <li>Personalized Health Score: – Get instant, digestible feedback based on your daily habits.</li>
            <li>Seamless Integration: – Sync with Fitbit for effortless tracking.</li>
            <li>Comparative Insights – See how you stack up against others in your age group.</li>
            <li>Actionable Recommendations – Receive customized tips on improving your fitness and nutrition.</li>
            <li>Manual Input Support – Not using wearables? **Manually log your health data** with ease.</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Join Us on This Journey</h2>
          <p>
            Whether you're looking to track your fitness progress, eat healthier, or simply stay mindful of your daily habits, 
            <strong>Health Motivator</strong> is here to support you every step of the way. Start today and take control of your well-being!
          </p>
        </section>
      </div>
    </>
  );
};

export default About;
