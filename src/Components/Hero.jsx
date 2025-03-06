import React, { useState, useEffect } from "react";
import upload from '../assets/upload.png';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Dialog } from "@headlessui/react"; // 🔹 Added for modal
import { DndProvider, useDrag, useDrop } from "react-dnd"; // 🔹 Added for drag-and-drop
import { HTML5Backend } from "react-dnd-html5-backend";


const FileItem = ({ file, index, moveFile }) => {
    const [, ref] = useDrag({
        type: "FILE",
        item: { index },
    });

    const [, drop] = useDrop({
        accept: "FILE",
        hover: (draggedItem) => {
            if (draggedItem.index !== index) {
                moveFile(draggedItem.index, index);
                draggedItem.index = index;
            }
        },
    });

    return (
        <span ref={(node) => ref(drop(node))} className="bg-gray-200 px-2 py-1 rounded-md cursor-move">
            {file.name}
        </span>
    );
};


function Hero() {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [outputFileName, setOutputFileName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [csvFileUrl, setCsvFileUrl] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false); // 🔹 New state for modal
    
    // const [monthlyCount, setMonthlyCount] = useState(0); // New state for monthly image count
    const [monthlyCount, setMonthlyCount] = useState(() => {
        // 🔹 Load stored count from localStorage (if available)
        return localStorage.getItem("monthlyCount") 
            ? parseInt(localStorage.getItem("monthlyCount"), 10) 
            : 0;
    });
    
    useEffect(() => {
        // 🔹 Update localStorage whenever monthlyCount changes
        localStorage.setItem("monthlyCount", monthlyCount);
    }, [monthlyCount]);

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        handleFileValidation(files);
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
            // const response = await fetch("http://localhost:8000/extract_merge_tables/", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`, // Send token
                },
                body: formData, // Send FormData
            });
            console.log("Response: " + response)
            const data = await response.json();
            console.log("data: " + data)
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    setError("Session expired. Redirecting to login...");
                    setTimeout(() => navigate("/login"), 1500); // 🔹 Redirect to login
                    return;
                }
                throw new Error(data.detail || "Upload failed");
            }
            setMessage("Tables extracted and merged successfully!");
            // console.log("Merged Excel URL:", data.merged_excel_url);
            setCsvFileUrl(data.merged_excel_url); // Update the state with the CSV file URL
            setMonthlyCount(data.monthly_api_count); // 🔹 Update Monthly Image Count**
            localStorage.setItem("monthlyCount", data.monthly_api_count); // 🔹 Persist it

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileValidation = (files) => {
        // Allowed MIME types
        const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    
        // Allowed file extensions (for HEIC support)
        const allowedExtensions = ["png", "jpg", "jpeg", "heic", "heif"];
    
        const imageFiles = files.filter((file) => {
            const fileType = file.type.toLowerCase();
            const fileExt = file.name.split('.').pop().toLowerCase();
    
            return allowedTypes.includes(fileType) || allowedExtensions.includes(fileExt);
        });
    
        if (imageFiles.length === 0) {
            alert("Only image files (PNG, JPG, JPEG, HEIC) are allowed.");
            return;
        }
    
        // Append new files to the selected files list
        setSelectedFiles((prevFiles) => [...prevFiles, ...imageFiles]);
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        event.stopPropagation();
    };
    
    const handleDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();
    
        // Get files from the drop event
        const files = Array.from(event.dataTransfer.files);
        handleFileValidation(files);
    };

    const moveFile = (fromIndex, toIndex) => { // 🔹 Function to move files in list
        const updatedFiles = [...selectedFiles];
        const [movedFile] = updatedFiles.splice(fromIndex, 1);
        updatedFiles.splice(toIndex, 0, movedFile);
        setSelectedFiles(updatedFiles);
    };

    const resetForm = () => {
        setCsvFileUrl(null);
        setError(null);
        setLoading(false);
        setSelectedFiles([]);  // Clear uploaded files if needed
        setOutputFileName(""); // Clear output file name
    };

    return (
        <DndProvider backend={HTML5Backend}> {/* 🔹 Wrapped with DndProvider */}
            <div
                className="relative min-h-screen flex items-center justify-center px-[3rem] bg-gray-500 bg-no-repeat bg-cover"
                style={{
                    backgroundImage:
                        "url(https://images.unsplash.com/photo-1621243804936-775306a8f2e3?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80)",
                }}
            >
                <div className="absolute bg-black opacity-60 inset-0 z-0"></div>
                <div className="sm:max-w-xl w-full p-10 bg-white rounded-xl z-10 m-[1rem]  flex flex-col justify-between">

                    {/* Monthly Image Count Display */}
                    <div className="text-center mb-4">
                        <h2 className="text-m font-semibold text-gray-700">
                            Monthly Image Count: <span className="text-blue-500">{monthlyCount}</span>
                        </h2>
                    </div>

                    

                    {/* 🔹 Conditional Rendering: Show Upload Form / Loading Animation / Download Section */}
                    {csvFileUrl ? (
                        // 🔹 Excel Download Section
                        <div className="flex flex-col justify-center items-center">
                            <div className="text-center">
                                <h2 className="m-2 text-3xl font-bold text-gray-900">Excel Extractor</h2>
                            </div>
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
                            {/* 🔹 Restart Button to Go Back to Form */}
                            <button
                                onClick={resetForm}
                                className="mt-4 bg-gray-500 cursor-pointer w-[5/12] text-center mx-auto text-white px-6 py-2 rounded-full hover:bg-gray-600 transition"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : loading || error ? (
                        // 🔹 SVG Animation While Processing (🔥 Restored!)
                        <div>
                            <div className="text-center">
                                <h2 className="mt-1 text-3xl font-bold text-gray-900">Excel Extractor</h2>
                            </div>
                            {!error ? (
                                <div>
                                    <DotLottieReact
                                        src="https://lottie.host/3cd378cc-73dc-4af0-8b8d-f54aa75f8e7b/e2pqBxQRLa.lottie"
                                        loop
                                        autoplay
                                        style={{ width: "100%", height: "100%" }}
                                    />
                                    <div>
                                        <button
                                            type="submit"
                                            className="my-1 w-full flex justify-center bg-blue-500 text-gray-100 p-4 rounded-full tracking-wide font-semibold focus:outline-none focus:shadow-outline hover:bg-blue-600 shadow-lg cursor-pointer transition ease-in duration-300"
                                            disabled={loading}
                                        >
                                            {loading ? "Processing..." : "Submit"}
                                        </button>
                                    </div>
                                 </div>
                             ) : (
                                 // 🔹 Show Error Message Instead of SVG
                                 <p className="text-red-500 text-center text-lg font-semibold m-2">{error}</p>
                             )}
                            {/* 🔹 Restart Button (Shown when error occurs) */}
                            {error && (
                                <button
                                    onClick={resetForm}
                                    className="mt-4 bg-gray-500 cursor-pointer w-[5/12] text-center mx-auto text-white px-6 py-2 rounded-full hover:bg-gray-600 transition"
                                >
                                    Try Again
                                </button>
                            )}
                        </div>
                    ) : (
                        <div>
                            <div className="text-center">
                                <h2 className="mt-1 text-3xl font-bold text-gray-900">Upload Images</h2>
                            </div>
                            {/* // 🔹 File Upload Form (Appears Initially) */}
                            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 space-y-2">
                                    <label className="text-sm font-bold text-gray-500 tracking-wide">Upload Images</label>
                                    <div className="flex items-center justify-center w-full" onDragOver={handleDragOver} onDrop={handleDrop}>
                                        <label className="flex flex-col rounded-lg border-4 border-dashed w-full h-60 p-10 group text-center cursor-pointer" onDragOver={handleDragOver} onDrop={handleDrop}>
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
                                                        Select a file(s){" "}
                                                        <input
                                                            type="file"
                                                            multiple
                                                            accept="image/*"
                                                            onChange={handleFileChange}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                    from your system
                                                </p>
                                                <p className="mt-2 text-gray-500 text-xs">
                                                    Supported formats: PNG, JPG, JPEG, HEIC
                                                </p>
                                            </div>
                                            {/* <input type="file" multiple accept="image/*" onChange={handleFileChange} /> */}
                                        </label>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500 py-1.5 max-h-24 overflow-auto">
                                    <div className="text-sm text-gray-500 p-2 flex flex-wrap gap-2">
                                        {selectedFiles.length > 0 ? (
                                            <>
                                                <strong>Uploaded Images:</strong>
                                                <div className="flex flex-wrap gap-2 truncate max-w-full">
                                                    {selectedFiles.slice(0, 3).map((file, index) => (
                                                        <FileItem key={index} index={index} file={file} moveFile={moveFile} />
                                                    ))}
                                                    {selectedFiles.length > 3 && (
                                                        <span className="text-blue-500 cursor-pointer"
                                                            onClick={() => setIsModalOpen(true)}>
                                                            +{selectedFiles.length - 3} more...
                                                        </span>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <span>File type: Images</span>
                                        )}
                                    </div>
                                </div>
                                    
                                <div className="grid grid-cols-1 space-y-2 mb-3">
                                    <label className="text-sm font-bold text-gray-500 tracking-wide">Output File Name</label>
                                    <input
                                        className="text-base p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                        type="text"
                                        placeholder="Enter output file name"
                                        value={outputFileName}
                                        onChange={(e) => setOutputFileName(e.target.value)}
                                    />
                                </div>
                                    
                                    
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
                    )}
                </div>

                {/* 🔹 Modal for viewing all filenames */}
                <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
                    <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
                        <Dialog.Panel className="bg-white p-6 rounded-lg max-w-sm">
                            <Dialog.Title className="text-lg font-bold mb-4">Uploaded Files</Dialog.Title>
                            <div className="flex flex-wrap gap-2">
                                {selectedFiles.map((file, index) => (
                                    <FileItem key={index} index={index} file={file} moveFile={moveFile} />
                                ))}
                            </div>
                            <button onClick={() => setIsModalOpen(false)}
                                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md">
                                Close
                            </button>
                        </Dialog.Panel>
                    </div>
                </Dialog>

                
            </div>
        </DndProvider>
    );
}
export default Hero;
