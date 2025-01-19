import TrueButton from "@/Components/TrueButton";
import FalseButton from "@/Components/FalseButton";

const ConfirmationDialog = ({ isOpen, onConfirm, onCancel, title }) => {
    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-gray-950 bg-opacity-60 transition-opacity duration-200 ease-in-out ${
                isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
        >
            <div
                className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg transition-transform duration-200 ease-in-out transform ${
                    isOpen ? "scale-100" : "scale-95"
                }`}
            >
                <h3 className="text-xl font-semibold text-center text-gray-800 dark:text-gray-200 mb-4">
                    {title}
                </h3>
                <div className="flex justify-end space-x-1">
                    <TrueButton
                        onClick={() => {
                            onCancel();
                        }}
                    >
                        No
                    </TrueButton>
                    <FalseButton
                        onClick={() => {
                            onConfirm();
                        }}
                    >
                        Yes
                    </FalseButton>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationDialog;
