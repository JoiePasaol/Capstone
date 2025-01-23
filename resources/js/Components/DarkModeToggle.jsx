import { useEffect, useState } from "react";

export default function DarkModeToggle() {
    const [darkMode, setDarkMode] = useState(
        localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [darkMode]);

    useEffect(() => {
        if (!localStorage.getItem("theme")) {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
            setDarkMode(false);
        }
    }, []);

    return (
        <div
            className="fixed bottom-5 right-5 cursor-pointer"
            onClick={() => setDarkMode(!darkMode)}
        >
            <div
                className={`w-20 h-10 flex items-center rounded-full p-1 transition-colors duration-300 relative ${
                    darkMode ? "bg-gray-800 border border-white/20" : "bg-gray-300"
                }`}
            >
                <div
                    className={`absolute transition-transform duration-300 ${
                        darkMode ? "translate-x-10" : "translate-x-0"
                    }`}
                >
                    <div className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center">
                        {darkMode ? (
                            <span className="text-black">🌙</span>
                        ) : (
                            <span className="text-black">☀️</span>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
