
import React, { useState } from "react";
import "./login.css"; // Import CSS file
import axios from "axios";
const Login = () => {
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Call your backend API (adjust URL if needed)
            const res = await axios.post("http://localhost:5000/api/users/login", formData);
            console.log("Login Success:", res.data);

            // Save token or redirect
            localStorage.setItem("token", res.data.token);
            alert("Login successful!");
        } catch (err) {
            console.error(err.response?.data || err.message);
            alert("Invalid credentials");
        }
    };

    return (
        <div className="login-container">
            
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <h2>Login</h2>
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>Password</label>
                    <div className="password-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        <span
                            className="toggle-password"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? "🔒" : "👁️"}
                        </span>
                    </div>
                </div>

                <button type="submit" className="btn">Login</button>

                <div className="extra-links">
                    <a href="#">Forgot Password?</a>
                </div>
            </form>
        </div>
    );
};

export default Login;
