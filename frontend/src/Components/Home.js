import React, { useState, useEffect } from "react";
import "./Homepage.css";
import Payment from "./Payment";

const Homepage = () => {
  const [activeTab, setActiveTab] = useState("signin");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [currentPage, setCurrentPage] = useState("home");

  const [featuredCars, setFeaturedCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:1911/cars', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => {});
        throw new Error(errorData?.error || 'Failed to fetch cars');
      }
      
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid cars data format');
      }
      setFeaturedCars(data);
    } catch (error) {
      console.error('Error fetching cars:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const [selectedCar, setSelectedCar] = useState(null);

  // Handle Login Form Submission
  const handleLogin = (e) => {
    e.preventDefault();
    fetch("http://localhost:1911/user/login", {  
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(loginData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          setMessage(data.error);
        } else {
          setMessage("Login successful!");
          setIsLoggedIn(true);
          setUserId(data.id);
        }
      })
      .catch(() => setMessage("An error occurred during login."));
  };

  // Handle Register Form Submission
  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage(""); 
    
    try {
      const response = await fetch("http://localhost:1911/user/register", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(registerData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => {});
        throw new Error(errorData?.error || 'Registration failed');
      }

      const data = await response.json();
      setMessage(data.message || "Registration successful!");
      setRegisterData({ name: "", email: "", password: "" });
      setActiveTab("signin");
    } catch (error) {
      console.error('Registration error:', error);
      setMessage(error.message || "An error occurred during registration. Please try again.");
    }
  };



  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserId(null);
  };

  if (isLoggedIn) {
    return (
      <div className="app-container">
        <nav className="main-nav">
          <div className="nav-brand">Premium Car Rental</div>
          <div className="nav-links">
            <button 
              className={currentPage === 'home' ? 'active' : ''}
              onClick={() => {
                setCurrentPage('home');
                setSelectedCar(null);
              }}
            >
              Home
            </button>
            <button 
              className={currentPage === 'payment' ? 'active' : ''}
              onClick={() => currentPage === 'payment' ? setCurrentPage('home') : null}
            >
              Payment
            </button>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </nav>

        <main className="main-content">
          {currentPage === 'home' && (
            <div className="welcome-section">
              <h1>Welcome to Premium Car Rental</h1>
              <p>Experience luxury and comfort with our premium fleet of vehicles.</p>
              <div className="featured-cars">
                {featuredCars.map((car, index) => (
                  <div key={index} className="featured-car">
                    <img src={car.image} alt={car.name} />
                    <h3>{car.name}</h3>
                    <p>${car.price}/day</p>
                    <button 
                      className="btn-primary" 
                      onClick={() => {
                        setSelectedCar(car);
                        setCurrentPage('payment');
                      }}
                    >
                      Book Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {currentPage === 'payment' && selectedCar && (
            <Payment 
              userId={userId} 
              carId={selectedCar.id} 
              carName={selectedCar.name} 
              pricePerDay={selectedCar.price} 
              onCancel={() => {
                setCurrentPage('home');
                setSelectedCar(null);
              }}
            />
          )}
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <h2>Loading...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="homepage">
      <header className="header">
        <div className="header-box">
          <h1>Premium Car Rental</h1>
          <p>Your Journey, Your Choice</p>
        </div>
      </header>

      <div className="auth-container">
        <div className="auth-tabs">
          <button
            className={`tab ${activeTab === "signin" ? "active" : ""}`}
            onClick={() => setActiveTab("signin")}
          >
            SIGN IN
          </button>
          <button
            className={`tab ${activeTab === "register" ? "active" : ""}`}
            onClick={() => setActiveTab("register")}
          >
            REGISTER
          </button>
        </div>

        {activeTab === "signin" ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email Address"
              className="input-field"
              value={loginData.email}
              onChange={(e) =>
                setLoginData({ ...loginData, email: e.target.value })
              }
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="input-field"
              value={loginData.password}
              onChange={(e) =>
                setLoginData({ ...loginData, password: e.target.value })
              }
              required
            />
            <button className="btn-primary" type="submit">
              SIGN IN
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Full Name"
              className="input-field"
              value={registerData.name}
              onChange={(e) =>
                setRegisterData({ ...registerData, name: e.target.value })
              }
              required
            />
            <input
              type="email"
              placeholder="Email Address"
              className="input-field"
              value={registerData.email}
              onChange={(e) =>
                setRegisterData({ ...registerData, email: e.target.value })
              }
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="input-field"
              value={registerData.password}
              onChange={(e) =>
                setRegisterData({ ...registerData, password: e.target.value })
              }
              required
            />
            <button className="btn-primary" type="submit">
              REGISTER
            </button>
          </form>
        )}
      </div>

      {message && <div className="message">{message}</div>}

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>About Us</h3>
            <p>Premium Car Rental offers luxury and comfort at competitive prices. Experience the best in automotive excellence.</p>
          </div>
          <div className="footer-section">
            <h3>Contact</h3>
            <p>Email: info@premiumcarrental.com</p>
            <p>Phone: 1-800-CAR-RENT</p>
          </div>
          <div className="footer-section">
            <h3>Our Services</h3>
            <div className="service-links">
              <a href="#luxury">Luxury Cars</a>
              <a href="#suv">SUVs</a>
              <a href="#economy">Economy Cars</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 Premium Car Rental. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;


