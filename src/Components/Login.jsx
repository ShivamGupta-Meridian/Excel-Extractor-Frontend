import React from 'react'
import loginImage from "../assets/loginimage.jpg";
import { useState } from "react";
import { useNavigate } from 'react-router-dom';


function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();  // Prevent page reload
        setError("");
        setLoading(true);

        try {
            const response = await fetch("https://excelextractor-duh8e4ehhddxd0ar.eastus-01.azurewebsites.net/login", {
            // const response = await fetch("http://localhost:8000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id: email,  // Matching backend field name
                    password: password,
                }),
            });
            // console.log("Response: " + response)
            const data = await response.json();
            // console.log("Data: " + data)

            if (!response.ok) {
                throw new Error(data.detail || "Login failed");
            }

            alert("Login successful!");
            // console.log("Token:", data.access_token);
            sessionStorage.setItem("token", data.access_token); // Saves in sessionStorage (clears on browser close)
            navigate('/uploadImage'); // Navigates to the Hero component

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <section className="min-h-screen flex items-stretch text-white ">
                <div
                    className="lg:flex w-1/2 hidden bg-gray-500 bg-no-repeat bg-cover relative items-center"
                    style={{ backgroundImage: `url(${loginImage})` }}
                >                    <div className="absolute bg-black opacity-60 inset-0 z-0"></div>
                    <div className="w-full px-24 z-10">
                        <h1 className="text-5xl font-bold text-left tracking-wide">Excel Extractor</h1>
                        <p className="text-1xl my-4">Excel Extractor automates data extraction from images of Excel files and consolidates the extracted information into a structured Excel file. Users can upload multiple images containing tabular data, and the system will process them using OCR (Optical Character Recognition) and AI-based data extraction techniques.</p>
                    </div>
                  
                </div>
                <div className="lg:w-1/2 w-full flex items-center justify-center text-center md:px-16 px-0 z-0" style={{ backgroundColor: "#161616" }}>
                    <div className="absolute lg:hidden z-10 inset-0 bg-gray-500 bg-no-repeat bg-cover items-center" style={{ backgroundImage: `url("")` }}>
                        <div className="absolute bg-black opacity-60 inset-0 z-0"></div>
                    </div>
                    <div className="w-full py-6 z-20">
                    <h1 className="my-6 text-4xl font-bold text-white tracking-wider uppercase drop-shadow-lg">
    LOGIN
</h1>

<form onSubmit={handleSubmit} className="sm:w-2/3 w-full px-4 lg:px-0 mx-auto">
            {error && <p className="text-red-500">Invalid Credentials, Try Again.</p>}

            <div className="pb-2 pt-4">
                <input 
                    type="email" 
                    name="email" 
                    id="email" 
                    placeholder="Email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full p-4 text-lg rounded-sm bg-black text-white"
                    required 
                />
            </div>

            <div className="pb-2 pt-4">
                <input 
                    type="password" 
                    name="password" 
                    id="password" 
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full p-4 text-lg rounded-sm bg-black text-white"
                    required 
                />
            </div>

            <div className="px-4 pb-2 pt-4">
                <button 
                    type="submit"
                    className="uppercase block w-full p-4 text-lg rounded-full bg-indigo-500 hover:bg-indigo-600 focus:outline-none"
                    disabled={loading}
                >
                    {loading ? "Signing in..." : "Sign In"}
                </button>
            </div>
        </form>

                    </div>
                </div>
            </section>
          
        </div>
    )
}

export default Login