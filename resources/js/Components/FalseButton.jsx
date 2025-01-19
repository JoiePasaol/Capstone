export default function FalseButton({
    className = '',
    disabled,
    children = 'Decline',
    ...props
  }) {
    return (
      <button
        {...props}
        className={
          `inline-flex items-center rounded-sm border border-transparent bg-red-500 px-4 py-2 text-sm font-medium text-white transition duration-150 ease-in-out hover:bg-red-600 focus:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 active:bg-red-700 ${
            disabled && 'opacity-50 cursor-not-allowed'
          } ` + className
        }
        disabled={disabled}
      >
        {children}
      </button>
    );
  }
  