import TrueButton from "@/Components/TrueButton";

const SuccessDialog = ({ isOpen, onClose, message }) => {
    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-gray-950 bg-opacity-60 transition-opacity duration-200 ease-in-out ${
                isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
        >
            <div
                className={`bg-white dark:bg-gray-800 p-6 w-[400px] rounded-lg shadow-lg  transition-transform duration-200 ease-in-out transform ${
                    isOpen ? "scale-100" : "scale-95"
                }`}
            >
                <h3 className="text-lg font-semibold text-start text-gray-800 dark:text-gray-200 mb-4">
                    {message}
                </h3>
                <div className="flex justify-end space-x-1">
                    <TrueButton onClick={onClose}>Close</TrueButton>
                </div>
            </div>
        </div>
    );
};

export default SuccessDialog;
