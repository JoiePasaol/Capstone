import { Link } from "@inertiajs/react";

const DashboardCard = ({ title, value, icon, bgColor, link }) => {
    return (
        <div className={`relative overflow-hidden h-[160px] w-full ${bgColor} rounded-lg shadow-lg`}>
            <div className="absolute inset-0 opacity-20">{icon}</div>
            <div className="p-5 text-white">
                <div className="text-4xl font-bold">{value}</div>
                <div className="text-lg mt-1">{title}</div>
            </div>
            <Link 
                href={link} 
                className="absolute bottom-0 left-0 w-full bg-white/20 py-2 text-center text-white font-semibold hover:bg-white/30 transition"
            >
                More Info →
            </Link>
        </div>
    );
};

export default DashboardCard;
