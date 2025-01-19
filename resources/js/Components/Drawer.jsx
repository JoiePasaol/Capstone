import * as React from "react";
import MuiDrawer from "@mui/material/Drawer";
import CloseIcon from "@mui/icons-material/Close";

const Drawer = ({
    isDrawerOpen,
    toggleDrawer,
    title = "Drawer Title",
    children,
    drawerWidth = "350px",
    drawerStyles = {},
}) => {
    return (
        <MuiDrawer
            open={isDrawerOpen}
            onClose={() => toggleDrawer(false)}
            anchor="right"
            sx={{
                ".MuiDrawer-paper": {
                    backgroundColor: "#1f2937",
                    borderLeft: "1px solid #364152",
                    boxShadow: "none",
                    width: drawerWidth,
                    color: "#333",
                    zIndex: 1300,
                    ...drawerStyles,
                },
            }}
        >
            <div className="h-[65px] w-full px-4 border-b-2 border-b-gray-600 text-white/70 text-xl flex items-center justify-between">
                {title}
                <CloseIcon
                    onClick={() => toggleDrawer(false)}
                    className="cursor-pointer"
                />
            </div>
            <div className="p-4">{children}</div>
        </MuiDrawer>
    );
};

export default Drawer;
