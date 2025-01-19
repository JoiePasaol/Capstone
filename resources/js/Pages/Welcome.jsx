import { Head, Link } from "@inertiajs/react";
import "../../css/custom.css";

export default function Welcome({ auth, laravelVersion, phpVersion }) {
    const handleImageError = () => {
        document
            .getElementById("screenshot-container")
            ?.classList.add("!hidden");
        document.getElementById("docs-card")?.classList.add("!row-span-1");
        document
            .getElementById("docs-card-content")
            ?.classList.add("!flex-row");
        document.getElementById("background")?.classList.add("!hidden");
    };

    return (
        <>
            <Head title="Welcome" />
            <div className="bg-[#111827]  dark:text-white/50">
                <div className="relative flex min-h-screen flex-col items-center justify-center selection:bg-[#FF2D20] selection:text-white">
                    <div className="relative w-full max-w-2xl px-6 lg:max-w-7xl">
                        <header className="grid grid-cols-2 items-center gap-2 py-10 lg:grid-cols-2">
                            <div className="flex lg:col-start-1 lg:justify-start">
                                <div className="h-12 w-auto lg:h-16 flex items-center justify-center text-5xl lg:text-7xl text-stroke font-extrabold">
                                    IIS
                                </div>
                            </div>
                            <nav className="-mx-3 flex flex-1 justify-end">
                                {auth.user ? (
                                    <Link
                                        href={route("dashboard")}
                                        className="rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route("login")}
                                            className="rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white"
                                        >
                                            Log in
                                        </Link>
                                        <Link
                                            href={route("register")}
                                            className="rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white"
                                        >
                                            Register
                                        </Link>
                                    </>
                                )}
                            </nav>
                        </header>

                        <main className="mt-6">
                            <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
                                <div
                                    id="docs-card"
                                    className="rounded-lg p-6 shadow-[0px_14px_34px_0px_rgba(0,0,0,0.08)] ring-2 transition duration-300 hover:text-black/70 md:row-span-3 lg:p-10 lg:pb-10 bg-[#1f2937] dark:ring-white/15 dark:hover:text-white/80 dark:hover:ring-white/30 "
                                >
                                    <div
                                        id="docs-card-content"
                                        className="flex items-start gap-6 lg:flex-col flex-col"
                                    >
                                        <img
                                            className="border border-white/30 h-[400px] lg:h-[400px] sm:h-[300px] w-full lg:w-auto"
                                            src="/img/dashboard.png"
                                            alt=""
                                        />

                                        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#0011ff]/10 sm:size-16">
                                            <svg
                                                className="size-5 sm:size-6"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    fill="#0011ff"
                                                    d="M23 4a1 1 0 0 0-1.447-.894L12.224 7.77a.5.5 0 0 1-.448 0L2.447 3.106A1 1 0 0 0 1 4v13.382a1.99 1.99 0 0 0 1.105 1.79l9.448 4.728c.14.065.293.1.447.1.154-.005.306-.04.447-.105l9.453-4.724a1.99 1.99 0 0 0 1.1-1.789V4ZM3 6.023a.25.25 0 0 1 .362-.223l7.5 3.75a.251.251 0 0 1 .138.223v11.2a.25.25 0 0 1-.362.224l-7.5-3.75a.25.25 0 0 1-.138-.22V6.023Zm18 11.2a.25.25 0 0 1-.138.224l-7.5 3.75a.249.249 0 0 1-.329-.099.249.249 0 0 1-.033-.12V9.772a.251.251 0 0 1 .138-.224l7.5-3.75a.25.25 0 0 1 .362.224v11.2Z"
                                                />
                                                <path
                                                    fill="#0011ff"
                                                    d="m3.55 1.893 8 4.048a1.008 1.008 0 0 0 .9 0l8-4.048a1 1 0 0 0-.9-1.785l-7.322 3.706a.506.506 0 0 1-.452 0L4.454.108a1 1 0 0 0-.9 1.785H3.55Z"
                                                />
                                            </svg>
                                        </div>

                                        <div>
                                            <h2 className="text-lg sm:text-xl font-semibold text-black dark:text-white">
                                                Documentation
                                            </h2>

                                            <p className="mt-4 text-sm sm:text-base">
                                                (IIS) Item Inventory System.
                                                This system is designed to store
                                                data, monitor inventory levels,
                                                and generate detailed reports
                                                specifically for commission
                                                auditing purposes.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <a
                                    href=""
                                    className="flex items-center gap-4 rounded-lg  p-6 shadow-[0px_14px_34px_0px_rgba(0,0,0,0.08)] ring-2 transition duration-300 hover:text-black/70 hover:ring-black/20 focus:outline-none focus-visible:ring-[#FF2D20] lg:pb-10  bg-[#1f2937] dark:ring-white/15 dark:hover:text-white/80 dark:hover:ring-white/30 "
                                >
                                    <img
                                        src="/img/Joie.png"
                                        alt="Profile"
                                        className="w-40 h-40 rounded-full object-cover"
                                    />
                                    <div>
                                        <h2 className="text-xl font-semibold text-black dark:text-white ">
                                            Joie Pasaol - Developer
                                        </h2>
                                        <div className="relative w-20 h-[4px] bg-[#0011ff] mb-3 mt-3">
                                            <div className="absolute  top-[-4px] w-3 h-3 bg-[#0011ff] transform rotate-45 origin-center"></div>
                                        </div>

                                        <p className="text-sm leading-relaxed">
                                            Lorem Ipsum is simply dummy text of
                                            the printing and typesetting
                                            industry. Lorem Ipsum has been the
                                            industry's standard dummy text ever
                                            since the 1500s.
                                        </p>
                                    </div>
                                    <svg
                                        className="size-6 shrink-0 self-center stroke-[#0011ff]"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth="1.5"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
                                        />
                                    </svg>
                                </a>

                                <a
                                    href=""
                                    className="flex items-center gap-4 rounded-lg  p-6 shadow-[0px_14px_34px_0px_rgba(0,0,0,0.08)] ring-2 transition duration-300 hover:text-black/70 hover:ring-black/20 focus:outline-none focus-visible:ring-[#FF2D20] lg:pb-10  bg-[#1f2937] dark:ring-white/15 dark:hover:text-white/80 dark:hover:ring-white/30 "
                                >
                                    <img
                                        src="/img/Jasper.png"
                                        alt="Profile"
                                        className="w-40 h-40 rounded-full object-cover"
                                    />
                                    <div>
                                        <h2 className="text-xl font-semibold text-black dark:text-white ">
                                            Jasper Cabodbod - Developer
                                        </h2>
                                        <div className="relative w-20 h-[4px] bg-[#0011ff] mb-3 mt-3">
                                            <div className="absolute  top-[-4px] w-3 h-3 bg-[#0011ff] transform rotate-45 origin-center"></div>
                                        </div>
                                        <p className="text-sm leading-relaxed">
                                            Lorem Ipsum is simply dummy text of
                                            the printing and typesetting
                                            industry. Lorem Ipsum has been the
                                            industry's standard dummy text ever
                                            since the 1500s.
                                        </p>
                                    </div>
                                    <svg
                                        className="size-6 shrink-0 self-center stroke-[#0011ff]"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth="1.5"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
                                        />
                                    </svg>
                                </a>

                                <a
                                    href=""
                                    className="flex items-center gap-4 rounded-lg  p-6 shadow-[0px_14px_34px_0px_rgba(0,0,0,0.08)] ring-2 transition duration-300 hover:text-black/70 hover:ring-black/20 focus:outline-none focus-visible:ring-[#FF2D20] lg:pb-10  bg-[#1f2937] dark:ring-white/15 dark:hover:text-white/80 dark:hover:ring-white/30 "
                                >
                                    <img
                                        src="/img/Denzel.png"
                                        alt="Profile"
                                        className="w-40 h-40 rounded-full object-cover"
                                    />
                                    <div>
                                        <h2 className="text-xl font-semibold text-black dark:text-white ">
                                            Denzel Ivan Roi Dupa - Developer
                                        </h2>
                                        <div className="relative w-20 h-[4px] bg-[#0011ff] mb-3 mt-3">
                                            <div className="absolute  top-[-4px] w-3 h-3 bg-[#0011ff] transform rotate-45 origin-center"></div>
                                        </div>
                                        <p className="text-sm leading-relaxed">
                                            Lorem Ipsum is simply dummy text of
                                            the printing and typesetting
                                            industry. Lorem Ipsum has been the
                                            industry's standard dummy text ever
                                            since the 1500s.
                                        </p>
                                    </div>
                                    <svg
                                        className="size-6 shrink-0 self-center stroke-[#0011ff]"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth="1.5"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
                                        />
                                    </svg>
                                </a>
                            </div>
                        </main>

                        <footer className="py-16 text-center text-sm text-black dark:text-white/70"></footer>
                    </div>
                </div>
            </div>
        </>
    );
}
