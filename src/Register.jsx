import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import useWindowSize from 'react-use/lib/useWindowSize'; 
import './Register.css';
import SideBar from './SideBar.jsx';

const Step1Account = ({ formData, updateFormData, errors }) => (
    <>
        <h2>Create Your Account</h2>
        <p className="register-subtitle">Let's start with the basics.</p>
        {errors.general && <p className="error-step">{errors.general}</p>}
        <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <input id="name" type="text" value={formData.name} onChange={(e) => updateFormData('name', e.target.value)} placeholder="Enter your full name" required />
            {errors.name && <p className="error-field">{errors.name}</p>}
        </div>
        <div className="input-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={formData.email} onChange={(e) => updateFormData('email', e.target.value)} placeholder="Enter your email" required />
            {errors.email && <p className="error-field">{errors.email}</p>}
        </div>
        <div className="input-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={formData.password} onChange={(e) => updateFormData('password', e.target.value)} placeholder="Create a password (min. 6 characters)" required />
            {errors.password && <p className="error-field">{errors.password}</p>}
        </div>
         <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={(e) => updateFormData('confirmPassword', e.target.value)} placeholder="Confirm your password" required />
            {errors.confirmPassword && <p className="error-field">{errors.confirmPassword}</p>}
        </div>
    </>
);

const Step2Biometrics = ({ formData, updateFormData, errors }) => (
    <>
        <h2>Tell Us About Yourself</h2>
        <p className="register-subtitle">This helps personalize your experience.</p>
         {errors.general && <p className="error-step">{errors.general}</p>}
        <div className="input-group">
            <label htmlFor="age">Age</label>
            <input id="age" type="number" value={formData.age} onChange={(e) => updateFormData('age', e.target.value)} placeholder="Your age" required min="1" />
            {errors.age && <p className="error-field">{errors.age}</p>}
        </div>
        <div className="input-group inline">
            <div className="input-group-half">
                <label htmlFor="weight">Weight (kg)</label>
                <input id="weight" type="number" step="0.1" value={formData.weight_kg} onChange={(e) => updateFormData('weight_kg', e.target.value)} placeholder="e.g., 70.5" required min="1"/>
                 {errors.weight_kg && <p className="error-field">{errors.weight_kg}</p>}
            </div>
            <div className="input-group-half">
                <label htmlFor="height">Height (cm)</label>
                <input id="height" type="number" step="0.1" value={formData.height_cm} onChange={(e) => updateFormData('height_cm', e.target.value)} placeholder="e.g., 175" required min="1"/>
                 {errors.height_cm && <p className="error-field">{errors.height_cm}</p>}
            </div>
        </div>
        <div className="input-group">
            <label htmlFor="gender">Gender</label>
            <select id="gender" value={formData.gender} onChange={(e) => updateFormData('gender', e.target.value)} required>
                <option value="" disabled>Select your gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
            </select>
             {errors.gender && <p className="error-field">{errors.gender}</p>}
        </div>
    </>
);

const Step3Lifestyle = ({ formData, updateFormData, errors }) => (
    <>
        <h2>Activity Level</h2>
        <p className="register-subtitle">How active are you generally?</p>
         {errors.general && <p className="error-step">{errors.general}</p>}
        <div className="input-group">
            <label htmlFor="activity_level">Select your typical activity level:</label>
            <select id="activity_level" value={formData.activity_level} onChange={(e) => updateFormData('activity_level', e.target.value)} required>
                <option value="" disabled>Select activity level</option>
                <option value="Sedentary">Sedentary (Little to no exercise)</option>
                <option value="Moderate">Moderate (Light exercise/sports 1-3 days/week)</option>
                 <option value="Intermediate">Intermediate (Moderate exercise/sports 3-5 days/week)</option>
                 <option value="Challenging">Challenging (Hard exercise/sports 6-7 days a week)</option>
                 <option value="Advanced">Advanced (Very hard exercise/sports & physical job)</option>
            </select>
             {errors.activity_level && <p className="error-field">{errors.activity_level}</p>}
        </div>
    </>
);

const Step4Confirmation = ({ name }) => {
    const { width, height } = useWindowSize();
    return (
        <div className="confirmation-step">
             <Confetti width={width} height={height} recycle={false} numberOfPieces={300} />
            <h2>Welcome, {name}!</h2>
            <p className="register-subtitle">Your Health Motivator account is ready.</p>
            <p>You're all set to start tracking your progress and achieving your wellness goals.</p>
        </div>
    );
};

const Register = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '', 
        age: '',
        weight_kg: '',
        height_cm: '',
        gender: '',
        activity_level: '',
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [userId, setUserId] = useState(null); 

    const navigate = useNavigate();

    const updateFormData = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
         if (errors.general) {
             setErrors(prev => ({ ...prev, general: null }));
         }
    };

    const validateStep1 = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Full Name is required.";
        if (!formData.email.trim()) {
            newErrors.email = "Email is required.";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
             newErrors.email = "Email is invalid.";
        }
        if (!formData.password) {
            newErrors.password = "Password is required.";
        } else if (formData.password.length < 6) {
             newErrors.password = "Password must be at least 6 characters.";
        }
         if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
         const newErrors = {};
         const ageNum = parseInt(formData.age, 10);
         const weightNum = parseFloat(formData.weight_kg);
         const heightNum = parseFloat(formData.height_cm);

         if (!formData.age || isNaN(ageNum) || ageNum <= 0) newErrors.age = "Valid age is required.";
         if (!formData.weight_kg || isNaN(weightNum) || weightNum <= 0) newErrors.weight_kg = "Valid weight (kg) is required.";
         if (!formData.height_cm || isNaN(heightNum) || heightNum <= 0) newErrors.height_cm = "Valid height (cm) is required.";
         if (!formData.gender) newErrors.gender = "Gender is required.";

         setErrors(newErrors);
         return Object.keys(newErrors).length === 0;
    };

     const validateStep3 = () => {
         const newErrors = {};
         if (!formData.activity_level) newErrors.activity_level = "Activity level is required.";
         setErrors(newErrors);
         return Object.keys(newErrors).length === 0;
    };

    const handleRegisterUser = async () => {
        if (!validateStep1()) return;

        setIsLoading(true);
        setErrors({}); 

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setUserId(data.user.user_id); 
                setCurrentStep(2); 
            } else {
                 const backendErrors = {};
                 if (data.errors) { 
                     data.errors.forEach(err => {
                         backendErrors[err.path] = err.msg;
                     });
                 } else if (data.error) { 
                     backendErrors.general = data.error;
                 } else {
                     backendErrors.general = "Registration failed. Please try again.";
                 }
                 setErrors(backendErrors);
            }
        } catch (error) {
            console.error('Registration Error:', error);
            setErrors({ general: "An unexpected network error occurred." });
        } finally {
            setIsLoading(false);
        }
    };

    // handles Step 3: Save Profile Information
    const handleSaveProfile = async () => {
        if (!validateStep3()) return; 

        setIsLoading(true);
        setErrors({});

        try {
            const response = await fetch('/api/user/profile', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', 
                body: JSON.stringify({
                    age: parseInt(formData.age, 10),
                    weight_kg: parseFloat(formData.weight_kg),
                    height_cm: parseFloat(formData.height_cm),
                    gender: formData.gender,
                    activity_level: formData.activity_level,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setCurrentStep(4);
            } else {
                 const backendErrors = {};
                 if (data.errors) {
                     data.errors.forEach(err => {
                         backendErrors[err.path] = err.msg;
                     });
                 } else {
                     backendErrors.general = data.error || "Failed to save profile. Please try again.";
                 }
                  setErrors(backendErrors);
            }
        } catch (error) {
            console.error('Save Profile Error:', error);
            setErrors({ general: "An unexpected network error occurred while saving profile." });
        } finally {
            setIsLoading(false);
        }
    };


    const handleNext = () => {
        if (currentStep === 1) {
            handleRegisterUser(); 
        } else if (currentStep === 2) {
             if (validateStep2()) {
                setCurrentStep(3);
             }
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1 && currentStep < 4) { 
            setErrors({}); 
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleFinish = () => {
        handleSaveProfile();
    };

     const handleGoToDashboard = () => {
        navigate('/dashboard'); 
    };

     const progress = ((currentStep -1) / 3) * 100; 


    return (
        <>
            <SideBar />
            <div className="register-page">
                <div className="register-container multi-step">

                    {currentStep < 4 && (
                         <div className="progress-bar-container">
                            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                             <div className="step-indicators">
                                 <span className={currentStep >= 1 ? 'active' : ''}>1</span>
                                 <span className={currentStep >= 2 ? 'active' : ''}>2</span>
                                 <span className={currentStep >= 3 ? 'active' : ''}>3</span>
                             </div>
                         </div>
                    )}


                    <form onSubmit={(e) => e.preventDefault()} className="register-form">
                        <div className={`form-step ${currentStep === 1 ? 'active' : ''}`}>
                            {currentStep === 1 && <Step1Account formData={formData} updateFormData={updateFormData} errors={errors} />}
                        </div>
                        <div className={`form-step ${currentStep === 2 ? 'active' : ''}`}>
                             {currentStep === 2 && <Step2Biometrics formData={formData} updateFormData={updateFormData} errors={errors} />}
                        </div>
                         <div className={`form-step ${currentStep === 3 ? 'active' : ''}`}>
                             {currentStep === 3 && <Step3Lifestyle formData={formData} updateFormData={updateFormData} errors={errors} />}
                        </div>
                         <div className={`form-step ${currentStep === 4 ? 'active' : ''}`}>
                              {currentStep === 4 && <Step4Confirmation name={formData.name} />}
                         </div>

                        <div className="navigation-buttons">
                            {currentStep > 1 && currentStep < 4 && (
                                <button type="button" onClick={handlePrevious} className="prev-button" disabled={isLoading}>
                                    Previous
                                </button>
                            )}

                            {currentStep === 1 && (
                                <button type="button" onClick={handleNext} className="next-button" disabled={isLoading}>
                                    {isLoading ? 'Creating Account...' : 'Next'}
                                </button>
                            )}
                             {currentStep === 2 && (
                                <button type="button" onClick={handleNext} className="next-button" disabled={isLoading}>
                                     Next
                                </button>
                            )}
                             {currentStep === 3 && (
                                <button type="button" onClick={handleFinish} className="finish-button" disabled={isLoading}>
                                    {isLoading ? 'Finishing...' : 'Finish Setup'}
                                </button>
                            )}
                             {currentStep === 4 && (
                                 <button type="button" onClick={handleGoToDashboard} className="dashboard-button">
                                    Go to Dashboard
                                </button>
                            )}
                        </div>
                    </form>

                    {currentStep === 1 && (
                        <>
                            <div className="auth-divider">
                                <span>Already have an account?</span>
                            </div>
                            <div className="login-redirect">
                                <button className="login-button" onClick={() => navigate('/login')} disabled={isLoading}>
                                    Sign In
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default Register;