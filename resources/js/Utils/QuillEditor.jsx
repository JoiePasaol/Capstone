import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

export default function QuillEditor({ value, onChange, placeholder = "Enter text..." }) {
    const quillRef = useRef(null);

    useEffect(() => {
        if (!quillRef.current) return;

        const quill = new Quill(quillRef.current, {
            theme: "snow",
            placeholder,
            modules: {
                toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ["bold", "italic", "underline"],
                    [{ list: "ordered" }, { list: "bullet" }],
                ],
            },
        });

        quill.on("text-change", () => {
            onChange(quill.root.innerHTML);
        });

        // Set initial value
        if (value) {
            quill.root.innerHTML = value;
        }

        // Apply Tailwind styles dynamically
        const editor = quill.root;
        editor.classList.add(
            "rounded-sm",
            "border",
            "border-gray-300",
            "shadow-sm",
            "focus:border-indigo-500",
            "focus:ring-indigo-500",
            "dark:border-gray-700",
            "dark:bg-gray-900",
            "dark:text-gray-300",
            "dark:focus:border-indigo-600",
            "dark:focus:ring-indigo-600",
            "p-2"
        );
    }, []);

    return (
        <div className="mt-2"> {/* Apply margin here */}
            <div ref={quillRef} className="block w-full h-40" />
        </div>
    );
}
