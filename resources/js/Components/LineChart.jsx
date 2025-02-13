import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const salesData = [
  { name: "Jan", Amount: 4000 },
  { name: "Feb", Amount: 3000 },
  { name: "Mar", Amount: 9800 },
  { name: "Apr", Amount: 3908 },
  { name: "May", Amount: 4800 },
  { name: "Jun", Amount: 3800 },
  { name: "Jul", Amount: 3800 },
  { name: "Aug", Amount: 3800 },
  { name: "Sept", Amount: 3800 },
  { name: "Oct", Amount: 3800 },
  { name: "Nov", Amount: 3800 },
  { name: "Dec", Amount: 3800 },
];

const LineChartComponent = () => {
  const [darkMode, setDarkMode] = useState(
    typeof window !== "undefined" &&
      (localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches))
  );

  useEffect(() => {
    const handleThemeChange = () => {
      setDarkMode(document.documentElement.classList.contains("dark"));
    };

    // Listen for class changes on <html>
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={salesData} margin={{ right: 30 }}>
        <CartesianGrid
          stroke={darkMode ? "#ffffff30" : "#8a8a8a"} 
          strokeDasharray="5 5"
        />
        <XAxis dataKey="name" stroke={darkMode ? "#ffffff" : "#000"} />
        
        <YAxis
          domain={[0, 50000]}
          ticks={[0, 10000, 20000, 30000, 40000, 50000]}
          stroke={darkMode ? "#ffffff" : "#000"}
        />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="Amount" stroke={darkMode ? "#0087ff" : "#320063"} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default LineChartComponent;
