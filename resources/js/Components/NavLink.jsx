import { Link } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { Transition } from '@headlessui/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    dropdownItems = [],
    ...props
}) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const toggleDropdown = (e) => {
        if (dropdownItems.length > 0) {
            e.preventDefault(); 
            setIsDropdownOpen((prev) => !prev);
        }
    };

    const closeDropdown = () => {
        setIsDropdownOpen(false);
    };

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsDropdownOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <Link
                {...props}
                className={
                    'inline-flex h-full items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none ' +
                    (active
                        ? 'border-indigo-400 text-gray-900 focus:border-indigo-700 dark:border-indigo-600 dark:text-gray-100'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 focus:border-gray-300 focus:text-gray-700 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:text-gray-300 dark:focus:border-gray-700 dark:focus:text-gray-300') +
                    className
                }
                onClick={toggleDropdown}
            >
                {children}
            </Link>
            <Transition
                show={isDropdownOpen}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
            >
                <div className="absolute left-0 mt-2 w-48 rounded-md ring-1 ring-black/30 dark:ring-white/30 bg-white dark:bg-gray-700 py-1">
                    {dropdownItems.map((item, index) => (
                        <Link
                            key={index}
                            href={item.href || '#'}
                            onClick={(e) => {
                                e.stopPropagation(); 
                                closeDropdown(); 
                            }}
                            className="block px-4 py-2 text-sm text-gray-700 transition duration-150 ease-in-out hover:bg-gray-200 focus:bg-gray-300 focus:outline-none dark:text-gray-300 dark:hover:bg-gray-800 dark:focus:bg-gray-800"
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </Transition>
        </div>
    );
}
