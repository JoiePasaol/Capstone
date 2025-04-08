import { Link } from "@inertiajs/react";
import ThemeToggle from "@/Components/ThemeToggle";
// import { motion } from 'framer-motion';
// import { Facebook, Linkedin, Mail } from 'lucide-react';

export default function GuestLayout({ children }) {
    return (
        <div className="relative flex min-h-screen flex-col items-center bg-gray-200 pt-6 sm:justify-center sm:pt-0 dark:bg-gray-900 overflow-hidden">
            <img
                className="guest-bg-image"
                src="/img/bg.jpeg"
                alt="Background"
            />

            {/* <div className="absolute top-[-5px] left-4 flex items-center space-x-4 z-10 dark:opacity-40">
                <img
                    className="h-[120px] w-auto mr-[-20px]"
                    src="/img/MAGALLANES_LOGO.png"
                    alt="Magallanes Logo"
                />
                <img
                    className="h-[100px] w-auto"
                    src="/img/CSUCC_LOGO.png"
                    alt="CSUCC Logo"
                />
                <img
                    className="h-[100px] w-auto"
                    src="/img/CEIT_LOGO.png"
                    alt="CEIT Logo"
                />
            </div> */}

            <div className="relative z-10">
                <Link href="/">
                    <div className="h-12 w-auto lg:h-16 flex items-center justify-center text-5xl lg:text-6xl text-stroke font-extrabold">
                        LGU
                    </div>
                </Link>
            </div>

            <div className="relative z-10 mt-6 w-full overflow-hidden bg-white/1 backdrop-blur-[5px] px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg dark:bg-gray-800/1 dark:backdrop-blur-[5px]">
                {children}
            </div>

            <ThemeToggle />
        </div>
    );
}
