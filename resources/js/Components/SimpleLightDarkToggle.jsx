import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function SimpleLightDarkToggle() {
    const [isDarkMode, setDarkMode] = useState(() => {
        return localStorage.getItem("theme") === "dark" ||
            (!localStorage.getItem("theme") &&
                window.matchMedia("(prefers-color-scheme: dark)").matches);
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [isDarkMode]);

    return (
        <button
            onClick={() => setDarkMode(!isDarkMode)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-none"
        >
            {isDarkMode ? (
                <Moon className="w-5 h-5 text-white" />
            ) : (
                <Sun className="w-5 h-5 text-black" />
            )}
        </button>
    );
}
