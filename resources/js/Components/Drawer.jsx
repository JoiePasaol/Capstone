import * as React from "react";
import MuiDrawer from "@mui/material/Drawer";
import CloseIcon from "@mui/icons-material/Close";

const Drawer = ({
    isDrawerOpen,
    toggleDrawer,
    title = "Drawer Title",
    children,

}) => {
    return (
  
            <MuiDrawer
                open={isDrawerOpen}
                onClose={() => toggleDrawer(false)}
                anchor="right"
              
            >
                <div className="w-[350px] h-full dark:bg-gray-800 overflow-x-hidden">
                <div className="h-[65px] w-full px-4 border-b-2 border-b-gray-400 dark:text-white/70 text-xl flex items-center justify-between">
                    {title}
                    <CloseIcon
                        onClick={() => toggleDrawer(false)}
                        className="cursor-pointer"
                    />
                </div>
                <div className="p-4">{children}</div>
                </div>
              
            </MuiDrawer>

    );
};

export default Drawer;
