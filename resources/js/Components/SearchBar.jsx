import { useState } from 'react';

const SearchBar = ({ className = '', onChange, ...props }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (onChange) {
            onChange(value); 
        }
    };

    return (
        <input
            {...props}
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search..."
            className={
                'border-white bg-transparent rounded-md px-4 py-1 focus:outline-none focus:ring-none focus:border-white ' +
                className
            }
        />
    );
};

export default SearchBar;
