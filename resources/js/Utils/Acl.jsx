const Acl = ({ user, children, requiredRole }) => {
    const isDisabled = user?.role === "Basic" && requiredRole !== "Basic";

    return (
        <div className={isDisabled ? "pointer-events-none opacity-50 select-none" : ""}>
            {children}
        </div>
    );
};

export default Acl;
