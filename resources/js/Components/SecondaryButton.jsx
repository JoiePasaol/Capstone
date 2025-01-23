export default function SecondaryButton({ type = 'button', className = '', disabled = false, children, onClick }) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center justify-center bg-gray-300 border border-gray-400 rounded-md font-semibold text-sm text-gray-700 uppercase tracking-widest hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition ease-in-out duration-150 ${
                disabled ? 'opacity-25 cursor-not-allowed' : ''
            } ${className}`}
        >
            {children}
        </button>
    );
}
