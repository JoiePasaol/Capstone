export default function TrueButton({
    className = '',
    disabled,
    children = 'Accept',
    ...props
  }) {
    return (
      <button
        {...props}
        className={
          `inline-flex mr-2 items-center border border-transparent bg-blue-500 px-4 py-2 text-sm font-medium text-white transition duration-150 ease-in-out hover:bg-blue-600 focus:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 active:bg-blue-700 ${
            disabled && 'opacity-50 cursor-not-allowed'
          } ` + className
        }
        disabled={disabled}
      >
        {children}
      </button>
    );
  }
  