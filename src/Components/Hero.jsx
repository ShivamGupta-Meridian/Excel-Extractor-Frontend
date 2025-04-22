import React, { useState, useEffect } from "react";
import upload from '../assets/upload.png';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Dialog } from "@headlessui/react"; // 🔹 Added for modal
import { DndProvider, useDrag, useDrop } from "react-dnd"; // 🔹 Added for drag-and-drop
import { HTML5Backend } from "react-dnd-html5-backend";



function Hero() {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL;
    // console.log("Base URL: " + BASE_URL);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [outputFileName, setOutputFileName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [csvFileUrl, setCsvFileUrl] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false); // 🔹 New state for modal
    const [monthlyCount, setMonthlyCount] = useState(0); // ✅ Just initialize with 0
    const [downloadHistory, setDownloadHistory] = useState([]);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false); // Modal for download history
    const token = sessionStorage.getItem("token");
    
    // const [monthlyCount, setMonthlyCount] = useState(0); // New state for monthly image count
    // const [monthlyCount, setMonthlyCount] = useState(() => {
    //     // 🔹 Load stored count from localStorage (if available)
    //     return localStorage.getItem("monthlyCount") 
    //         ? parseInt(localStorage.getItem("monthlyCount"), 10) 
    //         : 0;
    // });
    
    // useEffect(() => {
    //     // 🔹 Update localStorage whenever monthlyCount changes
    //     localStorage.setItem("monthlyCount", monthlyCount);
    // }, [monthlyCount]);

    useEffect(() => {
        
        if (!token) return;

        fetchMonthlyCount();
        fetchDownloadHistory();
    }, []);

    const fetchMonthlyCount = async () => {
        try {
            const response = await fetch(`${BASE_URL}/get_monthly_count`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error("Failed to fetch monthly count");

            const data = await response.json();
            setMonthlyCount(data.monthly_api_count);
        } catch (error) {
            // console.error("Error fetching monthly count:", error);
        }
    };

    const fetchDownloadHistory = async () => {
        try {
            const response = await fetch(`${BASE_URL}/download_history/`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error("Failed to fetch download history");

            const data = await response.json();
            setDownloadHistory(data.download_history);
        } catch (error) {
            // console.error("Error fetching download history:", error);
        }
    };


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
            // console.log("FIle:", selectedFiles[i]);
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
            // const response = await fetch("https://excelextractor-duh8e4ehhddxd0ar.eastus-01.azurewebsites.net/extract_merge_tables/", {
            const response = await fetch(`${BASE_URL}/extract_merge_tables/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`, // Send token
                },
                body: formData, // Send FormData
            });
            // console.log("Response: " + response)
            const data = await response.json();
            // console.log("data: " + data)
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

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const saveDownloadHistory = async (status) => {
        const token = sessionStorage.getItem("token");
        if (!token) return;
    
        try {
            const formData = new FormData();
            formData.append("file_name", outputFileName || "output.xlsx");
            formData.append("file_url", csvFileUrl);
            formData.append("status", status);
    
            const response = await fetch(`${BASE_URL}/save_download_history`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            // ✅ Refresh the history after saving
            fetchDownloadHistory();
    
            if (!response.ok) {
                // console.error("Failed to save download history");
            } else {
                // console.log("Download history saved:", status);
            }
        } catch (error) {
            // console.error("Error saving download history:", error);
        }
    };


    const markAsDownloaded = async (fileName) => {
        try {
          const formData = new FormData();
          formData.append("file_name", fileName);
          const response = await fetch(`${BASE_URL}/update_download_status`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });
        //   console.log("Response: " + response)
      
          if (!response.ok) {
            // console.error("Failed to update download status");
          } else {
            // console.log("Status updated to downloaded");
            fetchDownloadHistory(); // Refresh UI
          }
        } catch (error) {
        //   console.error("Error updating download status:", error);
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
        
        fetchDownloadHistory();
    };

    const closeHistoryModal = () => {
        setIsHistoryModalOpen(false);
    };

    const openHistoryModal = () => {
        setIsHistoryModalOpen(true);
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

                    {/* Add a button to open Download History */}
                    <button
                        onClick={openHistoryModal}
                        className="absolute top-4 right-4 flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-5 py-2.5 rounded-full shadow-lg hover:from-blue-600 hover:to-indigo-600 transition duration-200 ease-in-out"
                    >
                        <svg
                            xmlns="https://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v8m0 0l3-3m-3 3l-3-3M12 4v4m0 0l-3-3m3 3l3-3"
                            />
                        </svg>
                        View History
                    </button>

                
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
                                onClick={() => {
                                    saveDownloadHistory("downloaded");
                                    setTimeout(() => {
                                        resetForm(); // wait a tiny bit
                                    }, 500);
                                }}
                                className="bg-blue-500 cursor-pointer w-[5/12] text-center mx-auto text-white px-6 py-2 rounded-full hover:bg-blue-600 transition"
                            >
                                Download File
                            </a>
                            {/* 🔹 Restart Button to Go Back to Form */}
                            <button
                                onClick={() => {
                                    saveDownloadHistory("not_downloaded");
                                    resetForm();
                                }}
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

                {/* 🔹 Modal for Viewing Download History */}
                <Dialog open={isHistoryModalOpen} onClose={closeHistoryModal} className="relative z-50">
                    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
                        <Dialog.Panel className="bg-white p-6 rounded-lg max-w-md w-full max-h-[70vh] overflow-y-auto shadow-lg">
                            <Dialog.Title className="text-lg font-bold mb-4 text-center">
                                Download History
                            </Dialog.Title>
                            <div>
                                {downloadHistory.length > 0 ? (
                                    <table className="min-w-full table-auto text-sm">
                                        <thead>
                                            <tr>
                                                <th className="py-2 px-4 text-left break-words">File Name</th>
                                                <th className="py-2 px-4 text-left break-words">Date</th>
                                                <th className="py-2 px-4 text-left break-words">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {downloadHistory.map((entry, index) => (
                                                <tr key={index} className="border-t">
                                                    {/* <td className="py-2 px-4 break-words">{entry.file_name}</td> */}
                                                    <td className="py-2 px-4 break-words">
                                                        <a
                                                          href={entry.file_url}
                                                          rel="noopener noreferrer"
                                                          onClick={() => {
                                                            if (entry.download_status === "not_downloaded") {
                                                              markAsDownloaded(entry.file_name);  // 👈 Call backend to update status
                                                              fetchDownloadHistory(); // Refresh UI
                                                            }
                                                          }}
                                                          className="text-blue-600 hover:underline"
                                                        >
                                                          {entry.file_name}
                                                        </a>
                                                   </td>
                                                    <td className="py-2 px-4 break-words">
                                                        {new Date(entry.created_at).toLocaleString()}
                                                    </td>
                                                    {/* <td className="py-2 px-4 break-words">{entry.download_status}</td> */}
                                                    <td className="py-2 px-4 text-center align-middle">
                                                        <span
                                                          className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                                                            entry.download_status === "downloaded"
                                                              ? "bg-green-100 text-green-800"
                                                              : "bg-red-100 text-red-800"
                                                          }`}
                                                        >
                                                          {entry.download_status === "downloaded" ? "Downloaded" : "Not Downloaded"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="text-center text-gray-500">No download history available</p>
                                )}
                            </div>
                            <div className="mt-6 flex justify-center">
                                <button
                                    onClick={closeHistoryModal}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-200"
                                >
                                    Close
                                </button>
                            </div>
                        </Dialog.Panel>
                    </div>
                </Dialog>

                
            </div>
        </DndProvider>
    );
}
export default Hero;
