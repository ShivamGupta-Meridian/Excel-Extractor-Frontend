import React, { useState } from "react";
import upload from '../assets/upload.png';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

function Hero() {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [outputFileName, setOutputFileName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [csvFileUrl, setCsvFileUrl] = useState(null);


    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        setSelectedFiles(files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedFiles || selectedFiles.length === 0) {
            setError("Please select at least one file.");
            return;
        }

        setError("");
        setLoading(true);

        const formData = new FormData();
        formData.append("output_file_name", outputFileName || "merged_output.xlsx");

        for (let i = 0; i < selectedFiles.length; i++) {
            formData.append("files", selectedFiles[i]);
        }

        const token = sessionStorage.getItem("token"); // Get token from session storage
        if (!token) {
            setError("User not authenticated. Please log in.");
            setLoading(false);
            return;
        }

        try {
            // console.log("Token: " + token);
            // Log all form data key-value pairs
            // for (let [key, value] of formData.entries()) {
            //     console.log(`${key}:`, value);
            // }
            const response = await fetch("https://excelextractor-duh8e4ehhddxd0ar.eastus-01.azurewebsites.net/extract_merge_tables/", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`, // Send token
                },
                body: formData, // Send FormData
            });

            // console.log("Response: " + response)

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Upload failed");
            }

            setMessage("Tables extracted and merged successfully!");
            // console.log("Merged Excel URL:", data.merged_excel_url);
            setCsvFileUrl(data.merged_excel_url); // Update the state with the CSV file URL

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }
    return (
        <div
            className="relative min-h-screen flex items-center justify-center px-[3rem] bg-gray-500 bg-no-repeat bg-cover"
            style={{
                backgroundImage:
                    "url(https://images.unsplash.com/photo-1621243804936-775306a8f2e3?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80)",
            }}
        >
            <div className="absolute bg-black opacity-60 inset-0 z-0"></div>
            <div className="sm:max-w-xl w-full p-10 bg-white rounded-xl z-10 m-[1rem] h-[630px]">
                <div className="text-center">
                    <h2 className="mt-1 text-3xl font-bold text-gray-900">Upload Images</h2>
                    {/* <p className="mt-2 text-sm text-gray-400">Lorem ipsum is placeholder text.</p> */}
                </div>
                <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 space-y-2">
                        <label className="text-sm font-bold text-gray-500 tracking-wide">Upload Images</label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col rounded-lg border-4 border-dashed w-full h-60 p-10 group text-center cursor-pointer">
                                <div className="h-full w-full text-center flex flex-col items-center justify-center">
                                    <div className="flex ">
                                        <img
                                            className="h-10 object-center"
                                            src={upload}
                                            alt="Upload Placeholder"
                                        />
                                    </div>
                                    <p className="pointer-none text-gray-500">
                                        <span className="text-sm">Drag and drop</span> files here <br />
                                        or{" "}
                                        <label className="text-blue-600 hover:underline cursor-pointer">
                                            Select a file{" "}
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </label>
                                        from your computer
                                    </p>
                                </div>
                                {/* <input type="file" multiple accept="image/*" onChange={handleFileChange} /> */}

                            </label>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 space-y-2">
                        <label className="text-sm font-bold text-gray-500 tracking-wide">Output File Name</label>
                        <input
                            className="text-base p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                            type="text"
                            placeholder="Enter output file name"
                            value={outputFileName}
                            onChange={(e) => setOutputFileName(e.target.value)}
                        />
                    </div>

                    <div className="text-sm text-gray-500 max-h-32 overflow-y-auto p-2">
                        <div className="text-sm text-gray-500 max-h-32 overflow-y-auto p-2 whitespace-nowrap">
                            {selectedFiles.length > 0 ? (
                                <span className="mt-2">
                                    {selectedFiles.map((file) => file.name).join(" ")}
                                </span>
                            ) : (
                                <span>File type: images</span>
                            )}
                        </div>
                    </div>

                    {error && <p className="text-red-500">{error}</p>}
                    {/* {message && <p className="text-green-500">{message}</p>} */}
                    <div>
                        <button
                            type="submit"
                            className="my-1 w-full flex justify-center bg-blue-500 text-gray-100 p-4 rounded-full tracking-wide font-semibold focus:outline-none focus:shadow-outline hover:bg-blue-600 shadow-lg cursor-pointer transition ease-in duration-300"
                            disabled={loading}
                        >
                            {loading ? "Processing..." : "Submit"}
                        </button>
                    </div>
                </form>
            </div>
            <div className="sm:max-w-xl w-full p-10 bg-white rounded-xl z-10 m-[1rem] h-[630px]">
                
                {csvFileUrl ? (
                    <div className="flex flex-col justify-center item-center">
                        <h2 className="text-2xl text-center font-semibold text-gray-800 mb-4">
                            Your Excel file is ready!
                        </h2>
                        <a
                            href={csvFileUrl}
                            download
                            className="bg-blue-500 cursor-pointer w-[5/12] text-center mx-auto text-white px-6 py-2 rounded-full hover:bg-blue-600 transition"
                        >
                            Download File
                        </a>
                    </div>
                ) : (
                    <DotLottieReact
                        src="https://lottie.host/3cd378cc-73dc-4af0-8b8d-f54aa75f8e7b/e2pqBxQRLa.lottie"
                        loop
                        autoplay
                    />
                )}
            </div>
        </div>
    );
}

export default Hero;
